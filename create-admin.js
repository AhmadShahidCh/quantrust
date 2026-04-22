const pool = require('./db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const conn = await pool.getConnection();
  const hashed = await bcrypt.hash('admin123', 10);
  await conn.query(
    'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
    ['admin@test.com', hashed, 'admin']
  );
  console.log('Admin created!');
  conn.release();
  process.exit();
}

createAdmin().catch(console.error);