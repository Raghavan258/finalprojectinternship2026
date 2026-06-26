import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import EventDetailClient from "./EventDetailClient";
import { EventData } from "@/components/EventCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id || id.length !== 24) {
    notFound();
  }

  // Fetch event directly from MongoDB Atlas
  const event = await db.event.findUnique({
    where: { id },
  });

  if (!event) {
    notFound();
  }

  // Cast Json fields appropriately
  const typedEvent: EventData = {
    ...event,
    timeline: event.timeline as any,
    schedule: event.schedule as any,
    speakers: event.speakers as any,
    sponsors: event.sponsors as any,
  } as unknown as EventData;

  return <EventDetailClient event={typedEvent} />;
}
