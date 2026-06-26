"""
config.py — Centralized Configuration
======================================
Handles loading environment variables and initializing the OpenRouter client.
OpenRouter uses an OpenAI-compatible API, so we use the official `openai`
Python SDK with a custom base_url pointing to OpenRouter.
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "your_openrouter_api_key_here":
    raise ValueError(
        "⚠️  OPENROUTER_API_KEY is not set! "
        "Copy .env.example to .env and add your API key. "
        "Get one at: https://openrouter.ai/keys"
    )

OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:3000")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)
