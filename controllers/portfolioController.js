const pool = require('../config/db');

exports.getPortfolio = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT *, quantity * purchase_price AS value FROM portfolio');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  const { symbol, quantity, price, action, company_name } = req.body;
  
  console.log('Received request:', { symbol, quantity, price, action, company_name });

  try {
    // Validation
    if (!symbol || !quantity || !price || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // First, check if the stock exists
    const [existingStock] = await pool.execute('SELECT quantity FROM portfolio WHERE symbol = ?', [symbol]);

    if (existingStock.length > 0) {
      // Stock exists, update it
      const currentQuantity = existingStock[0].quantity;
      const newQuantity = action === 'BUY' ? currentQuantity + quantity : currentQuantity - quantity;
      
      if (newQuantity <= 0) {
        // Remove the stock if quantity is 0 or negative
        await pool.execute('DELETE FROM portfolio WHERE symbol = ?', [symbol]);
      } else {
        // Update the stock
        await pool.execute('UPDATE portfolio SET quantity = ?, purchase_price = ? WHERE symbol = ?', 
                          [newQuantity, price, symbol]);
      }
    } else {
      // Stock doesn't exist, insert it (only for buy actions)
      if (action === 'BUY') {
        await pool.execute('INSERT INTO portfolio (symbol, quantity, purchase_price, company_name) VALUES (?, ?, ?, ?)', 
                          [symbol, quantity, price, company_name || symbol]);
      } else {
        return res.status(400).json({ error: 'Cannot sell stock that is not in portfolio' });
      }
    }

    // Log the transaction
    await logTransaction(symbol, quantity, price, action);
    res.json({ success: true });

  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: error.message });
  }
};

async function logTransaction(symbol, quantity, price, action) {
  try {
    await pool.execute('INSERT INTO transactions (symbol, quantity, price, action) VALUES (?, ?, ?, ?)', 
                      [symbol, quantity, price, action]);
  } catch (error) {
    console.error('Error logging transaction:', error);
    throw error;
  }
}

exports.getHistory = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i') as timestamp,
             SUM(CASE WHEN action='BUY' THEN quantity * price ELSE -quantity * price END) AS net
      FROM transactions
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i')
      ORDER BY timestamp ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
};
