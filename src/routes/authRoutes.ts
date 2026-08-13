import { Router } from "express";
import { signUp } from "../controllers/authController.js";
import { signIn } from "../controllers/authController.js";
import { authenticateToken, type AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router = Router();

// Route for user sign-up
router.post("/signup", signUp);

// Route for user sign-in
router.post("/signin", signIn);

router.get("/test", authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({ message: "You have accessed a protected route.", user: req.user });
});


export default router;