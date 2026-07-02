from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from ..database import get_db
from ..models import (
    TimetableCell, TimeSlot, Classroom, Laboratory, Faculty,
    Department, Section, Subject, Timetable, FacultySubjectMapping, User
)
from ..auth import RoleChecker, get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

allow_read = Depends(RoleChecker(["super_admin", "admin", "hod", "faculty"]))

@router.get("/utilization")
def get_resource_utilization(db: Session = Depends(get_db), current_user = allow_read):
    """
    Returns utilization rates for Classrooms and Labs.
    Rate = (Periods Scheduled / Total Weekly Teaching Slots) * 100
    """
    # Total teaching slots in the week
    teaching_slots_count = db.query(func.count(TimeSlot.id)).filter(TimeSlot.is_break == False).scalar() or 1
    
    # Classrooms utilization
    classrooms = db.query(Classroom).all()
    room_utilization = []
    for r in classrooms:
        scheduled_count = db.query(func.count(TimetableCell.id)).join(Timetable).filter(
            Timetable.is_active == True,
            TimetableCell.classroom_id == r.id
        ).scalar() or 0
        
        rate = round((scheduled_count / teaching_slots_count) * 100, 2) if teaching_slots_count > 0 else 0
        room_utilization.append({
            "id": r.id,
            "name": r.room_no,
            "capacity": r.capacity,
            "scheduled_periods": scheduled_count,
            "total_slots": teaching_slots_count,
            "utilization_rate": rate
        })

    # Labs utilization
    labs = db.query(Laboratory).all()
    lab_utilization = []
    for l in labs:
        scheduled_count = db.query(func.count(TimetableCell.id)).join(Timetable).filter(
            Timetable.is_active == True,
            TimetableCell.laboratory_id == l.id
        ).scalar() or 0
        
        rate = round((scheduled_count / teaching_slots_count) * 100, 2) if teaching_slots_count > 0 else 0
        lab_utilization.append({
            "id": l.id,
            "name": l.lab_name,
            "capacity": l.capacity,
            "scheduled_periods": scheduled_count,
            "total_slots": teaching_slots_count,
            "utilization_rate": rate
        })

    return {
        "classrooms": room_utilization,
        "laboratories": lab_utilization
    }

@router.get("/stats")
def get_department_stats(db: Session = Depends(get_db), current_user = allow_read):
    """
    Returns general stats for the admin dashboard.
    """
    total_depts = db.query(func.count(Department.id)).scalar()
    total_sections = db.query(func.count(Section.id)).scalar()
    total_subjects = db.query(func.count(Subject.id)).scalar()
    total_faculty = db.query(func.count(Faculty.id)).scalar()
    total_rooms = db.query(func.count(Classroom.id)).scalar()
    total_labs = db.query(func.count(Laboratory.id)).scalar()

    # Active schedules count
    active_timetables = db.query(func.count(Timetable.id)).filter(Timetable.is_active == True).scalar()

    # Conflict checking counts across all active schedules
    # 1. Faculty clashes
    clashes_count = 0
    # Retrieve all active teaching cells
    active_cells = db.query(TimetableCell).join(Timetable).filter(
        Timetable.is_active == True,
        TimetableCell.faculty_id.isnot(None)
    ).all()

    # Group cells by (time_slot_id, faculty_id) to count clashes
    fac_slots = {}
    for c in active_cells:
        key = (c.time_slot_id, c.faculty_id)
        fac_slots[key] = fac_slots.get(key, 0) + 1
    
    fac_clashes = sum(1 for k, count in fac_slots.items() if count > 1)

    # 2. Room clashes
    room_cells = db.query(TimetableCell).join(Timetable).filter(
        Timetable.is_active == True,
        TimetableCell.classroom_id.isnot(None)
    ).all()
    room_slots = {}
    for c in room_cells:
        key = (c.time_slot_id, c.classroom_id)
        room_slots[key] = room_slots.get(key, 0) + 1
    room_clashes = sum(1 for k, count in room_slots.items() if count > 1)

    # 3. Lab clashes
    lab_cells = db.query(TimetableCell).join(Timetable).filter(
        Timetable.is_active == True,
        TimetableCell.laboratory_id.isnot(None)
    ).all()
    lab_slots = {}
    for c in lab_cells:
        key = (c.time_slot_id, c.laboratory_id)
        lab_slots[key] = lab_slots.get(key, 0) + 1
    lab_clashes = sum(1 for k, count in lab_slots.items() if count > 1)

    total_clashes = fac_clashes + room_clashes + lab_clashes

    # Workload statistics
    faculty_list = db.query(Faculty).all()
    overloaded_count = 0
    underloaded_count = 0
    for f in faculty_list:
        allocated = db.query(func.sum(FacultySubjectMapping.hours_allocated)).filter(
            FacultySubjectMapping.faculty_id == f.id
        ).scalar() or 0
        if allocated > f.max_workload:
            overloaded_count += 1
        elif allocated < 6: # E.g., underloaded if teaching less than 6 hours
            underloaded_count += 1

    return {
        "counters": {
            "departments": total_depts,
            "sections": total_sections,
            "subjects": total_subjects,
            "faculty": total_faculty,
            "classrooms": total_rooms,
            "laboratories": total_labs,
            "active_schedules": active_timetables
        },
        "conflicts": {
            "faculty_clashes": fac_clashes,
            "room_clashes": room_clashes,
            "lab_clashes": lab_clashes,
            "total_conflicts": total_clashes
        },
        "faculty_workload_stats": {
            "total": total_faculty,
            "overloaded": overloaded_count,
            "underloaded": underloaded_count,
            "optimal": total_faculty - overloaded_count - underloaded_count
        }
    }

@router.get("/faculty/me")
def get_faculty_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns personalized stats, timetable, and department colleagues for the logged-in faculty member.
    """
    # 1. Find corresponding Faculty profile
    faculty = db.query(Faculty).filter(
        (Faculty.user_id == current_user.id) | (Faculty.email == current_user.email)
    ).first()
    
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Faculty profile is linked to your user account. Please contact an administrator."
        )

    # 2. Get workload mappings (subjects & sections allocated to this faculty)
    mappings = db.query(FacultySubjectMapping).filter(
        FacultySubjectMapping.faculty_id == faculty.id
    ).all()
    
    # 3. Calculate weekly scheduled hours
    allocated_hours = sum(m.hours_allocated for m in mappings)
    
    # 4. Fetch personal timetable cells (active)
    cells = db.query(TimetableCell).join(Timetable).filter(
        Timetable.is_active == True,
        TimetableCell.faculty_id == faculty.id
    ).all()
    
    # Format cells to return to the frontend
    timetable_cells = []
    for c in cells:
        timetable_cells.append({
            "id": c.id,
            "day": c.time_slot.day,
            "period_no": c.time_slot.period_no,
            "subject_code": c.subject.code if c.subject else None,
            "subject_name": c.subject.name if c.subject else None,
            "section_name": c.timetable.section.name if c.timetable.section else None,
            "room_no": c.classroom.room_no if c.classroom else (c.laboratory.lab_name if c.laboratory else None),
            "is_lab": c.subject.is_lab if c.subject else False
        })

    # 5. Fetch department details
    dept = db.query(Department).filter(Department.id == faculty.department_id).first()
    
    # 6. Fetch colleagues in the same department
    colleagues_list = db.query(Faculty).filter(
        Faculty.department_id == faculty.department_id,
        Faculty.id != faculty.id
    ).all()
    
    colleagues = []
    for col in colleagues_list:
        # Get their allocated hours
        col_mappings = db.query(FacultySubjectMapping).filter(FacultySubjectMapping.faculty_id == col.id).all()
        col_hours = sum(cm.hours_allocated for cm in col_mappings)
        colleagues.append({
            "name": col.name,
            "code": col.code,
            "email": col.email,
            "allocated_hours": col_hours,
            "max_workload": col.max_workload
        })

    # Return everything
    return {
        "faculty_profile": {
            "id": faculty.id,
            "name": faculty.name,
            "code": faculty.code,
            "email": faculty.email,
            "department_name": dept.name if dept else None,
            "department_code": dept.code if dept else None,
            "max_workload": faculty.max_workload,
            "availability": faculty.availability
        },
        "workload": {
            "allocated_hours": allocated_hours,
            "max_workload": faculty.max_workload,
            "status": "optimal" if 6 <= allocated_hours <= faculty.max_workload else ("overloaded" if allocated_hours > faculty.max_workload else "underloaded")
        },
        "subjects": [
            {
                "subject_code": m.subject.code,
                "subject_name": m.subject.name,
                "section_name": m.section.name,
                "semester_no": m.section.semester.semester_number,
                "hours_allocated": m.hours_allocated,
                "is_lab": m.subject.is_lab
            }
            for m in mappings
        ],
        "timetable": timetable_cells,
        "colleagues": colleagues
    }
