# Idempotency & request concurrency — implementation test matrix

Status: DESIGN TEST CONTRACT, not executed. Follow ADR-0003/0004/0005 and [request-consistency](../docs/architecture/request-consistency.md).

| ID | Setup | Operation | Expected |
| --- | --- | --- | --- |
| IDEM-01 | Authenticated customer | Same POST request, same key, parallel 20x | Exactly one request; equivalent replay result |
| IDEM-02 | Guest CREATE_REQUEST scope | Same POST with different payload, same key | 409 IDEMPOTENCY_PAYLOAD_MISMATCH, no second request |
| IDEM-03 | Same key, two unrelated principals | Independent writes | No cross-principal collision or data leak |
| IDEM-04 | Request committed, response lost | Retry with same key | Exact previously committed outcome, no extra event |
| IDEM-05 | Two accept vs decline | Same PENDING version | One winner; loser 409 and current state if authorized |
| IDEM-06 | Cancel pending races accept | Both actors authorized | Serialized winner; if accepted first, re-evaluate cancellation as accepted |
| IDEM-07 | Two incompatible slots | Shared professional in two contexts | At most one block committed; SQL exclusion prevents overlap |
| IDEM-08 | Late accepted customer cancel | Agreed time + policy snapshot | One reliability event, cancellation event and exactly two intents |
| IDEM-09 | Double cancellation | Repeat and distinct keys | One cancellation event, one pair of notification intents |
| IDEM-10 | Outbox worker crash | Sent but delivery mark absent | Retry with channel-level dedupe; no extra logical intent |
| IDEM-11 | Invalid capability | Expired/wrong scope/other request | No access, no mutation, no private version leak |
| IDEM-12 | Post-accept reschedule pending approval | Customer has not confirmed new time | No late penalty from new proposed start |
| IDEM-13 | Stale optimistic write | version no longer current | Conflict and never overwrite newer schedule |
| IDEM-14 | Idempotency expiry | Replay after retention TTL | Treat as new attempt per published contract; avoid accidental duplicate via domain constraints and warn clients not to retry beyond TTL |
| IDEM-15 | Duplicate key reused for other operation | Different HTTP method/canonical route | Scoped distinct, no accidental replay |
| IDEM-16 | Failed validation | No domain write | No partial request, busy block, intent or penalty |

## Implementation notes

- Run with real PostgreSQL and migration SQL, not only Prisma mocks or SQLite.
- Assert committed DB row counts and unique constraints, not just HTTP status.
- Use barriers to coordinate competing transactions and retry tests deterministically.
- Check after errors and process restart; no hidden additional cancellation/notification effects.
- The idempotency record design in schema.prisma is reference-only. Confirm encrypted/redacted stored response and retention requirements before production.
- Exact reschedule agreement UX/API remains an open technical contract, not inferred from existing PATCH schedule.


## Schedule agreement scenarios (ADR-0006 proposed)

| ID | Case | Expected |
| --- | --- | --- |
| SCH-01 | Client provides desired time and seller accepts | Request ACCEPTED, schedule not confirmed, no automatic customer late penalty |
| SCH-02 | Seller proposes a new date | PROPOSED revision, outbox notice, no confirmed snapshot change |
| SCH-03 | Authorized recipient confirms proposed date | Schedule CONFIRMED, policy snapshot and applicable busy block atomically committed |
| SCH-04 | Two actors confirm and cancel concurrently | One serialized result; no orphan busy, snapshot or intent |
| SCH-05 | Proposal superseded before clicking confirm | Old revision rejected with 409; user sees latest |
| SCH-06 | Seller proposes substantial new time and customer declines | New time not activated; customer not penalized under proposed new deadline |
| SCH-07 | Customer proposes time | Seller must confirm, not automatic acceptance |
| SCH-08 | Guest confirm with expired/wrong-scope capability | 403/404 or 410 without leaking request |
| SCH-09 | DST invalid/fold local time | Server rejects invalid or ambiguous input |
| SCH-10 | Seller direct WhatsApp only; never confirms time on platform | No verified schedule and no automated late penalty |

**Status:** tests are specified, not implemented. Existing PATCH schedule must not silently establish a penalizing agreement until ADR-0006 review is complete.
