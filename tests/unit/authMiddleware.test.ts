import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response, NextFunction } from "express";
import { authenticateToken, type AuthenticatedRequest } from "../../src/middleware/authMiddleware.js";
import jwt from "jsonwebtoken";

vi.mock("jsonwebtoken", () => ({
    default: {
        verify: vi.fn(),
    },
}));

describe("Auth Middleware", () => {
    let req: AuthenticatedRequest;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            headers: {},
        } as AuthenticatedRequest;

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        } as unknown as Response;

        next = vi.fn();

        process.env.JWT_SECRET = "test-secret";
    });

    it("should return 401 when no authorization header is provided", () => {
        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            error: "Access denied. No token provided.",
        });

        expect(jwt.verify).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header does not contain a token", () => {
        req.headers.authorization = "Bearer";

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            error: "Access denied. No token provided.",
        });

        expect(jwt.verify).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("should authenticate a valid token", () => {
        req.headers.authorization = "Bearer valid-token";

        vi.mocked(jwt.verify).mockReturnValue({
            userId: 1,
            username: "testuser",
        } as any);

        authenticateToken(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(
            "valid-token",
            "test-secret"
        );

        expect(req.user).toEqual({
            userId: 1,
            username: "testuser",
        });

        expect(next).toHaveBeenCalled();

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("should return 403 when the token is invalid", () => {
        req.headers.authorization = "Bearer invalid-token";

        vi.mocked(jwt.verify).mockImplementation(() => {
            throw new Error("Invalid token");
        });

        authenticateToken(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(
            "invalid-token",
            "test-secret"
        );

        expect(res.status).toHaveBeenCalledWith(403);

        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid or expired token.",
        });

        expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 when the token is expired", () => {
        req.headers.authorization = "Bearer expired-token";

        vi.mocked(jwt.verify).mockImplementation(() => {
            throw new Error("TokenExpiredError");
        });

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);

        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid or expired token.",
        });

        expect(next).not.toHaveBeenCalled();
    });

    it("should use the JWT secret from environment variables", () => {
        req.headers.authorization = "Bearer valid-token";

        vi.mocked(jwt.verify).mockReturnValue({
            userId: 1,
            username: "testuser",
        } as any);

        process.env.JWT_SECRET = "my-test-secret";

        authenticateToken(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(
            "valid-token",
            "my-test-secret"
        );

        expect(next).toHaveBeenCalled();
    });

    it("should attach the decoded user information to req.user", () => {
        req.headers.authorization = "Bearer valid-token";

        vi.mocked(jwt.verify).mockReturnValue({
            userId: 42,
            username: "tyler",
        } as any);

        authenticateToken(req, res, next);

        expect(req.user).toEqual({
            userId: 42,
            username: "tyler",
        });

        expect(next).toHaveBeenCalled();
    });
});