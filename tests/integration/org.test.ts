import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import jwt from "jsonwebtoken";

describe("Organization Tests", () => {
    let ownerJWT: string;
    let ownerID: number;

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
        ownerJWT = signInResponse.body.token;
        ownerID = signUpResponse.body.newUser.id;
    });

    describe("POST /api/org/create", () => {
        it("should let authenticated users create an organization and give them the owner role", async () => {
            const response = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty("message", "Organization created successfully.");
            expect(response.body).toHaveProperty("organization");
            expect(response.body.organization).toHaveProperty("id");
            expect(response.body.organization).toHaveProperty("name", "My Organization");
            expect(response.body.organization).toHaveProperty("created_by_user_id", ownerID);
            expect(response.body.organization).toHaveProperty("created_at");
        });

        it("should reject unauthenticated users from creating an organization", async () => {
            const response = await request(app)
                .post("/api/org/create")
                .send({
                    name: "My Organization"
                });
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty("error", "Access denied. No token provided.");
        });

        it("should prevent users with an invalid JWT from creating an organization", async () => {
            const response = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer invalid`)
                .send({
                    name: "My Organization"
                });

                expect(response.statusCode).toBe(403);
                expect(response.body).toHaveProperty("error", "Invalid or expired token.");   
        });

        it("should prevent users from creating an organization without a name", async () => {
            const response = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({});
            
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("error", "Organization name is required.");  
        });

        it("should reject an organization with a duplicate name", async () => {
            await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });

            const response = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });

            expect(response.statusCode).toBe(500);
            expect(response.body).toHaveProperty("error", "Internal server error.");
        });

    });

    describe("POST /api/org/:organizationId/invite", () => {
        it("should reject an expired JWT", async () => {
            const token = jwt.sign(
                {
                    userId: 1,
                    username: "testuser",
                },
                process.env.JWT_SECRET as string,
                {
                    expiresIn: -1,
                }
            );

            const response = await request(app)
                .get("/api/org/create")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(403);
            expect(response.body).toHaveProperty(
                "error",
                "Invalid or expired token."
            );
        });

        it("should allow owners to invite users as MEMBER", async () => {
            // owner of org
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;
            
            // member of org
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "member",
                    email: "member@example.com",
                    password: "password123"
                });
            
            
            // invite the member to the org with owner's JWT
            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    email: "member@example.com",
                    role: "MEMBER"
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("message", "User with email member@example.com has been invited to the organization as MEMBER.");
        });

        it("should allow owners to invite users as ADMIN", async () => {
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;

            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "admin",
                    email: "admin@example.com",
                    password: "password123"
                });
            
            
            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    email: "admin@example.com",
                    role: "ADMIN"
                });
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("message", "User with email admin@example.com has been invited to the organization as ADMIN.");
        });

        it("should allow admins to invite users as MEMBER", async () => {
            // owner creates org
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;
            
            // login as the admin and obtain their JWT
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "admin",
                    email: "admin@example.com",
                    password: "password123"
                });
            
            const signInResponse = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "admin",
                    password: "password123"
                });
            
            const adminJWT = signInResponse.body.token;
                
            // first owner has to invite admin to the org
            await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    email: "admin@example.com",
                    role: "ADMIN"
                });
            
            // try to invite a coworker to the org as an admin it should succeed
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "coworker",
                    email: "coworker@example.com",
                    password: "password123"
                });
            
            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${adminJWT}`)
                .send({
                    email: "coworker@example.com",
                    role: "MEMBER"
                })

            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("message", "User with email coworker@example.com has been invited to the organization as MEMBER.");
        });

        it("should allow admins to invite users as ADMIN", async () => {
            // owner creates org
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;
            
            // login as the admin and obtain their JWT
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "admin",
                    email: "admin@example.com",
                    password: "password123"
                });
            
            const signInResponse = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "admin",
                    password: "password123"
                });
            
            const adminJWT = signInResponse.body.token;
                
            // first owner has to invite admin to the org
            await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    email: "admin@example.com",
                    role: "ADMIN"
                });
            
            // try to invite a coworker to the org as an admin it should succeed
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "coworker",
                    email: "coworker@example.com",
                    password: "password123"
                });
            
            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${adminJWT}`)
                .send({
                    email: "coworker@example.com",
                    role: "ADMIN"
                })

            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("message", "User with email coworker@example.com has been invited to the organization as ADMIN.");
        });
    
        it("should reject members from inviting coworkers to an org", async () => {
            // owner of org
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;
            
            // member of org
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "member",
                    email: "member@example.com",
                    password: "password123"
                });
            
            // sign in to obtain the member's JWT
            const signInResponse = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "member",
                    password: "password123"
                });
            
            const memberJWT = signInResponse.body.token;
            
            // invite the member to the org with owner's JWT
            await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    email: "member@example.com",
                    role: "MEMBER"
                });
            
            // now that we are a member create a mock coworker and try to invite them to the org with member level permissions it should fail
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "coworker",
                    email: "coworker@example.com",
                    password: "password123"
                });
            
            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${memberJWT}`)
                .send({
                    email: "coworker@example.com",
                    role: "MEMBER"
                });
            
            expect(response.statusCode).toBe(403);
            expect(response.body).toHaveProperty("error", "You do not have permission to invite users to this organization.");
        });

        it("should reject admins trying to invite coworkers as owners of an org", async () => {
            // owner creates org
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;
            
            // login as the admin and obtain their JWT
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "admin",
                    email: "admin@example.com",
                    password: "password123"
                });
            
            const signInResponse = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "admin",
                    password: "password123"
                });
            
            const adminJWT = signInResponse.body.token;
                
            // first owner has to invite admin to the org
            await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    email: "admin@example.com",
                    role: "ADMIN"
                });
            
            // try to invite a coworker to the org as an owner it should fail
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "coworker",
                    email: "coworker@example.com",
                    password: "password123"
                });
            
            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${adminJWT}`)
                .send({
                    email: "coworker@example.com",
                    role: "OWNER"
                })

            
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("error", "Invalid role. Must be 'ADMIN' or 'MEMBER'.");
        });

        it("should reject invalid requests without an email", async () => {
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;
            
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "member",
                    email: "member@example.com",
                    password: "password123"
                });
            
            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    role: "MEMBER"
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("error", "Email and role are required.");
        });

        it("should reject invalid requests without a role", async () => {
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;
            
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "member",
                    email: "member@example.com",
                    password: "password123"
                });
            
            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    email: "member@example.com"
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("error", "Email and role are required.");
        });

        it("should reject invalid organization ID", async () => {
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;
            
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "member",
                    email: "member@example.com",
                    password: "password123"
                });
            
            const response = await request(app)
                .post(`/api/org/-1/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    email: "member@example.com",
                    role: "MEMBER"
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty("error", "Invalid organization ID.");
        });

        it("should reject non members from inviting anyone to the org", async () => {
            // owner of org
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });
            
            const organizationId = createOrgResponse.body.organization.id;
            
            // nonmember
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "nonmember",
                    email: "nonmember@example.com",
                    password: "password123"
                });
            
            // sign in to obtain the member's JWT
            const signInResponse = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "nonmember",
                    password: "password123"
                });
            
            const nonMemberJWT = signInResponse.body.token;
            
            // create a mock coworker and try to invite them as a non member it should fail
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "coworker",
                    email: "coworker@example.com",
                    password: "password123"
                });
            
            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${nonMemberJWT}`)
                .send({
                    email: "coworker@example.com",
                    role: "MEMBER"
                });
            
            expect(response.statusCode).toBe(403);
            expect(response.body).toHaveProperty("error", "You are not a member of this organization.");
        });

        it("should reject inviting a user that does not exist", async () => {
            const createOrgResponse = await request(app)
                .post("/api/org/create")
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    name: "My Organization"
                });

            const organizationId = createOrgResponse.body.organization.id;

            const response = await request(app)
                .post(`/api/org/${organizationId}/invite`)
                .set("Authorization", `Bearer ${ownerJWT}`)
                .send({
                    email: "doesnotexist@example.com",
                    role: "MEMBER"
                });

            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty( "error", "User with the provided email does not exist." );
        });

        it("should reject unauthenticated users from inviting someone", async () => {
            const response = await request(app)
                .post("/api/org/1/invite")
                .send({
                    email: "member@example.com",
                    role: "MEMBER"
                });

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty("error", "Access denied. No token provided." );
        });

        it("should reject users with an invalid JWT", async () => {
            const response = await request(app)
                .post("/api/org/1/invite")
                .set("Authorization", "Bearer invalid")
                .send({
                    email: "member@example.com",
                    role: "MEMBER"
                });

            expect(response.statusCode).toBe(403);
            expect(response.body).toHaveProperty("error", "Invalid or expired token." );
        });
    });
});