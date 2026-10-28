# ConnectMyEvent

Event platform for students and organizers. Participants find hackathons, workshops, and placement drives, register, and ask an assistant that searches the live database. Organizers publish events and use AI to draft listings, agendas, and feedback summaries.

Live app: [finalprojectinternship2026-37f5.vercel.app](https://finalprojectinternship2026-37f5.vercel.app)

## Stack

Next.js 16, React 19, TypeScript, MongoDB (Prisma), FastAPI, OpenRouter (`google/gemini-2.5-flash`).

## What it does

- Browse, filter, and register for events. Accounts are participant or organizer, each with its own dashboard.
- **Ask AI** sits on every page. It calls the model from Next.js with function calling, runs the chosen tool against MongoDB (search, recommendations, team match, idea score, navigation), and replies with links into the app.
- **Organizer AI:** listing copilot, workshop agenda, feedback analysis.
- **Participant AI:** recommendations, teammate matching, idea scoring.

## Architecture

```
Browser
  Ask AI  -->  /api/chatbot  -->  Prisma + OpenRouter tool loop (up to 5 rounds)
  Dashboards --> /api/ai/*   -->  FastAPI (python-ai-service) --> OpenRouter
```

Ask AI does not depend on the Python process, so the hosted site can answer from Vercel. Dashboard panels call `PYTHON_AI_URL`. The browser never talks to the Python port directly.

```
app/api/chatbot/          Ask AI tool loop
app/api/ai/               dashboard AI proxies
app/dashboard/            participant and organizer
components/               chatbot, copilot, agenda, feedback, teams
prisma/schema.prisma      User, Event, Registration, TeamRequest, Notification, EventFeedback
python-ai-service/        FastAPI chat tools plus copilot, agenda, feedback, notifications
```

## Run locally

`.env.local` needs `DATABASE_URL`, `OPENROUTER_API_KEY`, and `OPENROUTER_MODEL`. `PYTHON_AI_URL` defaults to `http://localhost:8000`.

```bash
npm install
npm run dev
```

Dashboard AI also needs `python-ai-service`: copy the same OpenRouter key into `python-ai-service/.env`, then `pip install -r requirements.txt` and `python run.py`.

Do not commit env files.
