const Transaction = require('../models/Transaction');
const { pool } = require('../config/database');

// ===== CREATE =====

// Add new expense
exports.addExpense = async (req, res) => {
    try {
        const { amount, description, transaction_date } = req.body;

        // Validation
        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        const transactionId = await Transaction.createExpense({
            budgeter_id: req.user.id,
            amount,
            description,
            transaction_date
        });

        const transaction = await Transaction.findById(transactionId, req.user.id);
        res.status(201).json(transaction);
    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add new income
exports.addIncome = async (req, res) => {
    try {
        const { amount, description, transaction_date } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        const transactionId = await Transaction.createIncome({
            budgeter_id: req.user.id,
            amount,
            description,
            transaction_date
        });

        const transaction = await Transaction.findById(transactionId, req.user.id);
        res.status(201).json(transaction);
    } catch (error) {
        console.error('Add income error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ===== READ =====

// Get all transactions
exports.getTransactions = async (req, res) => {
    try {
        const { type, startDate, endDate, limit, hasCategory } = req.query;
        
        const transactions = await Transaction.findByBudgeterId(req.user.id, {
            type,
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : 20,
            hasCategory: hasCategory !== undefined ? hasCategory === 'true' : undefined
        });
        
        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all expenses (categorized + uncategorized)
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Transaction.getAllExpenses(req.user.id);
        res.json(expenses);
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all income
exports.getIncome = async (req, res) => {
    try {
        const income = await Transaction.getAllIncome(req.user.id);
        res.json(income);
    } catch (error) {
        console.error('Get income error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get uncategorized expenses
exports.getUncategorized = async (req, res) => {
    try {
        const transactions = await Transaction.getUncategorizedExpenses(req.user.id);
        res.json(transactions);
    } catch (error) {
        console.error('Get uncategorized error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a single transaction
exports.getTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id, req.user.id);
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.json(transaction);
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ===== CATEGORIZATION (WITH SYNC) =====

// Categorize a transaction AND sync to expenses table
exports.categorizeTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.body;

        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }

        // 1. Update the transaction with the category
        const updated = await Transaction.categorize(id, req.user.id, category);

        if (!updated) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // 2. Get the full transaction details
        const transaction = await Transaction.findById(id, req.user.id);
        
        // 3. Sync to expenses table (if it's an expense transaction)
        if (transaction && transaction.type === 'expense') {
            // Check if already in expenses table to avoid duplicates
            const [existing] = await pool.execute(
                'SELECT id FROM expenses WHERE budgeter_id = ? AND id = ?',
                [req.user.id, id]
            );

            if (existing.length === 0) {
                // Insert into expenses table
                await pool.execute(
                    `INSERT INTO expenses (id, budgeter_id, amount, category, description, expense_date, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        transaction.id,
                        req.user.id, 
                        transaction.amount, 
                        category, 
                        transaction.description || 'No description',
                        transaction.created_at || new Date(),
                        transaction.created_at || new Date()
                    ]
                );
                console.log(`✅ Synced transaction ${id} to expenses table`);
            } else {
                // Update existing expense entry
                await pool.execute(
                    `UPDATE expenses 
                     SET category = ?, amount = ?, description = ?, expense_date = ? 
                     WHERE id = ? AND budgeter_id = ?`,
                    [
                        category, 
                        transaction.amount, 
                        transaction.description || 'No description',
                        transaction.created_at || new Date(),
                        id, 
                        req.user.id
                    ]
                );
                console.log(`✅ Updated expense ${id} in expenses table`);
            }
        }

        res.json({
            message: 'Transaction categorized and synced successfully',
            transaction: transaction
        });
    } catch (error) {
        console.error('Categorize error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ===== SUMMARY & ANALYTICS =====

// Get category summary
exports.getCategorySummary = async (req, res) => {
    try {
        const { month } = req.query;
        
        if (!month) {
            return res.status(400).json({ 
                error: 'Month parameter is required (YYYY-MM format)' 
            });
        }

        const summary = await Transaction.getCategorySummary(req.user.id, month);
        res.json(summary);
    } catch (error) {
        console.error('Get category summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get daily spending for charts
exports.getDailySpending = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                error: 'Start date and end date are required' 
            });
        }

        const data = await Transaction.getDailySpending(req.user.id, startDate, endDate);
        res.json(data);
    } catch (error) {
        console.error('Get daily spending error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get monthly summary
exports.getMonthlySummary = async (req, res) => {
    try {
        const { month } = req.query;
        
        if (!month) {
            return res.status(400).json({ 
                error: 'Month parameter is required (YYYY-MM format)' 
            });
        }

        const summary = await Transaction.getMonthlySummary(req.user.id, month);
        res.json(summary);
    } catch (error) {
        console.error('Get monthly summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ===== UPDATE =====

// Update transaction
exports.updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description, type } = req.body;

        const updated = await Transaction.update(id, req.user.id, {
            amount,
            description,
            type
        });

        if (!updated) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transaction = await Transaction.findById(id, req.user.id);
        
        // Also update expenses table if this transaction exists there
        if (transaction && transaction.type === 'expense' && transaction.category) {
            await pool.execute(
                `UPDATE expenses 
                 SET amount = ?, description = ?, expense_date = ? 
                 WHERE id = ? AND budgeter_id = ?`,
                [
                    transaction.amount, 
                    transaction.description || 'No description',
                    transaction.created_at || new Date(),
                    id, 
                    req.user.id
                ]
            );
        }

        res.json(transaction);
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ===== DELETE =====

// Delete transaction (also removes from expenses if exists)
exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if transaction exists in expenses table
        const [existing] = await pool.execute(
            'SELECT id FROM expenses WHERE id = ? AND budgeter_id = ?',
            [id, req.user.id]
        );

        // Delete from expenses table if it exists there
        if (existing.length > 0) {
            await pool.execute(
                'DELETE FROM expenses WHERE id = ? AND budgeter_id = ?',
                [id, req.user.id]
            );
            console.log(`✅ Removed transaction ${id} from expenses table`);
        }

        // Delete from transactions table
        const deleted = await Transaction.delete(id, req.user.id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Transaction not found or not owned by you' });
        }
        
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};