const express = require('express');
const router = express.Router();
const controller = require('../controllers/portfolioController');

// Get all portfolio data
router.get('/', controller.getPortfolio);

// Get portfolio statistics
router.get('/stats', controller.getPortfolioStats);

// Get specific stock by ticker
router.get('/:ticker', controller.getStockByTicker);

// Add or update stock
router.post('/', controller.updateStock);

// Delete specific stock
router.delete('/:ticker', controller.deleteStock);

// Clear entire portfolio
router.delete('/', controller.clearPortfolio);

module.exports = router;
