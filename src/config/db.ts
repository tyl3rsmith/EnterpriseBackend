import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// setup a connection pool to the PostgreSQL database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export default pool;