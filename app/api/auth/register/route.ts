import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    // In a real application, you would hash the password here (e.g. using bcrypt).
    // To keep it aligned with the current simple mock, we store it directly, but in a production-ready way,
    // let's do direct string storage to preserve simplicity for verification, or hash it if needed.
    // Standard direct storage matches their current login verification.
    const newUser = await db.user.create({
      data: {
        name,
        email: emailLower,
        password, // stored as raw text to match vanilla mockup
        role,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}
