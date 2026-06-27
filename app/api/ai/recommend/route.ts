import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const AI_SERVICE_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

/**
 * Feature 2 — Personalized Event Recommendation Engine
 * GET /api/ai/recommend?email=...
 * Returns ranked event recommendations for the logged-in student's profile.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    // 1. Fetch student profile from DB
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        registrations: {
          include: { event: true },
          orderBy: { registeredAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Extract past categories from registration history
    const pastCategories = [
      ...new Set(user.registrations.map((r) => r.event.category)),
    ].join(", ");

    // 3. Call Python AI service recommend endpoint via chat tool
    const aiRes = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Call get_personalized_recs with: student_name="${user.name}", department="${user.department || ""}", skills="${user.skills.join(", ")}", interests="${user.interests.join(", ")}", past_categories="${pastCategories}"`,
        user_role: user.role,
      }),
    });

    if (!aiRes.ok) throw new Error(`AI service error: ${aiRes.status}`);
    const aiData = await aiRes.json();

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name,
        department: user.department,
        skills: user.skills,
        interests: user.interests,
        pastCategories: pastCategories.split(", ").filter(Boolean),
      },
      ai_reply: aiData.reply,
    });
  } catch (error) {
    console.error("[AI Recommend] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/recommend
 * Body: { email, skills, interests, department, preferred_format, budget }
 * Allows updating profile fields and getting fresh recommendations.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, skills, interests, department, preferred_format, budget } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Update user profile if new data provided
    const updateData: Record<string, unknown> = {};
    if (skills) updateData.skills = skills.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (interests) updateData.interests = interests.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (department) updateData.department = department;

    const user = await db.user.update({
      where: { email: email.toLowerCase().trim() },
      data: updateData,
      include: {
        registrations: {
          include: { event: true },
          take: 10,
        },
      },
    });

    const pastCategories = [
      ...new Set(user.registrations.map((r) => r.event.category)),
    ].join(", ");

    // Call the AI recommendations tool
    const aiRes = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Call get_personalized_recs with: student_name="${user.name}", department="${user.department || ""}", skills="${user.skills.join(", ")}", interests="${user.interests.join(", ")}", past_categories="${pastCategories}", preferred_format="${preferred_format || ""}", budget="${budget || ""}"`,
        user_role: user.role,
      }),
    });

    if (!aiRes.ok) throw new Error(`AI service error: ${aiRes.status}`);
    const aiData = await aiRes.json();

    return NextResponse.json({
      success: true,
      updated_profile: {
        skills: user.skills,
        interests: user.interests,
        department: user.department,
      },
      ai_reply: aiData.reply,
    });
  } catch (error) {
    console.error("[AI Recommend POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
