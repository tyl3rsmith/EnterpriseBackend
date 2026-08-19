import { beforeEach, afterAll } from "vitest";
import pool from "../src/config/db.js";

beforeEach(async () => {
    await pool.query(`
        TRUNCATE TABLE
            memberships,
            documents,
            organizations,
            users
        RESTART IDENTITY CASCADE
    `);
});

afterAll(async () => {
    await pool.end();
});