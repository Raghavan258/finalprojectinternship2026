"""
main.py — FastAPI Application Entry Point
==========================================
This is the heart of our Python AI service. It sets up:
  1. A FastAPI app with CORS enabled (so React can talk to it).
  2. A /chat endpoint that receives user messages and returns AI responses.
  3. OpenRouter (OpenAI-compatible) chat completions with conversation history.
  4. Function Calling — the model can invoke our tools to query real data.

Architecture (with Function Calling):
  User ──▶ FastAPI ──▶ OpenRouter ──▶ "call search_events(...)" ──▶ Our Code
                       OpenRouter ◀── function results ◀──────────┘
  User ◀── FastAPI ◀── OpenRouter (summarizes results in natural language)

NOTE: Start this service using run.py, not directly:
  python run.py
run.py sets PYTHONUTF8=1 before spawning uvicorn workers, so every worker
process inherits UTF-8 encoding and emoji in print() calls never crash.
"""

import json
import sys
import os
from contextlib import asynccontextmanager

# -- Belt-and-suspenders: reconfigure stdout in THIS process/worker too.
# run.py sets PYTHONUTF8=1 env var so child processes inherit it, but we
# also reconfigure here in case the service is started directly.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Import our modules ──────────────────────────────────────────
from config import client, OPENROUTER_MODEL, FRONTEND_URL
from prompts import EMS_SYSTEM_INSTRUCTION
from tools import TOOL_FUNCTIONS, OPENAI_TOOLS_SCHEMA


# ================================================================
# LIFESPAN — runs once per worker process at startup
# ================================================================
# Using asynccontextmanager lifespan is the modern FastAPI pattern
# (replaces deprecated @app.on_event("startup")).

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Worker startup: ensure UTF-8 streams in every uvicorn worker."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass
    print("[INFO] AI service worker started (UTF-8 stdout active)", flush=True)
    yield
    # Nothing to clean up on shutdown


# ================================================================
# 📦 REQUEST / RESPONSE MODELS
# ================================================================
# Pydantic models validate incoming JSON automatically.
# If someone sends a request without a "message" field,
# FastAPI returns a clear 422 error — no manual validation needed.

class ChatRequest(BaseModel):
    """What the frontend sends to us."""
    message: str                    # The user's message text
    user_role: str = "participant"  # Optional: the user's platform role


class ChatResponse(BaseModel):
    """What we send back to the frontend."""
    reply: str  # The AI's response text


# ================================================================
# 🚀 FASTAPI APP INITIALIZATION
# ================================================================

app = FastAPI(
    title="EMS AI Assistant Service",
    description="AI-powered assistant for the EventHub Event Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ─────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) is a browser security feature.
# Our React app runs on localhost:5173, but this API runs on localhost:8000.
# Without CORS, the browser BLOCKS requests between different origins.
# This middleware tells the browser: "It's okay, let React talk to me."

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,       # React dev server
        "http://localhost:3000",  # Alternative React port
    ],
    allow_credentials=True,
    allow_methods=["*"],    # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],    # Allow all headers
)


# ================================================================
# 💬 CHAT SESSION MANAGEMENT
# ================================================================
# OpenRouter/OpenAI uses a stateless API — we must send the full
# conversation history with every request. We store the message
# list in memory (dict keyed by session_id).
#
# Each entry in the list is a dict: {"role": "...", "content": "..."}
# Roles: "system", "user", "assistant", "tool"

chat_sessions: dict[str, list[dict]] = {}


def get_or_create_chat(session_id: str) -> list[dict]:
    """
    Get an existing conversation history or create a new one.

    Unlike Gemini's stateful Chat object, the OpenAI/OpenRouter API
    is stateless — we must manage the message history ourselves.
    The system instruction is always the first message.

    Args:
        session_id: A unique identifier for this conversation.

    Returns:
        A list of message dicts representing the conversation history.
    """
    if session_id not in chat_sessions:
        chat_sessions[session_id] = [
            {"role": "system", "content": EMS_SYSTEM_INSTRUCTION}
        ]
    return chat_sessions[session_id]


# ================================================================
# 📡 API ENDPOINTS
# ================================================================

@app.get("/")
async def root():
    """Health check endpoint. Useful for monitoring and debugging."""
    return {
        "service": "EMS AI Assistant",
        "status": "running",
        "model": OPENROUTER_MODEL,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint — WITH FUNCTION CALLING via OpenRouter.

    The flow is a LOOP (same concept as before, different API):

      1. Send conversation history to OpenRouter
      2. Check the response:
         a. If the model returns TEXT → we're done, send it to the user
         b. If the model returns TOOL CALLS → execute them, append
            results to history, then go back to step 1
      3. Repeat until the model gives us a text response

    Why a loop? The model might need to call MULTIPLE functions in
    sequence. For example:
      - First call search_events(category="hackathon", location="Mumbai")
      - Then call get_event_details(event_id="evt_001") for more info
      - Finally, summarize everything in natural language
    """
    try:
        session_id = "default_session"
        messages = get_or_create_chat(session_id)

        # Prepend the user's role for context-aware responses
        contextualized_message = (
            f"[User Role: {request.user_role.capitalize()}]\n"
            f"{request.message}"
        )

        # Add the user's message to history
        messages.append({"role": "user", "content": contextualized_message})

        # ── THE FUNCTION-CALLING LOOP ───────────────────────────
        # Keep looping as long as the model wants to call functions.
        # Safety cap at 10 iterations to prevent infinite loops.
        max_iterations = 10
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            # Call OpenRouter (OpenAI-compatible endpoint)
            response = client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=messages,
                tools=OPENAI_TOOLS_SCHEMA,
                tool_choice="auto",  # Let the model decide when to use tools
                temperature=0.7,
                max_tokens=4096,     # Cap output tokens (free tier has credit limits)
            )

            choice = response.choices[0]
            assistant_message = choice.message

            # Add the assistant's response to history
            # (whether it's text or tool calls, we need to track it)
            messages.append(assistant_message.model_dump())

            # If no tool calls, the model is done — break!
            if not assistant_message.tool_calls:
                break

            # ── Execute each tool call ──────────────────────────
            # The model told us WHAT to call and WITH WHAT arguments.
            # We execute it and collect the results.
            for tool_call in assistant_message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                print(f"[TOOL] Model requested: {func_name}({func_args})", flush=True)

                # Look up the function in our registry
                if func_name in TOOL_FUNCTIONS:
                    result = TOOL_FUNCTIONS[func_name](**func_args)
                    print(f"[OK]   Result: {json.dumps(result, indent=2, ensure_ascii=False)[:200]}...", flush=True)
                else:
                    result = {"error": f"Unknown function: {func_name}"}
                    print(f"[ERR]  Unknown function: {func_name}", flush=True)

                # Add the tool result to the conversation history
                # OpenAI format requires tool_call_id to match the request
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                })

        # ── Extract the final text response ─────────────────────
        # After the loop, the last assistant message should be text.
        reply_text = (
            assistant_message.content
            or "I processed your request but couldn't generate a response."
        )

        return ChatResponse(reply=reply_text)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI service error: {str(e)}"
        )


@app.post("/chat/reset")
async def reset_chat():
    """
    Reset the conversation — clears history and starts fresh.
    Useful when the user wants to start a new topic.
    """
    chat_sessions.clear()
    return {"status": "Chat session reset successfully"}


# ================================================================
# 🏃 RUN THE SERVER
# ================================================================
# This block only runs when you execute: python main.py
# In production, you'd use: uvicorn main:app --host 0.0.0.0 --port 8000

if __name__ == "__main__":
    # Prefer running via: python run.py
    # run.py sets PYTHONUTF8=1 BEFORE spawning uvicorn workers so all
    # subprocesses inherit UTF-8 encoding (prevents emoji encoding crashes).
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-restart on code changes (dev only!)
    )
