import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Expenses.css";

export default function Expenses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [uncategorized, setUncategorized] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [filter, setFilter] = useState('all'); // all, categorized, uncategorized

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
      // Get all expense transactions
      const expensesData = await api.getExpenses();
      setTransactions(expensesData);

      // Get uncategorized expenses
      const uncatData = await api.getUncategorized();
      setUncategorized(uncatData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }

  // Add new expense
  async function handleAddExpense(e) {
    e.preventDefault();
    
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await api.addExpense({
        amount: parseFloat(newExpense.amount),
        description: newExpense.description || 'No description',
        transaction_date: newExpense.transaction_date
      });

      setNewExpense({
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      
      // Refresh the list
      await fetchExpenses();
      
      alert('✅ Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense: ' + error.message);
    }
  }

  // Categorize a transaction
  async function handleCategorize(transactionId, category) {
    try {
      await api.categorizeTransaction(transactionId, category);
      await fetchExpenses();
    } catch (error) {
      console.error('Error categorizing:', error);
      alert('Failed to categorize: ' + error.message);
    }
  }

  // Delete a transaction - FIXED: using custom confirm
  async function handleDelete(id) {
    // Use a custom confirm dialog instead of window.confirm
    const userConfirmed = window.confirm('Are you sure you want to delete this expense?');
    if (!userConfirmed) return;
    
    try {
      await api.deleteTransaction(id);
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete: ' + error.message);
    }
  }

  // Get filtered transactions
  const getFilteredTransactions = () => {
    if (filter === 'categorized') {
      return transactions.filter(t => t.category !== null);
    } else if (filter === 'uncategorized') {
      return transactions.filter(t => t.category === null);
    }
    return transactions;
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate totals
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

      {/* Stats Cards */}
      <div className="expenses-stats">
        <div className="stat-card">
          <span className="stat-label">Total Spent</span>
          <span className="stat-value">{user?.currency || 'KES'} {totalExpenses.toFixed(2)}</span>
        </div>
        <div className="stat-card categorized">
          <span className="stat-label">Categorized</span>
          <span className="stat-value">{user?.currency || 'KES'} {totalCategorized.toFixed(2)}</span>
        </div>
        <div className="stat-card uncategorized">
          <span className="stat-label">Uncategorized</span>
          <span className="stat-value">{user?.currency || 'KES'} {totalUncategorized.toFixed(2)}</span>
        </div>
        <div className="stat-card count">
          <span className="stat-label">Total Transactions</span>
          <span className="stat-value">{transactions.length}</span>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="add-expense-form">
          <h3>Add New Expense</h3>
          <form onSubmit={handleAddExpense}>
            <div className="form-row">
              <div className="form-group">
                <label>Amount *</label>
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
                <label>Date</label>
                <input
                  type="date"
                  value={newExpense.transaction_date}
                  onChange={(e) => setNewExpense({ ...newExpense, transaction_date: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="What did you spend on?"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                💾 Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="expenses-filters">
        <div className="filter-group">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({transactions.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'categorized' ? 'active' : ''}`}
            onClick={() => setFilter('categorized')}
          >
            Categorized ({transactions.filter(t => t.category).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'uncategorized' ? 'active' : ''}`}
            onClick={() => setFilter('uncategorized')}
          >
            Uncategorized ({transactions.filter(t => !t.category).length})
          </button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="expenses-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No expenses found</p>
            <p className="empty-hint">Add your first expense to start tracking!</p>
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
                  {new Date(transaction.created_at).toLocaleDateString()}
                </span>
                {transaction.category && (
                  <span className="expense-category-badge">
                    {getCategoryIcon(transaction.category)} {transaction.category}
                  </span>
                )}
                {!transaction.category && (
                  <span className="expense-category-badge uncategorized-badge">
                    ⚠️ Uncategorized
                  </span>
                )}
              </div>
              
              <div className="expense-actions">
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
                    <option value="">Categorize →</option>
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
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Uncategorized Summary */}
      {uncategorized.length > 0 && (
        <div className="uncategorized-summary">
          <div className="summary-header">
            <span>📋 You have {uncategorized.length} uncategorized transactions</span>
            <span className="summary-amount">
              Total: {user?.currency || 'KES'} {uncategorized.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
            </span>
          </div>
          <p className="summary-hint">
            💡 Click the dropdown on each transaction to categorize it
          </p>
        </div>
      )}
    </div>
  );
}

// Helper: Get icon for category
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