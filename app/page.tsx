"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronLeft, ChevronRight, UserCheck, Users, Award, Bot, QrCode, Medal, ShieldCheck } from "lucide-react";
import EventCard, { EventData } from "@/components/EventCard";

const CATEGORIES = [
  { id: "all", label: "All Events", icon: "⚡" },
  { id: "hackathon", label: "Hackathons", icon: "💻" },
  { id: "workshop", label: "Workshops", icon: "🛠️" },
  { id: "jobfair", label: "Job Fairs", icon: "💼" },
  { id: "startup", label: "Pitch Fests", icon: "🚀" },
  { id: "ngo", label: "NGO Programs", icon: "🌍" },
  { id: "cultural", label: "Cultural Fests", icon: "🎭" },
  { id: "volunteer", label: "Volunteer", icon: "🤝" },
];

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<EventData[]>([]);
  const [liveEvents, setLiveEvents] = useState<EventData[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sliderIndex, setSliderIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("participant");

  // Load auth state
  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    setUserRole(localStorage.getItem("userRole") || "participant");
  }, []);

  // Load featured events
  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch("/api/events?featured=true");
        const data = await res.json();
        setFeaturedEvents(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadFeatured();
  }, []);

  // Load live events based on active category
  useEffect(() => {
    async function loadLiveEvents() {
      try {
        const res = await fetch(`/api/events?category=${activeCategory}`);
        const data = await res.json();
        // Limit to 6 items on landing page
        setLiveEvents(data.slice(0, 6));
      } catch (err) {
        console.error(err);
      }
    }
    loadLiveEvents();
  }, [activeCategory]);

  // Autoplay slider
  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredEvents]);

  const handlePrevSlide = () => {
    if (featuredEvents.length === 0) return;
    setSliderIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  };

  const handleNextSlide = () => {
    if (featuredEvents.length === 0) return;
    setSliderIndex((prev) => (prev + 1) % featuredEvents.length);
  };

  return (
    <>
      {/* 1. HERO SECTION */}
      <section className="hero text-center">
        <div className="hero-glow-1"></div>
        <div className="container relative">
          <div className="badge badge-indigo mb-4" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Sparkles style={{ width: "13px", height: "13px", color: "var(--brand-indigo-500)", marginRight: "4px" }} />
            AI-Powered Smart Platform
          </div>
          <h1 className="hero-title">
            Where Every Event<br /><span>Finds Its Perfect Audience</span>
          </h1>
          <p className="hero-subtitle">
            The ultimate intelligent matching platform connecting ambitious participants, professional organizers, sponsors &amp; judges — from hackathons to volunteering campaigns.
          </p>

          {/* Search Bar */}
          <div className="search-box-wrap">
            <form action="/events" method="GET" className="hero-search-bar">
              <input
                type="text"
                name="q"
                placeholder="Search hackathons, workshops, job fairs, NGO fests..."
              />
              <button type="submit" className="btn btn-primary btn-pill">Find Events</button>
            </form>
          </div>

          {/* Trust Stats Board */}
          <div className="trust-stats">
            <div className="trust-stat-item">
              <div className="trust-stat-val">30+</div>
              <div className="trust-stat-lbl">Active Categories</div>
            </div>
            <div className="trust-stat-item">
              <div className="trust-stat-val">5,200+</div>
              <div className="trust-stat-lbl">Registrations today</div>
            </div>
            <div className="trust-stat-item">
              <div className="trust-stat-val">120+</div>
              <div className="trust-stat-lbl">Colleges &amp; Orgs</div>
            </div>
            <div className="trust-stat-item">
              <div className="trust-stat-val">4.9 ★</div>
              <div className="trust-stat-lbl">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY PILLS */}
      <section className="section bg-elevated" style={{ borderTop: "1.5px solid var(--border-color)", borderBottom: "1.5px solid var(--border-color)", padding: "48px 0" }}>
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display mb-2">Explore Opportunities by Role</h2>
            <p className="text-sm text-secondary">Click on any pill to instantly filter events below</p>
          </div>

          <div className="cat-tabs">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className={`cat-tab ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="cat-tab-icon">{cat.icon}</span>
                <span className="cat-tab-label">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED EVENTS CAROUSEL */}
      {featuredEvents.length > 0 && (
        <section className="carousel-section">
          <div className="container">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold font-display">Featured Opportunities</h2>
                <p className="text-sm text-secondary">Premium, verified events closing soon</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handlePrevSlide} className="btn btn-ghost btn-icon btn-sm" aria-label="Previous featured event">
                  <ChevronLeft />
                </button>
                <button type="button" onClick={handleNextSlide} className="btn btn-ghost btn-icon btn-sm" aria-label="Next featured event">
                  <ChevronRight />
                </button>
              </div>
            </div>

            <div className="carousel-track">
              {featuredEvents.map((event, idx) => (
                <div
                  key={event.id}
                  className="carousel-slide anim-fade"
                  style={{ display: idx === sliderIndex ? "block" : "none" }}
                >
                  <div className="carousel-card card" style={{ borderTop: `4px solid ${event.color}` }}>
                    <div className="carousel-card-body flex gap-6 items-center">
                      <div className="carousel-icon-box" style={{ background: event.bgColor, color: event.color }}>
                        {event.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 items-center mb-2">
                          <span className="badge" style={{ background: event.bgColor, color: event.color }}>{event.categoryLabel}</span>
                          <span className="badge badge-amber">
                            <Sparkles style={{ width: "12px", height: "12px", marginRight: "2px", display: "inline-block", verticalAlign: "middle" }} /> Featured
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-truncate mb-2">{event.title}</h3>
                        <p className="text-sm text-secondary text-truncate-2 mb-4">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted mb-4">
                          <span>📅 {event.date}</span>
                          <span>📍 {event.location}</span>
                          <span>👥 {event.registrationsCount} Registered</span>
                        </div>
                        <Link href={`/events/${event.id}`} className="btn btn-primary btn-sm">
                          Explore Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. EVENTS GRID */}
      <section className="section bg-body">
        <div className="container">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold font-display">Explore Live Events</h2>
              <p className="text-sm text-secondary">Highly-rated campaigns you can apply to right now</p>
            </div>
            <Link href="/events" className="btn btn-outline btn-sm btn-pill">
              View All Listing &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {liveEvents.length > 0 ? (
              liveEvents.map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted text-lg">No upcoming events listed in this category yet.</p>
                <Link href="/events" className="btn btn-outline btn-sm mt-4">
                  Browse All Events
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="section bg-surface" style={{ borderTop: "1.5px solid var(--border-color)", borderBottom: "1.5px solid var(--border-color)" }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">A Unified Network, Endless Outcomes</h2>
            <p className="text-secondary text-lg">ConnectMyEvent fits the entire lifecycle of professional and college events.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="avatar avatar-lg mb-4" style={{ background: "var(--brand-indigo-50)", color: "var(--brand-indigo-600)" }}><UserCheck /></div>
              <h3 className="text-lg font-bold mb-2">1. Build Your Profile</h3>
              <p className="text-sm text-secondary" style={{ maxWidth: "280px" }}>Register as a participant, upload your skills, and let our matchmaker index your credentials.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="avatar avatar-lg mb-4" style={{ background: "var(--brand-coral-100)", color: "var(--brand-coral-600)" }}><Users /></div>
              <h3 className="text-lg font-bold mb-2">2. Form Dynamic Teams</h3>
              <p className="text-sm text-secondary" style={{ maxWidth: "280px" }}>Match with peers in hackathons or startup drives using our smart algorithmic match lobby.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="avatar avatar-lg mb-4" style={{ background: "var(--brand-amber-100)", color: "var(--brand-amber-600)" }}><Award /></div>
              <h3 className="text-lg font-bold mb-2">3. Claim Verification</h3>
              <p className="text-sm text-secondary" style={{ maxWidth: "280px" }}>Earn smart blockchain certificates signed by partners and display them directly on LinkedIn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BENTO GRID FEATURES */}
      <section className="section bg-elevated">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">Robust Features Packed In</h2>
            <p className="text-secondary text-lg">Tools tailored for the modern event era</p>
          </div>

          <div className="bento-grid">
            <div className="bento-card bento-large">
              <div className="bento-card-icon"><Bot /></div>
              <h3 className="text-xl font-bold mb-2">AI-Guided Matchmaking Assistant</h3>
              <p className="text-sm text-secondary mb-4">Chat with our bot anywhere to fetch hackathons matching your tech stack, request registration steps, or find team members automatically.</p>
              <div className="p-4 border border-color rounded bg-elevated text-xs font-mono text-indigo">
                &gt; Looking for online Solidity hackathons...<br />
                &gt; MATCH FOUND: Blockchain Decoded [BITS Pilani] starting in 24 days.
              </div>
            </div>
            <div className="bento-card">
              <div className="bento-card-icon" style={{ background: "var(--brand-coral-100)", color: "var(--brand-coral-600)" }}><QrCode /></div>
              <h3 className="text-lg font-bold mb-2">Smart Digital Gate Passes</h3>
              <p className="text-sm text-secondary">Instant QR generator on dashboard to scan and check-in physically at offline venues.</p>
            </div>
            <div className="bento-card">
              <div className="bento-card-icon" style={{ background: "var(--brand-amber-100)", color: "var(--brand-amber-600)" }}><Medal /></div>
              <h3 className="text-lg font-bold mb-2">Verified Certificates</h3>
              <p className="text-sm text-secondary">Automated credential checks and instant co-signed PDFs generated on success.</p>
            </div>
            <div className="bento-card bento-large">
              <div className="bento-card-icon"><ShieldCheck /></div>
              <h3 className="text-xl font-bold mb-2">Granular Role-Based Dashboards</h3>
              <p className="text-sm text-secondary">8 specialized portals covering Participants, Organizers, Speakers, Judges, and Sponsors with deep tools for analytics, submission reviews, and scheduling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="section bg-surface" style={{ borderTop: "1.5px solid var(--border-color)" }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">Loved by Students &amp; Leads</h2>
            <p className="text-secondary text-lg">Hear what our users say about the CME system</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="testimonial-card flex flex-col justify-between">
              <p className="text-sm text-secondary italic mb-4">"CME's team matchmaking system was a game changer. We built a full web prototype and found an amazing React dev in under 2 hours!"</p>
              <div className="flex items-center gap-3">
                <div className="avatar avatar-sm">SP</div>
                <div>
                  <h4 className="font-bold text-xs">Sanjay Prasad</h4>
                  <span className="text-xs text-muted">HackQuest '26 Winner</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card flex flex-col justify-between">
              <p className="text-sm text-secondary italic mb-4">"Hosting our central placement job fair with 5,000 candidates was effortless. The digital QR screening saved us hours of reception overhead."</p>
              <div className="flex items-center gap-3">
                <div className="avatar avatar-sm" style={{ background: "var(--brand-coral-500)" }}>MG</div>
                <div>
                  <h4 className="font-bold text-xs">Malini Gupta</h4>
                  <span className="text-xs text-muted">Lead CPC, Delhi University</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card flex flex-col justify-between">
              <p className="text-sm text-secondary italic mb-4">"Direct pipeline to vetted talent. CME let us sponsor, judge, and match with the top 10% coding profiles instantly."</p>
              <div className="flex items-center gap-3">
                <div className="avatar avatar-sm" style={{ background: "var(--brand-amber-500)" }}>RH</div>
                <div>
                  <h4 className="font-bold text-xs">Rishi H</h4>
                  <span className="text-xs text-muted">University Lead, Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="section" style={{ background: "linear-gradient(135deg, var(--brand-indigo-900), var(--brand-indigo-950))", color: "#fff" }}>
        <div className="container text-center py-12">
          <h2 className="text-4xl font-bold font-display mb-4" style={{ color: "#fff" }}>Ready to launch your next big campaign?</h2>
          <p className="text-secondary text-lg mb-8" style={{ color: "var(--brand-indigo-200)", maxWidth: "620px", marginLeft: "auto", marginRight: "auto" }}>
            Whether hosting a 24h coding challenge or volunteer drive, ConnectMyEvent gives you all tools to list, screen, and issue credentials.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {isLoggedIn && userRole === "organizer" ? (
              <Link href="/dashboard/organizer" className="btn btn-coral btn-lg">Go to Organizer Dashboard</Link>
            ) : (
              <Link href="/register?role=organizer" className="btn btn-coral btn-lg">Publish Event Now</Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
