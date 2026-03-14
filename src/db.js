const { Pool, Result } = require("pg");

const pool = new Pool({
  database: process.env.DB_INVENTORY_DATABASE,
  user: process.env.DB_LOCAL_USER,
  password: process.env.DB_LOCAL_PASSWORD,
  host: process.env.DB_LOCAL_HOST,
  port: process.env.DB_PORT,
});

module.exports = pool;