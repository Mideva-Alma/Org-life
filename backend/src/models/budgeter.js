const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Budgeter {
    // Create a new budgeter
    static async create({ email, password, full_name, phone_number, currency }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.execute(
            `INSERT INTO budgeters (email, password, full_name, phone_number, currency) 
             VALUES (?, ?, ?, ?, ?)`,
            [email.toLowerCase(), hashedPassword, full_name, phone_number, currency || 'KES']
        );
        
        // Also create profile entry
        await pool.execute(
            `INSERT INTO profiles (id, full_name, phone_number, currency) 
             VALUES (?, ?, ?, ?)`,
            [result.insertId, full_name, phone_number, currency || 'KES']
        );
        
        return result.insertId;
    }

    // Find budgeter by email
    static async findByEmail(email) {
    const [rows] = await pool.execute(
        'SELECT * FROM budgeters WHERE email = ?',
        [email.toLowerCase()]
    );
    console.log('🔍 findByEmail result:', rows[0] ? 'FOUND' : 'NOT FOUND'); // DEBUG
    return rows[0];
}

    // Find budgeter by ID
    static async findById(id) {
    const [rows] = await pool.execute(
        `SELECT b.id, b.email, b.full_name, b.phone_number, b.currency, 
                b.is_verified, b.role, b.is_active, b.created_at, b.updated_at,
                p.avatar_url
         FROM budgeters b
         LEFT JOIN profiles p ON b.id = p.id
         WHERE b.id = ?`,
        [id]
    );
    console.log('🔍 findById result:', rows[0]); // DEBUG - Check if role is returned
    return rows[0];
}

    // List / search all budgeters (admin)
    static async findAll({ search = '', page = 1, limit = 20 } = {}) {
        const offset = (page - 1) * limit;
        const searchTerm = `%${search}%`;

        const [rows] = await pool.query(
            `SELECT id, email, full_name, phone_number, currency, role, is_active, 
                    is_verified, created_at
             FROM budgeters
             WHERE full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [searchTerm, searchTerm, searchTerm, limit, offset]
        );

        const [[{ total }]] = await pool.execute(
            `SELECT COUNT(*) as total FROM budgeters
             WHERE full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?`,
            [searchTerm, searchTerm, searchTerm]
        );

        return { users: rows, total, page, limit };
    }

    // Activate / deactivate a budgeter
    static async setActiveStatus(id, isActive) {
        const [result] = await pool.execute(
            'UPDATE budgeters SET is_active = ? WHERE id = ?',
            [isActive, id]
        );
        return result.affectedRows > 0;
    }

    // Update budgeter
    static async update(id, data) {
        const fields = [];
        const values = [];

        if (data.full_name) {
            fields.push('full_name = ?');
            values.push(data.full_name);
        }
        if (data.phone_number) {
            fields.push('phone_number = ?');
            values.push(data.phone_number);
        }
        if (data.currency) {
            fields.push('currency = ?');
            values.push(data.currency);
        }

        if (fields.length === 0) return null;

        values.push(id);
        const [result] = await pool.execute(
            `UPDATE budgeters SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        // Also update profile
        if (data.full_name || data.phone_number || data.currency) {
            await pool.execute(
                `UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
        }
        
        return result.affectedRows > 0;
    }

    // Compare password
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Delete budgeter
    static async deleteWithData(id) {
        const [result] = await pool.execute('DELETE FROM budgeters WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // ============ NEW: Verification Methods ============

    // Update last login
    static async updateLastLogin(id) {
        const [result] = await pool.execute(
            'UPDATE budgeters SET last_login = NOW() WHERE id = ?',
            [id]
        );
        return result;
    }

    // Update verification token
    static async updateVerificationToken(id, token) {
        const [result] = await pool.execute(
            'UPDATE budgeters SET verification_token = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?',
            [token, id]
        );
        return result;
    }

    // Find by verification token
    static async findByVerificationToken(token) {
        const [rows] = await pool.execute(
            'SELECT * FROM budgeters WHERE verification_token = ? AND verification_expires > NOW()',
            [token]
        );
        return rows[0] || null;
    }

    // Mark as verified
    static async markAsVerified(id) {
        const [result] = await pool.execute(
            'UPDATE budgeters SET is_verified = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = ?',
            [id]
        );
        return result;
    }

    // ============ PASSWORD RESET METHODS ============

static async updateResetToken(id, token) {
    const [result] = await pool.execute(
        'UPDATE budgeters SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
        [token, id]
    );
    return result;
}

static async findByResetToken(token) {
    const [rows] = await pool.execute(
        'SELECT * FROM budgeters WHERE reset_token = ? AND reset_expires > NOW()',
        [token]
    );
    return rows[0] || null;
}

static async updatePassword(id, hashedPassword) {
    const [result] = await pool.execute(
        'UPDATE budgeters SET password = ? WHERE id = ?',
        [hashedPassword, id]
    );
    return result;
}

static async clearResetToken(id) {
    const [result] = await pool.execute(
        'UPDATE budgeters SET reset_token = NULL, reset_expires = NULL WHERE id = ?',
        [id]
    );
    return result;
}
}

module.exports = Budgeter;