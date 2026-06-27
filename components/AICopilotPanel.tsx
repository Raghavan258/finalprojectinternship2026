"use client";

import { useState } from "react";
import { Bot, Wand2, Tag, Clock, Users, Trophy, ChevronRight, Loader2, CheckCircle } from "lucide-react";

interface CopilotResult {
  title: string;
  description: string;
  problem_statement: string;
  evaluation_criteria: string[];
  suggested_tags: string[];
  timeline_suggestion: Array<{ phase: string; duration: string; description: string }>;
  team_size: string;
  suggested_prizes: string;
}

interface Props {
  organizerName?: string;
  onApply?: (result: CopilotResult) => void;
}

export default function AICopilotPanel({ organizerName, onApply }: Props) {
  const [step, setStep] = useState<"input" | "loading" | "result">("input");
  const [form, setForm] = useState({
    idea: "",
    tech_stack: "",
    rules: "",
    category: "hackathon",
    target_audience: "students",
  });
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!form.idea.trim() || form.idea.length < 10) {
      setError("Please describe your event idea in at least 10 characters.");
      return;
    }
    setError("");
    setStep("loading");
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, organizer_name: organizerName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
      setStep("input");
    }
  };

  const handleApply = () => {
    if (result && onApply) onApply(result);
  };

  return (
    <div className="copilot-panel">
      {/* Header */}
      <div className="copilot-header">
        <div className="copilot-header-title">
          <Bot style={{ width: 20, height: 20 }} />
          AI Organizer Copilot
          <span className="copilot-badge">Feature 4</span>
        </div>
        <p className="copilot-subtitle">
          Transform a rough idea into a professional event listing in seconds.
        </p>
      </div>

      {/* Step: Input */}
      {step === "input" && (
        <div className="copilot-body">
          <div className="copilot-form-group">
            <label className="copilot-label">
              <Wand2 style={{ width: 14, height: 14 }} /> Your Event Idea *
            </label>
            <textarea
              className="copilot-textarea"
              placeholder="e.g. A 24-hour hackathon focused on sustainability and climate tech, targeting engineering students..."
              rows={4}
              value={form.idea}
              onChange={(e) => setForm((f) => ({ ...f, idea: e.target.value }))}
            />
          </div>
          <div className="copilot-form-row">
            <div className="copilot-form-group flex-1">
              <label className="copilot-label">Tech Stack / Domain</label>
              <input
                className="copilot-input"
                placeholder="e.g. React, Python, IoT, ML"
                value={form.tech_stack}
                onChange={(e) => setForm((f) => ({ ...f, tech_stack: e.target.value }))}
              />
            </div>
            <div className="copilot-form-group flex-1">
              <label className="copilot-label">Category</label>
              <select
                className="copilot-input"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="hackathon">Hackathon</option>
                <option value="workshop">Workshop</option>
                <option value="jobfair">Job Fair</option>
                <option value="startup">Startup Pitch</option>
                <option value="mentorship">Mentorship</option>
                <option value="cultural">Cultural Event</option>
              </select>
            </div>
          </div>
          <div className="copilot-form-group">
            <label className="copilot-label">Draft Rules (optional)</label>
            <textarea
              className="copilot-textarea"
              placeholder="e.g. Teams of 2-4, all students, solutions must use open-source tech..."
              rows={2}
              value={form.rules}
              onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
            />
          </div>
          {error && <div className="copilot-error">{error}</div>}
          <button type="button" className="copilot-generate-btn" onClick={handleGenerate}>
            <Wand2 style={{ width: 16, height: 16 }} /> Generate Event Listing
          </button>
        </div>
      )}

      {/* Step: Loading */}
      {step === "loading" && (
        <div className="copilot-loading">
          <div className="copilot-loading-ring">
            <Loader2 style={{ width: 32, height: 32 }} className="spin" />
          </div>
          <p className="copilot-loading-text">ConnectAI Copilot is crafting your event...</p>
          <div className="copilot-loading-steps">
            <div className="copilot-loading-step">✅ Analyzing your idea</div>
            <div className="copilot-loading-step">⏳ Generating description</div>
            <div className="copilot-loading-step">⏳ Creating evaluation criteria</div>
            <div className="copilot-loading-step">⏳ Suggesting tags & timeline</div>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && result && (
        <div className="copilot-result">
          <div className="copilot-result-header">
            <CheckCircle style={{ width: 18, height: 18, color: "#10b981" }} />
            <strong>Event listing generated!</strong>
          </div>

          <div className="copilot-result-section">
            <div className="copilot-result-label">📌 Title</div>
            <div className="copilot-result-title">{result.title}</div>
          </div>

          <div className="copilot-result-section">
            <div className="copilot-result-label">📝 Description</div>
            <div className="copilot-result-text" dangerouslySetInnerHTML={{ __html: result.description }} />
          </div>

          <div className="copilot-result-section">
            <div className="copilot-result-label">🎯 Problem Statement</div>
            <div className="copilot-result-text">{result.problem_statement}</div>
          </div>

          <div className="copilot-result-row">
            <div className="copilot-result-section flex-1">
              <div className="copilot-result-label">
                <Tag style={{ width: 12, height: 12 }} /> Suggested Tags
              </div>
              <div className="copilot-tags">
                {result.suggested_tags.map((tag) => (
                  <span key={tag} className="copilot-tag">{tag}</span>
                ))}
              </div>
            </div>
            <div className="copilot-result-section flex-1">
              <div className="copilot-result-label">
                <Users style={{ width: 12, height: 12 }} /> Team Size · <Trophy style={{ width: 12, height: 12 }} /> Prizes
              </div>
              <div className="copilot-result-text">
                <strong>{result.team_size}</strong><br />
                {result.suggested_prizes}
              </div>
            </div>
          </div>

          <div className="copilot-result-section">
            <div className="copilot-result-label">
              <CheckCircle style={{ width: 12, height: 12 }} /> Evaluation Criteria
            </div>
            <ol className="copilot-criteria">
              {result.evaluation_criteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          </div>

          <div className="copilot-result-section">
            <div className="copilot-result-label">
              <Clock style={{ width: 12, height: 12 }} /> Timeline Suggestion
            </div>
            <div className="copilot-timeline">
              {result.timeline_suggestion.map((phase, i) => (
                <div key={i} className="copilot-timeline-item">
                  <div className="copilot-timeline-dot" />
                  <div>
                    <strong>{phase.phase}</strong> · {phase.duration}
                    <p>{phase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="copilot-result-actions">
            <button type="button" className="copilot-reset-btn" onClick={() => setStep("input")}>
              Try Again
            </button>
            {onApply && (
              <button type="button" className="copilot-apply-btn" onClick={handleApply}>
                Apply to Event Form <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        .copilot-panel {
          background: var(--card-bg, #fff);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .copilot-header {
          padding: 20px 24px 16px;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          color: #fff;
        }
        .copilot-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 1.05rem;
          margin-bottom: 6px;
        }
        .copilot-badge {
          font-size: 0.65rem;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 600;
        }
        .copilot-subtitle { font-size: 0.85rem; opacity: 0.75; margin: 0; }
        .copilot-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
        .copilot-form-group { display: flex; flex-direction: column; gap: 6px; }
        .copilot-form-row { display: flex; gap: 16px; }
        .flex-1 { flex: 1; }
        .copilot-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #374151;
        }
        .copilot-input, .copilot-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 0.88rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          resize: vertical;
          box-sizing: border-box;
        }
        .copilot-input:focus, .copilot-textarea:focus { border-color: #6366f1; }
        .copilot-error {
          padding: 10px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #dc2626;
        }
        .copilot-generate-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          align-self: flex-end;
          transition: opacity 0.2s;
        }
        .copilot-generate-btn:hover { opacity: 0.9; }
        .copilot-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px;
        }
        .copilot-loading-ring { color: #6366f1; }
        .copilot-loading-text { font-weight: 600; color: #374151; }
        .copilot-loading-steps {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.85rem;
          color: #6b7280;
        }
        .copilot-result { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
        .copilot-result-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #065f46;
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          border-radius: 8px;
          padding: 10px 14px;
        }
        .copilot-result-section { display: flex; flex-direction: column; gap: 8px; }
        .copilot-result-row { display: flex; gap: 20px; }
        .copilot-result-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
        }
        .copilot-result-title { font-size: 1.2rem; font-weight: 800; color: #1f2937; }
        .copilot-result-text { font-size: 0.9rem; line-height: 1.65; color: #374151; }
        .copilot-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .copilot-tag {
          background: #ede9fe;
          color: #5b21b6;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .copilot-criteria {
          padding-left: 20px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.88rem;
          color: #374151;
        }
        .copilot-timeline { display: flex; flex-direction: column; gap: 12px; }
        .copilot-timeline-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .copilot-timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #6366f1;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .copilot-timeline-item p { margin: 2px 0 0; font-size: 0.82rem; color: #6b7280; }
        .copilot-result-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 8px;
          border-top: 1px solid #f3f4f6;
        }
        .copilot-reset-btn {
          background: transparent;
          border: 1px solid #d1d5db;
          color: #6b7280;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .copilot-reset-btn:hover { background: #f9fafb; }
        .copilot-apply-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .copilot-apply-btn:hover { opacity: 0.9; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
