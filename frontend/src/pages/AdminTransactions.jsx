import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";
import "./admin.css";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const limit = 20;

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { search, type, category, dateFrom, dateTo, month, page, limit };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const result = await api.getAllTransactionsAdmin(params);
      setTransactions(result.transactions);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, type, category, dateFrom, dateTo, month, page]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  async function handleDelete(txn) {
    if (!window.confirm(`Delete this ${txn.type} of ${txn.amount} for ${txn.user_name}? This cannot be undone.`)) return;
    try {
      await api.deleteTransactionAdmin(txn.source_table, txn.original_id);
      loadTransactions();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <AdminLayout title="Transaction Management" subtitle="View and manage all transactions across the system">
      <div className="filter-bar">
        <input className="filter-input" placeholder="Search description, category, user..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

        <select className="filter-select" value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <input className="filter-input" placeholder="Category" value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }} />

        <label className="filter-label">From
          <input className="filter-input" type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        </label>

        <label className="filter-label">To
          <input className="filter-input" type="date" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </label>

        <label className="filter-label">Month
          <input className="filter-input" type="month" value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(1); }} />
        </label>
      </div>

      {error && <p className="status-badge inactive">{error}</p>}

      <div className="admin-table-wrap">
        {loading ? (
          <p style={{ padding: 20 }}>Loading...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th><th>User</th><th>Type</th><th>Category</th>
                <th>Amount</th><th>Description</th><th>Source</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.row_id}>
                  <td>{new Date(txn.txn_date).toLocaleDateString()}</td>
                  <td>{txn.user_name}<br /><span style={{ fontSize: 11, color: '#4a5a6a' }}>{txn.user_email}</span></td>
                  <td><span className={`status-badge ${txn.type}`}>{txn.type}</span></td>
                  <td>{txn.category}</td>
                  <td>{txn.amount}</td>
                  <td>{txn.description}</td>
                  <td>{txn.source_table}</td>
                  <td><button className="btn-small danger" onClick={() => handleDelete(txn)}>Delete</button></td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={8} className="empty-state">No transactions found</td></tr>
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