const { pool } = require('../config/database');

class Expense {
    static async create({ budgeter_id, amount, category, description, expense_date }) {
        const date = expense_date || new Date().toISOString().split('T')[0];
        
        const [result] = await pool.execute(
            `INSERT INTO expenses (budgeter_id, amount, category, description, expense_date) 
             VALUES (?, ?, ?, ?, ?)`,
            [budgeter_id, amount, category, description, date]
        );
        return result.insertId;
    }

    static async findByBudgeterId(budgeterId, options = {}) {
        let query = 'SELECT * FROM expenses WHERE budgeter_id = ?';
        const params = [budgeterId];

        if (options.category) {
            query += ' AND category = ?';
            params.push(options.category);
        }

        if (options.startDate) {
            query += ' AND expense_date >= ?';
            params.push(options.startDate);
        }

        if (options.endDate) {
            query += ' AND expense_date <= ?';
            params.push(options.endDate);
        }

        query += ' ORDER BY expense_date DESC, created_at DESC';
        
        // Fix: Add LIMIT directly to query string if provided
        if (options.limit) {
            query += ` LIMIT ${parseInt(options.limit)}`;
        }

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async findById(id, budgeterId) {
        const [rows] = await pool.execute(
            'SELECT * FROM expenses WHERE id = ? AND budgeter_id = ?',
            [id, budgeterId]
        );
        return rows[0];
    }

    static async update(id, budgeterId, data) {
        const fields = [];
        const values = [];

        if (data.amount !== undefined) {
            fields.push('amount = ?');
            values.push(data.amount);
        }
        if (data.category) {
            fields.push('category = ?');
            values.push(data.category);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }
        if (data.expense_date) {
            fields.push('expense_date = ?');
            values.push(data.expense_date);
        }

        if (fields.length === 0) return null;

        values.push(id);
        values.push(budgeterId);
        const [result] = await pool.execute(
            `UPDATE expenses SET ${fields.join(', ')} WHERE id = ? AND budgeter_id = ?`,
            values
        );
        
        return result.affectedRows > 0;
    }

    static async delete(id, budgeterId) {
        const [result] = await pool.execute(
            'DELETE FROM expenses WHERE id = ? AND budgeter_id = ?',
            [id, budgeterId]
        );
        return result.affectedRows > 0;
    }

    static async getSummary(budgeterId, month) {
        const [rows] = await pool.execute(
            `SELECT 
                category,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
             FROM expenses 
             WHERE budgeter_id = ? AND DATE_FORMAT(expense_date, '%Y-%m') = ?
             GROUP BY category
             ORDER BY total_amount DESC`,
            [budgeterId, month]
        );
        return rows;
    }
}

module.exports = Expense;