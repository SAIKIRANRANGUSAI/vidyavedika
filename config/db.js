// config/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a pool for promise-based queries
const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "123456",
  database: process.env.DB_NAME || "vidyavedika",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// 
// Test database connection
(async () => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log(`✅ Database connected! Test query result: ${rows[0].result}`);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
})();

module.exports = db;
