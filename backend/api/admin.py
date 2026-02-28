from fastapi import APIRouter, Query
from typing import Optional

from api.db import (
    get_threat_log, get_session_detail, get_recent_events,
    get_blocked_today_count, get_total_events_today
)
from api.session_manager import get_all_active_sessions, get_session

router = APIRouter()


@router.get("/threat-log")
async def threat_log(
    action: Optional[str] = Query(None, description="Filter by action: BLOCKED, PASSED, etc."),
    layer: Optional[int] = Query(None, description="Filter by layer number 1-9"),
    owasp_tag: Optional[str] = Query(None, description="Filter by OWASP tag"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """
    Get paginated, filtered threat log.
    Returns {"events": list, "total": int, "page": int, "pages": int}
    """
    return await get_threat_log(
        action=action, layer=layer, owasp_tag=owasp_tag,
        page=page, page_size=page_size
    )


@router.get("/session/{session_id}/detail")
async def session_detail(session_id: str):
    """
    Get full session detail including events and conversation history.
    Returns {"session": dict, "events": list, "conversation": list}
    """
    db_detail = await get_session_detail(session_id)

    # Also get in-memory conversation history if session is active
    memory_session = get_session(session_id)
    conversation = []
    if memory_session:
        conversation = memory_session.conversation_history

    return {
        "session": db_detail.get("session"),
        "events": db_detail.get("events", []),
        "conversation": conversation
    }


@router.get("/recent-events")
async def recent_events(limit: int = Query(20, ge=1, le=100)):
    """Get most recent N security events."""
    return await get_recent_events(limit)


@router.get("/active-sessions")
async def active_sessions():
    """
    List all currently active in-memory sessions.
    Returns session_id, role, turn_count, risk, honeypot status.
    """
    sessions = get_all_active_sessions()
    return [
        {
            "session_id": s.session_id,
            "role": s.role,
            "turn_count": s.turn_count,
            "cumulative_risk_score": round(s.cumulative_risk_score, 4),
            "is_honeypot": s.is_honeypot,
            "created_at": s.created_at.isoformat()
        }
        for s in sessions
    ]


@router.get("/stats")
async def admin_stats():
    """
    Get aggregate dashboard stats.
    Returns active sessions, blocked today, honeypot count, total events.
    """
    sessions = get_all_active_sessions()
    honeypot_count = sum(1 for s in sessions if s.is_honeypot)
    blocked_today = await get_blocked_today_count()
    total_today = await get_total_events_today()

    return {
        "active_sessions": len(sessions),
        "blocked_today": blocked_today,
        "honeypot_active": honeypot_count,
        "total_events_today": total_today
    }


@router.post("/demo/cross-agent")
async def cross_agent_demo(body: dict):
    """
    Two-agent LangGraph demo pipeline for Layer 7.
    Stub for now — will be replaced with real LangGraph pipeline.
    """
    message = body.get("message", "")
    return {
        "result": "Agent pipeline demo",
        "intercepted": False,
        "message_received": message,
        "agents": ["Agent-A (primary)", "Agent-B (validator)"],
        "pipeline_status": "stub"
    }
