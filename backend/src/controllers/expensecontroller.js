const Expense = require('../models/Expense');

exports.createExpense = async (req, res) => {
    try {
        const { amount, category, description, expense_date } = req.body;

        if (!amount || !category) {
            return res.status(400).json({ 
                error: 'Amount and category are required' 
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ 
                error: 'Amount must be greater than 0' 
            });
        }

        const expenseId = await Expense.create({
            budgeter_id: req.user.id,
            amount,
            category,
            description,
            expense_date
        });

        const expense = await Expense.findById(expenseId, req.user.id);
        res.status(201).json(expense);
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const { category, startDate, endDate, limit } = req.query;
        
        const expenses = await Expense.findByBudgeterId(req.user.id, {
            category,
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : 10
        });
        
        res.json(expenses);
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findById(id, req.user.id);
        
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        res.json(expense);
    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, category, description, expense_date } = req.body;

        const updated = await Expense.update(id, req.user.id, {
            amount,
            category,
            description,
            expense_date
        });

        if (!updated) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const expense = await Expense.findById(id, req.user.id);
        res.json(expense);
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Expense.delete(id, req.user.id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getExpenseSummary = async (req, res) => {
    try {
        const { month } = req.query;
        
        if (!month) {
            return res.status(400).json({ 
                error: 'Month parameter is required (YYYY-MM format)' 
            });
        }

        const summary = await Expense.getSummary(req.user.id, month);
        res.json(summary);
    } catch (error) {
        console.error('Get expense summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};