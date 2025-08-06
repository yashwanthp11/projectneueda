// Jest setup file for global test configuration

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables for testing
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';
process.env.DB_PORT = '3306';
process.env.PORT = '3001';

// Global test timeout
jest.setTimeout(30000);

// Suppress console.error in tests unless it's a real error
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Error')) {
    // Only show actual errors
    originalConsoleError(...args);
  }
};

// Add custom matchers
expect.extend({
  toBeValidPrice(received) {
    const pass = typeof received === 'number' && received > 0 && !isNaN(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid price`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid price (positive number)`,
        pass: false,
      };
    }
  },

  toBeValidStockSymbol(received) {
    const pass = typeof received === 'string' && received.length > 0 && /^[A-Z]+$/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid stock symbol`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid stock symbol (uppercase letters only)`,
        pass: false,
      };
    }
  }
});
