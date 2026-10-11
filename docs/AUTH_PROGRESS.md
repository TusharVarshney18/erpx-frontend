# Auth / Multi-tenant Sign-in — Progress

## Done

### 1A — Multi-organization selection
- Backend: login / email-OTP / phone-OTP / Google return `orgSelectionRequired` with a single-use `selectionToken` and the verified candidate org list.
- Backend: `POST /auth/select-org` enforces auth_policy, status/lockout, MFA challenge, mandatory MFA setup, and login-event logging.
- Frontend: org picker (name/code list) that calls `/auth/select-org` and continues (MFA challenge / MFA setup / tokens).

### 1B — Mandatory MFA setup (owner/admin)
- Backend: `mfaSetupRequired` returns a limited `mfaSetupToken`; `/auth/mfa/enroll` + `/auth/mfa/verify` complete enrollment and issue real tokens.
- Frontend: QR + 6-digit code screen; backup codes shown once behind an "I saved them" checkbox.

### 1C-1 — MFA challenge
- Backend: `mfaRequired` returns a short-lived challenge; `/auth/mfa/complete-login` issues tokens.
- Frontend: existing 6-digit challenge screen (kept as-is).

### 1C-2 — Unified sign-in methods (backend + this frontend pass)
- Backend: password, email OTP, phone OTP, and Google OAuth all share the same multi-org / MFA / setup flow.
- Frontend: `useAuth` resolves a shared step result (`org-selection` / `mfa` / `mfa-setup` / `done`) for every method.

## Pending
- Remember this device (trusted-device tokens).
- Google owner sign-up (create a workspace from a Google identity).
- Multi-step registration (workspace → user → verification).
- Additional roles beyond owner / admin / manager / employee.
- Row-level security (RLS) hardening.
- Global identity plan (single account across tenants vs. per-tenant rows).

## Rules
- Local database only.
- Never run `prisma migrate dev` on Render.
- No push to any remote without explicit approval.
- Keep auth changes small, reviewable, and covered by tests.
