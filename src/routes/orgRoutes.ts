import { Router } from "express";
import { createOrganizationController } from "../controllers/orgController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Protected route for creating a new organization
router.post("/create", authenticateToken, createOrganizationController);
router.get("/create", authenticateToken, (req, res) => {
    res.status(200).json({ message: "Organization creation endpoint is working!" });
});

export default router;