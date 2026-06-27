import { NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

/**
 * Feature 7 — Automated Workshop Agenda Generator
 * POST /api/ai/agenda
 * Body: { topics, duration_minutes, level, workshop_title?, include_breaks? }
 * Returns a structured agenda timeline and resource kit.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      topics,
      duration_minutes,
      level,
      workshop_title,
      include_breaks,
    } = body;

    if (!topics || topics.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide workshop topics" },
        { status: 400 }
      );
    }

    const aiRes = await fetch(`${AI_SERVICE_URL}/ai/agenda`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topics,
        duration_minutes: duration_minutes || 120,
        level: level || "Beginner",
        workshop_title: workshop_title || "",
        include_breaks: include_breaks !== false,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[AI Agenda] Service error:", errText);
      throw new Error(`AI service error: ${aiRes.status}`);
    }

    const data = await aiRes.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("[AI Agenda] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate agenda. Please try again." },
      { status: 500 }
    );
  }
}
