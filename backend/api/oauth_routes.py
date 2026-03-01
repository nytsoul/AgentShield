"""
OAuth authentication routes for Google sign-in.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from pydantic import BaseModel
import os
from config import settings
from google_oauth import (
    verify_google_token,
    create_or_update_google_user,
    create_access_token,
    decode_token
)
from models import TokenResponse, UserInfo

router = APIRouter(prefix="/auth", tags=["OAuth"])
security = HTTPBearer(auto_error=False)


class GoogleTokenRequest(BaseModel):
    id_token: str


@router.post("/google")
async def google_sign_in(request: GoogleTokenRequest):
    """
    Handle Google OAuth sign-in with ID token.
    Client sends the ID token received from Google Sign-In library.
    """
    try:
        # Verify and decode Google token
        google_info = verify_google_token(request.id_token)
        
        # Create or update user and get access token
        access_token = create_or_update_google_user(google_info)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=google_info.get('sub', 'unknown'),
            role="user",
            email=google_info.get('email', '')
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        print(f"Google sign-in error: {e}")
        raise HTTPException(status_code=500, detail="Google sign-in failed")


@router.get("/google/callback")
async def google_callback(code: str = Query(...), state: Optional[str] = None):
    """
    Handle Google OAuth callback (server-side flow).
    This is used if implementing traditional OAuth2 server-side flow.
    """
    try:
        from google.oauth2 import webassertions
        from google.auth.transport.requests import Request
        
        google_client_id = os.getenv("GOOGLE_CLIENT_ID", settings.GOOGLE_CLIENT_ID)
        google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", settings.GOOGLE_CLIENT_SECRET)
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", settings.GOOGLE_REDIRECT_URI)
        
        if not all([google_client_id, google_client_secret]):
            raise HTTPException(status_code=500, detail="Google OAuth not configured")
        
        # Exchange authorization code for token
        import requests
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": google_client_id,
                "client_secret": google_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to exchange code for token")
        
        token_data = token_response.json()
        id_token = token_data.get('id_token')
        
        # Verify and decode Google token
        google_info = verify_google_token(id_token)
        
        # Create or update user and get access token
        access_token = create_or_update_google_user(google_info)
        
        # Redirect to frontend with token
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(
            url=f"{frontend_url}/auth/callback?token={access_token}&email={google_info.get('email')}"
        )
    
    except Exception as e:
        print(f"Google callback error: {e}")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(
            url=f"{frontend_url}/auth?error=google_signin_failed"
        )


@router.post("/verify-token")
async def verify_token(request: GoogleTokenRequest):
    """
    Verify and decode a JWT token from MongoDB auth.
    """
    try:
        payload = decode_token(request.id_token)
        
        from mongodb import get_user_by_id
        user = get_user_by_id(payload.get('sub', ''))
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "valid": True,
            "user_id": payload.get('sub'),
            "email": payload.get('email'),
            "role": payload.get('role', 'user')
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        print(f"Token verification error: {e}")
        raise HTTPException(status_code=500, detail="Token verification failed")


@router.get("/me")
async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Get current user info from JWT token.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    try:
        payload = decode_token(credentials.credentials)
        
        from mongodb import get_user_by_id
        user = get_user_by_id(payload.get('sub', ''))
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "user_id": payload.get('sub'),
            "email": user.get('email'),
            "name": user.get('name'),
            "picture": user.get('picture'),
            "role": user.get('role', 'user')
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        print(f"Get current user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user info")
