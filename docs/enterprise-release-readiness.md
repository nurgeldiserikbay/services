# Services — enterprise release readiness (2026-11-07)

Status: **NOT RELEASE-READY**. This is an evidence inventory, not a percentage estimate or a CI report. A source file or test definition is not proof of a passing deployment.

## Verified by repository inspection (code presence only)

| Area | Evidence | Gate |
| --- | --- | --- |
| Product and API specifications | `docs/ru/26-acceptance-checklist.md`, `contracts/openapi.yaml` | G0: in progress; contract verification needed |
| Backend | `services-back/src/modules/app.module.ts` (catalog, geography, public offers, seller requests, guest verification, bearer sessions) | G1–G3: not verified |
| Web | `services-front/apps/web` (search, public profiles, guest and seller BFF code) | G1–G3: not verified |
| Admin | `services-admin` Next.js project; README does not establish implemented moderation workflows | G1–G4: not verified |
| Quality and release | Tests exist, but this inventory has no passing CI run, database integration or deployed E2E evidence | G4–G5: blocked |

## Critical path — prioritize complete user journeys

1. **Identity:** real account login/logout, OTP provider, session issuance and revocation; backend ACL and CSRF checks. No developer-only tokens or default-on protected routes.
2. **Marketplace journey:** search → public offer → verified guest request → seller inbox → accept/decline → status and notification. Verify idempotency, retries, authorization and multi-tenant isolation with a real database.
3. **Operational journey:** seller availability/cancellations, notification delivery, minimal admin moderation and auditable operations. No quote/payment workflow.
4. **Enterprise release:** CI green across all repos; database migrations and rollback; backup + tested restore; audit retention/redaction; secret rotation; abuse controls; monitoring and alerts; accessibility/kk/ru/mobile; legal and KZ residency review; load and E2E tests.

## Release evidence required

For each gate G0–G5 record the four repository commit SHAs, OpenAPI/schema version, CI run URLs, DB migration result, test environment, E2E report and named approver. Never mark `verified` on the basis of a commit alone.

## Current known blockers

- Real registered-account login/session issuance is not demonstrated end-to-end.
- Seller UI components and BFF contracts are not yet proven integrated.
- Admin operational workflows are not confirmed by tests.
- Production notification/OTP providers and real-delivery tests are not confirmed.
- No consolidated production deployment, database restore, security and E2E evidence reviewed here.

Next milestone: demonstrate one complete authenticated seller journey with backend, web and real PostgreSQL, then close the remaining gates.
