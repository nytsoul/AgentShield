from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")
    
    GROQ_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SYSTEM_PROMPT: str = "You are a helpful assistant."
    
    # MongoDB settings
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_URL: str = ""
    MONGODB_DB: str = "agentshield"
    
    # Google OAuth settings
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    
    # JWT settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    def __init__(self, **data):
        super().__init__(**data)
        # Support both MONGODB_URI and MONGODB_URL for backwards compatibility
        if self.MONGODB_URL:
            self.MONGODB_URI = self.MONGODB_URL


settings = Settings()
