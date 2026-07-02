import os
import sys

# Add parent directory of backend/app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database import SessionLocal
from app.scheduler.engine import generate_schedule
from app.scratch.check_empty_periods import check_timetables

def main():
    db = SessionLocal()
    try:
        print("Running timetable generation...")
        res = generate_schedule(
            db=db,
            academic_year_id=1,
            semester_id=5,
            section_ids=[1, 2],
            prioritize_afternoon_labs=True,
            minimize_faculty_gaps=True,
            user_id=1
        )
        print("Generation result:", res)
        if res.get("status") == "success":
            print("\nChecking generated timetables:")
            check_timetables()
    finally:
        db.close()

if __name__ == "__main__":
    main()
