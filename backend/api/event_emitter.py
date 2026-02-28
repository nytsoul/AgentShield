import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Set
from fastapi import WebSocket


# Global set of connected admin WebSocket clients
_admin_connections: Set[WebSocket] = set()


async def register_admin_connection(websocket: WebSocket) -> None:
    """Accept and register a new admin WebSocket connection."""
    await websocket.accept()
    _admin_connections.add(websocket)


async def unregister_admin_connection(websocket: WebSocket) -> None:
    """Remove a disconnected admin WebSocket from the set."""
    _admin_connections.discard(websocket)


async def emit_event(
    session_id: str,
    layer: int,
    action: str,
    threat_score: float,
    reason: str,
    owasp_tag: str,
    turn_number: int,
    x_coord: float = 0.0,
    y_coord: float = 0.0,
    metadata: dict = None
) -> dict:
    """
    Build a security event and broadcast it to all connected admin clients.

    Returns the event dict for Supabase logging.
    Dead connections are automatically removed.
    """
    event = {
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
        "layer": layer,
        "action": action,
        "threat_score": threat_score,
        "reason": reason,
        "owasp_tag": owasp_tag,
        "turn_number": turn_number,
        "x_coord": x_coord,
        "y_coord": y_coord,
        "metadata": metadata or {}
    }

    event_json = json.dumps(event)

    # Broadcast to all connected admin clients concurrently
    dead_connections = set()

    async def _send(ws: WebSocket):
        try:
            await ws.send_text(event_json)
        except Exception:
            dead_connections.add(ws)

    if _admin_connections:
        await asyncio.gather(*[_send(ws) for ws in _admin_connections])

    # Remove dead connections
    for ws in dead_connections:
        _admin_connections.discard(ws)

    return event
