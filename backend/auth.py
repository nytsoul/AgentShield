import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from models import UserInfo

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

security = HTTPBearer(auto_error=False)


def _get_auth_client():
    """Get Supabase client for auth operations."""
    if not SUPABASE_URL or not SUPABASE_KEY or SUPABASE_URL == "your_url":
        return None
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def signup_user(email: str, password: str, role: str = "user") -> dict:
    """Register a new user with Supabase Auth."""
    client = _get_auth_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        response = client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {"role": role}
            }
        })

        if response.user:
            return {
                "user_id": response.user.id,
                "email": response.user.email,
                "role": role,
                "access_token": response.session.access_token if response.session else ""
            }
        raise HTTPException(status_code=400, detail="Signup failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")


def login_user(email: str, password: str) -> dict:
    """Authenticate user and return JWT token."""
    client = _get_auth_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        response = client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if response.user and response.session:
            role = response.user.user_metadata.get("role", "user")
            return {
                "access_token": response.session.access_token,
                "user_id": response.user.id,
                "email": response.user.email,
                "role": role
            }
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login error: {str(e)}")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> UserInfo:
    """Verify JWT and extract user info. Returns a demo user if Supabase is not configured."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )

    client = _get_auth_client()
    if not client:
        # Demo mode: accept any token and return a demo user
        return UserInfo(user_id="demo-user", email="demo@firewall.ai", role="admin")

    try:
        token = credentials.credentials
        user_response = client.auth.get_user(token)

        if user_response and user_response.user:
            role = user_response.user.user_metadata.get("role", "user")
            return UserInfo(
                user_id=user_response.user.id,
                email=user_response.user.email or "",
                role=role
            )
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


async def require_admin(user: UserInfo = Depends(get_current_user)) -> UserInfo:
    """Dependency that requires the user to be an admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
