import os

# Helper to load .env variables manually to avoid external package dependencies
def load_dotenv():
    # Check multiple locations to find .env file depending on start directory
    for path in [".env", "../.env", "app/.env", "../backend/.env", "backend/.env"]:
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    # Clean the value
                    val = val.strip().strip("'\"")
                    # Set in os.environ only if not already set (to allow system overrides)
                    os.environ.setdefault(key.strip(), val)
            break

# Load environment variables from .env
load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql:///timetable_db")
    # Normalize database URLs from platforms like Heroku/Render/Railway
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_ai_timetable_key_2026_change_me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

settings = Settings()
