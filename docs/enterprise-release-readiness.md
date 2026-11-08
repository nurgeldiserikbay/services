# Services — enterprise release readiness (2026-11-08)

Status: **NOT RELEASE-READY**. This register records current CI evidence and verified implementation gaps. A green repository workflow does not prove a complete product journey or production deployment.

## Current repository evidence

| Repository | Current main SHA | Latest main CI | Result |
| --- | --- | --- | --- |
| services | 1acc3af68c75046c19aeee16cf185ef4ec112542 | [Docs build](https://github.com/nurgeldiserikbay/services/actions/runs/42467985158), [contract and PostgreSQL checks](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221) | PASS: generated HTML is current; OpenAPI bundle/semantic checks, reference Prisma validation, ephemeral PostgreSQL constraints and smoke pass. This validates design artifacts, not production migrations. |
| services-back | c46f44c7fa9df62dbf0acf992cf925351f261f7f | [Main CI](https://github.com/nurgeldiserikbay/services-back/actions/runs/42486841364) | FAIL: TypeScript parsing stops at test/guest-verified-request-flow.test.ts. [PR #100](https://github.com/nurgeldiserikbay/services-back/pull/100) fixes the two assertions; its [full CI run](https://github.com/nurgeldiserikbay/services-back/actions/runs/42487586907) passes, but the fix is not yet merged to main. |
| services-front | 363e0e8495bc05796cca507ad4a25a65cea03b51 | [Frontend foundation CI](https://github.com/nurgeldiserikbay/services-front/actions/runs/42486560324) | PASS for repository CI gates; this is not full product E2E or mobile-device acceptance. |
| services-admin | 3e916aabb50d43f11e5837bc136d52a13d506cae | [Admin foundation CI](https://github.com/nurgeldiserikbay/services-admin/actions/runs/42486948605) | PASS for repository CI gates; privileged administration remains fail-closed and is not a released workflow. |

The services contract workflow validates the reference Prisma schema, bundles the OpenAPI draft, runs the API semantic checker, applies constraints.sql to an ephemeral PostgreSQL 16 database, and executes smoke.sql. It does not run production migrations against production-like data, prove transaction races, or provide independent design sign-off.

## Readiness by release gate

| Gate | Status | What is established | What remains |
| --- | --- | --- | --- |
| G0 — product, architecture and contracts | **PARTIALLY VERIFIED** | Accepted product decisions are documented; current docs build, contract checks, reference Prisma validation and PostgreSQL smoke pass on the services SHA above. | Independent design review/sign-off; complete contract and UX contradiction review; production migration/backfill and concurrency evidence. |
| G1 — identity and platform foundation | **IN PROGRESS** | Backend, frontend and admin code and CI exist. | Demonstrate registered-account login/logout, session rotation/revocation, CSRF and end-to-end ACL in a real environment. |
| G2 — public catalog and pages | **IN PROGRESS** | Search and public-page code is present; frontend CI is green. | Verify a complete search → profile/offer journey against backend API and real database, including privacy/cache behavior and mobile UX. |
| G3 — requests, availability and reviews | **IN PROGRESS** | Backend domain and database tests exist; PR #100 fixes the currently failing main typecheck. | Merge/retest the backend fix; verify guest OTP, seller inbox, accept/decline, status, idempotency, notifications, schedule agreement and cancellation end-to-end. |
| G4 — trust, moderation and operations | **BLOCKED** | Admin shell and backend authorization foundations remain fail-closed. | Approve and implement MFA/onboarding and reconcile four backend roles with six canonical admin roles; complete moderation/audit APIs, notification delivery, accessibility, security and restore evidence. |
| G5 — limited pilot | **NOT STARTED** | No pilot release evidence reviewed. | Select market/category, obtain legal/privacy sign-off, configure providers/hosting/monitoring/support, run load and real-device acceptance, and document rollback/restore. |

## Release blockers

- Backend main must return to green after PR #100 is reviewed and merged.
- A complete registered-account and seller journey has not been demonstrated across backend, web and database.
- Production OTP/email/SMS providers, notification delivery, session recovery and abuse controls are not verified.
- Admin MFA, staff onboarding/recovery, canonical role reconciliation and operational moderation/audit workflows are not complete.
- No production-like migration/backfill, backup restore drill, incident runbook, load report, accessibility/mobile acceptance, or deployment evidence has been reviewed.
- Pilot-market legal, privacy, regulated-category and data-residency approval is outstanding.

## Next sequence

1. Review and merge the green backend syntax-fix PR, then verify a green backend main run.
2. Record exact end-to-end evidence for registered sign-in and the seller request lifecycle across all four repository SHAs.
3. Close the remaining contract, security, operations, UX and pilot gates with named approvers and reproducible evidence.

Do not summarize this state as a percentage: green CI covers only the checks named above, while the release blockers span implementation, external services, legal review and deployment.
