from supabase import create_client, Client
from config import settings
from typing import Optional

_client: Optional[Client] = None


def get_db() -> Optional[Client]:
    """Get or create the Supabase client. Returns None if not configured."""
    global _client
    if _client is not None:
        return _client
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    if (not url or not key
            or url.startswith("your_") or key.startswith("your_")
            or len(url) < 10 or len(key) < 10):
        return None
    try:
        _client = create_client(url, key)
        return _client
    except Exception as e:
        print(f"[DB] Failed to create Supabase client: {e}")
        return None


async def log_event(event: dict) -> None:
    """
    Insert event into events table. Also upserts into sessions table.
    Logging failure must never block the security pipeline.
    """
    db = get_db()
    if not db:
        return
    try:
        db.table("events").insert({
            "event_id": event["event_id"],
            "session_id": event["session_id"],
            "layer": event["layer"],
            "action": event["action"],
            "threat_score": event["threat_score"],
            "reason": event["reason"],
            "owasp_tag": event["owasp_tag"],
            "turn_number": event["turn_number"],
            "x_coord": event.get("x_coord", 0.0),
            "y_coord": event.get("y_coord", 0.0),
            "metadata": event.get("metadata", {}),
            "timestamp": event["timestamp"]
        }).execute()
    except Exception as e:
        print(f"[DB] Failed to log event: {e}")


async def log_session_start(session_id: str, role: str) -> None:
    """Insert new row into sessions table. If exists, do nothing."""
    db = get_db()
    if not db:
        return
    try:
        db.table("sessions").upsert({
            "session_id": session_id,
            "role": role,
            "total_turns": 0,
            "final_risk_score": 0.0,
            "is_honeypot": False
        }, on_conflict="session_id").execute()
    except Exception as e:
        print(f"[DB] Failed to log session start: {e}")


async def log_session_end(session_id: str, total_turns: int,
                          final_risk_score: float,
                          is_honeypot: bool) -> None:
    """Update session with final stats."""
    db = get_db()
    if not db:
        return
    try:
        db.table("sessions").update({
            "total_turns": total_turns,
            "final_risk_score": final_risk_score,
            "is_honeypot": is_honeypot,
            "ended_at": "now()"
        }).eq("session_id", session_id).execute()
    except Exception as e:
        print(f"[DB] Failed to log session end: {e}")


async def log_memory_snapshot(session_id: str, content_hash: str,
                              content_length: int,
                              quarantined: bool,
                              quarantine_reason: str = None) -> None:
    """Log a memory state snapshot."""
    db = get_db()
    if not db:
        return
    try:
        db.table("memory_snapshots").insert({
            "session_id": session_id,
            "snapshot_hash": content_hash,
            "content_length": content_length,
            "quarantined": quarantined,
            "quarantine_reason": quarantine_reason
        }).execute()
    except Exception as e:
        print(f"[DB] Failed to log memory snapshot: {e}")


async def log_honeypot_message(session_id: str, role: str,
                               content: str) -> None:
    """Append message to honeypot_sessions. Creates row if not exists."""
    db = get_db()
    if not db:
        return
    try:
        # Check if row exists
        existing = db.table("honeypot_sessions").select("*").eq(
            "session_id", session_id).execute()

        if existing.data:
            messages = existing.data[0].get("messages", [])
            messages.append({"role": role, "content": content})
            db.table("honeypot_sessions").update({
                "messages": messages,
                "total_messages": len(messages)
            }).eq("session_id", session_id).execute()
        else:
            db.table("honeypot_sessions").insert({
                "session_id": session_id,
                "messages": [{"role": role, "content": content}],
                "attack_type": "unknown",
                "total_messages": 1
            }).execute()
    except Exception as e:
        print(f"[DB] Failed to log honeypot message: {e}")


async def get_threat_log(
    action: str = None,
    layer: int = None,
    owasp_tag: str = None,
    page: int = 1,
    page_size: int = 20
) -> dict:
    """
    Get paginated, filtered threat log from events table.
    Returns {"events": list, "total": int, "page": int, "pages": int}
    """
    db = get_db()
    if not db:
        return {"events": [], "total": 0, "page": page, "pages": 0}

    try:
        query = db.table("events").select("*", count="exact")

        if action:
            query = query.eq("action", action)
        if layer is not None:
            query = query.eq("layer", layer)
        if owasp_tag:
            query = query.eq("owasp_tag", owasp_tag)

        # Pagination
        offset = (page - 1) * page_size
        query = query.order("timestamp", desc=True).range(
            offset, offset + page_size - 1)

        result = query.execute()
        total = result.count if result.count else len(result.data)
        pages = (total + page_size - 1) // page_size if total else 0

        return {
            "events": result.data,
            "total": total,
            "page": page,
            "pages": pages
        }
    except Exception as e:
        print(f"[DB] Failed to get threat log: {e}")
        return {"events": [], "total": 0, "page": page, "pages": 0}


async def get_session_detail(session_id: str) -> dict:
    """Returns {"session": session_row, "events": list_of_events}."""
    db = get_db()
    if not db:
        return {"session": None, "events": []}
    try:
        session = db.table("sessions").select("*").eq(
            "session_id", session_id).single().execute()
        events = db.table("events").select("*").eq(
            "session_id", session_id).order(
            "timestamp", desc=True).execute()
        return {
            "session": session.data,
            "events": events.data
        }
    except Exception as e:
        print(f"[DB] Failed to get session detail: {e}")
        return {"session": None, "events": []}


async def get_recent_events(limit: int = 20) -> list:
    """Returns most recent N events ordered by timestamp DESC."""
    db = get_db()
    if not db:
        return []
    try:
        result = db.table("events").select("*").order(
            "timestamp", desc=True).limit(limit).execute()
        return result.data
    except Exception as e:
        print(f"[DB] Failed to get recent events: {e}")
        return []


async def get_blocked_today_count() -> int:
    """Get count of BLOCKED events from today."""
    db = get_db()
    if not db:
        return 0
    try:
        from datetime import datetime, timezone
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0).isoformat()
        result = db.table("events").select("event_id", count="exact").eq(
            "action", "BLOCKED").gte("timestamp", today_start).execute()
        return result.count if result.count else 0
    except Exception as e:
        print(f"[DB] Failed to get blocked count: {e}")
        return 0


async def get_total_events_today() -> int:
    """Get total event count from today."""
    db = get_db()
    if not db:
        return 0
    try:
        from datetime import datetime, timezone
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0).isoformat()
        result = db.table("events").select("event_id", count="exact").gte(
            "timestamp", today_start).execute()
        return result.count if result.count else 0
    except Exception as e:
        print(f"[DB] Failed to get total events: {e}")
        return 0
