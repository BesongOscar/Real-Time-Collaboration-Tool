# Auth API Contract

Base: /api/v1 | Envelope: success → { success: true, data }
error → { success: false, error: { code, message, details? } }

## POST /auth/register

Body: { email: string, name: string, password: string (min 8) }
201 → data: { user: { id, email, name, avatarUrl }, accessToken: string }
Set-Cookie: refresh_token=<opaque>; HttpOnly; Path=/api/v1/auth;
SameSite=Strict; Secure (prod only); Max-Age=1209600
409 EMAIL_TAKEN | 400 VALIDATION_ERROR (details: field[])

## POST /auth/login

Body: { email, password }
200 → same shape as register. 401 INVALID_CREDENTIALS (generic — never reveal if email exists)

## POST /auth/refresh

Body: none. Cookie required.
200 → data: { accessToken } + rotated refresh cookie (old row revoked, replacedBy set)
401 REFRESH_MISSING | REFRESH_INVALID | REFRESH_REUSE (reuse ⇒ revoke entire family, audit log)

## POST /auth/logout

Cookie required. 204 → cookie cleared, row revoked. Always 204 even if token unknown.

## Rules

- Access token: Bearer, 30m, held in memory only (Zustand), never localStorage.
- Client: on 401 → single-flight POST /auth/refresh → retry original once → else redirect /login.
- Session restore on app load: POST /auth/refresh before rendering (app) group.
- Every authenticated request: server re-checks membership/role from DB (Step 4 fix).
