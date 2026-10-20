import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const TABS = ['overview', 'leaves', 'training'];

const EMPTY_TRAINING_FORM = {
  title: '', description: '', scheduleDate: '',
  location: '', maxParticipants: '', status: 'Scheduled', enrolledEmployees: [],
};

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Data
  const [leaves, setLeaves] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [employees, setEmployees] = useState([]); // for enrollment

  // Training modal
  const [trainingModal, setTrainingModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [trainingForm, setTrainingForm] = useState(EMPTY_TRAINING_FORM);
  const [trainingSaving, setTrainingSaving] = useState(false);

  // Enroll modal
  const [enrollModal, setEnrollModal] = useState(null); // program id
  const [enrollSelected, setEnrollSelected] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [leavesRes, programsRes, empsRes] = await Promise.all([
        axiosClient.get('/leaves/team'),
        axiosClient.get('/training'),
        axiosClient.get('/employees'),
      ]);
      setLeaves(leavesRes.data);
      setPrograms(programsRes.data);
      setEmployees(empsRes.data);
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

  /* ── Training CRUD ── */
  const openAddProgram = () => {
    setEditingProgram(null);
    setTrainingForm(EMPTY_TRAINING_FORM);
    setTrainingModal(true);
  };

  const openEditProgram = (prog) => {
    setEditingProgram(prog);
    setTrainingForm({
      title: prog.title,
      description: prog.description || '',
      scheduleDate: prog.scheduleDate?.split('T')[0] || '',
      location: prog.location || '',
      maxParticipants: prog.maxParticipants || '',
      status: prog.status,
      enrolledEmployees: prog.enrolledEmployees?.map((e) => e._id || e) || [],
    });
    setTrainingModal(true);
  };

  const handleTrainingSave = async (e) => {
    e.preventDefault();
    setTrainingSaving(true);
    try {
      if (editingProgram) {
        await axiosClient.put(`/training/${editingProgram._id}`, trainingForm);
        showToast('✅ Program updated');
      } else {
        await axiosClient.post('/training', trainingForm);
        showToast('✅ Program created');
      }
      setTrainingModal(false);
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Save failed'}`);
    } finally {
      setTrainingSaving(false);
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Delete this training program?')) return;
    try {
      await axiosClient.delete(`/training/${id}`);
      showToast('✅ Program deleted');
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Delete failed'}`);
    }
  };

  const handleEnrollSave = async () => {
    if (!enrollModal) return;
    try {
      await axiosClient.put(`/training/${enrollModal}/enroll`, { employeeIds: enrollSelected });
      showToast('✅ Employees enrolled');
      setEnrollModal(null);
      setEnrollSelected([]);
      fetchAll();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Enroll failed'}`);
    }
  };

  const statusColor = { Scheduled: 'blue', 'In-Progress': 'yellow', Completed: 'green' };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="dashboard-page">
      <Navbar />
      <main className="dashboard-main">
        {toast && <div className="toast-msg">{toast}</div>}

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Manager Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user?.name} 👋</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: '📋', value: leaves.length, label: 'Pending Approvals', color: 'blue' },
            { icon: '🎓', value: programs.length, label: 'Training Programs', color: 'purple' },
            { icon: '✅', value: programs.filter(p => p.status === 'Completed').length, label: 'Completed Trainings', color: 'green' },
            { icon: '👥', value: employees.length, label: 'Team Members', color: 'orange' },
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
            <button key={t} id={`mgr-tab-${t}`} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── Overview ──────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="two-col-grid">
            <div className="card">
              <h2 className="card-title">Leave Queue</h2>
              {leaves.length === 0
                ? <p className="empty-state">🎉 No pending leave requests!</p>
                : leaves.slice(0, 5).map((l) => (
                  <div key={l._id} className="review-row">
                    <div className="review-info">
                      <span className="review-name">{l.employee?.name}</span>
                      <span className="badge badge-type">{l.leaveType}</span>
                      <span className="review-dates">{fmt(l.startDate)} – {fmt(l.endDate)}</span>
                    </div>
                    <div className="action-btns">
                      <button className="btn btn-success btn-sm" onClick={() => handleLeaveStatus(l._id, 'Approved')}>✓</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleLeaveStatus(l._id, 'Rejected')}>✗</button>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="card">
              <h2 className="card-title">Active Programs</h2>
              {programs.filter(p => p.status !== 'Completed').slice(0, 4).map((p) => (
                <div key={p._id} className="training-row">
                  <div>
                    <div className="training-title">{p.title}</div>
                    <div className="training-meta">{fmt(p.scheduleDate)} · {p.enrolledEmployees?.length || 0} enrolled</div>
                  </div>
                  <span className={`status-badge status-${statusColor[p.status] || 'blue'}`}>{p.status}</span>
                </div>
              ))}
              {programs.length === 0 && <p className="empty-state">No programs yet</p>}
            </div>
          </div>
        )}

        {/* ─── Leaves Tab ───────────────────────────────────────── */}
        {activeTab === 'leaves' && (
          <div className="card">
            <h2 className="card-title">Team Leave Requests</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th><th>Dept</th><th>Type</th>
                    <th>Duration</th><th>Reason</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l._id}>
                      <td><span className="emp-name">{l.employee?.name}</span></td>
                      <td>{l.employee?.department}</td>
                      <td><span className="badge badge-type">{l.leaveType}</span></td>
                      <td>{fmt(l.startDate)} – {fmt(l.endDate)}</td>
                      <td className="reason-cell">{l.reason}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-success btn-sm" onClick={() => handleLeaveStatus(l._id, 'Approved')}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleLeaveStatus(l._id, 'Rejected')}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && <tr><td colSpan="6" className="empty-row">No pending requests</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Training Tab ─────────────────────────────────────── */}
        {activeTab === 'training' && (
          <div className="card">
            <div className="card-header-row">
              <h2 className="card-title">Training Programs</h2>
              <button className="btn btn-primary btn-sm" id="add-training-btn" onClick={openAddProgram}>
                + New Program
              </button>
            </div>
            <div className="training-board">
              {programs.map((p) => (
                <div key={p._id} className="training-card">
                  <div className="training-card-header">
                    <div>
                      <h3 className="training-card-title">{p.title}</h3>
                      <p className="training-card-desc">{p.description || 'No description'}</p>
                    </div>
                    <span className={`status-badge status-${statusColor[p.status] || 'blue'}`}>{p.status}</span>
                  </div>
                  <div className="training-card-meta">
                    <span>📅 {fmt(p.scheduleDate)}</span>
                    {p.location && <span>📍 {p.location}</span>}
                    <span>👥 {p.enrolledEmployees?.length || 0} enrolled</span>
                  </div>
                  <div className="enrolled-chips">
                    {(p.enrolledEmployees || []).slice(0, 4).map((e) => (
                      <span key={e._id || e} className="chip">{e.name || '...'}</span>
                    ))}
                    {(p.enrolledEmployees?.length || 0) > 4 &&
                      <span className="chip chip-more">+{p.enrolledEmployees.length - 4}</span>
                    }
                  </div>
                  <div className="training-card-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => openEditProgram(p)} id={`edit-prog-${p._id}`}>Edit</button>
                    <button className="btn btn-primary btn-sm" onClick={() => { setEnrollModal(p._id); setEnrollSelected([]); }}>
                      Enroll
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProgram(p._id)}>Delete</button>
                  </div>
                </div>
              ))}
              {programs.length === 0 && <p className="empty-state">No training programs yet</p>}
            </div>
          </div>
        )}
      </main>

      {/* ─── Training Modal ───────────────────────────────────── */}
      {trainingModal && (
        <div className="modal-overlay" onClick={() => setTrainingModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProgram ? 'Edit Program' : 'New Training Program'}</h2>
              <button className="btn-icon" onClick={() => setTrainingModal(false)}>✕</button>
            </div>
            <form onSubmit={handleTrainingSave} className="form-stack" id="training-form">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" required value={trainingForm.title}
                  onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })}
                  placeholder="e.g. Leadership Workshop" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" rows={3}
                  value={trainingForm.description}
                  onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                  placeholder="Program details..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Schedule Date</label>
                  <input type="date" className="form-input" required value={trainingForm.scheduleDate}
                    onChange={(e) => setTrainingForm({ ...trainingForm, scheduleDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={trainingForm.status}
                    onChange={(e) => setTrainingForm({ ...trainingForm, status: e.target.value })}>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In-Progress">In-Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={trainingForm.location}
                    onChange={(e) => setTrainingForm({ ...trainingForm, location: e.target.value })}
                    placeholder="Room 101 / Online" />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Participants</label>
                  <input type="number" className="form-input" value={trainingForm.maxParticipants}
                    onChange={(e) => setTrainingForm({ ...trainingForm, maxParticipants: e.target.value })}
                    placeholder="Leave blank for unlimited" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setTrainingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={trainingSaving} id="save-training-btn">
                  {trainingSaving ? <span className="btn-spinner" /> : (editingProgram ? 'Update' : 'Create Program')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Enroll Modal ─────────────────────────────────────── */}
      {enrollModal && (
        <div className="modal-overlay" onClick={() => setEnrollModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Enroll Employees</h2>
              <button className="btn-icon" onClick={() => setEnrollModal(null)}>✕</button>
            </div>
            <div className="enroll-list">
              {employees.map((emp) => (
                <label key={emp._id} className="enroll-item">
                  <input type="checkbox"
                    checked={enrollSelected.includes(emp.user?._id || emp._id)}
                    onChange={(e) => {
                      const id = emp.user?._id || emp._id;
                      setEnrollSelected(e.target.checked
                        ? [...enrollSelected, id]
                        : enrollSelected.filter((x) => x !== id)
                      );
                    }} />
                  <div className="emp-avatar-sm">{emp.user?.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="emp-name">{emp.user?.name}</div>
                    <div className="emp-email">{emp.department}</div>
                  </div>
                </label>
              ))}
              {employees.length === 0 && <p className="empty-state">No employees available</p>}
            </div>
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setEnrollModal(null)}>Cancel</button>
              <button className="btn btn-primary" id="enroll-save-btn" onClick={handleEnrollSave}>
                Enroll ({enrollSelected.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
