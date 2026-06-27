import Link from "next/link";
import { Clock, Building, Calendar, MapPin } from "lucide-react";
import { calculateDaysLeft } from "@/lib/utils";

export interface EventData {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  date: string;
  location: string;
  format: string;
  price: string;
  priceAmount: string;
  organizer: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  prizes: string;
  registrationsCount: number;
  viewsCount: number;
  daysLeft: number;
  teamSize: string;
  featured: boolean;
  timeline: any[];
  schedule: any[];
  speakers: any[];
  sponsors: any[];
}

interface EventCardProps {
  event: EventData;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <article className="card flex flex-col h-full" style={{ borderTop: `3.5px solid ${event.color}` }}>
      <div className="flex-1 flex flex-col justify-between" style={{ padding: "24px" }}>
        <div>
          <div className="flex justify-between items-start mb-4">
            <span className={`badge badge-cat-${event.category}`}>{event.categoryLabel}</span>
            <div className="flex gap-2">
              <span className="badge badge-outline text-xs">
                <Clock style={{ width: "11px", height: "11px", marginRight: "2px", display: "inline-block", verticalAlign: "middle" }} />
                {calculateDaysLeft(event.date)}d left
              </span>
              {event.price === "free" ? (
                <span className="badge badge-success text-xs">Free</span>
              ) : (
                <span className="badge badge-indigo text-xs">{event.priceAmount}</span>
              )}
            </div>
          </div>

          <h3 className="text-lg font-bold mb-2 font-display text-truncate-2" title={event.title}>
            {event.title}
          </h3>

          <div className="flex flex-col gap-1.5 text-xs text-secondary font-sans mb-4">
            <span className="flex items-center gap-2">
              <Building style={{ width: "13px", height: "13px" }} /> {event.organizer}
            </span>
            <span className="flex items-center gap-2">
              <Calendar style={{ width: "13px", height: "13px" }} /> {event.date}
            </span>
            <span className="flex items-center gap-2">
              <MapPin style={{ width: "13px", height: "13px" }} /> {event.location}
            </span>
          </div>
        </div>

        <div>
          <div className="divider mt-2 mb-4"></div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs text-muted">Registered</span>
              <span className="text-sm font-bold font-mono text-indigo">
                {event.registrationsCount.toLocaleString()}
              </span>
            </div>
            <Link href={`/events/${event.id}`} className="btn btn-primary btn-sm btn-pill">
              Explore details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
