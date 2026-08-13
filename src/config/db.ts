import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// setup a connection pool to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to PostgreSQL Database successfully.');
  }
});

export default pool;