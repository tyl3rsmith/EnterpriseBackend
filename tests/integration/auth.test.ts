import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import jwt from "jsonwebtoken";

describe("Authentication", () => {
    describe("POST /api/auth/signup", () => {
        it("should create a new user", async () => {
            const response = await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser",
                    email: "test@example.com",
                    password: "password123",
                });
            
            expect(response.statusCode).toBe(201);

            expect(response.body.newUser).toHaveProperty("id");
            expect(response.body.newUser).toHaveProperty(
                "username",
                "testuser"
            );
            expect(response.body.newUser).toHaveProperty(
                "email",
                "test@example.com"
            );
            expect(response.body.newUser).toHaveProperty("created_at");

            expect(response.body.newUser).not.toHaveProperty("password");
        });

        it("should reject signup when required fields are missing", async () => {
            const response = await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser",
                });
            
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty( "error", "Username, email, and password are required." );
        });

        it("should reject a duplicate username", async () => {
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser",
                    email: "first@example.com",
                    password: "password123",
                });

            const response = await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser",
                    email: "second@example.com",
                    password: "password456",
                });
                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty( "error", "User already exists." );         
        });

        it("should reject a duplicate email", async () => {
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser1",
                    email: "test@example.com",
                    password: "password123",
                });

            const response = await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser2",
                    email: "test@example.com",
                    password: "password456",
                });
                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty( "error", "User already exists." );         
        });
    });

    describe("POST /api/auth/signin", () => {
        it("should signin with valid credentials", async () => {
            // first signup a user
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser",
                    email: "test@example.com",
                    password: "password123",
                });
            
            const response = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "testuser",
                    password: "password123"
                });
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("message", "Sign in successful." );  
            expect(response.body).toHaveProperty("token"); 
            expect(typeof response.body.token).toBe("string");
            expect(response.body.user).toHaveProperty("id"); 
            expect(response.body.user).toHaveProperty("username", "testuser");
            expect(response.body.user).toHaveProperty("email", "test@example.com");  
            expect(response.body.user).not.toHaveProperty("password");
        });

        it("should reject an incorrect password", async () => {
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser",
                    email: "test@example.com",
                    password: "password123",
                });
            
            const response = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "testuser",
                    password: "wrongpassword"
                });

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty("error", "Invalid username or password.");
        });

        it ("should reject a nonexistent user", async () => {
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser",
                    email: "test@example.com",
                    password: "password123",
                });
            
            const response = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "wrongusername",
                    password: "password123"
                });

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty("error", "Invalid username or password.");
        });

        it("should reject signin when required fields are missing", async () => {
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser",
                    email: "test@example.com",
                    password: "password123"
                });
            
            const responseA = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "testuser"
                });
            
            expect(responseA.statusCode).toBe(400);
            expect(responseA.body).toHaveProperty("error", "Username and password are required.");

            const responseB = await request(app)
                .post("/api/auth/signin")
                .send({
                    password: "password123"
                });
            
            expect(responseB.statusCode).toBe(400);
            expect(responseB.body).toHaveProperty("error", "Username and password are required.");
            
        });
    });

    describe("Protected Route", () => {
        it("should access a protected route with a valid JWT", async () => {
            // sign up a user
            await request(app)
                .post("/api/auth/signup")
                .send({
                    username: "testuser",
                    email: "test@example.com",
                    password: "password123"
                });
            
            // sign in this user
            const signInResponse = await request(app)
                .post("/api/auth/signin")
                .send({
                    username: "testuser",
                    password: "password123"
                });
            
            // should give us a valid jwt
            const jwt = signInResponse.body.token;

            // try to access a protected route
            const response = await request(app)
                .get("/api/org/create")
                .set("Authorization", `Bearer ${jwt}`);
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("message", "Organization creation endpoint is working!");
        });

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

        it("should reject access without a JWT", async () => {
            const response = await request(app).get("/api/org/create");

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty("error", "Access denied. No token provided.");
        });

        it("should reject an invalid JWT", async () => {
            const response = await request(app)
                .get("/api/org/create")
                .set("Authorization", `Bearer invalid-jwt`);

            expect(response.statusCode).toBe(403);
            expect(response.body).toHaveProperty("error", "Invalid or expired token.");
        });
    })
});
