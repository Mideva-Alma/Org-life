const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');

// All transaction routes require authentication
router.use(authMiddleware);

// ===== CREATE =====
router.post('/expense', transactionController.addExpense);
router.post('/income', transactionController.addIncome);

// ===== READ =====
router.get('/', transactionController.getTransactions);
router.get('/expenses', transactionController.getExpenses);
router.get('/income', transactionController.getIncome);
router.get('/uncategorized', transactionController.getUncategorized);
router.get('/:id', transactionController.getTransaction);

// ===== CATEGORIZATION =====
router.put('/:id/categorize', transactionController.categorizeTransaction);

// ===== SUMMARY & ANALYTICS =====
router.get('/summary/categories', transactionController.getCategorySummary);
router.get('/summary/daily', transactionController.getDailySpending);
router.get('/summary/monthly', transactionController.getMonthlySummary);

// ===== UPDATE & DELETE =====
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;