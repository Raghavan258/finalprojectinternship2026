"use client";

import { useState, useEffect } from "react";
import { Bell, BellDot, X, AlertCircle, Clock, Users, Star, ChevronRight, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  priority: number;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

interface Props {
  email: string;
  userName?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  deadline: <Clock style={{ width: 14, height: 14 }} />,
  team_invite: <Users style={{ width: 14, height: 14 }} />,
  schedule_change: <AlertCircle style={{ width: 14, height: 14 }} />,
  general: <Star style={{ width: 14, height: 14 }} />,
};

const TYPE_COLORS: Record<string, string> = {
  deadline: "#ef4444",
  team_invite: "#6366f1",
  schedule_change: "#f59e0b",
  general: "#10b981",
};

const PRIORITY_LABEL = (p: number) =>
  p >= 9 ? "Urgent" : p >= 7 ? "High" : p >= 5 ? "Medium" : "Low";

const PRIORITY_COLOR = (p: number) =>
  p >= 9 ? "#ef4444" : p >= 7 ? "#f59e0b" : p >= 5 ? "#6366f1" : "#10b981";

export default function NotificationCenter({ email, userName }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/notifications?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const dispatchSmartNotifications = async () => {
    setDispatching(true);
    try {
      const res = await fetch("/api/ai/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchNotifications();
    } catch (err: unknown) {
      console.error("Dispatch error:", err);
    } finally {
      setDispatching(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/ai/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/ai/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllEmail: email }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handleToggle = () => {
    setOpen((v) => !v);
    if (!open) fetchNotifications();
  };

  return (
    <div className="nc-wrap">
      {/* Bell button */}
      <button type="button" className="nc-bell" onClick={handleToggle} id="notification-bell-btn">
        {unreadCount > 0 ? (
          <BellDot style={{ width: 20, height: 20 }} />
        ) : (
          <Bell style={{ width: 20, height: 20 }} />
        )}
        {unreadCount > 0 && (
          <span className="nc-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="nc-panel">
          <div className="nc-panel-header">
            <div className="nc-panel-title">
              <Bell style={{ width: 14, height: 14 }} />
              Notifications
              {unreadCount > 0 && <span className="nc-panel-count">{unreadCount} new</span>}
            </div>
            <div className="nc-panel-actions">
              <button
                type="button"
                className="nc-action-btn"
                onClick={dispatchSmartNotifications}
                disabled={dispatching}
                title="Refresh smart notifications"
              >
                {dispatching ? <Loader2 style={{ width: 12, height: 12 }} className="spin" /> : "↻ Refresh"}
              </button>
              {unreadCount > 0 && (
                <button type="button" className="nc-action-btn" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
              <button type="button" className="nc-close" onClick={() => setOpen(false)}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          <div className="nc-list">
            {loading && (
              <div className="nc-empty">
                <Loader2 style={{ width: 18, height: 18 }} className="spin" />
                Loading...
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="nc-empty">
                <Bell style={{ width: 24, height: 24, opacity: 0.3 }} />
                <p>No notifications yet.</p>
                <button type="button" className="nc-dispatch-btn" onClick={dispatchSmartNotifications}>
                  Get Smart Alerts
                </button>
              </div>
            )}
            {!loading && notifications.map((n) => (
              <div
                key={n.id}
                className={`nc-item ${n.read ? "read" : "unread"}`}
                onClick={() => { if (!n.read) markAsRead(n.id); }}
              >
                <div
                  className="nc-item-icon"
                  style={{
                    background: (TYPE_COLORS[n.type] || "#6b7280") + "22",
                    color: TYPE_COLORS[n.type] || "#6b7280",
                  }}
                >
                  {TYPE_ICONS[n.type] || <Bell style={{ width: 14, height: 14 }} />}
                </div>
                <div className="nc-item-content">
                  <div className="nc-item-header">
                    <span className="nc-item-title">{n.title}</span>
                    <span
                      className="nc-item-priority"
                      style={{ color: PRIORITY_COLOR(n.priority) }}
                    >
                      {PRIORITY_LABEL(n.priority)}
                    </span>
                  </div>
                  <p className="nc-item-body">{n.body}</p>
                  {n.link && (
                    <a href={n.link} className="nc-item-link">
                      View <ChevronRight style={{ width: 12, height: 12 }} />
                    </a>
                  )}
                </div>
                {!n.read && <div className="nc-unread-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .nc-wrap { position: relative; display: inline-block; }
        .nc-bell {
          position: relative;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: background 0.2s;
          color: inherit;
        }
        .nc-bell:hover { background: rgba(0,0,0,0.06); }
        .nc-badge {
          position: absolute;
          top: 0; right: 0;
          background: #ef4444;
          color: #fff;
          font-size: 0.6rem;
          font-weight: 800;
          width: 16px; height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
        }
        .nc-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          max-height: 480px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.15);
          z-index: 200;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .nc-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
        }
        .nc-panel-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.88rem;
        }
        .nc-panel-count {
          background: rgba(255,255,255,0.2);
          padding: 1px 7px;
          border-radius: 20px;
          font-size: 0.72rem;
        }
        .nc-panel-actions { display: flex; align-items: center; gap: 6px; }
        .nc-action-btn {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          color: #fff;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.73rem;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .nc-action-btn:hover { background: rgba(255,255,255,0.25); }
        .nc-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .nc-close {
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .nc-close:hover { opacity: 1; }
        .nc-list {
          overflow-y: auto;
          flex: 1;
          max-height: 380px;
        }
        .nc-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 32px;
          color: #6b7280;
          font-size: 0.85rem;
          text-align: center;
        }
        .nc-dispatch-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }
        .nc-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px 16px;
          border-bottom: 1px solid #f9fafb;
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
        }
        .nc-item:hover { background: #fafafa; }
        .nc-item.unread { background: #f8f7ff; }
        .nc-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nc-item-content { flex: 1; min-width: 0; }
        .nc-item-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 3px;
        }
        .nc-item-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .nc-item-priority {
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .nc-item-body {
          font-size: 0.8rem;
          color: #6b7280;
          line-height: 1.4;
          margin: 0 0 4px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .nc-item-link {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #6366f1;
          text-decoration: none;
        }
        .nc-item-link:hover { text-decoration: underline; }
        .nc-unread-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #6366f1;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
