const { pool } = require('../config/database');

class Transaction {
    // ===== CREATE =====
    
    // Create a new expense transaction (uncategorized by default)
    static async createExpense({ budgeter_id, amount, description, transaction_date }) {
        const date = transaction_date || new Date().toISOString().split('T')[0];
        
        const [result] = await pool.execute(
            `INSERT INTO transactions (budgeter_id, type, amount, description, created_at) 
             VALUES (?, 'expense', ?, ?, ?)`,
            [budgeter_id, amount, description, date]
        );
        return result.insertId;
    }

    // Create a new income transaction
    static async createIncome({ budgeter_id, amount, description, transaction_date }) {
        const date = transaction_date || new Date().toISOString().split('T')[0];
        
        const [result] = await pool.execute(
            `INSERT INTO transactions (budgeter_id, type, amount, description, created_at) 
             VALUES (?, 'income', ?, ?, ?)`,
            [budgeter_id, amount, description, date]
        );
        return result.insertId;
    }

    // ===== READ =====
    
    // Get all transactions for a user (with optional filters)
    static async findByBudgeterId(budgeterId, options = {}) {
        let query = 'SELECT * FROM transactions WHERE budgeter_id = ?';
        const params = [budgeterId];

        if (options.type) {
            query += ' AND type = ?';
            params.push(options.type);
        }

        if (options.startDate) {
            query += ' AND created_at >= ?';
            params.push(options.startDate);
        }

        if (options.endDate) {
            query += ' AND created_at <= ?';
            params.push(options.endDate);
        }

        if (options.hasCategory !== undefined) {
            if (options.hasCategory) {
                query += ' AND category IS NOT NULL';
            } else {
                query += ' AND category IS NULL';
            }
        }

        query += ' ORDER BY created_at DESC';
        
        if (options.limit) {
            query += ` LIMIT ${parseInt(options.limit)}`;
        }

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    // Get a single transaction by ID (with user verification)
    static async findById(id, budgeterId) {
        const [rows] = await pool.execute(
            'SELECT * FROM transactions WHERE id = ? AND budgeter_id = ?',
            [id, budgeterId]
        );
        return rows[0];
    }

    // Get uncategorized expense transactions
    static async getUncategorizedExpenses(budgeterId) {
        const [rows] = await pool.execute(
            `SELECT * FROM transactions 
             WHERE budgeter_id = ? 
               AND type = 'expense' 
               AND category IS NULL 
             ORDER BY created_at DESC`,
            [budgeterId]
        );
        return rows;
    }

    // Get all expenses (categorized + uncategorized)
    static async getAllExpenses(budgeterId) {
        const [rows] = await pool.execute(
            `SELECT * FROM transactions 
             WHERE budgeter_id = ? 
               AND type = 'expense' 
             ORDER BY created_at DESC`,
            [budgeterId]
        );
        return rows;
    }

    // Get all income transactions
    static async getAllIncome(budgeterId) {
        const [rows] = await pool.execute(
            `SELECT * FROM transactions 
             WHERE budgeter_id = ? 
               AND type = 'income' 
             ORDER BY created_at DESC`,
            [budgeterId]
        );
        return rows;
    }

    // Get categorized transactions by category
    static async getByCategory(budgeterId, category) {
        const [rows] = await pool.execute(
            `SELECT * FROM transactions 
             WHERE budgeter_id = ? 
               AND category = ? 
               AND type = 'expense'
             ORDER BY created_at DESC`,
            [budgeterId, category]
        );
        return rows;
    }

    // ===== SUMMARY & ANALYTICS =====
    
    // Get category summary (totals per category)
    static async getCategorySummary(budgeterId, month) {
        const [rows] = await pool.execute(
            `SELECT 
                category,
                COUNT(*) as count,
                SUM(amount) as total_amount
             FROM transactions 
             WHERE budgeter_id = ? 
               AND type = 'expense'
               AND category IS NOT NULL
               AND DATE_FORMAT(created_at, '%Y-%m') = ?
             GROUP BY category
             ORDER BY total_amount DESC`,
            [budgeterId, month]
        );
        return rows;
    }

    // Get daily spending for charts (categorized expenses only)
    static async getDailySpending(budgeterId, startDate, endDate) {
        const [rows] = await pool.execute(
            `SELECT 
                DATE(created_at) as date,
                SUM(amount) as total
             FROM transactions 
             WHERE budgeter_id = ? 
               AND type = 'expense'
               AND DATE(created_at) BETWEEN ? AND ?
               AND category IS NOT NULL
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [budgeterId, startDate, endDate]
        );
        return rows;
    }

    // Get total spending (categorized expenses only)
    static async getTotalSpending(budgeterId, startDate, endDate) {
        const [rows] = await pool.execute(
            `SELECT SUM(amount) as total
             FROM transactions 
             WHERE budgeter_id = ? 
               AND type = 'expense'
               AND DATE(created_at) BETWEEN ? AND ?
               AND category IS NOT NULL`,
            [budgeterId, startDate, endDate]
        );
        return rows[0]?.total || 0;
    }

    // Get monthly summary (income, expenses, net)
    static async getMonthlySummary(budgeterId, month) {
        const [rows] = await pool.execute(
            `SELECT 
                type,
                SUM(amount) as total
             FROM transactions 
             WHERE budgeter_id = ? 
               AND DATE_FORMAT(created_at, '%Y-%m') = ?
             GROUP BY type`,
            [budgeterId, month]
        );
        
        // Format the results
        const summary = { income: 0, expenses: 0 };
        rows.forEach(row => {
            if (row.type === 'income') summary.income = row.total;
            if (row.type === 'expense') summary.expenses = row.total;
        });
        summary.net = summary.income - summary.expenses;
        return summary;
    }

    // ===== UPDATE =====
    
    // Categorize a transaction
    static async categorize(id, budgeterId, category) {
        const [result] = await pool.execute(
            `UPDATE transactions 
             SET category = ? 
             WHERE id = ? AND budgeter_id = ?`,
            [category, id, budgeterId]
        );
        return result.affectedRows > 0;
    }

    // Update transaction details
    static async update(id, budgeterId, data) {
        const fields = [];
        const values = [];

        if (data.amount !== undefined) {
            fields.push('amount = ?');
            values.push(data.amount);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }
        if (data.type) {
            fields.push('type = ?');
            values.push(data.type);
        }

        if (fields.length === 0) return null;

        values.push(id);
        values.push(budgeterId);
        const [result] = await pool.execute(
            `UPDATE transactions SET ${fields.join(', ')} WHERE id = ? AND budgeter_id = ?`,
            values
        );
        
        return result.affectedRows > 0;
    }

    // ===== DELETE =====
    
    // Delete a transaction (with user verification)
    static async delete(id, budgeterId) {
        const [result] = await pool.execute(
            'DELETE FROM transactions WHERE id = ? AND budgeter_id = ?',
            [id, budgeterId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Transaction;