import pool from "../config/db.js";

export interface Document {
    id: number,
    organization_id: number,
    title: string,
    content: string | null,
    created_at: Date
}

export const createOrganizationDocument = async (organizationId: number, title: string, content: string): Promise<Document> => {
    const result = await pool.query(
        `INSERT INTO documents
        (organization_id, title, content)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [organizationId, title, content]
    );

    return result.rows[0];
}

export const getOrganizationDocuments = async (organizationId: number): Promise<Document[]> => {
    const result = await pool.query(
        `SELECT *
        FROM documents
        WHERE organization_id = $1`,
        [organizationId]
    );

    return result.rows;
}

export const deleteOrganizationDocument = async (documentId: number, organizationId: number): Promise<boolean> => {
    const result = await pool.query(
        `DELETE FROM documents
        WHERE id = $1 AND organization_id = $2`,
        [documentId, organizationId]
    );

    return result.rowCount !== null && result.rowCount > 0;
}
