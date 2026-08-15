import { Router } from "express";
import { signUpController } from "../controllers/authController.js";
import { signInController } from "../controllers/authController.js";

const router = Router();

// Route for user sign-up
router.post("/signup", signUpController);
router.get("/signup", (req, res) => {
    res.status(200).json({ message: "Sign-up endpoint is working!" });
});

// Route for user sign-in
router.post("/signin", signInController);
router.get("/signin", (req, res) => {
    res.status(200).json({ message: "Sign-in endpoint is working!" });
});

export default router;