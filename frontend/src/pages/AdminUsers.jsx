// frontend/src/pages/AdminUsers.jsx
import { useState, useEffect, useCallback } from "react";
import { 
  FiSearch, FiUser, FiMail, FiPhone, FiShield, FiCheckCircle, 
  FiAlertCircle, FiTrash2, FiEdit2, FiUserCheck, FiUserX,
  FiArrowLeft, FiArrowRight, FiRefreshCw, FiList, FiX,
  FiUserPlus, FiUsers, FiStar, FiClock
} from "react-icons/fi";
import { FaUserTie, FaUserCircle } from "react-icons/fa";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";
import "./Admin.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const limit = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await api.getAllUsers({ search, page, limit });
      setUsers(result.users);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ✅ VERIFY USER
  async function handleVerifyUser(user) {
    if (!window.confirm(`Verify ${user.full_name}? This will activate their account.`)) return;
    
    try {
      await api.verifyUserById(user.id);
      setSuccess(`✅ ${user.full_name} has been verified!`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleStatus(user) {
    try {
      await api.toggleUserStatus(user.id, !user.is_active);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete ${user.full_name}? This will permanently delete all their data. This cannot be undone.`)) return;
    try {
      await api.deleteUser(user.id);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  // Helper to get role badge icon
  function getRoleIcon(role) {
    if (role === 'admin') {
      return <FaUserTie className="role-icon" />;
    }
    return <FiUser className="role-icon" />;
  }

  // Helper to get verified status icon
  function getVerifiedIcon(isVerified) {
    if (isVerified) {
      return <FiCheckCircle className="verified-icon" />;
    }
    return <FiAlertCircle className="unverified-icon" />;
  }

  // Helper to get status icon
  function getStatusIcon(isActive) {
    if (isActive) {
      return <FiUserCheck className="active-icon" />;
    }
    return <FiUserX className="inactive-icon" />;
  }

  return (
    <AdminLayout 
      title="User Management" 
      subtitle="View, search, verify, and manage registered users"
    >
      <div className="filter-bar">
        <div className="filter-group">
          <FiSearch className="filter-icon" />
          <input
            className="filter-input"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button 
          className="filter-clear-btn" 
          onClick={() => { setSearch(""); setPage(1); }}
        >
          <FiX /> Clear
        </button>
      </div>

      {error && (
        <div className="error-message">
          <FiAlertCircle /> {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <FiCheckCircle /> {success}
        </div>
      )}

      <div className="admin-table-wrap">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <div className="table-header-info">
              <span className="table-count">
                <FiUsers /> {total} users found
              </span>
              <button className="refresh-btn" onClick={loadUsers}>
                <FiRefreshCw /> Refresh
              </button>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th><FiUser /> Name</th>
                  <th><FiMail /> Email</th>
                  <th><FiPhone /> Phone</th>
                  <th><FiShield /> Role</th>
                  <th><FiCheckCircle /> Verified</th>
                  <th><FiUserCheck /> Status</th>
                  <th><FiEdit2 /> Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <FaUserCircle className="user-icon" />
                        <span className="user-name">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="email-cell">
                      <FiMail className="email-icon" />
                      {user.email}
                    </td>
                    <td>
                      <FiPhone className="phone-icon" />
                      {user.phone_number || 'N/A'}
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {getRoleIcon(user.role)} {user.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <span className={`verified-badge ${user.is_verified ? 'verified' : 'unverified'}`}>
                        {getVerifiedIcon(user.is_verified)} 
                        {user.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {getStatusIcon(user.is_active)} 
                        {user.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {!user.is_verified && (
                          <button 
                            className="btn-verify"
                            onClick={() => handleVerifyUser(user)}
                            title="Verify user"
                          >
                            <FiCheckCircle /> Verify
                          </button>
                        )}
                        <button 
                          className={`btn-toggle ${user.is_active ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleStatus(user)}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.is_active ? <FiUserX /> : <FiUserCheck />}
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="btn-small danger" 
                          onClick={() => handleDelete(user)}
                          title="Delete user"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      <div className="empty-content">
                        <FiUsers className="empty-icon" />
                        <p>No users found</p>
                        <p className="empty-hint">Try adjusting your search</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="pagination-bar">
        <button 
          className="pagination-btn" 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
        >
          <FiArrowLeft /> Previous
        </button>
        <span className="pagination-info">
          <FiList /> Page {page} of {Math.ceil(total / limit) || 1}
        </span>
        <button 
          className="pagination-btn" 
          disabled={page * limit >= total} 
          onClick={() => setPage(p => p + 1)}
        >
          Next <FiArrowRight />
        </button>
      </div>
    </AdminLayout>
  );
}