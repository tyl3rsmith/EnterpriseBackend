import { Router } from "express";
import { createOrganizationController, inviteUserToOrganizationController } from "../controllers/orgController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { createOrganizationDocumentController, getOrganizationDocumentsController, deleteOrganizationDocumentController } from "../controllers/documentController.js"
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

// health check endpoint
router.get(
    "/create",
    authenticateToken,
    (req, res) => { res.status(200).json({ message: "Organization creation endpoint is working!" });
});

// Protected route for creating a new organization
router.post(
    "/create",
    authenticateToken,
    createOrganizationController
);

// Protected route for inviting a user to an organization
router.post(
    "/:organizationId/invite",
    authenticateToken,
    inviteUserToOrganizationController
);


// route for org to create a document
// only owners and admins can do this
router.post(
    "/:organizationId/documents",
    authenticateToken,
    requireRole(["OWNER", "ADMIN"]),
    createOrganizationDocumentController
);

// route for org to view document
// any member can view
router.get(
    "/:organizationId/documents",
    authenticateToken,
    requireRole(["OWNER", "ADMIN", "MEMBER"]),
    getOrganizationDocumentsController
);

// route for org to delete document
// only the owner can do this
router.delete(
    "/:organizationId/documents/:documentId",
    authenticateToken,
    requireRole(["OWNER"]),
    deleteOrganizationDocumentController
);

export default router;