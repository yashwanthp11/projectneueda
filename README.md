# Portfolio Manager - MySQL Version

A comprehensive portfolio management application built with Node.js, Express, and MySQL.

## Features

- 📊 **Portfolio Management**: Buy and sell stocks with real-time tracking
- 📈 **Visual Analytics**: Interactive charts (pie, bar, and line charts)
- 🔍 **Stock Search**: Autocomplete search with 40+ stock symbols
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 💰 **Portfolio Summary**: Total value, stock count, and average price
- 📜 **Transaction History**: Complete log of all trading activities

## Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v14 or higher)
2. **MySQL Server** (v8.0 or higher)
3. **npm** (comes with Node.js)

## MySQL Setup

### 1. Install MySQL Server

Download and install MySQL from [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)

### 2. Create Database

You can either:

**Option A**: Run the provided SQL script
```bash
mysql -u root -p < database_setup.sql
```

**Option B**: Create manually
```sql
CREATE DATABASE portfolio_db;
USE portfolio_db;
```

### 3. Configure Database Connection

Update the `.env` file with your MySQL credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=portfolio_db
DB_PORT=3306

# Server Configuration
PORT=3000
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd portfolio-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Copy `.env.example` to `.env` (if provided)
   - Update the database credentials in `.env`

4. **Start the application**:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Use the search functionality to find stocks
3. Buy or sell stocks using the trading form
4. View your portfolio summary and analytics
5. Monitor transaction history over time

## Database Schema

### Portfolio Table
```sql
CREATE TABLE portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL UNIQUE,
  volume INT NOT NULL CHECK (volume >= 0),
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL,
  volume INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  action ENUM('buy', 'sell') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `GET /api/portfolio` - Get current portfolio
- `POST /api/portfolio` - Buy/sell stocks
- `GET /api/portfolio/history` - Get transaction history

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MySQL with mysql2 driver
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Environment**: dotenv for configuration

## Troubleshooting

### Common Issues

1. **MySQL Connection Error**:
   - Verify MySQL server is running
   - Check credentials in `.env` file
   - Ensure database `portfolio_db` exists

2. **Port Already in Use**:
   - Change `PORT` in `.env` file
   - Or kill existing process: `taskkill /F /IM node.exe`

3. **Database Tables Not Created**:
   - Run the `database_setup.sql` script manually
   - Check MySQL user permissions

## License

ISC License
