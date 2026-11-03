# G0 — Architecture, documentation and contracts sign-off (Services)

**Snapshot:** 2026-11-03. **Release architecture:** full multi-market Services platform with staged delivery; no architectural shortcuts based on the term MVP.

## What G0 signs off

G0 signs off a coherent **reference specification**: domain decisions, API surface, Prisma reference models, database invariants, security boundaries, and a testable implementation plan. G0 does **not** assert that NestJS, Next.js, Capacitor, admin moderation, deployment, migrations on real data, law compliance or concurrency tests already work in production.

| Gate | Requirement | Evidence / canonical file | State |
| --- | --- | --- | --- |
| Domain source of truth | Requests, seller vs performer, affiliation end, schedule agreements, reliable cancellation | ADR-0003/0004/0006/0007/0013 | DESIGNED |
| Privacy and guest security | OTP resend/rate/cost, scoped recovery, cookies/native proof, no token URL | ADR-0005/0008/0012/0013; OpenAPI | DESIGNED |
| Reviews and seller identity | Anonymous authors, retained aggregates, seller XOR and centralized ACL | ADR-0011; Prisma/SQL | DESIGNED |
| Time, no-show and appeal | IANA/UTC revisions, grace, no-show report separated from effective penalty | ADR-0012; Prisma and OpenAPI | DESIGNED |
| Publication consistency | Public read projection with revision/version fence and fail-closed permission revocation | ADR-0010; SQL trigger | DESIGNED |
| Residency and compliance | Deployment data-flow map, subprocessor/telemetry inventory and legal review | ADR-0009 | IMPLEMENTATION GATE |
| API contract validation | Redocly bundle + mandatory authorization/path invariants | `.github/workflows/contracts.yml` | VERIFY LATEST SHA |
| Reference Prisma/schema | Prisma validate and temporary PostgreSQL 16 db push | `.github/workflows/contracts.yml` | VERIFY LATEST SHA |
| SQL safeguards | Postgres constraints.sql and smoke.sql; no missing cancellation intents or bypass | `.github/workflows/contracts.yml` | VERIFY LATEST SHA |
| Generated docs | build-site, index.html equal to MD, check-docs | `.github/workflows/deploy-docs.yml` | VERIFY LATEST SHA |
| Sign-off review | No unresolved high-severity design contradictions; owner/reviewer approval | PR review discussion | NOT SIGNED |

## Key decisions after independent review

1. **Affiliation:** withdraw public consent immediately; operational status `ENDED` cannot silently abandon currently allocated `PENDING`/`ACCEPTED` company requests. Performer reassignment needs customer confirmation. DB row locking protects new assignments versus closure (ADR-0007).
2. **Guest:** expiring capabilities are not indefinitely refreshed. Recover via fresh original-contact OTP, temporary recovery proof, then single-request access; no bearer link, no implicit account creation (ADR-0008/0013).
3. **Outbox:** insert parent `DomainOutboxEvent` then two dependent cancellation intents inside the same transaction. Commit-time validation is retained; worker delivery may retry independently (ADR-0013).
4. **Seller:** cancellation policy comes from the original `ServiceOffer` owned by professional or organization and is unaffected by performer assignment. No performer does not imply no seller (ADR-0013).
5. **Capacity:** keep cross-context BusyBlock exclusion for one performer. Renting a salon seat doesn't create two simultaneous human capacities (ADR-0013).
6. **No-show:** 15-minute eligibility delay; claim remains separate from final reliability event; moderator decision, appeal and reversible history (ADR-0012).
7. **Time:** compare actual instants using UTC and retain original wall clock/zone/offset/revision; if TZDB rules change, reconcile before any penalty (ADR-0012).
8. **Caching:** stale/read projection is never sufficient proof of publication permission; version fencing and revocation guard are mandatory (ADR-0010).

## G0 verification evidence record

Use the final GitHub PR HEAD SHA. For each workflow record URL, status, time, and the SHA tested. A previous green run does not automatically approve a newer commit.

- Reference schema: `contracts/prisma/schema.prisma`
- Invariants: `contracts/prisma/constraints.sql`
- Database assertions: `contracts/prisma/smoke.sql`
- API: `contracts/openapi.yaml` and `scripts/check-api-contract.mjs`
- Documentation rendering: `scripts/build-site.mjs` and `scripts/check-docs.mjs`

### G1 / implementation prerequisites (not G0 proof)

- Generate reviewed migrations on actual backend version, test production-like backfills, run multi-connection race tests and rolling deploy.
- Build authorization for seller/performer reassignment, guest recovery and no-show admin workflow; test IDOR, moderation, retries and abuse limits.
- Test real Android/iOS deep links, browser CSRF/cookies, timezone updates, outbox replay and permissions at the CDN edge.
- Perform Kazakhstan/country-level legal compliance and processor residency review, with deployment evidence.
- Run load/performance, accessibility/localization, security, observability and incident-response acceptance.

**Sign-off rule:** label G0 `CONTRACT-VALIDATED` only when all four automated checks pass on the final SHA and an independent design review is recorded. Never label the platform itself `IMPLEMENTATION-READY` or `PRODUCTION-READY` by passing specification CI.
