import dotenv from "dotenv";
import { initializeDatabase } from "../src/config/initDb.js";

export default async function () {
    dotenv.config({ path: ".env.test" });

    console.log("Initializing test database...");

    await initializeDatabase();

    console.log("Test database initialized.");
};