"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState("participant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to register user");
        setLoading(false);
        return;
      }

      // Store in localStorage
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", data.user.role);

      // Trigger navbar sync
      window.dispatchEvent(new Event("authChange"));

      // Redirect
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card anim-slide">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-display text-main mb-2">Create your account</h1>
          <p className="text-sm text-secondary">Join the platform connecting the entire event ecosystem.</p>
        </div>

        <form onSubmit={handleRegister}>
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

          <label className="input-label mb-2 block">
            Registering as a <span className="req">*</span>
          </label>
          <div className="role-select">
            <div
              className={`role-card ${role === "participant" ? "active" : ""}`}
              onClick={() => setRole("participant")}
            >
              <div className="role-icon">👩‍💻</div>
              <div className="fw-bold text-sm">Participant</div>
            </div>
            <div
              className={`role-card ${role === "organizer" ? "active" : ""}`}
              onClick={() => setRole("organizer")}
            >
              <div className="role-icon">📋</div>
              <div className="fw-bold text-sm">Organizer</div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="nameInput">
              Full Name <span className="req">*</span>
            </label>
            <input
              type="text"
              id="nameInput"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="emailInput">
              Email address <span className="req">*</span>
            </label>
            <input
              type="email"
              id="emailInput"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@university.edu"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="passwordInput">
              Password <span className="req">*</span>
            </label>
            <input
              type="password"
              id="passwordInput"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg mt-6">
            {loading ? "Registering..." : "Get Started Free"}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-8" style={{ marginBottom: 0 }}>
          Already have an account?{" "}
          <Link href="/login" className="text-indigo fw-bold">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
