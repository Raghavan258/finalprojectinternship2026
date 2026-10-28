import { NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

/**
 * Proxies manual feedback analysis to the Python AI service.
 * The browser calls this same-origin route so it never uses localhost.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const aiRes = await fetch(`${AI_SERVICE_URL}/ai/feedback-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await aiRes.json();
    if (!aiRes.ok) {
      return NextResponse.json({ error: "Analysis failed" }, { status: aiRes.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Feedback analysis proxy]", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
