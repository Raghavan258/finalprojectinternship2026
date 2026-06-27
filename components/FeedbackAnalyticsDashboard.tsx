"use client";

import { useState } from "react";
import { BarChart2, Star, Send, Loader2, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";

interface FeedbackItem {
  text: string;
  rating?: number;
  user_name?: string;
}

interface AnalysisResult {
  overall_sentiment: string;
  average_rating?: number;
  sentiment_breakdown: { positive: number; neutral: number; negative: number };
  key_themes: string[];
  highlights: string[];
  complaints: string[];
  actionable_suggestions: string[];
}

interface Props {
  eventId?: string;
  eventTitle?: string;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#10b981",
  neutral: "#f59e0b",
  negative: "#ef4444",
  mixed: "#6366f1",
};

export default function FeedbackAnalyticsDashboard({ eventId, eventTitle }: Props) {
  const [tab, setTab] = useState<"analyze" | "submit">("analyze");
  const [eventIdInput, setEventIdInput] = useState(eventId || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  // Quick manual feedback entry
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([
    { text: "", rating: 5, user_name: "" },
  ]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleAnalyze = async () => {
    if (!eventIdInput) {
      setError("Please enter an Event ID.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: eventIdInput }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Make sure there is feedback for this event.");
    } finally {
      setLoading(false);
    }
  };

  const addFeedbackRow = () => {
    setFeedbackItems((prev) => [...prev, { text: "", rating: 5, user_name: "" }]);
  };

  const updateFeedbackRow = (i: number, field: keyof FeedbackItem, val: string | number) => {
    setFeedbackItems((prev) => {
      const copy = [...prev];
      (copy[i] as unknown as Record<string, unknown>)[field] = val;
      return copy;
    });
  };

  const removeFeedbackRow = (i: number) => {
    setFeedbackItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleManualAnalyze = async () => {
    const valid = feedbackItems.filter((f) => f.text.trim().length > 5);
    if (valid.length === 0) {
      setError("Please enter at least one feedback entry.");
      return;
    }
    setError("");
    setSubmitLoading(true);
    setResult(null);
    try {
      const res = await fetch("http://localhost:8000/ai/feedback-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_title: eventTitle || "Event",
          feedback_items: valid,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setSubmitSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const sentimentColor = SENTIMENT_COLORS[result?.overall_sentiment || ""] || "#6b7280";
  const total = result
    ? (result.sentiment_breakdown.positive + result.sentiment_breakdown.neutral + result.sentiment_breakdown.negative) || 1
    : 1;

  return (
    <div className="feedback-panel">
      <div className="feedback-header">
        <div className="feedback-title">
          <BarChart2 style={{ width: 18, height: 18 }} />
          AI Feedback Analytics
          <span className="feedback-badge">Feature 8</span>
        </div>
        <p className="feedback-subtitle">Sentiment analysis and actionable insights from attendee reviews.</p>
      </div>

      {/* Tabs */}
      <div className="feedback-tabs">
        <button
          type="button"
          className={`feedback-tab ${tab === "analyze" ? "active" : ""}`}
          onClick={() => setTab("analyze")}
        >
          Analyze by Event ID
        </button>
        <button
          type="button"
          className={`feedback-tab ${tab === "submit" ? "active" : ""}`}
          onClick={() => setTab("submit")}
        >
          Enter Feedback Manually
        </button>
      </div>

      <div className="feedback-body">
        {tab === "analyze" && (
          <div className="feedback-form">
            <label className="feedback-label">Event ID</label>
            <div className="feedback-input-row">
              <input
                className="feedback-input"
                placeholder="MongoDB event ID"
                value={eventIdInput}
                onChange={(e) => setEventIdInput(e.target.value)}
              />
              <button type="button" className="feedback-btn" onClick={handleAnalyze} disabled={loading}>
                {loading ? <Loader2 style={{ width: 14, height: 14 }} className="spin" /> : <BarChart2 style={{ width: 14, height: 14 }} />}
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>
        )}

        {tab === "submit" && (
          <div className="feedback-manual">
            {feedbackItems.map((item, i) => (
              <div key={i} className="feedback-manual-row">
                <div className="feedback-rating-group">
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="feedback-star"
                      style={{ color: star <= (item.rating || 0) ? "#f59e0b" : "#d1d5db" }}
                      onClick={() => updateFeedbackRow(i, "rating", star)}
                    >
                      <Star style={{ width: 16, height: 16 }} fill={star <= (item.rating || 0) ? "#f59e0b" : "none"} />
                    </button>
                  ))}
                </div>
                <input
                  className="feedback-input"
                  placeholder="Reviewer name (optional)"
                  value={item.user_name || ""}
                  onChange={(e) => updateFeedbackRow(i, "user_name", e.target.value)}
                  style={{ maxWidth: 180 }}
                />
                <input
                  className="feedback-input flex-1"
                  placeholder="Feedback text..."
                  value={item.text}
                  onChange={(e) => updateFeedbackRow(i, "text", e.target.value)}
                />
                {feedbackItems.length > 1 && (
                  <button type="button" className="feedback-remove" onClick={() => removeFeedbackRow(i)}>×</button>
                )}
              </div>
            ))}
            <div className="feedback-manual-actions">
              <button type="button" className="feedback-add-btn" onClick={addFeedbackRow}>+ Add Row</button>
              <button type="button" className="feedback-btn" onClick={handleManualAnalyze} disabled={submitLoading}>
                {submitLoading ? <><Loader2 style={{ width: 14, height: 14 }} className="spin" /> Analyzing...</> : <><Send style={{ width: 14, height: 14 }} /> Run Analysis</>}
              </button>
            </div>
          </div>
        )}

        {error && <div className="feedback-error">{error}</div>}

        {/* Results */}
        {result && !loading && (
          <div className="feedback-result">
            {/* Overall sentiment */}
            <div className="feedback-sentiment-card" style={{ borderLeft: `4px solid ${sentimentColor}` }}>
              <div className="feedback-sentiment-label">Overall Sentiment</div>
              <div className="feedback-sentiment-value" style={{ color: sentimentColor }}>
                {result.overall_sentiment.charAt(0).toUpperCase() + result.overall_sentiment.slice(1)}
              </div>
              {result.average_rating && (
                <div className="feedback-avg-rating">
                  Avg. Rating: <strong>{result.average_rating}/5</strong>
                  <Star style={{ width: 14, height: 14, color: "#f59e0b" }} fill="#f59e0b" />
                </div>
              )}
            </div>

            {/* Sentiment bar chart */}
            <div className="feedback-bar-chart">
              {(["positive", "neutral", "negative"] as const).map((key) => {
                const count = result.sentiment_breakdown[key] || 0;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key} className="feedback-bar-row">
                    <span className="feedback-bar-label" style={{ color: SENTIMENT_COLORS[key] }}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                    <div className="feedback-bar-track">
                      <div
                        className="feedback-bar-fill"
                        style={{ width: `${pct}%`, background: SENTIMENT_COLORS[key] }}
                      />
                    </div>
                    <span className="feedback-bar-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>

            {/* Key themes */}
            {result.key_themes.length > 0 && (
              <div className="feedback-section">
                <div className="feedback-section-title">
                  <TrendingUp style={{ width: 13, height: 13 }} /> Key Themes
                </div>
                <div className="feedback-themes">
                  {result.key_themes.map((t, i) => <span key={i} className="feedback-theme-tag">{t}</span>)}
                </div>
              </div>
            )}

            {/* Highlights */}
            {result.highlights.length > 0 && (
              <div className="feedback-section">
                <div className="feedback-section-title" style={{ color: "#10b981" }}>
                  ✅ Highlights
                </div>
                {result.highlights.map((h, i) => (
                  <div key={i} className="feedback-quote positive">"{h}"</div>
                ))}
              </div>
            )}

            {/* Complaints */}
            {result.complaints.length > 0 && (
              <div className="feedback-section">
                <div className="feedback-section-title" style={{ color: "#ef4444" }}>
                  <AlertCircle style={{ width: 13, height: 13 }} /> Issues Raised
                </div>
                {result.complaints.map((c, i) => (
                  <div key={i} className="feedback-quote negative">{c}</div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {result.actionable_suggestions.length > 0 && (
              <div className="feedback-section">
                <div className="feedback-section-title">
                  <Lightbulb style={{ width: 13, height: 13 }} /> Actionable Improvements
                </div>
                <ol className="feedback-suggestions">
                  {result.actionable_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .feedback-panel {
          background: var(--card-bg, #fff);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .feedback-header {
          padding: 18px 22px 14px;
          background: linear-gradient(135deg, #78350f, #92400e);
          color: #fff;
        }
        .feedback-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 1rem;
          margin-bottom: 5px;
        }
        .feedback-badge {
          font-size: 0.65rem;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 2px 8px;
          border-radius: 20px;
        }
        .feedback-subtitle { font-size: 0.83rem; opacity: 0.7; margin: 0; }
        .feedback-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }
        .feedback-tab {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          font-size: 0.83rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .feedback-tab.active { color: #92400e; border-bottom-color: #92400e; }
        .feedback-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
        .feedback-form { display: flex; flex-direction: column; gap: 8px; }
        .feedback-label { font-size: 0.78rem; font-weight: 700; color: #374151; }
        .feedback-input-row { display: flex; gap: 10px; }
        .feedback-input {
          flex: 1;
          padding: 9px 13px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.87rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .feedback-input:focus { border-color: #92400e; }
        .feedback-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #92400e, #b45309);
          color: #fff;
          border: none;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .feedback-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .feedback-btn:hover:not(:disabled) { opacity: 0.9; }
        .feedback-manual { display: flex; flex-direction: column; gap: 10px; }
        .feedback-manual-row {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .feedback-rating-group { display: flex; gap: 2px; }
        .feedback-star {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }
        .feedback-remove {
          background: #fee2e2;
          border: none;
          color: #dc2626;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .feedback-manual-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .feedback-add-btn {
          background: transparent;
          border: 1px dashed #d1d5db;
          color: #6b7280;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.83rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .feedback-add-btn:hover { border-color: #9ca3af; color: #374151; }
        .feedback-error {
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 0.82rem;
          color: #dc2626;
        }
        .feedback-result { display: flex; flex-direction: column; gap: 16px; }
        .feedback-sentiment-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 18px;
          background: #fafafa;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .feedback-sentiment-label { font-size: 0.78rem; font-weight: 700; color: #6b7280; }
        .feedback-sentiment-value { font-size: 1.2rem; font-weight: 800; }
        .feedback-avg-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          color: #374151;
          margin-left: auto;
        }
        .feedback-bar-chart { display: flex; flex-direction: column; gap: 8px; }
        .feedback-bar-row { display: flex; align-items: center; gap: 10px; }
        .feedback-bar-label { min-width: 70px; font-size: 0.78rem; font-weight: 700; }
        .feedback-bar-track { flex: 1; height: 10px; background: #f3f4f6; border-radius: 5px; overflow: hidden; }
        .feedback-bar-fill { height: 100%; border-radius: 5px; transition: width 0.5s; }
        .feedback-bar-pct { min-width: 36px; font-size: 0.75rem; color: #6b7280; text-align: right; }
        .feedback-section { display: flex; flex-direction: column; gap: 8px; }
        .feedback-section-title {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
        }
        .feedback-themes { display: flex; flex-wrap: wrap; gap: 6px; }
        .feedback-theme-tag {
          background: #f3f4f6;
          color: #374151;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .feedback-quote {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-style: italic;
          line-height: 1.5;
        }
        .feedback-quote.positive { background: #ecfdf5; color: #065f46; border-left: 3px solid #10b981; }
        .feedback-quote.negative { background: #fef2f2; color: #7f1d1d; border-left: 3px solid #ef4444; }
        .feedback-suggestions {
          padding-left: 18px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 0.87rem;
          color: #374151;
        }
        .flex-1 { flex: 1; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
