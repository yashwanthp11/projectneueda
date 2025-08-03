const express = require('express');
const router = express.Router();
const controller = require('../controllers/portfolioController');

router.get('/', controller.getPortfolio);
router.post('/', controller.updateStock);
router.get('/history', controller.getHistory);

module.exports = router;
// const express = require('express');
// const { pool } = require('./config/db');
// const app = express();

// app.use(express.json());

// // Get all portfolio entries
// app.get('/api/portfolio', async (req, res) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM portfolio');
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching portfolio:', error.message);
//     res.status(500).send('Server error');
//   }
// });

// // Get all transactions
// app.get('/api/transactions', async (req, res) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM transactions');
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching transactions:', error.message);
//     res.status(500).send('Server error');
//   }
// });

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });