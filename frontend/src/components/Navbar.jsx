import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'hr': return '/hr-dashboard';
      case 'manager': return '/manager-dashboard';
      case 'employee': return '/employee-dashboard';
      default: return '/login';
    }
  };

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case 'hr': return 'badge badge-hr';
      case 'manager': return 'badge badge-manager';
      case 'employee': return 'badge badge-employee';
      default: return 'badge';
    }
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={getDashboardPath()} className="brand-link">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">StaffSync</span>
        </Link>
      </div>

      <div className="navbar-center">
        <Link
          to={getDashboardPath()}
          className={`nav-link ${location.pathname === getDashboardPath() ? 'active' : ''}`}
        >
          Dashboard
        </Link>
      </div>

      <div className="navbar-end">
        <div className="user-info">
          <div className="user-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className={getRoleBadgeClass()}>{user.role?.toUpperCase()}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline btn-sm" id="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
