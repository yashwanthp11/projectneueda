const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'portfolio_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Schema for current holdings
const portfolioSchema = `CREATE TABLE IF NOT EXISTS portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL UNIQUE,
  volume INT NOT NULL CHECK (volume >= 0),
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

// Schema for transaction history
const transactionSchema = `CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL,
  volume INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  action ENUM('buy', 'sell') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

// Initialize database tables
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    await connection.execute(portfolioSchema);
    console.log('Portfolio table created/verified');
    
    await connection.execute(transactionSchema);
    console.log('Transactions table created/verified');
    
    connection.release();
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
}

// Initialize database on startup
initializeDatabase();

module.exports = pool;
