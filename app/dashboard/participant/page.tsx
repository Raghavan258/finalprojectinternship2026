"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  LayoutDashboard,
  Calendar,
  Users,
  Award,
  LogOut,
  Menu,
  Sun,
  Moon,
  Bell,
  X,
  Ticket,
  QrCode,
  CheckCircle,
  Sparkles,
  Download,
} from "lucide-react";
import { EventData } from "@/components/EventCard";

interface RegistrationDetails {
  id: number;
  registeredAt: string;
  event: EventData;
}

export default function ParticipantDashboard() {
  const router = useRouter();

  // Navigation states
  const [activeSection, setActiveSection] = useState("section-overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [registrations, setRegistrations] = useState<RegistrationDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout states
  const [theme, setTheme] = useState("light");
  const [userName, setUserName] = useState("Participant");
  const [userEmail, setUserEmail] = useState("");
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Team Match Found!", desc: "You have been matched with 2 partners for FinTech Hackathon. Check Teams!", read: false },
    { id: 2, title: "Certificate Released", desc: "Your credential for 'UX Design Figma Bootcamp' is ready for download.", read: false },
    { id: 3, title: "Registration Approved", desc: "Your pass for CodeStorm National Hackathon has been verified. See you there!", read: true },
  ]);

  // Modal states
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [modalPassData, setModalPassData] = useState<{
    title: string;
    organizer: string;
    date: string;
    passId: string;
  } | null>(null);

  const [toasts, setToasts] = useState<{ id: string; msg: string; type: "success" | "info" | "error" }[]>([]);

  const showToast = (msg: string, type: "success" | "info" | "error") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadData = async (email: string) => {
    try {
      const res = await fetch(`/api/registrations?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setRegistrations(data);
    } catch (err) {
      console.error("Failed to load registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auth guard
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("userRole");
    if (!loggedIn || role !== "participant") {
      router.push("/login");
      return;
    }

    const email = localStorage.getItem("userEmail") || "";
    setUserName(localStorage.getItem("userName") || "Participant");
    setUserEmail(email);

    // Theme setup
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    if (email) {
      loadData(email);
    } else {
      setLoading(false);
    }
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

  const displayPass = (reg: RegistrationDetails) => {
    setModalPassData({
      title: reg.event.title,
      organizer: reg.event.organizer,
      date: reg.event.date,
      passId: `CME-${Math.floor(1000 + Math.random() * 9000)}-${reg.event.organizer.slice(0, 2).toUpperCase()}`,
    });
    setPassModalOpen(true);
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
        <p className="text-muted text-lg font-display">Loading activity feed...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} style={{ opacity: 1, transform: "none" }}>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`} id="sidebar">
        <div className="sidebar-header">
          <Link href="/" className="sidebar-brand" style={{ textDecoration: "none" }}>
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
            className={`nav-item ${activeSection === "section-events" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("section-events");
              setSidebarOpen(false);
            }}
          >
            <Calendar /> Registered Events
          </div>
          <div
            className={`nav-item ${activeSection === "section-teams" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("section-teams");
              setSidebarOpen(false);
            }}
          >
            <Users /> My Teams
          </div>
          <div
            className={`nav-item ${activeSection === "section-certs" ? "active" : ""}`}
            onClick={() => {
              setActiveSection("section-certs");
              setSidebarOpen(false);
            }}
          >
            <Award /> Certificates
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
              My Activities
            </h1>
          </div>

          <div className="flex items-center gap-4">
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

            {/* Notifications Dropdown */}
            <div className="noti-dropdown-container">
              <button
                type="button"
                className="btn btn-ghost p-2"
                onClick={() => setNotiOpen(!notiOpen)}
                style={{
                  borderRadius: "var(--radius-full)",
                  padding: "8px",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell style={{ width: "18px", height: "18px" }} />
                {hasUnreadNoti && <span className="noti-badge-dot"></span>}
              </button>

              {notiOpen && (
                <div className="noti-dropdown open">
                  <div className="noti-dropdown-header">
                    <span>Notifications</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-indigo"
                      onClick={markAllNotificationsRead}
                      style={{ padding: "2px 6px", fontSize: "10px" }}
                    >
                      Mark read
                    </button>
                  </div>
                  <div className="noti-dropdown-body">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`noti-item ${!n.read ? "unread" : ""}`}
                        onClick={() => readNoti(n.id)}
                      >
                        <span className="fw-bold block text-main">{n.title}</span>
                        <span className="text-xs text-secondary mt-1 block">{n.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="avatar avatar-sm">{userName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* 1. OVERVIEW PANEL */}
          {activeSection === "section-overview" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-2xl font-bold font-display mb-6">
                Welcome back, <span className="text-indigo">{userName}</span>! 👋
              </h2>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="stat-card">
                  <div className="flex justify-between items-start">
                    <div className="stat-label">Registered Opportunities</div>
                    <div className="stat-icon" style={{ background: "var(--brand-indigo-50)", color: "var(--brand-indigo-600)" }}>
                      <Calendar />
                    </div>
                  </div>
                  <div className="stat-value text-indigo">{registrations.length}</div>
                </div>
                <div className="stat-card">
                  <div className="flex justify-between items-start">
                    <div className="stat-label">Verified Certificates</div>
                    <div className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                      <Award />
                    </div>
                  </div>
                  <div className="stat-value text-success">2</div>
                </div>
                <div className="stat-card">
                  <div className="flex justify-between items-start">
                    <div className="stat-label">Active Team Matches</div>
                    <div className="stat-icon" style={{ background: "var(--brand-coral-100)", color: "var(--brand-coral-600)" }}>
                      <Users />
                    </div>
                  </div>
                  <div className="stat-value text-coral">1</div>
                </div>
              </div>

              {/* Bottom sections layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-bold font-display mb-4">Upcoming Schedule Highlights</h3>
                  {registrations.length > 0 ? (
                    registrations.slice(0, 2).map((reg) => (
                      <div
                        key={reg.id}
                        className="card card-flat p-5 mb-4 flex flex-col md:flex-row gap-4 items-center"
                        style={{ border: "1px solid var(--border-color)" }}
                      >
                        <div
                          className="w-14 h-14 rounded-lg flex items-center justify-center text-xl shrink-0"
                          style={{ background: reg.event.bgColor, color: reg.event.color }}
                        >
                          {reg.event.icon}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h4 className="font-bold text-sm">{reg.event.title}</h4>
                          <p className="text-xs text-secondary mt-1">Starts {reg.event.date}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-pill"
                          onClick={() => displayPass(reg)}
                        >
                          View Ticket
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="card p-6 text-center border-dashed">
                      <p className="text-muted mb-2">No registered events yet.</p>
                      <Link href="/events" className="btn btn-primary btn-sm btn-pill mt-2">
                        Browse Opportunities
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recommender */}
                <div>
                  <h3 className="text-lg font-bold font-display mb-4">
                    Recommended for You{" "}
                    <Sparkles style={{ width: "16px", color: "var(--brand-indigo-500)", display: "inline-block", verticalAlign: "-2px" }} />
                  </h3>
                  <div className="card p-5 bg-elevated border-color">
                    <div className="flex gap-3 mb-4">
                      <div className="w-10 h-10 rounded bg-white border border-color flex items-center justify-center text-lg">
                        💡
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">FinTech Hackathon</h4>
                        <p className="text-xs text-muted mt-0.5">Based on your focus in web3 &amp; finance.</p>
                      </div>
                    </div>
                    <Link href="/events/11" className="btn btn-primary btn-sm btn-full btn-pill text-center block">
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. REGISTERED EVENTS PANEL */}
          {activeSection === "section-events" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-xl font-bold font-display mb-6">Your Registered Opportunities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registrations.length > 0 ? (
                  registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="card p-6 flex flex-col justify-between"
                      style={{ borderTop: `3.5px solid ${reg.event.color}` }}
                    >
                      <div>
                        <span className={`badge badge-cat-${reg.event.category} mb-3`}>{reg.event.categoryLabel}</span>
                        <h3 className="text-lg font-bold">{reg.event.title}</h3>
                        <p className="text-xs text-muted mb-4">{reg.event.date} • {reg.event.location}</p>
                        <div className="text-xs text-secondary font-mono bg-elevated p-3 border border-color rounded mb-4">
                          <strong>TEAM:</strong> {reg.event.teamSize}<br />
                          <strong>STATUS:</strong> Verified Participant
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm btn-pill btn-full"
                        onClick={() => displayPass(reg)}
                      >
                        Display Gate Pass
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full card p-8 text-center border-dashed">
                    <p className="text-secondary text-sm mb-4">You have not registered for any events yet.</p>
                    <Link href="/events" className="btn btn-primary btn-pill">
                      Explore Listings
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. TEAMS PANEL */}
          {activeSection === "section-teams" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-xl font-bold font-display mb-6">Active Matchmaking Teams</h2>

              <div className="card p-6 border-color mb-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold" style={{ margin: 0 }}>
                      Team AlphaDevs
                    </h3>
                    <p className="text-xs text-muted">Opportunity: CodeStorm National Hackathon</p>
                  </div>
                  <span className="badge badge-success">Completed Matching</span>
                </div>

                <div className="divider mt-2 mb-4"></div>

                <h4 className="text-xs font-bold text-muted uppercase mb-3">Teammates (3/4)</h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-sm">{userName.charAt(0).toUpperCase()}</div>
                      <div>
                        <span className="text-sm font-bold block">{userName} (You)</span>
                        <span className="text-xs text-muted">Skills: React, Figma, Frontend</span>
                      </div>
                    </div>
                    <span className="badge badge-outline text-xs">Leader</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-sm" style={{ background: "var(--brand-coral-500)" }}>
                        AM
                      </div>
                      <div>
                        <span className="text-sm font-bold block">Aditya Mehta</span>
                        <span className="text-xs text-muted">Skills: Node.js, Express, Postgres</span>
                      </div>
                    </div>
                    <span className="badge badge-outline text-xs">Developer</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-sm" style={{ background: "var(--brand-amber-500)" }}>
                        SP
                      </div>
                      <div>
                        <span className="text-sm font-bold block">Sneha Patel</span>
                        <span className="text-xs text-muted">Skills: Python, PyTorch, Data Engine</span>
                      </div>
                    </div>
                    <span className="badge badge-outline text-xs">AI Lead</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. CERTIFICATES PANEL */}
          {activeSection === "section-certs" && (
            <div className="dashboard-panel-section active">
              <h2 className="text-xl font-bold font-display mb-6">Your Verified Credentials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="certificate-card">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="p-3 bg-elevated rounded-lg text-2xl border border-color">🏆</div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => showToast("Downloading credential file for 'Figma Bootcamp'...", "success")}
                      aria-label="Download PDF"
                    >
                      <Download />
                    </button>
                  </div>
                  <h3 className="text-base font-bold font-display">UX Design &amp; Figma Bootcamp</h3>
                  <p className="text-xs text-muted mt-1">Issued by UI Collective • Certified on June 18, 2026</p>
                  <div className="divider mt-3 mb-3"></div>
                  <span className="text-xs text-indigo font-mono">CRED-ID: CME-FM82-901B</span>
                </div>

                <div className="certificate-card">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="p-3 bg-elevated rounded-lg text-2xl border border-color">🏆</div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => showToast("Downloading credential file for 'Hindustani Sangeet'...", "success")}
                      aria-label="Download PDF"
                    >
                      <Download />
                    </button>
                  </div>
                  <h3 className="text-base font-bold font-display">Hindustani Classical Musical Evening</h3>
                  <p className="text-xs text-muted mt-1">Issued by Sangeet Academy • Certified on June 01, 2026</p>
                  <div className="divider mt-3 mb-3"></div>
                  <span className="text-xs text-indigo font-mono">CRED-ID: CME-HS10-829A</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* TICKET MODAL FOR VIEW PASS */}
      {passModalOpen && modalPassData && (
        <div className="modal-backdrop open">
          <div className="modal" style={{ maxWidth: "440px" }}>
            <div className="modal-header" style={{ background: "var(--brand-indigo-600)", color: "#fff" }}>
              <h3 className="text-base font-bold font-display flex items-center gap-2" style={{ margin: 0, color: "#fff" }}>
                <Ticket /> Registered Gate Pass
              </h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPassModalOpen(false)}
                style={{ padding: "4px", color: "#fff", borderRadius: "var(--radius-full)" }}
              >
                <X />
              </button>
            </div>
            <div className="modal-body text-center" style={{ padding: "32px var(--space-8)" }}>
              <div className="badge badge-success mb-4">
                <CheckCircle style={{ width: "12px", height: "12px", marginRight: "4px", display: "inline-block", verticalAlign: "middle" }} /> Registration Approved
              </div>

              <h3 className="text-lg font-bold font-display mb-1 text-truncate">{modalPassData.title}</h3>
              <p className="text-xs text-muted mb-6">{modalPassData.organizer}</p>

              {/* QR Display */}
              <div
                className="card card-flat p-6 mx-auto mb-6 flex justify-center items-center bg-elevated"
                style={{ width: "160px", height: "160px", border: "2px dashed var(--brand-indigo-300)" }}
              >
                <QrCode style={{ width: "110px", height: "110px", color: "var(--brand-indigo-900)" }} />
              </div>

              <div className="text-left text-xs text-secondary bg-elevated border border-color rounded-lg p-4 font-mono">
                <div className="flex justify-between mb-1">
                  <span>PASS ID:</span>
                  <span className="font-bold text-main">{modalPassData.passId}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>HOLDER:</span>
                  <span className="font-bold text-main">{userName}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span className="font-bold text-main">{modalPassData.date}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ background: "var(--bg-elevated)", justifyContent: "center" }}>
              <button type="button" className="btn btn-primary btn-sm btn-pill" onClick={() => setPassModalOpen(false)}>
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
