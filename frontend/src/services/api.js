// frontend/src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
    // Generic request method with auth
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle unauthorized (token expired)
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/auth';
            }
            throw new Error(data.error || 'Request failed');
        }

        return data;
    },

    // ============ AUTH ENDPOINTS ============
    signUp(data) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    signIn(data) {
        return this.request('/auth/signin', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getCurrentUser() {
        return this.request('/auth/me');
    },

    logout() {
        localStorage.removeItem('token');
        return this.request('/auth/logout', { method: 'POST' });
    },

    // ============ EXPENSE ENDPOINTS ============
    getExpenses(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/expenses${query ? '?' + query : ''}`);
    },

    createExpense(data) {
        return this.request('/expenses', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getExpense(id) {
        return this.request(`/expenses/${id}`);
    },

    updateExpense(id, data) {
        return this.request(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deleteExpense(id) {
        return this.request(`/expenses/${id}`, {
            method: 'DELETE'
        });
    },

    getExpenseSummary(month) {
        return this.request(`/expenses/summary?month=${month}`);
    },

    // ============ INCOME ENDPOINTS ============
    getIncomes(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/income${query ? '?' + query : ''}`);
    },

    getIncome(params = {}) {
        return this.getIncomes(params);
    },

    createIncome(data) {
        return this.request('/income', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getIncomeById(id) {
        return this.request(`/income/${id}`);
    },

    updateIncome(id, data) {
        return this.request(`/income/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deleteIncome(id) {
        return this.request(`/income/${id}`, {
            method: 'DELETE'
        });
    },

    getIncomeSummary(month) {
        return this.request(`/income/summary?month=${month}`);
    },

    // ============ TRANSACTION ENDPOINTS ============
    addExpense(data) {
    return this.request('/transactions/expense', {
        method: 'POST',
        body: JSON.stringify(data)
    });
},

addIncome(data) {
    return this.request('/transactions/income', {
        method: 'POST',
        body: JSON.stringify(data)
    });
},

getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transactions${query ? '?' + query : ''}`);
},

getTransactionExpenses(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transactions/expenses${query ? '?' + query : ''}`);
},

getTransactionIncome(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transactions/income${query ? '?' + query : ''}`);
},

getUncategorized() {
    return this.request('/transactions/uncategorized');
},

categorizeTransaction(id, category) {
    return this.request(`/transactions/${id}/categorize`, {
        method: 'PUT',
        body: JSON.stringify({ category })
    });
},

getTransaction(id) {
    return this.request(`/transactions/${id}`);
},

updateTransaction(id, data) {
    return this.request(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
},

deleteTransaction(id) {
    return this.request(`/transactions/${id}`, {
        method: 'DELETE'
    });
},

getCategorySummary(month) {
    return this.request(`/transactions/summary/categories?month=${month}`);
},

getDailySpending(startDate, endDate) {
    return this.request(`/transactions/summary/daily?startDate=${startDate}&endDate=${endDate}`);
},

getMonthlySummary(month) {
    return this.request(`/transactions/summary/monthly?month=${month}`);
},
// ============ ADMIN: USER MANAGEMENT ============
    getAllUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/users${query ? '?' + query : ''}`);
    },

    getUserById(id) {
        return this.request(`/admin/users/${id}`);
    },

    toggleUserStatus(id, is_active) {
        return this.request(`/admin/users/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ is_active })
        });
    },

    deleteUser(id) {
        return this.request(`/admin/users/${id}`, {
            method: 'DELETE'
        });
    },

// ============ ADMIN: TRANSACTION MANAGEMENT ============
    getAllTransactionsAdmin(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/transactions${query ? '?' + query : ''}`);
    },

    deleteTransactionAdmin(sourceTable, id) {
        return this.request(`/admin/transactions/${sourceTable}/${id}`, {
            method: 'DELETE'
        });
    }
};

export default api;