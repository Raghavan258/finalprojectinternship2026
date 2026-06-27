import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const AI_SERVICE_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

/**
 * Feature 6 — Hackathon Idea & Abstract Evaluator
 * POST /api/ai/evaluate
 * Body: { abstract, eventId?, eventTheme?, teamSkills? }
 * Returns a preliminary viability score and structured constructive feedback.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { abstract, eventId, eventTheme, teamSkills, evaluationCriteria } = body;

    if (!abstract || abstract.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide a more detailed abstract (at least 20 characters)" },
        { status: 400 }
      );
    }

    // If eventId provided, fetch event theme and criteria from DB
    let theme = eventTheme || "";
    let criteria = evaluationCriteria || "";

    if (eventId) {
      const event = await db.event.findUnique({
        where: { id: eventId },
        select: { title: true, description: true, evaluationCriteria: true, tags: true },
      });
      if (event) {
        theme = theme || event.title + " — " + event.tags.join(", ");
        criteria = criteria || event.evaluationCriteria || "";
      }
    }

    // Call AI evaluate tool via chat
    const aiRes = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Evaluate my hackathon idea. Call evaluate_hackathon_idea with:
abstract: "${abstract}"
${theme ? `event_theme: "${theme}"` : ""}
${criteria ? `evaluation_criteria: "${criteria}"` : ""}
${teamSkills ? `team_skills: "${teamSkills}"` : ""}`,
        user_role: "participant",
      }),
    });

    if (!aiRes.ok) throw new Error(`AI service error: ${aiRes.status}`);
    const aiData = await aiRes.json();

    return NextResponse.json({
      success: true,
      event_id: eventId || null,
      event_theme: theme,
      ai_feedback: aiData.reply,
    });
  } catch (error) {
    console.error("[AI Evaluate] Error:", error);
    return NextResponse.json(
      { error: "Evaluation failed. Please try again." },
      { status: 500 }
    );
  }
}
