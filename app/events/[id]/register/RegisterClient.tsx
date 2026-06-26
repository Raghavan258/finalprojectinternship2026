"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, Ticket, QrCode } from "lucide-react";
import { EventData } from "@/components/EventCard";

interface RegisterClientProps {
  event: EventData;
}

export default function RegisterClient({ event }: RegisterClientProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+91");
  const [phoneNum, setPhoneNum] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [orgName, setOrgName] = useState("");
  const [abledValue, setAbledValue] = useState("no");
  const [type, setType] = useState("");
  
  // App UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [ticketHolder, setTicketHolder] = useState("");

  // Auto pre-fill user info if logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      const storedName = localStorage.getItem("userName") || "";
      const storedEmail = localStorage.getItem("userEmail") || "";

      if (storedName) {
        const parts = storedName.trim().split(" ");
        setFirstName(parts[0] || "");
        if (parts.length > 1) {
          setLastName(parts.slice(1).join(" "));
        }
      }
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, []);

  const simulateGoogleLogin = () => {
    setFirstName("Google");
    setLastName("Participant");
    setEmail("google.user@gmail.com");
    setOrgName("Stanford University");
    setGender("female");
    setType("college");
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!gender) {
      alert("Please select a Gender option.");
      return;
    }
    if (!type) {
      alert("Please select a User Type option.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to register.");
        setLoading(false);
        return;
      }

      // Populate pass values
      const fullName = `${firstName} ${lastName}`.trim();
      setTicketHolder(fullName);
      setTicketId(`CME-${Math.floor(1000 + Math.random() * 9000)}-${orgName.slice(0, 2).toUpperCase()}`);
      
      setSuccess(true);
      setLoading(false);
      
      // Trigger Confetti Blast
      setTimeout(() => {
        triggerConfettiBlast();
      }, 100);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during registration. Please try again.");
      setLoading(false);
    }
  };

  const triggerConfettiBlast = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#6C3CE9", "#FF5C2B", "#F5A524", "#10B981", "#3B82F6", "#EC4899"];
    const particles: any[] = [];
    const startX = canvas.width / 2;
    const startY = canvas.height * 0.8;

    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI - Math.PI; // upward burst direction
      const speed = Math.random() * 15 + 10;
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5,
      });
    }

    let active = true;
    let ticks = 0;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let isAnyActive = false;
      particles.forEach((p) => {
        p.vy += 0.5; // gravity
        p.vx *= 0.98; // drag
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();

        if (p.y < canvas.height && p.x > 0 && p.x < canvas.width) {
          isAnyActive = true;
        }
      });

      ticks++;
      if (isAnyActive && ticks < 300) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    draw();
  };

  return (
    <>
      <canvas id="confettiCanvas" ref={canvasRef}></canvas>

      <div className="registration-layout">
        {/* Dynamic Opportunity Header */}
        <div className="registration-header-card anim-slide" style={{ background: "var(--bg-surface)", border: "1.5px solid var(--border-color)" }}>
          <div
            className="event-icon-badge"
            style={{
              background: event.bgColor,
              color: event.color,
            }}
          >
            {event.icon}
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-main mb-1">{event.title}</h1>
            <p className="text-xs text-secondary m-0">Hosted by {event.organizer}</p>
          </div>
        </div>

        {/* Registration Form Card */}
        <div className="registration-card anim-slide">
          {!success ? (
            <div>
              <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
                <h2 className="text-xl font-bold font-display text-main" style={{ margin: 0 }}>
                  Registration Form
                </h2>
                <button type="button" className="google-sso-btn" onClick={simulateGoogleLogin}>
                  <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              <form onSubmit={handleRegistration}>
                {error && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1.5px solid var(--error)",
                      color: "var(--error)",
                      borderRadius: "var(--radius-lg)",
                      padding: "var(--space-3) var(--space-4)",
                      marginBottom: "var(--space-4)",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-bold)",
                      lineHeight: 1.4,
                    }}
                  >
                    {error}
                  </div>
                )}

                <h3 className="registration-section-title">Basic Details</h3>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label" htmlFor="firstName">
                      First Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="lastName">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="form-grid-2 mt-4">
                  <div className="input-group">
                    <label className="input-label" htmlFor="email">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@college.edu"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="phoneNum">
                      Mobile <span className="req">*</span>
                    </label>
                    <div className="phone-input-wrapper">
                      <select
                        className="input phone-prefix"
                        value={phonePrefix}
                        onChange={(e) => setPhonePrefix(e.target.value)}
                        aria-label="Country Code"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <input
                        type="tel"
                        id="phoneNum"
                        className="input flex-1"
                        value={phoneNum}
                        onChange={(e) => setPhoneNum(e.target.value)}
                        placeholder="98765 43210"
                        pattern="[0-9]{10}"
                        title="Ten-digit phone number"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Gender select */}
                <div className="input-group mt-4">
                  <label className="input-label">
                    Gender <span className="req">*</span>
                  </label>
                  <div className="pill-select">
                    {[
                      { val: "female", label: "Female" },
                      { val: "male", label: "Male" },
                      { val: "transgender", label: "Transgender" },
                      { val: "intersex", label: "Intersex" },
                      { val: "non-binary", label: "Non-binary" },
                      { val: "prefer-not", label: "Prefer not to say" },
                      { val: "others", label: "Others" },
                    ].map((g) => (
                      <button
                        key={g.val}
                        type="button"
                        className={`pill-option ${gender === g.val ? "selected" : ""}`}
                        onClick={() => setGender(g.val)}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-grid-2 mt-4">
                  <div className="input-group">
                    <label className="input-label" htmlFor="location">
                      Location <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="location"
                      className="input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Mumbai, India"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="orgName">
                      Organization Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="orgName"
                      className="input"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Enter college or university name"
                      required
                    />
                  </div>
                </div>

                {/* Differently abled selection */}
                <div className="input-group mt-4">
                  <label className="input-label">
                    Differently Abled <span className="req">*</span>
                  </label>
                  <div className="pill-select">
                    <button
                      type="button"
                      className={`pill-option ${abledValue === "no" ? "selected" : ""}`}
                      onClick={() => setAbledValue("no")}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      className={`pill-option ${abledValue === "yes" ? "selected" : ""}`}
                      onClick={() => setAbledValue("yes")}
                    >
                      Yes
                    </button>
                  </div>
                </div>

                <h3 className="registration-section-title">User Details</h3>

                {/* User Type select */}
                <div className="input-group">
                  <label className="input-label">
                    Type <span className="req">*</span>
                  </label>
                  <div className="pill-select">
                    {[
                      { val: "college", label: "College Students" },
                      { val: "professional", label: "Professional" },
                      { val: "school", label: "School Student" },
                      { val: "fresher", label: "Fresher" },
                    ].map((t) => (
                      <button
                        key={t.val}
                        type="button"
                        className={`pill-option ${type === t.val ? "selected" : ""}`}
                        onClick={() => setType(t.val)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="warning-banner">
                  <div className="warning-banner-icon flex shrink-0">
                    <AlertTriangle />
                  </div>
                  <div className="warning-banner-text">
                    Registration CANNOT be cancelled as registration form is enabled for this opportunity. You can add
                    team members on the next step.
                  </div>
                </div>

                <h3 className="registration-section-title">Terms &amp; Conditions</h3>

                <div className="input-group">
                  <label className="filter-item flex items-start gap-3 mt-2 cursor-pointer">
                    <input type="checkbox" required style={{ marginTop: "3px", accentColor: "var(--brand-indigo-505)" }} />
                    <span className="text-xs text-secondary leading-relaxed">
                      By registering for this opportunity, you agree to share the data mentioned in this form or any form
                      henceforth on this opportunity with the organizer of this opportunity for further analysis, processing,
                      and outreach. You also agree to the privacy policy and terms of use of ConnectMyEvent.
                    </span>
                  </label>

                  <label className="filter-item flex items-start gap-3 mt-4 cursor-pointer">
                    <input type="checkbox" defaultChecked style={{ marginTop: "3px", accentColor: "var(--brand-indigo-505)" }} />
                    <span className="text-xs text-secondary">Stay in the loop - Get relevant updates curated just for you!</span>
                  </label>
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="submit" disabled={loading} className="btn btn-primary btn-pill btn-lg px-8">
                    {loading ? "Submitting..." : "Submit Registration"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="success-container">
              <div className="checkmark-circle">✓</div>
              <h2 className="text-2xl font-bold font-display text-main mb-2">Registration Successfully Completed!</h2>
              <p className="text-sm text-secondary mb-6">
                Congratulations! You have successfully registered. Your gate pass is generated below.
              </p>

              {/* Digital Gate Pass Ticket */}
              <div className="ticket-pass-wrapper anim-slide">
                <div className="ticket-header">
                  <h3 className="text-base font-bold font-display flex items-center gap-2" style={{ margin: 0, color: "#fff" }}>
                    <Ticket /> Digital Gate Pass
                  </h3>
                </div>
                <div className="ticket-body">
                  <div className="badge badge-success mb-4">
                    <CheckCircle style={{ width: "12px", height: "12px", marginRight: "4px", display: "inline-block", verticalAlign: "middle" }} /> Entry Verified
                  </div>

                  <h3 className="text-lg font-bold font-display mb-1 text-truncate">{event.title}</h3>
                  <p className="text-xs text-muted mb-6">Hosted by {event.organizer}</p>

                  {/* QR Box */}
                  <div
                    className="card card-flat p-6 mx-auto mb-6 flex justify-center items-center bg-elevated"
                    style={{ width: "160px", height: "160px", border: "2px dashed var(--brand-indigo-300)" }}
                  >
                    <QrCode style={{ width: "110px", height: "110px", color: "var(--brand-indigo-900)" }} />
                  </div>

                  <div className="text-left text-xs text-secondary bg-elevated border border-color rounded-lg p-4 font-mono">
                    <div className="flex justify-between mb-1">
                      <span>PASS ID:</span>
                      <span className="font-bold text-main">{ticketId}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>HOLDER:</span>
                      <span className="font-bold text-main">{ticketHolder}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE:</span>
                      <span className="font-bold text-main">{event.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <button type="button" className="btn btn-outline btn-pill px-6" onClick={() => router.push(`/events/${event.id}`)}>
                  Back to Event
                </button>
                <Link href="/dashboard/participant" className="btn btn-primary btn-pill px-6 text-center">
                  View My Activities
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
