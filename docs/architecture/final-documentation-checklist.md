# Final documentation closure checklist — Services

**Updated:** 2026-11-08. **Status: OPEN — documentation checks partially evidenced; release sign-off remains incomplete.** This file tracks documentation-only closure; production launch has additional security/legal gates. Source: [IMPLEMENTATION_READY](../../IMPLEMENTATION_READY.md).

## 1. Contract validity
- [x] OpenAPI 3.1 reference bundle and semantic checker pass in the [technical-contract workflow](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221) on services SHA 1acc3af68c75046c19aeee16cf185ef4ec112542. This does not claim full production contract completeness.
- [ ] Check all required schedule proposal parameters, guest OTP grant response, errors, authorization and transport enums against the accepted API matrix.
- [x] Design-reference Prisma schema validation passes in the [technical-contract workflow](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221); this is not a deployed backend migration.
- [x] Reference schema plus constraints.sql and smoke.sql pass on ephemeral PostgreSQL 16 in the [PostgreSQL invariants job](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221). Production migrations, backfilled data and rollback remain unverified.
- [x] Backend CI on [main SHA 781d485](https://github.com/nurgeldiserikbay/services-back/actions/runs/42506854030) applies the committed baseline to clean PostgreSQL 16, checks migration drift, runs seed/smoke and DB-backed integration tests. This does not prove production backfill, rollback or backup restoration.
- [ ] Dedicated concurrent conflict/race tests demonstrate transaction safety for schedule agreement and cancellation.

## 2. Business and API synchronization
- [x] ADR-0006 accepted as product decision on 2026-11-02; technical implementation validation remains separate.
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
- [x] `node scripts/build-site.mjs` and `node scripts/check-docs.mjs` pass on current main at SHA f3cc8b3cf18d8bf4c7f174f9bdf41cb4f1 in the [docs workflow](https://github.com/nurgeldiserikbay/services/actions/runs/42507877616). The staging/readiness PR #16 workflow also passed at head SHA f28ebf9bdc5a8b8124e06ce5ad35ecbac36a4e1d: [HTML rebuild, comparison and structure check](https://github.com/nurgeldiserikbay/services/actions/runs/42508459698).
- [ ] Confirm source links in README and `AGENTS.md` point to current contracts and precedence.
- [ ] Ensure examples and demo contact data contain no real customer PII or secrets.

## 4. Implementation handoff
- [x] Task allocation and dependency sequence documented in `docs/architecture/parallel-implementation-plan.md`.
- [x] Readiness register exists in `IMPLEMENTATION_READY.md`.
- [x] Concurrency and schedule test scenarios are documented.
- [ ] Confirm owners and acceptance evidence for each BE/WEB/ADM task.
- [ ] Record passing GitHub Actions for final PR SHA and independent reviewer sign-off.
- [ ] Merge documentation PR only after review and passing checks; no self-merge.

## Evidence log

| Gate | Commit SHA | Exact workflow | Result | Reviewer | Date |
| --- | --- | --- | --- | --- | --- |
| OpenAPI bundle + semantic checker | 1acc3af68c75046c19aeee16cf185ef4ec112542 | [Technical contracts](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221) | PASS (reference contract) | Automated CI | 2026-11-08 |
| Prisma reference validation | 1acc3af68c75046c19aeee16cf185ef4ec112542 | [Technical contracts](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221) | PASS (design schema only) | Automated CI | 2026-11-08 |
| PostgreSQL reference invariants/smoke | 1acc3af68c75046c19aeee16cf185ef4ec112542 | [Technical contract workflow](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221) | PASS (reference schema constraints/smoke) | Automated CI | 2026-11-08 |
| Backend baseline migration and DB suite | 781d485610a077828dfe602dcdd97a14db58d86c | [Post-merge backend CI](https://github.com/nurgeldiserikbay/services-back/actions/runs/42506854030) | PASS (clean PostgreSQL 16 migrate, drift, seed, smoke and unit/integration tests; no production data) | Automated CI | 2026-11-08 |
| Markdown → HTML build | f3cc8b3cf18d8bf4c7f174f9bdf41cb4f1 | [Current main docs workflow](https://github.com/nurgeldiserikbay/services/actions/runs/42507877616) | PASS (HTML rebuild, comparison and structure checks) | Automated CI | 2026-11-08 |
| Security, UX, product sign-offs | — | No independent sign-off evidence recorded | NOT DONE | Product/security/design owners | 2026-11-08 |

### Stop conditions
Do not mark documentation ready while a YAML/Prisma parsing error remains, ADR-0006 is not decided, guest capability can authorize a different request, or the current cancellation deadline may be silently changed without confirmed agreement. Never confuse an unchecked box with a failed test: it means evidence has not been attached.

## Кто выполняет оставшиеся действия

**Автоматически в GitHub Actions (без участия владельца):** `.github/workflows/contracts.yml` проверяет reference Prisma/OpenAPI и SQL invariants. Backend main workflow дополнительно выполняет `prisma migrate deploy`, migration-drift check, seed, PostgreSQL smoke и DB-backed integration suite на временном PostgreSQL 16. Результат подтверждён только для точных SHA и workflow runs, указанных выше; production restore/backfill этим не проверены.

**Разработчик / ИИ-агент:** держать CI зелёным, закрыть contract gaps, добавить dedicated race tests, проверить схему/SQL/API согласованность, обновить и пересобрать документацию, вынести PR на ревью. От пользователя не требуются ручные команды npm, psql или Prisma.

**Владелец продукта / launch owners:** ADR-0006 уже принят как продуктовая политика; её техническая реализация и проверки остаются открытыми. До выпуска нужно выбрать пилотный рынок и подтвердить применимые условия/политику. Юридическое заключение, реальные провайдеры и внешние настройки должны быть подтверждены соответствующими владельцами.

**Не путать с результатом:** наличие шагов в workflow не доказывает, что они сейчас успешно проходят. Внешнее ревью и реальные устройства также не проверяются одной GitHub Action.
