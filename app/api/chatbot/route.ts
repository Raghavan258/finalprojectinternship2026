import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `You are **ConnectAI**, the official AI assistant for **ConnectMyEvent** — a platform that helps participants discover hackathons, workshops, seminars, and placement campaigns, and helps organizers host and manage events.

🎯 YOUR CORE MISSIONS:
1. Help users navigate the platform — tell them how to register, find events, manage their dashboard.
2. Recommend events based on what users tell you about their interests, skills, or department.
3. Help students think through hackathon ideas or find teammates.
4. Answer questions about events, deadlines, formats, and prizes.

👥 THE TWO USER ROLES:
- **Participant (Students)**: Can browse/discover events, register, view dashboard, find teammates, evaluate hackathon ideas.
- **Organizer**: Can create/publish events, manage registrations, use AI Copilot to generate event listings.

🌐 KEY PLATFORM PAGES:
- Browse Events: /events
- Dashboard: /dashboard
- Login: /login
- Register: /register
- Create Event (Organizer): /dashboard/create-event

📋 PLATFORM FEATURES:
- AI-powered event recommendations
- Team matchmaking for hackathons
- Multilingual event translation
- Smart Organizer Copilot (generates event listings from ideas)
- Workshop Agenda Generator
- Post-event feedback analysis

Keep responses concise, helpful, and friendly. Use markdown for formatting when helpful. Always include relevant links like [Browse Events](/events) when directing users somewhere.`;

// In-memory session store (resets on cold start — acceptable for serverless)
const sessions = new Map<string, Array<{ role: string; content: string }>>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const userRole = searchParams.get("role") || "participant";
  const sessionId = searchParams.get("session") || "default";
  return await handleChat(q, userRole, sessionId);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, message, user_role, session_id } = body;
    const q = message || (messages && messages[messages.length - 1]?.content) || "";
    const userRole = user_role || "participant";
    const sessionId = session_id || "default";
    return await handleChat(q, userRole, sessionId);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function DELETE() {
  sessions.clear();
  return NextResponse.json({ status: "Session reset" });
}

async function handleChat(query: string, userRole: string, sessionId: string) {
  if (!query.trim()) {
    return NextResponse.json({ reply: "Please enter a message." });
  }

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({
      reply: "AI service is not configured. Please contact support.",
    });
  }

  // Get or create session history
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  const history = sessions.get(sessionId)!;

  const userMessage = `[User Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}]\n${query}`;
  history.push({ role: "user", content: userMessage });

  // Keep history bounded (last 20 messages to stay within token limits)
  if (history.length > 20) history.splice(0, history.length - 20);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://connectmyevent.vercel.app",
        "X-Title": "ConnectMyEvent",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", response.status, err);
      throw new Error(`OpenRouter returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    // Save assistant reply to history
    history.push({ role: "assistant", content: reply });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({
      reply:
        "I'm having trouble connecting right now. You can [browse events](/events) or try again in a moment.",
    });
  }
}
