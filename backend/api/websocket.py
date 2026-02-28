from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from api.event_emitter import register_admin_connection, unregister_admin_connection

router = APIRouter()


@router.websocket("/admin")
async def admin_websocket(websocket: WebSocket):
    """
    Admin-only WebSocket endpoint.
    Receives security events in real-time.
    Client sends pings to keep alive; server replies with pong.
    """
    await register_admin_connection(websocket)
    try:
        while True:
            # Keep connection alive — receive any ping from client
            data = await websocket.receive_text()
            # Just acknowledge — admin WS is receive-only for pings
            await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        await unregister_admin_connection(websocket)
