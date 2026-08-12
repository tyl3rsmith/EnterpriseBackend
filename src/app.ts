import express, { type Application, type Request, type Response } from 'express';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Converts icnoming JSON requests into JavaScript objects
app.use(express.json());

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Production-Grade API!" });
});

app.listen(PORT, () => {
  console.log(`Server now running on http://localhost:${PORT}`);
});