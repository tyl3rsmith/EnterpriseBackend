import { type Response } from 'express';
import { type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { createOrganization, addUserToOrganization } from '../models/organizationModel.js';
import { getMembershipRole } from '../models/membershipModel.js';
import { findUserByEmail } from '../models/userModel.js';

export const createOrganizationController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name } = req.body; 
        const userId = req.user!.userId // Grabs the user ID from our middleware token check

        if (!name) {
            return res.status(400).json({ error: "Organization name is required." });
        }

        // Insert the new organization into the database
        const organization = await createOrganization(name, userId);

        res.status(201).json({ message: "Organization created successfully.", organization });

    } catch (error) {  
        console.error("Error creating organization:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

export const inviteUserToOrganizationController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const organizationId = Number(req.params.organizationId); // Grabs the organization ID from the URL parameters
        const userId = req.user!.userId;
        const { email, role } = req.body;

        // validate input
        if (!email || !role) {
            res.status(400).json({ error: "Email and role are required." });
            return;
        }

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            res.status(400).json({ error: "Invalid organization ID." });
            return;
        }
        
        // Validate role
        if (!['ADMIN', 'MEMBER'].includes(role)) {
            res.status(400).json({ error: "Invalid role. Must be 'ADMIN' or 'MEMBER'." });
            return;
        }
        
        // verify that the user is authenticated
        const membershipRole = await getMembershipRole(userId, organizationId);

        if (!membershipRole) {
            res.status(403).json({ error: "You are not a member of this organization." });
            return;
        }

        if (membershipRole !== 'OWNER' && membershipRole !== 'ADMIN') {
            res.status(403).json({ error: "You do not have permission to invite users to this organization." });
            return;
        }

        const userToInvite = await findUserByEmail(email);

        if (!userToInvite) {
            res.status(404).json({ error: "User with the provided email does not exist." });
            return;
        }

        const invitedUserId = userToInvite.id;

        // add user to organization with the specified role
        await addUserToOrganization(invitedUserId, organizationId, role as 'ADMIN' | 'MEMBER');

        res.status(200).json({ message: `User with email ${email} has been invited to the organization as ${role}.` });
        return;

    } catch (error) {
        console.error("Error inviting user to organization:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};