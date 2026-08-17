import pool from "../config/db.js";

export interface Organization {
    id: number;
    name: string;
    created_by_user_id: number | null;
    created_at: Date;
}

export const createOrganization = async (name: string, userId: number): Promise<Organization> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert the new organization into the database
        const orgResult = await client.query(
            `INSERT INTO organizations (name, created_by_user_id)
            VALUES ($1, $2)
            RETURNING id, name, created_by_user_id, created_at`,
            [name, userId]
        );

        const organization = orgResult.rows[0];

        // Insert the user as the owner of the new organization
        await client.query(
            `INSERT INTO memberships (user_id, organization_id, role)
            VALUES ($1, $2, 'OWNER')`,
            [userId, organization.id]
        );

        await client.query('COMMIT');
        return organization;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error
    } finally {
        client.release();
    }
};

export const addUserToOrganization = async (userId: number, organizationId: number, role: 'ADMIN' | 'MEMBER'): Promise<void> => {
    const result = await pool.query(
        `INSERT INTO memberships (user_id, organization_id, role)
        VALUES ($1, $2, $3)`,
        [userId, organizationId, role]
    );
}