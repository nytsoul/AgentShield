"""
Guest Chat History Routes - Unauthenticated chat session management
Provides basic session storage and history without requiring user authentication
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import json
import os

router = APIRouter(prefix="/api/guest-chat", tags=["Guest Chat"])

# Simple file-based storage for guest sessions (in production, use Redis/DB)
GUEST_SESSIONS_FILE = "guest_chat_sessions.json"


class GuestMessage(BaseModel):
    id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: int
    status: str  # 'sent', 'processing', 'secured', 'blocked'
    session_id: str
    layers: Optional[List[Dict[str, Any]]] = None


class GuestSession(BaseModel):
    id: str
    name: str
    messages: List[GuestMessage]
    created_at: int
    last_updated: int
    total_messages: int
    blocked_messages: int
    risk_score: float


class CreateSessionRequest(BaseModel):
    name: str = "Guest Chat"


class AddMessageRequest(BaseModel):
    session_id: str
    message: GuestMessage


def load_guest_sessions() -> Dict[str, Dict]:
    """Load guest sessions from file storage"""
    if not os.path.exists(GUEST_SESSIONS_FILE):
        return {}
    
    try:
        with open(GUEST_SESSIONS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def save_guest_sessions(sessions: Dict[str, Dict]) -> None:
    """Save guest sessions to file storage"""
    try:
        with open(GUEST_SESSIONS_FILE, 'w') as f:
            json.dump(sessions, f, indent=2)
    except Exception as e:
        print(f"Error saving guest sessions: {e}")


@router.post("/sessions", response_model=GuestSession)
async def create_guest_session(request: CreateSessionRequest):
    """Create a new guest chat session"""
    session_id = f"guest_{int(datetime.now().timestamp() * 1000)}_{hash(request.name) % 10000:04d}"
    
    session = GuestSession(
        id=session_id,
        name=request.name,
        messages=[],
        created_at=int(datetime.now().timestamp() * 1000),
        last_updated=int(datetime.now().timestamp() * 1000),
        total_messages=0,
        blocked_messages=0,
        risk_score=0.0
    )
    
    sessions = load_guest_sessions()
    sessions[session_id] = session.model_dump()
    
    # Keep only the latest 100 guest sessions
    if len(sessions) > 100:
        sorted_sessions = sorted(sessions.items(), key=lambda x: x[1]['last_updated'], reverse=True)
        sessions = dict(sorted_sessions[:100])
    
    save_guest_sessions(sessions)
    return session


@router.get("/sessions", response_model=List[GuestSession])
async def get_guest_sessions(limit: int = Query(50, ge=1, le=100)):
    """Get recent guest chat sessions"""
    sessions = load_guest_sessions()
    
    # Sort by last_updated and return latest sessions
    sorted_sessions = sorted(
        sessions.values(), 
        key=lambda x: x['last_updated'], 
        reverse=True
    )
    
    return [GuestSession(**session) for session in sorted_sessions[:limit]]


@router.get("/sessions/{session_id}", response_model=GuestSession)
async def get_guest_session(session_id: str):
    """Get a specific guest session"""
    sessions = load_guest_sessions()
    
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    return GuestSession(**sessions[session_id])


@router.put("/sessions/{session_id}")
async def update_guest_session(session_id: str, session: GuestSession):
    """Update a guest session"""
    sessions = load_guest_sessions()
    
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    sessions[session_id] = session.model_dump()
    save_guest_sessions(sessions)
    
    return {"message": "Session updated successfully"}


@router.delete("/sessions/{session_id}")
async def delete_guest_session(session_id: str):
    """Delete a guest session"""
    sessions = load_guest_sessions()
    
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    del sessions[session_id]
    save_guest_sessions(sessions)
    
    return {"message": "Session deleted successfully"}


@router.post("/sessions/{session_id}/messages")
async def add_message_to_session(session_id: str, message: GuestMessage):
    """Add a message to a guest session"""
    sessions = load_guest_sessions()
    
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    session_data = sessions[session_id]
    session_data['messages'].append(message.model_dump())
    session_data['last_updated'] = int(datetime.now().timestamp() * 1000)
    
    # Update statistics
    if message.role == 'user':
        session_data['total_messages'] += 1
    if message.status == 'blocked':
        session_data['blocked_messages'] += 1
    
    # Update risk score (simple average of layer scores)
    if message.layers:
        total_risk = sum(layer.get('threat_score', 0) for layer in message.layers)
        message_count = len([m for m in session_data['messages'] if m.get('layers')])
        if message_count > 0:
            session_data['risk_score'] = min(total_risk / message_count, 1.0)
    
    sessions[session_id] = session_data
    save_guest_sessions(sessions)
    
    return {"message": "Message added successfully"}


@router.get("/stats")
async def get_guest_chat_stats():
    """Get guest chat statistics"""
    sessions = load_guest_sessions()
    
    if not sessions:
        return {
            "total_sessions": 0,
            "total_messages": 0,
            "blocked_messages": 0,
            "avg_risk_score": 0.0,
            "active_today": 0
        }
    
    total_sessions = len(sessions)
    total_messages = sum(len(s.get('messages', [])) for s in sessions.values())
    blocked_messages = sum(s.get('blocked_messages', 0) for s in sessions.values())
    avg_risk = sum(s.get('risk_score', 0) for s in sessions.values()) / total_sessions
    
    # Count sessions active today
    today_timestamp = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).timestamp() * 1000
    active_today = sum(1 for s in sessions.values() if s.get('last_updated', 0) >= today_timestamp)
    
    return {
        "total_sessions": total_sessions,
        "total_messages": total_messages,
        "blocked_messages": blocked_messages,
        "avg_risk_score": round(avg_risk, 3),
        "active_today": active_today
    }


@router.delete("/sessions")
async def clear_all_guest_sessions():
    """Clear all guest sessions (admin function)"""
    try:
        if os.path.exists(GUEST_SESSIONS_FILE):
            os.remove(GUEST_SESSIONS_FILE)
        return {"message": "All guest sessions cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing sessions: {str(e)}")


@router.get("/export")
async def export_guest_sessions():
    """Export all guest sessions as JSON"""
    sessions = load_guest_sessions()
    
    export_data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "total_sessions": len(sessions),
        "sessions": list(sessions.values())
    }
    
    return export_data