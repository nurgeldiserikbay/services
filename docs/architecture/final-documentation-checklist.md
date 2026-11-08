# Final documentation closure checklist — Services

**Updated:** 2026-11-08. **Status: OPEN — documentation checks partially evidenced; release sign-off remains incomplete.** This file tracks documentation-only closure; production launch has additional security/legal gates. Source: [IMPLEMENTATION_READY](../../IMPLEMENTATION_READY.md).

## 1. Contract validity
- [x] OpenAPI 3.1 reference bundle and semantic checker pass in the [technical-contract workflow](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221) on services SHA 1acc3af68c75046c19aeee16cf185ef4ec112542. This does not claim full production contract completeness.
- [ ] Check all required schedule proposal parameters, guest OTP grant response, errors, authorization and transport enums against the accepted API matrix.
- [x] Design-reference Prisma schema validation passes in the [technical-contract workflow](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221); this is not a deployed backend migration.
- [x] Reference schema plus constraints.sql and smoke.sql pass on ephemeral PostgreSQL 16 in the [PostgreSQL invariants job](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221). Production migrations, backfilled data and rollback remain unverified.
- [ ] SQL concurrency tests demonstrate transaction safety, not just static syntax.

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
- [x] `node scripts/build-site.mjs` and `node scripts/check-docs.mjs` pass on current main in the [docs workflow](https://github.com/nurgeldiserikbay/services/actions/runs/42467985158), services SHA 1acc3af68c75046c19aeee16cf185ef4ec112542. This PR still needs its own green workflow run.
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
| PostgreSQL 16 invariants/smoke | 1acc3af68c75046c19aeee16cf185ef4ec112542 | [PostgreSQL invariants job](https://github.com/nurgeldiserikbay/services/actions/runs/42467985221) | PASS (ephemeral reference DB; no production migration) | Automated CI | 2026-11-08 |
| Markdown → HTML build | 1acc3af68c75046c19aeee16cf185ef4ec112542 | [Docs workflow](https://github.com/nurgeldiserikbay/services/actions/runs/42467985158) | PASS on current main; this PR must rerun | Automated CI | 2026-11-08 |
| Security, UX, product sign-offs | — | No independent sign-off evidence recorded | NOT DONE | Product/security/design owners | 2026-11-08 |

### Stop conditions
Do not mark documentation ready while a YAML/Prisma parsing error remains, ADR-0006 is not decided, guest capability can authorize a different request, or the current cancellation deadline may be silently changed without confirmed agreement. Never confuse an unchecked box with a failed test: it means evidence has not been attached.

## Кто выполняет оставшиеся действия

**Автоматически в GitHub Actions (без участия владельца):** `.github/workflows/contracts.yml` уже содержит Prisma validate, Redocly bundle, API contract checker, одноразовый PostgreSQL 16, SQL constraints и smoke.sql. В этот PR добавлен запуск workflow при изменении скрипта проверки API. Результат считается подтверждённым только после зелёного workflow run на конкретном коммите.

**Разработчик / ИИ-агент:** устранить ошибки CI, проверить и зафиксировать соответствие схем, расширить тесты на гонки, обновить и пересобрать документацию, вынести PR на ревью. От пользователя не требуются ручные команды npm, psql или Prisma.

**Владелец продукта / launch owners:** ADR-0006 уже принят как продуктовая политика; её техническая реализация и проверки остаются открытыми. До выпуска нужно выбрать пилотный рынок и подтвердить применимые условия/политику. Юридическое заключение, реальные провайдеры и внешние настройки должны быть подтверждены соответствующими владельцами.

**Не путать с результатом:** наличие шагов в workflow не доказывает, что они сейчас успешно проходят. Внешнее ревью и реальные устройства также не проверяются одной GitHub Action.
