const express = require('express');
const router = express.Router();
const controller = require('../controllers/portfolioController');

router.get('/', controller.getPortfolio);
router.put('/', controller.updateStock);
router.get('/history', controller.getHistory);

module.exports = router;
