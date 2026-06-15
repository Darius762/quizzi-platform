"""
app/core/config.py
Configuratie centralizata din .env cu pydantic-settings
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # App
    APP_NAME: str = "QuizPlatform API"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str

    # ─JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24     # 24 ore

    # Groq / RAG
    GROQ_API_KEY: str

    # Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()