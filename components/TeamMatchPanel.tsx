"use client";

import { useState } from "react";
import { Users, Search, Plus, X, Star, Send, Loader2 } from "lucide-react";

interface Props {
  email: string;
  userName?: string;
}

export default function TeamMatchPanel({ email, userName }: Props) {
  const [tab, setTab] = useState<"find" | "post">("find");

  // Find tab state
  const [mySkills, setMySkills] = useState("");
  const [needSkills, setNeedSkills] = useState("");
  const [eventId, setEventId] = useState("");
  const [findLoading, setFindLoading] = useState(false);
  const [findResult, setFindResult] = useState("");
  const [findError, setFindError] = useState("");

  // Post tab state
  const [postSkills, setPostSkills] = useState("");
  const [postLooking, setPostLooking] = useState("");
  const [postDesc, setPostDesc] = useState("");
  const [postEventId, setPostEventId] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [postError, setPostError] = useState("");

  const handleFind = async () => {
    if (!mySkills || !needSkills) {
      setFindError("Please enter both your skills and what you're looking for.");
      return;
    }
    setFindError("");
    setFindLoading(true);
    setFindResult("");
    try {
      const res = await fetch("/api/ai/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userSkills: mySkills, lookingFor: needSkills, eventId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFindResult(data.ai_reply || "No matches found yet.");
    } catch (err: unknown) {
      setFindError(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setFindLoading(false);
    }
  };

  const handlePost = async () => {
    if (!postSkills || !postLooking || !postDesc || !postEventId) {
      setPostError("All fields are required.");
      return;
    }
    setPostError("");
    setPostLoading(true);
    setPostSuccess(false);
    try {
      const res = await fetch("/api/ai/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          eventId: postEventId,
          skills: postSkills,
          lookingFor: postLooking,
          description: postDesc,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPostSuccess(true);
      setPostSkills(""); setPostLooking(""); setPostDesc(""); setPostEventId("");
    } catch (err: unknown) {
      setPostError(err instanceof Error ? err.message : "Failed to post team request");
    } finally {
      setPostLoading(false);
    }
  };

  return (
    <div className="team-panel">
      <div className="team-header">
        <div className="team-header-title">
          <Users style={{ width: 18, height: 18 }} />
          AI Team Matchmaker
          <span className="team-badge">Feature 5</span>
        </div>
        <p className="team-subtitle">Find the perfect teammates or post your open team request.</p>
      </div>

      {/* Tabs */}
      <div className="team-tabs">
        <button
          type="button"
          className={`team-tab ${tab === "find" ? "active" : ""}`}
          onClick={() => setTab("find")}
        >
          <Search style={{ width: 14, height: 14 }} /> Find Teammates
        </button>
        <button
          type="button"
          className={`team-tab ${tab === "post" ? "active" : ""}`}
          onClick={() => setTab("post")}
        >
          <Plus style={{ width: 14, height: 14 }} /> Post Team Request
        </button>
      </div>

      {/* Find tab */}
      {tab === "find" && (
        <div className="team-body">
          <div className="team-form-row">
            <div className="team-form-group">
              <label className="team-label">
                <Star style={{ width: 12, height: 12 }} /> Skills I Offer
              </label>
              <input
                className="team-input"
                placeholder="e.g. React, Python, UI/UX Design"
                value={mySkills}
                onChange={(e) => setMySkills(e.target.value)}
              />
            </div>
            <div className="team-form-group">
              <label className="team-label">
                <Search style={{ width: 12, height: 12 }} /> Skills I Need
              </label>
              <input
                className="team-input"
                placeholder="e.g. ML, Backend Dev, DevOps"
                value={needSkills}
                onChange={(e) => setNeedSkills(e.target.value)}
              />
            </div>
          </div>
          <div className="team-form-group">
            <label className="team-label">Event ID (optional — filter by event)</label>
            <input
              className="team-input"
              placeholder="MongoDB event ID"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            />
          </div>
          {findError && <div className="team-error">{findError}</div>}
          <button
            type="button"
            className="team-btn"
            onClick={handleFind}
            disabled={findLoading}
          >
            {findLoading
              ? <><Loader2 style={{ width: 14, height: 14 }} className="spin" /> Finding matches...</>
              : <><Search style={{ width: 14, height: 14 }} /> Find Matches</>
            }
          </button>
          {findResult && !findLoading && (
            <div className="team-result" dangerouslySetInnerHTML={{ __html: findResult }} />
          )}
        </div>
      )}

      {/* Post tab */}
      {tab === "post" && (
        <div className="team-body">
          {postSuccess && (
            <div className="team-success">
              ✅ Your team request has been posted! Other students can now find you.
            </div>
          )}
          <div className="team-form-row">
            <div className="team-form-group">
              <label className="team-label">My Skills</label>
              <input
                className="team-input"
                placeholder="e.g. React, Node.js, Firebase"
                value={postSkills}
                onChange={(e) => setPostSkills(e.target.value)}
              />
            </div>
            <div className="team-form-group">
              <label className="team-label">Looking For</label>
              <input
                className="team-input"
                placeholder="e.g. ML Engineer, Data Scientist"
                value={postLooking}
                onChange={(e) => setPostLooking(e.target.value)}
              />
            </div>
          </div>
          <div className="team-form-group">
            <label className="team-label">Event ID *</label>
            <input
              className="team-input"
              placeholder="MongoDB ID of the event you need a team for"
              value={postEventId}
              onChange={(e) => setPostEventId(e.target.value)}
            />
          </div>
          <div className="team-form-group">
            <label className="team-label">Description</label>
            <textarea
              className="team-textarea"
              rows={3}
              placeholder="Tell potential teammates about your idea, your experience, and what kind of collaboration you're looking for..."
              value={postDesc}
              onChange={(e) => setPostDesc(e.target.value)}
            />
          </div>
          {postError && <div className="team-error">{postError}</div>}
          <button
            type="button"
            className="team-btn"
            onClick={handlePost}
            disabled={postLoading}
          >
            {postLoading
              ? <><Loader2 style={{ width: 14, height: 14 }} className="spin" /> Posting...</>
              : <><Send style={{ width: 14, height: 14 }} /> Post Request</>
            }
          </button>
        </div>
      )}

      <style>{`
        .team-panel {
          background: var(--card-bg, #fff);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .team-header {
          padding: 18px 22px 14px;
          background: linear-gradient(135deg, #0f172a, #1e3a5f);
          color: #fff;
        }
        .team-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 1rem;
          margin-bottom: 5px;
        }
        .team-badge {
          font-size: 0.65rem;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 2px 8px;
          border-radius: 20px;
        }
        .team-subtitle { font-size: 0.83rem; opacity: 0.7; margin: 0; }
        .team-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }
        .team-tab {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          background: transparent;
          border: none;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .team-tab.active { color: #6366f1; border-bottom-color: #6366f1; }
        .team-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
        .team-form-row { display: flex; gap: 14px; }
        .team-form-group { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .team-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #374151;
        }
        .team-input, .team-textarea {
          width: 100%;
          padding: 9px 13px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.87rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          resize: vertical;
        }
        .team-input:focus, .team-textarea:focus { border-color: #6366f1; }
        .team-error {
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 0.82rem;
          color: #dc2626;
        }
        .team-success {
          padding: 10px 14px;
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #065f46;
        }
        .team-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: #fff;
          border: none;
          padding: 10px 22px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          align-self: flex-end;
          transition: opacity 0.2s;
        }
        .team-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .team-btn:hover:not(:disabled) { opacity: 0.9; }
        .team-result {
          margin-top: 8px;
          padding: 16px;
          background: #f8faff;
          border: 1px solid #e0e7ff;
          border-radius: 12px;
          font-size: 0.88rem;
          line-height: 1.7;
          color: #1f2937;
        }
        .team-result a { color: #6366f1; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
