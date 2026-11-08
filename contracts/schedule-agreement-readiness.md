# Schedule agreement — integration readiness checklist

Status: **ACCEPTED as a product rule; runtime API not implemented**, evidence updated 2026-11-08.
References: ADR-0006, ADR-0004, `contracts/openapi.yaml`, `contracts/prisma/schema.prisma`.

## Latest implementation evidence — 2026-11-08

- Backend main `781d485610a077828dfe602dcdd97a14db58d86c` passes the [post-merge CI](https://github.com/nurgeldiserikbay/services-back/actions/runs/42506854030): Prisma validation and migration-drift check, clean PostgreSQL 16 migration, safe seed, constraint smoke and unit/integration suite.
- The committed backend schema and baseline migration contain `ScheduleProposal`, `CancellationSnapshotRevision`, request schedule reconciliation fields and the one-active-proposal database constraint. This verifies persisted structures and migration execution, not schedule-agreement behavior.
- Backend source currently has no `schedule-proposals` HTTP handlers for propose, confirm or decline. The routes in `contracts/openapi.yaml` remain design-only. Guest `MANAGE_SCHEDULE` issuance/verification is also not implemented as a schedule API flow.
- Therefore ADR-0006 is **product-accepted**, database structures are **migration-verified**, and schedule-agreement runtime is **not implemented**. Do not close TECH-03/04 or enable automatic schedule-based penalties.

## Contract snapshot
- Prisma `ScheduleProposal` stores request, revision, initiator, proposed UTC timestamps, IANA timezone, status, resolver.
- Partial unique SQL index ensures one active `PROPOSED` per request; unique revision per request.
- API design includes POST propose, POST confirm, POST decline, each with Idempotency-Key and If-Match.
- Legacy seller-only schedule PATCH is deprecated and must not establish a penalty-bearing confirmed time.

## Blocking contract gaps to settle before coding
1. **Guest capability gap (partially documented):** Prisma now defines `MANAGE_SCHEDULE`, and ADR-0005 includes a proposed contact re-verification flow. OpenAPI now describes the two guest schedule challenge/verify routes. Their presence is design-only: backend authorization, OTP, token expiry, negative tests and contract validation remain outstanding; no guest schedule action may be enabled until verified. `READ_CANCEL` remains insufficient.
2. **Active revision:** Partial unique index permits one pending proposal; a proposed revision must be monotonically allocated under a per-request lock. On supersede, resolve old row before inserting new row in same transaction.
3. **Cancellation snapshot (partially documented):** `CancellationSnapshotRevision` now records append-only agreement history, while `CancellationSnapshot` is the current projection. The atomic update protocol and linkage from cancellation decisions to the evaluated revision are not fully specified or tested.
4. **Seller-initiated reschedule (partially documented):** `ServiceRequest.customerPenaltySuspended` now exists. Transaction rules for setting/clearing it and concurrency tests remain required.
5. **Confirmed slot conflicts:** BusyBlock exclusion exists, but no resource reservation before confirmation. Confirm action must atomically create a request-linked busy block if a selected professional and bookable calendar are in use. A no-calendar offer cannot promise free slot.
6. **Time validation:** `proposed_end_at > proposed_start_at`, UTC transport, IANA timezone canonical validation, ambiguous DST handling and horizon limits are necessary; SQL alone does not validate full IANA semantics.
7. **Notification privacy:** New schedule proposal, confirmation, decline, supersede must append domain outbox records; recipients depend on actor. No promise of delivered SMS/WhatsApp before worker status is known.

## Integration and negative tests
- Repeated POST proposal same key -> single revision + outbox event.
- Different payload same key -> 409 without new revision.
- Concurrent proposal vs proposal -> one pending row; loser sees conflict.
- Initiator confirms own proposal -> forbidden, unchanged state.
- Recipient with stale request version -> conflict, no snapshot/busy.
- Guest `READ_CANCEL` token cannot confirm/decline until dedicated schedule scope exists.
- Confirmed reschedule retains historical deadline and suppresses inappropriate old/new penalty.
- Schedule proposal vs cancellation race -> no confirmed proposal on a terminal request.
- Calendar slot confirmation vs another company/personal booking -> no overlapping busy.
- Failed notification after DB commit -> request state preserved; delivery retried separately.
- An offer without calendar and no confirmed time -> no automatic customer late penalty.

## Verification gate
Before merge into implementation repo: validate OpenAPI 3.1, Prisma format/validate, PostgreSQL migration on empty and populated test DB, deterministic parallel tests, auth threat model, kk/ru UX and legal review. None of these runtime checks are attested by this document.

## Reviewed against the 2026-11-02 feature branch

Documented and partly database-verified: `MANAGE_SCHEDULE` enum, proposed ADR-0005 guest re-verification addendum, versioned schedule proposal, immutable cancellation history, flag to suppress penalties during seller reschedules, and UTC cancellation deadline algorithm. Backend main CI now validates and deploys committed migrations to clean PostgreSQL 16 and runs DB-backed tests. **Still not proven**: schedule proposal/confirm/decline runtime handlers, guest schedule capability issuance, end-to-end authorization, auth threat model, client behavior and external legal requirements. Do not call TECH-03/04 complete.

## Correction after OpenAPI YAML fix (2026-11-02)

The broken `RequestVersion`/`IdempotencyKey` YAML parameter section was repaired in commit `1cf24f60`. The contract checker expects challenge/verify routes and schedule write preconditions. Reference OpenAPI/Prisma/SQL checks passed at services SHA 1acc3af68c75046c19aeee16cf185ef4ec112542 in [workflow 42467985221](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221); backend migration and PostgreSQL tests passed later at backend SHA 781d485610a077828dfe602dcdd97a14db58d86c in [workflow 42506854030](https://github.com/nurgeldiserikbay/services-back/actions/runs/42506854030). These validate the respective design files and database migration, not mounted schedule routes or guest OTP flow.
