# Services release evidence snapshot — 2026-11-10

Status: **CI baseline only; NOT a production release approval**. This snapshot pins the independently checked repositories. It does not imply a deployed integrated system.

| Repository | main SHA | Evidence | Result |
| --- | --- | --- | --- |
| [services](https://github.com/nurgeldiserikbay/services) | `e1a0f9b9b2da0eb412e89ad8ea4326c4772aef03` | Canonical docs and draft OpenAPI | Document revision pinned; contract conformance not verified |
| [services-back](https://github.com/nurgeldiserikbay/services-back) | `f9728c425d782bd261788eb048800cc95e493818` | [CI run 42833641292](https://github.com/nurgeldiserikbay/services-back/actions/runs/42833641292) on code SHA `b2c43b16aa4e2d0d3693de1a2f212aca6d829aee` | Build/test, migrations, DB checks and production dependency audit succeeded; subsequent README-only commit not separately verified |
| [services-front](https://github.com/nurgeldiserikbay/services-front) | `fecdd074b11f8168fd15c720388d3334f36d4c4c` | Latest main CI success on same SHA | Independent frontend CI succeeded |
| [services-admin](https://github.com/nurgeldiserikbay/services-admin) | `7391c1fbb5995b876503123e9c653380c58b95e0` | Latest main CI success on same SHA | Independent admin CI succeeded |

## Gate assessment

- **G0 (documentation/contract): in progress.** Documentation exists, but contract parity across deployed services is not proven.
- **G1–G3 (identity, marketplace, bookings, permissions, reviews): in progress.** Unit and database tests in backend are green; full cross-repository customer/seller E2E has not been verified.
- **G4 (notifications, security, privacy, operations): in progress.** Production dependency audit passed, but staging secrets, residency, backup/restore and operational review are not evidenced.
- **G5 (pilot): not started / no evidence.** No approved pilot metrics or incident exercise.

## Mandatory next release evidence

1. Pin the deployed SHA for all four repositories and an exact OpenAPI contract revision; test client-server compatibility (including unauthorized responses, pagination, cancellation and notification DTOs).
2. Run full guest request → seller decision → status/cancellation/notifications E2E against an isolated, migrated staging database; verify retries and concurrent commands.
3. Verify privileged admin onboarding/MFA and scoped moderation via server-only credentials. Keep feature flags off until reviewed; never send admin bearer tokens to browsers.
4. Confirm KZ data residency, logs redaction, production secrets, alerting and load/performance targets.
5. Perform backup and restore plus rollback drills, and capture dated evidence and reviewer sign-off.

## Migration history warning

The backend's `20261110_platform_admin_foundation` migration was amended to avoid recreating tables already made by earlier migrations. Before deploying to any persistent database, inspect `_prisma_migrations` and reconcile migration checksums/history if necessary. Do **not** reset a persistent database to make CI green.

Reference: [acceptance checklist](ru/26-acceptance-checklist.md). Do not mark any gate `verified` without reproducible evidence for the pinned release.
