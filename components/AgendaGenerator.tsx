"use client";

import { useState } from "react";
import { CalendarClock, Loader2, Clock, BookOpen, Link as LinkIcon } from "lucide-react";

const SESSION_TYPE_COLORS: Record<string, string> = {
  intro: "#6366f1",
  lecture: "#0ea5e9",
  lab: "#10b981",
  break: "#f59e0b",
  closing: "#8b5cf6",
  activity: "#ec4899",
};

const SESSION_TYPE_ICONS: Record<string, string> = {
  intro: "🚀",
  lecture: "📖",
  lab: "🔧",
  break: "☕",
  closing: "🎯",
  activity: "⚡",
};

interface AgendaSlot {
  time: string;
  session: string;
  type: string;
  description: string;
}

interface AgendaResult {
  workshop_title: string;
  total_duration: number;
  level: string;
  agenda: AgendaSlot[];
  prerequisites: string[];
  resources: Array<{ title: string; url: string; type: string }>;
}

export default function AgendaGenerator() {
  const [form, setForm] = useState({
    topics: "",
    duration_minutes: 120,
    level: "Beginner",
    workshop_title: "",
    include_breaks: true,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgendaResult | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!form.topics.trim()) {
      setError("Please enter at least one workshop topic.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Agenda generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agenda-panel">
      <div className="agenda-header">
        <div className="agenda-title">
          <CalendarClock style={{ width: 18, height: 18 }} />
          AI Workshop Agenda Generator
          <span className="agenda-badge">Feature 7</span>
        </div>
        <p className="agenda-subtitle">
          Auto-generate a detailed, time-slotted agenda for any workshop.
        </p>
      </div>

      <div className="agenda-body">
        {/* Input form */}
        <div className="agenda-form">
          <div className="agenda-form-group">
            <label className="agenda-label">Workshop Topics *</label>
            <textarea
              className="agenda-textarea"
              rows={2}
              placeholder="e.g. React Hooks, useState vs useReducer, Custom Hooks, Context API"
              value={form.topics}
              onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))}
            />
          </div>
          <div className="agenda-form-row">
            <div className="agenda-form-group">
              <label className="agenda-label">Duration (minutes)</label>
              <input
                type="number"
                className="agenda-input"
                min={30}
                max={480}
                step={15}
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
              />
            </div>
            <div className="agenda-form-group">
              <label className="agenda-label">Skill Level</label>
              <select
                className="agenda-input"
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div className="agenda-form-group">
              <label className="agenda-label">Workshop Title (optional)</label>
              <input
                className="agenda-input"
                placeholder="Auto-generate if blank"
                value={form.workshop_title}
                onChange={(e) => setForm((f) => ({ ...f, workshop_title: e.target.value }))}
              />
            </div>
          </div>
          <label className="agenda-checkbox-label">
            <input
              type="checkbox"
              checked={form.include_breaks}
              onChange={(e) => setForm((f) => ({ ...f, include_breaks: e.target.checked }))}
            />
            Include breaks in agenda
          </label>
          {error && <div className="agenda-error">{error}</div>}
          <button type="button" className="agenda-btn" onClick={handleGenerate} disabled={loading}>
            {loading
              ? <><Loader2 style={{ width: 14, height: 14 }} className="spin" /> Generating...</>
              : <><CalendarClock style={{ width: 14, height: 14 }} /> Generate Agenda</>
            }
          </button>
        </div>

        {/* Result */}
        {result && !loading && (
          <div className="agenda-result">
            <div className="agenda-result-meta">
              <h3 className="agenda-result-title">{result.workshop_title}</h3>
              <div className="agenda-result-pills">
                <span className="agenda-pill">
                  <Clock style={{ width: 12, height: 12 }} /> {result.total_duration} min
                </span>
                <span className="agenda-pill">{result.level}</span>
                <span className="agenda-pill">{result.agenda.length} sessions</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="agenda-timeline">
              {result.agenda.map((slot, i) => (
                <div key={i} className="agenda-slot">
                  <div
                    className="agenda-slot-time"
                    style={{ borderLeft: `3px solid ${SESSION_TYPE_COLORS[slot.type] || "#6b7280"}` }}
                  >
                    {slot.time}
                  </div>
                  <div className="agenda-slot-content">
                    <div className="agenda-slot-name">
                      <span>{SESSION_TYPE_ICONS[slot.type] || "📌"}</span>
                      {slot.session}
                      <span
                        className="agenda-slot-type"
                        style={{
                          background: (SESSION_TYPE_COLORS[slot.type] || "#6b7280") + "22",
                          color: SESSION_TYPE_COLORS[slot.type] || "#6b7280",
                        }}
                      >
                        {slot.type}
                      </span>
                    </div>
                    <div className="agenda-slot-desc">{slot.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prerequisites */}
            {result.prerequisites.length > 0 && (
              <div className="agenda-section">
                <div className="agenda-section-title">
                  <BookOpen style={{ width: 14, height: 14 }} /> Prerequisites
                </div>
                <ul className="agenda-list">
                  {result.prerequisites.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            {/* Resources */}
            {result.resources.length > 0 && (
              <div className="agenda-section">
                <div className="agenda-section-title">
                  <LinkIcon style={{ width: 14, height: 14 }} /> Suggested Resources
                </div>
                <div className="agenda-resources">
                  {result.resources.map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="agenda-resource-link">
                      {r.type === "video" ? "🎥" : r.type === "documentation" ? "📄" : "🔗"} {r.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button type="button" className="agenda-reset-btn" onClick={() => setResult(null)}>
              Generate Another
            </button>
          </div>
        )}
      </div>

      <style>{`
        .agenda-panel {
          background: var(--card-bg, #fff);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .agenda-header {
          padding: 18px 22px 14px;
          background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
          color: #fff;
        }
        .agenda-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 1rem;
          margin-bottom: 5px;
        }
        .agenda-badge {
          font-size: 0.65rem;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 2px 8px;
          border-radius: 20px;
        }
        .agenda-subtitle { font-size: 0.83rem; opacity: 0.7; margin: 0; }
        .agenda-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 20px; }
        .agenda-form { display: flex; flex-direction: column; gap: 14px; }
        .agenda-form-row { display: flex; gap: 14px; flex-wrap: wrap; }
        .agenda-form-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 150px; }
        .agenda-label { font-size: 0.78rem; font-weight: 700; color: #374151; }
        .agenda-input, .agenda-textarea {
          width: 100%;
          padding: 9px 13px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.87rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          resize: vertical;
          box-sizing: border-box;
        }
        .agenda-input:focus, .agenda-textarea:focus { border-color: #6366f1; }
        .agenda-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #374151;
          cursor: pointer;
        }
        .agenda-error {
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 0.82rem;
          color: #dc2626;
        }
        .agenda-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #6366f1, #0ea5e9);
          color: #fff;
          border: none;
          padding: 11px 22px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          align-self: flex-end;
          transition: opacity 0.2s;
        }
        .agenda-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .agenda-btn:hover:not(:disabled) { opacity: 0.9; }
        .agenda-result { display: flex; flex-direction: column; gap: 18px; }
        .agenda-result-meta {}
        .agenda-result-title { font-size: 1.1rem; font-weight: 800; color: #1f2937; margin: 0 0 8px; }
        .agenda-result-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .agenda-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f3f4f6;
          color: #374151;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .agenda-timeline { display: flex; flex-direction: column; gap: 0; }
        .agenda-slot {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #f3f4f6;
          padding: 10px 0;
        }
        .agenda-slot-time {
          min-width: 110px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #6b7280;
          padding: 2px 10px 2px 8px;
          font-family: monospace;
        }
        .agenda-slot-content { flex: 1; }
        .agenda-slot-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.9rem;
          color: #1f2937;
          margin-bottom: 3px;
        }
        .agenda-slot-type {
          font-size: 0.7rem;
          padding: 2px 7px;
          border-radius: 20px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .agenda-slot-desc { font-size: 0.82rem; color: #6b7280; }
        .agenda-section { display: flex; flex-direction: column; gap: 8px; }
        .agenda-section-title {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
        }
        .agenda-list {
          padding-left: 18px;
          margin: 0;
          font-size: 0.87rem;
          color: #374151;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .agenda-resources { display: flex; flex-wrap: wrap; gap: 8px; }
        .agenda-resource-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f3f4f6;
          color: #1f2937;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.82rem;
          text-decoration: none;
          transition: background 0.2s;
        }
        .agenda-resource-link:hover { background: #e5e7eb; }
        .agenda-reset-btn {
          background: transparent;
          border: 1px solid #d1d5db;
          color: #6b7280;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.83rem;
          cursor: pointer;
          align-self: flex-start;
          transition: all 0.2s;
        }
        .agenda-reset-btn:hover { background: #f9fafb; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
