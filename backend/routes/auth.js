const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const router = express.Router();

const logLogin = async (userId, email, method, ip, status) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(
            'INSERT INTO login_logs (user_id, email, method, ip, status) VALUES (?, ?, ?, ?, ?)',
            [userId, email, method, ip, status]
        );
    } catch (err) {
        console.error("Failed to log login:", err);
    } finally {
        if (conn) conn.release();
    }
};

const generateTokens = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

router.post('/signup', [
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const existing = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await conn.query(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );
        
        res.status(201).json({ message: 'User created successfully', userId: Number(result.insertId) });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

router.post('/login', [
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    let conn;

    try {
        conn = await pool.getConnection();
        const users = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            await logLogin(null, email, 'local', ip, 'failed - user not found');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            await logLogin(user.id, email, 'local', ip, 'failed - invalid password');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        await logLogin(user.id, email, 'local', ip, 'success');

        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

router.post('/refresh', async (req, res) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const { accessToken, refreshToken } = generateTokens(decoded);
        
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ accessToken, refreshToken });
    } catch (err) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
