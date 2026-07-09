// frontend/src/pages/Expenses.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiTrendingDown, 
  FiCalendar, FiX, FiSave, FiCheckCircle, FiAlertCircle,
  FiTag, FiList, FiFilter
} from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import api from "../services/api";
import "./Expenses.css";

export default function Expenses({ onDataChange }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [uncategorized, setUncategorized] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUserAndExpenses();
  }, []);

  async function fetchUserAndExpenses() {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      await fetchExpenses();
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('401')) {
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchExpenses() {
    try {
      const expensesData = await api.getExpenses();
      setTransactions(expensesData);
      const uncatData = await api.getUncategorized();
      setUncategorized(uncatData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }

  function toggleForm() {
    if (!showAddForm) {
      setNewExpense({
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      setEditingId(null);
    }
    setShowAddForm(!showAddForm);
  }

  function resetForm() {
    setNewExpense({
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setShowAddForm(false);
  }

  function startEditing(transaction) {
    setEditingId(transaction.id);
    setNewExpense({
      amount: transaction.amount,
      description: transaction.description || '',
      transaction_date: transaction.created_at ? new Date(transaction.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowAddForm(true);
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      if (editingId) {
        await api.updateTransaction(editingId, {
          amount: parseFloat(newExpense.amount),
          description: newExpense.description || 'No description',
          type: 'expense'
        });
        alert('✅ Expense updated successfully!');
      } else {
        await api.addExpense({
          amount: parseFloat(newExpense.amount),
          description: newExpense.description || 'No description',
          transaction_date: newExpense.transaction_date
        });
        alert('✅ Expense added successfully!');
      }

      resetForm();
      await fetchExpenses();
      
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense: ' + error.message);
    }
  }

  async function handleCategorize(transactionId, category) {
    try {
      await api.categorizeTransaction(transactionId, category);
      await fetchExpenses();
      
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error categorizing:', error);
      alert('Failed to categorize: ' + error.message);
    }
  }

  async function handleDelete(id) {
    const userConfirmed = window.confirm('Are you sure you want to delete this expense?');
    if (!userConfirmed) return;
    
    try {
      await api.deleteTransaction(id);
      await fetchExpenses();
      
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete: ' + error.message);
    }
  }

  const getFilteredTransactions = () => {
    if (filter === 'categorized') {
      return transactions.filter(t => t.category !== null);
    } else if (filter === 'uncategorized') {
      return transactions.filter(t => t.category === null);
    }
    return transactions;
  };

  const filteredTransactions = getFilteredTransactions();

  const totalExpenses = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalCategorized = transactions.filter(t => t.category !== null)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalUncategorized = transactions.filter(t => t.category === null)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  if (loading) {
    return (
      <div className="expenses-loading">
        <div className="loader"></div>
        <p>Loading your expenses...</p>
      </div>
    );
  }

  return (
    <div className="expenses-page">
      {/* ===== STATS CARDS WITH ADD BUTTON ===== */}
      <div className="expenses-stats">
        <div className="stat-card">
          <span className="stat-label"><FiDollarSign /> Total Spent</span>
          <span className="stat-value">{user?.currency || 'KES'} {totalExpenses.toFixed(2)}</span>
        </div>
        <div className="stat-card categorized">
          <span className="stat-label"><FiCheckCircle /> Categorized</span>
          <span className="stat-value">{user?.currency || 'KES'} {totalCategorized.toFixed(2)}</span>
        </div>
        <div className="stat-card uncategorized">
          <span className="stat-label"><FiAlertCircle /> Uncategorized</span>
          <span className="stat-value">{user?.currency || 'KES'} {totalUncategorized.toFixed(2)}</span>
        </div>
        <div className="stat-card count">
          <span className="stat-label"><FiList /> Total Transactions</span>
          <span className="stat-value">{transactions.length}</span>
        </div>
        <button 
          className="add-expense-btn"
          onClick={toggleForm}
        >
          {showAddForm ? <FiX /> : <FiPlus />}
          {showAddForm ? ' Cancel' : ' Add Expense'}
        </button>
      </div>

      {/* ===== FORM ===== */}
      {showAddForm && (
        <div className="add-expense-form">
          <h3>{editingId ? <FiEdit2 /> : <FiPlus />} {editingId ? ' Edit Expense' : ' Add New Expense'}</h3>
          <form onSubmit={handleAddExpense}>
            <div className="form-row">
              <div className="form-group">
                <label><FiDollarSign /> Amount *</label>
                <input
                  type="number"
                  placeholder="e.g., 1500"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  step="0.01"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label><FiCalendar /> Date</label>
                <input
                  type="date"
                  value={newExpense.transaction_date}
                  onChange={(e) => setNewExpense({ ...newExpense, transaction_date: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label><FiTag /> Description</label>
              <input
                type="text"
                placeholder="What did you spend on?"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>
                <FiX /> Cancel
              </button>
              <button type="submit" className="save-btn">
                <FiSave /> {editingId ? ' Update Expense' : ' Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== FILTERS ===== */}
      <div className="expenses-filters">
        <div className="filter-group">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <FiList /> All ({transactions.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'categorized' ? 'active' : ''}`}
            onClick={() => setFilter('categorized')}
          >
            <FiCheckCircle /> Categorized ({transactions.filter(t => t.category).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'uncategorized' ? 'active' : ''}`}
            onClick={() => setFilter('uncategorized')}
          >
            <FiAlertCircle /> Uncategorized ({transactions.filter(t => !t.category).length})
          </button>
        </div>
      </div>

      {/* ===== EXPENSES LIST ===== */}
      <div className="expenses-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p><FiAlertCircle /> No expenses found</p>
            <p className="empty-hint"><FiPlus /> Click "Add Expense" to start tracking!</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="expense-item">
              <div className="expense-info">
                <span className="expense-amount">
                  {user?.currency || 'KES'} {parseFloat(transaction.amount).toFixed(2)}
                </span>
                <span className="expense-desc">
                  {transaction.description || 'No description'}
                </span>
                <span className="expense-date">
                  <FiCalendar /> {new Date(transaction.created_at).toLocaleDateString()}
                </span>
                {transaction.category && (
                  <span className="expense-category-badge">
                    {getCategoryIcon(transaction.category)} {transaction.category}
                  </span>
                )}
                {!transaction.category && (
                  <span className="expense-category-badge uncategorized-badge">
                    <FiAlertCircle /> Uncategorized
                  </span>
                )}
              </div>
              
              <div className="expense-actions">
                <button 
                  className="edit-btn"
                  onClick={() => startEditing(transaction)}
                  title="Edit expense"
                >
                  <FiEdit2 />
                </button>

                {!transaction.category && (
                  <select 
                    className="categorize-select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleCategorize(transaction.id, e.target.value);
                      }
                    }}
                  >
                    <option value=""><FiTag /> Categorize →</option>
                    <option value="Food">🍔 Food</option>
                    <option value="Transport">🚗 Transport</option>
                    <option value="Rent">🏠 Rent</option>
                    <option value="Utilities">💡 Utilities</option>
                    <option value="Entertainment">🎮 Entertainment</option>
                    <option value="Shopping">🛍️ Shopping</option>
                    <option value="Health">🏥 Health</option>
                    <option value="Education">📚 Education</option>
                    <option value="Travel">✈️ Travel</option>
                    <option value="Savings">🏦 Savings</option>
                    <option value="Insurance">🛡️ Insurance</option>
                    <option value="Other">📦 Other</option>
                  </select>
                )}
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(transaction.id)}
                  title="Delete expense"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== UNCATEGORIZED SUMMARY ===== */}
      {uncategorized.length > 0 && (
        <div className="uncategorized-summary">
          <div className="summary-header">
            <span><FiAlertCircle /> You have {uncategorized.length} uncategorized transactions</span>
            <span className="summary-amount">
              <FiDollarSign /> Total: {user?.currency || 'KES'} {uncategorized.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
            </span>
          </div>
          <p className="summary-hint">
            <FiTag /> Click the dropdown on each transaction to categorize it
          </p>
        </div>
      )}
    </div>
  );
}

function getCategoryIcon(category) {
  const icons = {
    'Food': '🍔',
    'Transport': '🚗',
    'Rent': '🏠',
    'Utilities': '💡',
    'Entertainment': '🎮',
    'Shopping': '🛍️',
    'Health': '🏥',
    'Education': '📚',
    'Travel': '✈️',
    'Savings': '🏦',
    'Insurance': '🛡️',
    'Other': '📦'
  };
  return icons[category] || '📦';
}