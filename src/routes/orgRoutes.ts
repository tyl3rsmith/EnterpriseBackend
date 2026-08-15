import { Router } from "express";
import { createOrganization } from "../controllers/orgController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Protected route for creating a new organization
router.post("/create", authenticateToken, createOrganization);

export default router;