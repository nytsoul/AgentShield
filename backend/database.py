import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, Dict, Any

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

_client: Optional[Client] = None


def get_supabase() -> Optional[Client]:
    """Get or create the Supabase client. Returns None if credentials are missing."""
    global _client
    if _client:
        return _client
    if not SUPABASE_URL or not SUPABASE_KEY or SUPABASE_URL == "your_url":
        print("[WARN] Supabase credentials not configured. DB operations will be skipped.")
        return None
    _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def log_security_event(
    user_id: str,
    session_id: str,
    layer: int,
    action: str,
    risk_score: float,
    reason: str = "",
    content_preview: str = ""
) -> bool:
    """Log a security event to Supabase. Returns True on success."""
    client = get_supabase()
    if not client:
        return False
    try:
        client.table("security_events").insert({
            "user_id": user_id,
            "session_id": session_id,
            "layer": layer,
            "action": action,
            "risk_score": risk_score,
            "reason": reason,
            "content_preview": content_preview[:200]
        }).execute()
        return True
    except Exception as e:
        print(f"[DB ERROR] Failed to log event: {e}")
        return False


def get_security_events(limit: int = 50) -> list:
    """Get recent security events from Supabase."""
    client = get_supabase()
    if not client:
        return []
    try:
        result = client.table("security_events") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return result.data
    except Exception as e:
        print(f"[DB ERROR] Failed to fetch events: {e}")
        return []


def get_dashboard_stats() -> Dict[str, Any]:
    """Get aggregated stats for the dashboard."""
    client = get_supabase()
    if not client:
        # Return fallback stats when DB is not available
        return {
            "total_messages": 0,
            "threats_blocked": 0,
            "active_honeypots": 0,
            "system_health": 99.9,
            "risk_distribution": {"low": 0, "medium": 0, "high": 0},
            "recent_events": [],
            "db_connected": False
        }

    try:
        all_events = client.table("security_events").select("*").execute()
        events = all_events.data

        total = len(events)
        blocked = len([e for e in events if e.get("action") == "BLOCKED"])
        honeypots = len([e for e in events if e.get("layer") == 6])

        high = len([e for e in events if e.get("risk_score", 0) > 0.7])
        medium = len([e for e in events if 0.3 < e.get("risk_score", 0) <= 0.7])
        low = total - high - medium

        recent = sorted(events, key=lambda x: x.get("created_at", ""), reverse=True)[:10]

        return {
            "total_messages": total,
            "threats_blocked": blocked,
            "active_honeypots": honeypots,
            "system_health": round(100 - (blocked / max(total, 1) * 100), 1),
            "risk_distribution": {"low": low, "medium": medium, "high": high},
            "recent_events": recent,
            "db_connected": True
        }
    except Exception as e:
        print(f"[DB ERROR] Failed to get stats: {e}")
        return {
            "total_messages": 0,
            "threats_blocked": 0,
            "active_honeypots": 0,
            "system_health": 99.9,
            "risk_distribution": {"low": 0, "medium": 0, "high": 0},
            "recent_events": [],
            "db_connected": False
        }
