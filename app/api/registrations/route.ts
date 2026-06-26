import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  try {
    const whereClause: any = {};

    if (email) {
      whereClause.user = {
        email: email.toLowerCase().trim(),
      };
    }

    const registrations = await db.registration.findMany({
      where: whereClause,
      include: {
        user: true,
        event: true,
      },
      orderBy: { registeredAt: "desc" },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Failed to fetch registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
