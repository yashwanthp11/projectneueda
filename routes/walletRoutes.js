const express = require('express');
const router = express.Router();
const { getWallet, addFunds, withdrawFunds } = require('../controllers/walletController');

// GET /api/wallet - Get current wallet balance
router.get('/', getWallet);

// POST /api/wallet/add - Add funds to wallet
router.post('/add', addFunds);

// POST /api/wallet/withdraw - Withdraw funds from wallet
router.post('/withdraw', withdrawFunds);

module.exports = router;
