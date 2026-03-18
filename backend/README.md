# CSCMS Backend (Microservices)

This folder contains a clean Node.js + Express backend in microservice architecture, separated from the Next.js frontend.

## Services

- API Gateway: `http://localhost:4000`
- Auth Service: `http://localhost:4001`
- Workers Service: `http://localhost:4002`
- Incidents Service: `http://localhost:4003`
- Inspections Service: `http://localhost:4004`

## Architecture

- `api-gateway`: entry point for frontend, routing and token validation
- `services/auth-service`: login and JWT token validation
- `services/workers-service`: worker management APIs
- `services/incidents-service`: incident reporting APIs
- `services/inspections-service`: inspection schedule/completion APIs

## Setup

1. Copy `.env.example` to `.env` in this `backend` folder.
2. Install root helper deps:
   - `npm install` (inside `backend`)
3. Install all service deps:
   - `npm run install:all`
4. Run all services:
   - `npm run dev`

## Gateway Routes

All routes go through API Gateway (`http://localhost:4000`).

### Public

- `POST /api/auth/login`

### Protected (Bearer token required)

- Workers: `/api/workers`
- Incidents: `/api/incidents`
- Inspections: `/api/inspections`

## Example Login

### Request

`POST http://localhost:4000/api/auth/login`

```json
{
  "email": "admin@cscms.com",
  "password": "Admin@123"
}
```

### Response

```json
{
  "token": "<jwt>",
  "user": {
    "id": "USR-001",
    "email": "admin@cscms.com",
    "role": "ADMIN",
    "name": "Admin User"
  }
}
```

## Notes

- This scaffold uses in-memory data for quick development.
- Next step for production: add DB per service (PostgreSQL/MongoDB), service discovery, and centralized logging.
