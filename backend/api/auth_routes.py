from fastapi import APIRouter, HTTPException, Depends
from models import UserSignup, UserLogin, TokenResponse, UserInfo
from auth import signup_user, login_user, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse)
async def signup(req: UserSignup):
    """Register a new user or admin account."""
    if req.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")

    result = signup_user(req.email, req.password, req.role)
    return TokenResponse(
        access_token=result["access_token"],
        user_id=result["user_id"],
        role=result["role"],
        email=result["email"]
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: UserLogin):
    """Login with email and password. Returns JWT token."""
    result = login_user(req.email, req.password)
    return TokenResponse(
        access_token=result["access_token"],
        user_id=result["user_id"],
        role=result["role"],
        email=result["email"]
    )


@router.get("/me")
async def get_me(user: UserInfo = Depends(get_current_user)):
    """Get current authenticated user info."""
    return {"user_id": user.user_id, "email": user.email, "role": user.role}
