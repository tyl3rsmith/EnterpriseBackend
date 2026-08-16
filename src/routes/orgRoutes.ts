import { Router } from "express";
import { createOrganizationController, inviteUserToOrganizationController } from "../controllers/orgController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Protected route for creating a new organization
router.post("/create", authenticateToken, createOrganizationController);
router.get("/create", authenticateToken, (req, res) => {
    res.status(200).json({ message: "Organization creation endpoint is working!" });
});

// Protected route for inviting a user to an organization
router.post("/:organizationId/invite", authenticateToken, inviteUserToOrganizationController);

export default router;