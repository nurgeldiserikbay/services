# Final documentation closure checklist — Services

**Updated:** 2026-11-02. **Status: OPEN.** This file tracks documentation-only closure; production launch has additional security/legal gates. Source: [IMPLEMENTATION_READY](../../IMPLEMENTATION_READY.md).

## 1. Contract validity
- [ ] Redocly OpenAPI 3.1 bundle and lint both pass on PR HEAD. Run `npx --yes @redocly/cli@1.34.5 bundle contracts/openapi.yaml -o /tmp/services-openapi-bundled.json`.
- [ ] `node scripts/check-api-contract.mjs /tmp/services-openapi-bundled.json` passes. Record command/output/commit in PR.
- [ ] Check required schedule proposal parameters, guest OTP grant response, errors, authorization and transport enums.
- [ ] Prisma schema format/validate passes with dependency version supported by `services-back`.
- [ ] Reviewed SQL migration applies to a clean temporary PostgreSQL database, including `btree_gist`, triggers and partial unique indexes; repeat with backfilled data sample.
- [ ] SQL concurrency tests demonstrate transaction safety, not just static syntax.

## 2. Business and API synchronization
- [ ] ADR-0006 accepted or revised as explicit business decision (until then, only proposed).
- [ ] Existing `PATCH /requests/{id}/schedule` is either removed or explicitly kept as non-penalizing deprecated draft; no unilateral agreed time.
- [ ] Guest `MANAGE_SCHEDULE` issuance, lifetime, challenge and token rotation agreed with ADR-0005; never use `READ_CANCEL` as a substitute.
- [ ] Snapshot revision and live projection are transactionally consistent; cancellation audit identifies the evaluated revision and exception.
- [ ] All status enums use the same eight canonical `RequestStatus` states.
- [ ] Two notification intents per cancellation, independent provider/customer reliability, and seller routing are consistent across chapters, SQL, OpenAPI and diagrams.
- [ ] Remove stale references to mandatory calendars, Quote/price negotiations and legacy `/bookings` paths.

## 3. Documentation and UX
- [ ] Review `docs/ru/01–26`, ADRs, maps and diagrams for contradictions; mark resolved decisions as accepted and unresolved as proposed.
- [ ] Finalize guest schedule/notification/error/offline and profile-company UX including privacy of cross-context busy time.
- [ ] Complete kk/ru localization contract and accessibility check (keyboard, semantics, touch targets, responsive).
- [ ] Run `node scripts/build-site.mjs` and commit generated `index.html`; do not edit HTML directly.
- [ ] Confirm source links in README and `AGENTS.md` point to current contracts and precedence.
- [ ] Ensure examples and demo contact data contain no real customer PII or secrets.

## 4. Implementation handoff
- [x] Task allocation and dependency sequence documented in `docs/architecture/parallel-implementation-plan.md`.
- [x] Readiness register exists in `IMPLEMENTATION_READY.md`.
- [x] Concurrency and schedule test scenarios are documented.
- [ ] Confirm owners and acceptance evidence for each BE/WEB/ADM task.
- [ ] Record passing GitHub Actions for final PR SHA and independent reviewer sign-off.
- [ ] Merge documentation PR only after review and passing checks; no self-merge.

## Evidence log template

| Gate | Commit SHA | Exact command / workflow URL | Result | Reviewer | Date |
| --- | --- | --- | --- | --- | --- |
| OpenAPI / contract checker | TBD | TBD | NOT VERIFIED | TBD | TBD |
| Prisma validate | TBD | TBD | NOT VERIFIED | TBD | TBD |
| PostgreSQL migration / invariants | TBD | TBD | NOT VERIFIED | TBD | TBD |
| Markdown → HTML build | TBD | TBD | NOT VERIFIED | TBD | TBD |
| Security, UX, product sign-offs | TBD | TBD | NOT VERIFIED | TBD | TBD |

### Stop conditions
Do not mark documentation ready while a YAML/Prisma parsing error remains, ADR-0006 is not decided, guest capability can authorize a different request, or the current cancellation deadline may be silently changed without confirmed agreement. Never confuse an unchecked box with a failed test: it means evidence has not been attached.
