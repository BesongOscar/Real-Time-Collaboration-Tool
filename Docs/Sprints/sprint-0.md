# Sprint 0 — Foundation and Tooling

| Field         | Value                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| Status        | Completed                                                                                                  |
| Sprint dates  | 19 Oct 2026 – 7 Nov 2026                                                                                   |
| Report date   | 9 Nov 2026                                                                                                 |
| Effort budget | 22 hrs (see `Decisions.md` #13)                                                                            |
| Branch        | `sprint-0` → `main`                                                                                        |
| Merge         | PR [#1](https://github.com/BesongOscar/Real-Time-Collaboration-Tool/pull/1), commit `4a428f0`              |
| Commit range  | `f7c5bda..4a428f0`                                                                                         |
| Owner         | Besong Oscar-Wilde                                                                                         |
| Theme         | Make the repo runnable end to end: monorepo, database, API shell, web shell, CI, and the first design docs |

## Objective

Establish a working baseline so later sprints can add product features without re-deciding tooling, database shape, or API conventions. Sprint 0 was deliberately infrastructure-only: no authentication, workspaces, messaging, or tasks.

## Outcome

Sprint 0 delivered a pnpm/Turborepo monorepo with two applications, a Prisma schema and two migrations, a NestJS API shell with a consistent response envelope, a Next.js App Router shell with a smoke test, a GitHub Actions pipeline, and three design documents (schema, auth contract, decisions).

The sprint merged to `main` through PR #1. The merged commit passed local typecheck, lint, and unit tests when re-verified in an isolated worktree on 9 Nov 2026. End-to-end tests were not re-run because the Docker daemon was unavailable (see [Verification](#verification)).

## Delivered

### 1. Monorepo and tooling

| Item            | Detail                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| Package manager | pnpm `10.32.1`, single root lockfile                                             |
| Task runner     | Turborepo `2.x`                                                                  |
| Runtime         | Node `>=24.0.0` (required by Jest 30 / Nest 12 ESM interop — `Decisions.md` #10) |
| Workspaces      | `apps/*`, `packages/*`                                                           |
| Apps            | `apps/api` (NestJS), `apps/web` (Next.js)                                        |
| Root scripts    | `dev`, `build`, `lint`, `typecheck`, `test`, `format`, `format:check`, `clean`   |
| Formatting      | Prettier with shared root config                                                 |
| Ignores         | Root and per-app `.gitignore`, `.prettierignore`                                 |

Key files: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.prettierrc`, `.gitignore`.

`turbo.json` treats `dev` as persistent and uncached, makes `build` depend on upstream builds, and makes `lint`, `typecheck`, and `test` depend on their upstream counterparts.

### 2. Local infrastructure

`docker-compose.yml` defines two PostgreSQL 17 services:

| Service         | Container           | Host port | Database   | Purpose             |
| --------------- | ------------------- | --------- | ---------- | ------------------- |
| `postgres-dev`  | `rtc-postgres-dev`  | `5433`    | `rtc_dev`  | Local development   |
| `postgres-test` | `rtc-postgres-test` | `5434`    | `rtc_test` | Tests and CI parity |

Both services have `pg_isready` health checks and named volumes. Ports `5433`/`5434` were chosen because native PostgreSQL 17 already occupies `5432` on the development machine (`Decisions.md` #11).

Environment templates were added at `apps/api/.env.example` and `apps/web/.env.example`.

### 3. Data layer

The Prisma schema at `apps/api/prisma/schema.prisma` defines:

- **8 models:** `User`, `Workspace`, `WorkspaceMember`, `Message`, `Task`, `Notification`, `File`, `RefreshToken`.
- **5 enums:** `WorkspaceRole`, `TaskStatus`, `TaskPriority`, `NotificationType`, `NotificationEntityType`.
- **Relations and delete rules** aligned with the reviewed SDLC Step 4 schema: workspace-owned rows cascade; authored content restricts; task assignees set null.
- **Indexes** for the main query paths: workspace message ordering, task board by status, “my tasks”, unread notifications, membership lookup, and refresh-token lookup.

Two migrations were committed:

1. `20261018022331_init_schema_aligned` — tables, enums, indexes, and foreign keys.
2. `20261018030000_add_constraints` — raw-SQL backstops Prisma cannot express:
   - partial unique index enforcing at most one `OWNER` per workspace;
   - check constraint requiring `Notification.entityType` and `entityId` to be set together or both null.

The design rationale, relationship rules, and intentional deviations are documented in [`Docs/Database/schema.md`](../Database/schema.md).

### 4. API foundation

`apps/api` is a NestJS 12 application with:

- `PrismaModule` / `PrismaService` (global module, connect on init, disconnect on destroy).
- `GET /` returning `Hello World!`.
- `GET /health` returning `{ status: "ok", timestamp }`.
- Global `ResponseInterceptor` wrapping success responses as `{ success: true, data }`.
- Global `GlobalHttpExceptionFilter` wrapping errors as `{ success: false, error: { code, message, details? } }`, with status-to-code mapping (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`).
- Global `ValidationPipe` with `whitelist`, `transform`, `forbidNonWhitelisted`, and implicit conversion.
- API port `4000` (`Decisions.md` #2).

Unit tests cover the root and health responses. E2E tests cover the success envelope, the health endpoint, and the 404 error envelope.

Not yet present in Sprint 0 (deferred to Sprint 1): global `/api/v1` prefix, CORS, cookie parsing, environment validation, auth guard, and auth endpoints. `Docs/api/auth.md` specifies the contract those changes must satisfy.

### 5. Web foundation

`apps/web` is a Next.js `16.4.0` App Router application with:

- React `19.3.0` and the App Router root layout.
- Tailwind CSS 4 wired through `@tailwindcss/turbopack`.
- Geist and Geist Mono fonts.
- A landing page that renders the product heading and one-line description.
- Vitest `2.1.9` + Testing Library + jsdom, with a smoke test for the landing page.
- `next.config.ts` enabling `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback`, and the Turbopack CSS rule.
- `typecheck` runs `next typegen && tsc --noEmit`, added in `d508578` so generated route types exist before TypeScript runs.

### 6. Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request:

1. Checkout.
2. Install pnpm `10.32.1` and Node 24 with pnpm cache.
3. `pnpm install --frozen-lockfile`.
4. `prisma generate` and `prisma migrate deploy` against a PostgreSQL 17 service on port `5434`.
5. `pnpm run lint`.
6. `pnpm run typecheck`.
7. `pnpm run test`.
8. `pnpm --filter api run test:e2e`.

Concurrency is configured to cancel superseded runs on the same ref. The workflow does **not** run a production build (see [Gaps and follow-ups](#gaps-risks-and-follow-ups)).

### 7. Documentation

| Document                                   | Purpose                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `Decisions.md`                             | Durable record of 13 deviations and choices made during planning and Sprint 0      |
| `Docs/Database/schema.md`                  | Model purposes, delete rules, indexes, service-layer rules, and DB backstops       |
| `Docs/api/auth.md`                         | Auth contract: endpoints, envelope, cookies, error codes, and client refresh rules |
| `apps/api/README.md`, `apps/web/README.md` | Framework starter READMEs (not yet project-specific)                               |
| `README.md`                                | One-line repository stub at the time of Sprint 0                                   |

## Commit history

| Commit    | Date       | Message                                                                             |
| --------- | ---------- | ----------------------------------------------------------------------------------- |
| `bd121aa` | 2026-10-19 | `chore(repo): scaffold pnpm and turborepo monorepo`                                 |
| `e0de61d` | 2026-10-19 | `build(docker): add postgres dev and test services`                                 |
| `016b531` | 2026-10-19 | `docs: add database schema and sprint decisions`                                    |
| `903f0ff` | 2026-10-19 | `feat(db): add prisma schema with aligned migrations and constraints`               |
| `14bfe10` | 2026-10-19 | `feat(api): add nest foundation with prisma, health endpoint and response envelope` |
| `e8fc683` | 2026-10-19 | `feat(web): add app router layout and vitest testing setup`                         |
| `cc064da` | 2026-10-19 | `ci: lint, typecheck and test on push and pull requests`                            |
| `d508578` | 2026-11-07 | `fix(web): generate next route types before typecheck`                              |
| `410cc00` | 2026-11-07 | `fix(api): add dev script so turbo starts the api`                                  |
| `f98e290` | 2026-11-07 | `chore(repo): drop deprecated turbo --parallel flag`                                |
| `4a428f0` | 2026-11-07 | Merge pull request #1 from `BesongOscar/sprint-0`                                   |

The merge changed 57 files with 12,220 insertions. Commit activity clustered on 19 Oct (foundation) and 7 Nov (fixes and merge), consistent with part-time pacing.

## Decisions

The full text and rationale live in `Decisions.md`. The Sprint 0 decisions that shape later work are:

| #   | Decision                                                                                       | Why it matters later                                           |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | pnpm only; Nest scaffolded with `--skip-git --skip-install`                                    | One root lockfile for the monorepo                             |
| 2   | API port `4000`, web port `3000`                                                               | Avoids local collisions                                        |
| 3   | Opaque refresh token, hash-only storage, family-based reuse detection                          | Drives the `RefreshToken` model and refresh flow               |
| 4   | Refresh token in an httpOnly cookie scoped to `/api/v1/auth`; parent domain only in production | Requires the `/api/v1` prefix and cookie handling in Sprint 1  |
| 5   | **Open:** `SameSite=Strict` vs `Lax` for invite-link first navigation                          | Join links must tolerate a pre-refresh unauthenticated state   |
| 6   | Access token in memory; restore via silent refresh and a 401 interceptor                       | Shapes the web auth store and Axios interceptors               |
| 7   | Socket auth via handshake `auth` payload; re-check membership from the database                | Realtime work must never trust the JWT alone                   |
| 8   | Throttling planned for Sprint 2 on login/register/refresh/invite-join                          | Security follow-up, not in Sprint 0                            |
| 9   | Message cursor pagination ordered by `(createdAt, id)`                                         | Matches the message index                                      |
| 10  | Node 24 LTS                                                                                    | Required by Jest 30 / Nest 12 ESM interop; pinned in CI        |
| 11  | Docker Postgres on `5433` (dev) and `5434` (test)                                              | Native PostgreSQL occupies `5432` locally                      |
| 12  | In-memory presence for the MVP                                                                 | Breaks with more than one API instance; revisit before scaling |
| 13  | 22 hrs per sprint with buffer                                                                  | Part-time capacity planning                                    |

## Verification

Verified on 9 Nov 2026 against the merged commit `4a428f0` in an isolated git worktree. The worktree reused the main checkout's installed dependencies (not a clean install). Environment: Windows, Node 24, pnpm `10.32.1`.

| Check            | Command                       | Result                              |
| ---------------- | ----------------------------- | ----------------------------------- |
| API typecheck    | `pnpm --filter api typecheck` | Pass                                |
| API lint         | `pnpm --filter api lint`      | Pass                                |
| API unit tests   | `pnpm --filter api test`      | Pass — 1 suite, 2 tests             |
| Web typecheck    | `pnpm --filter web typecheck` | Pass                                |
| Web lint         | `pnpm --filter web lint`      | Pass                                |
| Web unit tests   | `pnpm --filter web test`      | Pass — 1 file, 1 test               |
| API e2e tests    | `pnpm --filter api test:e2e`  | Not run — Docker daemon unavailable |
| Production build | `pnpm build`                  | Not run in this verification pass   |

The CI workflow is the authoritative gate and runs the e2e suite with a PostgreSQL service container. Because the local e2e run was skipped, the merged commit's e2e status was not independently confirmed here.

## Documentation produced

- `Decisions.md` — 13 decisions with rationale and dates.
- `Docs/Database/schema.md` — schema rationale and operational rules.
- `Docs/api/auth.md` — the auth contract that Sprint 1 implements.
- `apps/api/README.md` and `apps/web/README.md` — framework starter text.
- Root `README.md` — repository stub.

## Gaps, risks, and follow-ups

1. **Schema doc drift.** `schema.prisma` contains `Task.dueDate`, `Message.replyToId` / `replies`, and `Notification.metadata`, but `Docs/Database/schema.md` says those fields do not exist. Reconcile the document and the schema before Sprint 2 adds task or message features.
2. **Path and casing inconsistencies.** `schema.md` says it lives at `docs/database/schema.md`, but the actual path is `Docs/Database/schema.md`. The repo mixes `Docs/api` (lowercase) and `Docs/Database` (capitalized). Standardize casing.
3. **Contract vs implementation.** `Docs/api/auth.md` uses a `/api/v1` base and requires CORS, cookie parsing, and env validation. None of those exist in Sprint 0; they are Sprint 1 work.
4. **Register body naming.** `Docs/api/auth.md` specifies `{ email, name, password }` and returns a `name` field, but the database model and the Sprint 1 DTO use `username`. Decide whether `name` is a display name that needs its own column or a typo in the contract, then align all three.
5. **Open decision #5.** The `SameSite` policy for invite-link navigation is still unresolved. Decide before invite links ship.
6. **E2E not locally verified.** Docker was not running during this documentation pass. Start Docker Desktop and run `pnpm --filter api test:e2e` to confirm.
7. **CI has no build step.** Lint, typecheck, unit, and e2e run, but a production build regression would not be caught. Add `pnpm build` to CI.
8. **Boilerplate READMEs.** The app READMEs are still Nest/Next starter text, and the root README was a one-line stub. This documentation pass replaces the root README and adds a docs map.
9. **Empty `packages/*` workspace.** The workspace glob exists, but no shared package does. Keep it if shared types/contracts are planned; otherwise remove it to avoid a dead convention.
10. **No deployment pipeline.** Render (or another host) is not configured. Deployment, secrets, and environment promotion remain future work.
11. **No branch protection or PR template documented.** CI exists, but nothing records required checks, review rules, or a PR checklist.
12. **Presence is in-memory** (`Decisions.md` #12). This is acceptable for a single instance but must be revisited before horizontal scaling.
13. **No coverage thresholds.** Unit tests exist, but no minimum coverage gate is configured.

## Carryover to Sprint 1

Sprint 1 is the authentication sprint. Planned carryover from Sprint 0:

- Implement `register`, `login`, `refresh`, and `logout` per `Docs/api/auth.md`.
- Add the global `/api/v1` prefix, CORS for the web origin, cookie parsing, and startup environment validation.
- Add the JWT guard, public-route decorator, current-user decorator, and Prisma-backed session handling with refresh-token rotation and reuse detection.
- Add the web auth store (in-memory access token), Axios instance, silent refresh on load, and single-flight 401 retry.
- Keep the API e2e suite green against the test PostgreSQL service.

Sprint 1 documentation is intentionally deferred until the sprint closes (see [`Docs/Sprints/README.md`](README.md)).

## Exit criteria

| Criterion                                                        | Implemented | Verified                                   |
| ---------------------------------------------------------------- | ----------- | ------------------------------------------ |
| Monorepo installs and root scripts are defined                   | Yes         | Yes (scripts ran)                          |
| PostgreSQL dev and test services are defined                     | Yes         | No (Docker unavailable)                    |
| Prisma schema and migrations are committed                       | Yes         | No (not applied in this pass)              |
| API exposes root and health endpoints with the response envelope | Yes         | Unit tests pass; e2e not run               |
| Web renders the landing page                                     | Yes         | Unit test passes                           |
| CI runs lint, typecheck, unit, and e2e                           | Yes         | Workflow defined; remote run not inspected |
| Decisions, schema, and auth contract are documented              | Yes         | Reviewed in this pass                      |
| Sprint merged to `main`                                          | Yes         | PR #1, `4a428f0`                           |

## References

- [`Decisions.md`](../../Decisions.md)
- [`Docs/Database/schema.md`](../Database/schema.md)
- [`Docs/api/auth.md`](../api/auth.md)
- [`Docs/Sprints/README.md`](README.md)
- [PR #1](https://github.com/BesongOscar/Real-Time-Collaboration-Tool/pull/1)
