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
    port = int(os.environ.get("PORT", "8000"))
    # Hosts set PORT. Local runs keep reload on.
    reload = "PORT" not in os.environ
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=reload,
        reload_dirs=["."] if reload else None,
    )
