import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured");
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  try {
    const whereClause: any = {};

    if (featured === "true") {
      whereClause.featured = true;
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { organizer: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const events = await db.event.findMany({
      where: whereClause,
      orderBy: { id: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, format, limit, date, description, organizer } = body;

    if (!title || !category || !format || !date || !description || !organizer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Format date object to string like "July 12, 2026"
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    const formattedDate = dateObj.toLocaleDateString("en-US", options);

    // Default stylings and assets based on category
    const catLabels: { [key: string]: string } = {
      hackathon: "Hackathon",
      workshop: "Workshop",
      jobfair: "Job Fair",
      startup: "Startup Pitch",
      ngo: "NGO Program",
      cultural: "Cultural Event",
      volunteer: "Volunteer Drive",
      scholarship: "Scholarship",
      mentorship: "Mentorship",
    };

    const catIcons: { [key: string]: string } = {
      hackathon: "💻",
      workshop: "🛠️",
      jobfair: "💼",
      startup: "🚀",
      ngo: "🌍",
      cultural: "🎭",
      volunteer: "🤝",
      scholarship: "🎓",
      mentorship: "💡",
    };

    const categoryLabel = catLabels[category] || "Special Event";
    const icon = catIcons[category] || "⭐";
    const color = `var(--cat-${category})`;
    const bgColor = `var(--cat-${category}-bg)`;

    const newEvent = await db.event.create({
      data: {
        title,
        category,
        categoryLabel,
        date: formattedDate,
        location: format === "online" ? "Online (Virtual)" : "In-Person (Offline)",
        format,
        price: "free",
        priceAmount: "Free",
        organizer,
        icon,
        color,
        bgColor,
        description,
        prizes: "Certificate + Swag",
        teamSize: "1-4 Members",
        featured: false,
        timeline: [],
        schedule: [],
        speakers: [],
        sponsors: [],
      },
    });

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

