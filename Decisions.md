# DECISIONS

Record of deviations from Steps 3–5 and why.

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | pnpm only; `nest new --skip-git --skip-install` | Single root lockfile in monorepo | Sprint 0 |
| 2 | Ports: API 4000, web 3000 | Avoid dev collision | Sprint 0 |
| 3 | Opaque refresh token, hash-only in `RefreshToken`; reuse detection | Revocation + replay detection; `JWT_REFRESH_SECRET` removed | Sprint 0 |
| 4 | Refresh delivered as httpOnly cookie, path=/api/v1/auth, `Domain=` parent domain in prod only (host-only on localhost) | Subdomain sharing in prod; cookies ignore ports so localhost:3000/4000 works | Sprint 0 |
| 5 | SameSite=Strict vs Lax for join-link first navigation — **OPEN: default Strict, join page must tolerate pre-refresh unauthenticated state** | External top-level navigation won't send Strict cookies | Sprint 0 |
| 6 | Access token in memory; restore session via silent refresh on load + 401 interceptor | XSS-resistant pairing with httpOnly refresh | Sprint 0 |
| 7 | Socket auth: token in handshake `auth` payload (never query string); DB membership re-check on room join + send; removed members dropped from rooms | Same rule as HTTP: never trust the JWT | Sprint 0 |
| 8 | Throttler configured Sprint 2 on login/register/refresh/invite-join | Auth brute-force surface | Sprint 0 |
| 9 | Messages: cursor pagination ordered by `(createdAt, id)` | Stable ordering under equal timestamps | Sprint 0 |
| 10 | Node 24 (LTS) — required by Jest 30 require(ESM) delegation for Nest 12 ESM deps; CI pins 24 | Keep Nest 12/Next 16 | Sprint 0 |
| 11 | Docker Postgres on host ports 5433 (dev) / 5434 (test) | Native PostgreSQL 17 occupies 5432 on this machine | Sprint 0 |
| 12 | Presence in-memory for MVP — breaks with >1 app instance on Render | Deferred per Step 3/4; document before scaling | Sprint 0 |
| 13 | 22 hrs/sprint capacity; buffer shown per sprint | Part-time pacing | Sprint 0 |