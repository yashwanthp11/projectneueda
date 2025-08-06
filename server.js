require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

const portfolioRoutes = require('./routes/portfolioRoutes');

const PORT = process.env.PORT || 3000;

app.use(require('express-status-monitor')());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/portfolio', portfolioRoutes);

app.listen(PORT, () => 
  console.log(`Server running at http://localhost:${PORT}`)
);
