# Enterprise Backend API

A backend REST API built with **Node.js, Express, TypeScript, and PostgreSQL**. The application provides user authentication using JSON Web Tokens (JWT), secure password hashing, organization management with role-based memberships, and organization document management.

## Features

* User registration and authentication
* Password hashing with bcrypt
* JWT-based authentication
* Protected API routes
* PostgreSQL database
* User and organization models
* Organization creation
* Organization memberships
* Role-based organization access

  * `OWNER`
  * `ADMIN`
  * `MEMBER`
* Organization invitations
* Organization document management
* Create organization documents
* Retrieve organization documents
* Delete organization documents
* Role-based permissions for organization documents
* Database transactions for organization creation
* Environment variable configuration
* TypeScript type safety

---

## Tech Stack

### Backend

* Node.js
* Express
* TypeScript

### Database

* PostgreSQL via Supabase

### Authentication

* JSON Web Tokens (`jsonwebtoken`)
* bcrypt

---

## Project Structure

```text
src/

├── app.ts
│
├── config/
│   ├── db.ts
│   └── initDb.ts
│
├── controllers/
│   ├── authController.ts
│   ├── orgController.ts
│   └── documentController.ts
│
├── middleware/
│   └── authMiddleware.ts
│
├── models/
│   ├── userModel.ts
│   ├── organizationModel.ts
│   ├── membershipModel.ts
│   └── documentModel.ts
│
└── routes/
    ├── authRoutes.ts
    └── orgRoutes.ts
```

---

## Architecture

```text
Client
  ↓
Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Models
  ↓
PostgreSQL
```

* **Routes** define API endpoints.
* **Middleware** handles authentication and authorization.
* **Controllers** handle HTTP requests and responses.
* **Models** handle database queries and transactions.
* **Config** contains database configuration and initialization.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/tyl3rsmith/EnterpriseBackend.git

cd enterprise-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project:

```env
PORT=3000

DATABASE_URL=your-database-url

JWT_SECRET=your-secret-key
```

| Variable       | Description                         |
| :------------- | :---------------------------------- |
| `PORT`         | Port the Express server runs on     |
| `DATABASE_URL` | PostgreSQL connection string        |
| `JWT_SECRET`   | Secret used to sign and verify JWTs |

**Never commit your `.env` file to Git.**

---

# Database

The application uses PostgreSQL.

The database contains four primary tables:

## 1. Users

```text
users

├── id
├── username
├── email
├── password
└── created_at
```

User passwords are hashed using **bcrypt** before being stored in the database.

---

## 2. Organizations

```text
organizations

├── id
├── name
├── created_by_user_id
└── created_at
```

Each organization can have a user who originally created it.

---

## 3. Memberships

```text
memberships

├── id
├── user_id
├── organization_id
├── role
└── created_at
```

Memberships connect users to organizations.

Each membership has one of the following roles:

* `OWNER`
* `ADMIN`
* `MEMBER`

Roles are used to control what users can do within an organization.

---

## 4. Documents

```text
documents

├── id
├── organization_id
├── title
├── content
└── created_at
```

Documents belong to an organization and can be managed through the organization document API.

Organization documents are associated with an organization rather than directly with an individual user.

---

# Running the Server

Start the development server with:

```bash
npm run dev
```

The server will run at:

```text
http://localhost:3000
```

You can test the health endpoint:

```text
GET /
```

Expected response:

```json
{
  "message": "Welcome to the Production-Grade API!"
}
```

---

# Authentication

Authentication uses JWT.

## Sign Up

```text
POST /api/auth/signup
```

Request:

```json
{
  "username": "name",
  "email": "email@example.com",
  "password": "mysupersecretpassword"
}
```

## Sign In

```text
POST /api/auth/signin
```

Request:

```json
{
  "username": "name",
  "password": "mysupersecretpassword"
}
```

Successful authentication returns a JWT:

```json
{
  "message": "Sign in successful.",
  "token": "YOUR_JWT_TOKEN",
  "user": {
    "id": 1,
    "username": "name",
    "email": "email@example.com"
  }
}
```

---

# Protected Routes

Protected routes require a valid JWT.

Include the token in the request header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

The authentication middleware:

1. Extracts the JWT from the Authorization header.
2. Verifies the token using `JWT_SECRET`.
3. Decodes the user information.
4. Attaches the user to `req.user`.
5. Allows the request to continue.

---

# Organizations

Authenticated users can create organizations.

## Create an Organization

```text
POST /api/org/create
```

Header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Request:

```json
{
  "name": "My Organization"
}
```

When an organization is created:

1. The organization is inserted into the database.
2. The authenticated user is added to the organization.
3. The user is assigned the `OWNER` role.
4. Both operations occur inside a PostgreSQL transaction.

Using a transaction ensures that the organization and its owner membership are created together.

---

# Organization Invitations

Organization owners and administrators can invite existing users to their organization.

## Invite a User

```text
POST /api/org/:organizationId/invite
```

Header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Request:

```json
{
  "email": "user@example.com",
  "role": "MEMBER"
}
```

Supported invitation roles:

```text
ADMIN
MEMBER
```

### Permissions

| Role       | Can Invite Users |
| :--------- | :--------------- |
| `OWNER`    | Yes              |
| `ADMIN`    | Yes              |
| `MEMBER`   | No               |
| Non-member | No               |

Owners and administrators can assign users either the `ADMIN` or `MEMBER` role.

Users cannot be invited as `OWNER`.

---

# Organization Documents

Organizations can also manage documents associated with the organization.

Documents are accessed through the organization they belong to.

## Create a Document

```text
POST /api/org/:organizationId/documents
```

Header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

A valid authenticated user must belong to the organization, and document creation is restricted according to the organization's role permissions.

---

## Get Organization Documents

```text
GET /api/org/:organizationId/documents
```

Header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

This endpoint retrieves the documents associated with the specified organization.

Users must be members of the organization to access its documents.

---

## Delete an Organization Document

```text
DELETE /api/org/:organizationId/documents/:documentId
```

Header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Documents can only be deleted by users with the appropriate organization permissions.

---

# Organization Document Permissions

Organization documents use the organization's membership roles for access control.

The API verifies:

1. The user is authenticated.
2. The organization ID is valid.
3. The user belongs to the organization.
4. The user's organization role provides the required permission.
5. The requested document belongs to the specified organization.

This prevents users from accessing or modifying documents belonging to organizations they are not members of.

---

# Security

The application currently uses:

* bcrypt password hashing
* JWT authentication
* Parameterized PostgreSQL queries
* Environment variables for secrets
* Protected routes using authentication middleware
* Role-based authorization
* PostgreSQL transactions for multi-step operations
* Organization-level access control for documents

Sensitive configuration should never be committed to the repository.
