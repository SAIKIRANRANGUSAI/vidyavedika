// config/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a pool for promise-based queries
const db = mysql.createPool({

  // host: process.env.DB_HOST || "46.250.225.169",
  // user: process.env.DB_USER || "demo_colormo_usr",
  // password: process.env.DB_PASS || "QRdKdVpp3pnNhXBt",
  // database: process.env.DB_NAME || "vidya_vedika",

  host: "46.250.225.169",
  user: "demo_colormo_usr",
  password: "QRdKdVpp3pnNhXBt",
  database: "vidya_vedika",

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


