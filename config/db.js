const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('portfolio.db');

const schemaSql = `CREATE TABLE IF NOT EXISTS portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL UNIQUE,
  volume INTEGER NOT NULL CHECK (volume >= 0),
  price REAL DEFAULT 0
);`;

db.run(schemaSql);

module.exports = db;
