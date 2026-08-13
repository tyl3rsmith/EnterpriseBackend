import pool from "./db.js";

export const initializeDatabase = async () => {
    const createTableQuery = `
        -- Create the users table
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create the organizations table
        CREATE TABLE IF NOT EXISTS organizations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create the memberships table
        CREATE TABLE IF NOT EXISTS memberships (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            -- Prevent the same user from joining the same organization twice
            UNIQUE(user_id, organization_id)
        );
    `;

    try {
        console.log("Initializing database tables...");
        await pool.query(createTableQuery);
        console.log("Database tables initialized successfully.");
    } catch (error) {
        console.error("Error initializing database tables:", error);
    }
};
