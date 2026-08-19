import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js"

describe("Health Check", () => {
    it("should return the api welcome message", async () => {
        const response = await request(app).get('/');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Welcome to the Production-Grade API!" })
    });
});
