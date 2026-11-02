# Аудит контрактов Services — 2026-11-02

**Область:** текущая документационная ветка `docs/request-consistency-v1`, не production. **Статус:** PARTIAL STATIC REVIEW / VALIDATION NOT VERIFIED.

## Проверенные связи по исходникам
- OpenAPI описывает `POST /guest-requests/{id}/schedule-access/challenges` и `POST /guest-requests/{id}/schedule-access/challenges/{challengeId}/verify`, а также схемы `GuestScheduleChallenge` и `GuestScheduleGrant`.
- Действующий проектный `GuestCapabilityScope` включает `MANAGE_SCHEDULE`, но фактический backend для выдачи/проверки токена не подтверждён.
- OpenAPI описывает три маршрута `schedule-proposals`; односторонний `PATCH /requests/{id}/schedule` помечен `deprecated: true`.
- Скрипт `scripts/check-api-contract.mjs` расширен статическими проверками маршрутов, scopes и обязательных заголовков `Idempotency-Key` и `If-Match`.
- Prisma-проект содержит `ScheduleProposal`, `CancellationSnapshotRevision`, `IdempotencyRecord`; SQL-дополнение содержит ограничения одного активного предложения и защиты истории.

## Что не является доказанным
- Ни успешное выполнение `node scripts/check-api-contract.mjs`, ни Redocly bundle, ни Prisma validate, ни реальное применение SQL здесь не засвидетельствованы.
- В запросе статуса Actions по последнему audit-коммиту не получено соответствующих PR workflow runs; это **не равно успешному CI**.
- Два отдельных гостевых API-маршрута в OpenAPI не доказывают существование OTP-очереди, сроков жизни, rate limits или защиты от enumeration в backend.
- Пересечение schedule proposals и cancellation history требует транзакционных тестов PostgreSQL; одного CHECK/unique недостаточно.
- ADR-0006 имеет статус `PROPOSED`; необходимо продуктово утвердить или изменить его до реализации пенальтизирующего agreed time.

## Исполнимый порядок проверки

1. `node scripts/build-site.mjs`, после чего убедиться, что сгенерированный `index.html` соответствует Markdown; запрещено редактировать HTML вручную.
2. Запустить GitHub workflow `.github/workflows/contracts.yml` и зафиксировать ссылку на run для последнего SHA.
3. Redocly bundle OpenAPI 3.1 в JSON и затем `node scripts/check-api-contract.mjs <bundled.json>`; сохранить ошибки и результат.
4. Запустить `prisma format` и `prisma validate` на проектной схеме с test DATABASE_URL (команды должны соответствовать lockfile/CI).
5. На одноразовой PostgreSQL БД создать baseline migration и применить `contracts/prisma/constraints.sql`; проверить порядок создания таблиц, partial indexes, deferred triggers и отказ запрещённых операций.
6. Прогнать сценарии `contracts/request-concurrency-test-matrix.md`: race acceptance, schedule confirmation, seller change, guest expiry, repeat cancellation и доставка outbox.
7. Удалить или документально разрешить устаревшие упоминания Booking/Inquiry/унилатерального переноса в главах 13–18, API, UX и диаграммах.
8. Провести проверку API permissions, независимой корпоративной идентичности, privacy и полного kk/ru интерфейса.

## Наблюдаемые риски к review

| ID | Риск | Следующее действие |
| --- | --- | --- |
| AUD-01 | Новый API и схемы не подтверждены формальными валидаторами | CI run + сохранённый SHA |
| AUD-02 | Guest `MANAGE_SCHEDULE` спроектирован, но не реализован | Backend OTP, ACL и negative tests |
| AUD-03 | История cancellation snapshot может расходиться с текущей проекцией | Одна транзакция, DB integration |
| AUD-04 | Customer penalty suppression требует проверяемого события согласования | Аудит переноса и commit-time state |
| AUD-05 | Сквозные роли personal/company требуют negative ACL | Проверить корпоративный actor с чужой заявкой |
| AUD-06 | Документы содержат главы разных версий | Cross-reference audit и regenerate HTML |

## Exit criteria

Отметить контракт `VALIDATED` только когда есть успешный реальный запуск проверки с commit SHA, тестовой средой и воспроизводимой командой. Отметить `IMPLEMENTED` только после работающего кода соответствующего репозитория и интеграционных тестов. Ни один из этих статусов нельзя присвоить по результатам исключительно текстового ревью.
