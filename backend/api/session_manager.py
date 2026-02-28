from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import hashlib


@dataclass
class SessionState:
    session_id: str
    role: str  # "guest", "user", "admin"
    created_at: datetime = field(default_factory=datetime.utcnow)
    turn_count: int = 0
    cumulative_risk_score: float = 0.0
    conversation_history: list = field(default_factory=list)
    # Each item: {"role": "user"|"assistant", "content": str,
    #             "risk_score": float, "turn": int}
    memory_content: str = ""
    memory_hash: str = ""
    is_honeypot: bool = False
    layer_decisions: list = field(default_factory=list)
    # Each item: {"layer": int, "action": str, "reason": str,
    #             "threat_score": float, "turn": int, "timestamp": str}


# In-memory store
_sessions: dict[str, SessionState] = {}


def get_or_create_session(session_id: str, role: str) -> SessionState:
    if session_id not in _sessions:
        _sessions[session_id] = SessionState(
            session_id=session_id, role=role
        )
    return _sessions[session_id]


def get_session(session_id: str) -> Optional[SessionState]:
    return _sessions.get(session_id)


def update_session_risk(session_id: str, new_risk_score: float) -> None:
    session = _sessions.get(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")
    # Cumulative risk = weighted average, newer turns weighted more
    alpha = 0.6  # weight for new score
    session.cumulative_risk_score = (
        alpha * new_risk_score +
        (1 - alpha) * session.cumulative_risk_score
    )


def add_turn(session_id: str, user_msg: str, assistant_msg: str,
             risk_score: float) -> None:
    session = _sessions.get(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")
    session.turn_count += 1
    session.conversation_history.append({
        "role": "user",
        "content": user_msg,
        "risk_score": risk_score,
        "turn": session.turn_count
    })
    session.conversation_history.append({
        "role": "assistant",
        "content": assistant_msg,
        "risk_score": 0.0,  # Output risk added by Layer 5
        "turn": session.turn_count
    })


def record_layer_decision(session_id: str, layer: int, action: str,
                          reason: str, threat_score: float) -> None:
    session = _sessions.get(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")
    session.layer_decisions.append({
        "layer": layer,
        "action": action,
        "reason": reason,
        "threat_score": threat_score,
        "turn": session.turn_count,
        "timestamp": datetime.utcnow().isoformat()
    })


def mark_as_honeypot(session_id: str) -> None:
    session = _sessions.get(session_id)
    if session:
        session.is_honeypot = True


def get_all_active_sessions() -> list[SessionState]:
    return list(_sessions.values())


def end_session(session_id: str) -> Optional[SessionState]:
    return _sessions.pop(session_id, None)
