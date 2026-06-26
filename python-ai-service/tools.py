"""
tools.py — Function Calling (Tools) for the ConnectMyEvent AI Assistant
========================================================================
This module defines Python functions that the AI model can "call" during
a conversation to search real event data from the ConnectMyEvent database.

The Python service calls the Next.js API (/api/events) to fetch live event data
rather than maintaining its own DB connection — this keeps architecture clean
and respects the single source of truth in the Next.js app.

TOOLS AVAILABLE:
  1. search_events          — Filter events by category, location, keyword, price, etc.
  2. get_event_details      — Get full details of a specific event by ID.
  3. recommend_events       — Smart recommendations based on user interests/skills.
  4. get_closing_soon       — Events with deadlines coming up (urgency-first).
  5. get_top_prize_events   — Events with the best prize pools.
  6. compare_events         — Side-by-side comparison of two events by ID.
  7. get_trending_events    — Most popular events ranked by registrations.
  8. get_registration_guide — Step-by-step registration help for an event.
"""

import os
import json
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
    },
]


# ================================================================
# TOOL FUNCTIONS
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

        # Score based on keyword matches in title/description
        event_text = (
            event.get("title", "") + " " +
            event.get("description", "") + " " +
            event.get("category", "") + " " +
            event.get("categoryLabel", "")
        ).lower()

        matched_keywords = []
        for kw in all_keywords:
            if kw in event_text:
                score += 3
                matched_keywords.append(kw)

        if matched_keywords:
            reasons.append(f"Matches your interest in: {', '.join(matched_keywords)}")

        # Format preference
        if preferred_format:
            event_format = event.get("format", "").lower()
            event_location = event.get("location", "").lower()
            if preferred_format.lower() == "online" and ("online" in event_location or event_format == "online"):
                score += 2
                reasons.append("Available online — matches your format preference")
            elif preferred_format.lower() == "offline" and "online" not in event_location:
                score += 2
                reasons.append("In-person event — matches your format preference")

        # Budget preference
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

        # Team size preference
        team_size = str(event.get("teamSize", "")).lower()
        if team_size_preference.lower() == "solo":
            if "individual" in team_size or team_size.startswith("1"):
                score += 2
                reasons.append("Open to solo participants")
        elif team_size_preference.lower() == "team":
            if "individual" not in team_size and team_size != "1":
                score += 2
                reasons.append("Team-based event")

        # Bonus for featured events
        if event.get("featured"):
            score += 1
            reasons.append("Featured / highly rated event")

        # Bonus for high registrations (social proof)
        reg_count = event.get("registrationsCount", 0)
        if reg_count > 200:
            score += 1
            reasons.append(f"Popular — {reg_count} participants registered")

        # Only include events with at least 1 matching signal
        if score > 0 or not all_keywords:
            scored_events.append({
                "event": _format_event(event),
                "score": score,
                "match_reasons": reasons if reasons else ["General event — explore and see if it fits!"],
            })

    # Sort by score descending, take top 5
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

    # Sort by daysLeft ascending (most urgent first)
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
        """Try to extract a numeric prize amount for sorting."""
        prize_str = str(event.get("prizes", "0")).replace(",", "").replace(" ", "")
        # Extract numbers from prize string
        import re
        numbers = re.findall(r"\d+", prize_str)
        if numbers:
            return max(int(n) for n in numbers)
        return 0

    # Filter events that have real prizes (not "N/A" or "Certificate")
    prize_events = [
        e for e in events
        if extract_prize_value(e) > 0
    ]

    # Sort by extracted prize amount descending
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

    # Build comparison dimensions
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

    # Generate quick insights
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

    # Add team step if applicable
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
# TOOL REGISTRY
# ================================================================

TOOL_FUNCTIONS = {
    "search_events": search_events,
    "get_event_details": get_event_details,
    "recommend_events": recommend_events,
    "get_closing_soon": get_closing_soon,
    "get_top_prize_events": get_top_prize_events,
    "compare_events": compare_events,
    "get_trending_events": get_trending_events,
    "get_registration_guide": get_registration_guide,
}


# ================================================================
# OPENAI-FORMAT TOOL SCHEMAS
# ================================================================

OPENAI_TOOLS_SCHEMA = [
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
                    "category": {
                        "type": "string",
                        "description": (
                            "Event category. One of: hackathon, workshop, jobfair, "
                            "startup, ngo, cultural, volunteer, scholarship, mentorship."
                        ),
                    },
                    "location": {
                        "type": "string",
                        "description": 'City name (e.g. "Mumbai", "Delhi") or "online" for virtual events.',
                    },
                    "date_from": {
                        "type": "string",
                        "description": "Start date filter (YYYY-MM-DD format).",
                    },
                    "date_to": {
                        "type": "string",
                        "description": "End date filter (YYYY-MM-DD format).",
                    },
                    "keyword": {
                        "type": "string",
                        "description": 'Keyword to search in title/description (e.g., "AI", "React", "blockchain").',
                    },
                    "free_only": {
                        "type": "boolean",
                        "description": "If true, only return free events.",
                    },
                    "solo_friendly": {
                        "type": "boolean",
                        "description": "If true, only return events open to individual/solo participants.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_event_details",
            "description": (
                "Get full details of a specific event by its ID. "
                "Use when the user asks for more information about a specific event."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {
                        "type": "string",
                        "description": "The unique MongoDB ID of the event.",
                    },
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
                "Use when user says 'recommend something', 'what should I join', 'suggest events', "
                "or describes their background and wants matching events."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "interests": {
                        "type": "string",
                        "description": "Comma-separated topics of interest (e.g., 'AI, web dev, cloud, finance').",
                    },
                    "skills": {
                        "type": "string",
                        "description": "Comma-separated skills (e.g., 'Python, React, public speaking').",
                    },
                    "preferred_format": {
                        "type": "string",
                        "description": "'online' for virtual, 'offline' for in-person, or '' for any.",
                    },
                    "budget": {
                        "type": "string",
                        "description": "'free' if user wants free events only, '' for any.",
                    },
                    "team_size_preference": {
                        "type": "string",
                        "description": "'solo' for individual, 'team' for group events, '' for any.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_closing_soon",
            "description": (
                "Get events whose deadlines are coming up soon, sorted by urgency. "
                "Use when user asks about deadlines, 'last chance', 'closing soon', or 'apply before it's too late'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "days_threshold": {
                        "type": "integer",
                        "description": "Return events closing within this many days. Default is 14.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_prize_events",
            "description": (
                "Get events with the highest prize pools, sorted by prize value. "
                "Use when user asks about prizes, cash rewards, 'best prizes', or 'where can I win money'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Max number of events to return. Default is 5.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_events",
            "description": (
                "Compare two events side by side to help the user decide which to join. "
                "Use when user says 'compare X and Y', 'which is better', or 'help me decide between two events'. "
                "You must have the IDs of both events — call get_event_details or search_events first if needed."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id_1": {
                        "type": "string",
                        "description": "ID of the first event.",
                    },
                    "event_id_2": {
                        "type": "string",
                        "description": "ID of the second event.",
                    },
                },
                "required": ["event_id_1", "event_id_2"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_trending_events",
            "description": (
                "Get the most popular events ranked by number of registrations. "
                "Use when user asks about popular events, 'what's trending', 'most joined', or 'top events'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Max number of events to return. Default is 5.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_registration_guide",
            "description": (
                "Get step-by-step registration instructions for a specific event. "
                "Use when user asks 'how do I register?', 'how to apply?', 'walk me through registration', "
                "or needs help joining a specific event. Requires the event ID."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {
                        "type": "string",
                        "description": "The ID of the event to get registration instructions for.",
                    },
                },
                "required": ["event_id"],
            },
        },
    },
]
