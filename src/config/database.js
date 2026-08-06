// src/config/database.js
const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tourist_planner_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Convert to promise-based for async/await
const promisePool = pool.promise();

// Test database connection
async function testConnection() {
    try {
        const [rows] = await promisePool.query('SELECT 1 + 1 AS result');
        console.log('✅ Database connected successfully!');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Get connection info
function getConnectionInfo() {
    return {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'tourist_planner_db',
        user: process.env.DB_USER || 'root'
    };
}

module.exports = {
    pool: promisePool,
    testConnection,
    getConnectionInfo
};