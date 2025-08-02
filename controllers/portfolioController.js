const db = require('../config/db');

exports.getPortfolio = (req, res) => {
  db.all('SELECT *, volume * price AS value FROM portfolio WHERE volume > 0 ORDER BY ticker', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getPortfolioStats = (req, res) => {
  db.all(`
    SELECT 
      COUNT(*) as total_stocks,
      SUM(volume * price) as total_value,
      AVG(volume * price) as avg_value,
      MIN(volume * price) as min_value,
      MAX(volume * price) as max_value
    FROM portfolio
    WHERE volume > 0
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0]);
  });
};

exports.getStockByTicker = (req, res) => {
  const ticker = req.params.ticker.toLowerCase();
  db.get('SELECT *, volume * price AS value FROM portfolio WHERE LOWER(ticker) = ?', [ticker], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Stock not found' });
    res.json(row);
  });
};

exports.updateStock = (req, res) => {
  const { ticker, volume, price, action } = req.body;

  if (!ticker || !volume || !price || !action) {
    return res.status(400).json({ error: 'Missing required fields: ticker, volume, price, action' });
  }

  if (action === 'buy') {
    // For buying, use INSERT OR REPLACE to add or update the stock
    const sql = `
      INSERT INTO portfolio (ticker, volume, price)
      VALUES (?, ?, ?)
      ON CONFLICT(ticker) DO UPDATE SET
        volume = volume + excluded.volume,
        price = excluded.price
    `;
    
    db.run(sql, [ticker, volume, price], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        success: true, 
        message: `Bought ${volume} shares of ${ticker} at $${price}`,
        rowsAffected: this.changes 
      });
    });
  } else if (action === 'sell') {
    // For selling, first check if we have enough shares
    db.get('SELECT volume FROM portfolio WHERE LOWER(ticker) = LOWER(?)', [ticker], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (!row) {
        return res.status(404).json({ error: `No holdings found for ${ticker}` });
      }
      
      const currentVolume = row.volume;
      const newVolume = currentVolume - volume;
      
      if (newVolume < 0) {
        return res.status(400).json({ 
          error: `Cannot sell ${volume} shares. You only have ${currentVolume} shares of ${ticker}` 
        });
      }
      
      if (newVolume === 0) {
        // If selling all shares, remove the stock entirely
        db.run('DELETE FROM portfolio WHERE LOWER(ticker) = LOWER(?)', [ticker], function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ 
            success: true, 
            message: `Sold all ${volume} shares of ${ticker}. Removed from portfolio.`,
            rowsAffected: this.changes 
          });
        });
      } else {
        // If selling partial shares, update the volume and price
        db.run(
          'UPDATE portfolio SET volume = ?, price = ? WHERE LOWER(ticker) = LOWER(?)', 
          [newVolume, price, ticker], 
          function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
              success: true, 
              message: `Sold ${volume} shares of ${ticker} at $${price}. ${newVolume} shares remaining.`,
              rowsAffected: this.changes 
            });
          }
        );
      }
    });
  } else {
    return res.status(400).json({ error: 'Action must be either "buy" or "sell"' });
  }
};

exports.deleteStock = (req, res) => {
  const ticker = req.params.ticker;
  db.run('DELETE FROM portfolio WHERE LOWER(ticker) = LOWER(?)', [ticker], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Stock not found' });
    res.json({ 
      success: true, 
      message: `Deleted ${ticker} from portfolio`,
      rowsAffected: this.changes 
    });
  });
};

exports.clearPortfolio = (req, res) => {
  db.run('DELETE FROM portfolio', function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      success: true, 
      message: 'Portfolio cleared',
      rowsAffected: this.changes 
    });
  });
};
