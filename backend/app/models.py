from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Time, DateTime, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # super_admin, admin, hod, faculty
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)

    department = relationship("Department")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # e.g. "2026-2027"
    is_active = Column(Boolean, default=False)

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    semester_number = Column(Integer, nullable=False)  # 1 to 8
    regulation = Column(String, nullable=False)  # e.g., "R2021"

    academic_year = relationship("AcademicYear")

class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "A"
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)

    department = relationship("Department")
    semester = relationship("Semester")
    __table_args__ = (UniqueConstraint('name', 'department_id', 'semester_id', name='_section_name_dept_sem_uc'),)

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    weekly_hours = Column(Integer, nullable=False)
    is_lab = Column(Boolean, default=False)
    lab_duration = Column(Integer, default=3)  # contiguous periods
    preferred_afternoon = Column(Boolean, default=False)

    department = relationship("Department")
    semester = relationship("Semester")

class Faculty(Base):
    __tablename__ = "faculties"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    max_workload = Column(Integer, default=18)
    availability = Column(JSON, nullable=True) # e.g. {"Monday": [1, 2, 3, 4, 5, 6, 7]} (list of available period numbers per day)

    department = relationship("Department")
    user = relationship("User")

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    room_no = Column(String, unique=True, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    is_available = Column(Boolean, default=True)

    department = relationship("Department")

class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(Integer, primary_key=True, index=True)
    lab_name = Column(String, unique=True, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    is_available = Column(Boolean, default=True)

    department = relationship("Department")

class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String, nullable=False)  # Monday, Tuesday, etc.
    period_no = Column(Integer, nullable=False)  # 1 to 7
    start_time = Column(String, nullable=False)  # string for simplicity e.g. "08:45"
    end_time = Column(String, nullable=False)  # string e.g. "09:40"
    is_break = Column(Boolean, default=False)
    break_name = Column(String, nullable=True)  # "Break", "Lunch"

    __table_args__ = (UniqueConstraint('day', 'period_no', 'is_break', 'break_name', name='_day_period_break_uc'),)

class FacultySubjectMapping(Base):
    __tablename__ = "faculty_subject_mappings"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    hours_allocated = Column(Integer, nullable=False)

    subject = relationship("Subject")
    faculty = relationship("Faculty")
    section = relationship("Section")

class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    academic_year = relationship("AcademicYear")
    semester = relationship("Semester")
    section = relationship("Section")
    created_by = relationship("User")

class TimetableCell(Base):
    __tablename__ = "timetable_cells"

    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    faculty_id = Column(Integer, ForeignKey("faculties.id", ondelete="SET NULL"), nullable=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="SET NULL"), nullable=True)
    laboratory_id = Column(Integer, ForeignKey("laboratories.id", ondelete="SET NULL"), nullable=True)
    is_locked = Column(Boolean, default=False)

    timetable = relationship("Timetable", backref="cells")
    time_slot = relationship("TimeSlot")
    subject = relationship("Subject")
    faculty = relationship("Faculty")
    classroom = relationship("Classroom")
    laboratory = relationship("Laboratory")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False) # e.g. "GENERATE_TIMETABLE", "MANUAL_OVERRIDE", "LOCK_PERIOD"
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
