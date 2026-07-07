import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

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

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleToggleStatus(user) {
    try {
      await api.toggleUserStatus(user.id, !user.is_active);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete ${user.full_name}? This will permanently delete all their transactions, expenses, and income records. This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteUser(user.id);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>User Management</h2>

      <input
        placeholder="Search by name, email, or phone"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? <p>Loading...</p> : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.phone_number}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>{user.is_active ? 'Active' : 'Deactivated'}</td>
                <td>
                  <button onClick={() => handleToggleStatus(user)}>
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(user)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span> Page {page} of {Math.ceil(total / limit) || 1} </span>
        <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}