// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
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
import { 
  FiUsers, FiUserCheck, FiDollarSign, FiTrendingUp, FiTrendingDown, 
  FiBarChart2, FiPieChart, FiTrendingUp as FiLineChart, FiList,
  FiUser, FiCheckCircle, FiAlertCircle, FiCalendar, FiActivity,
  FiAward, FiShield, FiSettings, FiArrowUp, FiArrowDown
} from "react-icons/fi";
import { FaUserTie, FaCrown, FaChartPie, FaChartLine } from "react-icons/fa";
import api from "../services/api";
import AdminLayout from "../components/AdminLayout";
import "./Admin.css";

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

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalVerified: 0,
    totalInactive: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalTransactions: 0
  });

  // Chart data states
  const [userActivityData, setUserActivityData] = useState(null);
  const [transactionTypeData, setTransactionTypeData] = useState(null);
  const [monthlyTrendData, setMonthlyTrendData] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch users
      const usersResult = await api.getAllUsers();
      const userList = usersResult.users || usersResult || [];
      setUsers(userList);

      // Fetch all transactions
      const txResult = await api.getAllTransactionsAdmin({ limit: 1000 });
      const txList = txResult.transactions || [];
      setTransactions(txList);

      // Calculate stats
      const totalIncome = txList.filter(t => t.type === 'income' || t.type === 'Income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalExpenses = txList.filter(t => t.type === 'expense' || t.type === 'Expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      setStats({
        totalUsers: userList.length,
        totalAdmins: userList.filter(u => u.role === 'admin').length,
        totalVerified: userList.filter(u => u.is_verified).length,
        totalInactive: userList.filter(u => !u.is_active).length,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        totalTransactions: txList.length
      });

      // Build chart data
      buildCharts(userList, txList);

    } catch (err) {
      console.error('Error loading admin data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const buildCharts = (userList, txList) => {
    // 1. USER ACTIVITY CHART - Expenses per user
    const userExpenses = {};
    userList.forEach(user => {
      const userTx = txList.filter(t => 
        t.budgeter_id === user.id && 
        (t.type === 'expense' || t.type === 'Expense')
      );
      const total = userTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      if (total > 0) {
        userExpenses[user.full_name || user.email] = total;
      }
    });

    // Sort by amount (highest first) and take top 10
    const sortedUsers = Object.entries(userExpenses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const userNames = sortedUsers.map(([name]) => name.length > 15 ? name.substring(0, 15) + '...' : name);
    const userAmounts = sortedUsers.map(([, amount]) => amount);

    // 2. TRANSACTION TYPE CHART
    const incomeTotal = txList.filter(t => t.type === 'income' || t.type === 'Income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenseTotal = txList.filter(t => t.type === 'expense' || t.type === 'Expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // 3. MONTHLY TREND
    const monthMap = {};
    txList.forEach(t => {
      const date = new Date(t.txn_date || t.created_at);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthMap[month]) {
        monthMap[month] = { income: 0, expense: 0 };
      }
      if (t.type === 'income' || t.type === 'Income') {
        monthMap[month].income += parseFloat(t.amount);
      } else {
        monthMap[month].expense += parseFloat(t.amount);
      }
    });

    const months = Object.keys(monthMap);
    const monthlyIncome = months.map(m => monthMap[m].income);
    const monthlyExpense = months.map(m => monthMap[m].expense);

    // Set chart data
    setUserActivityData({
      labels: userNames.length > 0 ? userNames : ['No Data'],
      datasets: [{
        label: 'User Expenses',
        data: userAmounts.length > 0 ? userAmounts : [0],
        backgroundColor: ['#2a6a4a', '#3a8a6a', '#4aaa8a', '#5aca9a', '#6adaaa', 
                          '#2a5a7a', '#3a7a9a', '#4a9aba', '#5abada', '#6adaba'],
        borderColor: '#fcf8f4',
        borderWidth: 2
      }]
    });

    setTransactionTypeData({
      labels: ['Income', 'Expenses'],
      datasets: [{
        label: 'Total Amount',
        data: [incomeTotal || 0, expenseTotal || 0],
        backgroundColor: ['#2a6a4a', '#c44a3a'],
        borderColor: '#1a2a3a',
        borderWidth: 2
      }]
    });

    setMonthlyTrendData({
      labels: months.length > 0 ? months : ['No Data'],
      datasets: [
        {
          label: 'Income',
          data: monthlyIncome.length > 0 ? monthlyIncome : [0],
          backgroundColor: 'rgba(42, 106, 74, 0.5)',
          borderColor: '#2a6a4a',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#2a6a4a'
        },
        {
          label: 'Expenses',
          data: monthlyExpense.length > 0 ? monthlyExpense : [0],
          backgroundColor: 'rgba(196, 74, 58, 0.5)',
          borderColor: '#c44a3a',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#c44a3a'
        }
      ]
    });
  };

  useEffect(() => { loadData(); }, [loadData]);

  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          font: { family: 'Courier New', size: 12 },
          color: '#1a2a3a'
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
            return `KES ${context.raw.toFixed(2)}`;
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
          font: { family: 'Courier New', size: 11 },
          color: '#4a5a6a',
          callback: function(value) {
            return `KES ${value}`;
          }
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Courier New', size: 11 },
          color: '#4a5a6a'
        }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Courier New', size: 12 },
          color: '#1a2a3a',
          boxWidth: 15,
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
            return `${context.dataset.label}: KES ${context.raw.toFixed(2)}`;
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
          font: { family: 'Courier New', size: 11 },
          color: '#4a5a6a',
          callback: function(value) {
            return `KES ${value}`;
          }
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Courier New', size: 11 },
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
          font: { family: 'Courier New', size: 13 },
          color: '#1a2a3a',
          padding: 20
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
            return `${context.label}: KES ${context.raw.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard" subtitle="Loading...">
        <div className="admin-loading">Loading dashboard data...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Overview" 
      subtitle={`${stats.totalUsers} users • ${stats.totalTransactions} transactions`}
    >
      {/* Stats Cards */}
      <div className="admin-stats">
        <div className="stat-card">
          <h3><FiUsers /> Total Users</h3>
          <p className="stat-number">{stats.totalUsers}</p>
        </div>
        <div className="stat-card verified">
          <h3><FiUserCheck /> Verified</h3>
          <p className="stat-number">{stats.totalVerified}</p>
        </div>
        <div className="stat-card">
          <h3><FiTrendingUp /> Total Income</h3>
          <p className="stat-number">KES {stats.totalIncome.toFixed(2)}</p>
        </div>
        <div className="stat-card inactive">
          <h3><FiTrendingDown /> Total Expenses</h3>
          <p className="stat-number">KES {stats.totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      {error && <p className="error-message"><FiAlertCircle /> {error}</p>}

      {/* Charts Grid */}
      <div className="admin-charts-grid">
        {/* Top Users by Expenses */}
        <div className="chart-card admin-chart">
          <h3><FiTrendingDown /> Top Users by Expenses</h3>
          <div className="chart-wrapper">
            {userActivityData && <Bar data={userActivityData} options={barOptions} />}
          </div>
          <p className="chart-hint"><FiUsers /> Showing users with highest spending</p>
        </div>

        {/* Income vs Expenses */}
        <div className="chart-card admin-chart">
          <h3><FiPieChart /> Income vs Expenses</h3>
          <div className="chart-wrapper">
            {transactionTypeData && <Pie data={transactionTypeData} options={pieOptions} />}
          </div>
          <p className="chart-hint">
            <FiTrendingUp /> Income: KES {stats.totalIncome.toFixed(2)} | 
            <FiTrendingDown /> Expenses: KES {stats.totalExpenses.toFixed(2)}
          </p>
        </div>

        {/* Monthly Trend */}
        <div className="chart-card admin-chart full-width">
          <h3><FiLineChart /> Monthly Trend</h3>
          <div className="chart-wrapper large">
            {monthlyTrendData && <Line data={monthlyTrendData} options={lineOptions} />}
          </div>
          <p className="chart-hint"><FiCalendar /> Income vs Expenses over time</p>
        </div>

        {/* Quick Stats */}
        <div className="chart-card admin-chart full-width">
          <h3><FiList /> System Overview</h3>
          <div className="quick-stats-grid">
            <div className="quick-stat">
              <span className="stat-icon"><FiUsers /></span>
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{stats.totalUsers}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-icon"><FaUserTie /></span>
              <span className="stat-label">Admins</span>
              <span className="stat-value">{stats.totalAdmins}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-icon"><FiCheckCircle /></span>
              <span className="stat-label">Verified</span>
              <span className="stat-value">{stats.totalVerified}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-icon"><FiActivity /></span>
              <span className="stat-label">Transactions</span>
              <span className="stat-value">{stats.totalTransactions}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-icon"><FiAlertCircle /></span>
              <span className="stat-label">Inactive Users</span>
              <span className="stat-value">{stats.totalInactive}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-icon"><FiDollarSign /></span>
              <span className="stat-label">Net Balance</span>
              <span className={`stat-value ${(stats.totalIncome - stats.totalExpenses) >= 0 ? 'positive' : 'negative'}`}>
                KES {(stats.totalIncome - stats.totalExpenses).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}