import { Router } from "express";
import { signUp } from "../controllers/authController.js";
import { signIn } from "../controllers/authController.js";

const router = Router();

// Route for user sign-up
router.post("/signup", signUp);

// Route for user sign-in
router.post("/signin", signIn);


export default router;