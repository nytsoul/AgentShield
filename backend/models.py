from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class UserSignup(BaseModel):
    email: str
    password: str = Field(min_length=6)
    role: str = "user"  # "user" or "admin"


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    email: str


class UserInfo(BaseModel):
    user_id: str
    email: str
    role: str


class MessageRequest(BaseModel):
    content: str
    session_id: str = "default"
    history: List[Dict[str, str]] = []


class SecurityResponse(BaseModel):
    status: str
    processed_content: str
    risk_score: float
    layers_triggered: List[int]
    reason: Optional[str] = None
    target_llm: str = "primary"


class SecurityEvent(BaseModel):
    event_id: Optional[str] = None
    user_id: str
    session_id: str
    layer: int
    action: str  # "BLOCKED" or "PASSED"
    risk_score: float
    reason: str = ""
    content_preview: str = ""
    timestamp: Optional[str] = None


class LayerTestRequest(BaseModel):
    content: str
    session_id: str = "test-session"
    tools: List[str] = []
    documents: List[str] = []
    history: List[Dict[str, str]] = []
