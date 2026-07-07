// controllers/admincontroller.js
const Budgeter = require('../models/Budgeter');

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