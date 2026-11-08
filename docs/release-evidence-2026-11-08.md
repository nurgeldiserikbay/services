# Services — release evidence register (2026-11-08)

> Status: **NOT RELEASE APPROVED**. This register records evidence, not estimated percentages. It supplements [acceptance checklist](ru/26-acceptance-checklist.md) and [project progress](../PROJECT_PROGRESS.md). Do not convert a successful CI run into a claim of end-to-end or production readiness.

## Repository observations

| Component | Observed source | Evidence | Missing release proof |
| --- | --- | --- | --- |
| Backend | `nurgeldiserikbay/services-back` | README lists catalog, public profiles, guest verification, seller inbox and session modules; recent Backend foundation CI successful | Exact release SHA CI, DB migration/rollback, live OTP, real-DB cross-role E2E, security review |
| Frontend | `nurgeldiserikbay/services-front` | README documents kk/ru search, guest/seller UI, gated notification and OTP BFF; recent Frontend foundation CI successful | Gated flows enabled only after secure provider setup, backend-connected E2E, PWA/mobile accessibility and staging |
| Admin | `nurgeldiserikbay/services-admin` | README explicitly describes **unmounted** moderation and audit UI components; recent Admin foundation CI successful | Privileged login/MFA, backend authorization, audited moderation writes, actual operational admin screens |
| Canonical docs | `nurgeldiserikbay/services` | 26 acceptance chapters, OpenAPI draft, ADRs and architecture diagrams | Reconciliation of outdated progress snapshots and exact SHA/contract evidence |

## Verified CI snapshot — 2026-11-08

The following exact commits passed GitHub Actions **after merge**:

| Repository | Commit | Run | Verified scope |
| --- | --- | --- | --- |
| services-back | `781d485610a077828dfe602dcdd97a14db58d86c` | [Backend foundation CI](https://github.com/nurgeldiserikbay/services-back/actions/runs/42506854030) | Typecheck, build, Prisma validation, baseline migration drift, PostgreSQL 16 migrate/seed/smoke, required-table assertions, unit/integration tests |
| services-front | `363e0e8495bc05796cca507ad4a25a65cea03b51` | [Frontend foundation CI](https://github.com/nurgeldiserikbay/services-front/actions/runs/42486560324) | Frontend workflow successful; cross-repository staging E2E not established |
| services-admin | `1121883b70134e6a0a52ea0187ee2de2bed20b67` | [Admin foundation CI](https://github.com/nurgeldiserikbay/services-admin/actions/runs/42506834383) | Typecheck, tests, build; privileged admin journey not established |
| services | `55345c9e488f62b89ac47b56f2041ec29216c107` | [Docs CI](https://github.com/nurgeldiserikbay/services/actions/runs/42506859224) | Documentation workflow successful; independent product/security sign-off not established |

Backend PR #100, Admin PR #14 and Docs PR #13 are merged. PostgreSQL migration checks in backend CI **are verified**, but backup/restore, staging, provider-backed OTP and cross-repository E2E remain unverified. These SHA values are an observed snapshot, not a frozen release manifest.

## Blocking release gates

- [ ] **R1 Contract parity:** pin all four repository SHAs; lint and bundle OpenAPI; test actual backend routes against generated front/admin clients; record discrepancies.
- [ ] **R2 Identity and security:** prove guest OTP and registered-account flows with real configured delivery; verify CSRF, rate limits, session expiry/revocation, cross-account isolation, RBAC and privileged MFA.
- [ ] **R3 Marketplace E2E:** on migrated PostgreSQL test guest request -> seller inbox -> accept/decline -> status -> both-party notifications, including duplicate submissions, concurrent decisions and network retries.
- [ ] **R4 Scheduling and cancellations:** prove bilateral time agreement, timezone/DST snapshots, seller-configured cancellation windows, reliability adjustment only when authorized, and atomic notification intents.
- [ ] **R5 Admin operational readiness:** mount authorized moderation and audit routes only after server-side role checks, real persistence, audit sanitization and negative tests.
- [ ] **R6 Deployment:** staging with secret management and KZ residency evidence; backup **and restore drill**; observability/alerts, load tests, accessibility and real-device smoke tests; documented rollback.
- [ ] **R7 Documentation:** reconcile API/Prisma/ADR/user guides, environment variables, incident runbooks, privacy/retention and operator procedures; capture reviewer sign-off.

## Evidence required to close each gate

For every checkbox record: owner, date, four repository commit SHAs, contract version, reproducible test command, CI run URL, staging environment (without secrets), observed pass/fail, negative tests and approver. Any missing evidence keeps the gate open.

## Priority execution order

1. Backend PR #100 is merged and post-merge CI passed. Next: prove the end-to-end guest verification flow against configured provider and deployed frontend; record negative authorization tests.
2. Run one integrated staging journey with real PostgreSQL and authorized seller/guest sessions. Do not enable public OTP until provider, ingress and abuse controls are verified.
3. Implement admin privileged auth and audited moderation API before mounting the currently unmounted presentation components.
4. Close infrastructure and documentation gates, then publish a versioned release manifest.

**Important correction:** earlier 75–85% estimates were not evidence-based release completion measurements. No numerical readiness percentage should be treated as verified until all acceptance gates are audited.
