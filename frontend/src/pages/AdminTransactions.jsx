// frontend/src/pages/AdminTransactions.jsx
import { useState, useEffect, useCallback } from "react";
import { 
  FiSearch, FiFilter, FiCalendar, FiDollarSign, FiUser, 
  FiTag, FiList, FiArrowLeft, FiArrowRight, FiTrash2,
  FiAlertCircle, FiTrendingUp, FiTrendingDown, FiX,
  FiClock, FiFileText, FiDatabase, FiRefreshCw
} from "react-icons/fi";
import { FaMoneyBillWave, FaUserCircle } from "react-icons/fa";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";
import "./Admin.css";

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

  // Helper function to get type icon
  function getTypeIcon(type) {
    if (type === 'income' || type === 'Income') {
      return <FiTrendingUp className="type-icon income-icon" />;
    } else {
      return <FiTrendingDown className="type-icon expense-icon" />;
    }
  }

  // Helper function to get source icon
  function getSourceIcon(source) {
    switch(source) {
      case 'transactions': return <FiList />;
      case 'expenses': return <FiTrendingDown />;
      case 'income': return <FiTrendingUp />;
      default: return <FiDatabase />;
    }
  }

  // Helper to get status badge class
  function getTypeBadgeClass(type) {
    if (type === 'income' || type === 'Income') {
      return 'status-badge income';
    }
    return 'status-badge expense';
  }

  return (
    <AdminLayout 
      title="Transaction Management" 
      subtitle="View and manage all transactions across the system"
    >
      <div className="filter-bar">
        <div className="filter-group">
          <FiSearch className="filter-icon" />
          <input 
            className="filter-input" 
            placeholder="Search description, category, user..."
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
          />
        </div>

        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select className="filter-select" value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="filter-group">
          <FiTag className="filter-icon" />
          <input 
            className="filter-input" 
            placeholder="Category" 
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }} 
          />
        </div>

        <div className="filter-group">
          <FiCalendar className="filter-icon" />
          <label className="filter-label">From</label>
          <input 
            className="filter-input date-input" 
            type="date" 
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} 
          />
        </div>

        <div className="filter-group">
          <FiCalendar className="filter-icon" />
          <label className="filter-label">To</label>
          <input 
            className="filter-input date-input" 
            type="date" 
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }} 
          />
        </div>

        <div className="filter-group">
          <FiCalendar className="filter-icon" />
          <label className="filter-label">Month</label>
          <input 
            className="filter-input date-input" 
            type="month" 
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(1); }} 
          />
        </div>

        <button className="filter-clear-btn" onClick={() => {
          setSearch("");
          setType("");
          setCategory("");
          setDateFrom("");
          setDateTo("");
          setMonth("");
          setPage(1);
        }}>
          <FiX /> Clear
        </button>
      </div>

      {error && (
        <div className="error-message">
          <FiAlertCircle /> {error}
        </div>
      )}

      <div className="admin-table-wrap">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading transactions...</p>
          </div>
        ) : (
          <>
            <div className="table-header-info">
              <span className="table-count">
                <FiList /> {total} transactions found
              </span>
              <button className="refresh-btn" onClick={loadTransactions}>
                <FiRefreshCw /> Refresh
              </button>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th><FiCalendar /> Date</th>
                  <th><FiUser /> User</th>
                  <th><FiTrendingUp /> Type</th>
                  <th><FiTag /> Category</th>
                  <th><FiDollarSign /> Amount</th>
                  <th><FiFileText /> Description</th>
                  <th><FiDatabase /> Source</th>
                  <th><FiTrash2 /> Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.row_id}>
                    <td>
                      <FiClock className="date-icon" />
                      {new Date(txn.txn_date).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="user-cell">
                        <FaUserCircle className="user-icon" />
                        <div>
                          <span className="user-name">{txn.user_name}</span>
                          <span className="user-email">{txn.user_email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getTypeBadgeClass(txn.type)}>
                        {getTypeIcon(txn.type)} {txn.type}
                      </span>
                    </td>
                    <td>
                      <span className="category-tag">
                        <FiTag /> {txn.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="amount-cell">
                      <span className={`amount-value ${txn.type === 'income' || txn.type === 'Income' ? 'income-amount' : 'expense-amount'}`}>
                        <FiDollarSign /> {txn.amount}
                      </span>
                    </td>
                    <td className="description-cell">
                      <span className="description-text">
                        {txn.description || 'No description'}
                      </span>
                    </td>
                    <td>
                      <span className="source-badge">
                        {getSourceIcon(txn.source_table)} {txn.source_table}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-small danger" 
                        onClick={() => handleDelete(txn)}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      <div className="empty-content">
                        <FiList className="empty-icon" />
                        <p>No transactions found</p>
                        <p className="empty-hint">Try adjusting your filters</p>
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
          Page {page} of {Math.ceil(total / limit) || 1}
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