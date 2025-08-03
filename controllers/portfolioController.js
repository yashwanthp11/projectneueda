const { pool } = require('../config/db');

exports.getPortfolio = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        symbol, 
        quantity, 
        purchase_price, 
        company_name,
        created_at,
        updated_at
      FROM portfolio 
      WHERE quantity > 0
      ORDER BY (quantity * purchase_price) DESC
    `);
    
    // Calculate value in JavaScript
    const portfolioWithValues = rows.map(row => ({
      ...row,
      value: (parseFloat(row.quantity) * parseFloat(row.purchase_price)).toFixed(2)
    }));
    
    res.json(portfolioWithValues);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
};

exports.updateStock = async (req, res) => {
  const { symbol, quantity, price, action, company_name } = req.body;

  try {
    // Validation
    if (!symbol || !quantity || !price || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantity <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be positive' });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if stock exists
      const [existingStock] = await connection.execute(
        'SELECT quantity FROM portfolio WHERE symbol = ?', 
        [symbol]
      );

      if (existingStock.length > 0) {
        // Stock exists, update it
        const currentQuantity = parseFloat(existingStock[0].quantity);
        const newQuantity = action === 'BUY' 
          ? currentQuantity + quantity 
          : currentQuantity - quantity;
        
        if (action === 'SELL' && newQuantity < 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'Insufficient shares to sell' });
        }
        
        if (newQuantity <= 0) {
          // Remove stock if quantity reaches zero
          await connection.execute('DELETE FROM portfolio WHERE symbol = ?', [symbol]);
        } else {
          // Update existing stock
          await connection.execute(
            'UPDATE portfolio SET quantity = ?, purchase_price = ?, company_name = ?, updated_at = CURRENT_TIMESTAMP WHERE symbol = ?', 
            [newQuantity, price, company_name || symbol, symbol]
          );
        }
      } else {
        // New stock, only allow BUY action
        if (action !== 'BUY') {
          await connection.rollback();
          return res.status(400).json({ error: 'Cannot sell stock not in portfolio' });
        }
        
        await connection.execute(
          'INSERT INTO portfolio (symbol, quantity, purchase_price, company_name) VALUES (?, ?, ?, ?)', 
          [symbol, quantity, price, company_name || symbol]
        );
      }

      // Log transaction
      await connection.execute(
        'INSERT INTO transactions (symbol, quantity, price, action, company_name) VALUES (?, ?, ?, ?, ?)', 
        [symbol, quantity, price, action, company_name || symbol]
      );

      await connection.commit();
      res.json({ success: true, message: `Successfully ${action.toLowerCase()}ed ${quantity} shares of ${symbol}` });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Transaction failed. Please try again.' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        symbol,
        quantity,
        price,
        action,
        company_name,
        DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i') as timestamp
      FROM transactions 
      ORDER BY timestamp DESC 
      LIMIT 50
    `);
    
    // Calculate net in JavaScript
    const historyWithNet = rows.map(row => ({
      ...row,
      net: (row.action === 'BUY' ? 
        -(parseFloat(row.quantity) * parseFloat(row.price)) : 
        (parseFloat(row.quantity) * parseFloat(row.price))
      ).toFixed(2)
    }));
    
    res.json(historyWithNet);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};
