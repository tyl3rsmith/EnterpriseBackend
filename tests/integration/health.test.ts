import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js"

describe("Health Check", () => {
    it("should return the api welcome message", async () => {
        const response = await request(app).get('/');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Welcome to the Production-Grade API!" })
    });

    it("should return the signup endpoint health check", async () => {
        const response = await request(app).get("/api/auth/signup");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Sign-up endpoint is working!" });
    });

    it("should return the signin endpoint health check", async () => {
        const response = await request(app).get("/api/auth/signin");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Sign-in endpoint is working!" });
    });
});
