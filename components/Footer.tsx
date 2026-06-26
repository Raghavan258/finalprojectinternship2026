import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="font-display text-xl fw-extrabold text-indigo mb-4 block" style={{ color: "var(--brand-indigo-400)", textDecoration: "none" }}>
              Connect<span style={{ color: "var(--brand-coral-400)" }}>MyEvent</span>
            </Link>
            <p className="text-sm mb-6" style={{ color: "var(--n-400)", maxWidth: "320px", lineHeight: 1.6 }}>
              Intelligent event matching platform helping colleges, enterprises, and local groups manage listings, registrations, and analytics in one place.
            </p>
          </div>
          <div>
            <h4 className="footer-heading">Discover</h4>
            <div className="footer-links">
              <Link href="/events">All Competitions</Link>
              <Link href="/events?cat=hackathon">Hackathons</Link>
              <Link href="/events?cat=workshop">Workshops</Link>
              <Link href="/events?cat=jobfair">Job Fairs</Link>
            </div>
          </div>
          <div>
            <h4 className="footer-heading">Organizers</h4>
            <div className="footer-links">
              <Link href="/register?role=organizer">Host an Event</Link>
              <Link href="/login">Organizer Portal</Link>
              <a href="#">Pricing Plans</a>
            </div>
          </div>
          <div>
            <h4 className="footer-heading">Company</h4>
            <div className="footer-links">
              <a href="#">Contact Support</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 ConnectMyEvent. Built for high performance &amp; modern accessibility.</p>
          <div className="flex gap-4">
            <a href="#" style={{ color: "var(--n-500)" }}>Privacy Policy</a>
            <a href="#" style={{ color: "var(--n-500)" }}>Terms &amp; Conditions</a>
            <a href="#" style={{ color: "var(--n-500)" }}>Cookie settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
