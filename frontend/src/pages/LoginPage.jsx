import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(form.email, form.password);
      switch (user.role) {
        case 'hr': navigate('/hr-dashboard'); break;
        case 'manager': navigate('/manager-dashboard'); break;
        case 'employee': navigate('/employee-dashboard'); break;
        default: navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob blob-1" />
        <div className="auth-blob blob-2" />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">⚡</div>
          <h1 className="auth-title">StaffSync</h1>
          <p className="auth-subtitle">Human Resource Management</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="form-input"
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-demo-credentials">
          <p className="demo-title">Demo Credentials</p>
          <div className="demo-grid">
            <div className="demo-item" onClick={() => setForm({ email: 'hr@staffsync.com', password: 'password123' })}>
              <span className="badge badge-hr">HR</span>
              <span>hr@staffsync.com</span>
            </div>
            <div className="demo-item" onClick={() => setForm({ email: 'manager@staffsync.com', password: 'password123' })}>
              <span className="badge badge-manager">MGR</span>
              <span>manager@staffsync.com</span>
            </div>
            <div className="demo-item" onClick={() => setForm({ email: 'employee@staffsync.com', password: 'password123' })}>
              <span className="badge badge-employee">EMP</span>
              <span>employee@staffsync.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
