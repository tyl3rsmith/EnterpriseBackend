import { type Response } from 'express';
import pool from '../config/db.js';
import { type AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const createOrganization = async (req: AuthenticatedRequest, res: Response) => {
    const client = await pool.connect();

    try {
        const { name } = req.body; 
        const userId = req.user?.userId // Grabs the user ID from our middleware token check

        if (!name) {
            return res.status(400).json({ error: "Organization name is required." });
        }

        // Start a transaction
        await client.query('BEGIN');

        // Insert the new organization into the database
        const orgResult = await client.query(
            `INSERT INTO organizations (name, created_by_user_id)
            VALUES ($1, $2)
            RETURNING id, name, created_by_user_id, created_at`,
            [name, userId]
        );

        const newOrganization = orgResult.rows[0];
        const orgId = newOrganization.id;

        // insert into membership table to link user to organization
        await client.query(
            `INSERT INTO memberships (user_id, organization_id, role)
            VALUES ($1, $2, 'OWNER')`,
            [userId, orgId]
        );

        // Commit the transaction
        await client.query('COMMIT');

        res.status(201).json(
            { message: "Organization created successfully.", organization: newOrganization }
        );
    } catch (error) {  
        await client.query('ROLLBACK'); // Rollback the transaction in case of error
        console.error("Error creating organization:", error);
        res.status(500).json({ error: "Internal server error." });
    } finally {
        client.release(); // Release the client back to the pool
    }
};