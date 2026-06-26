try:
    from langdetect import detect
except Exception:
    detect = None
import re

# Simple rule-based NLU

def detect_language(text: str) -> str:
    if not detect:
        return "en"
    try:
        return detect(text)
    except Exception:
        return "en"


def parse_intent(text: str) -> dict:
    t = text.lower()
    # register intent
    if any(w in t for w in ["register", "sign up", "signup", "i want to register", "enroll"]):
        # try to extract an event id
        m = re.search(r"\b(\d{1,6})\b", t)
        event_id = m.group(1) if m else ""
        return {"intent": "register", "event_id": event_id}

    # create team
    if "create team" in t or "new team" in t:
        m = re.search(r"create team(?: named)?\s+([\w\s-]+)", t)
        team_name = m.group(1).strip() if m else ""
        return {"intent": "create_team", "team_name": team_name}

    # join team
    if "join team" in t or "join" in t and "team" in t:
        m = re.search(r"join team(?: id)?\s*(\w+)", t)
        team_id = m.group(1) if m else ""
        return {"intent": "join_team", "team_id": team_id}

    # details
    if any(w in t for w in ["details", "detail", "more info", "tell me about"]) and re.search(r"\b(\d{1,6})\b", t):
        m = re.search(r"\b(\d{1,6})\b", t)
        return {"intent": "details", "event_id": m.group(1)}

    # organizer: create event
    if "create event" in t or "new event" in t:
        # try to pull simple fields: title in quotes, date like YYYY-MM-DD, location after in
        title_m = re.search(r"title\s*[:=]\s*\"([^\"]+)\"", text, re.IGNORECASE)
        if not title_m:
            title_m = re.search(r"\"([^\"]+)\"", text)
        title = title_m.group(1).strip() if title_m else ""
        date_m = re.search(r"(\d{4}-\d{2}-\d{2})", text)
        date = date_m.group(1) if date_m else ""
        loc_m = re.search(r"location\s*[:=]\s*([\w\s,.-]+)", text, re.IGNORECASE)
        location = loc_m.group(1).strip() if loc_m else ""
        return {"intent": "create_event", "title": title, "date": date, "location": location}

    # organizer: list registrations / show who registered
    if any(w in t for w in ["list registrations", "show registrations", "who registered", "registrations for"]) or ("registrations" in t and re.search(r"\b(\d{1,6})\b", t)):
        m = re.search(r"\b(\d{1,6})\b", t)
        event_id = m.group(1) if m else ""
        return {"intent": "list_registrations", "event_id": event_id}

    # organizer: list teams
    if any(w in t for w in ["list teams", "show teams", "teams for"]) or ("teams" in t and re.search(r"\b(\d{1,6})\b", t)):
        m = re.search(r"\b(\d{1,6})\b", t)
        event_id = m.group(1) if m else ""
        return {"intent": "list_teams", "event_id": event_id}

    # search
    # extract location keywords like 'in <city>'
    m = re.search(r"in\s+([a-zA-Z ]+)", t)
    location = m.group(1).strip() if m else ""
    # extract skill keywords (naive)
    skills = []
    for kw in ["python", "react", "ai", "machine learning", "hackathon", "workshop"]:
        if kw in t:
            skills.append(kw)
    return {"intent": "search", "location": location, "skills": skills, "keyword": t}
