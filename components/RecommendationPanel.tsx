"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, ChevronRight, Tag, Users, MapPin, Calendar } from "lucide-react";

interface RecommendedEvent {
  event: {
    id: string;
    title: string;
    category: string;
    location: string;
    date: string;
    price: string;
    teamSize: string;
    featured: boolean;
    tags: string[];
  };
  relevance_score: number;
  match_reasons: string[];
}

interface Props {
  email: string;
  userName?: string;
}

export default function RecommendationPanel({ email, userName }: Props) {
  const [loading, setLoading] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({ skills: "", interests: "", department: "" });
  const [showForm, setShowForm] = useState(false);

  const fetchRecommendations = async (overrideProfile?: typeof profileForm) => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const method = overrideProfile ? "POST" : "GET";
      const url = overrideProfile
        ? "/api/ai/recommend"
        : `/api/ai/recommend?email=${encodeURIComponent(email)}`;

      const res = await fetch(url, {
        method,
        headers: overrideProfile ? { "Content-Type": "application/json" } : undefined,
        body: overrideProfile
          ? JSON.stringify({ email, ...overrideProfile })
          : undefined,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiReply(data.ai_reply || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
    fetchRecommendations(profileForm);
  };

  return (
    <div className="ai-panel rec-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Sparkles className="ai-panel-icon" />
          <span>AI Recommendations — For You</span>
        </div>
        <div className="ai-panel-actions">
          <button
            type="button"
            className="ai-panel-btn secondary"
            onClick={() => setShowForm((v) => !v)}
          >
            Update Profile
          </button>
          <button
            type="button"
            className="ai-panel-btn"
            onClick={() => fetchRecommendations()}
            disabled={loading}
          >
            <RefreshCw style={{ width: 14, height: 14 }} className={loading ? "spin" : ""} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Profile update form */}
      {showForm && (
        <form className="ai-profile-form" onSubmit={handleProfileSubmit}>
          <div className="ai-form-row">
            <input
              className="ai-form-input"
              placeholder="Your skills (e.g. React, Python, ML)"
              value={profileForm.skills}
              onChange={(e) => setProfileForm((p) => ({ ...p, skills: e.target.value }))}
            />
            <input
              className="ai-form-input"
              placeholder="Interests (e.g. AI, sustainability)"
              value={profileForm.interests}
              onChange={(e) => setProfileForm((p) => ({ ...p, interests: e.target.value }))}
            />
            <input
              className="ai-form-input"
              placeholder="Department (e.g. Computer Science)"
              value={profileForm.department}
              onChange={(e) => setProfileForm((p) => ({ ...p, department: e.target.value }))}
            />
          </div>
          <button type="submit" className="ai-panel-btn" style={{ alignSelf: "flex-end" }}>
            Get Recommendations →
          </button>
        </form>
      )}

      {/* Content */}
      <div className="ai-panel-body">
        {loading && (
          <div className="ai-loading">
            <div className="ai-loading-dots">
              <span /><span /><span />
            </div>
            <p>ConnectAI is analyzing your profile...</p>
          </div>
        )}

        {error && !loading && (
          <div className="ai-error">
            <p>⚠️ {error}</p>
            <button type="button" className="ai-panel-btn" onClick={() => fetchRecommendations()}>
              Try again
            </button>
          </div>
        )}

        {aiReply && !loading && (
          <div className="ai-reply-content" dangerouslySetInnerHTML={{ __html: aiReply }} />
        )}

        {!aiReply && !loading && !error && (
          <div className="ai-empty">
            <Sparkles style={{ width: 32, height: 32, opacity: 0.3 }} />
            <p>Update your profile to get personalized event recommendations!</p>
            <button
              type="button"
              className="ai-panel-btn"
              onClick={() => setShowForm(true)}
            >
              Set Up Profile <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .ai-panel {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .ai-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
        }
        .ai-panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 0.95rem;
        }
        .ai-panel-icon { width: 18px; height: 18px; }
        .ai-panel-actions { display: flex; gap: 8px; }
        .ai-panel-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-panel-btn:hover { background: rgba(255,255,255,0.25); }
        .ai-panel-btn.secondary { background: transparent; }
        .ai-panel-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .ai-profile-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: #f8f7ff;
        }
        .ai-form-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .ai-form-input {
          flex: 1;
          min-width: 160px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.85rem;
          outline: none;
        }
        .ai-form-input:focus { border-color: #6366f1; }
        .ai-panel-body { padding: 20px; min-height: 120px; }
        .ai-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px;
          color: #6b7280;
          font-size: 0.9rem;
        }
        .ai-loading-dots { display: flex; gap: 6px; }
        .ai-loading-dots span {
          width: 8px; height: 8px;
          background: #6366f1;
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .ai-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .ai-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
        .ai-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          color: #dc2626;
          font-size: 0.9rem;
          text-align: center;
        }
        .ai-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px;
          color: #6b7280;
          font-size: 0.9rem;
          text-align: center;
        }
        .ai-reply-content {
          font-size: 0.92rem;
          line-height: 1.7;
          color: var(--text, #1f2937);
        }
        .ai-reply-content a { color: #6366f1; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
