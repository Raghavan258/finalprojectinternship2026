import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const AI_SERVICE_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

/**
 * Feature 5 — Participant Team Matchmaker
 * GET  /api/ai/teams?eventId=...&open=true  — List open team requests
 * POST /api/ai/teams                        — Create a team request
 * PUT  /api/ai/teams                        — Get AI-matched teammates
 */

// GET: List open team requests (used by the Python AI tool)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const open = searchParams.get("open");

  try {
    const where: Record<string, unknown> = {};
    if (eventId) where.eventId = eventId;
    if (open === "true") where.isOpen = true;

    const teamRequests = await db.teamRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        event: { select: { id: true, title: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ teamRequests });
  } catch (error) {
    console.error("[Teams GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team requests" },
      { status: 500 }
    );
  }
}

// POST: Create a new team request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, eventId, skills, lookingFor, description } = body;

    if (!email || !eventId || !skills || !lookingFor || !description) {
      return NextResponse.json(
        { error: "email, eventId, skills, lookingFor, and description are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const skillArray = typeof skills === "string"
      ? skills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : skills;
    const lookingForArray = typeof lookingFor === "string"
      ? lookingFor.split(",").map((s: string) => s.trim()).filter(Boolean)
      : lookingFor;

    const teamRequest = await db.teamRequest.create({
      data: {
        userId: user.id,
        eventId,
        skills: skillArray,
        lookingFor: lookingForArray,
        description,
        isOpen: true,
      },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true } },
      },
    });

    return NextResponse.json({ success: true, teamRequest });
  } catch (error) {
    console.error("[Teams POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create team request" },
      { status: 500 }
    );
  }
}

// PUT: Get AI-matched teammates for a student
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, userSkills, lookingFor, eventId } = body;

    if (!email || !userSkills || !lookingFor) {
      return NextResponse.json(
        { error: "email, userSkills, and lookingFor are required" },
        { status: 400 }
      );
    }

    const aiRes = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Find teammates for me. I offer: ${userSkills}. I need: ${lookingFor}.${eventId ? ` For event ID: ${eventId}.` : ""} Call find_team_matches.`,
        user_role: "participant",
      }),
    });

    if (!aiRes.ok) throw new Error(`AI service error: ${aiRes.status}`);
    const aiData = await aiRes.json();

    // Send Team Match Email
    await sendEmail(
      email,
      "Your AI Team Matches are Ready! 🤝",
      `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6366f1;">Team Matchmaker Results</h2>
        <p>Hi there,</p>
        <p>Based on your skills (<strong>${userSkills}</strong>) and what you're looking for (<strong>${lookingFor}</strong>), our AI has found some potential teammates for you!</p>
        <div style="background: #f8faff; padding: 16px; border: 1px solid #e0e7ff; border-radius: 8px; margin: 20px 0;">
          ${aiData.reply}
        </div>
        <p>Log in to your dashboard to connect with them and form your dream team.</p>
        <br/>
        <p>Best regards,<br/><strong>The ConnectMyEvent AI</strong></p>
      </div>
      `
    );

    return NextResponse.json({
      success: true,
      ai_reply: aiData.reply,
    });
  } catch (error) {
    console.error("[Teams PUT] Error:", error);
    return NextResponse.json(
      { error: "Team matching failed" },
      { status: 500 }
    );
  }
}
