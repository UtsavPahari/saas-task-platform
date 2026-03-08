# Multi-Tenant SaaS Task Management Platform

A production-style backend built with Node.js, TypeScript, GraphQL, and MongoDB.

## Features Implemented

### Authentication
- JWT-based authentication
- Secure password hashing (bcrypt)
- Context-based authorization
- Protected `me` query

### Multi-Tenant Architecture
- Organizations (tenants)
- Membership model (user ↔ organization)
- Role-based access control (ADMIN / MANAGER / MEMBER)
- Unique membership constraints

### Invitation System
- Admin-only invite creation
- Secure invite token generation (SHA-256 hashed)
- Invite expiration logic
- Invite acceptance flow
- Membership creation upon acceptance

### Project & Task Management
- Organization-scoped projects
- Tasks nested under projects
- Task workflow status (TODO → IN_PROGRESS → DONE)
- Admin/Manager project creation
- Admin/Manager task creation
- Task status updates with RBAC enforcement

### Organization Dashboard
- Organization-level analytics query
- Total project count
- Total task count
- Task breakdown by status

## Tech Stack
- Node.js
- TypeScript
- Apollo Server (GraphQL)
- MongoDB + Mongoose
- JWT
- Zod validation

## Status
In active development

Next Steps:
- Task assignment system
- Redis caching for dashboard queries
- AI task assistant
- Frontend (React + Apollo Client)