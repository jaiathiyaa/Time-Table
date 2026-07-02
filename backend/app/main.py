from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging

from .database import engine, Base, SessionLocal
from .routers import auth, master, mapping, timetable, analytics, export
from .models import User, Department, AcademicYear, Semester, Section, Subject, Faculty, Classroom, Laboratory, TimeSlot, FacultySubjectMapping
from .auth import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("timetable_app")

# Initialize database tables
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Timetable Management System",
    description="FastAPI Backend for Engineering College Timetables with OR-Tools constraint satisfaction solver.",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development. Change in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(master.router, prefix="/api")
app.include_router(mapping.router, prefix="/api")
app.include_router(timetable.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(export.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the AI-Powered Timetable Management API"
    }

# --- Database Seeding ---
def seed_database():
    db: Session = SessionLocal()
    try:
        # Check if database already has users
        if db.query(User).count() > 0:
            logger.info("Database already seeded. Skipping...")
            return

        logger.info("Seeding initial master data...")

        # 1. Create Super Admin User
        admin_user = User(
            username="admin",
            email="admin@college.edu",
            password_hash=get_password_hash("admin123"),
            role="super_admin"
        )
        db.add(admin_user)
        db.flush()

        # 2. Departments
        cse = Department(name="Computer Science & Engineering", code="CSE")
        ece = Department(name="Electronics & Communication Engineering", code="ECE")
        eee = Department(name="Electrical & Electronics Engineering", code="EEE")
        db.add_all([cse, ece, eee])
        db.flush()

        # 3. Classrooms & Labs
        lh101 = Classroom(room_no="LH-101", capacity=60, department_id=cse.id)
        lh102 = Classroom(room_no="LH-102", capacity=60, department_id=cse.id)
        lh103 = Classroom(room_no="LH-103", capacity=60, department_id=ece.id)
        
        cselab1 = Laboratory(lab_name="CSE-LAB-1", capacity=40, department_id=cse.id)
        cselab2 = Laboratory(lab_name="CSE-LAB-2", capacity=40, department_id=cse.id)
        ecelab1 = Laboratory(lab_name="ECE-LAB-1", capacity=40, department_id=ece.id)
        
        db.add_all([lh101, lh102, lh103, cselab1, cselab2, ecelab1])
        db.flush()

        # 4. Academic Year
        ay = AcademicYear(name="2026-2027", is_active=True)
        db.add(ay)
        db.flush()

        # 5. Semesters (1 to 8)
        semesters = []
        for i in range(1, 9):
            sem = Semester(academic_year_id=ay.id, semester_number=i, regulation="R2025")
            db.add(sem)
            semesters.append(sem)
        db.flush()

        # Find Semester 5 for CSE & ECE
        sem5 = semesters[4] # 5th semester index

        # 6. Sections
        cse_sec_a = Section(name="A", department_id=cse.id, semester_id=sem5.id)
        ece_sec_a = Section(name="A", department_id=ece.id, semester_id=sem5.id)
        db.add_all([cse_sec_a, ece_sec_a])
        db.flush()

        # 7. Subjects
        # CSE Subjects
        dbms = Subject(code="CS501", name="Database Management Systems", department_id=cse.id, semester_id=sem5.id, weekly_hours=6, is_lab=False)
        os = Subject(code="CS502", name="Operating Systems", department_id=cse.id, semester_id=sem5.id, weekly_hours=6, is_lab=False)
        cn = Subject(code="CS503", name="Computer Networks", department_id=cse.id, semester_id=sem5.id, weekly_hours=6, is_lab=False)
        mp = Subject(code="CS504", name="Microprocessors", department_id=cse.id, semester_id=sem5.id, weekly_hours=6, is_lab=False)
        
        dbms_lab = Subject(code="CS511", name="DBMS Laboratory", department_id=cse.id, semester_id=sem5.id, weekly_hours=6, is_lab=True, lab_duration=3, preferred_afternoon=True)
        os_lab = Subject(code="CS512", name="OS Laboratory", department_id=cse.id, semester_id=sem5.id, weekly_hours=6, is_lab=True, lab_duration=3, preferred_afternoon=True)

        # ECE Subjects
        ss = Subject(code="EC501", name="Signals & Systems", department_id=ece.id, semester_id=sem5.id, weekly_hours=6, is_lab=False)
        dsp = Subject(code="EC502", name="Digital Signal Processing", department_id=ece.id, semester_id=sem5.id, weekly_hours=6, is_lab=False)
        ac = Subject(code="EC503", name="Analog Communication", department_id=ece.id, semester_id=sem5.id, weekly_hours=6, is_lab=False)
        uc = Subject(code="EC504", name="Microcontrollers", department_id=ece.id, semester_id=sem5.id, weekly_hours=6, is_lab=False)
        
        dsp_lab = Subject(code="EC511", name="DSP Laboratory", department_id=ece.id, semester_id=sem5.id, weekly_hours=6, is_lab=True, lab_duration=3, preferred_afternoon=True)
        ac_lab = Subject(code="EC512", name="AC Laboratory", department_id=ece.id, semester_id=sem5.id, weekly_hours=6, is_lab=True, lab_duration=3, preferred_afternoon=True)

        db.add_all([dbms, os, cn, mp, dbms_lab, os_lab, ss, dsp, ac, uc, dsp_lab, ac_lab])
        db.flush()

        # 8. Faculty
        # CSE Faculty
        f1 = Faculty(name="Dr. Rajesh Raman", code="TCS01", email="rajesh@college.edu", department_id=cse.id, max_workload=16)
        f2 = Faculty(name="Dr. Priya Srinivasan", code="TCS02", email="priya@college.edu", department_id=cse.id, max_workload=16)
        f3 = Faculty(name="Prof. Kumar Swamy", code="TCS03", email="kumar@college.edu", department_id=cse.id, max_workload=16)
        f4 = Faculty(name="Mrs. Shalini Roy", code="TCS04", email="shalini@college.edu", department_id=cse.id, max_workload=16)

        # ECE Faculty
        fe1 = Faculty(name="Dr. Ananya Sen", code="TEC01", email="ananya@college.edu", department_id=ece.id, max_workload=16)
        fe2 = Faculty(name="Dr. Vikram Nair", code="TEC02", email="vikram@college.edu", department_id=ece.id, max_workload=16)
        fe3 = Faculty(name="Prof. Ritu Sharma", code="TEC03", email="ritu@college.edu", department_id=ece.id, max_workload=16)
        fe4 = Faculty(name="Mr. Amit Verma", code="TEC04", email="amit@college.edu", department_id=ece.id, max_workload=16)

        # Faculty availability setting: Monday to Saturday, periods 1 to 7
        default_avail = {
            "Monday": [1,2,3,4,5,6,7],
            "Tuesday": [1,2,3,4,5,6,7],
            "Wednesday": [1,2,3,4,5,6,7],
            "Thursday": [1,2,3,4,5,6,7],
            "Friday": [1,2,3,4,5,6,7],
            "Saturday": [1,2,3,4,5,6,7]
        }
        for f in [f1, f2, f3, f4, fe1, fe2, fe3, fe4]:
            f.availability = default_avail
            db.add(f)
        db.flush()

        # 9. Faculty-Subject Mappings
        # CSE Mappings
        m1 = FacultySubjectMapping(subject_id=dbms.id, faculty_id=f1.id, section_id=cse_sec_a.id, hours_allocated=6)
        m2 = FacultySubjectMapping(subject_id=os.id, faculty_id=f2.id, section_id=cse_sec_a.id, hours_allocated=6)
        m3 = FacultySubjectMapping(subject_id=cn.id, faculty_id=f3.id, section_id=cse_sec_a.id, hours_allocated=6)
        m4 = FacultySubjectMapping(subject_id=mp.id, faculty_id=f4.id, section_id=cse_sec_a.id, hours_allocated=6)
        m5 = FacultySubjectMapping(subject_id=dbms_lab.id, faculty_id=f1.id, section_id=cse_sec_a.id, hours_allocated=6)
        m6 = FacultySubjectMapping(subject_id=os_lab.id, faculty_id=f2.id, section_id=cse_sec_a.id, hours_allocated=6)

        # ECE Mappings
        me1 = FacultySubjectMapping(subject_id=ss.id, faculty_id=fe1.id, section_id=ece_sec_a.id, hours_allocated=6)
        me2 = FacultySubjectMapping(subject_id=dsp.id, faculty_id=fe2.id, section_id=ece_sec_a.id, hours_allocated=6)
        me3 = FacultySubjectMapping(subject_id=ac.id, faculty_id=fe3.id, section_id=ece_sec_a.id, hours_allocated=6)
        me4 = FacultySubjectMapping(subject_id=uc.id, faculty_id=fe4.id, section_id=ece_sec_a.id, hours_allocated=6)
        me5 = FacultySubjectMapping(subject_id=dsp_lab.id, faculty_id=fe1.id, section_id=ece_sec_a.id, hours_allocated=6)
        me6 = FacultySubjectMapping(subject_id=ac_lab.id, faculty_id=fe2.id, section_id=ece_sec_a.id, hours_allocated=6)

        db.add_all([m1, m2, m3, m4, m5, m6, me1, me2, me3, me4, me5, me6])
        db.flush()

        # 10. Time Slots (Monday - Saturday)
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        slots_to_add = []
        for day in days:
            # Period 1
            slots_to_add.append(TimeSlot(day=day, period_no=1, start_time="08:45", end_time="09:40"))
            # Period 2
            slots_to_add.append(TimeSlot(day=day, period_no=2, start_time="09:40", end_time="10:35"))
            # Break
            slots_to_add.append(TimeSlot(day=day, period_no=0, start_time="10:35", end_time="10:50", is_break=True, break_name="Morning Break"))
            # Period 3
            slots_to_add.append(TimeSlot(day=day, period_no=3, start_time="10:50", end_time="11:45"))
            # Period 4
            slots_to_add.append(TimeSlot(day=day, period_no=4, start_time="11:45", end_time="12:40"))
            # Lunch
            slots_to_add.append(TimeSlot(day=day, period_no=0, start_time="12:40", end_time="01:30", is_break=True, break_name="Lunch"))
            # Period 5
            slots_to_add.append(TimeSlot(day=day, period_no=5, start_time="01:30", end_time="02:25"))
            # Period 6
            slots_to_add.append(TimeSlot(day=day, period_no=6, start_time="02:25", end_time="03:20"))
            # Break
            slots_to_add.append(TimeSlot(day=day, period_no=0, start_time="03:20", end_time="03:35", is_break=True, break_name="Afternoon Break"))
            # Period 7
            slots_to_add.append(TimeSlot(day=day, period_no=7, start_time="03:35", end_time="04:30"))
        
        db.bulk_save_objects(slots_to_add)
        db.commit()
        logger.info("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

# Run seed
seed_database()
