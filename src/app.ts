import express, { type Application, type Request, type Response } from 'express';
import authRoutes from "./routes/authRoutes.js";
import orgRoutes from "./routes/orgRoutes.js";

const app: Application = express();

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

export default app;