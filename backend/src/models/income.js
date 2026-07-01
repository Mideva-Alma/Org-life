const { pool } = require('../config/database');

class Income {
    static async create({ budgeter_id, amount, source, description, income_date }) {
        const date = income_date || new Date().toISOString().split('T')[0];
        
        const [result] = await pool.execute(
            `INSERT INTO income (budgeter_id, amount, source, description, income_date) 
             VALUES (?, ?, ?, ?, ?)`,
            [budgeter_id, amount, source, description, date]
        );
        return result.insertId;
    }

    static async findByBudgeterId(budgeterId, options = {}) {
        let query = 'SELECT * FROM income WHERE budgeter_id = ?';
        const params = [budgeterId];

        if (options.startDate) {
            query += ' AND income_date >= ?';
            params.push(options.startDate);
        }

        if (options.endDate) {
            query += ' AND income_date <= ?';
            params.push(options.endDate);
        }

        query += ' ORDER BY income_date DESC, created_at DESC';
        
        // Fix: Add LIMIT directly to query string if provided
        if (options.limit) {
            query += ` LIMIT ${parseInt(options.limit)}`;
        }

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async findById(id, budgeterId) {
        const [rows] = await pool.execute(
            'SELECT * FROM income WHERE id = ? AND budgeter_id = ?',
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
        if (data.source) {
            fields.push('source = ?');
            values.push(data.source);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }
        if (data.income_date) {
            fields.push('income_date = ?');
            values.push(data.income_date);
        }

        if (fields.length === 0) return null;

        values.push(id);
        values.push(budgeterId);
        const [result] = await pool.execute(
            `UPDATE income SET ${fields.join(', ')} WHERE id = ? AND budgeter_id = ?`,
            values
        );
        
        return result.affectedRows > 0;
    }

    static async delete(id, budgeterId) {
        const [result] = await pool.execute(
            'DELETE FROM income WHERE id = ? AND budgeter_id = ?',
            [id, budgeterId]
        );
        return result.affectedRows > 0;
    }

    static async getSummary(budgeterId, month) {
        const [rows] = await pool.execute(
            `SELECT 
                source,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
             FROM income 
             WHERE budgeter_id = ? AND DATE_FORMAT(income_date, '%Y-%m') = ?
             GROUP BY source
             ORDER BY total_amount DESC`,
            [budgeterId, month]
        );
        return rows;
    }
}

module.exports = Income;