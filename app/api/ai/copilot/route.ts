import { NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

/**
 * Feature 4 — Smart Organizer Copilot
 * POST /api/ai/copilot
 * Body: { idea, tech_stack, rules, organizer_name, category, target_audience }
 * Returns a fully polished event listing JSON.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idea, tech_stack, rules, organizer_name, category, target_audience } = body;

    if (!idea || idea.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a more detailed event idea (at least 10 characters)" },
        { status: 400 }
      );
    }

    const aiRes = await fetch(`${AI_SERVICE_URL}/ai/copilot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idea,
        tech_stack: tech_stack || "",
        rules: rules || "",
        organizer_name: organizer_name || "",
        category: category || "hackathon",
        target_audience: target_audience || "students",
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[AI Copilot] Service error:", errText);
      throw new Error(`AI service error: ${aiRes.status}`);
    }

    const data = await aiRes.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("[AI Copilot] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate event listing. Please try again." },
      { status: 500 }
    );
  }
}
