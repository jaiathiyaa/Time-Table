import { useState, useEffect } from 'react';

function WorkloadMapping({ authFetch, showToast, user }) {
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form selections dependencies
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);

  // Form fields state
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [hoursAllocated, setHoursAllocated] = useState('');

  // Filtering workload list by department
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // Track expanded faculty rows
  const [expandedFacultyId, setExpandedFacultyId] = useState(null);

  useEffect(() => {
    fetchWorkloads();
    fetchFormDependencies();
  }, [selectedDeptId]);

  const fetchWorkloads = async () => {
    setLoading(true);
    try {
      const url = selectedDeptId ? `/mapping/workload?department_id=${selectedDeptId}` : '/mapping/workload';
      const data = await authFetch(url);
      setWorkloads(data);
    } catch (e) {
      showToast(e.message || 'Failed to fetch workloads data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormDependencies = async () => {
    try {
      const [facs, subs, secs, depts] = await Promise.all([
        authFetch('/master/faculties'),
        authFetch('/master/subjects'),
        authFetch('/master/sections'),
        authFetch('/master/departments')
      ]);
      setFaculties(facs);
      setSubjects(subs);
      setSections(secs);
      setDepartments(depts);
    } catch (e) {
      console.error('Error fetching mapping form dependencies:', e);
    }
  };

  // Prefill weekly hours when subject changes
  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setSelectedSubjectId(subId);
    if (!subId) {
      setHoursAllocated('');
      return;
    }
    const matched = subjects.find(s => s.id === parseInt(subId));
    if (matched) {
      setHoursAllocated(matched.weekly_hours);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user.role === 'faculty') {
      showToast('Faculty are not permitted to update workload mapping parameters', 'danger');
      return;
    }

    try {
      await authFetch('/mapping', {
        method: 'POST',
        body: JSON.stringify({
          faculty_id: parseInt(selectedFacultyId),
          subject_id: parseInt(selectedSubjectId),
          section_id: parseInt(selectedSectionId),
          hours_allocated: parseInt(hoursAllocated)
        })
      });

      showToast('Faculty subject mapping allocated successfully', 'success');
      setShowAddForm(false);
      
      // Reset form
      setSelectedFacultyId('');
      setSelectedSubjectId('');
      setSelectedSectionId('');
      setHoursAllocated('');
      
      // Refresh list
      fetchWorkloads();
    } catch (error) {
      showToast(error.message || 'Failed to create workload allocation', 'danger');
    }
  };

  const handleDeleteAllocation = async (mappingId) => {
    if (!window.confirm('Are you sure you want to remove this subject workload mapping?')) return;
    try {
      await authFetch(`/mapping/${mappingId}`, { method: 'DELETE' });
      showToast('Allocation removed successfully', 'success');
      fetchWorkloads();
    } catch (e) {
      showToast(e.message || 'Failed to remove allocation', 'danger');
    }
  };

  const toggleRow = (facultyId) => {
    if (expandedFacultyId === facultyId) {
      setExpandedFacultyId(null);
    } else {
      setExpandedFacultyId(facultyId);
    }
  };

  return (
    <div>
      {/* Filtering Toolbar */}
      <div className="timetable-filter-bar">
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <label className="form-label">Filter Department</label>
          <select 
            className="form-control"
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {user.role !== 'faculty' && (
          <button 
            className="btn btn-primary" 
            style={{ marginLeft: 'auto' }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Close Mapping Form' : '➕ Map Faculty to Subject'}
          </button>
        )}
      </div>

      {/* Map Faculty to Subject Form Drawer */}
      {showAddForm && (
        <div className="table-container" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Allocate New Workload Target
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            
            <div className="form-group">
              <label className="form-label">Select Faculty</label>
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

            <div className="form-group">
              <label className="form-label">Select Subject</label>
              <select
                className="form-control"
                required
                value={selectedSubjectId}
                onChange={handleSubjectChange}
              >
                <option value="">Select Course</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.weekly_hours}h</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Section Class</label>
              <select
                className="form-control"
                required
                value={selectedSectionId}
                onChange={e => setSelectedSectionId(e.target.value)}
              >
                <option value="">Select Section</option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    Sem {sec.semester?.semester_number} {sec.department?.code}-{sec.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ maxWidth: '120px' }}>
              <label className="form-label">Workload (Hrs)</label>
              <input
                type="number"
                min="1"
                max="8"
                className="form-control"
                required
                value={hoursAllocated}
                onChange={e => setHoursAllocated(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '42px', marginBottom: '4px' }}>
              Confirm Allocation
            </button>
          </form>
        </div>
      )}

      {/* Faculty Workload Dashboard Grid */}
      <div className="table-container">
        <div className="table-toolbar">
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Faculty Workload Analytics Table</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click row to view or edit individual course allocations</span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Fetching workload metrics...</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Lecturer Code</th>
                <th>Lecturer Name</th>
                <th>Weekly Limit</th>
                <th>Assigned Workload</th>
                <th style={{ width: '220px' }}>Capacity Meter</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workloads.length > 0 ? (
                workloads.map((wl) => {
                  const pct = Math.min(100, (wl.allocated_workload / wl.max_workload) * 100);
                  const isExpanded = expandedFacultyId === wl.faculty_id;
                  
                  return (
                    <>
                      <tr 
                        key={wl.faculty_id} 
                        onClick={() => toggleRow(wl.faculty_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                          {isExpanded ? '▼' : '▶'}
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{wl.faculty_code}</td>
                        <td>{wl.faculty_name}</td>
                        <td>{wl.max_workload} hrs</td>
                        <td>{wl.allocated_workload} hrs</td>
                        <td>
                          <div className="workload-meter-container">
                            <div className="workload-progress-bg">
                              <div 
                                className={`workload-progress-bar ${wl.is_overloaded ? 'overload' : (wl.allocated_workload < 6 ? 'warning' : '')}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          {wl.is_overloaded ? (
                            <span className="badge badge-danger">OVERLOADED</span>
                          ) : wl.allocated_workload < 6 ? (
                            <span className="badge badge-warning">UNDERLOADED</span>
                          ) : (
                            <span className="badge badge-success">OPTIMAL</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Section (Mapped Course List) */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                          <td />
                          <td colSpan="6" style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ padding: '0.5rem', borderLeft: '3px solid var(--accent)' }}>
                              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                                Allocated Subjects for {wl.faculty_name}
                              </h4>
                              
                              {wl.subjects && wl.subjects.length > 0 ? (
                                <table className="custom-table" style={{ width: '100%', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                  <thead style={{ backgroundColor: 'var(--bg-app)' }}>
                                    <tr>
                                      <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Subject Code</th>
                                      <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Subject Title</th>
                                      <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Allocated Section</th>
                                      <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Hours/Week</th>
                                      {user.role !== 'faculty' && <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', width: '100px' }}>Action</th>}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {wl.subjects.map((sub) => (
                                      <tr key={sub.mapping_id} style={{ backgroundColor: 'var(--bg-card)' }}>
                                        <td style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>{sub.subject_code}</td>
                                        <td style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>{sub.subject_name}</td>
                                        <td style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                          <span className="badge badge-accent">{sub.section_name}</span>
                                        </td>
                                        <td style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>{sub.hours} hrs</td>
                                        {user.role !== 'faculty' && (
                                          <td style={{ padding: '0.5rem 1rem' }}>
                                            <button 
                                              className="btn btn-danger btn-sm"
                                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAllocation(sub.mapping_id);
                                              }}
                                            >
                                              Deallocate
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  No subjects currently mapped to this lecturer.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2rem' }}>
                    No faculty found matching the selection criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default WorkloadMapping;
