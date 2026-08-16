import pool from "../config/db.js";

export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    created_at: Date;
}

export const findUserByEmailOrUsername = async (username: string, email: string): Promise<User | null> => {
    const result = await pool.query(
        `SELECT id FROM users
        WHERE username = $1 OR email = $2`,
        [username, email]
    );
    return result.rows[0];
}

export const createUser = async (username: string, email: string, hashedPassword: string): Promise<Omit<User, "password"> | undefined> => {
    const result = await pool.query<Omit<User, "password">>(
        `INSERT INTO users (username, email, password)
        VALUES ($1, $2, $3),
        RETURNING id, username, email, created_at`,
        [username, email, hashedPassword]
    );
    return result.rows[0];
}


export const findUserByUsername = async (username: string): Promise<User | null> => {
    const result = await pool.query(
        `SELECT *
         FROM users
         WHERE username = $1`,
        [username]
    );

    return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
    const result = await pool.query(
        `SELECT *
        FROM users
        WHERE email = $1`,
        [email]
    );
    return result.rows[0];
};