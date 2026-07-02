import os
import sys

# Add the parent directory of backend/app to PYTHONPATH so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database import SessionLocal, engine
from app.models import (
    Department, AcademicYear, Semester, Section, Subject, Faculty,
    Classroom, Laboratory, TimeSlot, FacultySubjectMapping, User
)
from app.scheduler.engine import generate_schedule

def seed_ngpit_timetable():
    db = SessionLocal()
    try:
        print("Checking/Creating Academic Year...")
        # 1. Academic Year "2025-2026"
        # Deactivate others first to make it the default active year
        db.query(AcademicYear).update({AcademicYear.is_active: False})
        
        ay = db.query(AcademicYear).filter(AcademicYear.name == "2025-2026").first()
        if not ay:
            ay = AcademicYear(name="2025-2026", is_active=True)
            db.add(ay)
            db.flush()
        else:
            ay.is_active = True
            db.flush()
        
        print(f"Academic Year 2025-2026 is active (ID: {ay.id})")

        # 2. Semesters 1 to 8 for Academic Year 2025-2026
        sem3 = None
        for i in range(1, 9):
            sem = db.query(Semester).filter(
                Semester.academic_year_id == ay.id,
                Semester.semester_number == i
            ).first()
            if not sem:
                sem = Semester(
                    academic_year_id=ay.id,
                    semester_number=i,
                    regulation="R2022"
                )
                db.add(sem)
                db.flush()
            if i == 3:
                sem3 = sem
        
        print(f"Semester 3 configured (ID: {sem3.id})")

        # 3. Departments: CSE, EEE, IT (Information Technology)
        print("Checking/Creating Departments...")
        cse = db.query(Department).filter(Department.code == "CSE").first()
        if not cse:
            cse = Department(name="Computer Science & Engineering", code="CSE")
            db.add(cse)
            db.flush()

        eee = db.query(Department).filter(Department.code == "EEE").first()
        if not eee:
            eee = Department(name="Electrical & Electronics Engineering", code="EEE")
            db.add(eee)
            db.flush()

        it = db.query(Department).filter(Department.code == "IT").first()
        if not it:
            it = Department(name="Information Technology", code="IT")
            db.add(it)
            db.flush()

        # 4. Classrooms & Laboratories
        print("Checking/Creating Classrooms & Laboratories...")
        lh201 = db.query(Classroom).filter(Classroom.room_no == "LH-201").first()
        if not lh201:
            lh201 = Classroom(room_no="LH-201", capacity=60, department_id=cse.id, is_available=True)
            db.add(lh201)
            db.flush()

        lab4 = db.query(Laboratory).filter(Laboratory.lab_name == "A-BLOCK PGM LAB 4").first()
        if not lab4:
            lab4 = Laboratory(lab_name="A-BLOCK PGM LAB 4", capacity=40, department_id=cse.id, is_available=True)
            db.add(lab4)
            db.flush()

        lab10 = db.query(Laboratory).filter(Laboratory.lab_name == "D-BLOCK PGM LAB 10").first()
        if not lab10:
            lab10 = Laboratory(lab_name="D-BLOCK PGM LAB 10", capacity=40, department_id=cse.id, is_available=True)
            db.add(lab10)
            db.flush()

        # 5. Section A for CSE Semester 3
        print("Checking/Creating Section A...")
        section_a = db.query(Section).filter(
            Section.name == "A",
            Section.department_id == cse.id,
            Section.semester_id == sem3.id
        ).first()
        if not section_a:
            section_a = Section(name="A", department_id=cse.id, semester_id=sem3.id)
            db.add(section_a)
            db.flush()

        # 6. Faculty Members
        print("Checking/Creating Faculty...")
        default_avail = {
            "Monday": [1,2,3,4,5,6,7],
            "Tuesday": [1,2,3,4,5,6,7],
            "Wednesday": [1,2,3,4,5,6,7],
            "Thursday": [1,2,3,4,5,6,7],
            "Friday": [1,2,3,4,5,6,7],
            "Saturday": [1,2,3,4,5,6,7]
        }

        faculty_data = [
            ("Dr. R. Jayasudha", "TCS05", "jayasudha@college.edu", cse.id),
            ("Mr. V. Yathavaraj", "TCS06", "yathavaraj@college.edu", cse.id),
            ("Ms. S. R. Ramya", "TCS07", "ramya@college.edu", cse.id),
            ("Dr. S. Saranya", "TCS08", "saranya@college.edu", cse.id),
            ("Dr. D. Palanikkumar", "TCS09", "palanikkumar@college.edu", cse.id),
            ("Ms. S. Nandhini", "TEE01", "nandhini@college.edu", eee.id),
            ("Ms. C. S. Madhumathi", "TIT01", "madhumathi@college.edu", it.id),
            ("Ms. S. Rajeswari", "TCS10", "rajeswari@college.edu", cse.id),
            ("Dr. V. Brindhashree", "TCS11", "brindhashree@college.edu", cse.id),
            ("Dr. R. Praveen Raju", "TCS12", "praveenraju@college.edu", cse.id),
            ("Ms. P. Nisha", "TCS13", "nisha@college.edu", cse.id),
            ("Open Elective Staff", "FOE01", "oe@college.edu", cse.id)
        ]

        faculty_map = {}
        for name, code, email, dept_id in faculty_data:
            fac = db.query(Faculty).filter(Faculty.code == code).first()
            if not fac:
                fac = Faculty(
                    name=name,
                    code=code,
                    email=email,
                    department_id=dept_id,
                    max_workload=18,
                    availability=default_avail
                )
                db.add(fac)
                db.flush()
            faculty_map[code] = fac

        # 7. Subjects
        print("Checking/Creating Subjects...")
        subjects_data = [
            ("22UMA302", "Discrete Structures", cse.id, 5, False, 0),
            ("22UCS301", "Data Structures Concepts", cse.id, 4, False, 0),
            ("22UCS302", "Formal Languages and Automata Theory", cse.id, 5, False, 0),
            ("22UCS303", "Data Science Essentials", cse.id, 3, False, 0),
            ("22UEE307", "Microprocessors and Microcontrollers", eee.id, 2, False, 0),
            ("22UIT304", "Java Programming", it.id, 4, False, 0),
            ("OE I", "Open Elective I", cse.id, 3, False, 0),
            ("22UOC301", "Design Thinking", cse.id, 1, False, 0), # Seeded with 1 weekly hour
            ("22UEN301", "Interpersonal Skills & Personality Development", cse.id, 2, False, 0),
            ("22UCS304", "Data Structures Concepts Laboratory", cse.id, 4, True, 2),
            ("22UCS407", "Idea & Design Sprint", cse.id, 2, True, 2)
        ]

        subject_map = {}
        for code, name, dept_id, hours, is_lab, lab_dur in subjects_data:
            sub = db.query(Subject).filter(Subject.code == code).first()
            if not sub:
                sub = Subject(
                    code=code,
                    name=name,
                    department_id=dept_id,
                    semester_id=sem3.id,
                    weekly_hours=hours,
                    is_lab=is_lab,
                    lab_duration=lab_dur if is_lab else 3
                )
                db.add(sub)
                db.flush()
            else:
                # Update weekly hours/duration if they changed
                sub.weekly_hours = hours
                sub.is_lab = is_lab
                sub.lab_duration = lab_dur if is_lab else 3
                db.flush()
            subject_map[code] = sub

        # 8. Clean old Faculty-Subject Mappings for this section to prevent duplicates
        print("Cleaning old Faculty-Subject Mappings for Section A...")
        db.query(FacultySubjectMapping).filter(FacultySubjectMapping.section_id == section_a.id).delete()
        db.flush()

        # Create new Faculty-Subject Mappings
        print("Creating Faculty-Subject Mappings...")
        mappings_data = [
            ("22UMA302", "TCS05", 5),
            ("22UCS301", "TCS06", 4),
            ("22UCS302", "TCS07", 5),
            ("22UCS303", "TCS09", 3),
            ("22UEE307", "TEE01", 2),
            ("22UIT304", "TIT01", 4),
            ("OE I", "FOE01", 3),
            ("22UOC301", "TCS10", 1),
            ("22UEN301", "TCS11", 2),
            ("22UCS304", "TCS06", 4),
            ("22UCS407", "TCS13", 2)
        ]

        for sub_code, fac_code, hours in mappings_data:
            mapping = FacultySubjectMapping(
                subject_id=subject_map[sub_code].id,
                faculty_id=faculty_map[fac_code].id,
                section_id=section_a.id,
                hours_allocated=hours
            )
            db.add(mapping)
        
        db.commit()
        print("Database seeding completed successfully!")

        # 9. Trigger Timetable Generation
        print("\nTriggering Timetable Generation for Section A...")
        res = generate_schedule(
            db=db,
            academic_year_id=ay.id,
            semester_id=sem3.id,
            section_ids=[section_a.id],
            prioritize_afternoon_labs=True,
            minimize_faculty_gaps=True,
            user_id=1
        )
        print("Solver Generation Result:", res)

    except Exception as e:
        db.rollback()
        print(f"Error during seeding/generation: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_ngpit_timetable()
