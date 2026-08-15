# Enterprise Backend API

A backend REST API built with **Node.js, Express, TypeScript, and PostgreSQL**.  

The application provides user authentication using JSON Web Tokens (JWT), secure password hashing, and organization management with role-based memberships.

## Features
- User registration and authentication
- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- PostgreSQL database
- User and organization models
- Organization creation
- Organization memberships
- Organization roles:
  - `OWNER`
  - `ADMIN`
  - `MEMBER`
- Database transactions for organization creation
- Environment variable configuration
- TypeScript type safety
---

## Tech Stack

### Backend
- Node.js
- Express
- TypeScript

### Database
- PostgreSQL via Supabase

### Authentication

- JSON Web Tokens (`jsonwebtoken`)
- bcrypt

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
│   └── orgController.ts
│
├── middleware/
│   └── authMiddleware.ts
│
├── models/
│   ├── userModel.ts
│   └── organizationModel.ts
│
└── routes/
    ├── authRoutes.ts
    └── orgRoutes.ts
```

## Architecture
```text
Client
  ↓
Routes
  ↓
Controllers
  ↓
Models
  ↓
PostgreSQL
```
- Routes define API endpoints.
- Controllers handle HTTP requests and responses.
- Models handle database queries and transactions.
- Middleware handles authentication.
- Config contains database configuration and initialization.

## Getting Started
### 1. Clone the Repository
```
git clone https://github.com/tyl3rsmith/EnterpriseBackend.git
cd enterprise-backend
```

### 2. Install Dependencies
```
npm install
```

### 3. Configure Environment Variables
Create a ```.env``` file in the root of the project:  

```
PORT=3000

DATABASE_URL=your-database-url

JWT_SECRET=your-secret-key
```

| Variable | Description |
| :------- | ----------: |
| ```PORT``` | Port the Express server runs on |
| ```DATABASE_URL``` | PostgreSQL connection string |
| ```JWT_SECRET``` | Secret used to sign and verify JWTs |

**Never commit your ```.env``` file to Git.**

## Database
The application uses PostgreSQL.  
The database contains three primary tables:

### 1. Users
```text
users
├── id
├── username
├── email
├── password
└── created_at
```
*User passwords are hashed using **bcrypt** before being stored in the database.*

### 2. Organizations
```text
organizations
├── id
├── name
├── created_by_user_id
└── created_at
```
*Each organization can have a user who originally created it.*

### 3. Memberships
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
-     OWNER
-     ADMIN
-     MEMBER

## Running the Server
Start the development server with:
```text
npm run dev
```
The server will run at
```text
http://localhost:3000
```
You can test the health end point
```text
GET /
```
Expected response:
```text
{
  "message": "Welcome to the Production-Grade API!"
}
````

## Authentication
Authentication uses JWT.

### Sign Up
```
POST /api/auth/signup
```
Request:
```
{
  "username": "name",
  "email": "email@example.com",
  "password": "mysupersecretpassword"
}
```

### Sign In
```
POST /api/auth/signin
```

Request:
```
{
  "username": "name",
  "password": "mysupersecretpassword"
}
```

Successful authentication returns a JWT
```
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

## Protected Routes
Protected routes require a valid JWT.  
Include the token in the request header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```
The authentication middleware:

1. Extracts the JWT from the Authorization header.
2. Verifies the token using JWT_SECRET.
3. Decodes the user information.
4. Attaches the user to req.user.
5. Allows the request to continue.

## Organizations
Authenticated users can create organizations.
```
POST /api/org/create
```
Header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```
Request:
```
{
  "name": "My Organization"
}
```
When an organization is created:

1. The organization is inserted into the database.
2. The authenticated user is added to the organization.
3. The user is assigned the OWNER role.

*Both operations occur inside a PostgreSQL transaction to ensure that the organization and its owner membership are created together.*

## Security
The application currently uses:

- bcrypt password hashing
- JWT authentication
- Parameterized PostgreSQL queries
- Environment variables for secrets
- Protected routes using authentication middleware
- PostgreSQL transactions for multi-step operations

Sensitive configuration should never be committed to the repository.