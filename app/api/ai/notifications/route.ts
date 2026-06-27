import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const AI_SERVICE_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

/**
 * Feature 9 — Smart Notification & Alert Dispatcher
 * GET  /api/ai/notifications?email=...  — Get user's notifications from DB
 * POST /api/ai/notifications            — Create new notification
 * PUT  /api/ai/notifications            — AI-prioritize + dispatch notifications for a user
 * PATCH /api/ai/notifications           — Mark notification as read
 */

// GET: Fetch user's notifications
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const unreadOnly = searchParams.get("unread") === "true";

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const notifications = await db.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      notifications,
      unread_count: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error("[Notifications GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST: Create a new notification for a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, title, body: notifBody, type, priority, link } = body;

    if (!email || !title || !notifBody || !type) {
      return NextResponse.json(
        { error: "email, title, body, and type are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const notification = await db.notification.create({
      data: {
        userId: user.id,
        title,
        body: notifBody,
        type,
        priority: priority || 0,
        link: link || null,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("[Notifications POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PUT: AI-dispatch — generate, prioritize, and store notifications for a user
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        registrations: {
          include: { event: true },
          orderBy: { registeredAt: "desc" },
          take: 20,
        },
        teamRequests: {
          where: { isOpen: true },
          take: 5,
        },
        notifications: {
          where: { read: false },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build raw notification candidates from DB state
    const rawNotifications: Array<{
      title: string; body: string; type: string; raw_priority: number; link?: string;
    }> = [];

    // Deadline-based notifications from registered events
    for (const reg of user.registrations) {
      const ev = reg.event;
      const daysLeft = ev.daysLeft || 0;
      if (daysLeft > 0 && daysLeft <= 7) {
        rawNotifications.push({
          title: `⏰ ${ev.title} — Deadline Soon`,
          body: `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left before the registration deadline closes.`,
          type: "deadline",
          raw_priority: daysLeft <= 2 ? 9 : 7,
          link: `/events/${ev.id}`,
        });
      }
    }

    // Team request notifications
    if (user.teamRequests.length > 0) {
      rawNotifications.push({
        title: `👥 Your Team Request is Open`,
        body: `You have ${user.teamRequests.length} open team request(s). Check for new teammate matches!`,
        type: "team_invite",
        raw_priority: 6,
        link: "/dashboard/participant",
      });
    }

    // If no raw notifications, add a general one
    if (rawNotifications.length === 0) {
      rawNotifications.push({
        title: "🎉 Explore New Events",
        body: "Check out the latest events on ConnectMyEvent that match your interests!",
        type: "general",
        raw_priority: 3,
        link: "/events",
      });
    }

    // Call AI to prioritize
    const aiRes = await fetch(`${AI_SERVICE_URL}/ai/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: user.name,
        user_role: user.role,
        notifications: rawNotifications,
        context: `User has ${user.registrations.length} registrations and ${user.teamRequests.length} open team requests.`,
      }),
    });

    if (!aiRes.ok) throw new Error(`AI service error: ${aiRes.status}`);
    const aiResult = await aiRes.json();

    // Store AI-prioritized notifications in DB
    const stored = [];
    for (const pn of aiResult.prioritized || []) {
      const raw = rawNotifications[pn.index] || rawNotifications[0];
      const notification = await db.notification.create({
        data: {
          userId: user.id,
          title: pn.title || raw.title,
          body: pn.body || raw.body,
          type: pn.type || raw.type,
          priority: pn.priority || 0,
          link: raw.link || null,
          read: false,
        },
      });
      stored.push(notification);
    }

    return NextResponse.json({
      success: true,
      notifications_created: stored.length,
      urgent_count: aiResult.urgent_count || 0,
      summary: aiResult.summary || "",
      notifications: stored,
    });
  } catch (error) {
    console.error("[Notifications PUT] Error:", error);
    return NextResponse.json(
      { error: "Notification dispatch failed" },
      { status: 500 }
    );
  }
}

// PATCH: Mark notification as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, markAllEmail } = body;

    if (markAllEmail) {
      // Mark all as read for user
      const user = await db.user.findUnique({
        where: { email: markAllEmail.toLowerCase().trim() },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId or markAllEmail is required" }, { status: 400 });
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notifications PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
