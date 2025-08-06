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

// Portfolio table schema
const portfolioSchema = `CREATE TABLE IF NOT EXISTS portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  quantity DECIMAL(10, 4) NOT NULL DEFAULT 0,
  purchase_price DECIMAL(10, 2) NOT NULL,
  company_name VARCHAR(255),
  value DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * purchase_price) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_symbol (symbol)
)`;

// Transaction history table schema
const transactionSchema = `CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  quantity DECIMAL(10, 4) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  action ENUM('BUY', 'SELL') NOT NULL,
  company_name VARCHAR(255),
  net DECIMAL(15, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN action = 'BUY' THEN -(quantity * price)
      ELSE (quantity * price)
    END
  ) STORED,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_symbol_date (symbol, timestamp)
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
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database on startup
initializeDatabase();

module.exports = { pool, testConnection };