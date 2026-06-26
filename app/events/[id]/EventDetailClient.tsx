"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Milestone, CalendarCheck, UsersRound, Calendar, MapPin, Users, Hourglass, Plus } from "lucide-react";
import { EventData } from "@/components/EventCard";

interface EventDetailClientProps {
  event: EventData;
}

export default function EventDetailClient({ event }: EventDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({});
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: "success" | "info" | "error" }[]>([]);

  const showToast = (msg: string, type: "success" | "info" | "error") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleTeamAction = (type: "create" | "join") => {
    if (type === "create") {
      const teamName = prompt("Enter a name for your new Team:");
      if (teamName) {
        showToast(`Team '${teamName}' created successfully! Share the join link with peers.`, "success");
      }
    } else {
      showToast("You have been added to the matchmaking lobby. We will notify you when a match is found!", "success");
    }
  };

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="container">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} style={{ opacity: 1, transform: "none" }}>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Hero Banner */}
      <div
        className="event-banner"
        style={{
          background: `linear-gradient(135deg, ${event.color}, var(--brand-indigo-950))`,
          marginTop: "var(--space-4)",
        }}
      >
        <div className="event-banner-overlay"></div>
        <div className="event-banner-content">
          <div className="event-banner-icon">{event.icon}</div>
          <div>
            <div className="flex gap-2 items-center mb-2">
              <span className={`badge badge-cat-${event.category}`}>{event.categoryLabel}</span>
              <span className="badge badge-success">
                <ShieldCheck style={{ width: "12px", height: "12px", marginRight: "2px", display: "inline-block", verticalAlign: "middle" }} /> Verified
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display" style={{ color: "#fff", margin: 0 }}>
              {event.title}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--brand-indigo-200)", margin: 0 }}>
              Hosted by <span className="fw-bold" style={{ color: "#fff" }}>{event.organizer}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Double Column Layout */}
      <div className="detail-grid">
        {/* Left Column: Navigation Tabs & Detail Content */}
        <div>
          <div className="tabs">
            {["overview", "schedule", "speakers", "sponsors", "faqs"].map((tab) => (
              <div
                key={tab}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>

          {/* 1. Overview Panel */}
          {activeTab === "overview" && (
            <div className="tab-panel active">
              <h2 className="text-xl font-bold font-display mb-4">About Opportunity</h2>
              <p className="text-sm text-secondary leading-relaxed mb-6">{event.description}</p>

              {/* Team Formation Lobby Widget */}
              <div className="team-lobby-box">
                <div className="flex items-start gap-4">
                  <div className="avatar avatar-md" style={{ background: "var(--brand-indigo-100)", color: "var(--brand-indigo-600)" }}>
                    <UsersRound />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-indigo" style={{ margin: "0 0 var(--space-1)" }}>
                      Dynamic Team Matching Lobby
                    </h3>
                    <p className="text-xs text-secondary mb-4">
                      Don't have a team? Join the matchmaking pool to merge with candidates based on mutual skills (design, backend, etc.).
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => handleTeamAction("create")}>
                        Create Team
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => handleTeamAction("join")}>
                        Join Matching Pool
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Schedule Panel */}
          {activeTab === "schedule" && (
            <div className="tab-panel active">
              <h2 className="text-xl font-bold font-display mb-4">Timeline &amp; Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Milestone style={{ width: "16px", height: "16px", color: "var(--brand-indigo-500)" }} /> Key Milestones
                  </h3>
                  <div className="timeline">
                    {event.timeline && event.timeline.length > 0 ? (
                      event.timeline.map((step: any, idx: number) => (
                        <div key={idx} className="timeline-step flex items-start gap-4">
                          <div className="timeline-node flex flex-col items-center">
                            <div className={`node-circle ${idx === 0 ? "active" : ""}`}>{idx + 1}</div>
                            {idx < event.timeline.length - 1 && <div className="node-line"></div>}
                          </div>
                          <div className="timeline-content pb-6">
                            <h4 className="font-bold text-sm text-main">{step.label}</h4>
                            <span className="text-xs text-secondary font-mono">{step.date}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-secondary">No milestones listed.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <CalendarCheck style={{ width: "16px", height: "16px", color: "var(--brand-indigo-500)" }} /> Program Iteration
                  </h3>
                  <div>
                    {event.schedule && event.schedule.length > 0 ? (
                      event.schedule.map((item: any, idx: number) => (
                        <div key={idx} className="schedule-item flex gap-4 p-4 border border-color rounded-md bg-elevated mb-3">
                          <div className="schedule-time font-mono text-xs text-indigo font-bold shrink-0 w-28">
                            {item.time}
                          </div>
                          <div className="schedule-title text-sm font-semibold">{item.title}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-secondary">No schedule program listed.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Speakers Panel */}
          {activeTab === "speakers" && (
            <div className="tab-panel active">
              <h2 className="text-xl font-bold font-display mb-4">Keynote Speakers &amp; Judges</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.speakers && event.speakers.length > 0 ? (
                  event.speakers.map((sp: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border border-color rounded-lg bg-surface">
                      <div className="avatar avatar-md">{sp.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-bold text-sm">{sp.name}</h4>
                        <p className="text-xs text-secondary m-0">{sp.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-secondary">No guest speakers scheduled for this event.</p>
                )}
              </div>
            </div>
          )}

          {/* 4. Sponsors Panel */}
          {activeTab === "sponsors" && (
            <div className="tab-panel active">
              <h2 className="text-xl font-bold font-display mb-4">Sponsors &amp; Supporting Partners</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {event.sponsors && event.sponsors.length > 0 ? (
                  event.sponsors.map((s: any, idx: number) => (
                    <div key={idx} className="sponsor-box border border-color rounded-lg px-6 py-4 flex items-center justify-center bg-elevated">
                      <span className="text-xl mr-2">{s.logo}</span>
                      <span className="font-bold text-sm text-secondary">{s.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-secondary col-span-full">Organized independently. No external sponsors listed.</p>
                )}
              </div>
            </div>
          )}

          {/* 5. FAQs Panel */}
          {activeTab === "faqs" && (
            <div className="tab-panel active">
              <h2 className="text-xl font-bold font-display mb-4">Frequently Asked Questions</h2>
              <div className="faq-list">
                {[
                  {
                    q: "Who is eligible to participate?",
                    a: "Students from any verified college, university, or boot camp are welcome to register. Professional builders can participate in select hackathons.",
                  },
                  {
                    q: "What is the team size limit?",
                    a: "Team rules vary. Most hackathons allow 1-4 members. You can review the exact limits in the registration page.",
                  },
                  {
                    q: "How will certificates be issued?",
                    a: "Automated participation check-ins generate verified credential badges. Certificates will be downloadable in PDF form on your dashboard.",
                  },
                ].map((faq, idx) => (
                  <div key={idx} className="faq-item">
                    <div className="faq-question" onClick={() => toggleFaq(idx)}>
                      {faq.q}{" "}
                      <Plus
                        style={{
                          width: "14px",
                          height: "14px",
                          transform: faqOpen[idx] ? "rotate(45deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </div>
                    {faqOpen[idx] && (
                      <div className="faq-answer" style={{ display: "block" }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Action Card */}
        <div>
          <div className="sticky-register-card">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-muted">Participation Fee</span>
              <span className="text-2xl font-bold font-display text-indigo" style={{ color: "var(--brand-indigo-600)" }}>
                {event.priceAmount}
              </span>
            </div>

            <div className="divider mt-2 mb-4"></div>

            <div className="flex flex-col gap-1 mb-6">
              <div className="register-info-row">
                <span className="register-info-icon"><Calendar /></span>
                <div>
                  <span className="text-xs text-muted block">Event Date</span>
                  <span className="font-semibold text-xs text-main">{event.date}</span>
                </div>
              </div>
              <div className="register-info-row">
                <span className="register-info-icon"><MapPin /></span>
                <div>
                  <span className="text-xs text-muted block">Venue / Mode</span>
                  <span className="font-semibold text-xs text-main">{event.location}</span>
                </div>
              </div>
              <div className="register-info-row">
                <span className="register-info-icon"><Users /></span>
                <div>
                  <span className="text-xs text-muted block">Team Requirement</span>
                  <span className="font-semibold text-xs text-main">{event.teamSize}</span>
                </div>
              </div>
              <div className="register-info-row">
                <span className="register-info-icon"><Hourglass style={{ color: "var(--brand-coral-500)" }} /></span>
                <div>
                  <span className="text-xs text-muted block">Application Window</span>
                  <span className="font-bold text-xs text-coral" style={{ color: "var(--brand-coral-500)" }}>
                    {event.daysLeft} days left
                  </span>
                </div>
              </div>
            </div>

            <Link href={`/events/${event.id}/register`} className="btn btn-coral btn-lg btn-full btn-pill mb-4 text-center block">
              Register Now
            </Link>

            <div className="text-center">
              <span className="text-xs text-muted font-mono">
                <Users style={{ display: "inline-block", width: "12px", height: "12px", verticalAlign: "text-bottom", marginRight: "4px" }} />{" "}
                {event.registrationsCount.toLocaleString()} registered
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
