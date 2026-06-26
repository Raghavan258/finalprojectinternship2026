import { NextResponse } from "next/server";

// The Python AI service URL (FastAPI running separately)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const userRole = searchParams.get("role") || "participant";
  return await handleChat(q, userRole);
}

export async function POST(request: Request) {
  try {
    const { messages, message, user_role } = await request.json();
    const q =
      message || (messages && messages[messages.length - 1]?.content) || "";
    const userRole = user_role || "participant";
    return await handleChat(q, userRole);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

async function handleChat(query: string, userRole: string = "participant") {
  if (!query.trim()) {
    return NextResponse.json({ reply: "Please enter a message." });
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query, user_role: userRole }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI service error:", errText);
      throw new Error(`AI service returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.reply });
  } catch (error) {
    console.error("Chatbot proxy error:", error);
    return NextResponse.json({
      reply:
        "I ran into an issue connecting to the AI brain. You can browse all events manually by clicking " +
        "<a href='/events' style='color:#4f46e5; font-weight:bold;'>Browse Events &rarr;</a>.",
    });
  }
}
