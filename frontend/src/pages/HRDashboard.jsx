import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');

const TABS = ['overview', 'employees', 'leaves', 'attendance', 'announcements'];

const EMPTY_EMP_FORM = {
  name: '', email: '', password: '', role: 'employee',
  department: '', designation: '', phone: '', address: '', managerId: '',
};

const EMPTY_ANN_FORM = { title: '', content: '', targetRole: 'all', priority: 'Medium', isPinned: false };

/* ─── Component ────────────────────────────────────────────── */
const HRDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Data state
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]); // for manager dropdown

  // Search/filter
  const [empSearch, setEmpSearch] = useState('');
  const [attFilter, setAttFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), department: '' });

  // Employee modal
  const [empModal, setEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empForm, setEmpForm] = useState(EMPTY_EMP_FORM);
  const [empSaving, setEmpSaving] = useState(false);

  // Announcement form
  const [annForm, setAnnForm] = useState(EMPTY_ANN_FORM);
  const [annSaving, setAnnSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, leavesRes, attRes, annRes] = await Promise.all([
        axiosClient.get('/employees'),
        axiosClient.get('/leaves'),
        axiosClient.get('/attendance'),
        axiosClient.get('/announcements'),
      ]);
      setEmployees(empRes.data);
      setLeaves(leavesRes.data);
      setAttendance(attRes.data);
      setAnnouncements(annRes.data);
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /* ── Leave actions ── */
  const handleLeaveStatus = async (id, status) => {
    try {
      await axiosClient.put(`/leaves/${id}/status`, { status });
      showToast(`✅ Leave ${status.toLowerCase()}`);
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Action failed'}`);
    }
  };

  /* ── Employee CRUD ── */
  const openAddEmp = () => { setEditingEmp(null); setEmpForm(EMPTY_EMP_FORM); setEmpModal(true); };
  const openEditEmp = (emp) => {
    setEditingEmp(emp);
    setEmpForm({
      name: emp.user?.name || '', email: emp.user?.email || '',
      password: '', role: emp.user?.role || 'employee',
      department: emp.department || '', designation: emp.designation || '',
      phone: emp.phone || '', address: emp.address || '',
      managerId: emp.managerId?._id || '',
    });
    setEmpModal(true);
  };

  const handleEmpSave = async (e) => {
    e.preventDefault();
    setEmpSaving(true);
    try {
      if (editingEmp) {
        await axiosClient.put(`/employees/${editingEmp._id}`, empForm);
        showToast('✅ Employee updated');
      } else {
        // First create the user account, then employee profile
        const userRes = await axiosClient.post('/auth/register', {
          name: empForm.name, email: empForm.email,
          password: empForm.password, role: empForm.role,
          department: empForm.department,
        });
        await axiosClient.post('/employees', {
          userId: userRes.data._id,
          department: empForm.department,
          designation: empForm.designation,
          phone: empForm.phone,
          address: empForm.address,
          managerId: empForm.managerId || undefined,
        });
        showToast('✅ Employee created');
      }
      setEmpModal(false);
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Save failed'}`);
    } finally {
      setEmpSaving(false);
    }
  };

  const handleDeleteEmp = async (id) => {
    if (!window.confirm('Deactivate this employee?')) return;
    try {
      await axiosClient.delete(`/employees/${id}`);
      showToast('✅ Employee removed');
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Delete failed'}`);
    }
  };

  /* ── Announcements ── */
  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    setAnnSaving(true);
    try {
      await axiosClient.post('/announcements', annForm);
      setAnnForm(EMPTY_ANN_FORM);
      showToast('✅ Announcement posted');
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Failed to post'}`);
    } finally {
      setAnnSaving(false);
    }
  };

  const handleDeleteAnn = async (id) => {
    try {
      await axiosClient.delete(`/announcements/${id}`);
      showToast('✅ Announcement deleted');
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Delete failed'}`);
    }
  };

  /* ── Filtered data ── */
  const filteredEmps = employees.filter((e) => {
    const s = empSearch.toLowerCase();
    return !s || e.user?.name?.toLowerCase().includes(s) ||
      e.user?.email?.toLowerCase().includes(s) ||
      e.department?.toLowerCase().includes(s) ||
      e.designation?.toLowerCase().includes(s);
  });

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="dashboard-page">
      <Navbar />
      <main className="dashboard-main">
        {/* Toast */}
        {toast && <div className="toast-msg">{toast}</div>}

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">HR Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user?.name} 👋</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary btn-sm" id="add-employee-btn" onClick={openAddEmp}>
              + Add Employee
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: '👥', value: employees.length, label: 'Total Employees', color: 'blue' },
            { icon: '⏳', value: pendingLeaves.length, label: 'Pending Leaves', color: 'yellow' },
            { icon: '✅', value: leaves.filter(l => l.status === 'Approved').length, label: 'Approved Leaves', color: 'green' },
            { icon: '📢', value: announcements.length, label: 'Announcements', color: 'purple' },
          ].map((s) => (
            <div key={s.label} className={`stat-card stat-card-${s.color}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-info">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} id={`hr-tab-${t}`} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── Overview Tab ─────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="two-col-grid">
            <div className="card">
              <h2 className="card-title">Pending Leave Requests</h2>
              {pendingLeaves.length === 0
                ? <p className="empty-state">🎉 No pending leaves</p>
                : pendingLeaves.slice(0, 5).map((l) => (
                  <div key={l._id} className="review-row">
                    <div className="review-info">
                      <span className="review-name">{l.employee?.name}</span>
                      <span className="badge badge-type">{l.leaveType}</span>
                      <span className="review-dates">{fmt(l.startDate)} – {fmt(l.endDate)}</span>
                    </div>
                    <div className="action-btns">
                      <button className="btn btn-success btn-sm" onClick={() => handleLeaveStatus(l._id, 'Approved')}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleLeaveStatus(l._id, 'Rejected')}>Reject</button>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="card">
              <h2 className="card-title">Recent Announcements</h2>
              <div className="announcements-list">
                {announcements.slice(0, 4).map((a) => (
                  <div key={a._id} className={`announcement-item ${a.isPinned ? 'pinned' : ''}`}>
                    <div className="announcement-header">
                      <h3 className="announcement-title">{a.title}</h3>
                      <span className={`priority-badge priority-${a.priority?.toLowerCase()}`}>{a.priority}</span>
                    </div>
                    <p className="announcement-content">{a.content}</p>
                  </div>
                ))}
                {announcements.length === 0 && <p className="empty-state">No announcements</p>}
              </div>
            </div>
          </div>
        )}

        {/* ─── Employees Tab ────────────────────────────────────── */}
        {activeTab === 'employees' && (
          <div className="card">
            <div className="card-header-row">
              <h2 className="card-title">Employee Directory</h2>
              <div className="search-row">
                <input
                  className="form-input search-input"
                  placeholder="🔍 Search name, email, dept..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  id="emp-search"
                />
                <button className="btn btn-primary btn-sm" onClick={openAddEmp} id="add-emp-table-btn">+ Add</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th><th>Department</th><th>Designation</th>
                    <th>Phone</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmps.map((emp) => (
                    <tr key={emp._id}>
                      <td>
                        <div className="emp-cell">
                          <div className="emp-avatar">{emp.user?.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="emp-name">{emp.user?.name}</div>
                            <div className="emp-email">{emp.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{emp.department}</td>
                      <td>{emp.designation}</td>
                      <td>{emp.phone || '—'}</td>
                      <td>
                        <span className={`status-badge ${emp.user?.isActive ? 'status-approved' : 'status-rejected'}`}>
                          {emp.user?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-outline btn-sm" onClick={() => openEditEmp(emp)} id={`edit-emp-${emp._id}`}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEmp(emp._id)} id={`del-emp-${emp._id}`}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEmps.length === 0 && <tr><td colSpan="6" className="empty-row">No employees found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Leaves Tab ───────────────────────────────────────── */}
        {activeTab === 'leaves' && (
          <div className="card">
            <h2 className="card-title">All Leave Requests</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th><th>Type</th><th>Start</th><th>End</th>
                    <th>Reason</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <div>
                          <div className="emp-name">{l.employee?.name}</div>
                          <div className="emp-email">{l.employee?.department}</div>
                        </div>
                      </td>
                      <td><span className="badge badge-type">{l.leaveType}</span></td>
                      <td>{fmt(l.startDate)}</td>
                      <td>{fmt(l.endDate)}</td>
                      <td className="reason-cell">{l.reason}</td>
                      <td><span className={`status-badge status-${l.status?.toLowerCase()}`}>{l.status}</span></td>
                      <td>
                        {l.status === 'Pending' && (
                          <div className="action-btns">
                            <button className="btn btn-success btn-sm" onClick={() => handleLeaveStatus(l._id, 'Approved')}>✓</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleLeaveStatus(l._id, 'Rejected')}>✗</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && <tr><td colSpan="7" className="empty-row">No leave requests</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Attendance Tab ───────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <div className="card">
            <div className="card-header-row">
              <h2 className="card-title">Company Attendance</h2>
              <div className="filter-row">
                <select className="form-input filter-select" value={attFilter.month}
                  onChange={(e) => setAttFilter({ ...attFilter, month: e.target.value })}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select className="form-input filter-select" value={attFilter.year}
                  onChange={(e) => setAttFilter({ ...attFilter, year: e.target.value })}>
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <input className="form-input filter-select" placeholder="Dept filter..."
                  value={attFilter.department}
                  onChange={(e) => setAttFilter({ ...attFilter, department: e.target.value })} />
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th><th>Department</th><th>Date</th>
                    <th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance
                    .filter((r) => {
                      if (attFilter.department && !r.employee?.department?.toLowerCase().includes(attFilter.department.toLowerCase())) return false;
                      if (attFilter.month && attFilter.year) {
                        const recMonth = new Date(r.date).getMonth() + 1;
                        const recYear = new Date(r.date).getFullYear();
                        return recMonth === Number(attFilter.month) && recYear === Number(attFilter.year);
                      }
                      return true;
                    })
                    .map((r) => (
                      <tr key={r._id}>
                        <td>{r.employee?.name}</td>
                        <td>{r.employee?.department}</td>
                        <td>{r.date}</td>
                        <td>{fmtTime(r.checkIn)}</td>
                        <td>{fmtTime(r.checkOut)}</td>
                        <td>{r.hoursWorked > 0 ? `${r.hoursWorked}h` : '—'}</td>
                        <td><span className={`status-badge status-${r.status?.toLowerCase().replace(' ', '-')}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  {attendance.length === 0 && <tr><td colSpan="7" className="empty-row">No records</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Announcements Tab ────────────────────────────────── */}
        {activeTab === 'announcements' && (
          <div className="two-col-grid">
            <div className="card">
              <h2 className="card-title">Create Announcement</h2>
              <form onSubmit={handleAnnSubmit} className="form-stack" id="announcement-form">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={annForm.title} required
                    onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                    placeholder="Announcement title" />
                </div>
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea className="form-input form-textarea" rows={4} required
                    value={annForm.content}
                    onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                    placeholder="Write your announcement..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Audience</label>
                    <select className="form-input" value={annForm.targetRole}
                      onChange={(e) => setAnnForm({ ...annForm, targetRole: e.target.value })}>
                      <option value="all">All Staff</option>
                      <option value="employee">Employees Only</option>
                      <option value="manager">Managers Only</option>
                      <option value="hr">HR Only</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={annForm.priority}
                      onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <label className="checkbox-label">
                  <input type="checkbox" checked={annForm.isPinned}
                    onChange={(e) => setAnnForm({ ...annForm, isPinned: e.target.checked })} />
                  <span>Pin announcement</span>
                </label>
                <button type="submit" className="btn btn-primary" disabled={annSaving} id="create-announcement-btn">
                  {annSaving ? <span className="btn-spinner" /> : 'Post Announcement'}
                </button>
              </form>
            </div>
            <div className="card">
              <h2 className="card-title">Published Announcements</h2>
              <div className="announcements-list">
                {announcements.map((a) => (
                  <div key={a._id} className={`announcement-item ${a.isPinned ? 'pinned' : ''}`}>
                    <div className="announcement-header">
                      <h3 className="announcement-title">{a.title}</h3>
                      <button className="btn-icon btn-danger-icon" onClick={() => handleDeleteAnn(a._id)} title="Delete">🗑️</button>
                    </div>
                    <p className="announcement-content">{a.content}</p>
                    <div className="announcement-meta">
                      <span className="badge badge-type">{a.targetRole}</span>
                      <span className={`priority-badge priority-${a.priority?.toLowerCase()}`}>{a.priority}</span>
                      <span className="meta-date">{fmt(a.createdAt)}</span>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && <p className="empty-state">No announcements yet</p>}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Employee Add/Edit Modal ──────────────────────────── */}
      {empModal && (
        <div className="modal-overlay" onClick={() => setEmpModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingEmp ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="btn-icon" onClick={() => setEmpModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEmpSave} className="form-stack" id="emp-modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" required value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    placeholder="Jane Smith" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" required value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    placeholder="jane@company.com" />
                </div>
              </div>
              {!editingEmp && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-input" required={!editingEmp} value={empForm.password}
                      onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                      placeholder="Min 6 characters" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={empForm.role}
                      onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" required value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                    placeholder="Engineering" />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-input" required value={empForm.designation}
                    onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                    placeholder="Senior Developer" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    placeholder="+1 555 000 0000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={empForm.address}
                    onChange={(e) => setEmpForm({ ...empForm, address: e.target.value })}
                    placeholder="123 Main St" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEmpModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={empSaving} id="save-emp-btn">
                  {empSaving ? <span className="btn-spinner" /> : (editingEmp ? 'Update' : 'Create Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
