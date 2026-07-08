// controllers/admincontroller.js
const Budgeter = require('../models/Budgeter');
const { pool } = require('../config/database');

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 20 } = req.query;
        const result = await Budgeter.findAll({ 
            search, 
            page: parseInt(page), 
            limit: parseInt(limit) 
        });
        res.json(result);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await Budgeter.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /api/admin/users/:id/status
exports.toggleUserStatus = async (req, res) => {
    try {
        const { is_active } = req.body;
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'is_active must be true or false' });
        }

        // Prevent an admin from deactivating their own account by accident
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot change your own account status' });
        }

        const success = await Budgeter.setActiveStatus(req.params.id, is_active);
        if (!success) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: `User ${is_active ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const success = await Budgeter.deleteWithData(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User and all associated data deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Shared UNION query: normalizes transactions + expenses + income into one shape
const TRANSACTIONS_UNION_SQL = `
  SELECT 
    CONCAT('transactions-', t.id) COLLATE utf8mb4_unicode_ci as row_id,
    'transactions' COLLATE utf8mb4_unicode_ci as source_table,
    t.id as original_id,
    t.budgeter_id,
    b.full_name COLLATE utf8mb4_unicode_ci as user_name,
    b.email COLLATE utf8mb4_unicode_ci as user_email,
    t.type COLLATE utf8mb4_unicode_ci as type,
    t.amount,
    t.category COLLATE utf8mb4_unicode_ci as category,
    t.description COLLATE utf8mb4_unicode_ci as description,
    t.reference COLLATE utf8mb4_unicode_ci as reference,
    t.created_at as txn_date
  FROM transactions t
  JOIN budgeters b ON t.budgeter_id = b.id

  UNION ALL

  SELECT
    CONCAT('expenses-', e.id) COLLATE utf8mb4_unicode_ci,
    'expenses' COLLATE utf8mb4_unicode_ci,
    e.id, e.budgeter_id,
    b.full_name COLLATE utf8mb4_unicode_ci,
    b.email COLLATE utf8mb4_unicode_ci,
    'expense' COLLATE utf8mb4_unicode_ci,
    e.amount,
    e.category COLLATE utf8mb4_unicode_ci,
    e.description COLLATE utf8mb4_unicode_ci,
    NULL,
    e.expense_date
  FROM expenses e
  JOIN budgeters b ON e.budgeter_id = b.id

  UNION ALL

  SELECT
    CONCAT('income-', i.id) COLLATE utf8mb4_unicode_ci,
    'income' COLLATE utf8mb4_unicode_ci,
    i.id, i.budgeter_id,
    b.full_name COLLATE utf8mb4_unicode_ci,
    b.email COLLATE utf8mb4_unicode_ci,
    'income' COLLATE utf8mb4_unicode_ci,
    i.amount,
    i.source COLLATE utf8mb4_unicode_ci,
    i.description COLLATE utf8mb4_unicode_ci,
    NULL,
    i.income_date
  FROM income i
  JOIN budgeters b ON i.budgeter_id = b.id
`;

// GET /api/admin/transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const {
            search = '', budgeter_id, category, type,
            dateFrom, dateTo, month, page = 1, limit = 20
        } = req.query;

        const conditions = [];
        const params = [];

        if (search) {
            conditions.push(`(description LIKE ? OR category LIKE ? OR user_name LIKE ? OR user_email LIKE ? OR reference LIKE ?)`);
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }
        if (budgeter_id) { conditions.push(`budgeter_id = ?`); params.push(budgeter_id); }
        if (category) { conditions.push(`category = ?`); params.push(category); }
        if (type) { conditions.push(`type = ?`); params.push(type); }
        if (dateFrom) { conditions.push(`txn_date >= ?`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`txn_date <= ?`); params.push(dateTo); }
        if (month) { conditions.push(`DATE_FORMAT(txn_date, '%Y-%m') = ?`); params.push(month); }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [rows] = await pool.query(
            `SELECT * FROM (${TRANSACTIONS_UNION_SQL}) as combined
             ${whereClause}
             ORDER BY txn_date DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM (${TRANSACTIONS_UNION_SQL}) as combined ${whereClause}`,
            params
        );

        res.json({ transactions: rows, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/admin/transactions/:sourceTable/:id
exports.deleteTransaction = async (req, res) => {
    try {
        const { sourceTable, id } = req.params;
        const allowedTables = ['transactions', 'expenses', 'income']; // whitelist — never interpolate raw user input into SQL otherwise
        if (!allowedTables.includes(sourceTable)) {
            return res.status(400).json({ error: 'Invalid source table' });
        }

        const [result] = await pool.execute(
            `DELETE FROM ${sourceTable} WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};