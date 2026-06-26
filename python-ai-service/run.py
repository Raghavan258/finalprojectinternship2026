"""
run.py — UTF-8-safe launcher for the Python AI service
========================================================
On Windows, Python defaults to the system 'charmap' (cp1252) codec for stdout/stderr.
This causes crashes when any code prints emoji characters (e.g. 🔧, 🎯).

The problem with setting PYTHONUTF8=1 inside main.py is that uvicorn's --reload
mode spawns child worker processes via subprocess — those children inherit the
*original* environment, not anything set at runtime in the parent process.

Solution: set the env vars HERE, before importing uvicorn, so every child
process spawned by uvicorn inherits a UTF-8 environment from the start.
"""

import os
import sys

# ── Set UTF-8 encoding BEFORE anything else ──────────────────────────────────
# These must be set before any import that might trigger stdout writes.
os.environ["PYTHONUTF8"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"

# Reconfigure the current process streams too
for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

# ── Now it's safe to import and launch uvicorn ───────────────────────────────
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,          # Auto-restart on code changes (dev only)
        reload_dirs=["."],    # Watch only the service directory
    )
