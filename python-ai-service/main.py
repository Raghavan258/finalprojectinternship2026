"""
main.py — FastAPI Application Entry Point
==========================================
This is the heart of our Python AI service. It sets up:
  1. A FastAPI app with CORS enabled (so React can talk to it).
  2. A /chat endpoint that receives user messages and returns AI responses.
  3. OpenRouter (OpenAI-compatible) chat completions with conversation history.
  4. Function Calling — the model can invoke our tools to query real data.
  5. Dedicated AI endpoints for Features 4, 7, 8, 9 (not chatbot tools).

Architecture (with Function Calling):
  User ──▶ FastAPI ──▶ OpenRouter ──▶ "call search_events(...)" ──▶ Our Code
                       OpenRouter ◀── function results ◀──────────┘
  User ◀── FastAPI ◀── OpenRouter (summarizes results in natural language)

Dedicated AI Endpoints:
  POST /ai/copilot           — Feature 4: Smart Organizer Copilot
  POST /ai/agenda            — Feature 7: Workshop Agenda Generator
  POST /ai/feedback-analysis — Feature 8: Post-Event Feedback & Sentiment Analyzer
  POST /ai/notifications     — Feature 9: Smart Notification Dispatcher

NOTE: Start this service using run.py, not directly:
  python run.py
run.py sets PYTHONUTF8=1 before spawning uvicorn workers, so every worker
process inherits UTF-8 encoding and emoji in print() calls never crash.
"""

import json
import sys
import os
from contextlib import asynccontextmanager
from typing import List, Optional

# -- Belt-and-suspenders: reconfigure stdout in THIS process/worker too.
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
# LIFESPAN
# ================================================================

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
    print(f"[INFO] Model: {OPENROUTER_MODEL}", flush=True)
    print(f"[INFO] Tools loaded: {list(TOOL_FUNCTIONS.keys())}", flush=True)
    yield


# ================================================================
# REQUEST / RESPONSE MODELS
# ================================================================

class ChatRequest(BaseModel):
    """What the frontend sends to the /chat endpoint."""
    message: str
    user_role: str = "participant"


class ChatResponse(BaseModel):
    """What we send back to the frontend."""
    reply: str


# ── Feature 4: Smart Organizer Copilot ────────────────────────────────────
class CopilotRequest(BaseModel):
    """Input for the AI Copilot that generates polished event listings."""
    idea: str                       # Raw event idea (required)
    tech_stack: str = ""            # Core technologies or tools involved
    rules: str = ""                 # Draft rules or requirements
    organizer_name: str = ""        # Organizer name
    category: str = "hackathon"     # Event category hint
    target_audience: str = "students"  # Target audience description


class CopilotResponse(BaseModel):
    title: str
    description: str
    problem_statement: str
    evaluation_criteria: list
    suggested_tags: list
    timeline_suggestion: list
    team_size: str
    suggested_prizes: str
    raw_ai_response: str


# ── Feature 7: Workshop Agenda Generator ──────────────────────────────────
class AgendaRequest(BaseModel):
    """Input for generating a workshop agenda."""
    topics: str                     # Comma-separated topics or single topic
    duration_minutes: int = 120     # Total workshop duration in minutes
    level: str = "Beginner"         # Beginner, Intermediate, or Advanced
    workshop_title: str = ""        # Optional workshop title
    include_breaks: bool = True     # Whether to include breaks


class AgendaResponse(BaseModel):
    workshop_title: str
    total_duration: int
    level: str
    agenda: list                    # List of time slots
    prerequisites: list             # Suggested prerequisites
    resources: list                 # Suggested learning resources


# ── Feature 8: Feedback & Sentiment Analyzer ──────────────────────────────
class FeedbackItem(BaseModel):
    """A single feedback entry."""
    text: str
    rating: Optional[int] = None    # 1-5 stars
    user_name: str = "Anonymous"


class FeedbackAnalysisRequest(BaseModel):
    """Input for feedback sentiment analysis."""
    event_title: str = ""
    feedback_items: List[FeedbackItem]


class FeedbackAnalysisResponse(BaseModel):
    overall_sentiment: str          # "positive", "neutral", "negative", "mixed"
    average_rating: Optional[float]
    sentiment_breakdown: dict       # {"positive": N, "neutral": N, "negative": N}
    key_themes: list                # Common topics/themes found
    highlights: list                # Best feedback quotes
    complaints: list                # Issues/complaints found
    actionable_suggestions: list    # What organizer should improve
    raw_ai_response: str


# ── Feature 9: Smart Notification Dispatcher ──────────────────────────────
class NotificationInput(BaseModel):
    """A raw notification candidate."""
    title: str
    body: str
    type: str                       # "deadline", "team_invite", "schedule_change", "general"
    raw_priority: int = 0           # Initial priority hint


class NotificationDispatchRequest(BaseModel):
    """Input for the notification dispatcher."""
    user_name: str = ""
    user_role: str = "participant"  # "participant" or "organizer"
    notifications: List[NotificationInput]
    context: str = ""               # Extra context about the user's current state


class NotificationDispatchResponse(BaseModel):
    prioritized: list               # Sorted by AI-assigned priority
    urgent_count: int               # Number of urgent (priority >= 8) notifications
    summary: str                    # Brief AI summary of what needs attention


# ================================================================
# FASTAPI APP
# ================================================================

app = FastAPI(
    title="ConnectMyEvent AI Service",
    description="AI-powered assistant for the ConnectMyEvent platform — 9 AI features",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================================================
# CHAT SESSION MANAGEMENT
# ================================================================

chat_sessions: dict[str, list[dict]] = {}


def get_or_create_chat(session_id: str) -> list[dict]:
    """Get an existing conversation or create a new one with the system prompt."""
    if session_id not in chat_sessions:
        chat_sessions[session_id] = [
            {"role": "system", "content": EMS_SYSTEM_INSTRUCTION}
        ]
    return chat_sessions[session_id]


def _simple_ai_call(system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
    """
    A simple one-shot AI call (no function calling, no history).
    Used by the dedicated feature endpoints (copilot, agenda, feedback, notifications).
    """
    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


# ================================================================
# CHAT ENDPOINT — Features 1, 2, 3, 5, 6 (via function calling)
# ================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "ConnectMyEvent AI Service",
        "status": "running",
        "version": "2.0.0",
        "model": OPENROUTER_MODEL,
        "features": [
            "1-Platform Navigator",
            "2-Personalized Recommendations",
            "3-Multilingual Translator",
            "5-Team Matchmaker",
            "6-Idea Evaluator",
            "4-Organizer Copilot (/ai/copilot)",
            "7-Agenda Generator (/ai/agenda)",
            "8-Feedback Analyzer (/ai/feedback-analysis)",
            "9-Notification Dispatcher (/ai/notifications)",
        ],
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint — WITH FUNCTION CALLING via OpenRouter.
    Handles Features 1, 2, 3, 5, 6 through the conversational interface.
    """
    try:
        session_id = "default_session"
        messages = get_or_create_chat(session_id)

        contextualized_message = (
            f"[User Role: {request.user_role.capitalize()}]\n"
            f"{request.message}"
        )

        messages.append({"role": "user", "content": contextualized_message})

        max_iterations = 10
        iteration = 0
        assistant_message = None

        while iteration < max_iterations:
            iteration += 1

            response = client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=messages,
                tools=OPENAI_TOOLS_SCHEMA,
                tool_choice="auto",
                temperature=0.7,
                max_tokens=4096,
            )

            choice = response.choices[0]
            assistant_message = choice.message

            messages.append(assistant_message.model_dump())

            if not assistant_message.tool_calls:
                break

            for tool_call in assistant_message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                print(f"[TOOL] Model requested: {func_name}({func_args})", flush=True)

                if func_name in TOOL_FUNCTIONS:
                    result = TOOL_FUNCTIONS[func_name](**func_args)
                    print(f"[OK]   Result preview: {str(result)[:200]}", flush=True)
                else:
                    result = {"error": f"Unknown function: {func_name}"}
                    print(f"[ERR]  Unknown function: {func_name}", flush=True)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                })

        reply_text = (
            assistant_message.content
            if assistant_message
            else "I processed your request but couldn't generate a response."
        )

        return ChatResponse(reply=reply_text)

    except Exception as e:
        print(f"[ERR] Chat error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@app.post("/chat/reset")
async def reset_chat():
    """Reset the conversation — clears history and starts fresh."""
    chat_sessions.clear()
    return {"status": "Chat session reset successfully"}


# ================================================================
# FEATURE 4 — SMART ORGANIZER COPILOT
# ================================================================

@app.post("/ai/copilot")
async def ai_copilot(request: CopilotRequest):
    """
    Feature 4: Smart Organizer Copilot.
    Transforms a raw event idea into a fully polished, professional event listing.
    """
    try:
        system_prompt = """You are an expert event organizer and technical writer.
Your job is to take a raw event idea and transform it into a professional, compelling event listing.

You MUST respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "title": "Catchy, specific event title",
  "description": "3-4 paragraph engaging description (HTML formatted, use <p> tags)",
  "problem_statement": "The core problem or opportunity this event addresses (1 paragraph)",
  "evaluation_criteria": ["Criterion 1", "Criterion 2", "Criterion 3", "Criterion 4", "Criterion 5"],
  "suggested_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "timeline_suggestion": [
    {"phase": "Registration", "duration": "2 weeks", "description": "Open registration and team formation"},
    {"phase": "Hacking", "duration": "24-48 hours", "description": "Main event period"},
    {"phase": "Submission", "duration": "1 hour", "description": "Final project submission"},
    {"phase": "Judging", "duration": "3 hours", "description": "Evaluation by expert panel"},
    {"phase": "Awards", "duration": "1 hour", "description": "Winner announcement and prizes"}
  ],
  "team_size": "2-4 Members",
  "suggested_prizes": "1st Place: ₹50,000 | 2nd Place: ₹25,000 | 3rd Place: ₹10,000"
}"""

        user_prompt = f"""Transform this raw event idea into a professional listing:

Raw Idea: {request.idea}
Tech Stack / Domain: {request.tech_stack or 'General / Open'}
Draft Rules: {request.rules or 'Standard hackathon rules'}
Category: {request.category}
Organizer: {request.organizer_name or 'ConnectMyEvent'}
Target Audience: {request.target_audience}

Generate a complete, professional event listing JSON."""

        raw_response = _simple_ai_call(system_prompt, user_prompt, max_tokens=3000)

        # Extract JSON from the response
        json_match = raw_response.strip()
        if "```json" in json_match:
            json_match = json_match.split("```json")[1].split("```")[0].strip()
        elif "```" in json_match:
            json_match = json_match.split("```")[1].split("```")[0].strip()

        try:
            parsed = json.loads(json_match)
        except json.JSONDecodeError:
            # Fallback: return as text
            parsed = {
                "title": "AI-Generated Event",
                "description": raw_response,
                "problem_statement": "",
                "evaluation_criteria": [],
                "suggested_tags": [],
                "timeline_suggestion": [],
                "team_size": "2-4 Members",
                "suggested_prizes": "Certificate + Swag",
            }

        parsed["raw_ai_response"] = raw_response
        return parsed

    except Exception as e:
        print(f"[ERR] Copilot error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Copilot error: {str(e)}")


# ================================================================
# FEATURE 7 — WORKSHOP AGENDA GENERATOR
# ================================================================

@app.post("/ai/agenda")
async def ai_agenda(request: AgendaRequest):
    """
    Feature 7: Automated Workshop Agenda Generator.
    Creates a detailed, realistic agenda for any workshop.
    """
    try:
        system_prompt = """You are an expert workshop facilitator and curriculum designer.
Create detailed, realistic workshop agendas that work within the given time constraints.

You MUST respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "workshop_title": "Specific workshop title",
  "total_duration": 120,
  "level": "Beginner",
  "agenda": [
    {"time": "0:00 - 0:15", "session": "Introduction & Setup", "type": "intro", "description": "Welcome, objectives, and environment setup"},
    {"time": "0:15 - 0:45", "session": "Topic 1 Name", "type": "lecture", "description": "Core concepts covered"},
    {"time": "0:45 - 1:15", "session": "Hands-on Lab 1", "type": "lab", "description": "Practical exercise description"},
    {"time": "1:15 - 1:25", "session": "Break", "type": "break", "description": "Short refreshment break"},
    {"time": "1:25 - 1:50", "session": "Topic 2 Name", "type": "lecture", "description": "Advanced concepts"},
    {"time": "1:50 - 2:00", "session": "Q&A & Wrap-up", "type": "closing", "description": "Questions and next steps"}
  ],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "resources": [
    {"title": "Resource Name", "url": "https://example.com", "type": "documentation"},
    {"title": "Video Tutorial", "url": "https://youtube.com", "type": "video"}
  ]
}"""

        user_prompt = f"""Create a detailed workshop agenda:

Workshop Topics: {request.topics}
Total Duration: {request.duration_minutes} minutes
Skill Level: {request.level}
Workshop Title: {request.workshop_title or 'Auto-generate a title'}
Include Breaks: {request.include_breaks}

Create a realistic, well-paced agenda that fills exactly {request.duration_minutes} minutes.
For {request.level} level participants, adjust the pacing and content depth appropriately."""

        raw_response = _simple_ai_call(system_prompt, user_prompt, max_tokens=2500)

        json_match = raw_response.strip()
        if "```json" in json_match:
            json_match = json_match.split("```json")[1].split("```")[0].strip()
        elif "```" in json_match:
            json_match = json_match.split("```")[1].split("```")[0].strip()

        try:
            parsed = json.loads(json_match)
        except json.JSONDecodeError:
            parsed = {
                "workshop_title": request.workshop_title or request.topics[:50],
                "total_duration": request.duration_minutes,
                "level": request.level,
                "agenda": [{"time": "0:00 - end", "session": "Full Workshop", "type": "lecture", "description": raw_response}],
                "prerequisites": [],
                "resources": [],
            }

        return parsed

    except Exception as e:
        print(f"[ERR] Agenda error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Agenda error: {str(e)}")


# ================================================================
# FEATURE 8 — POST-EVENT FEEDBACK & SENTIMENT ANALYZER
# ================================================================

@app.post("/ai/feedback-analysis")
async def ai_feedback_analysis(request: FeedbackAnalysisRequest):
    """
    Feature 8: Post-Event Feedback & Sentiment Analyzer.
    Analyzes student feedback to give organizers actionable insights.
    """
    try:
        if not request.feedback_items:
            raise HTTPException(status_code=400, detail="No feedback items provided")

        # Build the feedback text block
        feedback_block = "\n".join([
            f"[Rating: {item.rating or 'N/A'}/5] {item.user_name}: {item.text}"
            for item in request.feedback_items
        ])

        avg_rating = None
        rated_items = [item.rating for item in request.feedback_items if item.rating is not None]
        if rated_items:
            avg_rating = round(sum(rated_items) / len(rated_items), 1)

        system_prompt = """You are an expert analyst specializing in event feedback and sentiment analysis.
Analyze event feedback and provide actionable insights for organizers.

You MUST respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "overall_sentiment": "positive|negative|neutral|mixed",
  "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0},
  "key_themes": ["Theme 1 (count mentions)", "Theme 2", "Theme 3"],
  "highlights": ["Best feedback quote 1", "Best feedback quote 2"],
  "complaints": ["Issue 1 description", "Issue 2 description"],
  "actionable_suggestions": [
    "Specific improvement action 1",
    "Specific improvement action 2",
    "Specific improvement action 3"
  ]
}"""

        user_prompt = f"""Analyze this post-event feedback for: {request.event_title or 'an event'}

FEEDBACK ({len(request.feedback_items)} responses):
{feedback_block}

Identify sentiment, common themes, highlights, complaints, and provide 3 specific actionable improvement suggestions."""

        raw_response = _simple_ai_call(system_prompt, user_prompt, max_tokens=2000)

        json_match = raw_response.strip()
        if "```json" in json_match:
            json_match = json_match.split("```json")[1].split("```")[0].strip()
        elif "```" in json_match:
            json_match = json_match.split("```")[1].split("```")[0].strip()

        try:
            parsed = json.loads(json_match)
        except json.JSONDecodeError:
            parsed = {
                "overall_sentiment": "mixed",
                "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0},
                "key_themes": [],
                "highlights": [],
                "complaints": [],
                "actionable_suggestions": [raw_response],
            }

        parsed["average_rating"] = avg_rating
        parsed["raw_ai_response"] = raw_response
        return parsed

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERR] Feedback analysis error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Feedback analysis error: {str(e)}")


# ================================================================
# FEATURE 9 — SMART NOTIFICATION DISPATCHER
# ================================================================

@app.post("/ai/notifications")
async def ai_notifications(request: NotificationDispatchRequest):
    """
    Feature 9: Smart Notification & Alert Dispatcher.
    Prioritizes and enriches a list of raw notifications using AI context awareness.
    """
    try:
        if not request.notifications:
            return {"prioritized": [], "urgent_count": 0, "summary": "No notifications to process."}

        notif_block = "\n".join([
            f"[type={n.type}, raw_priority={n.raw_priority}] {n.title}: {n.body}"
            for n in request.notifications
        ])

        system_prompt = """You are an intelligent notification prioritization system.
Analyze notifications for a user and assign final priority scores (0-10, where 10 is most urgent).

You MUST respond with ONLY a valid JSON object (no markdown) with this structure:
{
  "prioritized": [
    {
      "index": 0,
      "title": "original title",
      "body": "original body",
      "type": "original type",
      "priority": 9,
      "urgency_label": "Urgent|High|Medium|Low",
      "reason": "Why this priority was assigned"
    }
  ],
  "summary": "Brief 1-2 sentence summary of what the user needs to action most urgently"
}

Priority rules:
- deadline within 48h → 9-10
- deadline within 7 days → 7-8
- team_invite (needs response) → 7-8
- schedule_change → 6-7
- general positive news → 3-5
- already-completed items → 1-2"""

        user_prompt = f"""Prioritize these notifications for: {request.user_name or 'a user'} (Role: {request.user_role})

Context: {request.context or 'No additional context'}

NOTIFICATIONS:
{notif_block}

Assign final priority scores and return the prioritized list sorted by priority descending."""

        raw_response = _simple_ai_call(system_prompt, user_prompt, max_tokens=2000)

        json_match = raw_response.strip()
        if "```json" in json_match:
            json_match = json_match.split("```json")[1].split("```")[0].strip()
        elif "```" in json_match:
            json_match = json_match.split("```")[1].split("```")[0].strip()

        try:
            parsed = json.loads(json_match)
        except json.JSONDecodeError:
            # Fallback: return original notifications with base priority
            parsed = {
                "prioritized": [
                    {
                        "index": i,
                        "title": n.title,
                        "body": n.body,
                        "type": n.type,
                        "priority": n.raw_priority,
                        "urgency_label": "Medium",
                        "reason": "AI parsing failed — using original priority",
                    }
                    for i, n in enumerate(request.notifications)
                ],
                "summary": "Please review your notifications manually.",
            }

        prioritized = parsed.get("prioritized", [])
        prioritized.sort(key=lambda x: x.get("priority", 0), reverse=True)

        urgent_count = sum(1 for p in prioritized if p.get("priority", 0) >= 8)

        return {
            "prioritized": prioritized,
            "urgent_count": urgent_count,
            "summary": parsed.get("summary", ""),
        }

    except Exception as e:
        print(f"[ERR] Notification dispatch error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Notification dispatch error: {str(e)}")


# ================================================================
# RUN THE SERVER
# ================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
