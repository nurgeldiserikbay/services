# IMPLEMENTATION_READY — Services: status and release gates

**Snapshot:** 2026-11-02, main-based final handoff. **Specification content: COMPLETE FOR MVP HANDOFF; technical contract validation: PENDING EVIDENCE.** This is a readiness register, not evidence of running backend/frontend code, successful CI, security approval or regulatory compliance.

## Product decisions preserved

Global open services catalog with local search; public pages/contact without login; professionals and organizations as separate sellers; company view is a permissioned projection, never a copied professional identity. Simple requests are accepted or declined without quotes, payments or platform price negotiation. Phone/WhatsApp contact and calendars remain optional. Cancellation policies are seller-configured, both parties receive notification intents, customer and provider reliability are independent from quality reviews. Guest requests must never silently create accounts.

Canonical decisions: `docs/ru/01-product.md`, ADR-0001..0005. ADR-0006 is **ACCEPTED as a product decision on 2026-11-02**; technical contracts, tests and release readiness remain unverified.

## Readiness matrix (only verified evidence may close a gate)

| Gate | Status | Evidence available | Blocking next action |
| --- | --- | --- | --- |
| Domain decisions / simple requests | DESIGNED | ADR-0003/0004, state chapters | Reconcile old Booking/Inquiry language in remaining chapters |
| Schedule agreement | ACCEPTED PRODUCT RULE / UNVERIFIED TECH | ADR-0006, ScheduleProposal and API drafts | Validate agreement persistence, authorization and race conditions |
| Guest auth / schedule OTP | INCOMPLETE | ADR-0005 addendum, MANAGE_SCHEDULE Prisma enum | Review new guest schedule challenge/verify OpenAPI routes; implement auth and negative tests |
| Cancellation history | DESIGN ONLY | CancellationSnapshotRevision, algorithm document | Tie evaluated revision to cancellation audit and test transactions |
| Request/idempotency | DESIGN ONLY | IdempotencyRecord, HTTP descriptions, test matrix | Specify retention/response redaction/crash recovery, migration and parallel DB tests |
| Prisma / PostgreSQL | UNVERIFIED | Reference Prisma schema and constraints.sql | Run format/validate; generate migrations; verify SQL on real PostgreSQL |
| OpenAPI / typed clients | UNVERIFIED | OpenAPI 3.1 draft | Lint/bundle, validate operation schemas, generate clients and compare enum values |
| UX / accessibility / localization | PARTIAL | Prototype, UX mapping | Finalize complete kk/ru, offline/error/guest flow, mobile/a11y review |
| Deployment security | NOT SIGNED OFF | Security drafts | Threat model, secrets, CSRF/ACL/IDOR, storage, backups, retention, incident review |
| Country/category launch | NOT SIGNED OFF | Country flags and legal considerations | Select pilot market, external legal/regulatory and privacy review |
| CI + E2E | UNVERIFIED FOR NEW CONTRACTS | Proposed test scenarios | Record passing CI/DB/E2E evidence per commit |

## Priority blocker queue

### P0 — close before implementation of booking/schedule domain
1. Implement and test accepted two-party scheduling semantics. Confirmed time must have demonstrated mutual assent; `desired_start_at`, a seller-only PATCH or unverified telephone note never authorizes automatic customer penalty.
2. The proposed guest OTP routes for `MANAGE_SCHEDULE` are now in OpenAPI. Implement issuance/verification securely and test negative flows; `READ_CANCEL` still cannot confirm time.
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

Complete the guest schedule OTP challenge/verify OpenAPI schemas, validate accepted ADR-0006, then implement and validate transactional Prisma/SQL migrations in the backend repository. The documentation PR can be merged only after reviewing consistency and CI; do not claim it is fully implementation-ready solely because this file exists.

## Update — 2026-11-02, guest schedule API draft

OpenAPI now describes `POST /guest-requests/{id}/schedule-access/challenges` and `POST /guest-requests/{id}/schedule-access/challenges/{challengeId}/verify`, returning a request-specific `MANAGE_SCHEDULE` capability. This addresses the **missing API description**, not the implementation or validation gate. The existing challenge ID is not itself authorization, and guest access must not be promoted to an account session. No proof of OpenAPI bundling, generated client compatibility, OTP transport, PostgreSQL tests or security verification is recorded yet.

## Параллельная реализация — план работ

Добавлен [план параллельной реализации](docs/architecture/parallel-implementation-plan.md) с идентификаторами DOC-01..02, BE-01..06, WEB-01..03, ADM-01, OPS-01 и QA-01, зависимостями и вертикальными сценариями. **Это разбивка задач, а не выполненная реализация.** Для каждого этапа обязательно фиксировать результаты CI и security review.

## Статический аудит контракта

См. [аудит от 2026-11-02](docs/architecture/contract-audit-2026-11-02.md): подтверждены описания гостевых schedule API, расширен `scripts/check-api-contract.mjs`. **Реальные validator/CI/DB test результаты пока не зарегистрированы.**

## Финальный список проверки документов

[Final documentation checklist](docs/architecture/final-documentation-checklist.md) — проверяемые условия по OpenAPI, Prisma/SQL, бизнес-правилам, UX/локализации, HTML и передаче в разработку. В таблице evidence нельзя ставить PASS без ссылки на реальный запуск и SHA.

## Final handoff decision (2026-11-02)

[Final handoff and scope freeze](docs/architecture/final-handoff.md) records the accepted MVP business rules and identifies remaining **implementation/verification gates**. Do not interpret content-complete as a successful PostgreSQL migration, live authorization implementation or production release. ADR-0006 is accepted. Use this handoff as the entry point for backend/frontend/admin development tasks and attach CI run evidence before marking contracts validated.

## Security and lifecycle review addendum (2026-11-03)

Three **proposed** ADRs capture newly identified implementation gates:
- [ADR-0007](docs/adr/0007-affiliation-active-requests.md): deactivate public company view immediately, but prevent operational affiliation closure while assigned corporate requests remain pending or accepted; require customer consent to a replacement performer. Count active requests regardless of scheduled time.
- [ADR-0008](docs/adr/0008-guest-abuse-and-recovery.md): guest OTP spend/rate limits, risk-adaptive CAPTCHA, no unverified pending requests, request-scoped HttpOnly web session and OTP recovery without secret-bearing links.
- [ADR-0009](docs/adr/0009-kz-data-residency-and-telemetry.md): Kazakhstan pilot PII residency, telemetry redaction, processor/region inventory, test/prod isolation and legal review of cross-border transfers.

**Important:** these are new security and lifecycle design reviews, not code already implemented or legal approval. Their runtime enforcement and migration tests belong to the implementation phase. Do not mark contract-validated without CI and DB evidence.

- [ADR-0010](docs/adr/0010-published-company-view.md): materialized public company professional view, revision fences and fail-closed disclosure on revoked permissions; eventual CDN purge alone is insufficient.
- [CAN-T13](contracts/cancellation-deadline-algorithm.md): 15-minute grace after **both** request acceptance and confirmed time agreement, capped by service start; no penalty on mere proposed date.

- [ADR-0011](docs/adr/0011-review-erasure-and-seller-identity.md): nullable review authors and anonymization after lawful erasure; retain seller XOR FK for MVP with centralized ACL policy, revisit SellerIdentity only if measurable benefits justify migration. Reference Prisma/SQL changed, but actual migration and erasure graph are **not implemented**.

- [ADR-0012](docs/adr/0012-timezone-noshow-guest-links.md): common platform-wide rules for timezone/TZDB changes, no-show adjudication workflow, and guest web/native deep-link boundaries. **Scope is full product architecture, not an MVP shortcut**; implementation evidence and cross-platform tests are still required.
