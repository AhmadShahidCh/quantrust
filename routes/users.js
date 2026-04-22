const express = require('express');
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

router.get('/me', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const users = await conn.query('SELECT id, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
});

router.get('/', requireRole('admin'), async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const users = await conn.query('SELECT id, email, role, created_at FROM users');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
});

router.patch('/:id/role', requireRole('admin'), async (req, res) => {
    const { role } = req.body;
    if (!['admin', 'manager', 'user'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Role updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
});

router.get('/logs', requireRole('admin'), async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const logs = await conn.query('SELECT * FROM login_logs ORDER BY timestamp DESC');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
