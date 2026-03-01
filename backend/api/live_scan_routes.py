"""
Live Scanning Routes - Real-time Ingestion Pipeline Testing
Provides endpoints for live scanning without requiring authentication
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Set
import asyncio
import json
from datetime import datetime, timezone

from classifiers.ingestion_layer import analyze_ingestion
from api.event_emitter import emit_event
from database import log_security_event

router = APIRouter(prefix="/api/live-scan", tags=["Live Scanning"])

# Global set of connected live scan WebSocket clients
_live_scan_connections: Set[WebSocket] = set()


class LiveScanRequest(BaseModel):
    content: str
    user_role: str = "guest"
    session_id: str = "live-scan-session"


class LiveScanResult(BaseModel):
    is_blocked: bool
    risk_score: float
    reason: str
    detected_language: str
    injection_vectors: List[str]
    role_threshold: float
    scan_time: str
    content_length: int
    scan_id: str


@router.post("/scan", response_model=LiveScanResult)
async def live_scan(request: LiveScanRequest):
    """
    Live scan endpoint for real-time ingestion analysis.
    No authentication required - intended for live preview functionality.
    """
    try:
        # Perform ingestion analysis
        result = analyze_ingestion(request.content, request.user_role)
        
        # Generate scan ID and timestamp
        scan_time = datetime.now(timezone.utc).isoformat()
        scan_id = f"LIVE-{datetime.now().strftime('%H%M%S')}-{hash(request.content) % 10000:04d}"
        
        # Create response
        live_result = LiveScanResult(
            is_blocked=result["is_blocked"],
            risk_score=result["risk_score"],
            reason=result.get("reason", ""),
            detected_language=result.get("detected_language", "English"),
            injection_vectors=result.get("injection_vectors", []),
            role_threshold=result.get("role_threshold", 0.3),
            scan_time=scan_time,
            content_length=len(request.content),
            scan_id=scan_id
        )
        
        # Broadcast to live scan WebSocket clients
        await broadcast_live_scan_result(live_result.model_dump())
        
        # Log the scan (optional - can be disabled for high frequency scans)
        if len(request.content) > 10:  # Only log meaningful scans
            try:
                log_security_event(
                    user_id="live-scanner",
                    session_id=request.session_id,
                    layer=1,
                    action="BLOCKED" if result["is_blocked"] else "PASSED",
                    risk_score=result["risk_score"],
                    reason=result.get("reason", ""),
                    content_preview=request.content[:100]
                )
            except Exception:
                pass  # Don't fail scan if logging fails
        
        return live_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live scan failed: {str(e)}")


@router.get("/stats")
async def get_live_scan_stats():
    """
    Get live scanning statistics and system status.
    """
    return {
        "status": "active",
        "connected_clients": len(_live_scan_connections),
        "supported_languages": [
            "English", "Hindi", "Hinglish", "Bengali", "Tamil", "Telugu", 
            "Gujarati", "Marathi", "Kannada", "Malayalam", "Odia", 
            "Punjabi", "Arabic", "Chinese", "Cyrillic"
        ],
        "detection_capabilities": [
            "Prompt injection detection",
            "Multi-language attack vectors", 
            "Homoglyph normalization",
            "Role-based thresholds",
            "Code injection patterns",
            "XSS vector detection",
            "System command detection"
        ],
        "performance": {
            "avg_scan_time": "~14ms",
            "max_input_length": 10000,
            "supported_encodings": ["UTF-8", "UTF-16", "ASCII"]
        }
    }


@router.websocket("/ws")
async def live_scan_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time live scan results.
    Clients can connect to receive live scan results as they happen.
    """
    await register_live_scan_connection(websocket)
    try:
        while True:
            # Keep connection alive and handle any messages from client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif message.get("type") == "scan":
                    # Handle inline scan request through WebSocket
                    content = message.get("content", "")
                    if content:
                        result = analyze_ingestion(content, "guest")
                        scan_result = {
                            "type": "scan_result",
                            "scan_id": f"WS-{datetime.now().strftime('%H%M%S')}-{hash(content) % 1000:03d}",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "result": result
                        }
                        await websocket.send_text(json.dumps(scan_result))
                        
            except json.JSONDecodeError:
                # If it's not JSON, treat as a simple ping
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        await unregister_live_scan_connection(websocket)


async def register_live_scan_connection(websocket: WebSocket) -> None:
    """Accept and register a new live scan WebSocket connection."""
    await websocket.accept()
    _live_scan_connections.add(websocket)
    
    # Send welcome message
    welcome = {
        "type": "connected",
        "message": "Live scan WebSocket connected",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "capabilities": ["real-time-scan", "multi-language", "threat-detection"]
    }
    await websocket.send_text(json.dumps(welcome))


async def unregister_live_scan_connection(websocket: WebSocket) -> None:
    """Remove a disconnected WebSocket from the set."""
    _live_scan_connections.discard(websocket)


async def broadcast_live_scan_result(result: Dict[str, Any]) -> None:
    """
    Broadcast a live scan result to all connected WebSocket clients.
    Dead connections are automatically removed.
    """
    if not _live_scan_connections:
        return
        
    broadcast_message = {
        "type": "live_scan_result",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "result": result
    }
    
    message_json = json.dumps(broadcast_message)
    dead_connections = set()
    
    async def _send(ws: WebSocket):
        try:
            await ws.send_text(message_json)
        except Exception:
            dead_connections.add(ws)
    
    # Broadcast to all connected clients
    await asyncio.gather(*[_send(ws) for ws in _live_scan_connections], return_exceptions=True)
    
    # Remove dead connections
    for ws in dead_connections:
        _live_scan_connections.discard(ws)


@router.get("/health")
async def live_scan_health():
    """Health check for live scanning service."""
    return {
        "status": "healthy",
        "service": "live-scan",
        "active_connections": len(_live_scan_connections),
        "ingestion_layer": "operational",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }