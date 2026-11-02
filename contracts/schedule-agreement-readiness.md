# Schedule agreement — integration readiness checklist

Status: **PROPOSED, not implemented**, 2026-11-02.
References: ADR-0006, ADR-0004, `contracts/openapi.yaml`, `contracts/prisma/schema.prisma`.

## Contract snapshot
- Prisma `ScheduleProposal` stores request, revision, initiator, proposed UTC timestamps, IANA timezone, status, resolver.
- Partial unique SQL index ensures one active `PROPOSED` per request; unique revision per request.
- API design includes POST propose, POST confirm, POST decline, each with Idempotency-Key and If-Match.
- Legacy seller-only schedule PATCH is deprecated and must not establish a penalty-bearing confirmed time.

## Blocking contract gaps to settle before coding
1. **Guest capability gap:** Current ADR-0005 defines only `CREATE_REQUEST` and `READ_CANCEL`. Neither authorizes proposal confirmation. The proposed OpenAPI endpoints advertise guestCapability security, but this is **NOT yet an implementable permission**. Add new tightly scoped `MANAGE_SCHEDULE` permission via reviewed auth ADR, with re-verification and no implicit sign-up, or disable guest schedule changes until securely supported.
2. **Active revision:** Partial unique index permits one pending proposal; a proposed revision must be monotonically allocated under a per-request lock. On supersede, resolve old row before inserting new row in same transaction.
3. **Cancellation snapshot:** Existing Prisma `CancellationSnapshot` is 1:1 with request. A confirmed reschedule needs historical immutable revisions and a current effective pointer; **not yet modelled**. Do not overwrite an existing snapshot and claim immutable history.
4. **Seller-initiated reschedule:** Customer penalty eligibility is suspended until customer confirms the new time. Explicit persisted flag/event needed with concurrent cancellation tests.
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
