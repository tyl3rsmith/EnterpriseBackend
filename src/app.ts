import express, { type Application, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { initializeDatabase } from "./config/initDb.js";
import authRoutes from "./routes/authRoutes.js";
import orgRoutes from "./routes/orgRoutes.js";

dotenv.config();

console.log(process.env.DATABASE_URL);

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Converts incoming JSON requests into JavaScript objects
app.use(express.json());

// Basic health check route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: "Welcome to the Production-Grade API!"
    });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Organization routes
app.use('/api/org', orgRoutes);

// Start the application
const startServer = async () => {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`Server now running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to initialize database:", error);
        process.exit(1);
    }
};

startServer();