# Real-Time Collaboration Tool

A real-time collaboration platform for small teams: shared workspaces, messaging, tasks, notifications, and file sharing.

**Status:** Sprint 0 (foundation) is complete and merged. Sprint 1 (authentication) is in progress.

## Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Monorepo | pnpm workspaces + Turborepo                            |
| API      | NestJS 12, Prisma 6, PostgreSQL 17                     |
| Web      | Next.js 16 (App Router), React 19, Tailwind CSS 4      |
| Realtime | Socket.IO (planned)                                    |
| Tests    | Jest + Supertest (API), Vitest + Testing Library (web) |
| CI       | GitHub Actions                                         |

## Prerequisites

- Node.js 24 or newer
- pnpm 10.32.1 (`corepack enable` is the simplest way to get it)
- Docker Desktop (for the local PostgreSQL services)

## Quick start

```bash
pnpm install

# Start PostgreSQL for development (host port 5433)
docker compose up -d postgres-dev

# Create local environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Generate the Prisma client and apply migrations
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate:dev

# Start the API and web app together
pnpm dev
```

On Windows PowerShell, use `Copy-Item` instead of `cp`.

| Service           | URL                   |
| ----------------- | --------------------- |
| Web               | http://localhost:3000 |
| API               | http://localhost:4000 |
| PostgreSQL (dev)  | `localhost:5433`      |
| PostgreSQL (test) | `localhost:5434`      |

The test database is started with `docker compose up -d postgres-test`.

## Repository layout

```text
apps/
  api/                 # NestJS API
  web/                 # Next.js web app
Docs/                  # Cross-cutting documentation
  Sprints/             # Sprint reports and process
  Database/            # Schema design
  api/                 # API contracts
Decisions.md           # Durable decisions with rationale
docker-compose.yml     # Local PostgreSQL services
turbo.json             # Task pipeline
```

## Scripts

Run these from the repository root:

| Command             | Purpose                      |
| ------------------- | ---------------------------- |
| `pnpm dev`          | Start all apps in watch mode |
| `pnpm build`        | Build all apps               |
| `pnpm lint`         | Lint all apps                |
| `pnpm typecheck`    | Typecheck all apps           |
| `pnpm test`         | Run unit tests               |
| `pnpm format`       | Format with Prettier         |
| `pnpm format:check` | Check formatting             |

App-specific scripts live in `apps/api/package.json` and `apps/web/package.json`. The API also exposes `test:e2e`, `prisma:generate`, `prisma:migrate:dev`, and `prisma:migrate:deploy`.

## Documentation

| Document                                             | Contents                                            |
| ---------------------------------------------------- | --------------------------------------------------- |
| [`Docs/README.md`](Docs/README.md)                   | Documentation map and conventions                   |
| [`Docs/Sprints/`](Docs/Sprints/README.md)            | Sprint reports and the sprint documentation process |
| [`Docs/Database/schema.md`](Docs/Database/schema.md) | Data model, delete rules, indexes, and DB backstops |
| [`Docs/api/auth.md`](Docs/api/auth.md)               | Authentication API contract                         |
| [`Decisions.md`](Decisions.md)                       | Durable decisions and rationale                     |

## Notes

- The API and web app run on different ports (`4000` and `3000`).
- PostgreSQL runs on `5433`/`5434` because native PostgreSQL may already occupy `5432`.
- Sprint 1 is not yet documented in detail; see [`Docs/Sprints/README.md`](Docs/Sprints/README.md) for the status.
