import dotenv from "dotenv";
import app from "./app.js";
import { initializeDatabase } from "./config/initDb.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(
                `Server now running on http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("Failed to initialize database:", error);
        process.exit(1);
    }
};

startServer();