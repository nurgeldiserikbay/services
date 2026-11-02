# Schedule security and cancellation history — implementation contract v0.1

**Status: PROPOSED / no production deployment.** Supplements ADR-0005 and proposed ADR-0006; does not supersede approved business requirements.

## Guest authorization
- New `MANAGE_SCHEDULE` capability authorizes only proposing, confirming and declining time for the **single request** bound to `GuestCapability.requestId`. `READ_CANCEL` and `CREATE_REQUEST` cannot be substituted.
- Issuance requires re-verifying control of the original guest contact (OTP or equivalent), and never silently creates an account.
- Lookup checks token digest in constant time, expiration, revocation/consumed state, exact request ID, guest contact ownership, actor identity and role. Capability cannot impersonate a seller.
- Guest management actions cannot be performed with only the public request URL; log sanitized decisions without token/OTP.
- Rate-limit issuance and verification per contact/device/IP with anti-enumeration responses; treat multiple failed attempts as attack signals.

## Schedule and policy history
- `ScheduleProposal` holds each proposed time as a revision. A proposal can be confirmed only by the **other** side.
- `CancellationSnapshotRevision` is immutable historical evidence of a confirmed time and applicable seller cancellation policy; unique per request/scheduleRevision.
- Existing `CancellationSnapshot` is the **current projection**, not history. Its update and the insert of historical revision must happen in the same transaction when agreement is confirmed.
- `ServiceRequest.customerPenaltySuspended` is set when seller proposes a changed confirmed time. A customer's cancellation during suspension must not incur an automatic late penalty; clearing requires confirmation of the new time and auditable revised snapshot.
- Cancellation race vs time confirmation: serialize on request version/lock; terminal requests do not accept a new time. Preserve old history and emit correct cancellation notifications even on delivery failure.
- Do not derive late penalty from `desired_start_at`, legacy schedule PATCH, unverified phone calls, or a PROPOSED row.
- **Important gap:** current business docs also refer to grace windows following acceptance. The server must calculate the effective deadline under ADR-0004 and retain algorithm-versioned evidence; the current reference models do not yet fully capture grace formula version and seller identity in every revision.

## Preconditions before claiming implementation-ready
1. Review and approve change to ADR-0005 permission scopes and OTP re-verification UX, including retention.
2. Update OpenAPI to expose a secure guest challenge/issuance flow and document the different capability lifetimes.
3. Validate Prisma schema, generate a **real migration** and run SQL against PostgreSQL including existing data.
4. Add transactional tests for proposal confirmation, snapshot version history, penalty-suspension races and two cancellation notification intents.
5. Verify every guest operation is denied with a mismatched/expired `READ_CANCEL` capability, and does not reveal request contents.
6. Complete kk/ru interface review and country/legal data-processing checks.

**This document specifies behavior; no security tests or migrations have been executed here.**
