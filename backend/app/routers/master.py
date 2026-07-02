from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Department, AcademicYear, Semester, Section, Subject, Faculty, Classroom, Laboratory, TimeSlot, User
from ..schemas import (
    DepartmentCreate, DepartmentResponse,
    AcademicYearCreate, AcademicYearResponse,
    SemesterCreate, SemesterResponse,
    SectionCreate, SectionResponse,
    SubjectCreate, SubjectResponse,
    FacultyCreate, FacultyResponse,
    ClassroomCreate, ClassroomResponse,
    LaboratoryCreate, LaboratoryResponse,
    TimeSlotCreate, TimeSlotResponse
)
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/master", tags=["Master Data"])

# Dependencies
allow_write = Depends(RoleChecker(["super_admin", "admin", "hod"]))
allow_read = Depends(RoleChecker(["super_admin", "admin", "hod", "faculty"]))

# --- Departments ---
@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db), current_user = allow_write):
    db_dept = Department(name=dept.name, code=dept.code.upper())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db), current_user = allow_read):
    return db.query(Department).all()

@router.delete("/departments/{dept_id}", status_code=status.HTTP_200_OK)
def delete_department(dept_id: int, db: Session = Depends(get_db), current_user = allow_write):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted successfully"}

# --- Academic Years ---
@router.post("/academic_years", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
def create_academic_year(ay: AcademicYearCreate, db: Session = Depends(get_db), current_user = allow_write):
    if ay.is_active:
        # Deactivate others
        db.query(AcademicYear).update({AcademicYear.is_active: False})
    db_ay = AcademicYear(name=ay.name, is_active=ay.is_active)
    db.add(db_ay)
    db.commit()
    db.refresh(db_ay)
    return db_ay

@router.get("/academic_years", response_model=List[AcademicYearResponse])
def get_academic_years(db: Session = Depends(get_db), current_user = allow_read):
    return db.query(AcademicYear).all()

@router.put("/academic_years/{ay_id}/activate", response_model=AcademicYearResponse)
def activate_academic_year(ay_id: int, db: Session = Depends(get_db), current_user = allow_write):
    ay = db.query(AcademicYear).filter(AcademicYear.id == ay_id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic Year not found")
    db.query(AcademicYear).update({AcademicYear.is_active: False})
    ay.is_active = True
    db.commit()
    db.refresh(ay)
    return ay

@router.delete("/academic_years/{ay_id}", status_code=status.HTTP_200_OK)
def delete_academic_year(ay_id: int, db: Session = Depends(get_db), current_user = allow_write):
    ay = db.query(AcademicYear).filter(AcademicYear.id == ay_id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic Year not found")
    db.delete(ay)
    db.commit()
    return {"message": "Academic Year deleted successfully"}

# --- Semesters ---
@router.post("/semesters", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
def create_semester(sem: SemesterCreate, db: Session = Depends(get_db), current_user = allow_write):
    db_sem = Semester(
        academic_year_id=sem.academic_year_id,
        semester_number=sem.semester_number,
        regulation=sem.regulation.upper()
    )
    db.add(db_sem)
    db.commit()
    db.refresh(db_sem)
    return db_sem

@router.get("/semesters", response_model=List[SemesterResponse])
def get_semesters(db: Session = Depends(get_db), current_user = allow_read):
    return db.query(Semester).all()

@router.delete("/semesters/{sem_id}", status_code=status.HTTP_200_OK)
def delete_semester(sem_id: int, db: Session = Depends(get_db), current_user = allow_write):
    sem = db.query(Semester).filter(Semester.id == sem_id).first()
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found")
    db.delete(sem)
    db.commit()
    return {"message": "Semester deleted successfully"}

# --- Sections ---
@router.post("/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
def create_section(sec: SectionCreate, db: Session = Depends(get_db), current_user = allow_write):
    existing = db.query(Section).filter(
        Section.name == sec.name,
        Section.department_id == sec.department_id,
        Section.semester_id == sec.semester_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Section already exists for this department and semester")
    
    db_sec = Section(
        name=sec.name,
        department_id=sec.department_id,
        semester_id=sec.semester_id
    )
    db.add(db_sec)
    db.commit()
    db.refresh(db_sec)
    return db_sec

@router.get("/sections", response_model=List[SectionResponse])
def get_sections(department_id: Optional[int] = None, semester_id: Optional[int] = None, db: Session = Depends(get_db), current_user = allow_read):
    query = db.query(Section)
    if department_id:
        query = query.filter(Section.department_id == department_id)
    if semester_id:
        query = query.filter(Section.semester_id == semester_id)
    return query.all()

@router.delete("/sections/{sec_id}", status_code=status.HTTP_200_OK)
def delete_section(sec_id: int, db: Session = Depends(get_db), current_user = allow_write):
    sec = db.query(Section).filter(Section.id == sec_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(sec)
    db.commit()
    return {"message": "Section deleted successfully"}

# --- Subjects ---
@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(sub: SubjectCreate, db: Session = Depends(get_db), current_user = allow_write):
    existing = db.query(Subject).filter(Subject.code == sub.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    db_sub = Subject(
        code=sub.code.upper(),
        name=sub.name,
        department_id=sub.department_id,
        semester_id=sub.semester_id,
        weekly_hours=sub.weekly_hours,
        is_lab=sub.is_lab,
        lab_duration=sub.lab_duration,
        preferred_afternoon=sub.preferred_afternoon
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects(department_id: Optional[int] = None, semester_id: Optional[int] = None, db: Session = Depends(get_db), current_user = allow_read):
    query = db.query(Subject)
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    if semester_id:
        query = query.filter(Subject.semester_id == semester_id)
    return query.all()

@router.delete("/subjects/{sub_id}", status_code=status.HTTP_200_OK)
def delete_subject(sub_id: int, db: Session = Depends(get_db), current_user = allow_write):
    sub = db.query(Subject).filter(Subject.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(sub)
    db.commit()
    return {"message": "Subject deleted successfully"}

# --- Faculty ---
@router.post("/faculties", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
def create_faculty(fac: FacultyCreate, db: Session = Depends(get_db), current_user = allow_write):
    existing = db.query(Faculty).filter(Faculty.code == fac.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Faculty code already exists")

    # Optional: link to a User if user_id is provided
    if fac.user_id:
        usr = db.query(User).filter(User.id == fac.user_id).first()
        if not usr:
            raise HTTPException(status_code=404, detail="Linked User account not found")

    db_fac = Faculty(
        name=fac.name,
        code=fac.code.upper(),
        email=fac.email,
        department_id=fac.department_id,
        max_workload=fac.max_workload,
        availability=fac.availability,
        user_id=fac.user_id
    )
    db.add(db_fac)
    db.commit()
    db.refresh(db_fac)
    return db_fac

@router.get("/faculties", response_model=List[FacultyResponse])
def get_faculties(department_id: Optional[int] = None, db: Session = Depends(get_db), current_user = allow_read):
    query = db.query(Faculty)
    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    return query.all()

@router.put("/faculties/{fac_id}", response_model=FacultyResponse)
def update_faculty(fac_id: int, fac: FacultyCreate, db: Session = Depends(get_db), current_user = allow_write):
    db_fac = db.query(Faculty).filter(Faculty.id == fac_id).first()
    if not db_fac:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    db_fac.name = fac.name
    db_fac.code = fac.code.upper()
    db_fac.email = fac.email
    db_fac.department_id = fac.department_id
    db_fac.max_workload = fac.max_workload
    db_fac.availability = fac.availability
    db_fac.user_id = fac.user_id
    
    db.commit()
    db.refresh(db_fac)
    return db_fac

@router.delete("/faculties/{fac_id}", status_code=status.HTTP_200_OK)
def delete_faculty(fac_id: int, db: Session = Depends(get_db), current_user = allow_write):
    fac = db.query(Faculty).filter(Faculty.id == fac_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(fac)
    db.commit()
    return {"message": "Faculty deleted successfully"}

# --- Classrooms ---
@router.post("/classrooms", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(cr: ClassroomCreate, db: Session = Depends(get_db), current_user = allow_write):
    existing = db.query(Classroom).filter(Classroom.room_no == cr.room_no.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Classroom room number already exists")

    db_cr = Classroom(
        room_no=cr.room_no.upper(),
        capacity=cr.capacity,
        department_id=cr.department_id,
        is_available=cr.is_available
    )
    db.add(db_cr)
    db.commit()
    db.refresh(db_cr)
    return db_cr

@router.get("/classrooms", response_model=List[ClassroomResponse])
def get_classrooms(db: Session = Depends(get_db), current_user = allow_read):
    return db.query(Classroom).all()

@router.delete("/classrooms/{cr_id}", status_code=status.HTTP_200_OK)
def delete_classroom(cr_id: int, db: Session = Depends(get_db), current_user = allow_write):
    cr = db.query(Classroom).filter(Classroom.id == cr_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Classroom not found")
    db.delete(cr)
    db.commit()
    return {"message": "Classroom deleted successfully"}

# --- Laboratories ---
@router.post("/laboratories", response_model=LaboratoryResponse, status_code=status.HTTP_201_CREATED)
def create_laboratory(lab: LaboratoryCreate, db: Session = Depends(get_db), current_user = allow_write):
    existing = db.query(Laboratory).filter(Laboratory.lab_name == lab.lab_name.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Laboratory name already exists")

    db_lab = Laboratory(
        lab_name=lab.lab_name.upper(),
        capacity=lab.capacity,
        department_id=lab.department_id,
        is_available=lab.is_available
    )
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return db_lab

@router.get("/laboratories", response_model=List[LaboratoryResponse])
def get_laboratories(db: Session = Depends(get_db), current_user = allow_read):
    return db.query(Laboratory).all()

@router.delete("/laboratories/{lab_id}", status_code=status.HTTP_200_OK)
def delete_laboratory(lab_id: int, db: Session = Depends(get_db), current_user = allow_write):
    lab = db.query(Laboratory).filter(Laboratory.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    db.delete(lab)
    db.commit()
    return {"message": "Laboratory deleted successfully"}

# --- Time Slots ---
@router.post("/time_slots", response_model=TimeSlotResponse, status_code=status.HTTP_201_CREATED)
def create_time_slot(ts: TimeSlotCreate, db: Session = Depends(get_db), current_user = allow_write):
    existing = db.query(TimeSlot).filter(
        TimeSlot.day == ts.day,
        TimeSlot.period_no == ts.period_no,
        TimeSlot.is_break == ts.is_break,
        TimeSlot.break_name == ts.break_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Time slot already exists")

    db_ts = TimeSlot(
        day=ts.day,
        period_no=ts.period_no,
        start_time=ts.start_time,
        end_time=ts.end_time,
        is_break=ts.is_break,
        break_name=ts.break_name
    )
    db.add(db_ts)
    db.commit()
    db.refresh(db_ts)
    return db_ts

@router.get("/time_slots", response_model=List[TimeSlotResponse])
def get_time_slots(db: Session = Depends(get_db), current_user = allow_read):
    return db.query(TimeSlot).order_by(TimeSlot.day, TimeSlot.is_break, TimeSlot.period_no).all()

@router.delete("/time_slots/{ts_id}", status_code=status.HTTP_200_OK)
def delete_time_slot(ts_id: int, db: Session = Depends(get_db), current_user = allow_write):
    ts = db.query(TimeSlot).filter(TimeSlot.id == ts_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Time slot not found")
    db.delete(ts)
    db.commit()
    return {"message": "Time slot deleted successfully"}
