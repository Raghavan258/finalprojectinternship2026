"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password");
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

  const handleSocialLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Simulate registering social login user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "GitHub Coder",
          email: "github-user@github.com",
          password: "github-password",
          role: "participant",
        }),
      });
      // Ignore conflict errors since it means they already exist
      
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "github-user@github.com",
          password: "github-password",
        }),
      });

      const data = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role);

        window.dispatchEvent(new Event("authChange"));
        router.push("/");
      } else {
        setError(data.error || "Social authentication failed.");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to authenticate with GitHub");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card anim-slide">
        <div className="text-center mb-8">
          <Link href="/" className="brand-logo">
            <Layers style={{ color: "var(--brand-indigo-500)", width: "26px", height: "26px" }} />
            Connect<span>MyEvent</span>
          </Link>
          <p className="text-sm text-secondary">Welcome back! Please enter your credentials.</p>
        </div>

        <form onSubmit={handleLogin}>
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

          <div className="input-group">
            <label className="input-label" htmlFor="emailInput">
              Email address
            </label>
            <input
              type="email"
              id="emailInput"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
              required
            />
          </div>
          <div className="input-group">
            <div className="flex justify-between items-center">
              <label className="input-label" htmlFor="passwordInput">
                Password
              </label>
              <a href="#" className="text-xs fw-bold text-indigo">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              id="passwordInput"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex justify-between items-center mb-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-secondary">
              <input type="checkbox" style={{ accentColor: "var(--brand-indigo-500)", width: "14px", height: "14px" }} />
              <span>Remember for 30 days</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg mb-4">
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-8" style={{ marginBottom: 0 }}>
          Don't have an account yet?{" "}
          <Link href="/register" className="text-indigo fw-bold">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
