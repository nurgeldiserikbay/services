# Services — enterprise release readiness (2026-11-09)

Status: **NOT RELEASE-READY**. This register records current CI evidence and verified implementation gaps. A green repository workflow does not prove a complete product journey or production deployment.

## Current repository evidence

| Repository | Current main SHA | Latest main CI | Result |
| --- | --- | --- | --- |
| services | bfa7dd2575140b452c59de510a994c424be4bcf9 | [Latest docs build](https://github.com/nurgeldiserikbay/services/actions/runs/42509373255), [latest Pages deployment](https://github.com/nurgeldiserikbay/services/actions/runs/42509372584) | PASS: generated HTML matches Markdown; Pages deployment succeeds. The separate reference contract checks remain on SHA 1acc3af68c75046c19aeee16cf185ef4ec112542; they are not production SDK or deployment proof. |
| services-back | 781d485610a077828dfe602dcdd97a14db58d86c | [Post-merge CI](https://github.com/nurgeldiserikbay/services-back/actions/runs/42506854030) | PASS: typecheck, build, Prisma validation, migration drift check, PostgreSQL 16 migrate/seed/smoke and unit/integration tests. This is a clean ephemeral database run, not production backfill, restore or rollback evidence. |
| services-front | 363e0e8495bc05796cca507ad4a25a65cea03b51 | [Frontend foundation CI](https://github.com/nurgeldiserikbay/services-front/actions/runs/42486560324) | PASS for repository CI gates; this is not full product E2E or mobile-device acceptance. |
| services-admin | 1121883b70134e6a0a52ea0187ee2de2bed20b67 | [Post-merge CI](https://github.com/nurgeldiserikbay/services-admin/actions/runs/42506834383) | PASS: typecheck, tests and build; privileged admin journey and mounted moderation remain unverified. |

The services contract workflow validated the reference Prisma schema, OpenAPI bundle and semantic checks, and SQL constraints/smoke on ephemeral PostgreSQL 16 at the recorded reference SHA. Backend PR [#109](https://github.com/nurgeldiserikbay/services-back/pull/109) adds account-only schedule agreement runtime; its [CI run 42515494709](https://github.com/nurgeldiserikbay/services-back/actions/runs/42515494709) passed, but the PR remains unmerged. Backend CI now also applies the committed baseline through Prisma Migrate to a clean PostgreSQL 16 service, checks drift, repeats the safe geography seed, runs the constraint smoke and unit/integration suite. Neither workflow proves production backfill/rollback, backup restoration, cross-repository E2E or independent sign-off.

## Readiness by release gate

| Gate | Status | What is established | What remains |
| --- | --- | --- | --- |
| G0 — product, architecture and contracts | **PARTIALLY VERIFIED** | Accepted product decisions are documented; current docs build passes, reference contract checks pass at their recorded SHA, and backend baseline migration/PG16 smoke pass on current backend main. | Independent design review/sign-off; complete contract and UX contradiction review; production-like backfill/rollback and dedicated concurrency evidence. |
| G1 — identity and platform foundation | **IN PROGRESS** | Backend, frontend and admin code and CI exist. | Demonstrate registered-account login/logout, session rotation/revocation, CSRF and end-to-end ACL in a real environment. |
| G2 — public catalog and pages | **IN PROGRESS** | Search and public-page code is present; frontend CI is green. | Verify a complete search → profile/offer journey against backend API and real database, including privacy/cache behavior and mobile UX. |
| G3 — requests, availability and reviews | **IN PROGRESS** | Backend main CI passes; open PR #109 adds account schedule runtime and request-bound guest authorization; latest guest commit awaits CI. | Validate/merge PR #109; verify configured OTP delivery and request-to-seller journey across web, API and database; prove race behavior and notification delivery end-to-end. |
| G4 — trust, moderation and operations | **BLOCKED** | Admin shell and backend authorization foundations remain fail-closed. | Approve and implement MFA/onboarding and reconcile four backend roles with six canonical admin roles; complete moderation/audit APIs, notification delivery, accessibility, security and restore evidence. |
| G5 — limited pilot | **NOT STARTED** | No pilot release evidence reviewed. | Select market/category, obtain legal/privacy sign-off, configure providers/hosting/monitoring/support, run load and real-device acceptance, and document rollback/restore. |

## Release blockers

- Account and guest schedule runtime are in unmerged PR #109; latest guest authorization changes await CI/PostgreSQL validation.
- Cross-repository guest/customer-to-seller E2E with real configured OTP delivery has not been demonstrated.
- A complete registered-account and seller journey has not been demonstrated across backend, web and database.
- Production OTP/email/SMS providers, notification delivery, session recovery and abuse controls are not verified.
- Admin MFA, staff onboarding/recovery, canonical role reconciliation and operational moderation/audit workflows are not complete.
- No production data backfill/rollback, backup restore drill, incident runbook, load report, accessibility/mobile acceptance, or staging deployment evidence has been reviewed.
- Pilot-market legal, privacy, regulated-category and data-residency approval is outstanding.

## Next sequence

1. Validate and review backend PR #109 head `bc30bc1b3d8b1743054e801913ba91852df225d9`; then verify configured OTP delivery plus customer-to-seller staging journeys, including authorization failures and retries.
2. Record exact end-to-end evidence for registered sign-in and the seller request lifecycle across all four repository SHAs.
3. Close the remaining contract, security, operations, UX and pilot gates with named approvers and reproducible evidence.

Do not summarize this state as a percentage: green CI covers only the checks named above, while the release blockers span implementation, external services, legal review and deployment.
