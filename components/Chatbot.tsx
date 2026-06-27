"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, X, Send, MessageSquare, RotateCcw } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  isHtml?: boolean;
}

const PARTICIPANT_SUGGESTIONS = [
  { label: "Find hackathons", text: "Find hackathons in my city" },
  { label: "Navigate to dashboard", text: "How do I get to my dashboard?" },
  { label: "Team matching", text: "Help me find teammates for a hackathon" },
  { label: "Evaluate my idea", text: "Evaluate my hackathon project idea" },
  { label: "Translate event", text: "Show me events in Hindi" },
  { label: "Recommend events", text: "Recommend events for a Python developer" },
];

const ORGANIZER_SUGGESTIONS = [
  { label: "Create an Event", text: "How do I create a new event?" },
  { label: "Analyze Feedback", text: "How do I analyze post-event feedback?" },
  { label: "Generate Agenda", text: "Help me generate a workshop agenda" },
  { label: "AI Copilot", text: "What is the AI Copilot?" },
  { label: "Navigate to dashboard", text: "Take me to my organizer dashboard" },
];

export default function Chatbot() {
  const [role, setRole] = useState("participant");

  useEffect(() => {
    const updateRole = () => {
      setRole(localStorage.getItem("userRole") || "participant");
    };
    updateRole();
    window.addEventListener("authChange", updateRole);
    return () => window.removeEventListener("authChange", updateRole);
  }, []);

  const isOrganizer = role === "organizer";
  const QUICK_SUGGESTIONS = isOrganizer ? ORGANIZER_SUGGESTIONS : PARTICIPANT_SUGGESTIONS;

  const initialMessage = isOrganizer
    ? `Hi! I'm <strong>ConnectAI</strong>, your Organizer Assistant 👋<br><br>I can help you:<br><ul><li>📝 Create and manage listings</li><li>🤖 Use the AI Copilot</li><li>📊 Analyze participant feedback</li><li>🗓️ Generate workshop agendas</li></ul>What can I help you with?`
    : `Hi! I'm <strong>ConnectAI</strong> 👋<br>Your intelligent assistant for ConnectMyEvent.<br><br>I can help you:<br><ul><li>🧭 Navigate the platform</li><li>🎯 Find personalized events</li><li>🌐 Translate event content</li><li>👥 Find teammates</li><li>💡 Evaluate your hackathon ideas</li><li>⚡ And much more!</li></ul>What can I help you with?`;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [{ id: "init", text: initialMessage, sender: "bot", isHtml: true }];
      }
      return prev;
    });
  }, [initialMessage]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    if (!textToSend) setInput("");
    setShowSuggestions(false);

    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, text, sender: "user" }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, user_role: role }),
      });
      const data = await res.json();

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: data.reply || "Sorry, I didn't get a response.",
          sender: "bot",
          isHtml: true,
        },
      ]);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I ran into a connection issue. Please try again or <a href='/events' style='color:#6366f1; font-weight:bold;'>browse events manually →</a>",
          sender: "bot",
          isHtml: true,
        },
      ]);
    }
  };

  const handleReset = async () => {
    try {
      await fetch("http://localhost:8000/chat/reset", { method: "POST" });
    } catch {}
    setMessages([
      {
        id: "reset",
        text: initialMessage,
        sender: "bot",
        isHtml: true,
      },
    ]);
    setShowSuggestions(true);
  };

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <div className="chatbot-panel open">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <Bot style={{ width: 18, height: 18, marginRight: "6px" }} />
              ConnectAI Assistant
              <span className="chatbot-header-badge">AI Powered</span>
            </div>
            <div className="chatbot-header-actions">
              <button type="button" className="chatbot-reset" onClick={handleReset} title="Reset chat">
                <RotateCcw style={{ width: 14, height: 14 }} />
              </button>
              <button type="button" className="chatbot-close" onClick={() => setIsOpen(false)}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((msg) =>
              msg.isHtml ? (
                <div
                  key={msg.id}
                  className={`chatbot-msg ${msg.sender}`}
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />
              ) : (
                <div key={msg.id} className={`chatbot-msg ${msg.sender}`}>
                  {msg.text}
                </div>
              )
            )}

            {isTyping && (
              <div className="chatbot-msg bot typing-indicator-msg">
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            {/* Quick suggestions — shown only at start */}
            {showSuggestions && messages.length <= 1 && (
              <div className="chatbot-suggestions-grid">
                <div className="chatbot-suggestions-label">💡 Quick Actions</div>
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="chatbot-suggestion"
                    onClick={() => handleSend(s.text)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              type="text"
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about events, teams, navigation..."
              id="chatbot-message-input"
            />
            <button
              type="button"
              className="chatbot-send"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              id="chatbot-send-btn"
            >
              <Send style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Chat"
        id="chatbot-toggle-btn"
      >
        {isOpen ? <X style={{ width: 22, height: 22 }} /> : <MessageSquare style={{ width: 22, height: 22 }} />}
        {!isOpen && <span className="chatbot-toggle-label" style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "0.02em" }}>Ask AI</span>}
      </button>
    </div>
  );
}
