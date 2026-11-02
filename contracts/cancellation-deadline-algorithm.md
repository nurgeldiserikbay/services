# Cancellation deadline — computational contract (draft)

Status: PROPOSED, 2026-11-02. Source: ADR-0004; no code, migration or legal conclusion.

## Inputs and invariants

- `scheduledStartAt`: confirmed instant UTC; null means no automatic customer late penalty.
- `acceptedAt`: accepted request instant, not optional for penalty evaluation.
- `freeCancelBeforeMin`: seller policy snapshot from 0 to 10080 minutes.
- `customerPenaltySuspended`: true when seller initiated reschedule without recipient confirmation.
- `policyRevision`, `scheduleRevision`, timezone and algorithm version recorded for audit.
- `now` is server-side UTC instant at commit, not client clock.
- Every penalty requires registered customer + accepted request + confirmed agreement + notified policy + no exception or suspension.

## Deadline algorithm — ADR-0004

Let `B = scheduledStartAt - freeCancelBeforeMin minutes`.
A recently accepted appointment must allow cancellation until the earlier of appointment start and 15 minutes after acceptance if the normal cutoff is already in the past.

```text
if scheduledStartAt is null or no confirmed agreement:
    deadline = null
else if acceptedAt > B:
    deadline = min(scheduledStartAt, max(B, acceptedAt + 15 minutes))
else:
    deadline = B
```

When cancellation `now <= deadline`, customer penalty is zero. Strictly `now > deadline` is late, subject to all eligibility conditions. If `acceptedAt >= scheduledStartAt`, the appointment must not automatically earn a penalty: reject invalid agreement or suppress penalty pending review.

**Important distinction:** `freeCancelUntil` in current `CancellationSnapshot` stores the EFFECTIVE deadline, including accepted-late grace, not raw `B`. This must be explicitly verified in business migration and serialization. Use UTC for comparisons and IANA timezone only for display/disambiguation.

## Example cases

| Case | Start | Accepted | Policy | Effective deadline | Client penalty if cancelled at example time |
| --- | --- | --- | --- | --- | --- |
| Normal | 12:00 | Previous day | 120m | 10:00 | 09:59 no, 10:01 eligible |
| Short-notice acceptance | 12:00 | 11:30 | 120m | 11:45 | 11:40 no, 11:50 eligible |
| Very late acceptance | 12:00 | 11:55 | 120m | 12:00 | 11:59 no |
| Zero-minute policy | 12:00 | Previous day | 0m | 12:00 | 11:59 no |
| No agreed start | null | any | any | null | Never automatic late penalty |
| Seller-proposed new date pending | 17:00 proposal | any | any | Inactive | Penalty suspended |
| Guest customer | confirmed | any | any | Informational only | No persistent customer reliability |

All times in one timezone on an illustrative date; server calculations use UTC instants.

## Requirements for data and tests

- A confirmed agreement inserts an immutable `CancellationSnapshotRevision` and updates current projection atomically.
- A seller-initiated reschedule proposal atomically sets `customerPenaltySuspended=true`; customer cancellation remains non-penalizing until explicit confirmation of the new date and new snapshot.
- Never delete old snapshots when rescheduling; a cancellation includes the evaluated revision and decision reason in audit.
- Date proposal itself never reserves guaranteed time or creates a penalty.
- Test boundary equality (exact deadline), UTC leap/day change, DST gaps/folds, timezone-change after proposal, seller policy revision changes, duplicate confirm/cancel and outbox failure.
- Existing models still need a stored `algorithm_version` / eligibility-decision audit contract; do not infer they are already sufficient.

## Security and finality

A client cannot edit policy, clock or agreed start from request payload. Seller also cannot unilaterally claim a confirmed agreement. A timeout/retry uses the same idempotency key. No-show or exception appeals remain separate from automatic deadline evaluation.
