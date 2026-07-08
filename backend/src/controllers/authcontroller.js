// controllers/authcontroller.js
const Budgeter = require('../models/Budgeter');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../config/email');
const crypto = require('crypto');
require('dotenv').config();

// Generate JWT Token
const generateToken = (budgeterId, role) => {
    return jwt.sign(
        { id: budgeterId, role }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (budgeter) => {
    const token = generateVerificationToken();
    
    await Budgeter.updateVerificationToken(budgeter.id, token);
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2d3748;">⚓ Org-Life</h1>
                <p style="color: #718096;">Verify Your Account</p>
            </div>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; color: #2d3748;">Hello <strong>${budgeter.full_name || budgeter.email}</strong>,</p>
                <p style="margin: 0; color: #4a5568;">Thank you for signing up for Org-Life! Please verify your email address by clicking the button below:</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                    Verify Email Address
                </a>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #718096; font-size: 14px;">
                <p>If you didn't create an account with Org-Life, you can safely ignore this email.</p>
                <p style="margin-top: 10px;">This verification link will expire in 24 hours.</p>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #a0aec0; text-align: center;">
                <p>Org-Life - Your Financial Management Dashboard</p>
            </div>
        </div>
    `;
    
    const text = `Verify your Org-Life account by visiting: ${verificationUrl}`;
    
    return await sendEmail({
        to: budgeter.email,
        subject: 'Verify Your Org-Life Account',
        html,
        text
    });
};

// ============ AUTH CONTROLLERS ============

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

        const budgeterId = await Budgeter.create({
            email,
            password,
            full_name,
            phone_number,
            currency
        });

        const token = generateToken(budgeterId, 'user');
        const budgeter = await Budgeter.findById(budgeterId);

        try {
            const emailResult = await sendVerificationEmail(budgeter);
            if (emailResult.success) {
                console.log('✅ Verification email sent! Preview URL:', emailResult.previewUrl);
            } else {
                console.error('❌ Failed to send verification email:', emailResult.error);
            }
        } catch (emailError) {
            console.error('Email sending error (non-blocking):', emailError);
        }

        res.status(201).json({
            message: 'Budgeter created successfully. Please check your email for verification.',
            token,
            budgeter: {
                ...budgeter,
                is_verified: false
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Sign In - FIXED: Explicitly includes role
exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔍 Login attempt:', email); // <-- Should show in terminal

        const budgeter = await Budgeter.findByEmail(email);
        console.log('🔍 User found:', budgeter ? 'YES' : 'NO'); // <-- Should show

        if (!budgeter) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await Budgeter.comparePassword(password, budgeter.password);
        console.log('🔍 Password valid:', isValidPassword ? 'YES' : 'NO'); // <-- Should show

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

    const token = generateToken(budgeter.id, budgeter.role);

    // ✅ THIS MUST RETURN THE ROLE
    res.json({
      message: 'Login successful',
      token,
      budgeter: {
        id: budgeter.id,
        email: budgeter.email,
        full_name: budgeter.full_name,
        role: budgeter.role, // <-- CRITICAL
        is_verified: budgeter.is_verified || false,
        is_active: budgeter.is_active !== 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Current Budgeter - FIXED: Explicitly returns role
exports.getCurrentBudgeter = async (req, res) => {
    try {
        const budgeter = await Budgeter.findById(req.user.id);
        if (!budgeter) {
            return res.status(404).json({ error: 'Budgeter not found' });
        }
        
        // Get the role from the token or database
        const role = req.user.role || budgeter.role;
        
        res.json({
            ...budgeter,
            role: role // <-- Explicitly include role
        });
    } catch (error) {
        console.error('Get budgeter error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Logout
exports.logout = async (req, res) => {
    res.json({ message: 'Logout successful' });
};

// ============ PASSWORD RESET ============

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const budgeter = await Budgeter.findByEmail(email);
        if (!budgeter) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        await Budgeter.updateResetToken(budgeter.id, resetToken);
        
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2d3748;">🔑 Reset Your Password</h1>
                <p>Hello ${budgeter.full_name || budgeter.email},</p>
                <p>We received a request to reset your password. Click the link below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                        Reset Password
                    </a>
                </div>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `;
        
        const emailResult = await sendEmail({
            to: budgeter.email,
            subject: 'Reset Your Org-Life Password',
            html
        });
        
        if (emailResult.success) {
            console.log('📧 Password reset email preview:', emailResult.previewUrl);
            res.json({ 
                success: true, 
                message: 'Password reset email sent',
                previewUrl: emailResult.previewUrl
            });
        } else {
            res.status(500).json({ error: 'Failed to send reset email' });
        }
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const budgeter = await Budgeter.findByResetToken(token);
        
        if (!budgeter) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await Budgeter.updatePassword(budgeter.id, hashedPassword);
        await Budgeter.clearResetToken(budgeter.id);
        
        res.json({ success: true, message: 'Password reset successfully!' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============ VERIFICATION ENDPOINTS ============

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }
        
        const budgeter = await Budgeter.findByVerificationToken(token);
        
        if (!budgeter) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        
        if (budgeter.verification_expires && new Date(budgeter.verification_expires) < new Date()) {
            return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
        }
        
        await Budgeter.markAsVerified(budgeter.id);
        
        const authToken = generateToken(budgeter.id, budgeter.role);
        
        res.json({
            success: true,
            message: 'Email verified successfully!',
            token: authToken,
            budgeter: {
                id: budgeter.id,
                email: budgeter.email,
                full_name: budgeter.full_name,
                role: budgeter.role,
                is_verified: true,
                is_active: true
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.requestVerification = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const budgeter = await Budgeter.findByEmail(email);
        
        if (!budgeter) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (budgeter.is_verified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        
        const emailResult = await sendVerificationEmail(budgeter);
        
        if (emailResult.success) {
            res.json({ 
                success: true, 
                message: 'Verification email sent! Check your inbox.',
                previewUrl: emailResult.previewUrl
            });
        } else {
            res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
        }
    } catch (error) {
        console.error('Request verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.checkUserStatus = async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const budgeter = await Budgeter.findByEmail(email);
        
        if (!budgeter) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            is_active: budgeter.is_active === 1,
            is_verified: budgeter.is_verified === 1,
            role: budgeter.role
        });
    } catch (error) {
        console.error('Check status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============ ADMIN: VERIFY USER BY ID ============

exports.verifyUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const budgeter = await Budgeter.findById(id);
        if (!budgeter) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (budgeter.is_verified) {
            return res.status(400).json({ error: 'User is already verified' });
        }
        
        await Budgeter.markAsVerified(id);
        
        res.json({ 
            success: true, 
            message: 'User verified successfully!',
            user: await Budgeter.findById(id)
        });
    } catch (error) {
        console.error('Admin verify error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};