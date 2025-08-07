const { pool } = require('../config/db');

// Get wallet balance
const getWallet = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT balance FROM wallet WHERE user_id = ?',
            [1] // Default user ID
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        res.json({ balance: parseFloat(rows[0].balance) });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
};

// Add funds to wallet
const addFunds = async (req, res) => {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    try {
        // Update wallet balance
        await pool.execute(
            'UPDATE wallet SET balance = balance + ? WHERE user_id = ?',
            [amount, 1]
        );
        
        // Get updated balance
        const [rows] = await pool.execute(
            'SELECT balance FROM wallet WHERE user_id = ?',
            [1]
        );
        
        res.json({ 
            message: 'Funds added successfully',
            balance: parseFloat(rows[0].balance),
            added: parseFloat(amount)
        });
    } catch (error) {
        console.error('Error adding funds:', error);
        res.status(500).json({ error: 'Failed to add funds' });
    }
};

// Withdraw funds from wallet
const withdrawFunds = async (req, res) => {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    try {
        // Check current balance
        const [rows] = await pool.execute(
            'SELECT balance FROM wallet WHERE user_id = ?',
            [1]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        const currentBalance = parseFloat(rows[0].balance);
        
        if (currentBalance < amount) {
            return res.status(400).json({ 
                error: 'Insufficient funds',
                available: currentBalance,
                requested: parseFloat(amount)
            });
        }
        
        // Update wallet balance
        await pool.execute(
            'UPDATE wallet SET balance = balance - ? WHERE user_id = ?',
            [amount, 1]
        );
        
        // Get updated balance
        const [updatedRows] = await pool.execute(
            'SELECT balance FROM wallet WHERE user_id = ?',
            [1]
        );
        
        res.json({ 
            message: 'Funds withdrawn successfully',
            balance: parseFloat(updatedRows[0].balance),
            withdrawn: parseFloat(amount)
        });
    } catch (error) {
        console.error('Error withdrawing funds:', error);
        res.status(500).json({ error: 'Failed to withdraw funds' });
    }
};

// Check if user has sufficient funds for a purchase
const checkSufficientFunds = async (amount) => {
    try {
        const [rows] = await pool.execute(
            'SELECT balance FROM wallet WHERE user_id = ?',
            [1]
        );
        
        if (rows.length === 0) {
            return false;
        }
        
        return parseFloat(rows[0].balance) >= amount;
    } catch (error) {
        console.error('Error checking funds:', error);
        return false;
    }
};

// Deduct funds for stock purchase
const deductFunds = async (amount) => {
    try {
        await pool.execute(
            'UPDATE wallet SET balance = balance - ? WHERE user_id = ?',
            [amount, 1]
        );
        return true;
    } catch (error) {
        console.error('Error deducting funds:', error);
        return false;
    }
};

// Add funds from stock sale
const addFundsFromSale = async (amount) => {
    try {
        await pool.execute(
            'UPDATE wallet SET balance = balance + ? WHERE user_id = ?',
            [amount, 1]
        );
        return true;
    } catch (error) {
        console.error('Error adding funds from sale:', error);
        return false;
    }
};

module.exports = {
    getWallet,
    addFunds,
    withdrawFunds,
    checkSufficientFunds,
    deductFunds,
    addFundsFromSale
};
