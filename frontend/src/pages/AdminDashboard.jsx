import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";
import "./admin.css";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const limit = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
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

  async function handleToggleStatus(user) {
    try {
      await api.toggleUserStatus(user.id, !user.is_active);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete ${user.full_name}? This will permanently delete all their transactions, expenses, and income records. This cannot be undone.`)) return;
    try {
      await api.deleteUser(user.id);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <AdminLayout title="User Management" subtitle="View, search, and manage registered users">
      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <p className="status-badge inactive">{error}</p>}

      <div className="admin-table-wrap">
        {loading ? (
          <p style={{ padding: 20 }}>Loading...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th>
                <th>Registered</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone_number}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-small" onClick={() => handleToggleStatus(user)}>
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn-small danger" onClick={() => handleDelete(user)}>Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination-bar">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
        <span>Page {page} of {Math.ceil(total / limit) || 1}</span>
        <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </AdminLayout>
  );
}