const { Pool } = require('pg');
require('dotenv').config();

// Simple check to warn if the user forgot the .env
if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL is missing in .env! Database connection will fail.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Neon DB usually requires SSL
    }
});

// Just a helper to initialize the table if it doesn't exist.
// In a real app, I'd use migrations, but for this assignment, this is easier.
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Database initialized (checked 'documents' table).");
    } catch (error) {
        console.error("Error initializing DB:", error);
    }
};

module.exports = { pool, initDB };
