import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response, NextFunction } from "express";
import {
    requireRole,
} from "../../src/middleware/rbacMiddleware.js";
import type { AuthenticatedRequest } from "../../src/middleware/authMiddleware.js";
import { getMembershipRole } from "../../src/models/membershipModel.js";

vi.mock("../../src/models/membershipModel.js", () => ({
    getMembershipRole: vi.fn(),
}));

describe("RBAC Middleware", () => {
    let req: AuthenticatedRequest;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            params: {}
        } as unknown as AuthenticatedRequest;

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        } as unknown as Response;

        next = vi.fn();
    });

    it("should return 400 when organization ID is invalid", async () => {
        req.params = {
            organizationId: "invalid",
        };

        req.user = {
            userId: 1,
            username: "testuser",
        };

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid organization ID.",
        });

        expect(getMembershipRole).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when organization ID is zero", async () => {
        req.params = {
            organizationId: "0",
        };

        req.user = {
            userId: 1,
            username: "testuser",
        };

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid organization ID.",
        });

        expect(getMembershipRole).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when organization ID is negative", async () => {
        req.params = {
            organizationId: "-1",
        };

        req.user = {
            userId: 1,
            username: "testuser",
        };

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid organization ID.",
        });

        expect(getMembershipRole).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when organization ID is not an integer", async () => {
        req.params = {
            organizationId: "1.5",
        };

        req.user = {
            userId: 1,
            username: "testuser",
        };

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid organization ID.",
        });

        expect(getMembershipRole).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when the user is not authenticated", async () => {
        req.params = {
            organizationId: "1",
        };

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            error: "Unauthorized.",
        });

        expect(getMembershipRole).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 when the user is not a member of the organization", async () => {
        req.params = {
            organizationId: "1",
        };

        req.user = {
            userId: 1,
            username: "testuser",
        };

        vi.mocked(getMembershipRole).mockResolvedValue(null);

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(getMembershipRole).toHaveBeenCalledWith(1, 1);

        expect(res.status).toHaveBeenCalledWith(403);

        expect(res.json).toHaveBeenCalledWith({
            error: "You are not a member of this organization.",
        });

        expect(next).not.toHaveBeenCalled();
    });

    it("should allow access when the user has the OWNER role", async () => {
        req.params = {
            organizationId: "1",
        };

        req.user = {
            userId: 1,
            username: "owner",
        };

        vi.mocked(getMembershipRole).mockResolvedValue("OWNER");

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(getMembershipRole).toHaveBeenCalledWith(1, 1);

        expect(next).toHaveBeenCalled();

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("should allow access when the user has the ADMIN role", async () => {
        req.params = {
            organizationId: "1",
        };

        req.user = {
            userId: 2,
            username: "admin",
        };

        vi.mocked(getMembershipRole).mockResolvedValue("ADMIN");

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(getMembershipRole).toHaveBeenCalledWith(2, 1);

        expect(next).toHaveBeenCalled();

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("should reject a MEMBER when only OWNER and ADMIN are allowed", async () => {
        req.params = {
            organizationId: "1",
        };

        req.user = {
            userId: 3,
            username: "member",
        };

        vi.mocked(getMembershipRole).mockResolvedValue("MEMBER");

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(getMembershipRole).toHaveBeenCalledWith(3, 1);

        expect(res.status).toHaveBeenCalledWith(403);

        expect(res.json).toHaveBeenCalledWith({
            error: "Access denied. Your role (MEMBER) does not have permission to do this.",
        });

        expect(next).not.toHaveBeenCalled();
    });

    it("should allow access when MEMBER is an allowed role", async () => {
        req.params = {
            organizationId: "1",
        };

        req.user = {
            userId: 3,
            username: "member",
        };

        vi.mocked(getMembershipRole).mockResolvedValue("MEMBER");

        const middleware = requireRole(["MEMBER"]);

        await middleware(req, res, next);

        expect(getMembershipRole).toHaveBeenCalledWith(3, 1);

        expect(next).toHaveBeenCalled();

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("should return 500 when getMembershipRole throws an error", async () => {
        req.params = {
            organizationId: "1",
        };

        req.user = {
            userId: 1,
            username: "testuser",
        };

        vi.mocked(getMembershipRole).mockRejectedValue(
            new Error("Database error")
        );

        const middleware = requireRole(["OWNER", "ADMIN"]);

        await middleware(req, res, next);

        expect(getMembershipRole).toHaveBeenCalledWith(1, 1);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            error: "An internal server security check error occurred.",
        });

        expect(next).not.toHaveBeenCalled();
    });
});