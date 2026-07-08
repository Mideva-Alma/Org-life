// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const authMiddleware = require('../middleware/auth');

// ============ PUBLIC ROUTES ============
router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);

// ============ VERIFICATION ROUTES ============
router.post('/verify', authController.verifyEmail);
router.post('/request-verification', authController.requestVerification);
router.get('/check-status', authController.checkUserStatus);

// ============ PROTECTED ROUTES ============
router.get('/me', authMiddleware, authController.getCurrentBudgeter);
router.post('/logout', authMiddleware, authController.logout);

// ============ PASSWORD RESET ROUTES ============
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;