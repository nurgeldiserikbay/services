# Services — parallel delivery board (2026-11-08)

**Status:** coordination baseline, not a production-readiness claim. This file is the handoff point for independent backend, frontend and admin sessions.

## Shared source of truth
1. Product decisions: `docs/ru/01-product.md`, `docs/ru/12-roadmap-decisions.md`, ADR-0003/0004/0005.
2. API: `contracts/openapi.yaml` (partial design draft) and `contracts/api-mvp-matrix.md`. The deployed API must be reconciled against these before client integration.
3. Data: `contracts/prisma/*` (reference, not proof of deployed migrations).
4. Every cross-repository contract change starts with a docs PR: include operation, request/response DTO, status codes, auth, idempotency, privacy and versioning. Consumers must not guess missing fields.

## Workstreams (independent branches / separate agents)
| Owner | Repository | Next independently deliverable slice | Completion evidence |
| --- | --- | --- | --- |
| Backend | services-back | Moderation read authorization tests, admin session/MFA prerequisites, account OTP security and real DB request-state checks | Typecheck, unit + PostgreSQL integration tests, API examples and migration proof |
| Frontend | services-front | Public request/status and seller inbox resilience, account OTP BFF security, kk/ru accessibility | Typecheck, unit + browser E2E against mocks, then real staging backend |
| Admin | services-admin | Unmounted moderation/audit presentation, typed BFF parsing, role-specific empty/error states | Typecheck, unit tests, fail-closed role tests; do not expose routes without backend MFA |
| Integrator | services | Contract diff, dependency tracking, CI evidence and end-to-end release gates | Reviewed contract, all three exact SHAs, real staging E2E |

## Rules to avoid collisions
- One writer per repository file at a time; each agent owns only its repository and assigned feature slice.
- No direct edits to another repository or to the shared OpenAPI from a feature agent without coordination.
- Feature branches + PRs for concurrent edits; merge only after CI and contract review. Direct main commits are reserved for explicit owner instructions and isolated nonconflicting changes.
- Default-off admin and OTP features stay off until real provider/MFA, ingress, CSRF, rate limits and DB-backed sessions are proven.
- A green unit suite does not replace real PostgreSQL, real HTTP E2E, security review or Kazakhstan residency verification.

## Integration sequence
1. Integrator compares implemented routes/DTOs with draft OpenAPI; records each mismatch and decides whether contract or implementation changes.
2. Backend delivers reviewed API/migrations with negative authorization tests.
3. Frontend/Admin consume typed contracts and mocks independently, then switch to staging only behind flags.
4. Integrator executes guest request → seller decision → notification/cancellation and staff login → moderation read/decision → audit, including denial, replay and concurrency cases.
5. Record CI URLs, commits, DB migration IDs, feature flags, reviewers, rollback and staging evidence before release.

## Handoff template
- Repository / branch / commit:
- Requirement ID and API operation:
- Files changed:
- Feature flag (default):
- Tests actually executed and result:
- Pending dependency / security risk:
- Contract changes proposed:
- Next integration owner:

Do not mark any item done without executable evidence.
