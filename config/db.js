const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'portfolio_db',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
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

// Wallet table schema - manages user's cash balance
const walletSchema = `CREATE TABLE IF NOT EXISTS wallet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT 1,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user (user_id)
)`;

// Initialize database tables
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    await connection.execute(portfolioSchema);
    console.log('Portfolio table created/verified');
    
    await connection.execute(transactionSchema);
    console.log('Transactions table created/verified');
    
    await connection.execute(walletSchema);
    console.log('Wallet table created/verified');
    
    // Initialize default wallet if it doesn't exist
    await connection.execute(`
      INSERT IGNORE INTO wallet (user_id, balance) 
      VALUES (1, 10000.00)
    `);
    console.log('Default wallet initialized');
    
    connection.release();
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
}

// Test database connection
// async function testConnection() {
//   try {
//     const connection = await pool.getConnection();
//     await connection.ping();
//     connection.release();
//     console.log('✅ Database connection successful');
//     return true;
//   } catch (error) {
//     console.error('❌ Database connection failed:', error.message);
//     return false;
//   }
// }
// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    console.log(`Connected to database: ${process.env.DB_NAME} at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database on startup (skip in test environment)
// if (process.env.NODE_ENV !== 'test') {
//   initializeDatabase();
// }
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase()
    .then(() => testConnection())
    .catch((error) => console.error('Error during initialization:', error.message));
}

module.exports = { pool, testConnection };