import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import MasterData from './components/MasterData';
import WorkloadMapping from './components/WorkloadMapping';
import TimetableManager from './components/TimetableManager';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [toasts, setToasts] = useState([]);
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // default registration role
  const [authLoading, setAuthLoading] = useState(false);

  // Apply theme class to document body
  useEffect(() => {
    const bodyClassList = document.body.classList;
    if (theme === 'light') {
      bodyClassList.add('light-theme');
    } else {
      bodyClassList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch current user details on load/token change
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    
    fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.status === 401) {
        // Token expired or invalid
        handleLogout();
        throw new Error('Session expired');
      }
      return res.json();
    })
    .then(data => {
      setUser(data);
    })
    .catch(err => {
      console.error('Error fetching profile:', err);
    });
  }, [token]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    showToast('Logged out successfully', 'success');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isLogin) {
        // Login Request
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Login failed');
        }

        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        showToast('Welcome back!', 'success');
        // Clear inputs
        setUsername('');
        setPassword('');
      } else {
        // Register Request
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            email,
            password,
            role
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed');
        }

        showToast('Registration successful! Please login.', 'success');
        setIsLogin(true);
        // Keep username, clear password
        setPassword('');
      }
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setAuthLoading(false);
    }
  };

  // Helper method for authenticated fetch calls
  const authFetch = async (endpoint, options = {}) => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    
    if (response.status === 401) {
      handleLogout();
      throw new Error('Unauthorized - please log in again.');
    }
    
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { text };
    }
    
    if (!response.ok) {
      throw new Error(data.detail || `Request failed with status ${response.status}`);
    }
    return data;
  };

  // If not logged in, render Auth Screen
  if (!token || !user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h2 className="auth-title">AI Timetable Planner</h2>
            <p className="auth-subtitle">
              {isLogin ? 'Sign in to manage Engineering College timetables' : 'Register a new administrator account'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter username"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@college.edu"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">System Role</label>
                <select
                  className="form-control"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="hod">HOD</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={authLoading}>
              {authLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register Account')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? "Need a new account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '600', cursor: 'pointer' }}
            >
              {isLogin ? 'Register Here' : 'Log In Here'}
            </button>
          </div>
          
          {isLogin && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              <strong>Demo Credentials:</strong><br />
              Username: <code style={{color: 'var(--text-primary)'}}>admin</code> | Password: <code style={{color: 'var(--text-primary)'}}>admin123</code>
            </div>
          )}
        </div>

        {/* Toast Container inside auth */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render main layout ERP shell if logged in
  return (
    <div className="erp-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none"></rect>
              <path d="M21 9H3M21 15H3M12 3v18"></path>
            </svg>
          </div>
          <span className="brand-name">College Timetable</span>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`sidebar-link ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
              <rect x="3" y="3" width="7" height="9" rx="1"></rect>
              <rect x="14" y="3" width="7" height="5" rx="1"></rect>
              <rect x="14" y="12" width="7" height="9" rx="1"></rect>
              <rect x="3" y="16" width="7" height="5" rx="1"></rect>
            </svg>
            Dashboard
          </button>
          
          <button 
            className={`sidebar-link ${currentTab === 'master' ? 'active' : ''}`}
            onClick={() => setCurrentTab('master')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Master Data
          </button>

          <button 
            className={`sidebar-link ${currentTab === 'workload' ? 'active' : ''}`}
            onClick={() => setCurrentTab('workload')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Faculty Workload
          </button>

          <button 
            className={`sidebar-link ${currentTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setCurrentTab('timetable')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
            </svg>
            Timetable Grid
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{user.role.replace('_', ' ')}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ flex: 1, padding: '0.25rem' }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle Theme"
            >
              {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
            </button>
            <button 
              className="btn btn-danger btn-sm" 
              style={{ flex: 1, padding: '0.25rem' }}
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-panel">
        <header className="header">
          <div className="header-title-container">
            <h1 className="header-title">
              {currentTab === 'dashboard' && 'Dashboard Overview'}
              {currentTab === 'master' && 'Academic Resource Master'}
              {currentTab === 'workload' && 'Faculty Workload Mapping'}
              {currentTab === 'timetable' && 'Interactive Timetable Matrix'}
            </h1>
            <span className="header-subtitle">
              {currentTab === 'dashboard' && 'Resource utilization stats and conflict analysis'}
              {currentTab === 'master' && 'CRUD configurations for rooms, departments, subjects'}
              {currentTab === 'workload' && 'Allocate subjects and manage faculty work hour capacities'}
              {currentTab === 'timetable' && 'Automated OR-Tools generation and manual override scheduler'}
            </span>
          </div>

          <div className="header-actions">
            <span className="badge badge-accent" style={{fontSize: '0.8rem', padding: '0.4rem 0.8rem'}}>
              Role: {user.role.toUpperCase()}
            </span>
          </div>
        </header>

        {/* Content Body */}
        <div className="content-body">
          {currentTab === 'dashboard' && (
            <Dashboard authFetch={authFetch} showToast={showToast} user={user} />
          )}
          {currentTab === 'master' && (
            <MasterData authFetch={authFetch} showToast={showToast} user={user} />
          )}
          {currentTab === 'workload' && (
            <WorkloadMapping authFetch={authFetch} showToast={showToast} user={user} />
          )}
          {currentTab === 'timetable' && (
            <TimetableManager authFetch={authFetch} showToast={showToast} user={user} />
          )}
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
