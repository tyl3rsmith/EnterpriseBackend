import { type Response } from 'express';
import { type AuthenticatedRequest } from "../middleware/authMiddleware.js"
import { createOrganizationDocument, getOrganizationDocuments, deleteOrganizationDocument } from '../models/documentModel.js';

// Create a document (only owner/admins can do this)
export const createOrganizationDocumentController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const organizationId = Number(req.params.organizationId);
        const { title, content } = req.body;

        if (!title) {
            res.status(400).json({ error: "Title is a required field."})
            return;
        }

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            res.status(400).json({ error: "Invalid organization ID." });
            return;
        }

        const document = await createOrganizationDocument(organizationId, title, content);
        res.status(201).json({ message: "Document created successfully", document});
    } catch (error) {
        res.status(500).json({ error: "Failed to create document" });
    }
};

// View documents (only valid members of the org can view)
export const getOrganizationDocumentsController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const organizationId = Number(req.params.organizationId);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            res.status(400).json({ error: "Invalid organization ID." });
            return;
        }

        const documents = await getOrganizationDocuments(organizationId);

        res.status(200).json({ documents })
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch documents" })
    }
};

// Delete documents (only owmer can do this)
export const deleteOrganizationDocumentController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const documentId = Number(req.params.documentId);
        const organizationId = Number(req.params.organizationId);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            res.status(400).json({ error: "Invalid organization ID." });
            return;
        }

        if (!Number.isInteger(documentId) || documentId <= 0) {
            res.status(400).json({ error: "Invalid document ID." });
            return;
        }

        const deleted = await deleteOrganizationDocument(documentId, organizationId);

        if (!deleted) {
            res.status(404).json({ error: "Document not found."});
            return;
        }

        res.status(200).json({ message: "Document deleted successfully"})
    } catch (error) {
        res.status(500).json({ error: "Failed to delete document" })
    }
};