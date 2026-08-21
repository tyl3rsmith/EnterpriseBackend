import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { signUpController, signInController } from "../../src/controllers/authController.js";
import { createUser, findUserByEmail, findUserByUsername, findUserByEmailOrUsername } from "../../src/models/userModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// mock all user database functions for unit tests
vi.mock("../../src/models/userModel.js", () => ({
    findUserByEmailOrUsername: vi.fn(),
    createUser: vi.fn(),
    findUserByUsername: vi.fn(),
}));

vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn(),
    },
}));

vi.mock("jsonwebtoken", () => ({
    default: {
        sign: vi.fn(),
    },
}));

describe("Auth Controllers", () => {
    let req: Request;
    let res: Response;

    beforeEach(() => {
        vi.clearAllMocks();

        req = { body: {} } as Request;
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        } as unknown as Response;
    });

    it("should reject signup when required fields are missing", async () => {
        req.body = {
            username: "testuser",
        };

        await signUpController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            error: "Username, email, and password are required.",
        });

        expect(findUserByEmailOrUsername).not.toHaveBeenCalled();
        expect(createUser).not.toHaveBeenCalled();
    });

    it("should reject signup when user already exists", async () => {
        req.body = {
            username: "testuser",
            email: "test@example.com",
            password: "password123",
        };

        vi.mocked(findUserByEmailOrUsername).mockResolvedValue({
            id: 1,
        } as any);

        await signUpController(req, res);

        expect(findUserByEmailOrUsername).toHaveBeenCalledWith(
            "test@example.com",
            "testuser"
        );

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            error: "User already exists.",
        });

        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(createUser).not.toHaveBeenCalled();
    });

    it("should create a new user", async () => {
        req.body = {
            username: "testuser",
            email: "test@example.com",
            password: "password123",
        };

        vi.mocked(findUserByEmailOrUsername).mockResolvedValue(null);

        vi.mocked(bcrypt.hash).mockResolvedValue(
            "hashed-password" as never
        );

        vi.mocked(createUser).mockResolvedValue({
            id: 1,
            username: "testuser",
            email: "test@example.com",
            created_at: new Date(),
        });

        await signUpController(req, res);

        expect(findUserByEmailOrUsername).toHaveBeenCalledWith(
            "test@example.com",
            "testuser"
        );

        expect(bcrypt.hash).toHaveBeenCalledWith(
            "password123",
            10
        );

        expect(createUser).toHaveBeenCalledWith(
            "testuser",
            "test@example.com",
            "hashed-password"
        );

        expect(res.status).toHaveBeenCalledWith(201);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "User created successfully.",
                newUser: expect.objectContaining({
                    id: 1,
                    username: "testuser",
                    email: "test@example.com",
                }),
            })
        );
    });

    it("should return 500 when creating a user fails", async () => {
        req.body = {
            username: "testuser",
            email: "test@example.com",
            password: "password123",
        };

        vi.mocked(findUserByEmailOrUsername).mockRejectedValue(
            new Error("Database error")
        );

        await signUpController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            error: "Internal server error.",
        });
    });

    it("should reject signin when required fields are missing", async () => {
        req.body = {
            username: "testuser",
        };

        await signInController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            error: "Username and password are required.",
        });

        expect(findUserByUsername).not.toHaveBeenCalled();
    });

    it("should reject signin when user does not exist", async () => {
        req.body = {
            username: "unknown",
            password: "password123",
        };

        vi.mocked(findUserByUsername).mockResolvedValue(null);

        await signInController(req, res);

        expect(findUserByUsername).toHaveBeenCalledWith("unknown");

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid username or password.",
        });

        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should reject signin with an incorrect password", async () => {
        req.body = {
            username: "testuser",
            password: "wrongpassword",
        };

        vi.mocked(findUserByUsername).mockResolvedValue({
            id: 1,
            username: "testuser",
            email: "test@example.com",
            password: "hashed-password",
            created_at: new Date(),
        });

        vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

        await signInController(req, res);

        expect(bcrypt.compare).toHaveBeenCalledWith(
            "wrongpassword",
            "hashed-password"
        );

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid username or password.",
        });

        expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should signin successfully with valid credentials", async () => {
        req.body = {
            username: "testuser",
            password: "password123",
        };

        vi.mocked(findUserByUsername).mockResolvedValue({
            id: 1,
            username: "testuser",
            email: "test@example.com",
            password: "hashed-password",
            created_at: new Date(),
        });

        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

        vi.mocked(jwt.sign).mockReturnValue(
            "fake-jwt-token" as never
        );

        await signInController(req, res);

        expect(findUserByUsername).toHaveBeenCalledWith(
            "testuser"
        );

        expect(bcrypt.compare).toHaveBeenCalledWith(
            "password123",
            "hashed-password"
        );

        expect(jwt.sign).toHaveBeenCalledWith(
            {
                userId: 1,
                username: "testuser",
            },
            expect.any(String),
            {
                expiresIn: "2h",
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            message: "Sign in successful.",
            token: "fake-jwt-token",
            user: {
                id: 1,
                username: "testuser",
                email: "test@example.com",
            },
        });
    });

    it("should return 500 when signin encounters an error", async () => {
        req.body = {
            username: "testuser",
            password: "password123",
        };

        vi.mocked(findUserByUsername).mockRejectedValue(
            new Error("Database error")
        );

        await signInController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            error: "Internal server error.",
        });
    });
});