from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import datetime

from ..database import get_db
from ..models import (
    Timetable, TimetableCell, TimeSlot, Subject, Faculty, Classroom, Laboratory,
    Section, FacultySubjectMapping, AuditLog, User
)
from ..schemas import (
    TimetableResponse, GenerateRequest, CellUpdateRequest,
    ConflictCheckResponse, ConflictDetail, AuditLogResponse, TimetableCellResponse
)
from ..scheduler.engine import generate_schedule
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/timetable", tags=["Timetable Management"])

allow_write = Depends(RoleChecker(["super_admin", "admin", "hod"]))
allow_read = Depends(RoleChecker(["super_admin", "admin", "hod", "faculty"]))

@router.post("/generate", status_code=status.HTTP_200_OK)
def trigger_generation(
    req: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers the OR-Tools solver to auto-generate a timetable for selected sections.
    """
    if current_user.role not in ["super_admin", "admin", "hod"]:
        raise HTTPException(status_code=403, detail="Not authorized to generate timetable")
    
    # Check HOD department constraints
    if current_user.role == "hod" and current_user.department_id:
        for s_id in req.section_ids:
            sec = db.query(Section).filter(Section.id == s_id).first()
            if sec and sec.department_id != current_user.department_id:
                raise HTTPException(status_code=403, detail="HOD can only generate timetables for their own department.")

    res = generate_schedule(
        db=db,
        academic_year_id=req.academic_year_id,
        semester_id=req.semester_id,
        section_ids=req.section_ids,
        prioritize_afternoon_labs=req.prioritize_afternoon_labs,
        minimize_faculty_gaps=req.minimize_faculty_gaps,
        user_id=current_user.id
    )

    if res["status"] == "error":
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@router.get("/section/{section_id}", response_model=TimetableResponse)
def get_section_timetable(
    section_id: int,
    db: Session = Depends(get_db),
    current_user = allow_read
):
    tt = db.query(Timetable).filter(
        Timetable.section_id == section_id,
        Timetable.is_active == True
    ).first()
    if not tt:
        raise HTTPException(status_code=404, detail="No active timetable found for this section")
    return tt

@router.get("/faculty/{faculty_id}", response_model=List[TimetableCellResponse])
def get_faculty_timetable(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user = allow_read
):
    # Find active cells where this faculty is teaching
    cells = db.query(TimetableCell).join(Timetable).filter(
        Timetable.is_active == True,
        TimetableCell.faculty_id == faculty_id
    ).all()
    return cells

@router.get("/room/{classroom_id}", response_model=List[TimetableCellResponse])
def get_room_timetable(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user = allow_read
):
    cells = db.query(TimetableCell).join(Timetable).filter(
        Timetable.is_active == True,
        TimetableCell.classroom_id == classroom_id
    ).all()
    return cells

@router.get("/lab/{laboratory_id}", response_model=List[TimetableCellResponse])
def get_lab_timetable(
    laboratory_id: int,
    db: Session = Depends(get_db),
    current_user = allow_read
):
    cells = db.query(TimetableCell).join(Timetable).filter(
        Timetable.is_active == True,
        TimetableCell.laboratory_id == laboratory_id
    ).all()
    return cells

@router.get("/master", response_model=List[TimetableResponse])
def get_master_timetable(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = allow_read
):
    query = db.query(Timetable).filter(Timetable.is_active == True)
    if department_id:
        query = query.join(Section).filter(Section.department_id == department_id)
    return query.all()

# --- Conflict Validation logic ---
def check_cell_conflicts(
    db: Session,
    cell_id: int,
    subject_id: Optional[int],
    faculty_id: Optional[int],
    classroom_id: Optional[int],
    laboratory_id: Optional[int]
) -> List[ConflictDetail]:
    conflicts = []
    
    # Fetch target cell and its slot
    cell = db.query(TimetableCell).filter(TimetableCell.id == cell_id).first()
    if not cell:
        return conflicts
    
    slot = cell.time_slot
    timetable = cell.timetable
    
    # Query all active timetable cells at the same timeslot
    active_cells = db.query(TimetableCell).join(Timetable).filter(
        Timetable.is_active == True,
        Timetable.academic_year_id == timetable.academic_year_id,
        Timetable.semester_id == timetable.semester_id,
        TimetableCell.time_slot_id == slot.id,
        TimetableCell.id != cell_id  # Exclude current cell
    ).all()

    # 1. Faculty Clash Check
    if faculty_id:
        faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
        clashing_cell = next((c for c in active_cells if c.faculty_id == faculty_id), None)
        if clashing_cell:
            clashing_sec = clashing_cell.timetable.section.name
            conflicts.append(ConflictDetail(
                type="faculty_clash",
                message=f"Faculty {faculty.name} ({faculty.code}) is already scheduled for Section {clashing_sec} during {slot.day} Period {slot.period_no}.",
                severity="hard",
                details={"faculty_id": faculty_id, "clashing_section": clashing_sec}
            ))

    # 2. Classroom Clash Check
    if classroom_id:
        classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
        clashing_cell = next((c for c in active_cells if c.classroom_id == classroom_id), None)
        if clashing_cell:
            clashing_sec = clashing_cell.timetable.section.name
            conflicts.append(ConflictDetail(
                type="room_clash",
                message=f"Classroom {classroom.room_no} is already occupied by Section {clashing_sec} during {slot.day} Period {slot.period_no}.",
                severity="hard",
                details={"classroom_id": classroom_id, "clashing_section": clashing_sec}
            ))

    # 3. Laboratory Clash Check
    if laboratory_id:
        lab = db.query(Laboratory).filter(Laboratory.id == laboratory_id).first()
        clashing_cell = next((c for c in active_cells if c.laboratory_id == laboratory_id), None)
        if clashing_cell:
            clashing_sec = clashing_cell.timetable.section.name
            conflicts.append(ConflictDetail(
                type="lab_clash",
                message=f"Laboratory {lab.lab_name} is already occupied by Section {clashing_sec} during {slot.day} Period {slot.period_no}.",
                severity="hard",
                details={"laboratory_id": laboratory_id, "clashing_section": clashing_sec}
            ))

    # 4. Faculty Workload Check
    if faculty_id:
        faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
        # Count current periods assigned to faculty in active timetables
        # Plus the 1 we are trying to add (minus 1 if they were already teaching this cell)
        current_periods = db.query(func.count(TimetableCell.id)).join(Timetable).filter(
            Timetable.is_active == True,
            Timetable.academic_year_id == timetable.academic_year_id,
            Timetable.semester_id == timetable.semester_id,
            TimetableCell.faculty_id == faculty_id,
            TimetableCell.id != cell_id
        ).scalar() or 0
        
        new_periods = current_periods + (1 if faculty_id else 0)
        if new_periods > faculty.max_workload:
            conflicts.append(ConflictDetail(
                type="workload_excess",
                message=f"Faculty {faculty.name} max workload is {faculty.max_workload} hours. This assignment raises scheduled workload to {new_periods} hours.",
                severity="soft",
                details={"faculty_id": faculty_id, "max_workload": faculty.max_workload, "new_workload": new_periods}
            ))

    # 5. Section/Subject Hours Check
    if subject_id:
        mapping = db.query(FacultySubjectMapping).filter(
            FacultySubjectMapping.section_id == timetable.section_id,
            FacultySubjectMapping.subject_id == subject_id
        ).first()
        
        if mapping:
            # Count scheduled hours
            scheduled_hours = db.query(func.count(TimetableCell.id)).filter(
                TimetableCell.timetable_id == timetable.id,
                TimetableCell.subject_id == subject_id,
                TimetableCell.id != cell_id
            ).scalar() or 0
            
            new_hours = scheduled_hours + 1
            if new_hours > mapping.hours_allocated:
                conflicts.append(ConflictDetail(
                    type="missing_hours",
                    message=f"Subject hours exceed mapping requirements. Mapped: {mapping.hours_allocated} hours, now scheduling: {new_hours} hours.",
                    severity="soft",
                    details={"subject_id": subject_id, "mapped": mapping.hours_allocated, "scheduled": new_hours}
                ))

    return conflicts

@router.post("/check-conflicts", response_model=ConflictCheckResponse)
def api_check_conflicts(
    cell_id: int,
    req: CellUpdateRequest,
    db: Session = Depends(get_db),
    current_user = allow_read
):
    conflicts = check_cell_conflicts(
        db=db,
        cell_id=cell_id,
        subject_id=req.subject_id,
        faculty_id=req.faculty_id,
        classroom_id=req.classroom_id,
        laboratory_id=req.laboratory_id
    )
    return {
        "has_conflicts": len([c for c in conflicts if c.severity == "hard"]) > 0,
        "conflicts": conflicts
    }

@router.put("/cell/{cell_id}", response_model=TimetableCellResponse)
def update_cell(
    cell_id: int,
    req: CellUpdateRequest,
    force: bool = Query(False, description="Force override even if hard conflicts exist"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually update/swap cell content. Validates constraints before saving.
    """
    if current_user.role not in ["super_admin", "admin", "hod"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit timetables")

    cell = db.query(TimetableCell).filter(TimetableCell.id == cell_id).first()
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")

    # Run conflict checking
    conflicts = check_cell_conflicts(
        db=db,
        cell_id=cell_id,
        subject_id=req.subject_id,
        faculty_id=req.faculty_id,
        classroom_id=req.classroom_id,
        laboratory_id=req.laboratory_id
    )

    hard_conflicts = [c for c in conflicts if c.severity == "hard"]
    if hard_conflicts and not force:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Hard conflicts detected. Use 'force=true' to override.",
                "conflicts": [c.dict() for c in hard_conflicts]
            }
        )

    # Perform updates
    if req.subject_id is not None or req.subject_id == None:
        cell.subject_id = req.subject_id
    if req.faculty_id is not None or req.faculty_id == None:
        cell.faculty_id = req.faculty_id
    if req.classroom_id is not None or req.classroom_id == None:
        cell.classroom_id = req.classroom_id
    if req.laboratory_id is not None or req.laboratory_id == None:
        cell.laboratory_id = req.laboratory_id
    if req.is_locked is not None:
        cell.is_locked = req.is_locked

    db.commit()
    db.refresh(cell)

    # Log action
    audit = AuditLog(
        user_id=current_user.id,
        action="MANUAL_OVERRIDE",
        details={
            "cell_id": cell_id,
            "section": cell.timetable.section.name,
            "day": cell.time_slot.day,
            "period": cell.time_slot.period_no,
            "subject_id": req.subject_id,
            "faculty_id": req.faculty_id,
            "forced": force,
            "had_conflicts": len(conflicts) > 0
        }
    )
    db.add(audit)
    db.commit()

    return cell

@router.put("/cell/{cell_id}/lock", response_model=TimetableCellResponse)
def toggle_cell_lock(
    cell_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["super_admin", "admin", "hod"]:
        raise HTTPException(status_code=403, detail="Not authorized to lock cells")

    cell = db.query(TimetableCell).filter(TimetableCell.id == cell_id).first()
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")

    cell.is_locked = not cell.is_locked
    db.commit()
    db.refresh(cell)

    # Log action
    audit = AuditLog(
        user_id=current_user.id,
        action="LOCK_PERIOD",
        details={
            "cell_id": cell_id,
            "locked": cell.is_locked,
            "day": cell.time_slot.day,
            "period": cell.time_slot.period_no
        }
    )
    db.add(audit)
    db.commit()

    return cell

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user = allow_write):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
