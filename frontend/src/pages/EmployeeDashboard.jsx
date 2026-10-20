import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
const todayStr = () => new Date().toISOString().split('T')[0];

const TABS = ['overview', 'attendance', 'apply-leave', 'my-leaves', 'profile', 'announcements'];

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Data
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [profile, setProfile] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);

  // Leave form
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'Sick', startDate: '', endDate: '', reason: '' });
  const [leaveSaving, setLeaveSaving] = useState(false);

  // Profile edit form
  const [profileForm, setProfileForm] = useState({ phone: '', address: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileEdit, setProfileEdit] = useState(false);

  // Attendance actions
  const [attLoading, setAttLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [leavesRes, attRes, annRes, profileRes] = await Promise.all([
        axiosClient.get('/leaves/my'),
        axiosClient.get('/attendance/my'),
        axiosClient.get('/announcements'),
        axiosClient.get('/employees/me').catch(() => ({ data: null })),
      ]);
      setLeaves(leavesRes.data);
      setAttendance(attRes.data);
      setAnnouncements(annRes.data);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setProfileForm({ phone: profileRes.data.phone || '', address: profileRes.data.address || '' });
      }

      // Find today's record
      const today = todayStr();
      const rec = attRes.data.find((r) => r.date === today);
      setTodayAttendance(rec || null);
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /* ── Attendance ── */
  const handleCheckIn = async () => {
    setAttLoading(true);
    try {
      await axiosClient.post('/attendance/checkin');
      showToast('✅ Checked in successfully!');
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Check-in failed'}`);
    } finally {
      setAttLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setAttLoading(true);
    try {
      await axiosClient.put('/attendance/checkout');
      showToast('✅ Checked out successfully!');
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Check-out failed'}`);
    } finally {
      setAttLoading(false);
    }
  };

  /* ── Leave ── */
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveSaving(true);
    try {
      await axiosClient.post('/leaves', leaveForm);
      setLeaveForm({ leaveType: 'Sick', startDate: '', endDate: '', reason: '' });
      showToast('✅ Leave request submitted!');
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Submission failed'}`);
    } finally {
      setLeaveSaving(false);
    }
  };

  const handleDeleteLeave = async (id) => {
    try {
      await axiosClient.delete(`/leaves/${id}`);
      showToast('✅ Leave request cancelled');
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Delete failed'}`);
    }
  };

  /* ── Profile ── */
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await axiosClient.put('/employees/me', profileForm);
      showToast('✅ Profile updated');
      setProfileEdit(false);
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Update failed'}`);
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const checkedIn = !!todayAttendance;
  const checkedOut = !!todayAttendance?.checkOut;

  return (
    <div className="dashboard-page">
      <Navbar />
      <main className="dashboard-main">
        {toast && <div className="toast-msg">{toast}</div>}

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">My Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user?.name} 👋</p>
          </div>
          <div className="today-date-chip">{new Date().toDateString()}</div>
        </div>

        {/* Attendance Banner */}
        <div className="attendance-banner">
          <div className="attendance-info">
            <h2 className="attendance-label">Today's Attendance</h2>
            {todayAttendance ? (
              <div className="attendance-times">
                <span>🟢 In: {fmtTime(todayAttendance.checkIn)}</span>
                {todayAttendance.checkOut && <span>🔴 Out: {fmtTime(todayAttendance.checkOut)}</span>}
                {todayAttendance.hoursWorked > 0 && <span>⏱️ {todayAttendance.hoursWorked}h worked</span>}
                <span className={`status-badge status-${todayAttendance.status?.toLowerCase().replace(' ', '-')}`}>
                  {todayAttendance.status}
                </span>
              </div>
            ) : (
              <p className="attendance-note">You haven't checked in yet today.</p>
            )}
          </div>
          <div className="attendance-actions">
            <div className="action-btns">
              <button className="btn btn-success" id="checkin-btn"
                onClick={handleCheckIn}
                disabled={attLoading || checkedIn}>
                {attLoading ? <span className="btn-spinner" /> : '🟢 Check In'}
              </button>
              <button className="btn btn-danger" id="checkout-btn"
                onClick={handleCheckOut}
                disabled={attLoading || !checkedIn || checkedOut}>
                {attLoading ? <span className="btn-spinner" /> : '🔴 Check Out'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: '📋', value: leaves.length, label: 'Total Leaves', color: 'blue' },
            { icon: '⏳', value: leaves.filter(l => l.status === 'Pending').length, label: 'Pending', color: 'yellow' },
            { icon: '✅', value: leaves.filter(l => l.status === 'Approved').length, label: 'Approved', color: 'green' },
            { icon: '📅', value: attendance.length, label: 'Days Tracked', color: 'purple' },
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
            <button key={t} id={`emp-tab-${t}`} className={`tab-btn ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}>
              {t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {/* ─── Overview ──────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="two-col-grid">
            <div className="card">
              <h2 className="card-title">Recent Leave History</h2>
              {leaves.slice(0, 4).map((l) => (
                <div key={l._id} className="review-row">
                  <div className="review-info">
                    <span className="badge badge-type">{l.leaveType}</span>
                    <span className="review-dates">{fmt(l.startDate)} – {fmt(l.endDate)}</span>
                  </div>
                  <span className={`status-badge status-${l.status?.toLowerCase()}`}>{l.status}</span>
                </div>
              ))}
              {leaves.length === 0 && <p className="empty-state">No leave history</p>}
            </div>
            <div className="card">
              <h2 className="card-title">Latest Announcements</h2>
              <div className="announcements-list">
                {announcements.slice(0, 3).map((a) => (
                  <div key={a._id} className={`announcement-item ${a.isPinned ? 'pinned' : ''}`}>
                    {a.isPinned && <span className="pin-badge">📌 Pinned</span>}
                    <h3 className="announcement-title">{a.title}</h3>
                    <p className="announcement-content">{a.content}</p>
                  </div>
                ))}
                {announcements.length === 0 && <p className="empty-state">No announcements</p>}
              </div>
            </div>
          </div>
        )}

        {/* ─── Attendance Tab ───────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <div className="card">
            <h2 className="card-title">My Attendance Log</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {attendance.map((r) => (
                    <tr key={r._id}>
                      <td>{r.date}</td>
                      <td>{fmtTime(r.checkIn)}</td>
                      <td>{fmtTime(r.checkOut)}</td>
                      <td>{r.hoursWorked > 0 ? `${r.hoursWorked}h` : '—'}</td>
                      <td><span className={`status-badge status-${r.status?.toLowerCase().replace(' ', '-')}`}>{r.status}</span></td>
                    </tr>
                  ))}
                  {attendance.length === 0 && <tr><td colSpan="5" className="empty-row">No attendance records</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Apply Leave Tab ──────────────────────────────────── */}
        {activeTab === 'apply-leave' && (
          <div className="card card-narrow">
            <h2 className="card-title">Apply for Leave</h2>
            <form onSubmit={handleLeaveSubmit} className="form-stack" id="leave-form">
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select className="form-input" value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Paid">Paid Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" required value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" required value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-input form-textarea" rows={3} required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Briefly describe the reason..." />
              </div>
              <button type="submit" className="btn btn-primary" disabled={leaveSaving} id="submit-leave-btn">
                {leaveSaving ? <span className="btn-spinner" /> : 'Submit Leave Request'}
              </button>
            </form>
          </div>
        )}

        {/* ─── My Leaves Tab ────────────────────────────────────── */}
        {activeTab === 'my-leaves' && (
          <div className="card">
            <h2 className="card-title">My Leave History</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Type</th><th>Start</th><th>End</th><th>Reason</th><th>Status</th><th>Comments</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l._id}>
                      <td><span className="badge badge-type">{l.leaveType}</span></td>
                      <td>{fmt(l.startDate)}</td>
                      <td>{fmt(l.endDate)}</td>
                      <td className="reason-cell">{l.reason}</td>
                      <td><span className={`status-badge status-${l.status?.toLowerCase()}`}>{l.status}</span></td>
                      <td>{l.comments || '—'}</td>
                      <td>
                        {l.status === 'Pending' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLeave(l._id)}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && <tr><td colSpan="7" className="empty-row">No leave requests yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Profile Tab ──────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="two-col-grid">
            <div className="card">
              <h2 className="card-title">My Profile</h2>
              {profile ? (
                <div className="profile-view">
                  <div className="profile-avatar-lg">{user?.name?.charAt(0).toUpperCase()}</div>
                  <div className="profile-name">{user?.name}</div>
                  <div className="profile-email">{user?.email}</div>
                  <div className="profile-role-badge">
                    <span className={`badge badge-${user?.role}`}>{user?.role?.toUpperCase()}</span>
                  </div>
                  <div className="profile-details">
                    <div className="profile-detail-row"><span>Department</span><strong>{profile.department}</strong></div>
                    <div className="profile-detail-row"><span>Designation</span><strong>{profile.designation}</strong></div>
                    <div className="profile-detail-row"><span>Phone</span><strong>{profile.phone || '—'}</strong></div>
                    <div className="profile-detail-row"><span>Address</span><strong>{profile.address || '—'}</strong></div>
                    <div className="profile-detail-row"><span>Joined</span><strong>{fmt(profile.joiningDate)}</strong></div>
                    {profile.managerId && (
                      <div className="profile-detail-row"><span>Manager</span><strong>{profile.managerId.name}</strong></div>
                    )}
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}
                    onClick={() => setProfileEdit(!profileEdit)}>
                    {profileEdit ? 'Cancel Edit' : '✏️ Edit Contact Info'}
                  </button>
                </div>
              ) : (
                <p className="empty-state">No profile data found. Contact HR to create your profile.</p>
              )}
            </div>
            {profileEdit && (
              <div className="card">
                <h2 className="card-title">Edit Contact Info</h2>
                <form onSubmit={handleProfileSave} className="form-stack" id="profile-form">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+1 555 000 0000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea className="form-input form-textarea" rows={3}
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Your home address" />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={profileSaving} id="save-profile-btn">
                    {profileSaving ? <span className="btn-spinner" /> : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ─── Announcements Tab ────────────────────────────────── */}
        {activeTab === 'announcements' && (
          <div className="card">
            <h2 className="card-title">Company Announcements</h2>
            <div className="announcements-list">
              {announcements.map((a) => (
                <div key={a._id} className={`announcement-item ${a.isPinned ? 'pinned' : ''}`}>
                  {a.isPinned && <span className="pin-badge">📌 Pinned</span>}
                  <div className="announcement-header">
                    <h3 className="announcement-title">{a.title}</h3>
                    <span className={`priority-badge priority-${a.priority?.toLowerCase()}`}>{a.priority}</span>
                  </div>
                  <p className="announcement-content">{a.content}</p>
                  <div className="announcement-meta">
                    <span>By {a.postedBy?.name}</span>
                    <span className="badge badge-type">{a.targetRole}</span>
                    <span className="meta-date">{fmt(a.createdAt)}</span>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && <p className="empty-state">No announcements yet</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
