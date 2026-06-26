"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, X, Send, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  isHtml?: boolean;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      text: "Hi! I'm your AI assistant 👋<br>Ask me about events, registration, teams — anything!",
      sender: "bot",
      isHtml: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, text, sender: "user" }]);
    setIsTyping(true);

    try {
      // Query events API
      const res = await fetch(`/api/chatbot?q=${encodeURIComponent(text)}`);
      const data = await res.json();
      
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: "bot",
          isHtml: true,
        },
      ]);
    } catch (error) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I had trouble connecting. You can browse all events manually on our Browse Events page.",
          sender: "bot",
        },
      ]);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <div className="chatbot-panel open">
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <Bot style={{ width: "18px", height: "18px", marginRight: "6px" }} /> ConnectAI Assistant
            </div>
            <button type="button" className="chatbot-close" onClick={() => setIsOpen(false)}>
              <X style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
          
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
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            
            <div className="chatbot-suggestions">
              <button type="button" className="chatbot-suggestion" onClick={() => handleSuggestion("Find hackathons")}>
                Find hackathons
              </button>
              <button type="button" className="chatbot-suggestion" onClick={() => handleSuggestion("How to register?")}>
                How to register?
              </button>
              <button type="button" className="chatbot-suggestion" onClick={() => handleSuggestion("Host an event")}>
                Host an event
              </button>
            </div>
          </div>

          <div className="chatbot-input-area">
            <input
              type="text"
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about events..."
            />
            <button type="button" className="chatbot-send" onClick={() => handleSend()}>
              <Send style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        </div>
      )}

      <button type="button" className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Open AI Chat">
        <MessageSquare style={{ width: "22px", height: "22px" }} />
      </button>
    </div>
  );
}
