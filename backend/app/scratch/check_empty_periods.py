import os
import sys

# Add parent directory of backend/app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database import SessionLocal
from app.models import Timetable, TimetableCell, Section, TimeSlot, Subject, Faculty

def check_timetables():
    db = SessionLocal()
    try:
        timetables = db.query(Timetable).filter(Timetable.is_active == True).all()
        for tt in timetables:
            section = db.query(Section).filter(Section.id == tt.section_id).first()
            print(f"\nTimetable for Section: {section.name} (ID: {section.id})")
            
            # Fetch cells
            cells = db.query(TimetableCell).filter(TimetableCell.timetable_id == tt.id).all()
            
            # Group by day and period
            slots_by_day = {}
            for cell in cells:
                slot = cell.time_slot
                if slot.day not in slots_by_day:
                    slots_by_day[slot.day] = []
                slots_by_day[slot.day].append((slot.period_no, slot.is_break, cell))
                
            for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]:
                if day not in slots_by_day:
                    continue
                # Sort slots by period number (or time)
                day_slots = sorted(slots_by_day[day], key=lambda x: x[0])
                line = f"{day[:3]}: "
                for p_no, is_break, cell in day_slots:
                    if is_break:
                        continue
                    if cell.subject_id:
                        subject = db.query(Subject).filter(Subject.id == cell.subject_id).first()
                        line += f"[{p_no}: {subject.code}] "
                    else:
                        line += f"[{p_no}: EMPTY] "
                print(line)
    finally:
        db.close()

if __name__ == "__main__":
    check_timetables()
