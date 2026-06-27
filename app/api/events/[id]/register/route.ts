import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Verify user exists
    const user = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found. Please sign in first." },
        { status: 401 }
      );
    }

    // Verify event exists
    const event = await db.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if already registered
    const existingReg = await db.registration.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: id,
        },
      },
    });

    if (existingReg) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 400 }
      );
    }

    // Create registration and increment registrationsCount inside a transaction
    await db.$transaction([
      db.registration.create({
        data: {
          userId: user.id,
          eventId: id,
        },
      }),
      db.event.update({
        where: { id },
        data: {
          registrationsCount: {
            increment: 1,
          },
        },
      }),
    ]);

    // Send Event Registration Email
    await sendEmail(
      user.email,
      `Registration Confirmed: ${event.title}`,
      `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #6366f1;">Registration Confirmed! 🎉</h2>
        <p>Hi ${user.name},</p>
        <p>You have successfully registered for <strong>${event.title}</strong>.</p>
        <ul>
          <li><strong>Date:</strong> ${event.date}</li>
          <li><strong>Location:</strong> ${event.location}</li>
          <li><strong>Format:</strong> ${event.format}</li>
        </ul>
        <p>We look forward to seeing you there! Don't forget to use the AI Team Matchmaker if you need a team.</p>
        <br/>
        <p>Best regards,<br/><strong>The ConnectMyEvent Team</strong></p>
      </div>
      `
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event registration error:", error);
    return NextResponse.json(
      { error: "Failed to register for this event" },
      { status: 500 }
    );
  }
}
