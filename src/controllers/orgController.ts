import { type Response } from 'express';
import pool from '../config/db.js';
import { type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { createOrganization } from '../models/organizationModel.js';

export const createOrganizationController = async (req: AuthenticatedRequest, res: Response) => {
    const client = await pool.connect();

    try {
        const { name } = req.body; 
        const userId = req.user?.userId // Grabs the user ID from our middleware token check

        // Make sure user is authenticated
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized." });
        }

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