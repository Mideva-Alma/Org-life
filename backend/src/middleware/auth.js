// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // ✅ CRITICAL: Attach user with role to req.user
        req.user = {
            id: decoded.id,
            role: decoded.role || 'user'  // <-- THIS IS KEY!
        };

        console.log('🔍 Auth Middleware - User:', req.user); // DEBUG

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};