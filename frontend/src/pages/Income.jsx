// frontend/src/pages/Income.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiTrendingUp, FiTrendingDown, FiCalendar, FiTarget } from "react-icons/fi";
import { FaMoneyBillWave, FaChartPie, FaChartLine } from "react-icons/fa";
import api from "../services/api";
import "./Income.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Income({ onDataChange }) { // ✅ ADDED onDataChange prop
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [incomeGoal, setIncomeGoal] = useState(() => {
    return localStorage.getItem('orglife_income_goal') || '';
  });
  const [showGoalInput, setShowGoalInput] = useState(false);
  
  const [newIncome, setNewIncome] = useState({
    amount: '',
    source: '',
    description: '',
    income_date: new Date().toISOString().split('T')[0],
    is_recurring: false
  });

  useEffect(() => {
    fetchUserAndData();
  }, [selectedMonth]);

  async function fetchUserAndData() {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      await Promise.all([fetchIncome(), fetchExpenses()]);
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('401')) {
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchIncome() {
    try {
      const incomeData = await api.getIncome();
      setTransactions(incomeData);
    } catch (error) {
      console.error('Error fetching income:', error);
    }
  }

  async function fetchExpenses() {
    try {
      const expensesData = await api.getExpenses();
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }

  function toggleForm() {
    if (!showAddForm) {
      setNewIncome({
        amount: '',
        source: '',
        description: '',
        income_date: new Date().toISOString().split('T')[0],
        is_recurring: false
      });
      setEditingId(null);
    }
    setShowAddForm(!showAddForm);
  }

  function resetForm() {
    setNewIncome({
      amount: '',
      source: '',
      description: '',
      income_date: new Date().toISOString().split('T')[0],
      is_recurring: false
    });
    setEditingId(null);
    setShowAddForm(false);
  }

  function startEditing(transaction) {
    setEditingId(transaction.id);
    setNewIncome({
      amount: transaction.amount,
      source: transaction.source || transaction.description || '',
      description: transaction.description || '',
      income_date: transaction.income_date || (transaction.created_at ? new Date(transaction.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      is_recurring: false
    });
    setShowAddForm(true);
  }

  async function handleAddIncome(e) {
    e.preventDefault();
    
    if (!newIncome.amount || parseFloat(newIncome.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!newIncome.source) {
      alert('Please select a source');
      return;
    }

    try {
      if (editingId) {
        await api.updateIncome(editingId, {
          amount: parseFloat(newIncome.amount),
          source: newIncome.source,
          description: newIncome.description,
          income_date: newIncome.income_date
        });
        alert('✅ Income updated successfully!');
      } else {
        await api.addIncome({
          amount: parseFloat(newIncome.amount),
          source: newIncome.source,
          description: newIncome.description,
          income_date: newIncome.income_date
        });
        alert('✅ Income added successfully!');
      }

      resetForm();
      await fetchIncome();
      
      // ✅ Refresh dashboard data
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Failed to save income: ' + error.message);
    }
  }

  async function handleDelete(id) {
    const userConfirmed = window.confirm('Are you sure you want to delete this income?');
    if (!userConfirmed) return;
    
    try {
      await api.deleteIncome(id);
      await fetchIncome();
      
      // ✅ Refresh dashboard data
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete: ' + error.message);
    }
  }

  function handleGoalSave() {
    if (incomeGoal && parseFloat(incomeGoal) > 0) {
      localStorage.setItem('orglife_income_goal', incomeGoal);
      setShowGoalInput(false);
    }
  }

  // Calculate totals
  const totalIncome = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const netBalance = totalIncome - totalExpenses;
  const goalAmount = parseFloat(incomeGoal) || 0;
  const goalProgress = goalAmount > 0 ? Math.min((totalIncome / goalAmount) * 100, 100) : 0;

  // Group income by source for pie chart
  const sourceData = transactions.reduce((acc, t) => {
    const source = t.source || t.description || 'Other';
    acc[source] = (acc[source] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  const sourceLabels = Object.keys(sourceData);
  const sourceValues = Object.values(sourceData);
  const sourceColors = ['#2a6a4a', '#3a8a6a', '#4aaa8a', '#5aca9a', '#6adaaa', '#7aeaba', '#8afaca'];

  // Monthly trend data
  const getMonthlyData = () => {
    const monthMap = {};
    transactions.forEach(t => {
      const date = t.income_date || t.created_at;
      const month = new Date(date).toLocaleString('default', { month: 'short' });
      monthMap[month] = (monthMap[month] || 0) + parseFloat(t.amount);
    });
    return monthMap;
  };

  const monthlyData = getMonthlyData();
  const monthLabels = Object.keys(monthlyData);
  const monthValues = Object.values(monthlyData);

  // Chart data
  const pieChartData = {
    labels: sourceLabels,
    datasets: [{
      data: sourceValues,
      backgroundColor: sourceColors.slice(0, sourceLabels.length),
      borderColor: '#fcf8f4',
      borderWidth: 2
    }]
  };

  const trendChartData = {
    labels: monthLabels.length > 0 ? monthLabels : ['No Data'],
    datasets: [{
      label: 'Income',
      data: monthValues.length > 0 ? monthValues : [0],
      backgroundColor: '#2a6a4a',
      borderColor: '#1a4a3a',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#2a6a4a'
    }]
  };

  const comparisonData = {
    labels: ['Income', 'Expenses', 'Net'],
    datasets: [{
      label: 'Financial Overview',
      data: [totalIncome, totalExpenses, netBalance],
      backgroundColor: ['#2a6a4a', '#c44a3a', netBalance >= 0 ? '#2a6a4a' : '#c44a3a'],
      borderColor: '#1a2a3a',
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1a2a3a',
        titleColor: '#f5f0eb',
        bodyColor: '#f5f0eb',
        borderColor: '#c4a882',
        borderWidth: 2,
        padding: 12,
        cornerRadius: 0,
        callbacks: {
          label: function(context) {
            return `${user?.currency || 'KES'} ${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e8e0d8',
          drawBorder: false
        },
        ticks: {
          font: {
            family: 'Courier New',
            size: 11
          },
          color: '#4a5a6a',
          callback: function(value) {
            return `${user?.currency || 'KES'} ${value}`;
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Courier New',
            size: 12
          },
          color: '#4a5a6a'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Courier New',
            size: 12
          },
          color: '#1a2a3a',
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#1a2a3a',
        titleColor: '#f5f0eb',
        bodyColor: '#f5f0eb',
        borderColor: '#c4a882',
        borderWidth: 2,
        padding: 12,
        cornerRadius: 0,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
            return `${user?.currency || 'KES'} ${context.raw.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="income-loading">
        <div className="loader"></div>
        <p>Loading your income...</p>
      </div>
    );
  }

  return (
    <div className="income-page">
      {/* Header */}
      <div className="income-header">
        <div>
          <h1 className="income-title">💰 Income</h1>
          <p className="income-subtitle">Track your earnings</p>
        </div>
        <button 
          className="add-income-btn"
          onClick={toggleForm}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Income'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="income-stats">
        <div className="stat-card total">
          <span className="stat-label">Total Income</span>
          <span className="stat-value">{user?.currency || 'KES'} {totalIncome.toFixed(2)}</span>
        </div>
        <div className="stat-card count">
          <span className="stat-label">Transactions</span>
          <span className="stat-value">{transactions.length}</span>
        </div>
        <div className="stat-card net">
          <span className="stat-label">Net Balance</span>
          <span className={`stat-value ${netBalance >= 0 ? 'positive' : 'negative'}`}>
            {user?.currency || 'KES'} {netBalance.toFixed(2)}
          </span>
        </div>
        <div className="stat-card goal">
          <span className="stat-label">Income Goal</span>
          <div className="goal-container">
            {incomeGoal ? (
              <>
                <span className="stat-value">{user?.currency || 'KES'} {parseFloat(incomeGoal).toFixed(2)}</span>
                <div className="goal-progress-container">
                  <div className="goal-progress" style={{ width: `${goalProgress}%` }} />
                </div>
                <span className="goal-percentage">{goalProgress.toFixed(0)}%</span>
                <button className="goal-edit-btn" onClick={() => setShowGoalInput(!showGoalInput)}>✏️</button>
              </>
            ) : (
              <button className="goal-set-btn" onClick={() => setShowGoalInput(true)}>
                + Set Goal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Goal Input */}
      {showGoalInput && (
        <div className="goal-input-container">
          <label>Set Monthly Income Goal</label>
          <div className="goal-input-row">
            <input
              type="number"
              placeholder="Enter amount"
              value={incomeGoal}
              onChange={(e) => setIncomeGoal(e.target.value)}
              className="goal-input"
            />
            <button className="goal-save-btn" onClick={handleGoalSave}>Save</button>
            <button className="goal-cancel-btn" onClick={() => setShowGoalInput(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT FORM ===== */}
      {showAddForm && (
        <div className="add-income-form">
          <h3>{editingId ? '✏️ Edit Income' : '➕ Add New Income'}</h3>
          <form onSubmit={handleAddIncome}>
            <div className="form-row">
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  placeholder="e.g., 50000"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  step="0.01"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newIncome.income_date}
                  onChange={(e) => setNewIncome({ ...newIncome, income_date: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Source *</label>
              <select
                value={newIncome.source}
                onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                required
              >
                <option value="">Select source...</option>
                <option value="Salary">💼 Salary</option>
                <option value="Freelance">💻 Freelance</option>
                <option value="Business">📈 Business</option>
                <option value="Investments">📊 Investments</option>
                <option value="Gifts">🎁 Gifts</option>
                <option value="Savings Withdrawal">🏦 Savings Withdrawal</option>
                <option value="Loan">💳 Loan</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="Add a note (optional)"
                value={newIncome.description}
                onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                {editingId ? '💾 Update Income' : '💾 Save Income'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== CHARTS ===== */}
      <div className="charts-grid">
        {/* Income vs Expenses Comparison */}
        <div className="chart-card">
          <h3>📊 Income vs Expenses</h3>
          <div className="chart-wrapper">
            <Bar data={comparisonData} options={chartOptions} />
          </div>
          <div className="chart-insight">
            {netBalance >= 0 ? (
              <span className="insight-positive">✅ You're in the green! Keep it up!</span>
            ) : (
              <span className="insight-negative">⚠️ You're spending more than you earn. Time to cut back!</span>
            )}
          </div>
        </div>

        {/* Income Sources Pie */}
        {sourceLabels.length > 0 && (
          <div className="chart-card">
            <h3>🥧 Income Sources</h3>
            <div className="chart-wrapper">
              <Pie data={pieChartData} options={pieOptions} />
            </div>
          </div>
        )}

        {/* Monthly Trend */}
        {monthLabels.length > 0 && (
          <div className="chart-card">
            <h3>📈 Monthly Trend</h3>
            <div className="chart-wrapper">
              <Line data={trendChartData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* ===== INCOME LIST ===== */}
      <div className="income-list">
        <h3 className="list-title">📋 Income History</h3>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No income recorded yet</p>
            <p className="empty-hint">Click "+ Add Income" to start tracking!</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="income-item">
              <div className="income-info">
                <span className="income-amount">
                  +{user?.currency || 'KES'} {parseFloat(transaction.amount).toFixed(2)}
                </span>
                <span className="income-source">
                  {getSourceIcon(transaction.source || transaction.description || 'Other')} {transaction.source || transaction.description || 'Other'}
                </span>
                <span className="income-date">
                  {new Date(transaction.income_date || transaction.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="income-actions">
                <button 
                  className="edit-btn"
                  onClick={() => startEditing(transaction)}
                  title="Edit income"
                >
                  ✏️
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(transaction.id)}
                  title="Delete income"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper: Get icon for source
function getSourceIcon(source) {
  const icons = {
    'Salary': '💼',
    'Freelance': '💻',
    'Business': '📈',
    'Investments': '📊',
    'Gifts': '🎁',
    'Savings Withdrawal': '🏦',
    'Loan': '💳',
    'Other': '📦'
  };
  return icons[source] || '📦';
}