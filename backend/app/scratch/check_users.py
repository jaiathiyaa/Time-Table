import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database import SessionLocal
from app.models import User, Faculty

db = SessionLocal()
try:
    print("--- USERS ---")
    users = db.query(User).all()
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}, Email: {u.email}")
    
    print("\n--- FACULTY LINKED USERS ---")
    faculties = db.query(Faculty).all()
    for f in faculties:
        print(f"Faculty: {f.name} ({f.code}), Linked User ID: {f.user_id}")
finally:
    db.close()
