// controllers/authcontroller.js
const Budgeter = require('../models/Budgeter');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate JWT Token
const generateToken = (budgeterId, role) => {
    return jwt.sign(
        { id: budgeterId, role }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Sign Up
exports.signUp = async (req, res) => {
    try {
        const { email, password, full_name, phone_number, currency } = req.body;

        if (!email || !password || !full_name || !phone_number) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        const phoneRegex = /^07\d{8}$|^01\d{8}$|^254\d{9}$/;
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ error: 'Please enter a valid Kenyan phone number (e.g., 0712345678)' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingBudgeter = await Budgeter.findByEmail(email);
        if (existingBudgeter) {
            return res.status(400).json({ error: 'Budgeter with this email already exists' });
        }

        // New signups are always plain users. Admins are promoted manually in the DB.
        const budgeterId = await Budgeter.create({
            email,
            password,
            full_name,
            phone_number,
            currency
        });

        const token = generateToken(budgeterId, 'user');
        const budgeter = await Budgeter.findById(budgeterId);

        res.status(201).json({
            message: 'Budgeter created successfully',
            token,
            budgeter
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Sign In
exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const budgeter = await Budgeter.findByEmail(email);
        if (!budgeter) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await Budgeter.comparePassword(password, budgeter.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!budgeter.is_active) {
            return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
        }

        const token = generateToken(budgeter.id, budgeter.role);
        const budgeterData = await Budgeter.findById(budgeter.id);

        res.json({
            message: 'Login successful',
            token,
            budgeter: budgeterData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Current Budgeter
exports.getCurrentBudgeter = async (req, res) => {
    try {
        const budgeter = await Budgeter.findById(req.user.id);
        if (!budgeter) {
            return res.status(404).json({ error: 'Budgeter not found' });
        }
        res.json(budgeter);
    } catch (error) {
        console.error('Get budgeter error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Logout
exports.logout = async (req, res) => {
    res.json({ message: 'Logout successful' });
};