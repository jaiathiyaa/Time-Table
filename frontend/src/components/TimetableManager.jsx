import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function TimetableManager({ authFetch, showToast, user }) {
  // Filters & State
  const [filterType, setFilterType] = useState('section'); // section, faculty, room, lab
  const [selectedId, setSelectedId] = useState('');
  
  // Master lists for filters
  const [sections, setSections] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  
  // Active Year/Semester for generation
  const [activeAYId, setActiveAYId] = useState('');
  const [activeSemId, setActiveSemId] = useState('');
  const [selectedSectionsForGen, setSelectedSectionsForGen] = useState([]);

  // Loaded timetable state
  const [timetable, setTimetable] = useState(null); // For section view
  const [cells, setCells] = useState([]); // For other views
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Editing / Swapping cell state
  const [selectedCell, setSelectedCell] = useState(null); // Active cell being edited or swapped
  const [swapMode, setSwapMode] = useState(false); // If true, next click will swap with selectedCell
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit Form State
  const [subjectsForSection, setSubjectsForSection] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [forceOverride, setForceOverride] = useState(false);
  
  // Real-time conflicts checking state
  const [cellConflicts, setCellConflicts] = useState([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchTimetableData();
    } else {
      setTimetable(null);
      setCells([]);
    }
  }, [filterType, selectedId]);

  // Check conflicts when form fields change in edit modal
  useEffect(() => {
    if (showEditModal && selectedCell) {
      triggerLiveConflictCheck();
    }
  }, [selectedSubjectId, selectedFacultyId, selectedRoomId, selectedLabId]);

  const fetchInitialData = async () => {
    try {
      const [secs, facs, rooms, labs, ays, sems, slots] = await Promise.all([
        authFetch('/master/sections'),
        authFetch('/master/faculties'),
        authFetch('/master/classrooms'),
        authFetch('/master/laboratories'),
        authFetch('/master/academic_years'),
        authFetch('/master/semesters'),
        authFetch('/master/time_slots')
      ]);

      setSections(secs);
      setFaculties(facs);
      setClassrooms(rooms);
      setLaboratories(labs);
      setAcademicYears(ays);
      setSemesters(sems);
      setTimeSlots(slots);

      // Default active year/semester
      const activeAY = ays.find(y => y.is_active);
      if (activeAY) {
        setActiveAYId(activeAY.id);
        // Find semesters in this active year
        const activeSem = sems.find(s => s.academic_year_id === activeAY.id);
        if (activeSem) setActiveSemId(activeSem.id);
      }

      // Default selection to first section if exists
      if (secs.length > 0) {
        setSelectedId(secs[0].id.toString());
      }
    } catch (e) {
      showToast('Error loading grid parameters: ' + e.message, 'danger');
    }
  };

  const fetchTimetableData = async () => {
    setLoading(true);
    try {
      if (filterType === 'section') {
        const data = await authFetch(`/timetable/section/${selectedId}`);
        setTimetable(data);
        setCells(data.cells || []);
      } else if (filterType === 'faculty') {
        const data = await authFetch(`/timetable/faculty/${selectedId}`);
        setTimetable(null);
        setCells(data);
      } else if (filterType === 'room') {
        const data = await authFetch(`/timetable/room/${selectedId}`);
        setTimetable(null);
        setCells(data);
      } else if (filterType === 'lab') {
        const data = await authFetch(`/timetable/lab/${selectedId}`);
        setTimetable(null);
        setCells(data);
      }
    } catch (error) {
      // 404 is normal if timetable isn't generated yet
      setTimetable(null);
      setCells([]);
      if (error.message.includes('404') || error.message.includes('not found')) {
        showToast('No active timetable found for this selection. Generate one below!', 'warning');
      } else {
        showToast(error.message, 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (user.role === 'faculty') {
      showToast('Faculty are not permitted to trigger solver generation', 'danger');
      return;
    }
    if (selectedSectionsForGen.length === 0) {
      showToast('Please select at least one Section to generate.', 'warning');
      return;
    }

    setGenerating(true);
    try {
      const response = await authFetch('/timetable/generate', {
        method: 'POST',
        body: JSON.stringify({
          academic_year_id: parseInt(activeAYId),
          semester_id: parseInt(activeSemId),
          section_ids: selectedSectionsForGen.map(id => parseInt(id)),
          prioritize_afternoon_labs: true,
          minimize_faculty_gaps: true
        })
      });

      showToast(response.message || 'Timetable generated successfully!', 'success');
      // Reload current grid if same section
      fetchTimetableData();
    } catch (error) {
      showToast('Solver failed: ' + error.message, 'danger');
    } finally {
      setGenerating(false);
    }
  };

  const handleLockToggle = async (cellId, e) => {
    e.stopPropagation();
    if (user.role === 'faculty') return;
    try {
      await authFetch(`/timetable/cell/${cellId}/lock`, { method: 'PUT' });
      showToast('Period lock toggled', 'success');
      fetchTimetableData();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  // Triggered when a cell is clicked on the grid
  const handleCellClick = async (slot, cell) => {
    if (user.role === 'faculty') return;

    if (swapMode && selectedCell) {
      // Swapping cell content!
      if (selectedCell.id === cell?.id) {
        setSwapMode(false);
        setSelectedCell(null);
        return;
      }
      performCellSwap(selectedCell, cell, slot);
      return;
    }

    // Normal Click: open edit/details
    if (!cell) {
      // Empty slot click: open modal with empty cell fields (only in section view)
      if (filterType !== 'section' || !timetable) {
        showToast('Empty cell. Switch to Section View to add records.', 'info');
        return;
      }
      showToast('Use the "Edit Details" overlay to manually populate periods.', 'info');
      return;
    }

    // Load mappings for this section to populate subjects
    try {
      const sectionId = cell.timetable?.section_id || timetable?.section_id;
      const mappings = await authFetch(`/mapping?section_id=${sectionId}`);
      setSubjectsForSection(mappings);
    } catch (e) {
      console.error(e);
    }

    setSelectedCell(cell);
    setSelectedSubjectId(cell.subject_id?.toString() || '');
    setSelectedFacultyId(cell.faculty_id?.toString() || '');
    setSelectedRoomId(cell.classroom_id?.toString() || '');
    setSelectedLabId(cell.laboratory_id?.toString() || '');
    setIsLocked(cell.is_locked);
    setForceOverride(false);
    setShowEditModal(true);
  };

  // Perform Swap using standard PUT endpoints sequentially
  const performCellSwap = async (cell1, cell2, slot2) => {
    if (!cell1) return;
    
    // If cell2 is empty, it's a move, not a swap!
    const cell1Data = {
      subject_id: cell1.subject_id,
      faculty_id: cell1.faculty_id,
      classroom_id: cell1.classroom_id,
      laboratory_id: cell1.laboratory_id,
      is_locked: cell1.is_locked
    };

    const cell2Data = cell2 ? {
      subject_id: cell2.subject_id,
      faculty_id: cell2.faculty_id,
      classroom_id: cell2.classroom_id,
      laboratory_id: cell2.laboratory_id,
      is_locked: cell2.is_locked
    } : {
      subject_id: null,
      faculty_id: null,
      classroom_id: null,
      laboratory_id: null,
      is_locked: false
    };

    setLoading(true);
    try {
      // Check if cell2 exists (cell2 is null if target cell is empty slot)
      if (cell2) {
        // Double Swap
        // Step 1: Set cell1 with cell2's content
        await authFetch(`/timetable/cell/${cell1.id}?force=true`, {
          method: 'PUT',
          body: JSON.stringify(cell2Data)
        });

        // Step 2: Set cell2 with cell1's content
        await authFetch(`/timetable/cell/${cell2.id}?force=true`, {
          method: 'PUT',
          body: JSON.stringify(cell1Data)
        });
        showToast('Grid cells swapped successfully!', 'success');
      } else {
        // Move content to an empty grid slot
        // Wait, where is the empty slot cell? 
        // In our database structure, all cells are already initialized as empty (subject_id=None).
        // Let's find the cell in the current timetable that corresponds to slot2.id!
        const targetEmptyCell = cells.find(c => c.time_slot_id === slot2.id);
        if (targetEmptyCell) {
          // Step 1: Update target empty cell with cell1 content
          await authFetch(`/timetable/cell/${targetEmptyCell.id}?force=true`, {
            method: 'PUT',
            body: JSON.stringify(cell1Data)
          });
          // Step 2: Clear original cell1
          await authFetch(`/timetable/cell/${cell1.id}?force=true`, {
            method: 'PUT',
            body: JSON.stringify(cell2Data)
          });
          showToast('Period moved successfully!', 'success');
        } else {
          showToast('Target cell not found.', 'danger');
        }
      }
      fetchTimetableData();
    } catch (e) {
      showToast('Swap failed: ' + e.message, 'danger');
    } finally {
      setSwapMode(false);
      setSelectedCell(null);
      setLoading(false);
    }
  };

  const triggerLiveConflictCheck = async () => {
    if (!selectedCell) return;
    setCheckingConflicts(true);
    try {
      const response = await authFetch(`/timetable/check-conflicts?cell_id=${selectedCell.id}`, {
        method: 'POST',
        body: JSON.stringify({
          subject_id: selectedSubjectId ? parseInt(selectedSubjectId) : null,
          faculty_id: selectedFacultyId ? parseInt(selectedFacultyId) : null,
          classroom_id: selectedRoomId ? parseInt(selectedRoomId) : null,
          laboratory_id: selectedLabId ? parseInt(selectedLabId) : null
        })
      });
      setCellConflicts(response.conflicts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCell) return;

    try {
      const hasHardConflict = cellConflicts.some(c => c.severity === 'hard');
      if (hasHardConflict && !forceOverride) {
        showToast('Cannot save. Hard conflicts detected. Check "Force Override" to save anyway.', 'warning');
        return;
      }

      await authFetch(`/timetable/cell/${selectedCell.id}?force=${forceOverride}`, {
        method: 'PUT',
        body: JSON.stringify({
          subject_id: selectedSubjectId ? parseInt(selectedSubjectId) : null,
          faculty_id: selectedFacultyId ? parseInt(selectedFacultyId) : null,
          classroom_id: selectedRoomId ? parseInt(selectedRoomId) : null,
          laboratory_id: selectedLabId ? parseInt(selectedLabId) : null,
          is_locked: isLocked
        })
      });

      showToast('Period details overridden successfully!', 'success');
      setShowEditModal(false);
      fetchTimetableData();
    } catch (error) {
      showToast(error.message || 'Override failed', 'danger');
    }
  };

  // Group slots by Day and Period index
  // Seeded slots sequence contains 10 slots per day.
  // We want columns: Period 1, Period 2, Morning Break, Period 3, Period 4, Lunch, Period 5, Period 6, Afternoon Break, Period 7
  // Let's build a static column mapping based on standard Monday structure
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hourStr, minuteStr] = timeStr.split(':');
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    if (hour < 8) {
      hour += 12; // Convert afternoon times (1:00 to 7:00) to 24h
    }
    return hour * 60 + minute;
  };

  const mondaySlots = timeSlots.filter(ts => ts.day === 'Monday').sort((a,b) => {
    return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
  });

  const getCellForSlot = (day, slotStructureItem) => {
    // Find the timeSlot record that matches this day and structure (start/end time)
    const slot = timeSlots.find(ts => 
      ts.day === day && 
      ts.start_time === slotStructureItem.start_time && 
      ts.end_time === slotStructureItem.end_time
    );
    if (!slot) return { slot: null, cell: null };

    // Find cell matching this slot id
    const cell = cells.find(c => c.time_slot_id === slot.id);
    return { slot, cell };
  };

  const handleExcelExport = () => {
    if (filterType !== 'section' || !selectedId) {
      showToast('Please select a specific Section to download Excel.', 'warning');
      return;
    }
    window.open(`${API_BASE}/export/excel/section/${selectedId}?token=${localStorage.getItem('token')}`, '_blank');
    showToast('Preparing Excel download...', 'success');
  };

  const handlePdfExport = () => {
    if (filterType !== 'section' || !selectedId) {
      showToast('Please select a specific Section to download PDF.', 'warning');
      return;
    }
    window.open(`${API_BASE}/export/pdf/section/${selectedId}?token=${localStorage.getItem('token')}`, '_blank');
    showToast('Preparing PDF document...', 'success');
  };

  const handleSectionCheckboxChange = (sectionId) => {
    setSelectedSectionsForGen(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const selectedSectionObj = sections.find(s => s.id === parseInt(selectedId));
  const selectedDeptId = selectedSectionObj ? selectedSectionObj.department_id : null;

  const filteredSectionsForGen = sections
    .filter(s => s.semester_id === parseInt(activeSemId))
    .filter(s => !selectedDeptId || s.department_id === selectedDeptId);

  const handleSelectAllSections = () => {
    const filteredIds = filteredSectionsForGen.map(s => s.id.toString());
    const allSelected = filteredIds.every(id => selectedSectionsForGen.includes(id));
    if (allSelected) {
      setSelectedSectionsForGen(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedSectionsForGen(prev => {
        const unique = new Set([...prev, ...filteredIds]);
        return Array.from(unique);
      });
    }
  };

  return (
    <div>
      {/* Timetable Filters Toolbar */}
      <div className="timetable-filter-bar">
        <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
          <label className="form-label">View Matrix Filter</label>
          <select 
            className="form-control"
            value={filterType}
            onChange={e => {
              setFilterType(e.target.value);
              setSelectedId('');
            }}
          >
            <option value="section">Class Section</option>
            <option value="faculty">Lecturer Calendar</option>
            <option value="room">Lecture Classroom</option>
            <option value="lab">Laboratories</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0, minWidth: '220px' }}>
          <label className="form-label">Select Target</label>
          <select 
            className="form-control"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
          >
            <option value="">-- Choose Item --</option>
            {filterType === 'section' && sections.map(s => (
              <option key={s.id} value={s.id}>
                Sem {s.semester?.semester_number} {s.department?.code}-{s.name}
              </option>
            ))}
            {filterType === 'faculty' && faculties.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
            ))}
            {filterType === 'room' && classrooms.map(r => (
              <option key={r.id} value={r.id}>{r.room_no} (Cap: {r.capacity})</option>
            ))}
            {filterType === 'lab' && laboratories.map(l => (
              <option key={l.id} value={l.id}>{l.lab_name} (Cap: {l.capacity})</option>
            ))}
          </select>
        </div>

        {swapMode && (
          <div style={{
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <strong>⚡ Swap Active:</strong> Select target grid cell to complete move/swap.
            <button className="btn btn-secondary btn-sm" onClick={() => { setSwapMode(false); setSelectedCell(null); }}>
              Cancel
            </button>
          </div>
        )}

        {filterType === 'section' && cells.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExcelExport}>
              📊 Export Excel
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handlePdfExport}>
              📄 Export PDF / Print
            </button>
          </div>
        )}
      </div>

      {/* Solver Loader Overlay */}
      {generating && (
        <div className="solver-loading-overlay" style={{ margin: '2rem 0' }}>
          <div className="spinner"></div>
          <h3 style={{color: 'var(--text-primary)'}}>OR-Tools Scheduler Solver Running...</h3>
          <p style={{color: 'var(--text-secondary)'}}>
            Calculating optimum timetable cells under academic constraints.<br />
            Ensuring zero clashes for rooms, labs, and faculty schedules.
          </p>
        </div>
      )}

      {/* Grid Container */}
      {!generating && (
        <div className="timetable-grid-wrapper">
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading grid schedule...</p>
            </div>
          ) : cells.length > 0 ? (
            <table className="timetable-grid">
              <thead>
                <tr>
                  <th className="day-column">Day / Hour</th>
                  {mondaySlots.map((ts, idx) => (
                    <th key={idx}>
                      {ts.is_break ? (
                        <span>{ts.break_name}</span>
                      ) : (
                        <div>
                          <span>Period {ts.period_no}</span>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {ts.start_time} - {ts.end_time}
                          </span>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <tr key={day}>
                    <td className="day-column" style={{
                      backgroundColor: 'var(--bg-sidebar)',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      border: '1px solid var(--border-color)'
                    }}>
                      {day.substring(0, 3).toUpperCase()}
                    </td>
                    
                    {mondaySlots.map((slotStruct, colIdx) => {
                      const { slot, cell } = getCellForSlot(day, slotStruct);
                      
                      if (slotStruct.is_break) {
                        return (
                          <td 
                            key={colIdx} 
                            className="break-cell"
                          >
                            {slotStruct.break_name}
                          </td>
                        );
                      }

                      // Check if this cell matches swap active highlights
                      const isSwapSource = selectedCell && selectedCell.id === cell?.id;

                      return (
                        <td 
                          key={colIdx}
                          onClick={() => handleCellClick(slot, cell)}
                          className={`${isSwapSource ? 'cell-selected' : ''}`}
                          style={{
                            cursor: user.role !== 'faculty' ? 'pointer' : 'default'
                          }}
                        >
                          {cell && (cell.subject || filterType === 'section') ? (
                            <div className="timetable-cell-inner">
                              <div className="cell-subject" title={cell.subject ? cell.subject.name : "Self Study / Library"}>
                                {cell.subject ? cell.subject.code : "Self Study"}
                                {cell.is_locked && <span style={{ marginLeft: '4px' }}>🔒</span>}
                              </div>
                              
                              {/* Display varies based on active filter */}
                              {filterType === 'section' && (
                                <>
                                  <div className="cell-faculty" title={cell.subject ? cell.faculty?.name : "No Teacher"}>
                                    {cell.subject ? (cell.faculty?.code || 'No Teacher') : '—'}
                                  </div>
                                  <div className="cell-room">
                                    {cell.subject ? (cell.classroom?.room_no || cell.laboratory?.lab_name || 'No Room') : '—'}
                                  </div>
                                </>
                              )}

                              {(filterType === 'faculty' || filterType === 'room' || filterType === 'lab') && cell.subject && (
                                <>
                                  <div className="cell-faculty" style={{ color: 'var(--accent)' }}>
                                    Section: {cell.timetable?.section ? `${cell.timetable.section.department?.code}-${cell.timetable.section.semester?.semester_number}${cell.timetable.section.name}` : ''}
                                  </div>
                                  <div className="cell-room" style={{ color: 'var(--text-secondary)' }}>
                                    Room: {cell.classroom?.room_no || cell.laboratory?.lab_name || 'No Room'}
                                  </div>
                                </>
                              )}

                              {user.role !== 'faculty' && filterType === 'section' && (
                                <div className="cell-actions" onClick={e => e.stopPropagation()}>
                                  <button 
                                    className={`cell-lock-btn ${cell.is_locked ? 'locked' : ''}`}
                                    onClick={(e) => handleLockToggle(cell.id, e)}
                                    title={cell.is_locked ? 'Unlock Period' : 'Lock Period'}
                                  >
                                    🔐
                                  </button>
                                  <button 
                                    className="cell-edit-btn"
                                    onClick={() => {
                                      setSelectedCell(cell);
                                      setSwapMode(true);
                                      showToast('Swap mode active. Choose target cell to swap.', 'info');
                                    }}
                                    title="Swap or Move cell content"
                                  >
                                    ⇄
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="cell-empty-state">
                              {user.role !== 'faculty' && filterType === 'section' ? '+' : '-'}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active timetable is configured or loaded.
              {filterType === 'section' && user.role !== 'faculty' && (
                <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                  Please use the auto-generator wizard below to initialize a conflict-free schedule matrix.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Auto-Generation Wizard Panel (Only visible to Admin/HOD) */}
      {filterType === 'section' && user.role !== 'faculty' && !generating && (
        <div className="table-container" style={{ padding: '1.5rem', marginTop: '2rem' }}>
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <h3 className="card-title">🔌 OR-Tools Auto-Generation Wizard</h3>
          </div>
          
          <form onSubmit={handleGenerate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div className="form-group">
                <label className="form-label">Academic Target Year</label>
                <select
                  className="form-control"
                  required
                  value={activeAYId}
                  onChange={e => {
                    setActiveAYId(e.target.value);
                    // Update semesters filter
                    const matchedSem = semesters.find(s => s.academic_year_id === parseInt(e.target.value));
                    if (matchedSem) setActiveSemId(matchedSem.id.toString());
                  }}
                >
                  <option value="">Select Year</option>
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name} {ay.is_active ? '(Active)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Semester</label>
                <select
                  className="form-control"
                  required
                  value={activeSemId}
                  onChange={e => setActiveSemId(e.target.value)}
                >
                  <option value="">Select Semester</option>
                  {semesters
                    .filter(s => s.academic_year_id === parseInt(activeAYId))
                    .map(sem => (
                      <option key={sem.id} value={sem.id}>Semester {sem.semester_number} ({sem.regulation})</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Sections Checklist */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Select Sections to Schedule</label>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={handleSelectAllSections}
                >
                  {selectedSectionsForGen.length === sections.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '0.75rem',
                maxHeight: '150px',
                overflowY: 'auto',
                padding: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-input)'
              }}>
                {filteredSectionsForGen.map(sec => (
                  <label key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedSectionsForGen.includes(sec.id.toString())}
                      onChange={() => handleSectionCheckboxChange(sec.id.toString())}
                    />
                    Sem {sec.semester?.semester_number} {sec.department?.code}-{sec.name}
                  </label>
                ))}
                {filteredSectionsForGen.length === 0 && (
                  <span style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                    No sections defined for selected target semester.
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                🚀 Run Solver Auto-Generation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Override Edit Cell Modal */}
      {showEditModal && selectedCell && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Manually Edit Schedule Cell</h3>
              <button className="btn btn-secondary btn-sm" style={{ border: 'none' }} onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleEditFormSubmit}>
              <div className="modal-body">
                <div style={{ 
                  backgroundColor: 'var(--bg-sidebar)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}>
                  <strong>Position:</strong> {selectedCell.time_slot?.day} Period {selectedCell.time_slot?.period_no} ({selectedCell.time_slot?.start_time} - {selectedCell.time_slot?.end_time})
                </div>

                <div className="form-group">
                  <label className="form-label">Subject Allocation</label>
                  <select
                    className="form-control"
                    value={selectedSubjectId}
                    onChange={e => {
                      const subId = e.target.value;
                      setSelectedSubjectId(subId);
                      if (!subId) {
                        setSelectedFacultyId('');
                        setSelectedRoomId('');
                        setSelectedLabId('');
                        return;
                      }
                      
                      // Auto-select mapped faculty for this subject if exists
                      const mapping = subjectsForSection.find(m => m.subject_id === parseInt(subId));
                      if (mapping) {
                        setSelectedFacultyId(mapping.faculty_id?.toString() || '');
                      }
                      
                      // Check if it's lab
                      const isLab = subjectsForSection.find(m => m.subject_id === parseInt(subId))?.subject?.is_lab;
                      if (isLab) {
                        setSelectedRoomId('');
                        // default to first lab
                        if (laboratories.length > 0) setSelectedLabId(laboratories[0].id.toString());
                      } else {
                        setSelectedLabId('');
                        if (classrooms.length > 0) setSelectedRoomId(classrooms[0].id.toString());
                      }
                    }}
                  >
                    <option value="">-- Unscheduled / Clear Cell --</option>
                    {subjectsForSection.map(mapItem => (
                      <option key={mapItem.subject_id} value={mapItem.subject_id}>
                        {mapItem.subject?.code} - {mapItem.subject?.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSubjectId && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Faculty Member</label>
                      <select
                        className="form-control"
                        required
                        value={selectedFacultyId}
                        onChange={e => setSelectedFacultyId(e.target.value)}
                      >
                        <option value="">Select Lecturer</option>
                        {faculties.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Show room input if theory, show lab input if laboratory subject */}
                    {subjectsForSection.find(m => m.subject_id === parseInt(selectedSubjectId))?.subject?.is_lab ? (
                      <div className="form-group">
                        <label className="form-label">Allocated Laboratory Room</label>
                        <select
                          className="form-control"
                          required
                          value={selectedLabId}
                          onChange={e => setSelectedLabId(e.target.value)}
                        >
                          <option value="">Select Lab Room</option>
                          {laboratories.map(lab => (
                            <option key={lab.id} value={lab.id}>{lab.lab_name} (Cap: {lab.capacity})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label className="form-label">Allocated Classroom</label>
                        <select
                          className="form-control"
                          required
                          value={selectedRoomId}
                          onChange={e => setSelectedRoomId(e.target.value)}
                        >
                          <option value="">Select Classroom</option>
                          {classrooms.map(cr => (
                            <option key={cr.id} value={cr.id}>{cr.room_no} (Cap: {cr.capacity})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="lockPeriodCheck"
                    checked={isLocked}
                    onChange={e => setIsLocked(e.target.checked)}
                  />
                  <label htmlFor="lockPeriodCheck" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    Lock this period? (Protects from auto-generation overrides)
                  </label>
                </div>

                {/* Live Conflict Analysis Area */}
                {selectedSubjectId && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      🔍 Live Collision & Constraints Report
                    </h4>
                    
                    {checkingConflicts ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analyzing collisions...</p>
                    ) : cellConflicts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {cellConflicts.map((conf, idx) => (
                          <div 
                            key={idx} 
                            style={{
                              backgroundColor: conf.severity === 'hard' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                              border: `1px solid ${conf.severity === 'hard' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                              borderRadius: '4px',
                              padding: '6px 10px',
                              fontSize: '0.75rem',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <strong>{conf.severity === 'hard' ? '❌ HARD clash: ' : '⚠️ warning: '}</strong>
                            {conf.message}
                          </div>
                        ))}
                        
                        {cellConflicts.some(c => c.severity === 'hard') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                              type="checkbox"
                              id="forceOverrideCheck"
                              checked={forceOverride}
                              onChange={e => setForceOverride(e.target.checked)}
                            />
                            <label htmlFor="forceOverrideCheck" style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--danger)', fontWeight: '600' }}>
                              Force save this change anyway (Overrides collisions)?
                            </label>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                        ✓ Clean schedule slot. No clashing bookings detected!
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimetableManager;
