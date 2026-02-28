import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.chat import router as chat_router
from api.admin import router as admin_router
from api.websocket import router as ws_router
from api.auth_routes import router as auth_router
from api.layer_routes import router as layer_router

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
app.include_router(layer_router)


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
