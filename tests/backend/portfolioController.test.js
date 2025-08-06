const request = require('supertest');
const express = require('express');

// Mock the database pool before requiring the controller
jest.mock('../../config/db', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn()
  }
}));

const { pool } = require('../../config/db');
const portfolioController = require('../../controllers/portfolioController');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock routes
app.get('/api/portfolio', portfolioController.getPortfolio);
app.post('/api/portfolio/update', portfolioController.updateStock);
app.get('/api/portfolio/history', portfolioController.getHistory);

describe('Portfolio Controller - Backend Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/portfolio', () => {
    test('should return portfolio data successfully', async () => {
      const mockPortfolioData = [
        {
          symbol: 'AAPL',
          quantity: 10,
          purchase_price: 150.50,
          company_name: 'Apple Inc.',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          symbol: 'GOOGL',
          quantity: 5,
          purchase_price: 140.25,
          company_name: 'Alphabet Inc.',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];

      pool.execute.mockResolvedValue([mockPortfolioData]);

      const response = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('symbol', 'AAPL');
      expect(response.body[0]).toHaveProperty('value', '1505.00');
      expect(response.body[1]).toHaveProperty('symbol', 'GOOGL');
      expect(response.body[1]).toHaveProperty('value', '701.25');
    });

    test('should handle database errors gracefully', async () => {
      pool.execute.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/portfolio')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch portfolio');
    });

    test('should return empty array when no portfolio data', async () => {
      pool.execute.mockResolvedValue([[]]);

      const response = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/portfolio/update', () => {
    const mockConnection = {
      beginTransaction: jest.fn(),
      execute: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    beforeEach(() => {
      pool.getConnection.mockResolvedValue(mockConnection);
    });

    test('should successfully buy new stock', async () => {
      const newStockData = {
        symbol: 'TSLA',
        quantity: 5,
        price: 200.00,
        action: 'BUY',
        company_name: 'Tesla Inc.'
      };

      // Mock that stock doesn't exist
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // Check existing stock
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert new stock
        .mockResolvedValueOnce([{ insertId: 1 }]); // Log transaction

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(newStockData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('Successfully bought');
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('should successfully buy more of existing stock', async () => {
      const existingStockData = {
        symbol: 'AAPL',
        quantity: 5,
        price: 160.00,
        action: 'BUY',
        company_name: 'Apple Inc.'
      };

      // Mock existing stock
      mockConnection.execute
        .mockResolvedValueOnce([[{ quantity: 10 }]]) // Check existing stock
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update stock
        .mockResolvedValueOnce([{ insertId: 1 }]); // Log transaction

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(existingStockData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('should successfully sell existing stock', async () => {
      const sellStockData = {
        symbol: 'AAPL',
        quantity: 3,
        price: 155.00,
        action: 'SELL',
        company_name: 'Apple Inc.'
      };

      // Mock existing stock with sufficient quantity
      mockConnection.execute
        .mockResolvedValueOnce([[{ quantity: 10 }]]) // Check existing stock
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update stock
        .mockResolvedValueOnce([{ insertId: 1 }]); // Log transaction

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(sellStockData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('Successfully sold');
    });

    test('should prevent selling more shares than owned', async () => {
      const oversellData = {
        symbol: 'AAPL',
        quantity: 15,
        price: 155.00,
        action: 'SELL',
        company_name: 'Apple Inc.'
      };

      // Mock existing stock with insufficient quantity
      mockConnection.execute.mockResolvedValueOnce([[{ quantity: 10 }]]);

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(oversellData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Insufficient shares to sell');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    test('should prevent selling stock not in portfolio', async () => {
      const sellNonExistentData = {
        symbol: 'NVDA',
        quantity: 5,
        price: 300.00,
        action: 'SELL',
        company_name: 'NVIDIA Corp.'
      };

      // Mock that stock doesn't exist
      mockConnection.execute.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(sellNonExistentData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot sell stock not in portfolio');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    test('should validate required fields', async () => {
      const incompleteData = {
        symbol: 'AAPL',
        // Missing quantity, price, action
      };

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    test('should validate positive quantities and prices', async () => {
      const invalidData = {
        symbol: 'AAPL',
        quantity: -5,
        price: -100,
        action: 'BUY',
        company_name: 'Apple Inc.'
      };

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Quantity and price must be positive');
    });

    test('should handle database transaction errors', async () => {
      const stockData = {
        symbol: 'MSFT',
        quantity: 5,
        price: 300.00,
        action: 'BUY',
        company_name: 'Microsoft Corp.'
      };

      mockConnection.execute.mockRejectedValue(new Error('Transaction failed'));

      const response = await request(app)
        .post('/api/portfolio/update')
        .send(stockData)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Transaction failed. Please try again.');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('GET /api/portfolio/history', () => {
    test('should return transaction history successfully', async () => {
      const mockHistoryData = [
        {
          symbol: 'AAPL',
          quantity: 10,
          price: 150.50,
          action: 'BUY',
          company_name: 'Apple Inc.',
          timestamp: '2024-01-01 10:00'
        },
        {
          symbol: 'AAPL',
          quantity: 5,
          price: 155.00,
          action: 'SELL',
          company_name: 'Apple Inc.',
          timestamp: '2024-01-02 14:30'
        }
      ];

      pool.execute.mockResolvedValue([mockHistoryData]);

      const response = await request(app)
        .get('/api/portfolio/history')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('symbol', 'AAPL');
      expect(response.body[0]).toHaveProperty('action', 'BUY');
      expect(response.body[0]).toHaveProperty('net', '-1505.00'); // Negative for BUY
      expect(response.body[1]).toHaveProperty('action', 'SELL');
      expect(response.body[1]).toHaveProperty('net', '775.00'); // Positive for SELL
    });

    test('should handle database errors for history', async () => {
      pool.execute.mockRejectedValue(new Error('History fetch failed'));

      const response = await request(app)
        .get('/api/portfolio/history')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch transaction history');
    });

    test('should return empty array when no transaction history', async () => {
      pool.execute.mockResolvedValue([[]]);

      const response = await request(app)
        .get('/api/portfolio/history')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('Database Pool Configuration', () => {
    test('should use correct SQL queries', async () => {
      const mockData = [{ symbol: 'TEST', quantity: 1, purchase_price: 100 }];
      pool.execute.mockResolvedValue([mockData]);

      await request(app).get('/api/portfolio');

      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('FROM portfolio')
      );
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE quantity > 0')
      );
    });
  });
});
