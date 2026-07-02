from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..database import get_db
from ..models import FacultySubjectMapping, Faculty, Subject, Section
from ..schemas import FacultySubjectMappingCreate, FacultySubjectMappingResponse
from ..auth import RoleChecker

router = APIRouter(prefix="/mapping", tags=["Faculty-Subject Mapping"])

allow_write = Depends(RoleChecker(["super_admin", "admin", "hod"]))
allow_read = Depends(RoleChecker(["super_admin", "admin", "hod", "faculty"]))

@router.post("", response_model=FacultySubjectMappingResponse, status_code=status.HTTP_201_CREATED)
def map_faculty_subject(mapping: FacultySubjectMappingCreate, db: Session = Depends(get_db), current_user = allow_write):
    # Verify faculty, subject, and section exist
    faculty = db.query(Faculty).filter(Faculty.id == mapping.faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    subject = db.query(Subject).filter(Subject.id == mapping.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    section = db.query(Section).filter(Section.id == mapping.section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # Optional workload check: see if adding this exceeds max workload
    current_workload = db.query(func.sum(FacultySubjectMapping.hours_allocated))\
        .filter(FacultySubjectMapping.faculty_id == mapping.faculty_id).scalar() or 0
    
    if current_workload + mapping.hours_allocated > faculty.max_workload:
        # We will allow it but flag it in the dashboard (soft constraint).
        pass

    db_mapping = FacultySubjectMapping(
        subject_id=mapping.subject_id,
        faculty_id=mapping.faculty_id,
        section_id=mapping.section_id,
        hours_allocated=mapping.hours_allocated
    )
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    return db_mapping

@router.get("", response_model=List[FacultySubjectMappingResponse])
def get_mappings(department_id: Optional[int] = None, section_id: Optional[int] = None, db: Session = Depends(get_db), current_user = allow_read):
    query = db.query(FacultySubjectMapping).join(Subject).join(Faculty)
    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    if section_id:
        query = query.filter(FacultySubjectMapping.section_id == section_id)
    return query.all()

@router.delete("/{mapping_id}", status_code=status.HTTP_200_OK)
def delete_mapping(mapping_id: int, db: Session = Depends(get_db), current_user = allow_write):
    mapping = db.query(FacultySubjectMapping).filter(FacultySubjectMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    db.delete(mapping)
    db.commit()
    return {"message": "Mapping deleted successfully"}

@router.get("/workload")
def get_workload_dashboard(department_id: Optional[int] = None, db: Session = Depends(get_db), current_user = allow_read):
    """
    Returns faculty workloads, listing total hours allocated, subjects mapped, and whether they exceed their limit.
    """
    faculties = db.query(Faculty)
    if department_id:
        faculties = faculties.filter(Faculty.department_id == department_id)
    faculties = faculties.all()

    workload_data = []
    for f in faculties:
        # Get mappings for this faculty
        mappings = db.query(FacultySubjectMapping).filter(FacultySubjectMapping.faculty_id == f.id).all()
        allocated_hours = sum(m.hours_allocated for m in mappings)
        
        subjects_mapped = []
        for m in mappings:
            sec = db.query(Section).filter(Section.id == m.section_id).first()
            sec_name = f"{sec.department.code}-{sec.semester.semester_number}{sec.name}" if sec else "Unknown"
            subjects_mapped.append({
                "mapping_id": m.id,
                "subject_code": m.subject.code,
                "subject_name": m.subject.name,
                "section_name": sec_name,
                "hours": m.hours_allocated
            })

        workload_data.append({
            "faculty_id": f.id,
            "faculty_code": f.code,
            "faculty_name": f.name,
            "max_workload": f.max_workload,
            "allocated_workload": allocated_hours,
            "is_overloaded": allocated_hours > f.max_workload,
            "subjects": subjects_mapped
        })

    return workload_data
