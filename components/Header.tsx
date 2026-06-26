"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, Sun, Moon, LayoutDashboard, Briefcase, LogOut, X, Menu } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("User Name");
  const [userEmail, setUserEmail] = useState("email@college.edu");
  const [userRole, setUserRole] = useState("participant");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Auth setup
    const updateAuthState = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        setUserName(localStorage.getItem("userName") || "User Name");
        setUserEmail(localStorage.getItem("userEmail") || "email@college.edu");
        setUserRole(localStorage.getItem("userRole") || "participant");
      }
    };

    updateAuthState();

    window.addEventListener("storage", updateAuthState);
    window.addEventListener("authChange", updateAuthState);

    return () => {
      window.removeEventListener("storage", updateAuthState);
      window.removeEventListener("authChange", updateAuthState);
    };
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
    setIsLoggedIn(false);
    setProfileDropdownOpen(false);
    setMobileNavOpen(false);
    
    // Dispatch event to update state in other tabs/components
    window.dispatchEvent(new Event("authChange"));
    router.push("/");
  };

  const getDashboardUrl = () => {
    return userRole === "organizer" ? "/dashboard/organizer" : "/dashboard/participant";
  };

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          {/* Brand */}
          <Link href="/" className="nav-brand">
            <Layers style={{ color: "var(--brand-indigo-500)", width: "22px", height: "22px" }} />
            Connect<span>MyEvent</span>
          </Link>

          {/* Navigation links & actions */}
          <div className="flex items-center gap-8">
            <div className="nav-links">
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/events" className="nav-link">Browse Events</Link>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Switcher */}
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

              {/* Dynamic Actions / Profile Section */}
              <div className="nav-actions">
                {!isLoggedIn ? (
                  <div className="flex gap-2">
                    <Link href="/login" className="btn btn-ghost btn-sm" style={{ borderRadius: "var(--radius-full)" }}>
                      Sign In
                    </Link>
                    <Link href="/register" className="btn btn-primary btn-sm btn-pill">
                      Get Started
                    </Link>
                  </div>
                ) : (
                  <div className="profile-dropdown-container">
                    <button
                      type="button"
                      className="avatar avatar-sm cursor-pointer"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      style={{ border: "none" }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </button>
                    {profileDropdownOpen && (
                      <div className="profile-dropdown open">
                        <div style={{ padding: "10px 16px", borderBottom: "1.5px solid var(--border-color)", marginBottom: "4px" }}>
                          <span className="fw-bold block text-main text-sm text-truncate" style={{ maxWidth: "180px", fontWeight: "var(--font-bold)" }}>
                            {userName}
                          </span>
                          <span className="text-xs text-muted block text-truncate" style={{ maxWidth: "180px", marginTop: "2px" }}>
                            {userEmail}
                          </span>
                        </div>
                        <Link href={getDashboardUrl()} className="profile-item-link" onClick={() => setProfileDropdownOpen(false)}>
                          <LayoutDashboard style={{ width: "14px", height: "14px" }} /> My Activities
                        </Link>
                        {userRole === "organizer" && (
                          <Link href="/dashboard/organizer" className="profile-item-link" onClick={() => setProfileDropdownOpen(false)}>
                            <Briefcase style={{ width: "14px", height: "14px" }} /> Organizer Panel
                          </Link>
                        )}
                        <div className="divider" style={{ margin: "4px 0" }}></div>
                        <button
                          type="button"
                          className="profile-item-link text-error"
                          onClick={handleLogout}
                          style={{ border: "none", background: "none", width: "100%", textAlign: "left", cursor: "pointer", color: "var(--error)" }}
                        >
                          <LogOut style={{ width: "14px", height: "14px" }} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hamburger for Mobile */}
              <button
                type="button"
                className="hamburger"
                onClick={() => setMobileNavOpen(true)}
                aria-expanded={mobileNavOpen}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <>
          <div className="mobile-nav-backdrop" style={{ display: "block", opacity: 1 }} onClick={() => setMobileNavOpen(false)}></div>
          <div className="mobile-nav" style={{ right: 0 }}>
            <div className="flex justify-between items-center">
              <div className="nav-brand">Connect<span>MyEvent</span></div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMobileNavOpen(false)}
                style={{
                  padding: "4px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-full)",
                }}
                aria-label="Close"
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>
            <div className="flex flex-col gap-4" style={{ marginTop: "28px" }}>
              <Link href="/" className="nav-link text-base" onClick={() => setMobileNavOpen(false)}>Home</Link>
              <Link href="/events" className="nav-link text-base" onClick={() => setMobileNavOpen(false)}>Browse Events</Link>

              <div className="divider" style={{ margin: "12px 0" }}></div>

              {!isLoggedIn ? (
                <div>
                  <Link href="/login" className="btn btn-ghost btn-full mb-2" style={{ borderRadius: "var(--radius-full)" }} onClick={() => setMobileNavOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/register" className="btn btn-primary btn-full btn-pill" onClick={() => setMobileNavOpen(false)}>
                    Get Started Free
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="avatar avatar-md">{userName.charAt(0).toUpperCase()}</div>
                    <div>
                      <span className="fw-bold block text-main text-sm" style={{ fontWeight: "var(--font-bold)" }}>{userName}</span>
                      <span className="text-xs text-secondary block" style={{ marginTop: "2px" }}>
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </span>
                    </div>
                  </div>
                  <Link href={getDashboardUrl()} className="btn btn-ghost btn-full" style={{ borderRadius: "var(--radius-full)", textAlign: "left", justifyContent: "flex-start" }} onClick={() => setMobileNavOpen(false)}>
                    <LayoutDashboard style={{ width: "16px", marginRight: "8px" }} /> My Activities
                  </Link>
                  {userRole === "organizer" && (
                    <Link href="/dashboard/organizer" className="btn btn-ghost btn-full" style={{ borderRadius: "var(--radius-full)", textAlign: "left", justifyContent: "flex-start" }} onClick={() => setMobileNavOpen(false)}>
                      <Briefcase style={{ width: "16px", marginRight: "8px" }} /> Organizer Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-full text-error"
                    onClick={handleLogout}
                    style={{ borderRadius: "var(--radius-full)", textAlign: "left", justifyContent: "flex-start", color: "var(--error)" }}
                  >
                    <LogOut style={{ width: "16px", marginRight: "8px" }} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
