import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const AI_SERVICE_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

/**
 * Feature 3 — Multilingual Event Content Translator
 * POST /api/ai/translate
 * Body: { eventId, language }
 * Returns AI-translated event content in the user's preferred language.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, language } = body;

    if (!eventId || !language) {
      return NextResponse.json(
        { error: "eventId and language are required" },
        { status: 400 }
      );
    }

    // Fetch the event directly from DB for accurate data
    const event = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Call the AI chat endpoint with translate tool invocation
    const aiRes = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Translate the event with ID ${eventId} into ${language}. Call translate_event_content with event_id="${eventId}" and target_language="${language}". Then translate and present all the content you receive.`,
        user_role: "participant",
      }),
    });

    if (!aiRes.ok) throw new Error(`AI service error: ${aiRes.status}`);
    const aiData = await aiRes.json();

    return NextResponse.json({
      success: true,
      event_id: eventId,
      language,
      original: {
        title: event.title,
        description: event.description,
        location: event.location,
        date: event.date,
        prizes: event.prizes,
        teamSize: event.teamSize,
      },
      translated_reply: aiData.reply,
    });
  } catch (error) {
    console.error("[AI Translate] Error:", error);
    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 }
    );
  }
}
