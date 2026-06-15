# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

pnpm monorepo with two apps:

- `apps/api` — NestJS 11 REST API (port 3000), with Prisma ORM and PostgreSQL
- `apps/web` — Next.js 16 frontend with Tailwind CSS 4

Database is PostgreSQL 16 via Docker. Prisma schema lives at `apps/api/prisma/schema.prisma`.

## Commands

```bash
# Start DB (required before running API)
docker compose up -d

# Run both apps in parallel (uses bun at root)
pnpm dev

# Run individually
pnpm --filter api start:dev
pnpm --filter web dev

# API tests
pnpm --filter api test              # unit (jest, spec files in src/)
pnpm --filter api test:e2e          # e2e (test/jest-e2e.json)
pnpm --filter api test -- --testPathPattern=app  # single file

# Prisma
pnpm --filter api exec prisma migrate dev
pnpm --filter api exec prisma generate

# Lint / format
pnpm --filter api lint
pnpm --filter web lint
```

## Next.js 16 Warning

This is Next.js **16**, not 14/15 — APIs, conventions, and file structure may differ from training data. Read `apps/web/node_modules/next/dist/docs/` before writing any Next.js code, and heed deprecation notices.

## Prisma 7 Warning

This is Prisma **7**, not 5/6. Breaking change: the `url` field is **not allowed** in the `datasource` block of `schema.prisma`. The connection URL lives in `apps/api/prisma.config.ts` (`datasource.url`), loaded from `DATABASE_URL` via `dotenv`. All Prisma CLI commands auto-load that config. At runtime, `PrismaClient` needs a driver adapter (e.g. `@prisma/adapter-pg`) — it does not read the URL from the schema.

## Environment

`apps/api/.env` holds `DATABASE_URL`. It points to the Docker Postgres instance (`localhost:5432/barber_studio`). There is no `.env` in `apps/web` yet.
