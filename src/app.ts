import express, { type Application, type Request, type Response } from 'express';
import dotenv from 'dotenv';
// import pool from "./config/db.js";
import { initializeDatabase } from "./config/initDb.js";
import authRoutes from "./routes/authRoutes.js";

// Load environmental variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Converts incoming JSON requests into JavaScript objects
app.use(express.json());

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Production-Grade API!" });
});

app.listen(PORT, () => {
  console.log(`Server now running on http://localhost:${PORT}`);
});

// Initialize the database tables
initializeDatabase();

app.use('/api/auth', authRoutes);