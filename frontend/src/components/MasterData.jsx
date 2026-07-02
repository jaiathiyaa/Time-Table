import { useState, useEffect } from 'react';

function MasterData({ authFetch, showToast, user }) {
  const [activeTab, setActiveTab] = useState('departments');
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Lists needed for form select dropdowns
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [users, setUsers] = useState([]);

  // Form Fields
  const [formFields, setFormFields] = useState({});

  useEffect(() => {
    fetchActiveTabData();
    fetchDropdownDependencies();
  }, [activeTab]);

  const fetchActiveTabData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'departments') endpoint = '/master/departments';
      else if (activeTab === 'academic_years') endpoint = '/master/academic_years';
      else if (activeTab === 'semesters') endpoint = '/master/semesters';
      else if (activeTab === 'sections') endpoint = '/master/sections';
      else if (activeTab === 'subjects') endpoint = '/master/subjects';
      else if (activeTab === 'faculties') endpoint = '/master/faculties';
      else if (activeTab === 'classrooms') endpoint = '/master/classrooms';
      else if (activeTab === 'laboratories') endpoint = '/master/laboratories';
      else if (activeTab === 'time_slots') endpoint = '/master/time_slots';

      const data = await authFetch(endpoint);
      // Sort items by name, room no, or code for cleaner views
      setDataList(data);
    } catch (error) {
      showToast(error.message || 'Failed to fetch master data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownDependencies = async () => {
    try {
      const depts = await authFetch('/master/departments');
      setDepartments(depts);
      const ays = await authFetch('/master/academic_years');
      setAcademicYears(ays);
      const sems = await authFetch('/master/semesters');
      setSemesters(sems);
      if (user.role !== 'faculty') {
        const usersList = await authFetch('/auth/users');
        setUsers(usersList);
      }
    } catch (e) {
      console.error('Error fetching dependencies:', e);
    }
  };

  const getItemDisplayName = (item) => {
    if (!item) return '';
    if (activeTab === 'departments') return `Department ${item.code} (${item.name})`;
    if (activeTab === 'academic_years') return `Academic Year ${item.name}`;
    if (activeTab === 'semesters') return `Semester ${item.semester_number} (${item.regulation})`;
    if (activeTab === 'sections') return `Section ${item.name}`;
    if (activeTab === 'subjects') return `Subject ${item.code} - ${item.name}`;
    if (activeTab === 'faculties') return `Faculty ${item.name} (${item.code})`;
    if (activeTab === 'classrooms') return `Classroom ${item.room_no}`;
    if (activeTab === 'laboratories') return `Laboratory ${item.lab_name}`;
    if (activeTab === 'time_slots') return `${item.day} - ${item.is_break ? 'Break' : `Period ${item.period_no}`}`;
    return '';
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id;
    try {
      let endpoint = '';
      if (activeTab === 'departments') endpoint = `/master/departments/${id}`;
      else if (activeTab === 'academic_years') endpoint = `/master/academic_years/${id}`;
      else if (activeTab === 'semesters') endpoint = `/master/semesters/${id}`;
      else if (activeTab === 'sections') endpoint = `/master/sections/${id}`;
      else if (activeTab === 'subjects') endpoint = `/master/subjects/${id}`;
      else if (activeTab === 'faculties') endpoint = `/master/faculties/${id}`;
      else if (activeTab === 'classrooms') endpoint = `/master/classrooms/${id}`;
      else if (activeTab === 'laboratories') endpoint = `/master/laboratories/${id}`;
      else if (activeTab === 'time_slots') endpoint = `/master/time_slots/${id}`;

      await authFetch(endpoint, { method: 'DELETE' });
      showToast('Item deleted successfully', 'success');
      setDeleteConfirm(null);
      fetchActiveTabData();
    } catch (error) {
      showToast(error.message || 'Failed to delete item', 'danger');
    }
  };

  const handleActivateAY = async (id) => {
    try {
      await authFetch(`/master/academic_years/${id}/activate`, { method: 'PUT' });
      showToast('Academic Year activated', 'success');
      fetchActiveTabData();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormFields({});
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    // Initialize edit fields
    if (activeTab === 'faculties') {
      setFormFields({
        name: item.name,
        code: item.code,
        email: item.email,
        department_id: item.department_id,
        max_workload: item.max_workload,
        availability: item.availability || {},
        user_id: item.user_id || ''
      });
    }
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      let method = 'POST';
      let body = { ...formFields };

      if (activeTab === 'departments') {
        endpoint = '/master/departments';
      } else if (activeTab === 'academic_years') {
        endpoint = '/master/academic_years';
        body.is_active = body.is_active === 'true' || body.is_active === true;
      } else if (activeTab === 'semesters') {
        endpoint = '/master/semesters';
        body.semester_number = parseInt(body.semester_number);
        body.academic_year_id = parseInt(body.academic_year_id);
      } else if (activeTab === 'sections') {
        endpoint = '/master/sections';
        body.department_id = parseInt(body.department_id);
        body.semester_id = parseInt(body.semester_id);
      } else if (activeTab === 'subjects') {
        endpoint = '/master/subjects';
        body.department_id = parseInt(body.department_id);
        body.semester_id = parseInt(body.semester_id);
        body.weekly_hours = parseInt(body.weekly_hours);
        body.is_lab = body.is_lab === 'true' || body.is_lab === true;
        body.lab_duration = parseInt(body.lab_duration || 3);
        body.preferred_afternoon = body.preferred_afternoon === 'true' || body.preferred_afternoon === true;
      } else if (activeTab === 'faculties') {
        if (editingItem) {
          endpoint = `/master/faculties/${editingItem.id}`;
          method = 'PUT';
        } else {
          endpoint = '/master/faculties';
        }
        body.department_id = parseInt(body.department_id);
        body.max_workload = parseInt(body.max_workload || 18);
        body.user_id = body.user_id ? parseInt(body.user_id) : null;
        // Default availability: Monday-Saturday, periods 1-7
        if (!editingItem) {
          body.availability = {
            "Monday": [1,2,3,4,5,6,7],
            "Tuesday": [1,2,3,4,5,6,7],
            "Wednesday": [1,2,3,4,5,6,7],
            "Thursday": [1,2,3,4,5,6,7],
            "Friday": [1,2,3,4,5,6,7],
            "Saturday": [1,2,3,4,5,6,7]
          };
        }
      } else if (activeTab === 'classrooms') {
        endpoint = '/master/classrooms';
        body.capacity = parseInt(body.capacity);
        body.department_id = body.department_id ? parseInt(body.department_id) : null;
        body.is_available = true;
      } else if (activeTab === 'laboratories') {
        endpoint = '/master/laboratories';
        body.capacity = parseInt(body.capacity);
        body.department_id = body.department_id ? parseInt(body.department_id) : null;
        body.is_available = true;
      } else if (activeTab === 'time_slots') {
        endpoint = '/master/time_slots';
        body.period_no = parseInt(body.period_no);
        body.is_break = body.is_break === 'true' || body.is_break === true;
        if (body.is_break) {
          body.period_no = 0; // standard break period no
        }
      }

      await authFetch(endpoint, {
        method,
        body: JSON.stringify(body)
      });

      showToast(editingItem ? 'Updated successfully' : 'Created successfully', 'success');
      setShowModal(false);
      fetchActiveTabData();
    } catch (error) {
      showToast(error.message || 'Failed to submit form', 'danger');
    }
  };

  return (
    <div>
      {/* Master Data Tabs */}
      <div className="tabs-header">
        {[
          { id: 'departments', label: 'Departments' },
          { id: 'academic_years', label: 'Academic Years' },
          { id: 'semesters', label: 'Semesters' },
          { id: 'sections', label: 'Sections' },
          { id: 'subjects', label: 'Subjects' },
          { id: 'faculties', label: 'Faculty Profiles' },
          { id: 'classrooms', label: 'Classrooms' },
          { id: 'laboratories', label: 'Laboratories' },
          { id: 'time_slots', label: 'Time Slots' }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid Content Container */}
      <div className="table-container">
        <div className="table-toolbar">
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            Manage {activeTab.replace('_', ' ').toUpperCase()}
          </h3>
          {user.role !== 'faculty' && (
            <button className="btn btn-primary btn-sm" onClick={openAddModal}>
              ➕ Add New Entry
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Retrieving academic parameters...</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              {activeTab === 'departments' && (
                <tr>
                  <th>Dept Code</th>
                  <th>Department Name</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              )}
              {activeTab === 'academic_years' && (
                <tr>
                  <th>Academic Year</th>
                  <th>Status</th>
                  <th style={{ width: '220px' }}>Actions</th>
                </tr>
              )}
              {activeTab === 'semesters' && (
                <tr>
                  <th>Semester No</th>
                  <th>Regulation</th>
                  <th>Academic Year</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              )}
              {activeTab === 'sections' && (
                <tr>
                  <th>Section</th>
                  <th>Semester</th>
                  <th>Department</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              )}
              {activeTab === 'subjects' && (
                <tr>
                  <th>Code</th>
                  <th>Subject Name</th>
                  <th>Department</th>
                  <th>Sem</th>
                  <th>Weekly Hours</th>
                  <th>Type</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              )}
              {activeTab === 'faculties' && (
                <tr>
                  <th>Code</th>
                  <th>Faculty Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Max Workload</th>
                  <th>Linked User</th>
                  <th style={{ width: '160px' }}>Actions</th>
                </tr>
              )}
              {activeTab === 'classrooms' && (
                <tr>
                  <th>Room No</th>
                  <th>Capacity</th>
                  <th>Allotted Dept</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              )}
              {activeTab === 'laboratories' && (
                <tr>
                  <th>Lab Name</th>
                  <th>Capacity</th>
                  <th>Allotted Dept</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              )}
              {activeTab === 'time_slots' && (
                <tr>
                  <th>Day</th>
                  <th>Period</th>
                  <th>Time Range</th>
                  <th>Type</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {dataList.length > 0 ? (
                dataList.map((item) => (
                  <tr key={item.id}>
                    {activeTab === 'departments' && (
                      <>
                        <td style={{ fontWeight: 'bold' }}>{item.code}</td>
                        <td>{item.name}</td>
                      </>
                    )}
                    {activeTab === 'academic_years' && (
                      <>
                        <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                        <td>
                          <span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </>
                    )}
                    {activeTab === 'semesters' && (
                      <>
                        <td style={{ fontWeight: 'bold' }}>Semester {item.semester_number}</td>
                        <td>{item.regulation}</td>
                        <td>{item.academic_year?.name}</td>
                      </>
                    )}
                    {activeTab === 'sections' && (
                      <>
                        <td style={{ fontWeight: 'bold' }}>Section {item.name}</td>
                        <td>Sem {item.semester?.semester_number} ({item.semester?.regulation})</td>
                        <td>{item.department?.code}</td>
                      </>
                    )}
                    {activeTab === 'subjects' && (
                      <>
                        <td style={{ fontWeight: 'bold' }}>{item.code}</td>
                        <td>{item.name}</td>
                        <td>{item.department?.code}</td>
                        <td>Sem {item.semester?.semester_number}</td>
                        <td>{item.weekly_hours} hrs</td>
                        <td>
                          <span className={`badge ${item.is_lab ? 'badge-info' : 'badge-accent'}`}>
                            {item.is_lab ? `LAB (${item.lab_duration}h)` : 'THEORY'}
                          </span>
                        </td>
                      </>
                    )}
                    {activeTab === 'faculties' && (
                      <>
                        <td style={{ fontWeight: 'bold' }}>{item.code}</td>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td>{item.department?.code}</td>
                        <td>{item.max_workload} hrs/week</td>
                        <td>
                          {item.user_id ? (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              {users.find(u => u.id === item.user_id)?.username || `User #${item.user_id}`}
                            </span>
                          ) : (
                            <span style={{ fontStyle: 'italic', opacity: 0.5, fontSize: '0.8rem' }}>
                              Not Linked
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    {activeTab === 'classrooms' && (
                      <>
                        <td style={{ fontWeight: 'bold' }}>{item.room_no}</td>
                        <td>{item.capacity} students</td>
                        <td>{item.department?.code || 'SHARED'}</td>
                      </>
                    )}
                    {activeTab === 'laboratories' && (
                      <>
                        <td style={{ fontWeight: 'bold' }}>{item.lab_name}</td>
                        <td>{item.capacity} units</td>
                        <td>{item.department?.code || 'SHARED'}</td>
                      </>
                    )}
                    {activeTab === 'time_slots' && (
                      <>
                        <td style={{ fontWeight: 'bold' }}>{item.day}</td>
                        <td>{item.is_break ? 'BREAK' : `Period ${item.period_no}`}</td>
                        <td>{item.start_time} - {item.end_time}</td>
                        <td>
                          <span className={`badge ${item.is_break ? 'badge-warning' : 'badge-success'}`}>
                            {item.is_break ? (item.break_name || 'Break') : 'TEACHING'}
                          </span>
                        </td>
                      </>
                    )}

                    {/* Actions Column */}
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {activeTab === 'academic_years' && !item.is_active && user.role !== 'faculty' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--success)' }}
                            onClick={() => handleActivateAY(item.id)}
                          >
                            Activate
                          </button>
                        )}
                        {activeTab === 'faculties' && user.role !== 'faculty' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(item)}
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {user.role !== 'faculty' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteConfirm(item)}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2rem' }}>
                    No academic records defined in database for this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Dialog Form */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Edit Entry Parameters' : `Add New ${activeTab.replace('_', ' ').toUpperCase()}`}
              </h3>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.25rem 0.5rem', border: 'none' }}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {activeTab === 'departments' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Department Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Computer Science & Engineering"
                        required
                        value={formFields.name || ''}
                        onChange={e => setFormFields({ ...formFields, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Dept Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. CSE"
                        required
                        value={formFields.code || ''}
                        onChange={e => setFormFields({ ...formFields, code: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {activeTab === 'academic_years' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Academic Year Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 2026-2027"
                        required
                        value={formFields.name || ''}
                        onChange={e => setFormFields({ ...formFields, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Set Active on Save?</label>
                      <select
                        className="form-control"
                        value={formFields.is_active || 'false'}
                        onChange={e => setFormFields({ ...formFields, is_active: e.target.value })}
                      >
                        <option value="false">No (Inactive)</option>
                        <option value="true">Yes (Active)</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'semesters' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Academic Year</label>
                      <select
                        className="form-control"
                        required
                        value={formFields.academic_year_id || ''}
                        onChange={e => setFormFields({ ...formFields, academic_year_id: e.target.value })}
                      >
                        <option value="">Select Academic Year</option>
                        {academicYears.map(ay => (
                          <option key={ay.id} value={ay.id}>{ay.name} {ay.is_active ? '(Active)' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semester Number</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="form-control"
                        placeholder="e.g. 5"
                        required
                        value={formFields.semester_number || ''}
                        onChange={e => setFormFields({ ...formFields, semester_number: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Curriculum Regulation</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. R2025"
                        required
                        value={formFields.regulation || ''}
                        onChange={e => setFormFields({ ...formFields, regulation: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {activeTab === 'sections' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Section Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. A"
                        required
                        value={formFields.name || ''}
                        onChange={e => setFormFields({ ...formFields, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select
                        className="form-control"
                        required
                        value={formFields.department_id || ''}
                        onChange={e => setFormFields({ ...formFields, department_id: e.target.value })}
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <select
                        className="form-control"
                        required
                        value={formFields.semester_id || ''}
                        onChange={e => setFormFields({ ...formFields, semester_id: e.target.value })}
                      >
                        <option value="">Select Semester</option>
                        {semesters.map(s => (
                          <option key={s.id} value={s.id}>Sem {s.semester_number} - {s.regulation} ({s.academic_year?.name})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'subjects' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Subject Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. CS501"
                        required
                        value={formFields.code || ''}
                        onChange={e => setFormFields({ ...formFields, code: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject Title Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Database Management Systems"
                        required
                        value={formFields.name || ''}
                        onChange={e => setFormFields({ ...formFields, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select
                        className="form-control"
                        required
                        value={formFields.department_id || ''}
                        onChange={e => setFormFields({ ...formFields, department_id: e.target.value })}
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <select
                        className="form-control"
                        required
                        value={formFields.semester_id || ''}
                        onChange={e => setFormFields({ ...formFields, semester_id: e.target.value })}
                      >
                        <option value="">Select Semester</option>
                        {semesters.map(s => (
                          <option key={s.id} value={s.id}>Sem {s.semester_number} ({s.regulation})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weekly Hours</label>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        className="form-control"
                        required
                        value={formFields.weekly_hours || ''}
                        onChange={e => setFormFields({ ...formFields, weekly_hours: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Is Laboratory / Practical?</label>
                      <select
                        className="form-control"
                        value={formFields.is_lab || 'false'}
                        onChange={e => setFormFields({ ...formFields, is_lab: e.target.value })}
                      >
                        <option value="false">No (Theory Lecture)</option>
                        <option value="true">Yes (Laboratory Session)</option>
                      </select>
                    </div>
                    {formFields.is_lab === 'true' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Lab Session Duration (Contiguous Periods)</label>
                          <input
                            type="number"
                            min="2"
                            max="4"
                            className="form-control"
                            value={formFields.lab_duration || 3}
                            onChange={e => setFormFields({ ...formFields, lab_duration: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Prefer Afternoon Slots (Period 5-7)?</label>
                          <select
                            className="form-control"
                            value={formFields.preferred_afternoon || 'true'}
                            onChange={e => setFormFields({ ...formFields, preferred_afternoon: e.target.value })}
                          >
                            <option value="false">No Preference</option>
                            <option value="true">Yes (Highly Preferred)</option>
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}

                {activeTab === 'faculties' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Faculty Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Dr. Rajesh Raman"
                        required
                        value={formFields.name || ''}
                        onChange={e => setFormFields({ ...formFields, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teacher Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. TCS01"
                        required
                        disabled={!!editingItem}
                        value={formFields.code || ''}
                        onChange={e => setFormFields({ ...formFields, code: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. rajesh@college.edu"
                        required
                        value={formFields.email || ''}
                        onChange={e => setFormFields({ ...formFields, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select
                        className="form-control"
                        required
                        value={formFields.department_id || ''}
                        onChange={e => setFormFields({ ...formFields, department_id: e.target.value })}
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Weekly Workload (Hours)</label>
                      <input
                        type="number"
                        min="2"
                        max="24"
                        className="form-control"
                        value={formFields.max_workload || 16}
                        onChange={e => setFormFields({ ...formFields, max_workload: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Linked User Account (Optional)</label>
                      <select
                        className="form-control"
                        value={formFields.user_id || ''}
                        onChange={e => setFormFields({ ...formFields, user_id: e.target.value })}
                      >
                        <option value="">No Linked Account</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.username} ({u.role.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'classrooms' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Room Number / ID</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. LH-101"
                        required
                        value={formFields.room_no || ''}
                        onChange={e => setFormFields({ ...formFields, room_no: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Seating Capacity</label>
                      <input
                        type="number"
                        min="10"
                        max="120"
                        className="form-control"
                        required
                        value={formFields.capacity || ''}
                        onChange={e => setFormFields({ ...formFields, capacity: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department Dedicated (Optional)</label>
                      <select
                        className="form-control"
                        value={formFields.department_id || ''}
                        onChange={e => setFormFields({ ...formFields, department_id: e.target.value })}
                      >
                        <option value="">Shared (Available to all)</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'laboratories' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Laboratory Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. CSE-LAB-1"
                        required
                        value={formFields.lab_name || ''}
                        onChange={e => setFormFields({ ...formFields, lab_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Student Capacity / Terminals</label>
                      <input
                        type="number"
                        min="10"
                        max="100"
                        className="form-control"
                        required
                        value={formFields.capacity || ''}
                        onChange={e => setFormFields({ ...formFields, capacity: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department Dedicated (Optional)</label>
                      <select
                        className="form-control"
                        value={formFields.department_id || ''}
                        onChange={e => setFormFields({ ...formFields, department_id: e.target.value })}
                      >
                        <option value="">Shared (Available to all)</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'time_slots' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Day of Week</label>
                      <select
                        className="form-control"
                        required
                        value={formFields.day || ''}
                        onChange={e => setFormFields({ ...formFields, day: e.target.value })}
                      >
                        <option value="">Select Day</option>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Is recess/break?</label>
                      <select
                        className="form-control"
                        value={formFields.is_break || 'false'}
                        onChange={e => setFormFields({ ...formFields, is_break: e.target.value })}
                      >
                        <option value="false">No (Teaching Period)</option>
                        <option value="true">Yes (Recess/Break)</option>
                      </select>
                    </div>
                    {formFields.is_break === 'true' ? (
                      <div className="form-group">
                        <label className="form-label">Break Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Lunch or Morning Break"
                          required
                          value={formFields.break_name || ''}
                          onChange={e => setFormFields({ ...formFields, break_name: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div className="form-group">
                        <label className="form-label">Period Number</label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          className="form-control"
                          required
                          value={formFields.period_no || ''}
                          onChange={e => setFormFields({ ...formFields, period_no: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 08:45"
                        required
                        value={formFields.start_time || ''}
                        onChange={e => setFormFields({ ...formFields, start_time: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 09:40"
                        required
                        value={formFields.end_time || ''}
                        onChange={e => setFormFields({ ...formFields, end_time: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.25rem 0.5rem', border: 'none' }}
                onClick={() => setDeleteConfirm(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Are you sure you want to delete this resource?
              </p>
              <div style={{ background: 'var(--accent-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-border)', marginBottom: '1rem' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {getItemDisplayName(deleteConfirm)}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Warning: Deleting this item will cascade delete any linked records (e.g. sections, subjects, or mappings) or set reference columns to null. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={executeDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterData;
