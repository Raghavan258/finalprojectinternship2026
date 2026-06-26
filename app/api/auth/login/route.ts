import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Look up user
    const user = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to login user" }, { status: 500 });
  }
}
