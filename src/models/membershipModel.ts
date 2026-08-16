import pool from "../config/db.js";

export interface Membership {
    id: number,
    user_id: number,
    organization_id: number,
    role: 'OWNER' | 'ADMIN' | 'MEMBER',
    created_at: Date
}

export const getMembershipRole = async (user_id: number, organization_id: number): Promise<'OWNER' | 'ADMIN' | 'MEMBER' | null> => {
    const result = await pool.query(
        `SELECT role FROM memberships
        WHERE user_id = $1 AND organization_id = $2`,
        [user_id, organization_id]
    );
    return result.rows[0]?.role ?? null;
}

export const getMembershipByUserAndOrganization = async (user_id: number, organization_id: number): Promise<'OWNER' | 'ADMIN' | 'MEMBER' | null> => {
    const result = await pool.query(
        `SELECT * FROM memberhips
        WHERE user_id = $1 AND organization_id = $2`,
        [user_id, organization_id]
    )

    return result.rows[0]?.role ?? null;
}