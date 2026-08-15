import { Router } from "express";
import { signUp } from "../controllers/authController.js";
import { signIn } from "../controllers/authController.js";

const router = Router();

// Route for user sign-up
router.post("/signup", signUp);
router.get("/signup", (req, res) => {
    res.status(200).json({ message: "Sign-up endpoint is working!" });
});

// Route for user sign-in
router.post("/signin", signIn);
router.get("/signin", (req, res) => {
    res.status(200).json({ message: "Sign-in endpoint is working!" });
});

export default router;