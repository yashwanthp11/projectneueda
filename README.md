# Portfolio Management System

An application for managing a portfolio of stocks, including features for  stock purchases, sales, and wallet.

## Features

### 1. Manage Stock Portfolios with Real-Time Updates
- The system allows users to add, update, and remove stocks in their portfolio.
- Users can buy new stocks or increase their holdings of existing stocks.
- Selling stocks reduces the quantity in the portfolio, and the system ensures that users cannot sell more than they own.
- The application fetches only 5 stocks real data as the sample restAPI has only 5 stocks.


### 2. Track Transaction History (Buy/Sell Actions)
- Every transaction (buy or sell) is logged in the database.
- Users can view a detailed history of their transactions, including the stock symbol, quantity, price, action (BUY/SELL), and timestamp.
- This feature provides transparency and helps users track their investment activities.

### 3. Calculate Portfolio Value and Stock Percentages
- The system calculates the total value of the portfolio by summing up the value of all stocks (quantity × purchase price).
- It also calculates the percentage contribution of each stock to the total portfolio value, helping users understand the distribution of their investments.

### 4. RESTful API Endpoints for Portfolio Operations
- The application provides a set of RESTful API endpoints for interacting with the portfolio:
  - **GET /api/portfolio**: Retrieve the current portfolio.
  - **POST /api/portfolio/update**: Update the portfolio by buying or selling stocks.
  - **GET /api/portfolio/history**: Retrieve the transaction history.
- These endpoints make it easy to integrate the backend with a frontend application or other systems.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/portfolio-management.git
   cd portfolio-management
