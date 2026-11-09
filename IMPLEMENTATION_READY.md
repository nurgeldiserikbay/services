# IMPLEMENTATION_READY — Services: status and release gates

**Historical baseline:** 2026-11-03, full-platform G0 contract review. **Current evidence update:** 2026-11-09. Specification content is designed for platform-wide handoff; implementation and release readiness remain separate. This is a readiness register, not evidence of running backend/frontend code, successful CI, security approval or regulatory compliance.

## Current evidence snapshot — 2026-11-08

This section supersedes older CI/unverified labels only for the exact checks listed here. It does not mark any implementation or production gate complete.

| Repository / gate | SHA | Verified result |
| --- | --- | --- |
| services docs main | bfa7dd2575140b452c59de510a994c424be4bcf9 | [Docs build](https://github.com/nurgeldiserikbay/services/actions/runs/42509373255) and [Pages deployment](https://github.com/nurgeldiserikbay/services/actions/runs/42509372584) pass. Reference Prisma/OpenAPI contract validation remains evidenced at 1acc3af68c75046c19aeee16cf185ef4ec112542 in [run 42467985221](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221). |
| services-back main | 781d485610a077828dfe602dcdd97a14db58d86c | [Post-merge CI](https://github.com/nurgeldiserikbay/services-back/actions/runs/42506854030) passes typecheck, build, Prisma validation, migration drift, PostgreSQL 16 migrate/seed/smoke and unit/integration tests. PR #100 is merged. |
| services-front main | 363e0e8495bc05796cca507ad4a25a65cea03b51 | [Foundation CI passes](https://github.com/nurgeldiserikbay/services-front/actions/runs/42486560324); end-to-end journey and real-device evidence remain outstanding. |
| services-admin main | 1121883b70134e6a0a52ea0187ee2de2bed20b67 | [Post-merge CI passes](https://github.com/nurgeldiserikbay/services-admin/actions/runs/42506834383); admin stays fail-closed pending MFA, onboarding and role-contract decisions. |

### Current status adjustments

- **Prisma / PostgreSQL:** backend main now passes Prisma validation, migration drift check, committed baseline deploy to clean PostgreSQL 16, seed-twice, constraint smoke and DB-backed unit/integration tests. Production-data backfill, rollback, backup restore and dedicated race-safety evidence remain open.
- **Schedule agreement:** ADR-0006 is accepted. Backend PR [#109](https://github.com/nurgeldiserikbay/services-back/pull/109) adds account and guest schedule flows. Account-only CI run 42515494709 passed; guest changes at head `589a13dc17d7948f4b04aa968774fd4c2aac3b7a` passed full CI run [42517736326](https://github.com/nurgeldiserikbay/services-back/actions/runs/42517736326). The PR is not merged; provider-backed OTP, guest negative/race coverage, cross-repository E2E and release sign-off remain open.
- **OpenAPI / typed clients:** reference OpenAPI bundle and semantic contract checks pass. Complete production DTO/error coverage and generated-client integration remain unverified.
- **CI + E2E:** docs, frontend, admin and backend main CI are green at the listed SHAs. Backend includes a clean PostgreSQL migration/test job. No cross-repository staging E2E or provider-backed OTP delivery evidence is recorded.
- **G0:** automated reference checks pass, but independent design sign-off is still NOT SIGNED; do not label G0 fully closed.

## Product decisions preserved

Global open services catalog with local search; public pages/contact without login; professionals and organizations as separate sellers; company view is a permissioned projection, never a copied professional identity. Simple requests are accepted or declined without quotes, payments or platform price negotiation. Phone/WhatsApp contact and calendars remain optional. Cancellation policies are seller-configured, both parties receive notification intents, customer and provider reliability are independent from quality reviews. Guest requests must never silently create accounts.

Canonical decisions: `docs/ru/01-product.md`, ADR-0001..0005. ADR-0006 is **ACCEPTED as a product decision on 2026-11-02**; technical contracts, tests and release readiness remain unverified.

## Readiness matrix (only verified evidence may close a gate)

| Gate | Status | Evidence available | Blocking next action |
| --- | --- | --- | --- |
| Domain decisions / simple requests | DESIGNED | ADR-0003/0004, state chapters | Reconcile old Booking/Inquiry language in remaining chapters |
| Schedule agreement | ACCOUNT PATH CI-VERIFIED; GUEST PATH IN OPEN PR | ADR-0006; backend PR #109 head `589a13dc17d7948f4b04aa968774fd4c2aac3b7a` | Validate latest CI/migration and guest negative cases; close provider, rate-limit, race, E2E and release gates |
| Guest auth / schedule OTP | IMPLEMENTED IN OPEN PR; BACKEND CI PASSED | Backend PR #109 head `589a13dc17d7948f4b04aa968774fd4c2aac3b7a`; CI run 42517736326 | Add guest-specific negative/race coverage; verify provider-backed OTP, guest UX and security review |
| Cancellation history | DESIGN ONLY | CancellationSnapshotRevision, algorithm document | Tie evaluated revision to cancellation audit and test transactions |
| Request/idempotency | DESIGN ONLY | IdempotencyRecord, HTTP descriptions, test matrix | Specify retention/response redaction/crash recovery, migration and parallel DB tests |
| Prisma / PostgreSQL | PARTIALLY VERIFIED | Backend main CI validates Prisma, rejects migration drift, deploys the committed baseline to clean PostgreSQL 16, repeats safe seed, runs constraint smoke and DB-backed tests | Exercise production-data backfill/rollback, restore and dedicated concurrency cases |
| OpenAPI / typed clients | PARTIALLY VERIFIED | OpenAPI bundle and semantic contract checker pass on the 2026-11-08 services CI run | Complete DTO/error coverage; generate clients and verify frontend/backend integration |
| UX / accessibility / localization | PARTIAL | Prototype, UX mapping | Finalize complete kk/ru, offline/error/guest flow, mobile/a11y review |
| Deployment security | NOT SIGNED OFF | Security drafts | Threat model, secrets, CSRF/ACL/IDOR, storage, backups, retention, incident review |
| Country/category launch | NOT SIGNED OFF | Country flags and legal considerations | Select pilot market, external legal/regulatory and privacy review |
| CI + E2E | PARTIALLY VERIFIED | Docs, frontend, admin and backend main CI pass at the listed SHAs; backend job includes migration and DB-backed tests | Record provider-backed cross-repository E2E, real-device and staging evidence |

## Priority blocker queue

### P0 — close before implementation of booking/schedule domain
1. Review and merge backend PR #109 for account schedule agreement after docs/contract sync. Confirmed time must have demonstrated mutual assent; `desired_start_at`, a seller-only PATCH or unverified telephone note never authorizes automatic customer penalty.
2. Guest `MANAGE_SCHEDULE` issuance/verification and schedule authorization are implemented in PR #109; validate the new migration and negative flows. `READ_CANCEL` remains insufficient.
3. Make cancellation deadline evaluation auditable, including rule revision, algorithm version, effective deadline, verified agreement and penalty suspension on seller-reschedule.
4. Specify atomic idempotency ledger lifetime and safe crash recovery; commit cancellation + release busy + event + **two logical notification intents** in one transaction.
5. Validate actual Prisma/SQL/OpenAPI syntax and implement negative integration tests, including two concurrent acceptances, reschedule vs cancel and guest ACL.

### P1 — prepare parallel delivery
1. Convert requirements into bounded tasks for `services-back`, `services-front` and `services-admin`, with file ownership, compatibility and independent PR reviews.
2. Define stable shared request/response types, error codes, localization keys and accessibility behavior.
3. Finish real UI flows for search, profile, company master projection, request details, two-sided schedule confirmation, notification status and calendar, with partial offline state.
4. Configure protected CI, staging, observability, migration rollback and secrets policy.

### P2 — pilot release gates
Select pilot countries/cities/categories; review regulated professionals, privacy notices, data residency, consent, retention, abuse/moderation and support playbooks. Run real-device and performance tests. No legal sign-off is inferred from Markdown.

## Acceptance evidence template

For every gate, record:
- decision owner, status and dated approval;
- exact source commit SHA and associated PR;
- affected artifacts (ADR, Prisma, SQL migration, OpenAPI, generated client, UI);
- reproducible command, environment and timestamp for all tests;
- negative paths (ACL/IDOR, conflict/race, guest expiry, retry, time zone);
- rollback plan, remaining risks and final reviewer.

**Meaning:** `DESIGNED` = source text exists. `VALIDATED` = checks passed and recorded. `IMPLEMENTED` = code exists and integration tests passed. `RELEASED` = launch conditions and production checks completed. Avoid presenting these as interchangeable.

## Next recommended bounded work item

Validate backend PR #109 head `589a13dc17d7948f4b04aa968774fd4c2aac3b7a` with CI, migration and negative DB cases; then verify provider-backed OTP and cross-repository request-to-seller staging, including ACL, rate limits and retries. Backend baseline migration CI is already green, while production data and rollback evidence remain open. Documentation PRs #13 and #16 and backend PR #100 are merged. Do not claim the product is release-ready solely because documentation and repository CI are green.

## Update — 2026-11-08, guest schedule backend implementation

The open backend PR #109 now contains request-bound OTP issuance/verification and `MANAGE_SCHEDULE` checks on schedule writes. Latest head `589a13dc17d7948f4b04aa968774fd4c2aac3b7a` passed full CI run [42517736326](https://github.com/nurgeldiserikbay/services-back/actions/runs/42517736326). Provider delivery remains disabled unless an approved adapter and deployment gates are configured.

## Update — 2026-11-02, guest schedule API draft

OpenAPI now describes `POST /guest-requests/{id}/schedule-access/challenges` and `POST /guest-requests/{id}/schedule-access/challenges/{challengeId}/verify`, returning a request-specific `MANAGE_SCHEDULE` capability. This addresses the **missing API description**, not the implementation or validation gate. The existing challenge ID is not itself authorization, and guest access must not be promoted to an account session. No proof of OpenAPI bundling, generated client compatibility, OTP transport, PostgreSQL tests or security verification is recorded yet.

## Параллельная реализация — план работ

Добавлен [план параллельной реализации](docs/architecture/parallel-implementation-plan.md) с идентификаторами DOC-01..02, BE-01..06, WEB-01..03, ADM-01, OPS-01 и QA-01, зависимостями и вертикальными сценариями. **Это разбивка задач, а не выполненная реализация.** Для каждого этапа обязательно фиксировать результаты CI и security review.

## Статический аудит контракта

См. [аудит от 2026-11-02](docs/architecture/contract-audit-2026-11-02.md): подтверждены описания гостевых schedule API, расширен `scripts/check-api-contract.mjs`. **Реальные validator/CI/DB test результаты пока не зарегистрированы.**

## Финальный список проверки документов

[Final documentation checklist](docs/architecture/final-documentation-checklist.md) — проверяемые условия по OpenAPI, Prisma/SQL, бизнес-правилам, UX/локализации, HTML и передаче в разработку. В таблице evidence нельзя ставить PASS без ссылки на реальный запуск и SHA.

## Final handoff decision (2026-11-02)

[Final handoff and scope freeze](docs/architecture/final-handoff.md) records the accepted platform-wide business rules and identifies remaining **implementation/verification gates**. Do not interpret content-complete as a successful PostgreSQL migration, live authorization implementation or production release. ADR-0006 is accepted. Use this handoff as the entry point for backend/frontend/admin development tasks and attach CI run evidence before marking contracts validated.

## Security and lifecycle review addendum (2026-11-03)

Three **proposed** ADRs capture newly identified implementation gates:
- [ADR-0007](docs/adr/0007-affiliation-active-requests.md): deactivate public company view immediately, but prevent operational affiliation closure while assigned corporate requests remain pending or accepted; require customer consent to a replacement performer. Count active requests regardless of scheduled time.
- [ADR-0008](docs/adr/0008-guest-abuse-and-recovery.md): guest OTP spend/rate limits, risk-adaptive CAPTCHA, no unverified pending requests, request-scoped HttpOnly web session and OTP recovery without secret-bearing links.
- [ADR-0009](docs/adr/0009-kz-data-residency-and-telemetry.md): Kazakhstan pilot PII residency, telemetry redaction, processor/region inventory, test/prod isolation and legal review of cross-border transfers.

**Important:** these are new security and lifecycle design reviews, not code already implemented or legal approval. Their runtime enforcement and migration tests belong to the implementation phase. Do not mark contract-validated without CI and DB evidence.

- [ADR-0010](docs/adr/0010-published-company-view.md): materialized public company professional view, revision fences and fail-closed disclosure on revoked permissions; eventual CDN purge alone is insufficient.
- [CAN-T13](contracts/cancellation-deadline-algorithm.md): 15-minute grace after **both** request acceptance and confirmed time agreement, capped by service start; no penalty on mere proposed date.

- [ADR-0011](docs/adr/0011-review-erasure-and-seller-identity.md): nullable review authors and anonymization after lawful erasure; retain seller XOR FK as a deliberate baseline with a centralized ACL policy with centralized ACL policy, revisit SellerIdentity only if measurable benefits justify migration. Reference Prisma/SQL changed, but actual migration and erasure graph are **not implemented**.

- [ADR-0012](docs/adr/0012-timezone-noshow-guest-links.md): common platform-wide rules for timezone/TZDB changes, no-show adjudication workflow, and guest web/native deep-link boundaries. **Scope is full product architecture, not an MVP shortcut**; implementation evidence and cross-platform tests are still required.


## G0 contract reconciliation — 2026-11-03

The latest [G0 contract acceptance register](docs/architecture/g0-contract-acceptance.md) is the canonical status source for sign-off. This repository contains reference schemas, not backend migrations. The G0 branch `contracts/g0-integrity-2026-11-03` adds scoped guest recovery API and session, reviewable no-show lifecycle, IANA/local/UTC schedule metadata, `PublishedCompanyProfessionalView` publication guard, affiliation/request exclusion and PostgreSQL smoke tests. Check the final PR HEAD workflow evidence before marking G0 `CONTRACT-VALIDATED`. Only an independent reviewer can grant design sign-off; successful CI alone does not implement security or production release gates.
