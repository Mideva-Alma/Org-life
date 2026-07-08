const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const adminController = require('../controllers/admincontroller');

router.use(authMiddleware, requireAdmin);

router.get('/ping', (req, res) => {
    res.json({ message: 'Admin route working', user: req.user });
});

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/transactions', adminController.getAllTransactions);
router.delete('/transactions/:sourceTable/:id', adminController.deleteTransaction);

module.exports = router;