# План устранения расхождений Prisma / OpenAPI / UI — ServiceRequest

**Статус:** proposed, проверено по текущим файлам ветки 2026-11-02. **Не является подтверждением реализации.** Основной нормативный документ: [request-consistency.md](request-consistency.md). Решения ADR-0003/0004/0005 выше этого плана.

## A. Что уже подтверждено исходниками

1. `contracts/prisma/schema.prisma`: `RequestStatus` = PENDING, ACCEPTED, DECLINED, CANCELLED_BY_CUSTOMER, CANCELLED_BY_PROVIDER, CANCELLED_MUTUAL, COMPLETED, EXPIRED. `ServiceRequest.version` доступен для оптимистической конкуренции, даты nullable, seller и performer — отдельные поля.
2. `contracts/prisma/schema.prisma`: `CancellationEvent.requestId` unique; `BusyBlock` привязан к professional и может ссылаться на request; `DomainOutboxEvent` и `NotificationIntent` существуют.
3. `contracts/prisma/constraints.sql`: deferred trigger проверяет два intent при insert cancellation; это не проверяет корректность повторной доставки worker, поэтому нужны интеграционные тесты.
4. `contracts/openapi.yaml`: объявлены accept, decline, cancel, cancellation-preview, `Idempotency-Key`; cancel поддерживает `If-Match`, но его необязательность оставляет конкурентное поведение недоопределённым.
5. Продакшен-схема, миграции и end-to-end backend не подтверждены — источник только проектные контракты.

## B. Предлагаемые контракты до кодирования (решения для review)

| ID | Контракт | Проверка |
| --- | --- | --- |
| REQ-C01 | Все transport statuses 1:1 с Prisma enum. UI переводит названия, API не переименовывает. | Schema snapshot и typed client |
| REQ-C02 | Все write endpoints принимают обязательный `Idempotency-Key`. Scope: tenant/account или guest capability subject + HTTP method + canonical route + key; сравнение body digest. | Parallel replay, differing payload 409 |
| REQ-C03 | Хранить operation record: scope, body digest, operation state, response status/body ref, created/expiry; результат фиксировать в той же транзакции или обеспечивать восстановление после crash. | Crash-before/after commit tests |
| REQ-C04 | Состояние `PENDING` меняется ровно один раз; CAS по status/version. Stale result 409; для повторного identical operation — replay. | accept vs decline vs cancel concurrency |
| REQ-C05 | `scheduled_start_at` не является agreed time, пока acceptance/confirmation явно не подтверждены обеими сторонами. Ввести отдельную семантику agreement flag/event, не делать penalty на основании client preference. | Guest and registered scheduling E2E |
| REQ-C06 | Изменение времени после принятия: предложение новой даты → подтверждение клиентом → новый immutable snapshot и уведомления. До подтверждения не применять late customer penalty по новой дате. | Reschedule vs cancel race |
| REQ-C07 | Bookable слот блокируется атомарно на professional + time range across personal/company contexts; SQL exclusion/locking или документированный эквивалент. Для offers без гарантированных слотов не обещать доступность. | Two concurrent accept one slot |
| REQ-C08 | `CancellationEvent` unique по request; cancellation status по инициатору, mutual требует доказуемого согласования, не только `reason_code`. | Two cancels, fake mutual rejected |
| REQ-C09 | На каждую отмену ровно один outbox event и два logical intent в одной транзакции; повторная доставка не создаёт новые intents. | Worker retry, delivery failure |
| REQ-C10 | `COMPLETED` устанавливать только на основании предусмотренного события подтверждения, `EXPIRED` — по явному TTL для pending (если выбран). Ни один таймер сам не создаёт положительный отзыв. | Clock/fake event tests |
| REQ-C11 | `409` имеет machine-readable `code` и `current_version` только для авторизованного получателя. `404` маскирует чужой ресурс. | IDOR + stale write |
| REQ-C12 | Полная локализация `kk/ru`, `en`-ready: cancellation deadline, unknown schedule, pending state, outbox delivery distinction. | UX accessibility and locale tests |

## C. Рекомендованный формат error body

```json
{
  "error": {
    "code": "REQUEST_STATE_CONFLICT",
    "message": "Заявка уже изменила состояние",
    "request_id": "00000000-0000-4000-8000-000000000001",
    "current_version": 4
  }
}
```

Это **предложение**, не существующий OpenAPI контракт. Не возвращать id или версию без авторизации. Кодировать отдельные `SLOT_CONFLICT`, `IDEMPOTENCY_PAYLOAD_MISMATCH`, `GUEST_CAPABILITY_EXPIRED`, `RESCHEDULE_REQUIRES_CONFIRMATION`. Следующий коммит должен добавить единые response schemas в OpenAPI и negative tests.

## D. Принципиальные UX-состояния

- Pending/accepted/declined/cancelled отображаются в деталях заявки без ложных обещаний доставки сообщения.
- Кнопка «Принять» отключена во время запроса; повтор по тому же key при timeout; при 409 обновление статуса.
- Согласованное время показывается отдельно от пожелания; дата/время в зоне продавца и пользователя с явной меткой.
- За пределами своего контекста в календаре — только `busy`, не имя клиента/организации.
- Внешний телефон/WhatsApp не создает внутреннюю заявку и не влияет на reliability автоматически.

## E. Следующий технический PR

Сначала пересмотреть и утвердить REQ-C01..C12, затем одним согласованным changeset: OpenAPI enum/error/write contracts, Prisma idempotency ledger + migration and SQL constraints, серверные тест-кейсы, новые generated clients. Не объявлять `TECH-01..08` закрытыми до CI evidence и проверки security/legal gates.
