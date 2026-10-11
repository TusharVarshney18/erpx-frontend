# Auth / Multi-tenant Sign-in — Progress

## Base branches
- Backend: `feature/saas-auth` branched from `phase-7-statutory`.
- Frontend: `feature/saas-auth` branched from `phase-4-bank-ledger`.

## Done

### 1A — Lockout fix, login events, auth_policy, branding
- Fixed account lockout on failed login (per-org password policy threshold/duration).
- `login_events` logging for every sign-in attempt (success and failure).
- `auth_policy` enforcement (allowed methods, allowed domains).
- ERPX branding applied to the auth surfaces.

### 1B — Token invites
- Hashed invite tokens (never stored/returned in plaintext).
- Atomic accept (single transaction: verify token → set password → activate → verify email).
- Policy checks on invite/accept (org status, role validity, expiry).
- `/invite/[token]` accept page (password or Google), backed by `/invites/:token` + `/invites/:token/accept`.

### 1C-1 — Mandatory MFA setup for owner/admin
- Owner/admin without MFA get a limited `mfaSetupToken`; full access only after TOTP enrollment.

### 1C-2 — Multi-org selection
- One identity across several orgs returns `orgSelectionRequired` with a single-use, audience-scoped `selectionToken`.
- `POST /auth/select-org` re-runs auth_policy and the normal session flow (status/lockout, MFA, setup).
- Works for password, email OTP, phone OTP, and Google (deferred `googleId` bound only after one org is chosen).

### Frontend pass
- Organization picker (name/code) that calls `/auth/select-org` and continues.
- Mandatory MFA setup screen (QR + 6-digit code + backup codes shown once behind "I saved them").
- Login polish: trust points (audit trail, role-based access, per-company data isolation), "Enter your password" placeholder, Terms/Privacy links, removed fake testimonial and SSO "coming soon".

## Pending
- Remember this device (trusted-device tokens).
- Google owner sign-up (create a workspace from a Google identity).
- Multi-step registration (workspace → user → verification).
- Extra roles beyond owner / admin / manager / employee.
- Audit before/after snapshots on sensitive writes.
- Tenant-leak tests and row-level security (RLS).
- Global identity plan (single account across tenants vs. per-tenant rows).
- Mobile app — see `AUTH_MOBILE_TODO.md`.

## Rules
- Local database only.
- Never run `prisma migrate dev` on Render.
- No push to any remote without explicit approval.
- Backend migrations and deploy must happen BEFORE the frontend deploy.
