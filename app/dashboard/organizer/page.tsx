"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  LayoutDashboard,
  Calendar,
  Users,
  BarChart2,
  LogOut,
  Menu,
  Plus,
  Sun,
  Moon,
  Trash,
  Banknote,
  Star,
  X,
  CalendarPlus,
  Bot,
  CalendarClock,
} from "lucide-react";
import { EventData } from "@/components/EventCard";
import AICopilotPanel from "@/components/AICopilotPanel";
import AgendaGenerator from "@/components/AgendaGenerator";
import FeedbackAnalyticsDashboard from "@/components/FeedbackAnalyticsDashboard";
import NotificationCenter from "@/components/NotificationCenter";

interface AttendeeRegistration {
  id: number;
  registeredAt: string;
  user: {
    name: string;
    email: string;
  };
  event: {
    title: string;
  };
}

export default function OrganizerDashboard() {
  const router = useRouter();

  // Navigation states
  const [activeSection, setActiveSection] = useState("section-overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [events, setEvents] = useState<EventData[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout states
  const [theme, setTheme] = useState("light");
  const [userName, setUserName] = useState("Organizer");
  const [userEmail, setUserEmail] = useState("");
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Registration!", desc: "A new candidate registered for CodeStorm National Hackathon.", read: false },
    { id: 2, title: "Sponsor Response", desc: "Razorpay accepted your sponsor pitch for the upcoming event.", read: false },
  ]);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [evtTitle, setEvtTitle] = useState("");
  const [evtCategory, setEvtCategory] = useState("hackathon");
  const [evtMode, setEvtMode] = useState("online");
  const [evtLocation, setEvtLocation] = useState("");
  const [evtLimit, setEvtLimit] = useState("");
  const [evtDate, setEvtDate] = useState("");
  const [evtDesc, setEvtDesc] = useState("");
  const [evtPrice, setEvtPrice] = useState("free");
  const [evtPriceAmount, setEvtPriceAmount] = useState("");
  const [evtTeamSize, setEvtTeamSize] = useState("");
  const [evtPrizes, setEvtPrizes] = useState("");

  const loadData = async () => {
    try {
      // Load events
      const eventsRes = await fetch("/api/events");
      const eventsData = await eventsRes.json();
      setEvents(eventsData);

      // Load registrations/attendees
      const regsRes = await fetch("/api/registrations");
      const regsData = await regsRes.json();
      setAttendees(regsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auth guard
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("userRole");
    if (!loggedIn || role !== "organizer") {
      router.push("/login");
      return;
    }

    setUserName(localStorage.getItem("userName") || "Organizer");
    setUserEmail(localStorage.getItem("userEmail") || "");

    // Theme setup
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    loadData();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    window.dispatchEvent(new Event("authChange"));
    router.push("/");
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: evtTitle,
          category: evtCategory,
          format: evtMode,
          location: evtLocation,
          limit: parseInt(evtLimit) || 100,
          date: evtDate,
          description: evtDesc,
          price: evtPrice,
          priceAmount: evtPrice === "free" ? "Free" : evtPriceAmount,
          teamSize: evtTeamSize || "Individual",
          prizes: evtPrizes || "Certificate",
          organizer: userName,
        }),
      });

      if (res.ok) {
        setCreateModalOpen(false);
        // Reset form
        setFormStep(1);
        setEvtTitle("");
        setEvtCategory("hackathon");
        setEvtMode("online");
        setEvtLocation("");
        setEvtLimit("");
        setEvtDate("");
        setEvtDesc("");
        setEvtPrice("free");
        setEvtPriceAmount("");
        setEvtTeamSize("");
        setEvtPrizes("");
        // Reload listings
        loadData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to create event");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create event. Please try again.");
    }
  };

  const handleDeleteListing = async (id: string | number) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      try {
        const res = await fetch(`/api/events/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          loadData();
        } else {
          alert("Failed to delete event");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const readNoti = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const hasUnreadNoti = notifications.some((n) => !n.read);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted text-lg font-display">Loading organizer workspace...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`} id="sidebar">
        <div className="sidebar-header">
          <Link href="/" className="sidebar-brand">
            <Layers style={{ color: "var(--brand-indigo-500)", width: "22px", height: "22px" }} />
            Connect<span style={{ color: "var(--brand-coral-500)" }}>MyEvent</span>
          </Link>
          <button type="button" className="btn btn-ghost p-1 lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X style={{ width: "20px" }} />
          </button>
        </div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeSection === "section-overview" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("section-overview");
              setSidebarOpen(false);
            }}
          >
            <LayoutDashboard /> Overview
          </div>
          <div
            className={`nav-item ${activeSection === "section-manage" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("section-manage");
              setSidebarOpen(false);
            }}
          >
            <Calendar /> Manage Listings
          </div>
          <div
            className={`nav-item ${activeSection === "section-attendees" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("section-attendees");
              setSidebarOpen(false);
            }}
          >
            <Users /> Attendees
          </div>
          <div
            className={`nav-item ${activeSection === "section-analytics" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("section-analytics");
              setSidebarOpen(false);
            }}
          >
            <BarChart2 /> Analytics
          </div>
          {/* AI Features nav items */}
          <div
            className={`nav-item ${activeSection === "section-copilot" ? "active" : ""}`}
            onClick={() => { setActiveSection("section-copilot"); setSidebarOpen(false); }}
          >
            <Bot style={{ width: 16, height: 16 }} /> AI Copilot
          </div>
          <div
            className={`nav-item ${activeSection === "section-agenda" ? "active" : ""}`}
            onClick={() => { setActiveSection("section-agenda"); setSidebarOpen(false); }}
          >
            <CalendarClock style={{ width: 16, height: 16 }} /> Agenda Generator
          </div>
          <div
            className={`nav-item ${activeSection === "section-feedback" ? "active" : ""}`}
            onClick={() => { setActiveSection("section-feedback"); setSidebarOpen(false); }}
          >
            <BarChart2 style={{ width: 16, height: 16 }} /> Feedback Analytics
          </div>
          <div className="divider" style={{ margin: "12px 0" }}></div>
          <button
            type="button"
            className="nav-item text-error"
            onClick={handleLogout}
            style={{
              marginTop: "auto",
              color: "var(--error)",
              border: "none",
              background: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <LogOut /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Workspace */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="flex items-center gap-4">
            <button type="button" className="btn btn-ghost p-1 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu />
            </button>
            <h1 className="font-display text-base fw-bold mb-0" style={{ margin: 0 }}>
              Organizer Workspace
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Create Event button */}
            <button type="button" className="btn btn-coral btn-sm btn-pill" onClick={() => setCreateModalOpen(true)}>
              <Plus style={{ width: "14px", height: "14px" }} /> Create Event
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon"
              aria-label="Toggle Theme"
              style={{
                borderRadius: "var(--radius-full)",
                width: "36px",
                height: "36px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {theme === "light" ? (
                <Sun style={{ width: "18px", height: "18px" }} />
              ) : (
                <Moon style={{ width: "18px", height: "18px" }} />
              )}
            </button>

            {/* AI Notification Center — Feature 9 */}
            {userEmail && (
              <NotificationCenter email={userEmail} userName={userName} />
            )}

            <div className="avatar avatar-sm">
              {userName.split(" ").map((n) => n.charAt(0)).join("").toUpperCase()}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* 1. OVERVIEW PANEL */}
          {activeSection === "section-overview" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-2xl font-bold font-display mb-6">Manage Events &amp; Outreach</h2>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="stat-card">
                  <div className="flex justify-between items-start">
                    <div className="stat-label">Active Events</div>
                    <div className="stat-icon" style={{ background: "var(--brand-indigo-50)", color: "var(--brand-indigo-600)" }}>
                      <Calendar />
                    </div>
                  </div>
                  <div className="stat-value text-indigo">{events.length}</div>
                </div>
                <div className="stat-card">
                  <div className="flex justify-between items-start">
                    <div className="stat-label">Total Registrations</div>
                    <div className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                      <Users />
                    </div>
                  </div>
                  <div className="stat-value text-success">{attendees.length}</div>
                </div>
                <div className="stat-card">
                  <div className="flex justify-between items-start">
                    <div className="stat-label">Revenue Generated</div>
                    <div className="stat-icon" style={{ background: "var(--brand-coral-100)", color: "var(--brand-coral-600)" }}>
                      <Banknote />
                    </div>
                  </div>
                  <div className="stat-value text-coral">$15.2K</div>
                </div>
                <div className="stat-card">
                  <div className="flex justify-between items-start">
                    <div className="stat-label">Average Rating</div>
                    <div className="stat-icon" style={{ background: "var(--brand-amber-100)", color: "var(--brand-amber-600)" }}>
                      <Star />
                    </div>
                  </div>
                  <div className="stat-value text-amber">4.8 ★</div>
                </div>
              </div>

              {/* Bottom sections layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="card p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-base font-display mb-0" style={{ margin: 0 }}>
                        Recent Opportunity Listings
                      </h3>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-indigo"
                        onClick={() => setActiveSection("section-manage")}
                        style={{ padding: "2px 6px" }}
                      >
                        View all
                      </button>
                    </div>
                    <div className="table-container" style={{ border: "none" }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Event Name</th>
                            <th>Status</th>
                            <th>Registrations</th>
                            <th>Date</th>
                            <th style={{ textAlign: "right" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.slice(0, 3).map((event) => (
                            <tr key={event.id}>
                              <td className="fw-bold">{event.title}</td>
                              <td>
                                <span className="badge badge-success">Live</span>
                              </td>
                              <td>{event.registrationsCount}</td>
                              <td className="font-mono text-xs">{event.date}</td>
                              <td style={{ textAlign: "right" }}>
                                <Link href={`/events/${event.id}`} className="btn btn-ghost btn-sm">
                                  Manage
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* CSS Bar Chart */}
                <div>
                  <div className="chart-container">
                    <div className="chart-header">
                      <h3 className="font-bold text-sm font-display" style={{ margin: 0 }}>
                        Monthly Visitors
                      </h3>
                      <span className="text-xs text-muted">2026</span>
                    </div>
                    <div className="bar-chart">
                      <div className="bar-item">
                        <div className="bar-fill" style={{ height: "40%" }}>
                          <span className="bar-tooltip">4.2K</span>
                        </div>
                        <span className="bar-label">Mar</span>
                      </div>
                      <div className="bar-item">
                        <div className="bar-fill" style={{ height: "65%" }}>
                          <span className="bar-tooltip">6.8K</span>
                        </div>
                        <span className="bar-label">Apr</span>
                      </div>
                      <div className="bar-item">
                        <div className="bar-fill" style={{ height: "50%" }}>
                          <span className="bar-tooltip">5.1K</span>
                        </div>
                        <span className="bar-label">May</span>
                      </div>
                      <div className="bar-item">
                        <div className="bar-fill" style={{ height: "85%" }}>
                          <span className="bar-tooltip">9.2K</span>
                        </div>
                        <span className="bar-label">Jun</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. MANAGE LISTINGS PANEL */}
          {activeSection === "section-manage" && (
            <div className="dashboard-panel-section active">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-display" style={{ margin: 0 }}>
                  Manage Listings
                </h2>
                <button type="button" className="btn btn-primary btn-sm btn-pill" onClick={() => setCreateModalOpen(true)}>
                  <Plus style={{ width: "14px", height: "14px" }} /> Create Event
                </button>
              </div>

              <div className="card p-6">
                <div className="table-container" style={{ border: "none" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Opportunity Title</th>
                        <th>Category</th>
                        <th>Mode</th>
                        <th>Registered Count</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td className="fw-bold">{event.title}</td>
                          <td>
                            <span className={`badge badge-cat-${event.category}`}>{event.categoryLabel}</span>
                          </td>
                          <td>
                            <span className="badge badge-outline text-xs">
                              {event.format.charAt(0).toUpperCase() + event.format.slice(1)}
                            </span>
                          </td>
                          <td>{event.registrationsCount}</td>
                          <td>
                            <span className="badge badge-success">Live</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-error"
                              onClick={() => handleDeleteListing(event.id)}
                            >
                              <Trash style={{ width: "14px", height: "14px" }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. ATTENDEES PANEL */}
          {activeSection === "section-attendees" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-xl font-bold font-display mb-6">Registered Attendees Feed</h2>

              <div className="card p-6">
                <div className="table-container" style={{ border: "none" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Email Address</th>
                        <th>Registered Opportunity</th>
                        <th style={{ textAlign: "right" }}>Registered Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.length > 0 ? (
                        attendees.map((att) => (
                          <tr key={att.id}>
                            <td className="fw-bold flex items-center gap-2">
                              <div className="avatar avatar-xs">
                                {att.user.name.charAt(0).toUpperCase()}
                              </div>{" "}
                              {att.user.name}
                            </td>
                            <td>{att.user.email}</td>
                            <td>{att.event.title}</td>
                            <td style={{ textAlign: "right" }} className="font-mono text-xs">
                              {new Date(att.registeredAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-secondary">
                            No attendees registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. ANALYTICS PANEL */}
          {activeSection === "section-analytics" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-xl font-bold font-display mb-6">Outreach &amp; Audience Metrics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card p-6">
                  <h3 className="font-bold text-sm font-display mb-6">Registrations by Type</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Hackathons</span>
                        <span className="fw-bold">92%</span>
                      </div>
                      <div style={{ background: "var(--border-color)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ background: "var(--brand-indigo-500)", width: "92%", height: "100%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Workshops</span>
                        <span className="fw-bold">5%</span>
                      </div>
                      <div style={{ background: "var(--border-color)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ background: "var(--brand-coral-500)", width: "5%", height: "100%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Startup Pitches</span>
                        <span className="fw-bold">3%</span>
                      </div>
                      <div style={{ background: "var(--border-color)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ background: "var(--brand-amber-500)", width: "3%", height: "100%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="font-bold text-sm font-display mb-6">Regional Distribution</h3>
                  <div className="flex flex-col gap-4 text-xs">
                    <div className="flex justify-between border-bottom border-color pb-2">
                      <span>Mumbai</span>
                      <strong>1,840 Candidates</strong>
                    </div>
                    <div className="flex justify-between border-bottom border-color pb-2">
                      <span>Delhi NCR</span>
                      <strong>980 Candidates</strong>
                    </div>
                    <div className="flex justify-between border-bottom border-color pb-2">
                      <span>Bangalore</span>
                      <strong>820 Candidates</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI FEATURE 4 — Organizer Copilot */}
          {activeSection === "section-copilot" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-2xl font-bold font-display mb-6">
                <span className="text-indigo">AI</span> Organizer Copilot
              </h2>
              <AICopilotPanel organizerName={userName} />
            </div>
          )}

          {/* AI FEATURE 7 — Agenda Generator */}
          {activeSection === "section-agenda" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-2xl font-bold font-display mb-6">
                <span className="text-indigo">AI</span> Workshop Agenda Generator
              </h2>
              <AgendaGenerator />
            </div>
          )}

          {/* AI FEATURE 8 — Feedback Analytics */}
          {activeSection === "section-feedback" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-2xl font-bold font-display mb-6">
                <span className="text-indigo">AI</span> Feedback & Sentiment Analytics
              </h2>
              <FeedbackAnalyticsDashboard />
            </div>
          )}

        </div>
      </main>

      {/* CREATE EVENT MODAL */}
      {createModalOpen && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header">
              <h3 className="text-lg font-bold font-display flex items-center gap-2">
                <CalendarPlus style={{ color: "var(--brand-indigo-500)", width: "18px", height: "18px" }} />
                Create New Opportunity
              </h3>
              <button type="button" className="btn btn-ghost" onClick={() => setCreateModalOpen(false)}>
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="modal-body">
                {/* WIZARD STEPS HEADER */}
                <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "var(--border-color)", paddingBottom: "16px" }}>
                  <div className={`flex-1 text-center text-xs font-bold ${formStep >= 1 ? "text-indigo" : "text-muted"}`}>
                    <span className="block mb-1 text-sm">{formStep > 1 ? "✅" : "1"}</span> Basics
                  </div>
                  <div className={`flex-1 text-center text-xs font-bold ${formStep >= 2 ? "text-indigo" : "text-muted"}`}>
                    <span className="block mb-1 text-sm">{formStep > 2 ? "✅" : "2"}</span> Logistics
                  </div>
                  <div className={`flex-1 text-center text-xs font-bold ${formStep >= 3 ? "text-indigo" : "text-muted"}`}>
                    <span className="block mb-1 text-sm">3</span> Rewards
                  </div>
                </div>

                {formStep === 1 && (
                  <div className="step-content">
                    <div className="input-group">
                      <label className="input-label" htmlFor="evtTitle">
                        Opportunity Title <span className="req">*</span>
                      </label>
                      <input type="text" id="evtTitle" className="input" value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} placeholder="e.g. CodeStorm Hackathon" required />
                    </div>
                    <div className="input-group">
                      <label className="input-label" htmlFor="evtCategory">
                        Category <span className="req">*</span>
                      </label>
                      <select id="evtCategory" className="select" value={evtCategory} onChange={(e) => setEvtCategory(e.target.value)} required>
                        <option value="hackathon">Hackathon</option>
                        <option value="workshop">Workshop</option>
                        <option value="jobfair">Job Fair</option>
                        <option value="startup">Startup Pitch</option>
                        <option value="ngo">NGO Program</option>
                        <option value="cultural">Cultural Event</option>
                        <option value="volunteer">Volunteer Drive</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label" htmlFor="evtDesc">
                        Opportunity Description <span className="req">*</span>
                      </label>
                      <textarea id="evtDesc" className="textarea" rows={4} value={evtDesc} onChange={(e) => setEvtDesc(e.target.value)} placeholder="Describe the overview, guidelines, and context..." required></textarea>
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="step-content">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="input-group">
                        <label className="input-label" htmlFor="evtDate">
                          Event Date <span className="req">*</span>
                        </label>
                        <input type="date" id="evtDate" className="input" value={evtDate} onChange={(e) => setEvtDate(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label" htmlFor="evtMode">
                          Participation Mode <span className="req">*</span>
                        </label>
                        <select id="evtMode" className="select" value={evtMode} onChange={(e) => setEvtMode(e.target.value)} required>
                          <option value="online">Virtual / Online</option>
                          <option value="offline">In-Person / Offline</option>
                        </select>
                      </div>
                    </div>
                    {evtMode === "offline" && (
                      <div className="input-group">
                        <label className="input-label" htmlFor="evtLocation">
                          Venue / Location <span className="req">*</span>
                        </label>
                        <input type="text" id="evtLocation" className="input" value={evtLocation} onChange={(e) => setEvtLocation(e.target.value)} placeholder="e.g. Main Auditorium, City Campus" required={evtMode === "offline"} />
                      </div>
                    )}
                  </div>
                )}

                {formStep === 3 && (
                  <div className="step-content">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="input-group">
                        <label className="input-label" htmlFor="evtTeamSize">
                          Team Size <span className="req">*</span>
                        </label>
                        <input type="text" id="evtTeamSize" className="input" value={evtTeamSize} onChange={(e) => setEvtTeamSize(e.target.value)} placeholder="e.g. 1-4 Members, Individual" required />
                      </div>
                      <div className="input-group">
                        <label className="input-label" htmlFor="evtLimit">
                          Attendee Capacity <span className="req">*</span>
                        </label>
                        <input type="number" id="evtLimit" className="input" value={evtLimit} onChange={(e) => setEvtLimit(e.target.value)} placeholder="e.g. 500" required />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="input-group">
                        <label className="input-label" htmlFor="evtPrice">
                          Registration Fee <span className="req">*</span>
                        </label>
                        <select id="evtPrice" className="select" value={evtPrice} onChange={(e) => setEvtPrice(e.target.value)} required>
                          <option value="free">Free</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                      {evtPrice === "paid" && (
                        <div className="input-group">
                          <label className="input-label" htmlFor="evtPriceAmount">
                            Fee Amount <span className="req">*</span>
                          </label>
                          <input type="text" id="evtPriceAmount" className="input" value={evtPriceAmount} onChange={(e) => setEvtPriceAmount(e.target.value)} placeholder="e.g. $15, 500 INR" required={evtPrice === "paid"} />
                        </div>
                      )}
                    </div>

                    <div className="input-group">
                      <label className="input-label" htmlFor="evtPrizes">
                        Prizes & Incentives
                      </label>
                      <input type="text" id="evtPrizes" className="input" value={evtPrizes} onChange={(e) => setEvtPrizes(e.target.value)} placeholder="e.g. $5,000 + Swag kit" />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
                {formStep > 1 ? (
                  <button type="button" className="btn btn-ghost" onClick={() => setFormStep(formStep - 1)}>
                    Back
                  </button>
                ) : (
                  <button type="button" className="btn btn-ghost" onClick={() => { setCreateModalOpen(false); setFormStep(1); }}>
                    Cancel
                  </button>
                )}
                
                {formStep < 3 ? (
                  <button type="button" className="btn btn-primary" onClick={(e) => { 
                    // basic form validation before next step
                    const form = e.currentTarget.closest('form');
                    if(form?.checkValidity()) {
                      setFormStep(formStep + 1);
                    } else {
                      form?.reportValidity();
                    }
                  }}>
                    Next Step
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary">
                    Publish Listing
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
