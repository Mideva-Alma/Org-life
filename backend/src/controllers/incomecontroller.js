const Income = require('../models/Income');

exports.createIncome = async (req, res) => {
    try {
        const { amount, source, description, income_date } = req.body;

        if (!amount || !source) {
            return res.status(400).json({ 
                error: 'Amount and source are required' 
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ 
                error: 'Amount must be greater than 0' 
            });
        }

        const incomeId = await Income.create({
            budgeter_id: req.user.id,
            amount,
            source,
            description,
            income_date
        });

        const income = await Income.findById(incomeId, req.user.id);
        res.status(201).json(income);
    } catch (error) {
        console.error('Create income error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getIncomes = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        
        const incomes = await Income.findByBudgeterId(req.user.id, {
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : 10
        });
        
        res.json(incomes);
    } catch (error) {
        console.error('Get incomes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const income = await Income.findById(id, req.user.id);
        
        if (!income) {
            return res.status(404).json({ error: 'Income not found' });
        }
        
        res.json(income);
    } catch (error) {
        console.error('Get income error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, source, description, income_date } = req.body;

        const updated = await Income.update(id, req.user.id, {
            amount,
            source,
            description,
            income_date
        });

        if (!updated) {
            return res.status(404).json({ error: 'Income not found' });
        }

        const income = await Income.findById(id, req.user.id);
        res.json(income);
    } catch (error) {
        console.error('Update income error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Income.delete(id, req.user.id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Income not found' });
        }
        
        res.json({ message: 'Income deleted successfully' });
    } catch (error) {
        console.error('Delete income error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getIncomeSummary = async (req, res) => {
    try {
        const { month } = req.query;
        
        if (!month) {
            return res.status(400).json({ 
                error: 'Month parameter is required (YYYY-MM format)' 
            });
        }

        const summary = await Income.getSummary(req.user.id, month);
        res.json(summary);
    } catch (error) {
        console.error('Get income summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};