import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.chat import router as chat_router
from api.admin import router as admin_router
from api.websocket import router as ws_router
from api.auth_routes import router as auth_router
from api.oauth_routes import router as oauth_router
from api.layer_routes import router as layer_router
from api.conversation_routes import router as conversation_router
from api.dashboard_routes import router as dashboard_router
from api.memory_routes import router as memory_router
from api.mcp_scanner_routes import router as mcp_scanner_router
from api.live_scan_routes import router as live_scan_router
from api.guest_chat_routes import router as guest_chat_router
from api.firewall_routes import router as firewall_router

app = FastAPI(
    title="AgentShield - Adaptive LLM Firewall",
    description="Production-grade 9-layer AI security middleware with real-time WebSocket events",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Will be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routers
app.include_router(chat_router, prefix="/chat")
app.include_router(admin_router, prefix="/admin")
app.include_router(ws_router, prefix="/ws")

# Auth & Layer API routers
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(layer_router)

# Feature routers
app.include_router(conversation_router)
app.include_router(dashboard_router)
app.include_router(memory_router)
app.include_router(mcp_scanner_router)
app.include_router(live_scan_router)
app.include_router(guest_chat_router)
app.include_router(firewall_router)


@app.get("/health")
async def health_check():
    return {
        "status": "operational",
        "firewall_active": True,
        "version": "1.0.0",
        "layers": 9
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
