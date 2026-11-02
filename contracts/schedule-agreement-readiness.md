# Schedule agreement — integration readiness checklist

Status: **PROPOSED, not implemented**, 2026-11-02.
References: ADR-0006, ADR-0004, `contracts/openapi.yaml`, `contracts/prisma/schema.prisma`.

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

Documented: new `MANAGE_SCHEDULE` enum, proposed ADR-0005 guest re-verification addendum, versioned schedule proposal, immutable cancellation history, flag to suppress penalties during seller reschedules, and UTC cancellation deadline algorithm. **Not proven**: migrations, CI, real PostgreSQL tests, full guest schedule issuance API, auth threat model, client behavior and external legal requirements. Review and reconcile these before calling TECH-03/04 complete.

## Correction after OpenAPI YAML fix (2026-11-02)

The broken `RequestVersion`/`IdempotencyKey` YAML parameter section was repaired in commit `1cf24f60`. Contract checker now expects challenge/verify routes and schedule write preconditions, but passing Redocly/Prisma/SQL CI on the corrected commit is **not yet recorded**. The former description 'missing guest endpoints' is superseded by this note.
