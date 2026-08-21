import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../src/middleware/authMiddleware.js";
import { createOrganizationDocumentController, getOrganizationDocumentsController, deleteOrganizationDocumentController } from "../../src/controllers/documentController.js";
import { createOrganizationDocument, getOrganizationDocuments, deleteOrganizationDocument } from "../../src/models/documentModel.js";

vi.mock("../../src/models/documentModel.js", () => ({
    createOrganizationDocument: vi.fn(),
    getOrganizationDocuments: vi.fn(),
    deleteOrganizationDocument: vi.fn(),
}));

describe("Document Controllers", () => {
    let req: AuthenticatedRequest;
    let res: Response;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            params: {},
            body: {},
            user: {
                userId: 1,
                username: "testuser",
            },
        } as AuthenticatedRequest;

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        } as unknown as Response;
    });

    describe("createOrganizationDocumentController", () => {
        it("should create a document successfully", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                title: "Test Document",
                content: "This is test content.",
            };

            const document = {
                id: 1,
                organization_id: 1,
                title: "Test Document",
                content: "This is test content.",
                created_at: new Date(),
            };

            vi.mocked(createOrganizationDocument).mockResolvedValue(
                document
            );

            await createOrganizationDocumentController(req, res);

            expect(createOrganizationDocument).toHaveBeenCalledWith(
                1,
                "Test Document",
                "This is test content."
            );

            expect(res.status).toHaveBeenCalledWith(201);

            expect(res.json).toHaveBeenCalledWith({
                message: "Document created successfully",
                document,
            });
        });

        it("should reject document creation when title is missing", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                content: "This is test content.",
            };

            await createOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Title is a required field.",
            });

            expect(createOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should reject document creation with an invalid organization ID", async () => {
            req.params = {
                organizationId: "abc",
            };

            req.body = {
                title: "Test Document",
                content: "This is test content.",
            };

            await createOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(createOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should reject document creation with a zero organization ID", async () => {
            req.params = {
                organizationId: "0",
            };

            req.body = {
                title: "Test Document",
                content: "This is test content.",
            };

            await createOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(createOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should reject document creation with a negative organization ID", async () => {
            req.params = {
                organizationId: "-1",
            };

            req.body = {
                title: "Test Document",
                content: "This is test content.",
            };

            await createOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(createOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should return 500 when document creation fails", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                title: "Test Document",
                content: "This is test content.",
            };

            vi.mocked(createOrganizationDocument).mockRejectedValue(
                new Error("Database error")
            );

            await createOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                error: "Failed to create document",
            });
        });
    });

    describe("getOrganizationDocumentsController", () => {
        it("should return all organization documents", async () => {
            req.params = {
                organizationId: "1",
            };

            const documents = [
                {
                    id: 1,
                    organization_id: 1,
                    title: "Document One",
                    content: "Content One",
                    created_at: new Date(),
                },
                {
                    id: 2,
                    organization_id: 1,
                    title: "Document Two",
                    content: "Content Two",
                    created_at: new Date(),
                },
            ];

            vi.mocked(getOrganizationDocuments).mockResolvedValue(
                documents
            );

            await getOrganizationDocumentsController(req, res);

            expect(getOrganizationDocuments).toHaveBeenCalledWith(1);

            expect(res.status).toHaveBeenCalledWith(200);

            expect(res.json).toHaveBeenCalledWith({
                documents,
            });
        });

        it("should return an empty array when the organization has no documents", async () => {
            req.params = {
                organizationId: "1",
            };

            vi.mocked(getOrganizationDocuments).mockResolvedValue([]);

            await getOrganizationDocumentsController(req, res);

            expect(getOrganizationDocuments).toHaveBeenCalledWith(1);

            expect(res.status).toHaveBeenCalledWith(200);

            expect(res.json).toHaveBeenCalledWith({
                documents: [],
            });
        });

        it("should reject an invalid organization ID", async () => {
            req.params = {
                organizationId: "abc",
            };

            await getOrganizationDocumentsController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(getOrganizationDocuments).not.toHaveBeenCalled();
        });

        it("should reject a zero organization ID", async () => {
            req.params = {
                organizationId: "0",
            };

            await getOrganizationDocumentsController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(getOrganizationDocuments).not.toHaveBeenCalled();
        });

        it("should reject a negative organization ID", async () => {
            req.params = {
                organizationId: "-1",
            };

            await getOrganizationDocumentsController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(getOrganizationDocuments).not.toHaveBeenCalled();
        });

        it("should return 500 when fetching documents fails", async () => {
            req.params = {
                organizationId: "1",
            };

            vi.mocked(getOrganizationDocuments).mockRejectedValue(
                new Error("Database error")
            );

            await getOrganizationDocumentsController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                error: "Failed to fetch documents",
            });
        });
    });

    describe("deleteOrganizationDocumentController", () => {
        it("should delete a document successfully", async () => {
            req.params = {
                organizationId: "1",
                documentId: "10",
            };

            vi.mocked(deleteOrganizationDocument).mockResolvedValue(true);

            await deleteOrganizationDocumentController(req, res);

            expect(deleteOrganizationDocument).toHaveBeenCalledWith(
                10,
                1
            );

            expect(res.status).toHaveBeenCalledWith(200);

            expect(res.json).toHaveBeenCalledWith({
                message: "Document deleted successfully",
            });
        });

        it("should return 404 when the document does not exist", async () => {
            req.params = {
                organizationId: "1",
                documentId: "10",
            };

            vi.mocked(deleteOrganizationDocument).mockResolvedValue(false);

            await deleteOrganizationDocumentController(req, res);

            expect(deleteOrganizationDocument).toHaveBeenCalledWith(
                10,
                1
            );

            expect(res.status).toHaveBeenCalledWith(404);

            expect(res.json).toHaveBeenCalledWith({
                error: "Document not found.",
            });
        });

        it("should reject an invalid organization ID", async () => {
            req.params = {
                organizationId: "abc",
                documentId: "10",
            };

            await deleteOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(deleteOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should reject a zero organization ID", async () => {
            req.params = {
                organizationId: "0",
                documentId: "10",
            };

            await deleteOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(deleteOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should reject a negative organization ID", async () => {
            req.params = {
                organizationId: "-1",
                documentId: "10",
            };

            await deleteOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(deleteOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should reject an invalid document ID", async () => {
            req.params = {
                organizationId: "1",
                documentId: "abc",
            };

            await deleteOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid document ID.",
            });

            expect(deleteOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should reject a zero document ID", async () => {
            req.params = {
                organizationId: "1",
                documentId: "0",
            };

            await deleteOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid document ID.",
            });

            expect(deleteOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should reject a negative document ID", async () => {
            req.params = {
                organizationId: "1",
                documentId: "-1",
            };

            await deleteOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid document ID.",
            });

            expect(deleteOrganizationDocument).not.toHaveBeenCalled();
        });

        it("should return 500 when deleting a document fails", async () => {
            req.params = {
                organizationId: "1",
                documentId: "10",
            };

            vi.mocked(deleteOrganizationDocument).mockRejectedValue(
                new Error("Database error")
            );

            await deleteOrganizationDocumentController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                error: "Failed to delete document",
            });
        });
    });
});