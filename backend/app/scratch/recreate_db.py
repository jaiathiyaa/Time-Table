import sys
import os

# Add the parent directory of backend/app to PYTHONPATH so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database import engine, Base
from app.main import seed_database

def reset_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating all tables with latest schema and cascade constraints...")
    Base.metadata.create_all(bind=engine)
    print("Seeding database...")
    seed_database()
    print("Database reset completed successfully!")

if __name__ == "__main__":
    reset_db()
