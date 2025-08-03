# 📈 Portfolio Manager

A modern, real-time portfolio management application with live stock price integration.

## ✨ Features

- � **Live Stock Prices**: Real-time price data from Yahoo Finance API
- �📊 **Portfolio Tracking**: Buy/sell stocks with automated gain/loss calculations
- 📈 **Interactive Charts**: Beautiful pie, bar, and line chart visualizations
- 🔍 **Smart Search**: Autocomplete stock search (AAPL, TSLA, AMZN, FB, C)
- 💰 **Portfolio Analytics**: Total value, gains/losses, and performance metrics
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- 🎨 **Modern UI**: Clean, professional interface with glass-morphism effects

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL Server (v8.0+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashwanthp11/projectneueda.git
   cd projectneueda
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Create .env file with your MySQL credentials
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=portfolio_db
   DB_PORT=3306
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🏗️ Project Structure

```
📁 projectneueda/
├── 📁 config/
│   └── db.js              # MySQL database configuration
├── 📁 controllers/
│   └── portfolioController.js  # Business logic
├── 📁 public/
│   ├── index.html         # Main application interface
│   ├── style.css          # Modern styling & animations
│   └── script.js          # Real-time price integration
├── 📁 routes/
│   └── portfolioRoutes.js # API endpoints
├── server.js              # Express server
└── package.json           # Dependencies
```

## 🎯 Available Stocks

The application supports live pricing for:
- **AAPL** - Apple Inc.
- **AMZN** - Amazon.com Inc.
- **TSLA** - Tesla Inc.
- **FB** - Meta Platforms Inc.
- **C** - Citigroup Inc.

## 🔧 API Endpoints

- `GET /api/portfolio` - Get current portfolio
- `PUT /api/portfolio` - Buy/sell stocks
- `GET /api/portfolio/history` - Transaction history

## 🎨 Technologies Used

- **Backend**: Node.js, Express.js, MySQL2
- **Frontend**: Vanilla JavaScript, Chart.js, CSS3
- **Database**: MySQL with connection pooling
- **APIs**: AWS Lambda (Yahoo Finance data cache)

## 📊 Features in Detail

### Real-Time Price Integration
- Automatic price fetching when selecting stocks
- Live portfolio value updates
- Gain/loss calculations with current market prices
- Price caching to optimize API calls

### Portfolio Analytics
- Total portfolio value with gain/loss indicators
- Individual stock performance tracking
- Portfolio distribution charts
- Transaction history visualization

### Modern Interface
- Responsive grid layouts
- Gradient backgrounds and glass-morphism effects
- Real-time loading indicators
- Professional typography and spacing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Yahoo Finance for stock price data
- Chart.js for beautiful visualizations
- MySQL for robust data storage
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
