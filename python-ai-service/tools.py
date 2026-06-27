"""
tools.py — Function Calling (Tools) for the ConnectMyEvent AI Assistant
========================================================================
This module defines Python functions that the AI model can "call" during
a conversation to search real event data from the ConnectMyEvent database.

TOOLS AVAILABLE (13 total):
  ── Existing ──────────────────────────────────────────────────────────────
  1. search_events          — Filter events by category, location, keyword, etc.
  2. get_event_details      — Get full details of a specific event by ID.
  3. recommend_events       — Smart recommendations based on user interests/skills.
  4. get_closing_soon       — Events with deadlines coming up.
  5. get_top_prize_events   — Events with the best prize pools.
  6. compare_events         — Side-by-side comparison of two events.
  7. get_trending_events    — Most popular events ranked by registrations.
  8. get_registration_guide — Step-by-step registration help for an event.
  ── New (AI Features 1-6) ─────────────────────────────────────────────────
  9. navigate_platform         — Feature 1: Platform Navigator. Returns URL + steps for any page.
 10. get_personalized_recs     — Feature 2: Recommendation Engine. Profile-aware event ranking.
 11. translate_event_content   — Feature 3: Multilingual Translator. Translates event details.
 12. find_team_matches         — Feature 5: Team Matchmaker. Finds complementary teammates.
 13. evaluate_hackathon_idea   — Feature 6: Idea Evaluator. Scores project abstracts.
"""

import os
import json
import re
import urllib.request
import urllib.parse
from datetime import datetime


# ================================================================
# FETCH EVENTS FROM NEXT.JS API
# ================================================================

def _fetch_events_from_api() -> list[dict]:
    """
    Fetch all events from the ConnectMyEvent Next.js API.
    Falls back to mock data if the API is unavailable.
    """
    nextjs_url = os.getenv("NEXTJS_URL", "http://localhost:3000")
    try:
        url = f"{nextjs_url}/api/events"
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            if isinstance(data, list):
                return data
            return data.get("events", [])
    except Exception as e:
        print(f"[WARN] Could not fetch from Next.js API ({e}), using mock data")
        return MOCK_EVENTS_DB


def _format_event(event: dict) -> dict:
    """Normalize an event dict to a consistent shape for AI consumption."""
    return {
        "id": event.get("id"),
        "title": event.get("title"),
        "description": event.get("description"),
        "category": event.get("categoryLabel") or event.get("category"),
        "location": event.get("location"),
        "format": event.get("format", ""),
        "date": event.get("date"),
        "price": event.get("priceAmount") or event.get("price"),
        "prizes": event.get("prizes"),
        "organizer": event.get("organizer"),
        "teamSize": event.get("teamSize"),
        "registrationsCount": event.get("registrationsCount", 0),
        "daysLeft": event.get("daysLeft", 0),
        "featured": event.get("featured", False),
        "tags": event.get("tags", []),
    }


# ================================================================
# MOCK DATABASE (fallback when Next.js API is unavailable)
# ================================================================

MOCK_EVENTS_DB = [
    {
        "id": "mock1",
        "title": "CodeStorm 2026",
        "description": "A 36-hour hackathon focused on AI/ML solutions for healthcare.",
        "category": "hackathon",
        "categoryLabel": "Hackathon",
        "location": "Mumbai",
        "format": "offline",
        "date": "Jul 15, 2026",
        "priceAmount": "Free",
        "price": "free",
        "prizes": "5,00,000",
        "organizer": "TechCorp India",
        "teamSize": "2-4 Members",
        "registrationsCount": 142,
        "daysLeft": 20,
        "featured": True,
        "tags": ["AI", "ML", "healthcare"],
    },
    {
        "id": "mock2",
        "title": "Cloud Architecture Workshop",
        "description": "Hands-on workshop on designing scalable cloud architectures using AWS and GCP.",
        "category": "workshop",
        "categoryLabel": "Workshop",
        "location": "Bangalore",
        "format": "offline",
        "date": "Aug 3, 2026",
        "priceAmount": "499",
        "price": "paid",
        "prizes": "Certification Voucher",
        "organizer": "CloudSkills Academy",
        "teamSize": "Individual",
        "registrationsCount": 38,
        "daysLeft": 39,
        "featured": False,
        "tags": ["AWS", "GCP", "cloud"],
    },
    {
        "id": "mock3",
        "title": "HackForIndia 2026",
        "description": "India's premier student hackathon sponsored by Google.",
        "category": "hackathon",
        "categoryLabel": "Hackathon",
        "location": "Bangalore",
        "format": "offline",
        "date": "Aug 10, 2026",
        "priceAmount": "Free",
        "price": "free",
        "prizes": "10,00,000",
        "organizer": "Google Developer Groups",
        "teamSize": "2-4 Members",
        "registrationsCount": 512,
        "daysLeft": 46,
        "featured": True,
        "tags": ["web", "mobile", "open-source"],
    },
]


# ================================================================
# PLATFORM NAVIGATION MAP — Feature 1
# ================================================================

PLATFORM_PAGES = {
    "home": {
        "url": "/",
        "label": "Home Page",
        "description": "The main landing page of ConnectMyEvent.",
        "steps": ["Click the ConnectMyEvent logo in the header to go to the Home Page."],
    },
    "events": {
        "url": "/events",
        "label": "Browse Events",
        "description": "Browse all available hackathons, workshops, and more.",
        "steps": [
            "Click <strong>Events</strong> in the top navigation bar.",
            "Use the category filter (Hackathon, Workshop, Job Fair, etc.) to narrow results.",
            "Use the search bar to find events by keyword.",
            "Click any event card to open its detail page.",
        ],
    },
    "dashboard": {
        "url": "/dashboard/participant",
        "label": "Participant Dashboard",
        "description": "Your personal hub — see registrations, recommendations, and team matches.",
        "steps": [
            "Log in to your account.",
            "Click your avatar or name in the top-right corner.",
            "Select <strong>Dashboard</strong> from the dropdown.",
        ],
    },
    "organizer_dashboard": {
        "url": "/dashboard/organizer",
        "label": "Organizer Dashboard",
        "description": "Create and manage events, view attendees, and access AI Copilot.",
        "steps": [
            "Log in as an Organizer.",
            "Click your avatar in the top-right and select <strong>Dashboard</strong>.",
            "Use the left sidebar to navigate to Events, Attendees, Analytics, or AI Tools.",
        ],
    },
    "create_event": {
        "url": "/dashboard/organizer",
        "label": "Create Event",
        "description": "Create a new event listing on the platform.",
        "steps": [
            "Go to the Organizer Dashboard.",
            "Click the <strong>+ Create Event</strong> button (or use the AI Copilot tab).",
            "Fill in the event title, category, date, format, and description.",
            "Click <strong>Publish Event</strong> to make it live.",
        ],
    },
    "register": {
        "url": "/events",
        "label": "Register for an Event",
        "description": "How to register for any event.",
        "steps": [
            "Browse to the event page you want to join.",
            "Click the <strong>Register Now</strong> button in the sidebar.",
            "Confirm your registration — you will see it appear in your Dashboard.",
        ],
    },
    "teams": {
        "url": "/dashboard/participant",
        "label": "Find Teammates",
        "description": "Find or post team requests for collaborative events.",
        "steps": [
            "Go to your Participant Dashboard.",
            "Click the <strong>Find Teammates</strong> section.",
            "Enter your skills and what you're looking for.",
            "Review AI-matched teammate suggestions and send a connection request.",
        ],
    },
    "login": {
        "url": "/login",
        "label": "Login Page",
        "description": "Sign in to your account.",
        "steps": [
            "Click <strong>Sign In</strong> in the top navigation bar.",
            "Enter your email and password.",
            "Click <strong>Log In</strong>.",
        ],
    },
    "signup": {
        "url": "/signup",
        "label": "Sign Up Page",
        "description": "Create a new account.",
        "steps": [
            "Click <strong>Sign Up</strong> in the top navigation bar.",
            "Choose your role: Participant or Organizer.",
            "Fill in your name, email, and password.",
            "Click <strong>Create Account</strong>.",
        ],
    },
    "feedback": {
        "url": "/dashboard/participant",
        "label": "Submit Event Feedback",
        "description": "Rate an event you attended.",
        "steps": [
            "Go to your Participant Dashboard.",
            "Find the event under <strong>My Registrations</strong>.",
            "Click <strong>Leave Feedback</strong>.",
            "Rate the event (1-5 stars) and write a review.",
        ],
    },
}

NAVIGATION_ALIASES = {
    "home": ["home", "main", "landing", "front page", "homepage"],
    "events": ["events", "browse", "find events", "event list", "all events"],
    "dashboard": ["dashboard", "my dashboard", "participant dashboard", "my profile", "my events"],
    "organizer_dashboard": ["organizer dashboard", "organizer", "host dashboard", "manage events"],
    "create_event": ["create event", "host event", "new event", "add event", "publish event"],
    "register": ["register", "sign up for event", "join event", "how to register", "registration"],
    "teams": ["teams", "teammates", "find team", "team match", "looking for team"],
    "login": ["login", "sign in", "log in"],
    "signup": ["signup", "sign up", "create account", "register account", "new account"],
    "feedback": ["feedback", "review", "rate event", "submit feedback"],
}


# ================================================================
# TOOL FUNCTIONS — EXISTING (8)
# ================================================================

def search_events(
    category: str = "",
    location: str = "",
    date_from: str = "",
    date_to: str = "",
    keyword: str = "",
    free_only: bool = False,
    solo_friendly: bool = False,
) -> dict:
    """
    Search for events on ConnectMyEvent based on filters.

    Use this function when a user is looking for specific events.
    You can combine multiple filters to narrow down results.

    Args:
        category: Event category. One of: hackathon, workshop, jobfair,
                  startup, ngo, cultural, volunteer, scholarship, mentorship.
        location: City name or "Online" for virtual events.
        date_from: Start date for date range filter (YYYY-MM-DD format).
        date_to: End date for date range filter (YYYY-MM-DD format).
        keyword: A keyword to search in title or description (e.g., "AI", "React").
        free_only: If true, only return free events.
        solo_friendly: If true, only return events that allow individual/solo participation.

    Returns:
        A dictionary containing matching events and the count.
    """
    results = _fetch_events_from_api()

    if category:
        results = [
            e for e in results
            if e.get("category", "").lower() == category.lower()
            or e.get("categoryLabel", "").lower() == category.lower()
        ]

    if location:
        loc_lower = location.lower()
        results = [
            e for e in results
            if loc_lower in e.get("location", "").lower()
            or (loc_lower in ("online", "virtual") and "online" in e.get("location", "").lower())
            or (loc_lower in ("offline", "in-person") and "online" not in e.get("location", "").lower())
        ]

    if keyword:
        kw = keyword.lower()
        results = [
            e for e in results
            if kw in e.get("title", "").lower()
            or kw in e.get("description", "").lower()
            or kw in e.get("category", "").lower()
            or any(kw in t.lower() for t in e.get("tags", []))
        ]

    if free_only:
        results = [
            e for e in results
            if "free" in str(e.get("priceAmount", "")).lower()
            or e.get("price", "").lower() == "free"
        ]

    if solo_friendly:
        results = [
            e for e in results
            if "individual" in str(e.get("teamSize", "")).lower()
            or "1" in str(e.get("teamSize", ""))
        ]

    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d")
            filtered = []
            for e in results:
                try:
                    event_date = datetime.strptime(e["date"], "%b %d, %Y")
                    if event_date >= from_date:
                        filtered.append(e)
                except (ValueError, KeyError):
                    filtered.append(e)
            results = filtered
        except ValueError:
            pass

    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d")
            filtered = []
            for e in results:
                try:
                    event_date = datetime.strptime(e["date"], "%b %d, %Y")
                    if event_date <= to_date:
                        filtered.append(e)
                except (ValueError, KeyError):
                    filtered.append(e)
            results = filtered
        except ValueError:
            pass

    return {
        "total_results": len(results),
        "events": [_format_event(e) for e in results],
        "filters_applied": {
            k: v for k, v in {
                "category": category,
                "location": location,
                "date_from": date_from,
                "date_to": date_to,
                "keyword": keyword,
                "free_only": free_only,
                "solo_friendly": solo_friendly,
            }.items() if v
        },
    }


def get_event_details(event_id: str) -> dict:
    """
    Get the full details of a specific event by its ID.

    Use this function when a user asks for more information about
    a specific event mentioned in the conversation.

    Args:
        event_id: The unique identifier of the event (MongoDB ObjectId string).

    Returns:
        A dictionary with the full event details, or an error message.
    """
    events = _fetch_events_from_api()
    for event in events:
        if str(event.get("id")) == str(event_id):
            return {"found": True, "event": _format_event(event)}

    return {
        "found": False,
        "message": f"No event found with ID: {event_id}",
    }


def recommend_events(
    interests: str = "",
    skills: str = "",
    preferred_format: str = "",
    budget: str = "",
    team_size_preference: str = "",
) -> dict:
    """
    Recommend events personalized to the user's interests, skills, and preferences.

    Use this when a user asks for recommendations, says things like "what should I join?",
    "suggest something for me", or describes what they are interested in.

    Args:
        interests: User's topic interests (e.g., "AI, web development, cloud, finance").
        skills: User's technical or non-technical skills (e.g., "Python, React, public speaking").
        preferred_format: "online" for virtual, "offline" for in-person, "" for any.
        budget: "free" if user wants free events only, "" for any budget.
        team_size_preference: "solo" if user prefers individual events, "team" for team events, "" for any.

    Returns:
        A ranked list of recommended events with match reasoning.
    """
    all_events = _fetch_events_from_api()
    scored_events = []

    interest_keywords = [kw.strip().lower() for kw in interests.split(",") if kw.strip()]
    skill_keywords = [kw.strip().lower() for kw in skills.split(",") if kw.strip()]
    all_keywords = interest_keywords + skill_keywords

    for event in all_events:
        score = 0
        reasons = []

        event_text = (
            event.get("title", "") + " " +
            event.get("description", "") + " " +
            event.get("category", "") + " " +
            event.get("categoryLabel", "") + " " +
            " ".join(event.get("tags", []))
        ).lower()

        matched_keywords = []
        for kw in all_keywords:
            if kw in event_text:
                score += 3
                matched_keywords.append(kw)

        if matched_keywords:
            reasons.append(f"Matches your interest in: {', '.join(matched_keywords)}")

        if preferred_format:
            event_format = event.get("format", "").lower()
            event_location = event.get("location", "").lower()
            if preferred_format.lower() == "online" and ("online" in event_location or event_format == "online"):
                score += 2
                reasons.append("Available online — matches your format preference")
            elif preferred_format.lower() == "offline" and "online" not in event_location:
                score += 2
                reasons.append("In-person event — matches your format preference")

        if budget.lower() == "free":
            is_free = (
                "free" in str(event.get("priceAmount", "")).lower()
                or event.get("price", "").lower() == "free"
            )
            if is_free:
                score += 2
                reasons.append("Free to participate")
            else:
                score -= 1

        team_size = str(event.get("teamSize", "")).lower()
        if team_size_preference.lower() == "solo":
            if "individual" in team_size or team_size.startswith("1"):
                score += 2
                reasons.append("Open to solo participants")
        elif team_size_preference.lower() == "team":
            if "individual" not in team_size and team_size != "1":
                score += 2
                reasons.append("Team-based event")

        if event.get("featured"):
            score += 1
            reasons.append("Featured / highly rated event")

        reg_count = event.get("registrationsCount", 0)
        if reg_count > 200:
            score += 1
            reasons.append(f"Popular — {reg_count} participants registered")

        if score > 0 or not all_keywords:
            scored_events.append({
                "event": _format_event(event),
                "score": score,
                "match_reasons": reasons if reasons else ["General event — explore and see if it fits!"],
            })

    scored_events.sort(key=lambda x: x["score"], reverse=True)
    top = scored_events[:5]

    return {
        "total_recommendations": len(top),
        "recommendations": top,
        "note": "Events ranked by relevance to your interests and preferences.",
    }


def get_closing_soon(days_threshold: int = 14) -> dict:
    """
    Get events whose registration deadlines are coming up soon.

    Use this when a user asks about deadlines, urgency, "what's closing soon",
    "last chance", or "apply before it's too late".

    Args:
        days_threshold: Return events closing within this many days (default: 14).

    Returns:
        A list of events sorted by daysLeft ascending (most urgent first).
    """
    events = _fetch_events_from_api()
    urgent = [
        e for e in events
        if isinstance(e.get("daysLeft"), (int, float)) and 0 <= e.get("daysLeft", 999) <= days_threshold
    ]

    urgent.sort(key=lambda e: e.get("daysLeft", 999))

    return {
        "total_results": len(urgent),
        "threshold_days": days_threshold,
        "events": [_format_event(e) for e in urgent],
        "message": f"Events closing within {days_threshold} days, sorted by urgency.",
    }


def get_top_prize_events(limit: int = 5) -> dict:
    """
    Get events with the highest prize pools.

    Use this when a user asks about prizes, rewards, cash prizes,
    "which events have the best prizes", or "where can I win money".

    Args:
        limit: Maximum number of events to return (default: 5).

    Returns:
        A list of events sorted by prize value, highest first.
    """
    events = _fetch_events_from_api()

    def extract_prize_value(event: dict) -> int:
        prize_str = str(event.get("prizes", "0")).replace(",", "").replace(" ", "")
        numbers = re.findall(r"\d+", prize_str)
        if numbers:
            return max(int(n) for n in numbers)
        return 0

    prize_events = [e for e in events if extract_prize_value(e) > 0]
    prize_events.sort(key=extract_prize_value, reverse=True)

    return {
        "total_results": len(prize_events[:limit]),
        "events": [
            {**_format_event(e), "estimated_prize_rank": i + 1}
            for i, e in enumerate(prize_events[:limit])
        ],
        "note": "Events ranked by prize pool size.",
    }


def compare_events(event_id_1: str, event_id_2: str) -> dict:
    """
    Compare two events side by side to help the user decide which to join.

    Use this when a user says things like "compare X and Y", "which is better",
    "CodeStorm vs HackForIndia", or "help me decide between two events".

    Args:
        event_id_1: ID of the first event to compare.
        event_id_2: ID of the second event to compare.

    Returns:
        A structured side-by-side comparison of both events.
    """
    all_events = _fetch_events_from_api()
    event_map = {str(e.get("id")): e for e in all_events}

    e1 = event_map.get(str(event_id_1))
    e2 = event_map.get(str(event_id_2))

    if not e1 and not e2:
        return {"error": f"Neither event ID {event_id_1} nor {event_id_2} was found."}
    if not e1:
        return {"error": f"Event ID {event_id_1} not found."}
    if not e2:
        return {"error": f"Event ID {event_id_2} not found."}

    f1 = _format_event(e1)
    f2 = _format_event(e2)

    comparison = {
        "event_1": f1,
        "event_2": f2,
        "comparison": {
            "category": {"event_1": f1["category"], "event_2": f2["category"]},
            "location": {"event_1": f1["location"], "event_2": f2["location"]},
            "date": {"event_1": f1["date"], "event_2": f2["date"]},
            "price": {"event_1": f1["price"], "event_2": f2["price"]},
            "prizes": {"event_1": f1["prizes"], "event_2": f2["prizes"]},
            "team_size": {"event_1": f1["teamSize"], "event_2": f2["teamSize"]},
            "registrations": {"event_1": f1["registrationsCount"], "event_2": f2["registrationsCount"]},
            "days_left": {"event_1": f1["daysLeft"], "event_2": f2["daysLeft"]},
            "featured": {"event_1": f1["featured"], "event_2": f2["featured"]},
        },
        "quick_insights": [],
    }

    if f1["daysLeft"] < f2["daysLeft"]:
        comparison["quick_insights"].append(f"{f1['title']} closes sooner — apply first if interested in both.")
    elif f2["daysLeft"] < f1["daysLeft"]:
        comparison["quick_insights"].append(f"{f2['title']} closes sooner — apply first if interested in both.")

    p1_free = "free" in str(f1["price"]).lower()
    p2_free = "free" in str(f2["price"]).lower()
    if p1_free and not p2_free:
        comparison["quick_insights"].append(f"{f1['title']} is free; {f2['title']} has a participation fee.")
    elif p2_free and not p1_free:
        comparison["quick_insights"].append(f"{f2['title']} is free; {f1['title']} has a participation fee.")

    if f1["registrationsCount"] > f2["registrationsCount"]:
        comparison["quick_insights"].append(f"{f1['title']} has more registered participants — higher community interest.")
    elif f2["registrationsCount"] > f1["registrationsCount"]:
        comparison["quick_insights"].append(f"{f2['title']} has more registered participants — higher community interest.")

    return comparison


def get_trending_events(limit: int = 5) -> dict:
    """
    Get the most popular / trending events ranked by registration count.

    Use this when a user asks about popular events, trending events,
    "what's everyone joining", or "most registered events".

    Args:
        limit: Maximum number of events to return (default: 5).

    Returns:
        A list of events sorted by registrationsCount descending.
    """
    events = _fetch_events_from_api()
    sorted_events = sorted(events, key=lambda e: e.get("registrationsCount", 0), reverse=True)
    top = sorted_events[:limit]

    return {
        "total_results": len(top),
        "events": [
            {**_format_event(e), "popularity_rank": i + 1}
            for i, e in enumerate(top)
        ],
        "note": "Events ranked by number of registrations (most popular first).",
    }


def get_registration_guide(event_id: str) -> dict:
    """
    Get step-by-step registration instructions for a specific event.

    Use this when a user asks "how do I register?", "how to apply?",
    "walk me through registration", or needs help joining a specific event.

    Args:
        event_id: The ID of the event the user wants to register for.

    Returns:
        A structured registration guide with steps and a direct link.
    """
    all_events = _fetch_events_from_api()
    event = None
    for e in all_events:
        if str(e.get("id")) == str(event_id):
            event = e
            break

    if not event:
        return {
            "found": False,
            "message": f"No event found with ID {event_id}. Please check the event ID.",
        }

    fe = _format_event(event)
    event_url = f"/events/{event_id}"

    steps = [
        {
            "step": 1,
            "title": "Create or Log In to Your Account",
            "detail": "Go to ConnectMyEvent and sign up as a Participant, or log in if you already have an account.",
        },
        {
            "step": 2,
            "title": f"Open the Event Page",
            "detail": f"Navigate to the event page: {event_url}. You can also search for \"{fe['title']}\" using the search bar.",
        },
        {
            "step": 3,
            "title": "Review Event Details",
            "detail": (
                f"Check the key details: Date: {fe['date']}, Location: {fe['location']}, "
                f"Team Size: {fe['teamSize']}, Price: {fe['price']}."
            ),
        },
        {
            "step": 4,
            "title": "Click 'Register Now'",
            "detail": "Find the 'Register Now' button on the event detail page sidebar and click it.",
        },
        {
            "step": 5,
            "title": "Confirm Registration",
            "detail": "Your registration will be confirmed instantly. You'll be able to see it on your dashboard.",
        },
    ]

    team_size = str(fe.get("teamSize", "")).lower()
    if "individual" not in team_size and team_size != "1":
        steps.insert(3, {
            "step": "3b",
            "title": "Form or Join a Team",
            "detail": f"This event requires a team ({fe['teamSize']}). You can form a team with friends or use the platform's team-matching feature.",
        })

    return {
        "found": True,
        "event": fe,
        "event_url": event_url,
        "registration_steps": steps,
        "tip": f"Registration is {'free' if 'free' in str(fe['price']).lower() else 'paid — have your payment method ready'}. Apply before the deadline — only {fe['daysLeft']} days left!",
    }


# ================================================================
# TOOL FUNCTIONS — NEW (Features 1, 2, 3, 5, 6)
# ================================================================

def navigate_platform(page: str, context: str = "") -> dict:
    """
    Feature 1 — Conversational Platform Navigator.

    Returns the correct URL and step-by-step guide to reach any platform page
    or feature. Use this whenever a user asks HOW to get somewhere or DO something
    on the platform (e.g., "how do I create an event?", "where is my dashboard?",
    "take me to the teams page").

    Args:
        page: The page or feature the user wants to navigate to. One of:
              home, events, dashboard, organizer_dashboard, create_event,
              register, teams, login, signup, feedback.
        context: Optional extra context from user's message to personalize the response.

    Returns:
        A dict with the URL, label, description, and step-by-step navigation guide.
    """
    # Fuzzy match from aliases
    page_key = page.lower().strip()
    matched_key = None

    # Direct match first
    if page_key in PLATFORM_PAGES:
        matched_key = page_key
    else:
        # Alias match
        for key, aliases in NAVIGATION_ALIASES.items():
            if any(alias in page_key or page_key in alias for alias in aliases):
                matched_key = key
                break

    if not matched_key:
        return {
            "found": False,
            "message": (
                f"I couldn't find the page '{page}'. Available pages are: "
                + ", ".join(PLATFORM_PAGES.keys())
            ),
            "available_pages": list(PLATFORM_PAGES.keys()),
        }

    page_info = PLATFORM_PAGES[matched_key]
    return {
        "found": True,
        "page": matched_key,
        "url": page_info["url"],
        "label": page_info["label"],
        "description": page_info["description"],
        "steps": page_info["steps"],
        "direct_link": page_info["url"],
    }


def get_personalized_recs(
    student_name: str = "",
    department: str = "",
    skills: str = "",
    interests: str = "",
    past_categories: str = "",
    preferred_format: str = "",
    budget: str = "",
) -> dict:
    """
    Feature 2 — Personalized Event Recommendation Engine.

    Provides deeply personalized event recommendations by analysing the student's
    full profile: department, skills, interests, and past event participation patterns.
    Use this when a user shares their profile details or asks for personalized suggestions
    with more context than a simple recommendation.

    Args:
        student_name: The student's name (for personalized messaging).
        department: Academic department, e.g., "Computer Science", "Business", "Design".
        skills: Comma-separated technical/soft skills, e.g., "Python, Figma, leadership".
        interests: Comma-separated topic interests, e.g., "AI, sustainability, fintech".
        past_categories: Comma-separated categories of past events attended, e.g., "hackathon, workshop".
        preferred_format: "online", "offline", or "" for any.
        budget: "free" if free only, "" for any.

    Returns:
        A personalized ranked recommendation list with profile-aware match reasons and a score.
    """
    all_events = _fetch_events_from_api()

    skill_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
    interest_list = [i.strip().lower() for i in interests.split(",") if i.strip()]
    dept_keywords = [d.strip().lower() for d in department.split(",") if d.strip()]
    past_cats = [c.strip().lower() for c in past_categories.split(",") if c.strip()]
    all_keywords = skill_list + interest_list + dept_keywords

    # Department → category affinity mapping
    dept_affinity = {
        "computer science": ["hackathon", "workshop"],
        "engineering": ["hackathon", "startup"],
        "business": ["jobfair", "startup", "mentorship"],
        "design": ["workshop", "cultural"],
        "management": ["startup", "mentorship", "jobfair"],
        "social science": ["ngo", "volunteer", "cultural"],
        "arts": ["cultural", "workshop"],
        "medical": ["hackathon", "volunteer"],
    }

    affinity_cats = []
    for dept_kw in dept_keywords:
        for dept_name, cats in dept_affinity.items():
            if dept_kw in dept_name or dept_name in dept_kw:
                affinity_cats.extend(cats)

    scored = []
    for event in all_events:
        score = 0
        reasons = []
        event_text = (
            event.get("title", "") + " " +
            event.get("description", "") + " " +
            event.get("category", "") + " " +
            " ".join(event.get("tags", []))
        ).lower()
        event_cat = event.get("category", "").lower()

        # Keyword match (skills + interests)
        matched = [kw for kw in all_keywords if kw in event_text]
        if matched:
            score += len(matched) * 3
            reasons.append(f"Aligns with your profile: {', '.join(matched[:3])}")

        # Department affinity
        if event_cat in affinity_cats:
            score += 4
            reasons.append(f"Recommended for {department} students")

        # Past behaviour: boost categories the student has attended before
        if event_cat in past_cats:
            score += 2
            reasons.append("Based on your past event participation")
        # Explore new categories too
        elif past_cats and event_cat not in past_cats:
            score += 1
            reasons.append("New category to expand your experience")

        # Format preference
        if preferred_format:
            loc = event.get("location", "").lower()
            if preferred_format == "online" and "online" in loc:
                score += 2
                reasons.append("Online format matches your preference")
            elif preferred_format == "offline" and "online" not in loc:
                score += 2
                reasons.append("In-person format matches your preference")

        # Budget
        if budget.lower() == "free":
            is_free = "free" in str(event.get("priceAmount", "")).lower()
            if is_free:
                score += 2
                reasons.append("Free to participate")
            else:
                score -= 2

        # Social proof
        if event.get("featured"):
            score += 1
            reasons.append("Featured event")
        if event.get("registrationsCount", 0) > 100:
            score += 1
            reasons.append(f"{event.get('registrationsCount')} students already joined")

        if score > 0 or not all_keywords:
            scored.append({
                "event": _format_event(event),
                "relevance_score": max(score, 0),
                "match_reasons": reasons or ["Explore this event — it may interest you!"],
            })

    scored.sort(key=lambda x: x["relevance_score"], reverse=True)
    top = scored[:6]

    return {
        "student": student_name or "Student",
        "total_recommendations": len(top),
        "recommendations": top,
        "profile_summary": {
            "department": department,
            "skills": skill_list,
            "interests": interest_list,
            "past_categories": past_cats,
        },
        "note": "Events ranked using profile-vector matching against event tags and content.",
    }


def translate_event_content(event_id: str, target_language: str) -> dict:
    """
    Feature 3 — Multilingual Event Content Translator.

    Fetches an event's details and returns translation instructions for the AI
    to translate the title, description, and key details into the target language.
    Use this when a user asks to see event information in their preferred language.

    Args:
        event_id: The MongoDB ID of the event to translate.
        target_language: The target language name, e.g., "Hindi", "Tamil", "Telugu",
                         "Kannada", "Marathi", "Bengali", "French", "Spanish".

    Returns:
        The event content ready for AI translation, plus the target language.
    """
    events = _fetch_events_from_api()
    event = None
    for e in events:
        if str(e.get("id")) == str(event_id):
            event = e
            break

    if not event:
        # Return translation instructions without event-specific data
        return {
            "found": False,
            "target_language": target_language,
            "message": f"Event ID {event_id} not found. Please provide a valid event ID.",
            "instruction": f"Tell the user the event was not found and ask them to browse /events to find the event ID.",
        }

    fe = _format_event(event)

    return {
        "found": True,
        "target_language": target_language,
        "event_id": event_id,
        "original_content": {
            "title": fe["title"],
            "description": fe["description"],
            "category": fe["category"],
            "date": fe["date"],
            "location": fe["location"],
            "prizes": fe["prizes"],
            "team_size": fe["teamSize"],
            "price": fe["price"],
            "organizer": fe["organizer"],
        },
        "instruction": (
            f"Translate ALL the above original_content fields into {target_language}. "
            f"Keep names (event title, organizer) phonetically transliterated if direct translation doesn't exist. "
            f"Present the translated event card to the user in a clear, readable format with HTML formatting."
        ),
    }


def find_team_matches(
    user_skills: str,
    looking_for: str,
    event_id: str = "",
    event_category: str = "",
) -> dict:
    """
    Feature 5 — Participant Team Matchmaker.

    Analyzes a student's offered skills and their skill gaps (what they're looking for),
    then suggests compatible teammates based on open team requests.
    Calls the Next.js API to fetch active team requests from the database.

    Args:
        user_skills: Comma-separated skills the student brings, e.g., "React, Python, UI/UX".
        looking_for: Comma-separated skills the student needs, e.g., "Backend, ML, DevOps".
        event_id: Optional event ID to filter team requests for a specific event.
        event_category: Optional category to filter (e.g., "hackathon").

    Returns:
        A list of matching open team requests with compatibility scores.
    """
    nextjs_url = os.getenv("NEXTJS_URL", "http://localhost:3000")

    # Fetch open team requests from the API
    team_requests = []
    try:
        params = urllib.parse.urlencode({"eventId": event_id, "open": "true"} if event_id else {"open": "true"})
        url = f"{nextjs_url}/api/ai/teams?{params}"
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            team_requests = data.get("teamRequests", [])
    except Exception as e:
        print(f"[WARN] Could not fetch team requests ({e}), using empty list")

    user_skill_list = [s.strip().lower() for s in user_skills.split(",") if s.strip()]
    need_skill_list = [s.strip().lower() for s in looking_for.split(",") if s.strip()]

    matches = []
    for tr in team_requests:
        offered = [s.lower() for s in tr.get("skills", [])]
        needs = [s.lower() for s in tr.get("lookingFor", [])]

        score = 0
        reasons = []

        # Their offered skills fill what I need
        covered_gaps = [s for s in need_skill_list if any(s in o or o in s for o in offered)]
        if covered_gaps:
            score += len(covered_gaps) * 4
            reasons.append(f"They cover your skill gap: {', '.join(covered_gaps)}")

        # My skills fill what they need
        fill_their_gaps = [s for s in user_skill_list if any(s in n or n in s for n in needs)]
        if fill_their_gaps:
            score += len(fill_their_gaps) * 4
            reasons.append(f"You cover their need: {', '.join(fill_their_gaps)}")

        # Complementary (no overlap in skills = diverse team)
        overlap = set(user_skill_list) & set(offered)
        if not overlap and (covered_gaps or fill_their_gaps):
            score += 2
            reasons.append("Complementary skill sets — no duplication")

        if score > 0:
            matches.append({
                "team_request_id": tr.get("id"),
                "user_name": tr.get("user", {}).get("name", "Anonymous"),
                "user_email": tr.get("user", {}).get("email", ""),
                "event_title": tr.get("event", {}).get("title", "Unknown Event"),
                "skills_offered": tr.get("skills", []),
                "skills_needed": tr.get("lookingFor", []),
                "description": tr.get("description", ""),
                "compatibility_score": score,
                "match_reasons": reasons,
            })

    matches.sort(key=lambda x: x["compatibility_score"], reverse=True)

    return {
        "your_skills": user_skill_list,
        "you_need": need_skill_list,
        "total_matches": len(matches),
        "top_matches": matches[:5],
        "note": (
            "Matches scored by skill complementarity. "
            + ("No open team requests found yet — be the first to post!" if not team_requests else "")
        ),
    }


def evaluate_hackathon_idea(
    abstract: str,
    event_theme: str = "",
    evaluation_criteria: str = "",
    team_skills: str = "",
) -> dict:
    """
    Feature 6 — Hackathon Idea & Abstract Evaluator.

    Performs a pre-submission evaluation of a student's project idea or abstract.
    Checks for clarity, feasibility, innovation, and alignment with event theme.
    Use this when a user says "evaluate my idea", "is my project good?",
    "give feedback on my abstract", or "can I win with this idea?".

    Args:
        abstract: The student's project abstract or idea description.
        event_theme: The hackathon theme or problem statement (if known).
        evaluation_criteria: Specific judging criteria from the event (if known).
        team_skills: Comma-separated skills the team has (for feasibility check).

    Returns:
        A structured evaluation with dimension scores and actionable feedback.
    """
    if not abstract or len(abstract.strip()) < 20:
        return {
            "error": "Abstract is too short. Please provide at least 2-3 sentences describing your project idea.",
        }

    word_count = len(abstract.split())
    has_problem = any(w in abstract.lower() for w in ["problem", "challenge", "issue", "pain", "struggle", "need"])
    has_solution = any(w in abstract.lower() for w in ["solution", "solve", "address", "help", "enable", "build", "create", "develop"])
    has_tech = any(w in abstract.lower() for w in ["app", "platform", "api", "ai", "ml", "web", "mobile", "system", "tool", "dashboard"])
    has_impact = any(w in abstract.lower() for w in ["impact", "benefit", "user", "student", "people", "community", "improve", "reduce", "increase"])

    # Scoring dimensions (each out of 10, then averaged)
    clarity_score = min(10, 4 + (2 if word_count >= 50 else 0) + (2 if has_problem else 0) + (2 if has_solution else 0))
    innovation_score = min(10, 5 + (3 if "novel" in abstract.lower() or "unique" in abstract.lower() or "first" in abstract.lower() else 0) + (2 if has_tech else 0))
    feasibility_score = min(10, 5 + (3 if has_tech else 0) + (2 if team_skills else 0))
    impact_score = min(10, 4 + (4 if has_impact else 0) + (2 if has_problem else 0))
    theme_alignment_score = min(10, 6)  # Base — AI will assess full alignment
    if event_theme:
        theme_words = event_theme.lower().split()
        theme_alignment_score = min(10, 6 + sum(2 for tw in theme_words if tw in abstract.lower()))

    overall = round((clarity_score + innovation_score + feasibility_score + impact_score + theme_alignment_score) / 5, 1)
    viability = "Strong" if overall >= 7.5 else "Moderate" if overall >= 5.5 else "Needs Work"

    feedback = []
    if not has_problem:
        feedback.append("❌ Missing: Clearly state the PROBLEM or pain point you're solving.")
    else:
        feedback.append("✅ Problem statement detected.")
    if not has_solution:
        feedback.append("❌ Missing: Describe your SOLUTION approach more explicitly.")
    else:
        feedback.append("✅ Solution approach described.")
    if not has_tech:
        feedback.append("⚠️  Add: Mention the core technology or platform you'll use (e.g., React, Python, AI model).")
    else:
        feedback.append("✅ Technology stack mentioned.")
    if not has_impact:
        feedback.append("⚠️  Strengthen: Quantify your expected IMPACT (e.g., '500 students will benefit').")
    else:
        feedback.append("✅ Impact / beneficiaries mentioned.")
    if word_count < 50:
        feedback.append("⚠️  Expand: Your abstract is short. Aim for at least 80-100 words for a strong submission.")
    if event_theme and not any(tw in abstract.lower() for tw in event_theme.lower().split()):
        feedback.append(f"⚠️  Theme Alignment: Reference the event theme '{event_theme}' explicitly in your abstract.")

    return {
        "abstract_word_count": word_count,
        "overall_score": overall,
        "viability": viability,
        "dimension_scores": {
            "clarity": clarity_score,
            "innovation": innovation_score,
            "feasibility": feasibility_score,
            "impact": impact_score,
            "theme_alignment": theme_alignment_score,
        },
        "feedback_points": feedback,
        "event_theme": event_theme,
        "evaluation_criteria": evaluation_criteria,
        "ai_instruction": (
            "Use the dimension_scores and feedback_points above as a STARTING POINT. "
            "Then deeply analyse the abstract text yourself and provide rich qualitative feedback. "
            "Format your response with HTML: show scores as colored badges, feedback as a bulleted list, "
            "and end with 2-3 specific improvement suggestions the student can act on immediately."
        ),
    }


# ================================================================
# TOOL REGISTRY
# ================================================================

TOOL_FUNCTIONS = {
    # Existing tools
    "search_events": search_events,
    "get_event_details": get_event_details,
    "recommend_events": recommend_events,
    "get_closing_soon": get_closing_soon,
    "get_top_prize_events": get_top_prize_events,
    "compare_events": compare_events,
    "get_trending_events": get_trending_events,
    "get_registration_guide": get_registration_guide,
    # New AI Feature tools
    "navigate_platform": navigate_platform,
    "get_personalized_recs": get_personalized_recs,
    "translate_event_content": translate_event_content,
    "find_team_matches": find_team_matches,
    "evaluate_hackathon_idea": evaluate_hackathon_idea,
}


# ================================================================
# OPENAI-FORMAT TOOL SCHEMAS
# ================================================================

OPENAI_TOOLS_SCHEMA = [
    # ── Existing schemas ───────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "search_events",
            "description": (
                "Search for events on ConnectMyEvent based on filters. "
                "Use this when a user is looking for specific events by category, location, "
                "keyword, price, format, or team size. You can combine multiple filters."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "Event category: hackathon, workshop, jobfair, startup, ngo, cultural, volunteer, scholarship, mentorship."},
                    "location": {"type": "string", "description": 'City name (e.g. "Mumbai") or "online" for virtual events.'},
                    "date_from": {"type": "string", "description": "Start date filter (YYYY-MM-DD)."},
                    "date_to": {"type": "string", "description": "End date filter (YYYY-MM-DD)."},
                    "keyword": {"type": "string", "description": 'Keyword to search in title/description (e.g., "AI", "React").'},
                    "free_only": {"type": "boolean", "description": "If true, only return free events."},
                    "solo_friendly": {"type": "boolean", "description": "If true, only return events open to individual participants."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_event_details",
            "description": "Get full details of a specific event by its ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "string", "description": "The MongoDB ObjectId of the event."},
                },
                "required": ["event_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_events",
            "description": (
                "Recommend events personalized to the user's interests, skills, and preferences. "
                "Use when user says 'recommend something', 'what should I join', or describes their background."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "interests": {"type": "string", "description": "Comma-separated interests (e.g., 'AI, web dev, cloud')."},
                    "skills": {"type": "string", "description": "Comma-separated skills (e.g., 'Python, React')."},
                    "preferred_format": {"type": "string", "description": "'online', 'offline', or '' for any."},
                    "budget": {"type": "string", "description": "'free' for free events only, '' for any."},
                    "team_size_preference": {"type": "string", "description": "'solo', 'team', or '' for any."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_closing_soon",
            "description": "Get events whose deadlines are coming up soon, sorted by urgency.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_threshold": {"type": "integer", "description": "Return events closing within this many days. Default is 14."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_prize_events",
            "description": "Get events with the highest prize pools, sorted by prize value.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Max number of events to return. Default is 5."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_events",
            "description": "Compare two events side by side to help the user decide which to join.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id_1": {"type": "string", "description": "ID of the first event."},
                    "event_id_2": {"type": "string", "description": "ID of the second event."},
                },
                "required": ["event_id_1", "event_id_2"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_trending_events",
            "description": "Get the most popular events ranked by number of registrations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Max number of events to return. Default is 5."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_registration_guide",
            "description": "Get step-by-step registration instructions for a specific event.",
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "string", "description": "The ID of the event to get registration instructions for."},
                },
                "required": ["event_id"],
            },
        },
    },
    # ── New AI Feature schemas ─────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "navigate_platform",
            "description": (
                "Feature 1 — Platform Navigator. Returns the URL and step-by-step guide to reach any platform page or feature. "
                "Use this when a user asks HOW to get somewhere on the platform: "
                "'how do I create an event?', 'where is my dashboard?', 'take me to teams', "
                "'how do I register?', 'where do I submit feedback?', 'how to login?'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "page": {
                        "type": "string",
                        "description": (
                            "The page or feature the user wants to navigate to. One of: "
                            "home, events, dashboard, organizer_dashboard, create_event, "
                            "register, teams, login, signup, feedback."
                        ),
                    },
                    "context": {
                        "type": "string",
                        "description": "Optional extra context from the user's message.",
                    },
                },
                "required": ["page"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_personalized_recs",
            "description": (
                "Feature 2 — Personalized Recommendation Engine. Provides deeply profile-aware event recommendations. "
                "Use this when the user shares their academic background, department, skills, and interests together, "
                "or asks for 'recommendations based on my profile', 'events for a CS student', 'suggest for me as a designer'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "student_name": {"type": "string", "description": "Student's first name (for personalized messaging)."},
                    "department": {"type": "string", "description": "Academic department, e.g., 'Computer Science', 'MBA', 'Design'."},
                    "skills": {"type": "string", "description": "Comma-separated technical/soft skills."},
                    "interests": {"type": "string", "description": "Comma-separated topic interests."},
                    "past_categories": {"type": "string", "description": "Comma-separated categories of past events attended, e.g., 'hackathon, workshop'."},
                    "preferred_format": {"type": "string", "description": "'online', 'offline', or '' for any."},
                    "budget": {"type": "string", "description": "'free' for free only, '' for any."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "translate_event_content",
            "description": (
                "Feature 3 — Multilingual Event Content Translator. Fetches event details and prepares them for translation. "
                "Use this when a user asks to see event information in their language: "
                "'show me this event in Hindi', 'translate to Tamil', 'can I read this in Telugu?'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "string", "description": "The MongoDB ID of the event to translate."},
                    "target_language": {
                        "type": "string",
                        "description": "Target language name, e.g., 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'French'.",
                    },
                },
                "required": ["event_id", "target_language"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_team_matches",
            "description": (
                "Feature 5 — Team Matchmaker. Matches a student's skills against open team requests to find compatible teammates. "
                "Use this when a user says 'find me a team', 'I need a backend developer', "
                "'who needs my React skills?', or 'help me find teammates for this hackathon'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "user_skills": {"type": "string", "description": "Comma-separated skills the student offers, e.g., 'React, Python, UI/UX'."},
                    "looking_for": {"type": "string", "description": "Comma-separated skills the student needs, e.g., 'ML, Backend, DevOps'."},
                    "event_id": {"type": "string", "description": "Optional: filter team requests for a specific event ID."},
                    "event_category": {"type": "string", "description": "Optional: filter by event category, e.g., 'hackathon'."},
                },
                "required": ["user_skills", "looking_for"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "evaluate_hackathon_idea",
            "description": (
                "Feature 6 — Hackathon Idea & Abstract Evaluator. Evaluates a project idea or abstract for feasibility, "
                "innovation, clarity, and theme alignment. Use this when a user says 'evaluate my idea', "
                "'give feedback on my abstract', 'is my project good enough?', or 'review my submission'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "abstract": {"type": "string", "description": "The student's project abstract or idea description (at least 2-3 sentences)."},
                    "event_theme": {"type": "string", "description": "The hackathon theme or problem statement, if known."},
                    "evaluation_criteria": {"type": "string", "description": "Specific judging criteria from the event, if known."},
                    "team_skills": {"type": "string", "description": "Comma-separated skills the team has, for feasibility scoring."},
                },
                "required": ["abstract"],
            },
        },
    },
]
