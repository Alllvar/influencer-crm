# Influencer CRM

A full-stack (MERN + TypeScript) CRM for running influencer marketing campaigns: brands, creators, campaigns and outreach.

> Work in progress. Built step by step; see the roadmap below.

## Stack

- **API:** Node.js, Express 5, TypeScript, MongoDB + Mongoose, Zod validation
- **Client:** React + TypeScript (coming in a later stage)
- **Tests:** Vitest + Supertest against an in-memory MongoDB

## Run locally

```bash
npm install
cp server/.env.example server/.env   # leave MONGODB_URI empty to use an in-memory database
npm run dev                          # API on http://localhost:4000
npm test
```

Check it works: `GET http://localhost:4000/api/health`.

## Project structure

```
server/
  src/
    config/env.ts            env variables validated with Zod at startup
    db/connect.ts            MongoDB connection (in-memory fallback in development)
    app.ts                   Express app: middleware, routes, error handling
    server.ts                entry point: connects the DB, starts listening, graceful shutdown
    routes/                  route handlers
    middleware/              notFound + central errorHandler
    utils/HttpError.ts       error class carrying an HTTP status
  tests/                     API tests (in-memory MongoDB, wiped after each test)
```

## Roadmap

1. [x] API foundation: config, DB connection, error handling, health check, tests
2. [ ] Auth: register/login, password hashing, JWT access + refresh tokens, roles
3. [ ] Creators and campaigns: CRUD, validation, pagination, filters, search
4. [ ] React client: auth flow, campaign list and multi-step campaign form
5. [ ] File uploads, Swagger docs
6. [ ] Docker, GitHub Actions CI, deployment (MongoDB Atlas + hosting)
