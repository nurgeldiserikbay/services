# Services · модель данных для реализации

**Статус:** design reference v0.8, не production migration. Нормативные продуктовые решения: [ADR-0002](../../docs/adr/0002-global-local-discovery.md), [ADR-0003](../../docs/adr/0003-simple-booking-company-view.md), [ADR-0004](../../docs/adr/0004-cancellation-reliability-and-defaults.md).

- [schema.prisma](schema.prisma) — единый связный Prisma reference для будущего `services-back`; содержит 36 моделей: identity, country/city, taxonomy, professionals/companies/affiliations, offers, guest contacts, requests, schedules, cancellation, reliability, reviews and saved items.
- [constraints.sql](constraints.sql) — то, что Prisma declarative schema не выразит: XOR продавца/клиента, согласованность seller→offer, запрет менять продавца заявки, уникальные активные связи, пересечения известных busy blocks, обязательные **два** уведомления при отмене.
- [test-cases.md](test-cases.md) — тесты БД и конкурентных переходов до PR по реальным миграциям.

## Ключевые инварианты

1. `persons.user_id` — один человек на учётную запись в MVP. `professional_profiles` уникален по (person_id, profession_id) во всех статусах, включая архив и удаление-запрос (никаких копий для разных компаний).
2. `service_offers.professional_id XOR organization_id` — один продавец. `service_requests.seller_professional_id XOR seller_organization_id`; сервер фиксирует получателя из владельца offer, а `source_context` согласуется с ним.
3. `service_requests.customer_person_id XOR guest_contact_id` — либо зарегистрированный клиент, либо гость по проверенному каналу. Нельзя автоматически связать старую гостевую заявку с человеком только по совпадению телефона.
4. `company_professional_views` — ссылка на одобренную Affiliation, а не вторая профессиональная личность. Видимость = allowlist специалиста AND выбор компании AND правило платформы. Не публиковать при неактивной/неподтверждённой связи.
5. `availability_allocations` выделяют время personal/company; `busy_blocks` не пересекаются для одного мастера по **известным** платформе интервалам. Структура не видит устных договорённостей, пока не создан ручной block. Выделение времени и его подтверждение сторонами — серверный workflow, не SQL.
6. `service_requests.status` прост: PENDING/ACCEPTED/DECLINED/CANCELLED_*/COMPLETED/EXPIRED. Нет Quote, обязательной цены, платёжных статусов.
7. `cancellation_policies` задаёт продавец по offer. `cancellation_snapshots` появляется только при принятой заявке **с согласованным временем**. До подтверждения времени автоматическое ухудшение customer reliability запрещено.
8. `cancellation_events.request_id` уникален: одна отмена на заявку. На каждую отмену (в том числе pending) создаются **ровно два логических** `notification_intents`, по одному участнику; отправки по разным каналам — отдельные `notification_deliveries`. Это transaction + outbox.
9. `reliability_events` отдельно для Person (клиент), ProfessionalProfile или Organization (продавец), не для сотрудника корпоративного seller. Rating stars принадлежат `reviews` и не меняются при отмене.
10. `service_experiences` связаны с принятой заявкой. Отзыв публикуется только после подтверждённого опыта и авторизации. `reviews` имеют ровно одну цель: профи, компанию либо филиал.
11. `saved_items` принадлежат только `Person`; полиморфный `target_kind/target_id` требует server-side проверки существования и безопасного hide/deletion reconciliation.

## Требования к backend миграции

1. Перенести референс в реальный repo `services-back` **только после** проверки генератором Prisma CLI и архитектурного ревью отношений. Выбрать зафиксированную версию Prisma и PostgreSQL.
2. Сгенерировать baseline migration; применить SQL-инварианты из `constraints.sql` **как ревьюируемую миграцию с тестом отката**, а не SQL скриптом при каждом запуске.
3. SQL triggers/exclusion constraints вводить с учётом прав managed Postgres, объёмов таблиц и блокировок. На production использовать migration plan + staging.
4. При всех запросах делать **resource-scoped authorization**. FK/unique/trigger — последняя линия защиты, а не замена проверки полномочий.
5. Значения `company view` (`master_allowed_fields`, `company_selected_fields`) валидировать по versioned JSON Schema, не исполнять arbitrary JS/HTML, отзывать публикацию и CDN-кеш при отзыве согласия.
6. Гостевой контакт шифровать в storage, код OTP хранить hash, ограничить количество попыток, срок, логи/analytics; capability на **одну** заявку выдаётся отдельно и никогда не попадает в URL или общий кеш.
7. Уведомления и reliability summary пересчитывать в worker с idempotency; транзакции записи и события cancel завершать до отправки.
8. Retention/удаление, места хранения БД и backups, legal country/category gates нельзя считать решёнными только схемой.

## Что пока нужно добавить до производства

Полный i18n taxonomy and slug aliases; multi-language page editor revisions and media ACL; profile/page publish history; advanced delivery zones; challenge scopes, reusable guest capability and secure retrieval; exact owner claim workflow; case/appeal audit; PII data lifecycle; generalized operation logs and daily metrics. Часть областей сознательно **не включена** в core reference, чтобы не создавать ложное впечатление завершённой production ERD. Их требования записаны в отдельных главах и в `contracts/api-mvp-matrix.md`.

## Проверки

CI `.github/workflows/contracts.yml` запускает Prisma validate и бандлинг OpenAPI при изменении контрактов. Но **валидация синтаксиса не гарантирует** целостность реальных migration, безопасность ACL, performance и законность. SQL-план тестируется в PostgreSQL (не SQLite), параллельные запросы тестируются транзакциями.

### Первичный контрактный порядок

`ProductDecision → Prisma+SQL invariant → OpenAPI DTO/errors → backend integration tests → generated frontend client → UX E2E → QA`.

Актуальная UX-спецификация: [docs/ux/mvp-screen-contracts.md](../../docs/ux/mvp-screen-contracts.md).

## Точность модели v0.9
Теперь **36 Prisma-моделей**. Отдельно добавлены `AccountAuthChallenge`, `AccountConsent`, `GuestCapability`, `DomainOutboxEvent`. `Session` хранит семью ротационных токенов, `ServiceRequest` различает продавца и фактического исполнителя, а `BusyBlock` имеет собственный context и organization_id. Гость создаёт заявку через capability `CREATE_REQUEST`, затем получает независимый `READ_CANCEL` только на её ID; проверять срок, hash, запись и scope на сервере.

**Уведомления для всех событий:** `DomainOutboxEvent` — общая транзакционная запись для new/accepted/declined/cancelled и других событий; `NotificationIntent` с `domain_event_id` привязан к ней, `cancellation_id` необязателен для остальных событий. **При отмене остаётся ровно два логических intent** по cancellation_id, их доставка по каналам отслеживается в `NotificationDelivery`. Для создания/принятия заявки эти два специальных cancel-intent не требуются.

Статические guards SQL контролируют типы контекста для allocations/busy blocks, guest scopes и cancellation notification invariants. Full auth challenge verify, реальное соглашение о выборе исполнителя, field-level company-view permissions, PII retention и rate limits — domain tests, а не только SQL.
