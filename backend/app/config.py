import os

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql:///timetable_db")
    # Normalize database URLs from platforms like Heroku/Render/Railway
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_ai_timetable_key_2026_change_me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

settings = Settings()
