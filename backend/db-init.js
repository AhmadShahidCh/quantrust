const pool = require('./db');

async function initDB() {
    let conn;
    try {
        conn = await pool.getConnection();
        
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                role ENUM('admin', 'manager', 'user') DEFAULT 'user',
                oauth_provider VARCHAR(50),
                oauth_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await conn.query(`
            CREATE TABLE IF NOT EXISTS login_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                email VARCHAR(255) NOT NULL,
                method VARCHAR(50),
                ip VARCHAR(45),
                status VARCHAR(50),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        
        console.log("Database tables initialized successfully.");
    } catch (err) {
        console.error("Error initializing database:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

initDB();
