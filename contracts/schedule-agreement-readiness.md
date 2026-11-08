# Schedule agreement — integration readiness checklist

Status: **ACCEPTED as a product rule; account schedule runtime is implemented in PR #109 and CI passed 2026-11-09; PR is not merged. Guest runtime remains unimplemented.**
References: ADR-0006, ADR-0004, `contracts/openapi.yaml`, `contracts/prisma/schema.prisma`.

## Latest implementation evidence — 2026-11-09

- Backend PR [#109](https://github.com/nurgeldiserikbay/services-back/pull/109), head `fde9510905a01fd49676cbd7e50329da1c347219`, adds bearer-authenticated propose, confirm and decline handlers for accepted requests whose customer has an account. It is open for review and is not merged.
- [Backend foundation CI run 42515494709](https://github.com/nurgeldiserikbay/services-back/actions/runs/42515494709) passed typecheck, build, Prisma validation, migration drift, PostgreSQL 16 migration/seed/smoke, and unit/integration tests on that PR head.
- Runtime transactions persist revisions, request-version checks, idempotency, domain events, outbox notification intents, cancellation snapshot history and its current projection. Confirmation checks known calendar conflicts; seller reschedule suspends customer reliability penalties until a new agreement. Customer cancellation during a pending seller reschedule remains penalty-free.
- Guest requests remain fail-closed: schedule challenge/verification and request-scoped `MANAGE_SCHEDULE` issuance are not implemented. No cross-repository staging journey, configured guest OTP delivery, security review or external legal approval is established.
- Therefore product rule is **accepted**, backend account path is **implemented and CI-verified in an open PR**, and schedule feature is **not merged or release-ready**. Do not enable guest schedule actions or claim full TECH-03/04 completion.

## Contract snapshot
- Prisma `ScheduleProposal` stores request, revision, initiator, proposed UTC timestamps, IANA timezone, status, resolver.
- Partial unique SQL index ensures one active `PROPOSED` per request; unique revision per request.
- API design includes POST propose, POST confirm, POST decline, each with Idempotency-Key and If-Match.
- Legacy seller-only schedule PATCH is deprecated and must not establish a penalty-bearing confirmed time.

## Remaining implementation and release gaps

1. **Guest capability:** API draft describes request-scoped `MANAGE_SCHEDULE`, but backend issuance/verification, OTP, expiry, negative tests and guest UI remain outstanding. `READ_CANCEL` is insufficient.
2. **Concurrency coverage:** request row lock and version/idempotency checks are implemented. CI covers replay, confirmation, snapshots and notifications; a dedicated concurrent proposal/confirm/cancel race suite remains open.
3. **Cancellation audit linkage:** immutable agreement snapshots and current projection are updated atomically. Cancellation event/audit linkage to the exact evaluated schedule revision still needs review.
4. **Calendar validation:** confirmation writes or updates a busy block for an enabled, approved calendar and relies on the database exclusion constraint. Dedicated personal/company slot-conflict race tests and validation against allocation hours remain open.
5. **Rate limiting and transport:** API uses bearer auth, If-Match and Idempotency-Key. Endpoint-specific rate limiting and complete error/contract integration remain to be verified.
6. **Time horizon:** UTC/IANA/local-wall-time/offset validation rejects DST gaps and mismatched fold offsets. ADR-0006 leaves maximum horizon open; no horizon is invented in the implementation.
7. **Notifications and UX:** domain outbox plus in-app intents are atomic. Delivery/retry evidence, guest UX, kk/ru copy, accessibility and cross-repository behavior remain outstanding.

## Integration and negative tests

Verified by backend PR #109 CI:
- Same idempotency key replays a single proposal; changed payload with that key conflicts.
- Seller proposal suspends customer penalty eligibility; recipient confirmation atomically records schedule and cancellation snapshot history.
- Customer can cancel without reliability penalty while seller reschedule is pending.
- Request receives outbox events and counterparty/participant in-app intents.

Still required:
- Concurrent proposal/confirm/cancel races and stale-version behavior.
- Initiator cannot confirm its own proposal; unknown or revoked participants remain denied.
- Calendar conflict tests across personal/company contexts.
- Guest `READ_CANCEL` cannot act; only a verified `MANAGE_SCHEDULE` capability may act after that flow is implemented.
- Notification delivery failure/retry, frontend integration and a staging request-to-seller journey.

## Verification gate
Backend PR #109 passed typecheck, build, Prisma validation, migration drift, clean PostgreSQL 16 migration/seed/smoke and unit/integration CI on 2026-11-09. Before schedule can be considered release-ready: review and merge the account path; add guest `MANAGE_SCHEDULE` issuance/verification; complete dedicated race, rate-limit and cancellation-audit review; test cross-repository UX and configured OTP delivery; and obtain security, kk/ru accessibility and legal review. These release checks are not established by the passing repository CI.

## Historical design verification notes

The 2026-11-02 review verified only proposed schema/API design. Its statements that backend schedule handlers were absent are superseded by backend PR #109 for registered-account paths. Guest capability issuance, complete end-to-end authorization, runtime rate limiting, independent security review, client behavior and external legal requirements remain unverified.

## Correction after OpenAPI YAML fix (2026-11-02)

The broken `RequestVersion`/`IdempotencyKey` YAML parameter section was repaired in commit `1cf24f60`. The contract checker expects challenge/verify routes and schedule write preconditions. Reference OpenAPI/Prisma/SQL checks passed at services SHA 1acc3af68c75046c19aeee16cf185ef4ec112542 in [workflow 42467985221](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221); backend migration and PostgreSQL tests passed later at backend SHA 781d485610a077828dfe602dcdd97a14db58d86c in [workflow 42506854030](https://github.com/nurgeldiserikbay/services-back/actions/runs/42506854030). These validate the respective design files and database migration, not mounted schedule routes or guest OTP flow.
