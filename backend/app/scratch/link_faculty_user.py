import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database import SessionLocal
from app.models import User, Faculty, Department
from app.auth import get_password_hash

db = SessionLocal()
try:
    # 1. Find CSE Department
    cse = db.query(Department).filter(Department.code == "CSE").first()
    if not cse:
        print("CSE Department not found")
        sys.exit(1)

    # 2. Check if user already exists
    username = "jayasudha"
    email = "jayasudha@college.edu"
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        print("Creating User...")
        hashed_pw = get_password_hash("password123")
        user = User(
            username=username,
            email=email,
            password_hash=hashed_pw,
            role="faculty",
            department_id=cse.id
        )
        db.add(user)
        db.flush()
    else:
        print("User already exists")

    # 3. Find Faculty Profile and Link
    fac = db.query(Faculty).filter(Faculty.code == "TCS05").first()
    if fac:
        fac.user_id = user.id
        db.commit()
        print(f"Successfully linked Faculty '{fac.name}' ({fac.code}) to User '{user.username}' (ID: {user.id})")
    else:
        print("Faculty profile TCS05 not found")

finally:
    db.close()
