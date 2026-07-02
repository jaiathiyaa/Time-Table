import { useState, useEffect } from 'react';

function Dashboard({ authFetch, showToast, user }) {
  const [stats, setStats] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [facultyData, setFacultyData] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [noLinkedProfile, setNoLinkedProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setNoLinkedProfile(false);
    try {
      if (user.role === 'faculty') {
        const facData = await authFetch('/analytics/faculty/me');
        setFacultyData(facData);
        const slotsData = await authFetch('/master/time_slots');
        setTimeSlots(slotsData);
      } else {
        const statsData = await authFetch('/analytics/stats');
        const utilData = await authFetch('/analytics/utilization');
        const logsData = await authFetch('/timetable/audit-logs');
        
        setStats(statsData);
        setUtilization(utilData);
        setAuditLogs(logsData.slice(0, 10)); // Top 10 logs
      }
    } catch (error) {
      if (user.role === 'faculty' && error.message.includes('No Faculty profile')) {
        setNoLinkedProfile(true);
      } else {
        showToast(error.message || 'Failed to load dashboard statistics', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="solver-loading-overlay" style={{ marginTop: '2rem' }}>
        <div className="spinner"></div>
        <p>Analyzing system resources and computing dashboard stats...</p>
      </div>
    );
  }

  if (user.role === 'faculty') {
    if (noLinkedProfile) {
      return (
        <div style={{
          padding: '3rem',
          maxWidth: '600px',
          margin: '4rem auto',
          textAlign: 'center',
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>No Linked Faculty Profile</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Your user account (<strong>{user.username}</strong>) has not been associated with a Faculty profile yet.
          </p>
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            textAlign: 'left',
            marginBottom: '2rem'
          }}>
            <strong>Why is this happening?</strong><br />
            An administrator must link your user account under <em>Master Data &gt; Faculty Profiles &gt; Edit</em> before you can access your personal teaching timetable and schedule metrics.
          </div>
          <button className="btn btn-primary" onClick={fetchDashboardData}>
            🔄 Check Again
          </button>
        </div>
      );
    }

    if (!facultyData) {
      return (
        <div className="solver-loading-overlay" style={{ marginTop: '2rem' }}>
          <div className="spinner"></div>
          <p>Loading your personal teaching profile and timetable...</p>
        </div>
      );
    }

    const { faculty_profile, workload, subjects, timetable, colleagues } = facultyData;

    // Time-slot mapping helpers
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
      const matchedCell = timetable.find(c => 
        c.day === day && 
        c.period_no === slotStructureItem.period_no &&
        !slotStructureItem.is_break
      );
      return matchedCell || null;
    };

    const workloadPercentage = Math.min(100, (workload.allocated_hours / workload.max_workload) * 100);
    const progressColor = workload.status === 'overloaded' ? 'var(--danger)' : (workload.status === 'underloaded' ? 'var(--warning)' : 'var(--success)');

    return (
      <div className="staff-dashboard">
        {/* Welcome Greeting Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            right: '-50px',
            bottom: '-50px',
            fontSize: '12rem',
            opacity: 0.1,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            🎓
          </div>
          <span style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Faculty Portal
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            Welcome back, {faculty_profile.name}!
          </h1>
          <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
            Code: <strong>{faculty_profile.code}</strong> | Department of {faculty_profile.department_name} ({faculty_profile.department_code})
          </p>
        </div>

        {/* Dashboard Stats Row */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-info">
              <span className="kpi-label">Weekly Workload</span>
              <span className="kpi-value">{workload.allocated_hours} / {workload.max_workload} hrs</span>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                <div style={{ width: `${workloadPercentage}%`, height: '100%', backgroundColor: progressColor, borderRadius: '3px' }}></div>
              </div>
            </div>
            <div className="kpi-icon" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-info">
              <span className="kpi-label">Workload Status</span>
              <span className="kpi-value" style={{ color: progressColor, textTransform: 'capitalize' }}>
                {workload.status}
              </span>
            </div>
            <div className="kpi-icon" style={{ 
              backgroundColor: workload.status === 'optimal' ? 'var(--success-bg)' : 'var(--warning-bg)', 
              color: progressColor 
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-info">
              <span className="kpi-label">Teaching Subjects</span>
              <span className="kpi-value">
                {subjects.length} Subjects
              </span>
            </div>
            <div className="kpi-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </div>
          </div>
        </div>

        {/* Timetable Grid */}
        <div style={{ marginTop: '2rem' }}>
          <div className="table-toolbar">
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>📅 My Weekly Schedule Matrix</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Conflict-free teaching hours</span>
          </div>

          <div className="timetable-grid-wrapper">
            {mondaySlots.length > 0 ? (
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
                        if (slotStruct.is_break) {
                          return (
                            <td key={colIdx} className="break-cell">
                              {slotStruct.break_name}
                            </td>
                          );
                        }

                        const cell = getCellForSlot(day, slotStruct);

                        return (
                          <td key={colIdx}>
                            {cell ? (
                              <div className="timetable-cell-inner" style={{ padding: '0.25rem 0' }}>
                                <div className="cell-subject" title={cell.subject_name}>
                                  {cell.subject_code}
                                </div>
                                <div className="cell-faculty" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                                  Sec: {cell.section_name}
                                </div>
                                <div className="cell-room">
                                  📍 {cell.room_no || 'No Room'}
                                </div>
                                {cell.is_lab && (
                                  <span className="badge badge-info" style={{ fontSize: '0.65rem', marginTop: '2px', display: 'inline-block' }}>
                                    LAB
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="cell-empty-state" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                -
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
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Loading time slot parameters...
              </div>
            )}
          </div>
        </div>

        {/* Mapped Subjects and Department Directory */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          
          {/* Mapped Subjects Card */}
          <div className="table-container" style={{ margin: 0, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>📚 Assigned Subjects</h3>
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>Hours</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length > 0 ? (
                  subjects.map((sub, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold' }}>{sub.subject_code}</td>
                      <td>{sub.subject_name}</td>
                      <td>Sem {sub.semester_no} - {sub.section_name}</td>
                      <td>{sub.hours_allocated} hrs/week</td>
                      <td>
                        <span className={`badge ${sub.is_lab ? 'badge-info' : 'badge-accent'}`}>
                          {sub.is_lab ? 'LAB' : 'THEORY'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No subjects mapped yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Department Directory Card */}
          <div className="table-container" style={{ margin: 0, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>👥 Department Colleagues</h3>
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Workload</th>
                </tr>
              </thead>
              <tbody>
                {colleagues.length > 0 ? (
                  colleagues.map((col, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold' }}>{col.code}</td>
                      <td>{col.name}</td>
                      <td>{col.email}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{col.allocated_hours} / {col.max_workload} hrs</span>
                          <span className={`badge ${col.allocated_hours > col.max_workload ? 'badge-danger' : 'badge-success'}`} style={{ width: '8px', height: '8px', borderRadius: '50%', padding: 0 }}></span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No department colleagues listed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    );
  }

  // Calculate percentages for custom SVG drawing
  const totalFaculty = stats?.faculty_workload_stats?.total || 1;
  const optPct = ((stats?.faculty_workload_stats?.optimal || 0) / totalFaculty) * 100;
  const overPct = ((stats?.faculty_workload_stats?.overloaded || 0) / totalFaculty) * 100;
  const underPct = ((stats?.faculty_workload_stats?.underloaded || 0) / totalFaculty) * 100;

  return (
    <div>
      {/* Metrics Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Active Timetables</span>
            <span className="kpi-value">{stats?.counters?.active_schedules}</span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Total Faculty</span>
            <span className="kpi-value">{stats?.counters?.faculty}</span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Lecture Rooms / Labs</span>
            <span className="kpi-value">
              {stats?.counters?.classrooms} / {stats?.counters?.laboratories}
            </span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Active Conflicts</span>
            <span className="kpi-value" style={{ color: stats?.conflicts?.total_conflicts > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {stats?.conflicts?.total_conflicts}
            </span>
          </div>
          <div className="kpi-icon" style={{ 
            backgroundColor: stats?.conflicts?.total_conflicts > 0 ? 'var(--danger-bg)' : 'var(--success-bg)', 
            color: stats?.conflicts?.total_conflicts > 0 ? 'var(--danger)' : 'var(--success)' 
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
        </div>
      </div>

      {/* Conflict details summary if any exist */}
      {stats?.conflicts?.total_conflicts > 0 && (
        <div style={{
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.9rem'
        }}>
          <span style={{ color: 'var(--danger)', fontSize: '1.25rem', fontWeight: 'bold' }}>⚠️ Clashes Detected:</span>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-primary)' }}>
            <span>👤 Faculty Clashes: <strong>{stats.conflicts.faculty_clashes}</strong></span>
            <span>🏫 Room Clashes: <strong>{stats.conflicts.room_clashes}</strong></span>
            <span>🔬 Lab Clashes: <strong>{stats.conflicts.lab_clashes}</strong></span>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Please use Timetable Grid to manually override cell conflicts.
          </span>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Resource Utilization (Custom Bar Chart) */}
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Classrooms & Labs Weekly Utilization Rate (%)</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>Refresh</button>
          </div>

          <div className="svg-chart-container">
            {/* Draw a beautiful custom SVG bar chart */}
            <svg viewBox="0 0 600 280" className="svg-chart" style={{ width: '100%', height: '100%' }}>
              {/* Grid Lines */}
              <line x1="50" y1="50" x2="550" y2="50" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />
              <text x="35" y="54" textAnchor="end">100%</text>
              <line x1="50" y1="100" x2="550" y2="100" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />
              <text x="35" y="104" textAnchor="end">75%</text>
              <line x1="50" y1="150" x2="550" y2="150" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />
              <text x="35" y="154" textAnchor="end">50%</text>
              <line x1="50" y1="200" x2="550" y2="200" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="4" />
              <text x="35" y="204" textAnchor="end">25%</text>
              <line x1="50" y1="240" x2="550" y2="240" stroke="var(--border-color)" strokeWidth="1" />
              <text x="35" y="244" textAnchor="end">0%</text>

              {/* Draw Bars for rooms/labs */}
              {(() => {
                const rooms = utilization?.classrooms || [];
                const labs = utilization?.laboratories || [];
                const items = [...rooms.slice(0, 5), ...labs.slice(0, 5)];
                if (items.length === 0) {
                  return <text x="300" y="140" textAnchor="middle" style={{fontStyle: 'italic'}}>No master rooms data available</text>;
                }
                const barSpacing = Math.min(50, 480 / items.length);
                const barWidth = barSpacing * 0.6;
                return items.map((item, idx) => {
                  const isLab = 'lab_name' in item || !('room_no' in item);
                  const name = item.name;
                  const rate = item.utilization_rate;
                  // Max height from 240 to 50 = 190px representing 100%
                  const barHeight = (rate / 100) * 190;
                  const x = 70 + idx * barSpacing;
                  const y = 240 - barHeight;
                  return (
                    <g key={idx}>
                      {/* Hover effect bar bg */}
                      <rect 
                        x={x} 
                        y={50} 
                        width={barWidth} 
                        height={190} 
                        fill="transparent" 
                        style={{ cursor: 'pointer' }}
                        title={`${name}: ${rate}% utilization`}
                      />
                      {/* The bar */}
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={barHeight} 
                        fill={isLab ? 'var(--info)' : 'var(--accent)'} 
                        rx="3"
                      />
                      {/* Rate label text */}
                      {rate > 5 && (
                        <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" style={{ fill: 'var(--text-primary)', fontSize: '9px', fontWeight: 'bold' }}>
                          {rate}%
                        </text>
                      )}
                      {/* X Axis Name */}
                      <text x={x + barWidth / 2} y={258} textAnchor="middle" style={{ fontSize: '9px', fontWeight: '500' }}>
                        {name.length > 8 ? name.substring(0, 7) + '..' : name}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'var(--accent)' }}></span>
              <span>Theory Classroom</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'var(--info)' }}></span>
              <span>Practical Laboratory</span>
            </div>
          </div>
        </div>

        {/* Faculty Workload Pie Stats */}
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Faculty Workload Stats</h3>
          </div>
          
          <div className="svg-chart-container" style={{ height: '220px' }}>
            <svg viewBox="0 0 200 200" className="svg-chart" style={{ width: '150px', height: '150px' }}>
              {/* Custom Donut Chart */}
              {totalFaculty > 0 ? (
                <>
                  {/* Let's construct a stacked circle donut indicator for simplicity and neat aesthetics */}
                  {/* Or we can draw a direct SVG donut path */}
                  <circle cx="100" cy="100" r="70" fill="none" stroke="var(--border-color)" strokeWidth="12" />
                  
                  {/* 1. Optimal */}
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="70" 
                    fill="none" 
                    stroke="var(--success)" 
                    strokeWidth="14" 
                    strokeDasharray={`${(optPct / 100) * 440} 440`}
                    transform="rotate(-90 100 100)"
                    strokeLinecap="round"
                  />
                  {/* 2. Overloaded */}
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="70" 
                    fill="none" 
                    stroke="var(--danger)" 
                    strokeWidth="14" 
                    strokeDasharray={`${(overPct / 100) * 440} 440`}
                    transform={`rotate(${((optPct) / 100) * 360 - 90} 100 100)`}
                    strokeLinecap="round"
                  />
                  {/* Center Text */}
                  <text x="100" y="95" textAnchor="middle" style={{ fontSize: '24px', fontWeight: '800', fill: 'var(--text-primary)' }}>
                    {stats?.faculty_workload_stats?.total}
                  </text>
                  <text x="100" y="115" textAnchor="middle" style={{ fontSize: '10px', fill: 'var(--text-secondary)' }}>
                    Total Faculty
                  </text>
                </>
              ) : (
                <text x="100" y="100" textAnchor="middle">No faculty data</text>
              )}
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--success)' }}></span>
                <span>Optimal (6 - 16 hrs)</span>
              </div>
              <strong style={{ color: 'var(--text-primary)' }}>{stats?.faculty_workload_stats?.optimal} ({Math.round(optPct)}%)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--danger)' }}></span>
                <span>Overloaded (&gt; 16 hrs)</span>
              </div>
              <strong style={{ color: 'var(--text-primary)' }}>{stats?.faculty_workload_stats?.overloaded} ({Math.round(overPct)}%)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--warning)' }}></span>
                <span>Underloaded (&lt; 6 hrs)</span>
              </div>
              <strong style={{ color: 'var(--text-primary)' }}>{stats?.faculty_workload_stats?.underloaded} ({Math.round(underPct)}%)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Recent System Events & Audit Logs</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Showing last 10 entries</span>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Triggered By</th>
              <th>Action Event</th>
              <th>Details / Scope</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-accent">
                      {log.user?.username || 'System Seed'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    <span style={{
                      color: log.action.includes('FAIL') ? 'var(--danger)' : 
                             log.action.includes('GENERATE') ? 'var(--accent)' : 'var(--text-primary)'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No system logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
