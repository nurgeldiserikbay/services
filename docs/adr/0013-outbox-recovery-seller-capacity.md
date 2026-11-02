# ADR-0013 — outbox atomicity, guest recovery, seller policy and busy-resource invariants

**Status: PROPOSED FOR CONTRACT REVIEW (2026-11-03).** Platform-wide design; not scoped to an MVP. No runtime implementation is claimed.

## 1. DomainOutboxEvent and NotificationIntent

**Finding:** a required FK `notification_intents.domain_event_id -> domain_outbox_events.id` does **not** itself create a circular FK or deadlock. There is no FK from DomainOutboxEvent back to NotificationIntent. PostgreSQL supports inserting the parent first, then dependent rows, then validating the deferred cancellation constraint at transaction commit.

**Required cancellation transaction:**
1. Lock and version-check the authorized `ServiceRequest` and its schedule/cancellation snapshot.
2. Insert the cancellation fact, then `DomainOutboxEvent` with deterministic event identifier and PII-safe payload.
3. Insert **exactly two** `NotificationIntent` records referencing that outbox event and cancellation, with audiences INITIATOR and COUNTERPARTY and unique logical dedupe keys.
4. Update request status, reliability candidate and version consistently; commit. The deferred `cancellation_two_intents` constraint evaluates only at transaction commit. Any error rolls back the entire transaction.
5. Worker **after commit** delivers the two intents independently, retrying with idempotency keys; it must not manufacture missing transactionally required intents as a substitute for the invariant.

**Do not make `domain_event_id` nullable or move the two-intent validation to the worker**: either change would weaken traceability and atomic guarantees. The worker may process events after commit in any order, using deduplication and leases. Transaction operations must use consistent lock order to reduce real deadlock risk; provide concurrent cancellation/retry tests. Two logical intents are not a guarantee of two successfully delivered external messages.

## 2. Expired guest capabilities

**Finding:** the recovery flow is already described in ADR-0008, but OpenAPI needs a precise recovery contract. A short-lived `READ_CANCEL` capability is deliberately non-refreshable without renewed proof of the original verified contact.

**Recovery steps:** `POST /guest-requests/recovery/challenges` accepts original contact and channel; rate-limited generic `202`, no account/request enumeration. `POST /guest-requests/recovery/challenges/{challengeId}/verify` atomically consumes OTP, resolves authorized request(s) owned by that original contact, and creates a **new** single-request, single-scope session/capability with finite TTL. If multiple requests belong to that contact, show a minimal selection after OTP and issue one-request scope only on selection. Never issue scope for an arbitrary `request_id` presented by an unauthenticated caller.

Web uses `Secure`/`HttpOnly`/`SameSite` server-side guest cookie; native uses secure storage. Recovery links contain **no bearer capability, OTP or secret**. A stale token yields generic expiration/recovery instructions (not an unrecoverable 403). Re-verify `MANAGE_SCHEDULE` separately; `READ_CANCEL` recovery does not silently elevate scope. Account creation is never implicit. Include replay, enumeration, account-takeover/number recycling, flood and CSRF tests.

## 3. Corporate seller vs performer

**Finding:** the schema already attaches `CancellationPolicy` to `ServiceOffer.offerId`, rather than to `performerProfessionalId`. This is the correct invariant.

A company request's seller remains `sellerOrganizationId`, including while `performerProfessionalId IS NULL`. The applicable cancellation cutoff and policy revision are snapshotted from **the organization-owned offer**; subsequent performer assignment does not silently switch policy. This is true whether the performer is specified at creation or assigned later. A personal offer uses its own offer policy. BusyBlock/free slots affect **feasibility of a confirmed appointment**, not the cancellation policy itself.

No agreed time => no automatic late-cancellation penalty (ADR-0006). A change of time or performer that materially alters the service requires customer confirmation and revisioned snapshot; no retroactive reduction of the grace period. Seller identity on an existing request remains immutable.

## 4. GiST busy periods and independent work at the same location

**Finding:** the current `no_overlapping_known_busy_blocks` exclusion constraint checks a single professional's **all known occupied time**, regardless of context. This is intentional protection against double-booking the same person's actual capacity.

**Do not add `context` to the exclusion key by itself.** That would allow simultaneous PERSONAL and ORGANIZATION blocks for the same single-capacity human, hiding a real scheduling collision. Work performed independently while physically inside a rented salon is not proof that one person can perform two simultaneous appointments.

For multi-context businesses model *location/resource permission* separately from *performer capacity*: a rental/independent-work authorization and optional room/chair capacity belong to a scoped resource/allocation model; the work may be PERSONAL while location is a salon. The service's seller determines which company or individual owns the request; `BusyBlock.context` is not a permission grant.

If a service legitimately has multi-capacity/parallel execution, add explicit `CapacityResource`, `ResourceReservation`, capacity units and eligibility validation, and index exclusions by the actual constrained **resource**, not merely by seller context. Composite indices alone cannot express a general capacity limit. Avoid automatic blocking when availability is HIDDEN and no block is known; when an actual BusyBlock is committed, it must reflect verified capacity.

## Required contract/integration tests

- Parent outbox event inserted first; two intent records appear before commit; rollback when one is missing; concurrent cancellation is idempotent and yields no duplicates.
- Recovered guest access requires fresh original-contact OTP; expired/compromised capability alone gives no access and no scope escalation; distinct requests remain isolated.
- Corporate request with performer NULL uses organization's offer policy; assignment never changes seller/policy snapshot; no confirmed time means no automatic late penalty.
- PERSONAL vs ORGANIZATION known BusyBlocks for the **same single-capacity performer** still conflict; rented-chair personal work with non-overlapping performer schedule is valid; multicapacity is supported only through explicit resource model.
- No private contacts, OTPs or capability secrets enter outbox payloads, logs, cache keys or public events.

**Implementation gate:** add explicit OpenAPI recovery routes, complete related Prisma/SQL models and transactional tests, and run CI with the actual backend migrations. The current ADR is a design requirement, not proof of such execution.
