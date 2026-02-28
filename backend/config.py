from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SYSTEM_PROMPT: str = "You are a helpful assistant."

    class Config:
        env_file = ".env"


settings = Settings()
