# Контрактные и конкурентные тесты PostgreSQL / Prisma · v0.8

**Статус:** план тестов; реальные БД-тесты ещё не выполнены. Проверять на настоящем PostgreSQL (не SQLite). Каждый сценарий имеет позитивный, негативный actor и concurrent/retry вариант.

| Test ID | Действие | Ожидаемый результат |
| --- | --- | --- |
| DB-01 | Один Person создаёт две ProfessionalProfile одной Profession (вторая archived/draft) | Уникальность (person_id,profession_id), повтор 409 |
| DB-02 | Offer без seller или с двумя sellers | XOR CHECK rejects |
| DB-03 | Request с подменённым seller, source_context или customer/guest одновременно | CHECK + trigger rejects; no side effects |
| DB-04 | Изменить offer.seller после появления request | DB trigger rejects |
| DB-05 | Компания публикует view без активной Affiliation и одобрения мастера | DB trigger rejects |
| DB-06 | Affiliation завершена, view осталась опубликована | Domain transition hides view + cache invalidation; add integration test |
| DB-07 | Два ACTIVE affiliation одной пары | Частичный уникальный индекс rejects |
| DB-08 | Два активных membership одного user в организации | Частичный unique index rejects |
| DB-09 | Два BusyBlock одного мастера перекрываются между company/personal | GiST exclusion constraint rejects concurrent TX |
| DB-10 | Рядом стоящие [09:00,10:00) и [10:00,11:00) | Без конфликта |
| DB-11 | Компания пытается прочитать личные BusyBlock | Server ACL denies; внешнему контексту только aggregated unavailable |
| DB-12 | Предложение продавца с недопустимым cancellation_min (отрицательный/выше 10080) | CHECK rejects; API 422 |
| DB-13 | Изменение policy после accepted | CancellationSnapshot неизменяем; старый deadline остаётся |
| DB-14 | Клиент отменяет pending | Отменяется без негативного ReliabilityEvent, обе NotificationIntent в TX |
| DB-15 | Клиент отменяет accepted до snapshot deadline | Без штрафа, два intents и освобождён известный slot |
| DB-16 | Клиент отменяет accepted поздно | Ровно один customer ReliabilityEvent, не меняет review stars |
| DB-17 | Гость отменяет поздно | Нет customer ReliabilityEvent, два адресных NotificationIntent |
| DB-18 | Компания отменяет accepted со специалистом-исполнителем | Только organization reliability; professional не штрафуется |
| DB-19 | Мастер отменяет personal accepted | Только professional seller reliability |
| DB-20 | Конкурирующие cancel/cancel, cancel/complete и duplicate idempotency key | Одна terminal transition, не более одного CancellationEvent/penalty, 2 intents |
| DB-21 | Commit отмены только с 1 либо 3 intents | Deferred trigger rejects, вся транзакция откатывается |
| DB-22 | 2 logical intents, email+in-app delivery records | Сохраняются intents=2, delivery rows отдельно; retries не создают новые cancellation events |
| DB-23 | SMS provider failure после успешной транзакции | Отмена остаётся, outbox delivery failed/retry; UI не заявляет доставку |
| DB-24 | Accepted без согласованного времени | Snapshot отсутствует, late customer penalty невозможен |
| DB-25 | Продавец заявил no-show и клиент оспаривает | Event pending review, не публичный штраф до проверки |
| DB-26 | Reviewer пытается оставить отзыв о двух целях сразу | Review target XOR rejects |
| DB-27 | Rating = 0 либо 6 | Rating constraint rejects |
| DB-28 | Незавершённая услуга получает verified review | Domain authorization rejects |
| DB-29 | Пользователь добавляет одну сохранённую страницу дважды | DB unique(person_id,targetKind,targetId) и идемпотентный API |
| DB-30 | Фальшивый URL external media или контактов | URL allowlist + upload validation; SSRF/XSS исключаются |
| DB-31 | Анонимные SSR/кеш отвечают с закрытыми company-view полями | Public DTO whitelist; после revoke cache invalidates |
| DB-32 | Журнал отмен/рейтингов запрашивает чужой seller или клиент | Resource ACL denies; не leaking PII |
| DB-33 | География разных стран и два одноимённых города | UUID country/area/city, язык не меняет активный search city |
| DB-34 | Истёк guest capability и OTP brute-force | 403/429, ограниченные попытки, без чужих записей |

## Требования к нагрузке и миграциям
- Проверять транзакции в двух отдельных соединениях PostgreSQL с барьером одновременного начала, а не лишь последовательными `await`.
- Для optimistic version переходы `status` защищаются атомарным `UPDATE ... WHERE version=? AND status IN (...)` с проверкой row count; компенсация/ретраи не должны «создавать» новые отмены.
- Исключающие индексы для календаря нужно проверить на EXPLAIN, а также на конфликте manual/automatic busy blocks.
- Миграции применять к пустой базе и к базе с тестовыми legacy rows, проверить rollback, idempotency, quarantine старых несоответствующих данных.
- Отдельно performance p95 публичного поиска по городу/category/status и private `/requests`, влияние количества профилей/слотов/локализаций.
- Запрещено считать SQL `constraints.sql` применённым только по его наличию в docs repo.
