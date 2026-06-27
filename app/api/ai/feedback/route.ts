import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const AI_SERVICE_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

/**
 * Feature 8 — Post-Event Feedback & Sentiment Analyzer
 * GET  /api/ai/feedback?eventId=...  — Get feedback for an event
 * POST /api/ai/feedback              — Submit feedback + store in DB
 * PUT  /api/ai/feedback              — Run AI sentiment analysis on event's feedback
 */

// GET: Fetch feedback entries for an event
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    const feedback = await db.eventFeedback.findMany({
      where: { eventId },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("[Feedback GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// POST: Submit new feedback
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, eventId, rating, text } = body;

    if (!email || !eventId || !rating || !text) {
      return NextResponse.json(
        { error: "email, eventId, rating, and text are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Store feedback — AI sentiment will be added by the PUT endpoint
    const feedback = await db.eventFeedback.upsert({
      where: { userId_eventId: { userId: user.id, eventId } },
      create: { userId: user.id, eventId, rating: Number(rating), text },
      update: { rating: Number(rating), text, sentiment: null },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("[Feedback POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// PUT: Run AI sentiment analysis on all feedback for an event
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { title: true },
    });

    const feedbackList = await db.eventFeedback.findMany({
      where: { eventId },
      include: { user: { select: { name: true } } },
    });

    if (feedbackList.length === 0) {
      return NextResponse.json(
        { error: "No feedback found for this event" },
        { status: 404 }
      );
    }

    // Call Python AI feedback analysis endpoint
    const aiRes = await fetch(`${AI_SERVICE_URL}/ai/feedback-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_title: event?.title || eventId,
        feedback_items: feedbackList.map((f) => ({
          text: f.text,
          rating: f.rating,
          user_name: f.user.name,
        })),
      }),
    });

    if (!aiRes.ok) throw new Error(`AI service error: ${aiRes.status}`);
    const analysis = await aiRes.json();

    // Update sentiment labels in DB for each feedback item (best effort)
    const sentimentMap = { positive: "positive", neutral: "neutral", negative: "negative" };
    const overall = analysis.overall_sentiment as string;
    const sentimentLabel = sentimentMap[overall as keyof typeof sentimentMap] || "neutral";

    // Batch update sentiments (simplified — real impl would use per-item analysis)
    await db.eventFeedback.updateMany({
      where: { eventId },
      data: { sentiment: sentimentLabel },
    });

    return NextResponse.json({
      success: true,
      event_id: eventId,
      feedback_count: feedbackList.length,
      analysis,
    });
  } catch (error) {
    console.error("[Feedback PUT] Error:", error);
    return NextResponse.json(
      { error: "Sentiment analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
