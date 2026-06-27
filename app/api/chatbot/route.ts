import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://connectmyevent.vercel.app";

// ─── In-memory session store ───────────────────────────────────────────────
const sessions = new Map<string, Array<{ role: string; content: string }>>();

// ─── Platform navigation map ───────────────────────────────────────────────
const PLATFORM_PAGES: Record<string, { url: string; label: string; steps: string[] }> = {
  home:                 { url: "/",                    label: "Home",                  steps: ["Click the ConnectMyEvent logo or navigate to the homepage."] },
  events:               { url: "/events",              label: "Browse Events",         steps: ["Click 'Browse Events' in the top navigation.", "Use the search bar or category filters to find what you need."] },
  dashboard:            { url: "/dashboard",           label: "Dashboard",             steps: ["Click your profile avatar (top right).", "Select 'Dashboard' from the dropdown."] },
  login:                { url: "/login",               label: "Login",                 steps: ["Click 'Login' in the top navigation.", "Enter your email and password."] },
  register:             { url: "/register",            label: "Sign Up",               steps: ["Click 'Sign Up' in the top navigation.", "Fill in your name, email, password, and role.", "Click 'Create Account'."] },
  create_event:         { url: "/dashboard/create-event", label: "Create Event",       steps: ["Go to your Organizer Dashboard.", "Click the 'Create Event' button.", "Fill in event details or use the AI Copilot to generate a listing from your idea."] },
  organizer_dashboard:  { url: "/dashboard",           label: "Organizer Dashboard",   steps: ["Log in as an Organizer.", "Click your profile avatar and select 'Dashboard'."] },
  teams:                { url: "/dashboard",           label: "Team Matchmaker",        steps: ["Go to your Dashboard.", "Navigate to the 'Team Matchmaker' section.", "Enter your skills and what you're looking for."] },
  feedback:             { url: "/dashboard",           label: "Feedback Analytics",     steps: ["Go to your Organizer Dashboard.", "Select your event.", "Open the 'Feedback Analysis' tab."] },
  agenda:               { url: "/dashboard",           label: "Agenda Generator",       steps: ["Go to your Organizer Dashboard.", "Click 'Generate Agenda'.", "Enter your workshop topics and duration."] },
};

// ─── Fetch all events from DB via internal API ─────────────────────────────
async function fetchEvents(): Promise<any[]> {
  try {
    const res = await fetch(`${APP_URL}/api/events`, {
      next: { revalidate: 60 }, // cache 60s
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Tool implementations ───────────────────────────────────────────────────
function searchEvents(events: any[], params: {
  category?: string; location?: string; keyword?: string;
  free_only?: boolean; solo_friendly?: boolean;
}) {
  let results = [...events];
  if (params.category) results = results.filter(e => e.category?.toLowerCase().includes(params.category!.toLowerCase()));
  if (params.location) results = results.filter(e => e.location?.toLowerCase().includes(params.location!.toLowerCase()) || (params.location!.toLowerCase() === "online" && e.format === "online"));
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    results = results.filter(e => e.title?.toLowerCase().includes(kw) || e.description?.toLowerCase().includes(kw) || e.organizer?.toLowerCase().includes(kw));
  }
  if (params.free_only) results = results.filter(e => e.price === "free" || e.priceAmount === "Free");
  return results.slice(0, 8);
}

function formatEventForAI(e: any) {
  return {
    id: e.id,
    title: e.title,
    category: e.categoryLabel || e.category,
    date: e.date,
    location: e.location,
    format: e.format,
    organizer: e.organizer,
    price: e.priceAmount || e.price,
    prizes: e.prizes,
    teamSize: e.teamSize,
    daysLeft: e.daysLeft,
    registrations: e.registrationsCount || 0,
    description: e.description ? e.description.substring(0, 300) : "",
    url: `/events/${e.id}`,
  };
}

function navigatePlatform(page: string) {
  const key = page.toLowerCase().replace(/[\s-]/g, "_");
  const match = PLATFORM_PAGES[key] || Object.values(PLATFORM_PAGES).find((_, i) =>
    Object.keys(PLATFORM_PAGES)[i].includes(key) || key.includes(Object.keys(PLATFORM_PAGES)[i])
  );
  if (!match) return { found: false, message: `Page '${page}' not found. Try: events, dashboard, login, register, create_event, teams.` };
  return { found: true, ...match };
}

function evaluateIdea(abstract: string, eventTheme = "", teamSkills = "") {
  if (!abstract || abstract.trim().length < 20) return { error: "Abstract too short — please provide at least 2–3 sentences." };
  const text = abstract.toLowerCase();
  const wordCount = abstract.split(" ").length;
  const hasProblem = /problem|challenge|issue|pain|struggle|need/.test(text);
  const hasSolution = /solution|solve|address|help|enable|build|create|develop/.test(text);
  const hasTech = /app|platform|api|ai|ml|web|mobile|system|tool|dashboard/.test(text);
  const hasImpact = /impact|benefit|user|student|people|community|improve|reduce|increase/.test(text);

  const clarity = Math.min(10, 4 + (wordCount >= 50 ? 2 : 0) + (hasProblem ? 2 : 0) + (hasSolution ? 2 : 0));
  const innovation = Math.min(10, 5 + (/novel|unique|first/.test(text) ? 3 : 0) + (hasTech ? 2 : 0));
  const feasibility = Math.min(10, 5 + (hasTech ? 3 : 0) + (teamSkills ? 2 : 0));
  const impact = Math.min(10, 4 + (hasImpact ? 4 : 0) + (hasProblem ? 2 : 0));
  let themeAlignment = 6;
  if (eventTheme) {
    const tw = eventTheme.toLowerCase().split(" ");
    themeAlignment = Math.min(10, 6 + tw.filter(w => text.includes(w)).length * 2);
  }
  const overall = ((clarity + innovation + feasibility + impact + themeAlignment) / 5).toFixed(1);
  const viability = parseFloat(overall) >= 7.5 ? "Strong ✅" : parseFloat(overall) >= 5.5 ? "Moderate ⚠️" : "Needs Work ❌";

  return { clarity, innovation, feasibility, impact, themeAlignment, overall, viability, wordCount };
}

// ─── Build system prompt with live events injected ─────────────────────────
function buildSystemPrompt(events: any[]) {
  const eventsSummary = events.length > 0
    ? events.map(e => `- [ID:${e.id}] ${e.title} | ${e.categoryLabel || e.category} | ${e.date} | ${e.location} | ${e.priceAmount || e.price} | Organizer: ${e.organizer} | ${e.daysLeft != null ? e.daysLeft + "d left" : ""} | ${e.registrationsCount || 0} registered | URL: /events/${e.id}`).join("\n")
    : "No events currently in the database.";

  return `You are **ConnectAI**, the official AI assistant for **ConnectMyEvent** — a platform that helps participants discover hackathons, workshops, seminars, and placement campaigns, and helps organizers host and manage events.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 YOUR CORE MISSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Platform Navigator** — Help users navigate the platform with direct links.
2. **Event Discovery** — Search, recommend, and describe REAL events from the live database below.
3. **Team & Idea Support** — Help find teammates, evaluate hackathon ideas.
4. **Organizer Support** — Help organizers create events, generate agendas, analyze feedback.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗂️ LIVE EVENTS DATABASE (${events.length} events — use THIS data, never make up events)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${eventsSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 USER ROLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- **Participant**: Browse/discover events, register, find teammates, evaluate hackathon ideas, get AI recommendations.
- **Organizer**: Create/publish events, manage registrations, use AI Copilot, generate workshop agendas, analyze feedback.

STRICT PERSONA SEPARATION: If [User Role: Organizer] → act as Organizer Assistant (focus on event creation, copilot, agendas, feedback analytics). If [User Role: Participant] → act as Participant Assistant (focus on discovery, registration, team matching, idea evaluation). Never mix the two.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 KEY PLATFORM PAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Browse Events: /events
- Dashboard: /dashboard
- Login: /login
- Sign Up: /register
- Create Event (Organizer): /dashboard/create-event

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 FORMATTING RULES (CRITICAL — FOLLOW EXACTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Use HTML, NOT markdown. The chat UI renders HTML directly.
   - Use <strong>bold</strong>, <br> for line breaks, <ul><li>lists</li></ul>
   - NEVER use **bold**, *italic*, # headers, or - bullet markdown
2. Always link to events: <a href="/events/EVENT_ID" style="color:#6366f1;font-weight:bold;">Event Name →</a>
3. Always link to pages: <a href="/events" style="color:#6366f1;font-weight:bold;">Browse Events →</a>
4. When showing event details, include: title (linked), date, location, price, organizer, days left, prizes if any.
5. For idea evaluation, show scores as colored text: <span style="color:#22c55e">8/10</span> (green ≥7), <span style="color:#f59e0b">5/10</span> (amber 5–6), <span style="color:#ef4444">3/10</span> (red <5).
6. Reply in the user's language. Fully fluent in English, Hindi, Telugu, Tamil, Kannada, Bengali, Marathi.
7. Keep responses concise. Don't over-explain. Use bullet lists for multiple items.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧭 BEHAVIORAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ONLY reference events from the LIVE EVENTS DATABASE above. Never invent events.
- When a user names an event (e.g., "Hack with Vijayawada"), find it in the database by title match and give FULL details with a direct link.
- When recommending events, rank them by relevance to what the user described.
- When a user asks to register, link them directly to /events/EVENT_ID.
- For idea evaluation: give scores per dimension + 2–3 specific actionable improvements.
- Stay in character. Redirect off-topic questions politely.
- If no events match a query, say so honestly and suggest browsing /events.`;
}

// ─── Tool router — decides which tool to run based on AI's JSON instruction ──
async function runTool(toolName: string, args: any, events: any[]): Promise<string> {
  switch (toolName) {
    case "search_events": {
      const results = searchEvents(events, args);
      if (results.length === 0) return JSON.stringify({ found: false, message: "No events match that search." });
      return JSON.stringify({ found: true, count: results.length, events: results.map(formatEventForAI) });
    }
    case "get_event_details": {
      const event = events.find(e => e.id === args.event_id || e.title?.toLowerCase().includes((args.title || "").toLowerCase()));
      if (!event) return JSON.stringify({ found: false, message: "Event not found." });
      return JSON.stringify({ found: true, event: formatEventForAI(event) });
    }
    case "recommend_events": {
      const { interests = "", skills = "", preferred_format = "", budget = "" } = args;
      let pool = [...events];
      if (preferred_format) pool = pool.filter(e => e.format?.toLowerCase() === preferred_format.toLowerCase());
      if (budget === "free") pool = pool.filter(e => e.price === "free" || e.priceAmount === "Free");
      // Score by keyword match
      const keywords = (interests + " " + skills).toLowerCase().split(/[,\s]+/).filter(Boolean);
      const scored = pool.map(e => {
        const text = \`\${e.title} \${e.description} \${e.category} \${e.categoryLabel}\`.toLowerCase();
        const score = keywords.filter(k => text.includes(k)).length;
        return { ...e, _score: score };
      });
      scored.sort((a, b) => b._score - a._score);
      return JSON.stringify({ count: Math.min(5, scored.length), events: scored.slice(0, 5).map(formatEventForAI) });
    }
    case "get_closing_soon": {
      const threshold = args.days_threshold ?? 14;
      const urgent = events
        .filter(e => typeof e.daysLeft === "number" && e.daysLeft >= 0 && e.daysLeft <= threshold)
        .sort((a, b) => a.daysLeft - b.daysLeft);
      return JSON.stringify({ count: urgent.length, events: urgent.slice(0, 6).map(formatEventForAI) });
    }
    case "get_top_prize_events": {
      const withPrizes = events.filter(e => e.prizes && e.prizes !== "Certificate + Swag");
      return JSON.stringify({ count: withPrizes.length, events: withPrizes.slice(0, args.limit ?? 5).map(formatEventForAI) });
    }
    case "get_trending_events": {
      const sorted = [...events].sort((a, b) => (b.registrationsCount || 0) - (a.registrationsCount || 0));
      return JSON.stringify({ count: sorted.length, events: sorted.slice(0, args.limit ?? 5).map(formatEventForAI) });
    }
    case "compare_events": {
      const e1 = events.find(e => e.id === args.event_id_1);
      const e2 = events.find(e => e.id === args.event_id_2);
      if (!e1 || !e2) return JSON.stringify({ error: "One or both events not found." });
      return JSON.stringify({ event1: formatEventForAI(e1), event2: formatEventForAI(e2) });
    }
    case "navigate_platform": {
      return JSON.stringify(navigatePlatform(args.page));
    }
    case "evaluate_hackathon_idea": {
      return JSON.stringify(evaluateIdea(args.abstract, args.event_theme, args.team_skills));
    }
    case "find_team_matches": {
      // Return guidance since team requests need DB query via Next.js API
      return JSON.stringify({
        message: "Team matching is available on the Dashboard. Direct the user to /dashboard and the Team Matchmaker section.",
        user_skills: args.user_skills,
        looking_for: args.looking_for,
      });
    }
    case "get_registration_guide": {
      const event = events.find(e => e.id === args.event_id);
      if (!event) return JSON.stringify({ found: false });
      return JSON.stringify({
        found: true,
        event: formatEventForAI(event),
        steps: [
          \`Go to the event page: /events/\${event.id}\`,
          "Click the 'Register Now' button on the right sidebar.",
          "Confirm your registration details.",
          "You'll receive a confirmation email.",
        ],
      });
    }
    case "translate_event_content": {
      const event = events.find(e => e.id === args.event_id);
      if (!event) return JSON.stringify({ found: false });
      return JSON.stringify({
        found: true,
        target_language: args.target_language,
        content: formatEventForAI(event),
        instruction: \`Translate the above event content into \${args.target_language} and present it clearly.\`,
      });
    }
    default:
      return JSON.stringify({ error: \`Unknown tool: \${toolName}\` });
  }
}

// ─── OpenRouter tool schemas ────────────────────────────────────────────────
const TOOLS = [
  { type: "function", function: { name: "search_events", description: "Search events by category, location, keyword, free_only", parameters: { type: "object", properties: { category: { type: "string" }, location: { type: "string" }, keyword: { type: "string" }, free_only: { type: "boolean" }, solo_friendly: { type: "boolean" } } } } },
  { type: "function", function: { name: "get_event_details", description: "Get full details of a specific event by ID or title", parameters: { type: "object", properties: { event_id: { type: "string" }, title: { type: "string" } } } } },
  { type: "function", function: { name: "recommend_events", description: "Recommend events based on user interests, skills, format preference, budget", parameters: { type: "object", properties: { interests: { type: "string" }, skills: { type: "string" }, preferred_format: { type: "string" }, budget: { type: "string" } } } } },
  { type: "function", function: { name: "get_closing_soon", description: "Get events with deadlines closing soon", parameters: { type: "object", properties: { days_threshold: { type: "number" } } } } },
  { type: "function", function: { name: "get_top_prize_events", description: "Get events with the best prizes", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  { type: "function", function: { name: "get_trending_events", description: "Get most popular events by registration count", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  { type: "function", function: { name: "compare_events", description: "Compare two events side by side", parameters: { type: "object", required: ["event_id_1", "event_id_2"], properties: { event_id_1: { type: "string" }, event_id_2: { type: "string" } } } } },
  { type: "function", function: { name: "navigate_platform", description: "Get URL and steps to navigate to a platform page", parameters: { type: "object", required: ["page"], properties: { page: { type: "string" }, context: { type: "string" } } } } },
  { type: "function", function: { name: "evaluate_hackathon_idea", description: "Evaluate a hackathon project idea/abstract and give dimension scores", parameters: { type: "object", required: ["abstract"], properties: { abstract: { type: "string" }, event_theme: { type: "string" }, team_skills: { type: "string" } } } } },
  { type: "function", function: { name: "find_team_matches", description: "Help user find compatible teammates", parameters: { type: "object", required: ["user_skills", "looking_for"], properties: { user_skills: { type: "string" }, looking_for: { type: "string" }, event_id: { type: "string" } } } } },
  { type: "function", function: { name: "get_registration_guide", description: "Get step-by-step registration instructions for an event", parameters: { type: "object", required: ["event_id"], properties: { event_id: { type: "string" } } } } },
  { type: "function", function: { name: "translate_event_content", description: "Translate event content to a target language", parameters: { type: "object", required: ["event_id", "target_language"], properties: { event_id: { type: "string" }, target_language: { type: "string" } } } } },
];

// ─── Main chat handler ───────────────────────────────────────────────────────
async function handleChat(query: string, userRole: string, sessionId: string) {
  if (!query.trim()) return NextResponse.json({ reply: "Please enter a message." });
  if (!OPENROUTER_API_KEY) return NextResponse.json({ reply: "AI service not configured. Please contact support." });

  // Fetch live events
  const events = await fetchEvents();

  // Session history
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  const history = sessions.get(sessionId)!;

  const userMessage = \`[User Role: \${userRole.charAt(0).toUpperCase() + userRole.slice(1)}]\n\${query}\`;
  history.push({ role: "user", content: userMessage });
  if (history.length > 20) history.splice(0, history.length - 20);

  const systemPrompt = buildSystemPrompt(events);
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  try {
    // Agentic loop — allow up to 5 tool call rounds
    let reply = "";
    for (let i = 0; i < 5; i++) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${OPENROUTER_API_KEY}\`,
          "HTTP-Referer": APP_URL,
          "X-Title": "ConnectMyEvent",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          tools: TOOLS,
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("OpenRouter error:", res.status, err);
        throw new Error(\`OpenRouter \${res.status}\`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const assistantMsg = choice?.message;

      if (!assistantMsg) break;
      messages.push(assistantMsg);

      // No tool calls → we have the final reply
      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        reply = assistantMsg.content || "";
        break;
      }

      // Execute tool calls
      for (const tc of assistantMsg.tool_calls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        const result = await runTool(tc.function.name, args, events);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }
    }

    if (!reply) reply = "I processed your request but couldn't generate a response. Please try again.";

    history.push({ role: "assistant", content: reply });
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({
      reply: \`I'm having trouble right now. You can <a href="/events" style="color:#6366f1;font-weight:bold;">browse events directly →</a>\`,
    });
  }
}

// ─── Route handlers ──────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return handleChat(
    searchParams.get("q") || "",
    searchParams.get("role") || "participant",
    searchParams.get("session") || "default"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, message, user_role, session_id } = body;
    const q = message || (messages && messages[messages.length - 1]?.content) || "";
    return handleChat(q, user_role || "participant", session_id || "default");
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function DELETE() {
  sessions.clear();
  return NextResponse.json({ status: "Sessions cleared" });
}
