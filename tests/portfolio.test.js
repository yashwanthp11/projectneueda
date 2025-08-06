/**
 * Jest Unit Tests for Portfolio Functions
 * Testing the original portfolio management functionality
 */

// Mock data for testing
const mockPortfolioData = [
    { symbol: 'AAPL', quantity: 10, purchase_price: 150.00 },
    { symbol: 'GOOGL', quantity: 5, purchase_price: 2500.00 },
    { symbol: 'TSLA', quantity: 8, purchase_price: 800.00 }
];

// Function to calculate total portfolio value
function calculatePortfolioValue(portfolio) {
    return portfolio.reduce((total, stock) => {
        return total + (stock.quantity * stock.purchase_price);
    }, 0);
}

// Function to calculate stock percentage in portfolio
function calculateStockPercentage(stock, totalValue) {
    const stockValue = stock.quantity * stock.purchase_price;
    return ((stockValue / totalValue) * 100).toFixed(2);
}

// Function to validate stock transaction
function validateTransaction(symbol, quantity, price, action) {
    const errors = [];
    
    if (!symbol || typeof symbol !== 'string') {
        errors.push('Symbol is required and must be a string');
    }
    
    if (!quantity || quantity <= 0) {
        errors.push('Quantity must be greater than 0');
    }
    
    if (!price || price <= 0) {
        errors.push('Price must be greater than 0');
    }
    
    if (!action || !['BUY', 'SELL'].includes(action.toUpperCase())) {
        errors.push('Action must be BUY or SELL');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Jest Tests
describe('Portfolio Utility Functions', () => {
    describe('calculatePortfolioValue', () => {
        it('should calculate portfolio value correctly', () => {
            const expected = (10 * 150) + (5 * 2500) + (8 * 800); // 20400
            const actual = calculatePortfolioValue(mockPortfolioData);
            expect(actual).toBe(expected);
        });

        it('should return 0 for empty portfolio', () => {
            const emptyPortfolio = [];
            const actual = calculatePortfolioValue(emptyPortfolio);
            expect(actual).toBe(0);
        });
    });

    describe('calculateStockPercentage', () => {
        it('should calculate stock percentage correctly', () => {
            const totalValue = 20400;
            const appleStock = mockPortfolioData[0]; // AAPL
            const expectedPercentage = '7.35'; // (1500 / 20400) * 100 = 7.35%
            const actualPercentage = calculateStockPercentage(appleStock, totalValue);
            expect(actualPercentage).toBe(expectedPercentage);
        });
    });

    describe('validateTransaction', () => {
        it('should validate valid transaction', () => {
            const result = validateTransaction('AAPL', 10, 150.50, 'BUY');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid transaction with all errors', () => {
            const result = validateTransaction('', -5, 0, 'INVALID');
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(4);
            expect(result.errors).toContain('Symbol is required and must be a string');
            expect(result.errors).toContain('Quantity must be greater than 0');
            expect(result.errors).toContain('Price must be greater than 0');
            expect(result.errors).toContain('Action must be BUY or SELL');
        });

        it('should validate BUY action', () => {
            const result = validateTransaction('AAPL', 10, 150, 'BUY');
            expect(result.isValid).toBe(true);
        });

        it('should validate SELL action', () => {
            const result = validateTransaction('AAPL', 10, 150, 'SELL');
            expect(result.isValid).toBe(true);
        });
    });
});

module.exports = {
    calculatePortfolioValue,
    calculateStockPercentage,
    validateTransaction
};
