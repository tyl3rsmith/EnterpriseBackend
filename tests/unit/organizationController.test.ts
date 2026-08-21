import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../src/middleware/authMiddleware.js";
import { createOrganizationController, inviteUserToOrganizationController } from "../../src/controllers/orgController.js";
import { createOrganization, addUserToOrganization } from "../../src/models/organizationModel.js";
import { getMembershipRole } from "../../src/models/membershipModel.js";
import { findUserByEmail } from "../../src/models/userModel.js";

vi.mock("../../src/models/organizationModel.js", () => ({
    createOrganization: vi.fn(),
    addUserToOrganization: vi.fn(),
}));

vi.mock("../../src/models/membershipModel.js", () => ({
    getMembershipRole: vi.fn(),
}));

vi.mock("../../src/models/userModel.js", () => ({
    findUserByEmail: vi.fn(),
}));

describe("Organization Controllers", () => {
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

    describe("createOrganizationController", () => {
        it("should create an organization successfully", async () => {
            req.body = {
                name: "Test Organization",
            };

            const organization = {
                id: 1,
                name: "Test Organization",
                created_by_user_id: 1,
                created_at: new Date(),
            };

            vi.mocked(createOrganization).mockResolvedValue(
                organization
            );

            await createOrganizationController(req, res);

            expect(createOrganization).toHaveBeenCalledWith(
                "Test Organization",
                1
            );

            expect(res.status).toHaveBeenCalledWith(201);

            expect(res.json).toHaveBeenCalledWith({
                message: "Organization created successfully.",
                organization,
            });
        });

        it("should reject organization creation when name is missing", async () => {
            req.body = {};

            await createOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Organization name is required.",
            });

            expect(createOrganization).not.toHaveBeenCalled();
        });

        it("should return 500 when organization creation fails", async () => {
            req.body = {
                name: "Test Organization",
            };

            vi.mocked(createOrganization).mockRejectedValue(
                new Error("Database error")
            );

            await createOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                error: "Internal server error.",
            });
        });
    });


    describe("inviteUserToOrganizationController", () => {
        it("should successfully invite a user as MEMBER", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "invited@example.com",
                role: "MEMBER",
            };

            vi.mocked(getMembershipRole).mockResolvedValue("OWNER");

            vi.mocked(findUserByEmail).mockResolvedValue({
                id: 2,
                username: "inviteduser",
                email: "invited@example.com",
                password: "hashed-password",
                created_at: new Date(),
            });

            vi.mocked(addUserToOrganization).mockResolvedValue();

            await inviteUserToOrganizationController(req, res);

            expect(getMembershipRole).toHaveBeenCalledWith(
                1,
                1
            );

            expect(findUserByEmail).toHaveBeenCalledWith(
                "invited@example.com"
            );

            expect(addUserToOrganization).toHaveBeenCalledWith(
                2,
                1,
                "MEMBER"
            );

            expect(res.status).toHaveBeenCalledWith(200);

            expect(res.json).toHaveBeenCalledWith({
                message:
                    "User with email invited@example.com has been invited to the organization as MEMBER.",
            });
        });

        it("should successfully invite a user as ADMIN", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "admin@example.com",
                role: "ADMIN",
            };

            vi.mocked(getMembershipRole).mockResolvedValue("OWNER");

            vi.mocked(findUserByEmail).mockResolvedValue({
                id: 2,
                username: "adminuser",
                email: "admin@example.com",
                password: "hashed-password",
                created_at: new Date(),
            });

            vi.mocked(addUserToOrganization).mockResolvedValue();

            await inviteUserToOrganizationController(req, res);

            expect(addUserToOrganization).toHaveBeenCalledWith(
                2,
                1,
                "ADMIN"
            );

            expect(res.status).toHaveBeenCalledWith(200);

            expect(res.json).toHaveBeenCalledWith({
                message:
                    "User with email admin@example.com has been invited to the organization as ADMIN.",
            });
        });

        it("should reject an invitation when email is missing", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                role: "MEMBER",
            };

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Email and role are required.",
            });

            expect(getMembershipRole).not.toHaveBeenCalled();
            expect(findUserByEmail).not.toHaveBeenCalled();
            expect(addUserToOrganization).not.toHaveBeenCalled();
        });

        it("should reject an invitation when role is missing", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "user@example.com",
            };

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Email and role are required.",
            });

            expect(getMembershipRole).not.toHaveBeenCalled();
            expect(findUserByEmail).not.toHaveBeenCalled();
            expect(addUserToOrganization).not.toHaveBeenCalled();
        });

        it("should reject an invalid organization ID", async () => {
            req.params = {
                organizationId: "abc",
            };

            req.body = {
                email: "user@example.com",
                role: "MEMBER",
            };

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(getMembershipRole).not.toHaveBeenCalled();
        });

        it("should reject a zero organization ID", async () => {
            req.params = {
                organizationId: "0",
            };

            req.body = {
                email: "user@example.com",
                role: "MEMBER",
            };

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(getMembershipRole).not.toHaveBeenCalled();
        });

        it("should reject a negative organization ID", async () => {
            req.params = {
                organizationId: "-1",
            };

            req.body = {
                email: "user@example.com",
                role: "MEMBER",
            };

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid organization ID.",
            });

            expect(getMembershipRole).not.toHaveBeenCalled();
        });

        it("should reject an invalid role", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "user@example.com",
                role: "OWNER",
            };

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid role. Must be 'ADMIN' or 'MEMBER'.",
            });

            expect(getMembershipRole).not.toHaveBeenCalled();
            expect(findUserByEmail).not.toHaveBeenCalled();
            expect(addUserToOrganization).not.toHaveBeenCalled();
        });

        it("should reject a user who is not a member of the organization", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "user@example.com",
                role: "MEMBER",
            };

            vi.mocked(getMembershipRole).mockResolvedValue(null);

            await inviteUserToOrganizationController(req, res);

            expect(getMembershipRole).toHaveBeenCalledWith(
                1,
                1
            );

            expect(res.status).toHaveBeenCalledWith(403);

            expect(res.json).toHaveBeenCalledWith({
                error: "You are not a member of this organization.",
            });

            expect(findUserByEmail).not.toHaveBeenCalled();
            expect(addUserToOrganization).not.toHaveBeenCalled();
        });

        it("should reject a MEMBER trying to invite a user", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "user@example.com",
                role: "MEMBER",
            };

            vi.mocked(getMembershipRole).mockResolvedValue("MEMBER");

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(403);

            expect(res.json).toHaveBeenCalledWith({
                error:
                    "You do not have permission to invite users to this organization.",
            });

            expect(findUserByEmail).not.toHaveBeenCalled();
            expect(addUserToOrganization).not.toHaveBeenCalled();
        });

        it("should allow an ADMIN to invite a user", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "user@example.com",
                role: "MEMBER",
            };

            vi.mocked(getMembershipRole).mockResolvedValue("ADMIN");

            vi.mocked(findUserByEmail).mockResolvedValue({
                id: 2,
                username: "newuser",
                email: "user@example.com",
                password: "hashed-password",
                created_at: new Date(),
            });

            vi.mocked(addUserToOrganization).mockResolvedValue();

            await inviteUserToOrganizationController(req, res);

            expect(getMembershipRole).toHaveBeenCalledWith(
                1,
                1
            );

            expect(findUserByEmail).toHaveBeenCalledWith(
                "user@example.com"
            );

            expect(addUserToOrganization).toHaveBeenCalledWith(
                2,
                1,
                "MEMBER"
            );

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("should return 404 when the invited user does not exist", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "unknown@example.com",
                role: "MEMBER",
            };

            vi.mocked(getMembershipRole).mockResolvedValue("OWNER");

            vi.mocked(findUserByEmail).mockResolvedValue(null);

            await inviteUserToOrganizationController(req, res);

            expect(findUserByEmail).toHaveBeenCalledWith(
                "unknown@example.com"
            );

            expect(res.status).toHaveBeenCalledWith(404);

            expect(res.json).toHaveBeenCalledWith({
                error: "User with the provided email does not exist.",
            });

            expect(addUserToOrganization).not.toHaveBeenCalled();
        });

        it("should return 500 when getting membership role fails", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "user@example.com",
                role: "MEMBER",
            };

            vi.mocked(getMembershipRole).mockRejectedValue(
                new Error("Database error")
            );

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                error: "Internal server error.",
            });
        });

        it("should return 500 when finding the invited user fails", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "user@example.com",
                role: "MEMBER",
            };

            vi.mocked(getMembershipRole).mockResolvedValue("OWNER");

            vi.mocked(findUserByEmail).mockRejectedValue(
                new Error("Database error")
            );

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                error: "Internal server error.",
            });
        });

        it("should return 500 when adding the user to the organization fails", async () => {
            req.params = {
                organizationId: "1",
            };

            req.body = {
                email: "user@example.com",
                role: "MEMBER",
            };

            vi.mocked(getMembershipRole).mockResolvedValue("OWNER");

            vi.mocked(findUserByEmail).mockResolvedValue({
                id: 2,
                username: "newuser",
                email: "user@example.com",
                password: "hashed-password",
                created_at: new Date(),
            });

            vi.mocked(addUserToOrganization).mockRejectedValue(
                new Error("Database error")
            );

            await inviteUserToOrganizationController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                error: "Internal server error.",
            });
        });
    });
});