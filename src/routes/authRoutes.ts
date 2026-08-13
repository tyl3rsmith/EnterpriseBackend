import { Router } from "express";
import { signUp } from "../controllers/authController.js";

const router = Router();

// Route for user sign-up
router.post("/signup", signUp);

export default router;