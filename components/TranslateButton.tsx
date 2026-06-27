"use client";

import { useState } from "react";
import { Languages, Loader2, X } from "lucide-react";

const LANGUAGES = [
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "fr", label: "Français (French)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "de", label: "Deutsch (German)" },
];

interface Props {
  eventId: string;
  eventTitle: string;
}

export default function TranslateButton({ eventId, eventTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [translatedContent, setTranslatedContent] = useState("");
  const [selectedLang, setSelectedLang] = useState("");
  const [error, setError] = useState("");

  const handleTranslate = async (langLabel: string) => {
    setLoading(true);
    setError("");
    setSelectedLang(langLabel);
    setOpen(false);
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, language: langLabel }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranslatedContent(data.translated_reply || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="translate-wrap">
      <div className="translate-trigger-row">
        <button
          type="button"
          className="translate-btn"
          onClick={() => setOpen((v) => !v)}
        >
          <Languages style={{ width: 16, height: 16 }} />
          {selectedLang ? `Showing in ${selectedLang}` : "Translate Event"}
        </button>
        {selectedLang && (
          <button
            type="button"
            className="translate-reset"
            onClick={() => { setTranslatedContent(""); setSelectedLang(""); }}
            title="Clear translation"
          >
            <X style={{ width: 14, height: 14 }} /> Original
          </button>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <div className="translate-loading">
            <Loader2 style={{ width: 14, height: 14 }} className="spin" />
            Translating to {selectedLang}...
          </div>
        )}
      </div>

      {/* Language picker dropdown */}
      {open && (
        <div className="translate-dropdown">
          <div className="translate-dropdown-header">Choose language</div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className="translate-lang-opt"
              onClick={() => handleTranslate(lang.label.split(" (")[1].replace(")", ""))}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <div className="translate-error">{error}</div>}

      {/* Translated output Modal */}
      {translatedContent && !loading && (
        <div className="modal-backdrop open" style={{ zIndex: 1050 }}>
          <div className="modal" style={{ width: "100%", maxWidth: "680px" }}>
            <div className="modal-header" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "1.1rem" }}>
                <Languages style={{ width: 20, height: 20 }} />
                Translated to {selectedLang}
              </div>
              <button
                type="button"
                onClick={() => { setTranslatedContent(""); setSelectedLang(""); }}
                title="Close translation"
                style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", opacity: 0.8, display: "flex", alignItems: "center" }}
              >
                <X style={{ width: 22, height: 22 }} />
              </button>
            </div>
            <div
              className="modal-body"
              style={{ padding: "32px", fontSize: "0.95rem", lineHeight: 1.8, color: "var(--text-main)" }}
              dangerouslySetInnerHTML={{ __html: translatedContent }}
            />
          </div>
        </div>
      )}

      <style>{`
        .translate-wrap { position: relative; }
        .translate-trigger-row { display: flex; align-items: center; gap: 8px; }
        .translate-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .translate-btn:hover { opacity: 0.9; }
        .translate-reset {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid #d1d5db;
          color: #6b7280;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .translate-reset:hover { background: #f3f4f6; }
        .translate-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 50;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          min-width: 220px;
          overflow: hidden;
        }
        .translate-dropdown-header {
          padding: 10px 16px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7280;
          border-bottom: 1px solid #f3f4f6;
        }
        .translate-lang-opt {
          display: block;
          width: 100%;
          padding: 10px 16px;
          text-align: left;
          background: transparent;
          border: none;
          font-size: 0.88rem;
          cursor: pointer;
          color: #1f2937;
          transition: background 0.15s;
        }
        .translate-lang-opt:hover { background: #f3f4f6; }
        .translate-loading {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-left: 8px;
          font-size: 0.8rem;
          color: #fff;
          background: rgba(255, 255, 255, 0.2);
          padding: 6px 12px;
          border-radius: 20px;
          backdrop-filter: blur(8px);
        }
        .translate-error {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 50;
          padding: 10px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #dc2626;
          white-space: nowrap;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
