"""
Google OAuth integration with MongoDB.
"""
from google.auth.transport.requests import Request
from google.oauth2.id_token import verify_oauth2_token
from config import settings
import json
from datetime import datetime, timedelta
from jose import jwt
import os


def get_google_redirect_uri() -> str:
    """Get Google OAuth redirect URI."""
    return os.getenv("GOOGLE_REDIRECT_URI", settings.GOOGLE_REDIRECT_URI)


def verify_google_token(token: str) -> dict:
    """
    Verify Google ID token and return decoded token.
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID", settings.GOOGLE_CLIENT_ID)
    
    if not client_id:
        raise ValueError("GOOGLE_CLIENT_ID not configured")
    
    try:
        idinfo = verify_oauth2_token(token, Request(), client_id)
        return idinfo
    except ValueError as e:
        raise ValueError(f"Invalid token: {str(e)}")


def create_or_update_google_user(google_info: dict) -> str:
    """
    Create or update user from Google OAuth info and return access token.
    Returns JWT access token.
    """
    from mongodb import get_user_by_email, create_user, update_user
    
    email = google_info.get('email')
    name = google_info.get('name', email.split('@')[0])
    picture = google_info.get('picture', '')
    
    if not email:
        raise ValueError("No email in Google token")
    
    # Check if user exists
    existing_user = get_user_by_email(email)
    
    if existing_user:
        # Update last login
        user_id = str(existing_user.get('_id', existing_user.get('user_id')))
        update_user(user_id, {
            'last_login': datetime.utcnow().isoformat(),
            'picture': picture,
            'name': name
        })
    else:
        # Create new user
        user_data = {
            'email': email,
            'name': name,
            'picture': picture,
            'auth_provider': 'google',
            'role': 'user',
            'created_at': datetime.utcnow().isoformat(),
            'last_login': datetime.utcnow().isoformat(),
            'password_hash': None  # OAuth users don't have password
        }
        user_id = str(create_user(user_data))
    
    # Create JWT access token
    access_token = create_access_token(
        data={
            "sub": user_id,
            "email": email,
            "role": "user"
        }
    )
    
    return access_token


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create JWT access token.
    """
    secret = os.getenv("SECRET_KEY", settings.SECRET_KEY)
    algorithm = settings.ALGORITHM
    
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    expire = datetime.utcnow() + expires_delta
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, secret, algorithm=algorithm)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode JWT token.
    """
    secret = os.getenv("SECRET_KEY", settings.SECRET_KEY)
    algorithm = settings.ALGORITHM
    
    try:
        payload = jwt.decode(token, secret, algorithms=[algorithm])
        return payload
    except Exception as e:
        raise ValueError(f"Invalid token: {str(e)}")
