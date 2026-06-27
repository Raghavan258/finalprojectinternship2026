"use client";

import { useState } from "react";
import { FlaskConical, Loader2, ChevronRight } from "lucide-react";

interface Props {
  defaultEventId?: string;
  defaultEventTheme?: string;
}

const SCORE_COLOR = (score: number) =>
  score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : "#ef4444";

const VIABILITY_COLOR: Record<string, string> = {
  Strong: "#10b981",
  Moderate: "#f59e0b",
  "Needs Work": "#ef4444",
};

export default function IdeaEvaluator({ defaultEventId, defaultEventTheme }: Props) {
  const [abstract, setAbstract] = useState("");
  const [eventId, setEventId] = useState(defaultEventId || "");
  const [eventTheme, setEventTheme] = useState(defaultEventTheme || "");
  const [teamSkills, setTeamSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleEvaluate = async () => {
    if (!abstract.trim() || abstract.length < 20) {
      setError("Please write at least 2-3 sentences describing your idea.");
      return;
    }
    setError("");
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abstract, eventId, eventTheme, teamSkills }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.ai_feedback || "Evaluation complete.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Evaluation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="evaluator-panel">
      <div className="evaluator-header">
        <div className="evaluator-title">
          <FlaskConical style={{ width: 18, height: 18 }} />
          AI Idea Evaluator
          <span className="evaluator-badge">Feature 6</span>
        </div>
        <p className="evaluator-subtitle">
          Get pre-submission feedback and a viability score for your hackathon idea.
        </p>
      </div>

      <div className="evaluator-body">
        <div className="evaluator-form-group">
          <label className="evaluator-label">
            📝 Your Project Abstract / Idea *
          </label>
          <textarea
            className="evaluator-textarea"
            rows={5}
            placeholder="Describe your project idea: What problem does it solve? What's your solution? What technology will you use? What impact will it have?"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
          />
          <div className="evaluator-word-count" style={{ color: abstract.split(" ").filter(Boolean).length < 30 ? "#f59e0b" : "#10b981" }}>
            {abstract.split(" ").filter(Boolean).length} words
            {abstract.split(" ").filter(Boolean).length < 30 && " (aim for 80+ words for best results)"}
          </div>
        </div>

        <button
          type="button"
          className="evaluator-advanced-toggle"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? "▾" : "▸"} Optional: Event Context
        </button>

        {showAdvanced && (
          <div className="evaluator-advanced">
            <div className="evaluator-form-row">
              <div className="evaluator-form-group flex-1">
                <label className="evaluator-label">Event ID (for auto-fill context)</label>
                <input
                  className="evaluator-input"
                  placeholder="MongoDB event ID"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                />
              </div>
              <div className="evaluator-form-group flex-1">
                <label className="evaluator-label">Event Theme</label>
                <input
                  className="evaluator-input"
                  placeholder="e.g. AI for Healthcare, Sustainability"
                  value={eventTheme}
                  onChange={(e) => setEventTheme(e.target.value)}
                />
              </div>
            </div>
            <div className="evaluator-form-group">
              <label className="evaluator-label">Team Skills (for feasibility scoring)</label>
              <input
                className="evaluator-input"
                placeholder="e.g. React, Python, ML, Cloud"
                value={teamSkills}
                onChange={(e) => setTeamSkills(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && <div className="evaluator-error">{error}</div>}

        <button
          type="button"
          className="evaluator-btn"
          onClick={handleEvaluate}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 style={{ width: 14, height: 14 }} className="spin" /> Evaluating...</>
          ) : (
            <><FlaskConical style={{ width: 14, height: 14 }} /> Evaluate My Idea <ChevronRight style={{ width: 14, height: 14 }} /></>
          )}
        </button>

        {result && !loading && (
          <div className="evaluator-result">
            <div className="evaluator-result-header">
              🎯 AI Evaluation Report
            </div>
            <div
              className="evaluator-result-body"
              dangerouslySetInnerHTML={{ __html: result }}
            />
          </div>
        )}
      </div>

      <style>{`
        .evaluator-panel {
          background: var(--card-bg, #fff);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .evaluator-header {
          padding: 18px 22px 14px;
          background: linear-gradient(135deg, #064e3b, #065f46);
          color: #fff;
        }
        .evaluator-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 1rem;
          margin-bottom: 5px;
        }
        .evaluator-badge {
          font-size: 0.65rem;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 2px 8px;
          border-radius: 20px;
        }
        .evaluator-subtitle { font-size: 0.83rem; opacity: 0.7; margin: 0; }
        .evaluator-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
        .evaluator-form-group { display: flex; flex-direction: column; gap: 5px; }
        .evaluator-form-row { display: flex; gap: 14px; }
        .flex-1 { flex: 1; }
        .evaluator-label { font-size: 0.8rem; font-weight: 700; color: #374151; }
        .evaluator-textarea, .evaluator-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 0.87rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          resize: vertical;
          box-sizing: border-box;
        }
        .evaluator-textarea:focus, .evaluator-input:focus { border-color: #059669; }
        .evaluator-word-count { font-size: 0.75rem; font-weight: 600; }
        .evaluator-advanced-toggle {
          background: transparent;
          border: none;
          font-size: 0.83rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          text-align: left;
          padding: 0;
          transition: color 0.2s;
        }
        .evaluator-advanced-toggle:hover { color: #374151; }
        .evaluator-advanced { display: flex; flex-direction: column; gap: 12px; }
        .evaluator-error {
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 0.82rem;
          color: #dc2626;
        }
        .evaluator-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #059669, #10b981);
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
        .evaluator-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .evaluator-btn:hover:not(:disabled) { opacity: 0.9; }
        .evaluator-result {
          border: 1px solid #d1fae5;
          border-radius: 12px;
          overflow: hidden;
        }
        .evaluator-result-header {
          padding: 10px 16px;
          background: linear-gradient(135deg, #064e3b, #065f46);
          color: #fff;
          font-size: 0.88rem;
          font-weight: 700;
        }
        .evaluator-result-body {
          padding: 16px;
          font-size: 0.88rem;
          line-height: 1.75;
          color: #1f2937;
        }
        .evaluator-result-body a { color: #059669; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
