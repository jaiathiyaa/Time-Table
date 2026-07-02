from sqlalchemy.orm import Session
from sqlalchemy import func
from ortools.sat.python import cp_model
from typing import List, Dict, Any, Tuple
import logging
from ..models import (
    Section, Subject, Faculty, Classroom, Laboratory, TimeSlot,
    FacultySubjectMapping, Timetable, TimetableCell, AuditLog, AcademicYear, Semester
)

logger = logging.getLogger("scheduler")

def generate_schedule(
    db: Session,
    academic_year_id: int,
    semester_id: int,
    section_ids: List[int],
    prioritize_afternoon_labs: bool = True,
    minimize_faculty_gaps: bool = True,
    user_id: int = None
) -> Dict[str, Any]:
    """
    Generates a conflict-free timetable for the selected sections using Google OR-Tools CP-SAT solver.
    """
    # 1. Fetch Master Data
    sections = db.query(Section).filter(Section.id.in_(section_ids)).all()
    if not sections:
        return {"status": "error", "message": "No sections selected."}

    # Fetch teaching slots (exclude breaks)
    all_slots = db.query(TimeSlot).order_by(TimeSlot.day, TimeSlot.period_no).all()
    teaching_slots = [s for s in all_slots if not s.is_break]
    days = sorted(list(set(s.day for s in teaching_slots)))
    periods = sorted(list(set(s.period_no for s in teaching_slots)))

    classrooms = db.query(Classroom).filter(Classroom.is_available == True).all()
    laboratories = db.query(Laboratory).filter(Laboratory.is_available == True).all()
    faculties = db.query(Faculty).all()

    # Map sections and subjects
    mappings = db.query(FacultySubjectMapping).filter(FacultySubjectMapping.section_id.in_(section_ids)).all()
    
    # 2. Check for locked cells to preserve
    # We find active timetables for these sections and extract cells marked as locked
    locked_cells_data = []
    active_timetables = db.query(Timetable).filter(
        Timetable.section_id.in_(section_ids),
        Timetable.academic_year_id == academic_year_id,
        Timetable.semester_id == semester_id,
        Timetable.is_active == True
    ).all()
    
    active_tt_ids = [tt.id for tt in active_timetables]
    if active_tt_ids:
        locked_cells = db.query(TimetableCell).filter(
            TimetableCell.timetable_id.in_(active_tt_ids),
            TimetableCell.is_locked == True
        ).all()
        for cell in locked_cells:
            locked_cells_data.append({
                "section_id": cell.timetable.section_id,
                "day": cell.time_slot.day,
                "period_no": cell.time_slot.period_no,
                "subject_id": cell.subject_id,
                "faculty_id": cell.faculty_id,
                "classroom_id": cell.classroom_id,
                "laboratory_id": cell.laboratory_id
            })

    # Helper maps
    sec_map = {s.id: s for s in sections}
    fac_map = {f.id: f for f in faculties}
    room_map = {c.id: c for c in classrooms}
    lab_map = {l.id: l for l in laboratories}
    slot_map = {(ts.day, ts.period_no): ts for ts in all_slots}

    # Model Initialization
    model = cp_model.CpModel()

    # Variables: X[s_id, subj_id, day, period] -> Boolean
    # 1 if section s is taking subject subj on day at period
    X = {}
    # Room allocation variables
    # RoomAlloc[s_id, room_id, day, period] -> Boolean (for classrooms)
    RoomAlloc = {}
    # LabAlloc[s_id, lab_id, day, period] -> Boolean (for laboratories)
    LabAlloc = {}

    # Gather subjects per section
    subjects_by_section = {}
    for mapping in mappings:
        s_id = mapping.section_id
        if s_id not in subjects_by_section:
            subjects_by_section[s_id] = []
        subjects_by_section[s_id].append(mapping)

    # Validate workload before running solver
    for s_id, s_mappings in subjects_by_section.items():
        total_hours = sum(m.hours_allocated for m in s_mappings)
        max_slots = len(teaching_slots)
        if total_hours > max_slots:
            return {
                "status": "error",
                "message": f"Section {sec_map[s_id].name} requires {total_hours} hours, but only {max_slots} slots are available."
            }

    # Initialize Variables
    for s_id in section_ids:
        s_mappings = subjects_by_section.get(s_id, [])
        for m in s_mappings:
            subj = m.subject
            for d in days:
                for p in periods:
                    X[s_id, subj.id, d, p] = model.NewBoolVar(f"X_{s_id}_{subj.id}_{d}_{p}")

        for r in classrooms:
            for d in days:
                for p in periods:
                    RoomAlloc[s_id, r.id, d, p] = model.NewBoolVar(f"Room_{s_id}_{r.id}_{d}_{p}")

        for l in laboratories:
            for d in days:
                for p in periods:
                    LabAlloc[s_id, l.id, d, p] = model.NewBoolVar(f"Lab_{s_id}_{l.id}_{d}_{p}")

    # --- Constraints ---
    objective_terms = []

    # 1. At most one subject per section per slot
    for s_id in section_ids:
        s_mappings = subjects_by_section.get(s_id, [])
        for d in days:
            for p in periods:
                model.Add(
                    sum(X[s_id, m.subject_id, d, p] for m in s_mappings) <= 1
                )

    # 2. Schedule weekly hours (exact for labs, at least for theory)
    for s_id in section_ids:
        s_mappings = subjects_by_section.get(s_id, [])
        for m in s_mappings:
            if m.subject.is_lab:
                model.Add(
                    sum(X[s_id, m.subject_id, d, p] for d in days for p in periods) == m.hours_allocated
                )
            else:
                model.Add(
                    sum(X[s_id, m.subject_id, d, p] for d in days for p in periods) >= m.hours_allocated
                )

    # 3. Faculty clash prevention
    # Faculty can teach at most one section in any period
    for f in faculties:
        for d in days:
            for p in periods:
                faculty_vars = []
                for s_id in section_ids:
                    s_mappings = subjects_by_section.get(s_id, [])
                    for m in s_mappings:
                        if m.faculty_id == f.id:
                            faculty_vars.append(X[s_id, m.subject_id, d, p])
                if faculty_vars:
                    model.Add(sum(faculty_vars) <= 1)

    # 4. Room and Lab Allocation Clashes
    # Classrooms:
    for d in days:
        for p in periods:
            for r in classrooms:
                model.Add(sum(RoomAlloc[s_id, r.id, d, p] for s_id in section_ids) <= 1)
            for l in laboratories:
                model.Add(sum(LabAlloc[s_id, l.id, d, p] for s_id in section_ids) <= 1)

    # Link X variables to Room/Lab allocations
    for s_id in section_ids:
        s_mappings = subjects_by_section.get(s_id, [])
        for d in days:
            for p in periods:
                # Theory subjects require a classroom
                theory_mappings = [m for m in s_mappings if not m.subject.is_lab]
                if theory_mappings:
                    # If any theory subject is scheduled, a classroom must be active
                    sum_theory = sum(X[s_id, m.subject_id, d, p] for m in theory_mappings)
                    model.Add(sum(RoomAlloc[s_id, r.id, d, p] for r in classrooms) == sum_theory)
                
                # Lab subjects require a laboratory
                lab_mappings = [m for m in s_mappings if m.subject.is_lab]
                if lab_mappings:
                    sum_labs = sum(X[s_id, m.subject_id, d, p] for m in lab_mappings)
                    model.Add(sum(LabAlloc[s_id, l.id, d, p] for l in laboratories) == sum_labs)

    # 5. Continuous Labs (Labs are scheduled in blocks of 3 periods: 1-2-3 or 5-6-7)
    # Let's define lab start variables
    LabStart = {}
    for s_id in section_ids:
        s_mappings = subjects_by_section.get(s_id, [])
        for m in s_mappings:
            if m.subject.is_lab:
                duration = m.subject.lab_duration or 3
                # We will define valid starting periods
                # For duration 3: Period 1 (1,2,3) or Period 5 (5,6,7)
                valid_starts = [1, 5] if duration == 3 else [1, 3, 5]
                for d in days:
                    for start_p in valid_starts:
                        LabStart[s_id, m.subject_id, d, start_p] = model.NewBoolVar(f"StartLab_{s_id}_{m.subject_id}_{d}_{start_p}")
                        
                        # Link starting variable to scheduled slots
                        for offset in range(duration):
                            model.Add(X[s_id, m.subject_id, d, start_p + offset] >= LabStart[s_id, m.subject_id, d, start_p])
                
                # The sum of starts must equal total occurrences. If lab is 3 hours, and scheduled for 3 hours, it starts exactly once.
                # Total sessions = hours_allocated / duration
                total_sessions = m.hours_allocated // duration
                model.Add(
                    sum(LabStart[s_id, m.subject_id, d, start_p] for d in days for start_p in valid_starts) == total_sessions
                )

                # Ensure that the lab only occupies slots when started
                # For any period, the lab can only be active if one of the valid starts covering it is active
                for d in days:
                    for p in periods:
                        active_starts = []
                        for start_p in valid_starts:
                            if start_p <= p < start_p + duration:
                                active_starts.append(LabStart[s_id, m.subject_id, d, start_p])
                        if active_starts:
                            model.Add(X[s_id, m.subject_id, d, p] <= sum(active_starts))
                        else:
                            model.Add(X[s_id, m.subject_id, d, p] == 0)

    # 6. Faculty Availability Constraints
    for f in faculties:
        if f.availability:
            # availability is JSON e.g. {"Monday": [1,2,3,4], "Tuesday": [3,4,5]}
            # If a day/period is NOT in availability, faculty is busy.
            for d in days:
                avail_periods = f.availability.get(d, [])
                for p in periods:
                    if p not in avail_periods:
                        # Faculty unavailable!
                        for s_id in section_ids:
                            s_mappings = subjects_by_section.get(s_id, [])
                            for m in s_mappings:
                                if m.faculty_id == f.id:
                                    model.Add(X[s_id, m.subject_id, d, p] == 0)

    # 7. Spread Subjects (Theory subjects: max 2 periods per day, penalizing double periods)
    for s_id in section_ids:
        s_mappings = subjects_by_section.get(s_id, [])
        for m in s_mappings:
            if not m.subject.is_lab:
                for d in days:
                    # Hard constraint: max 2 periods of the same theory subject per day
                    model.Add(sum(X[s_id, m.subject_id, d, p] for p in periods) <= 2)
                    
                    # Soft penalty for double period
                    double_period = model.NewBoolVar(f"DoublePeriod_{s_id}_{m.subject_id}_{d}")
                    model.Add(sum(X[s_id, m.subject_id, d, p] for p in periods) - 1 <= double_period)
                    objective_terms.append(-5 * double_period)
                
                # Prevent the same theory subject from appearing in the same period number more than twice a week
                for p in periods:
                    model.Add(sum(X[s_id, m.subject_id, d, p] for d in days) <= 2)

    # 7.5. All main (theory) subjects must appear in Period 1 at least once a week
    for s_id in section_ids:
        s_mappings = subjects_by_section.get(s_id, [])
        theory_mappings = [m for m in s_mappings if not m.subject.is_lab]
        if theory_mappings and len(theory_mappings) <= len(days):
            for m in theory_mappings:
                model.Add(sum(X[s_id, m.subject_id, d, 1] for d in days) >= 1)

    # 8. Locked Cells Hard Constraint
    for cell in locked_cells_data:
        s_id = cell["section_id"]
        d = cell["day"]
        p = cell["period_no"]
        sub_id = cell["subject_id"]
        cr_id = cell["classroom_id"]
        lab_id = cell["laboratory_id"]

        # Only apply constraint if section is in our active generation list
        if s_id in section_ids:
            s_mappings = subjects_by_section.get(s_id, [])
            # Pin the subject
            if sub_id:
                # Ensure the subject is in the variables map
                if (s_id, sub_id, d, p) in X:
                    model.Add(X[s_id, sub_id, d, p] == 1)
                # Pin the room
                if cr_id and (s_id, cr_id, d, p) in RoomAlloc:
                    model.Add(RoomAlloc[s_id, cr_id, d, p] == 1)
                elif lab_id and (s_id, lab_id, d, p) in LabAlloc:
                    model.Add(LabAlloc[s_id, lab_id, d, p] == 1)
            else:
                # Pin as free
                for m in s_mappings:
                    model.Add(X[s_id, m.subject_id, d, p] == 0)

    # --- Optimization Objectives (Soft Constraints) ---

    # A. Prioritize Afternoon Labs
    if prioritize_afternoon_labs:
        for s_id in section_ids:
            s_mappings = subjects_by_section.get(s_id, [])
            for m in s_mappings:
                if m.subject.is_lab:
                    duration = m.subject.lab_duration or 3
                    valid_starts = [1, 5] if duration == 3 else [1, 3, 5]
                    for d in days:
                        if 5 in valid_starts:
                            # Reward starting lab at period 5 (afternoon)
                            # Weight of 20
                            objective_terms.append(20 * LabStart[s_id, m.subject_id, d, 5])

    # B. Placement / Project in afternoon
    # Look for subjects with name containing 'placement', 'project', or 'seminar'
    for s_id in section_ids:
        s_mappings = subjects_by_section.get(s_id, [])
        for m in s_mappings:
            name_lower = m.subject.name.lower()
            if "placement" in name_lower or "project" in name_lower or "training" in name_lower:
                for d in days:
                    for p in periods:
                        if p >= 5: # Afternoon periods
                            objective_terms.append(10 * X[s_id, m.subject_id, d, p])

    # C. Minimize Faculty Gaps
    if minimize_faculty_gaps:
        # For each faculty and day, create busy variables
        for f in faculties:
            for d in days:
                # Find all teaching slots for this faculty on this day
                # We define busy variables Busy[f, d, p]
                Busy = {}
                for p in periods:
                    Busy[p] = model.NewBoolVar(f"Busy_fac_{f.id}_{d}_{p}")
                    faculty_vars = []
                    for s_id in section_ids:
                        s_mappings = subjects_by_section.get(s_id, [])
                        for m in s_mappings:
                            if m.faculty_id == f.id:
                                faculty_vars.append(X[s_id, m.subject_id, d, p])
                    if faculty_vars:
                        model.Add(Busy[p] == sum(faculty_vars))
                    else:
                        model.Add(Busy[p] == 0)

                # Find gaps: Busy at p-1 and p+1, but free at p
                for idx, p in enumerate(periods[1:-1]):
                    p_prev = periods[idx]
                    p_next = periods[idx + 2]
                    
                    gap = model.NewBoolVar(f"Gap_{f.id}_{d}_{p}")
                    # gap >= Busy[p_prev] + Busy[p_next] - 1 - Busy[p]
                    model.Add(gap >= Busy[p_prev] + Busy[p_next] - 1 - Busy[p])
                    
                    # We penalize gaps with weight -10 (which is minimizing the positive term)
                    # To model this in Maximize objective, we subtract from objective (or maximize negative gap)
                    # We add negative terms to maximize
                    objective_terms.append(-10 * gap)

    # D. Minimize Section/Student Gaps
    SectionActive = {}
    for s_id in section_ids:
        s_mappings = subjects_by_section.get(s_id, [])
        for d in days:
            for p in periods:
                SectionActive[s_id, d, p] = model.NewBoolVar(f"SectionActive_{s_id}_{d}_{p}")
                if s_mappings:
                    model.Add(SectionActive[s_id, d, p] == sum(X[s_id, m.subject_id, d, p] for m in s_mappings))
                else:
                    model.Add(SectionActive[s_id, d, p] == 0)

    for s_id in section_ids:
        for d in days:
            for idx, r in enumerate(periods[1:-1]):
                gap_var = model.NewBoolVar(f"SectionGap_{s_id}_{d}_{r}")
                
                # Check for any active period before r and active period after r
                for p in periods[:idx + 1]:
                    for q in periods[idx + 2:]:
                        model.Add(gap_var >= SectionActive[s_id, d, p] + SectionActive[s_id, d, q] - 1 - SectionActive[s_id, d, r])
                
                # Penalize section gaps (e.g. weight of -20)
                objective_terms.append(-20 * gap_var)

    # E. Pack classes to earlier periods (prefer earlier slots)
    for s_id in section_ids:
        for d in days:
            for p in periods:
                # Reward earlier periods: 50 + len(periods) - p + 1
                reward_weight = 50 + len(periods) - p + 1
                objective_terms.append(reward_weight * SectionActive[s_id, d, p])

    if objective_terms:
        model.Maximize(sum(objective_terms))

    # --- Solver Execution ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0  # Limit to 30s
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        # Save generated timetable
        logger.info("Schedule found! Saving to database...")
        
        # Deactivate old timetables
        db.query(Timetable).filter(
            Timetable.section_id.in_(section_ids),
            Timetable.academic_year_id == academic_year_id,
            Timetable.semester_id == semester_id
        ).update({Timetable.is_active: False}, synchronize_session=False)

        # Create new timetables
        new_timetables = {}
        for s_id in section_ids:
            # Determine version
            last_version = db.query(func.max(Timetable.version)).filter(
                Timetable.section_id == s_id,
                Timetable.academic_year_id == academic_year_id,
                Timetable.semester_id == semester_id
            ).scalar() or 0
            
            tt = Timetable(
                academic_year_id=academic_year_id,
                semester_id=semester_id,
                section_id=s_id,
                version=last_version + 1,
                is_active=True,
                created_by_id=user_id
            )
            db.add(tt)
            db.flush() # get tt.id
            new_timetables[s_id] = tt.id

        # Insert cells
        cells_to_add = []
        for s_id in section_ids:
            s_mappings = subjects_by_section.get(s_id, [])
            timetable_id = new_timetables[s_id]
            
            # Group all slots
            for d in days:
                for p in periods:
                    ts = slot_map.get((d, p))
                    if not ts:
                        continue

                    # Check if locked from previous active version
                    locked_cell_found = None
                    for lc in locked_cells_data:
                        if lc["section_id"] == s_id and lc["day"] == d and lc["period_no"] == p:
                            locked_cell_found = lc
                            break

                    if locked_cell_found:
                        # Re-create locked cell exactly
                        cell = TimetableCell(
                            timetable_id=timetable_id,
                            time_slot_id=ts.id,
                            subject_id=locked_cell_found["subject_id"],
                            faculty_id=locked_cell_found["faculty_id"],
                            classroom_id=locked_cell_found["classroom_id"],
                            laboratory_id=locked_cell_found["laboratory_id"],
                            is_locked=True
                        )
                        cells_to_add.append(cell)
                        continue

                    # Determine assigned subject
                    assigned_mapping = None
                    for m in s_mappings:
                        if solver.Value(X[s_id, m.subject_id, d, p]) == 1:
                            assigned_mapping = m
                            break

                    if assigned_mapping:
                        sub = assigned_mapping.subject
                        fac_id = assigned_mapping.faculty_id
                        
                        # Find room allocation
                        cr_id = None
                        lab_id = None
                        if not sub.is_lab:
                            for r in classrooms:
                                if solver.Value(RoomAlloc[s_id, r.id, d, p]) == 1:
                                    cr_id = r.id
                                    break
                        else:
                            for l in laboratories:
                                if solver.Value(LabAlloc[s_id, l.id, d, p]) == 1:
                                    lab_id = l.id
                                    break

                        cell = TimetableCell(
                            timetable_id=timetable_id,
                            time_slot_id=ts.id,
                            subject_id=sub.id,
                            faculty_id=fac_id,
                            classroom_id=cr_id,
                            laboratory_id=lab_id,
                            is_locked=False
                        )
                    else:
                        # Free period
                        cell = TimetableCell(
                            timetable_id=timetable_id,
                            time_slot_id=ts.id,
                            subject_id=None,
                            faculty_id=None,
                            classroom_id=None,
                            laboratory_id=None,
                            is_locked=False
                        )
                    cells_to_add.append(cell)

            # Insert break cells for consistency
            break_slots = [s for s in all_slots if s.is_break]
            for bs in break_slots:
                cell = TimetableCell(
                    timetable_id=timetable_id,
                    time_slot_id=bs.id,
                    subject_id=None,
                    faculty_id=None,
                    classroom_id=None,
                    laboratory_id=None,
                    is_locked=False
                )
                cells_to_add.append(cell)

        db.bulk_save_objects(cells_to_add)
        
        # Write Audit Log
        audit = AuditLog(
            user_id=user_id,
            action="GENERATE_TIMETABLE",
            details={
                "section_ids": section_ids,
                "academic_year_id": academic_year_id,
                "semester_id": semester_id,
                "status": "success",
                "prioritize_afternoon_labs": prioritize_afternoon_labs,
                "minimize_faculty_gaps": minimize_faculty_gaps
            }
        )
        db.add(audit)
        db.commit()
        return {"status": "success", "message": "Timetable generated successfully."}
    else:
        # Solving failed
        logger.warning("Solver failed to find a solution.")
        audit = AuditLog(
            user_id=user_id,
            action="GENERATE_TIMETABLE_FAILED",
            details={
                "section_ids": section_ids,
                "academic_year_id": academic_year_id,
                "semester_id": semester_id,
                "reason": "Constraints cannot be satisfied (Infeasible)"
            }
        )
        db.add(audit)
        db.commit()
        return {
            "status": "error",
            "message": "Failed to generate timetable. The constraints are too tight (Infeasible). Check faculty workloads or room availabilities."
        }
