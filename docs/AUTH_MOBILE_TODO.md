# Auth — Mobile (erpx-mobile) Required Changes

The mobile app must catch up to the multi-org sign-in flow shipped on the backend and web. No mobile code was changed; implement the following:

1. **Org selection** — when login / email-OTP / phone-OTP / Google returns `orgSelectionRequired`, show an org picker (name/code) and call `POST /auth/select-org` with the `selectionToken`, then continue with the returned step.
2. **Mandatory MFA setup** — on `mfaSetupRequired`, render a QR (from `POST /auth/mfa/enroll`), a 6-digit code input, and show backup codes exactly once behind an "I saved them" confirmation (`POST /auth/mfa/verify` using the `mfaSetupToken`).
3. **MFA challenge** — on `mfaRequired`, keep the 6-digit challenge (`POST /auth/mfa/complete-login`).
4. **Shared handling** — route password, email OTP, phone OTP, and the Google `oauth_grant` callback through a single result handler (`org-selection` / `mfa` / `mfa-setup` / `done`).
5. **Login screen parity** — replace the fake testimonial with three trust points (audit trail on every entry, role-based access, per-company data isolation), use the "Enter your password" placeholder, and add Terms and Privacy links.
