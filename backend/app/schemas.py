from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserBase(BaseModel):
    username: str
    email: str
    role: str  # super_admin, admin, hod, faculty
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    department_id: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# --- Master Data Schemas ---
class DepartmentBase(BaseModel):
    name: str
    code: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

class AcademicYearBase(BaseModel):
    name: str
    is_active: bool = False

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearResponse(AcademicYearBase):
    id: int
    class Config:
        from_attributes = True

class SemesterBase(BaseModel):
    academic_year_id: int
    semester_number: int
    regulation: str

class SemesterCreate(SemesterBase):
    pass

class SemesterResponse(SemesterBase):
    id: int
    academic_year: Optional[AcademicYearResponse] = None
    class Config:
        from_attributes = True

class SectionBase(BaseModel):
    name: str
    department_id: int
    semester_id: int

class SectionCreate(SectionBase):
    pass

class SectionResponse(SectionBase):
    id: int
    department: Optional[DepartmentResponse] = None
    semester: Optional[SemesterResponse] = None
    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    code: str
    name: str
    department_id: int
    semester_id: int
    weekly_hours: int
    is_lab: bool = False
    lab_duration: int = 3
    preferred_afternoon: bool = False

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    department: Optional[DepartmentResponse] = None
    semester: Optional[SemesterResponse] = None
    class Config:
        from_attributes = True

class FacultyBase(BaseModel):
    name: str
    code: str
    email: str
    department_id: int
    max_workload: int = 18
    availability: Optional[Dict[str, List[int]]] = None # e.g. {"Monday": [1,2,3,4,5,6,7]}

class FacultyCreate(FacultyBase):
    user_id: Optional[int] = None

class FacultyResponse(FacultyBase):
    id: int
    user_id: Optional[int] = None
    department: Optional[DepartmentResponse] = None
    class Config:
        from_attributes = True

class ClassroomBase(BaseModel):
    room_no: str
    capacity: int
    department_id: Optional[int] = None
    is_available: bool = True

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomResponse(ClassroomBase):
    id: int
    department: Optional[DepartmentResponse] = None
    class Config:
        from_attributes = True

class LaboratoryBase(BaseModel):
    lab_name: str
    capacity: int
    department_id: Optional[int] = None
    is_available: bool = True

class LaboratoryCreate(LaboratoryBase):
    pass

class LaboratoryResponse(LaboratoryBase):
    id: int
    department: Optional[DepartmentResponse] = None
    class Config:
        from_attributes = True

class TimeSlotBase(BaseModel):
    day: str
    period_no: int
    start_time: str
    end_time: str
    is_break: bool = False
    break_name: Optional[str] = None

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotResponse(TimeSlotBase):
    id: int
    class Config:
        from_attributes = True

# --- Faculty Subject Mapping Schemas ---
class FacultySubjectMappingBase(BaseModel):
    subject_id: int
    faculty_id: int
    section_id: int
    hours_allocated: int

class FacultySubjectMappingCreate(FacultySubjectMappingBase):
    pass

class FacultySubjectMappingResponse(FacultySubjectMappingBase):
    id: int
    subject: Optional[SubjectResponse] = None
    faculty: Optional[FacultyResponse] = None
    section: Optional[SectionResponse] = None
    class Config:
        from_attributes = True

# --- Timetable Schemas ---
class TimetableCellBase(BaseModel):
    timetable_id: int
    time_slot_id: int
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    classroom_id: Optional[int] = None
    laboratory_id: Optional[int] = None
    is_locked: bool = False

class TimetableCellCreate(TimetableCellBase):
    pass

class TimetableCellResponse(TimetableCellBase):
    id: int
    time_slot: Optional[TimeSlotResponse] = None
    subject: Optional[SubjectResponse] = None
    faculty: Optional[FacultyResponse] = None
    classroom: Optional[ClassroomResponse] = None
    laboratory: Optional[LaboratoryResponse] = None
    class Config:
        from_attributes = True

class TimetableResponse(BaseModel):
    id: int
    academic_year_id: int
    semester_id: int
    section_id: int
    version: int
    is_active: bool
    created_at: datetime
    created_by_id: Optional[int] = None
    cells: List[TimetableCellResponse] = []

    academic_year: Optional[AcademicYearResponse] = None
    semester: Optional[SemesterResponse] = None
    section: Optional[SectionResponse] = None

    class Config:
        from_attributes = True

class GenerateRequest(BaseModel):
    academic_year_id: int
    semester_id: int
    section_ids: List[int]
    prioritize_afternoon_labs: bool = True
    minimize_faculty_gaps: bool = True

class CellUpdateRequest(BaseModel):
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    classroom_id: Optional[int] = None
    laboratory_id: Optional[int] = None
    is_locked: Optional[bool] = None

# --- Conflict & Override Validation ---
class ConflictDetail(BaseModel):
    type: str  # "faculty_clash", "room_clash", "lab_clash", "workload_excess", "missing_hours"
    message: str
    severity: str  # "hard", "soft"
    details: Dict[str, Any]

class ConflictCheckResponse(BaseModel):
    has_conflicts: bool
    conflicts: List[ConflictDetail]

# --- Audit & Analytics Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    class Config:
        from_attributes = True
