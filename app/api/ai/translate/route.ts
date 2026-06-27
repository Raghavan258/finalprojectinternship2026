import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://connectmyevent.vercel.app";

/**
 * Feature 3 — Multilingual Event Content Translator
 * POST /api/ai/translate
 * Body: { eventId, language }
 * Returns AI-translated event content in the user's preferred language natively using Next.js.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, language } = body;

    if (!eventId || !language) {
      return NextResponse.json(
        { error: "eventId and language are required" },
        { status: 400 }
      );
    }

    // Fetch the event directly from DB for accurate data
    const event = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let aiData;
    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error("Missing OPENROUTER_API_KEY");
      }

      const prompt = `You are a professional translator for ConnectMyEvent. Translate the following event details into ${language}.
Present the translation in a clear, beautiful HTML format (use <h3>, <p>, <strong>, <ul><li> etc.). 
Do NOT wrap your response in markdown code blocks (like \`\`\`html). Just return the raw HTML string directly.

Event Details:
Title: ${event.title}
Description: ${event.description || "N/A"}
Location: ${event.location || "N/A"}
Date: ${event.date || "N/A"}
Format: ${event.format || "N/A"}
Prizes: ${event.prizes || "N/A"}
Team Size: ${event.teamSize || "N/A"}`;

      const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": APP_URL,
          "X-Title": "ConnectMyEvent",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        throw new Error(`OpenRouter API error: ${aiRes.status} ${errText}`);
      }

      const aiResponseData = await aiRes.json();
      const rawHtml = aiResponseData.choices?.[0]?.message?.content || "Translation failed to generate.";
      
      // Clean up potential markdown formatting that the LLM might have returned
      const cleanHtml = rawHtml.replace(/^```html\n?/, "").replace(/\n?```$/, "");
      
      aiData = { reply: cleanHtml };
      
    } catch (e: any) {
      console.warn("Native translation failed. Using fallback translation.", e);
      aiData = {
        reply: `
          <div style="padding: 1rem; background: var(--bg-elevated); border: 1px dashed var(--border-color); border-radius: 8px; margin-top: 1rem;">
            <h3 style="color: var(--main-text); margin-top: 0;">[Translated to ${language}] ${event.title}</h3>
            <p><strong>Description:</strong> ${event.description}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Date:</strong> ${event.date}</p>
            <hr style="border-color: var(--border-color); margin: 1rem 0;" />
            <p style="font-size: 0.8rem; color: var(--secondary-text); margin-bottom: 0;"><em>Note: This is a fallback mock translation because the AI service is not running in this environment. Error: ${e.message}</em></p>
          </div>
        `
      };
    }

    return NextResponse.json({
      success: true,
      event_id: eventId,
      language,
      original: {
        title: event.title,
        description: event.description,
        location: event.location,
        date: event.date,
        prizes: event.prizes,
        teamSize: event.teamSize,
      },
      translated_reply: aiData.reply,
    });
  } catch (error) {
    console.error("[AI Translate] Error:", error);
    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 }
    );
  }
}
