const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connect = await connection.getConnection();
    console.log("Mysql connected");
    connect.release();
  } catch (err) {
    console.error("❌ MySQL Connection Error:", err.message);
    throw err;
  }
}
testConnection();

module.exports = connection;
