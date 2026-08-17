// Role Based Access Control (RBAC) middleware
import { type Response, type NextFunction } from 'express';
import { type AuthenticatedRequest } from './authMiddleware.js';
import { getMembershipRole } from '../models/membershipModel.js';

type Role = "OWNER" | "ADMIN" | "MEMBER";

export const requireRole = (allowedRoles: Role[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const organizationId = Number(req.params.organizationId);
            const userId = req.user?.userId;

            if (!Number.isInteger(organizationId) || organizationId <= 0) {
                res.status(400).json({ error: "Invalid organization ID." });
                return;
            }

            if (!userId) {
                res.status(401).json({ error: "Unauthorized." });
                return;
            }

            // check membership role of the user for the given organization
            const membershipRole = await getMembershipRole(userId, organizationId);

            if (!membershipRole) {
                res.status(403).json({ error: "You are not a member of this organization." });
                return;
            }

            // verify user role is in the allowed list
            if (!allowedRoles.includes(membershipRole)) {
                res.status(403).json({ error: `Access denied. Your role (${membershipRole}) does not have permission to do this.`})
                return;
            }

            // passed all verification checks we can move forward
            next();

        } catch (error) {
            console.error("RBAC Middleware Error:", error);
            res.status(500).json({ error: "An internal server security check error occurred."})
        }
    }
};