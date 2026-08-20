import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

describe("Organization Documents", () => {
    let jwt: string;
    let organizationId: number;

    beforeEach(async () => {
        // create a test user
        const signUpResponse = await request(app)
            .post("/api/auth/signup")
            .send({
                username: "documenttestuser",
                email: "documenttest@example.com",
                password: "password123"
            });
        
        expect(signUpResponse.statusCode).toBe(201);

        // signin to obtain a JWT
        const signInResponse = await request(app)
            .post("/api/auth/signin")
            .send({
                username: "documenttestuser",
                password: "password123"
            });
        
        expect(signInResponse.statusCode).toBe(200);
        jwt = signInResponse.body.token;

        // create an organization (authenticated with jwt)
        const organizationResponse = await request(app)
            .post("/api/org/create")
            .set("Authorization", `Bearer ${jwt}`)
            .send({
                name: "Test Organization"
            });
        
        expect(organizationResponse.statusCode).toBe(201);
        organizationId = organizationResponse.body.organization.id;
    });

    it("should reject a document without a title", async () => {
        const response = await request(app)
            .post(`/api/org/${organizationId}/documents`)
            .set("Authorization", `Bearer ${jwt}`)
            .send({
                content: "document without a title"
            });
        
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", "Title is a required field.");
    });

    it("should reject an invalid organization id", async () => {
        const response = await request(app)
            .post("/api/org/-1/documents")
            .set("Authorization", `Bearer ${jwt}`)
            .send({
                title: "Document Title",
                content: "This is a test document"
            });
    
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", "Invalid organization ID.");
    });

    it("should reject creating a document without authorization", async () => {
        const response = await request(app)
            .post(`/api/org/${organizationId}/documents`)
            .send({
                title: "Document Title",
                content: "This is a test document"
            });
        
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error", "Access denied. No token provided.");
    });

    it("should allow owners of an org to create documents", async () => {
        const response = await request(app)
            .post(`/api/org/${organizationId}/documents`)
            .set("Authorization", `Bearer ${jwt}`)
            .send({
                title: "Document Title",
                content: "This is a test document"
            });  
        
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("message", "Document created successfully");
        expect(response.body).toHaveProperty("document");
        expect(response.body.document).toHaveProperty("organization_id", organizationId);
        expect(response.body.document).toHaveProperty("title", "Document Title");
        expect(response.body.document).toHaveProperty("content", "This is a test document");

    });

    it("should get organization documents", async () => {
        await request(app)
            .post(`/api/org/${organizationId}/documents`)
            .set("Authorization", `Bearer ${jwt}`)
            .send({
                title: "Document 1",
                content: "The first document."
            });
        
        await request(app)
            .post(`/api/org/${organizationId}/documents`)
            .set("Authorization", `Bearer ${jwt}`)
            .send({
                title: "Document 2",
                content: "The second document."
            });

        const response = await request(app)
            .get(`/api/org/${organizationId}/documents`)
            .set("Authorization", `Bearer ${jwt}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("documents");
        expect(response.body.documents.length).toBe(2);

        expect(response.body.documents[0]).toHaveProperty("title", "Document 1");
        expect(response.body.documents[0]).toHaveProperty("content", "The first document.");

        expect(response.body.documents[1]).toHaveProperty("title", "Document 2");
        expect(response.body.documents[1]).toHaveProperty("content", "The second document.");
    });

    it("should return an empty array when an organization has no documents", async () => {
        const response = await request(app)
            .get(`/api/org/${organizationId}/documents`)
            .set("Authorization", `Bearer ${jwt}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("documents");
        expect(response.body.documents).toEqual([]);
    })

    it("should allow an owner to delete a document", async () => {
        const documentOneResponse = await request(app)
            .post(`/api/org/${organizationId}/documents`)
            .set("Authorization", `Bearer ${jwt}`)
            .send({
                title: "Document 1",
                content: "The first document."
            });
        
        await request(app)
            .post(`/api/org/${organizationId}/documents`)
            .set("Authorization", `Bearer ${jwt}`)
            .send({
                title: "Document 2",
                content: "The second document."
            });
        
        const documentToDeleteId = documentOneResponse.body.document.id;
        
        const response = await request(app)
            .delete(`/api/org/${organizationId}/documents/${documentToDeleteId}`)
            .set("Authorization", `Bearer ${jwt}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message", "Document deleted successfully");

        const orgDocuments = await request(app)
            .get(`/api/org/${organizationId}/documents`)
            .set("Authorization", `Bearer ${jwt}`);
        
        expect(orgDocuments.body.documents.length).toBe(1);
        expect(orgDocuments.body.documents[0].id).not.toBe(documentToDeleteId);
    });

    it("should return 404 when trying to delete a document that doesn't exist", async () => {
        const response = await request(app)
            .delete(`/api/org/${organizationId}/documents/999999`)
            .set("Authorization", `Bearer ${jwt}`);
        
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty("error", "Document not found.");
    });

    it("should reject an invalid document id", async () => {
        const response = await request(app)
            .delete(`/api/org/${organizationId}/documents/-1`)
            .set("Authorization", `Bearer ${jwt}`);
        
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", "Invalid document ID.");
    });

    it("should reject getting documents without authentication", async () => {
        const response = await request(app)
            .get(`/api/org/${organizationId}/documents`);
        
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty("error", "Access denied. No token provided.");
    });
})