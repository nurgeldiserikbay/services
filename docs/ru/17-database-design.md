# 17. PostgreSQL, Prisma и границы транзакций
> Проектная ER-модель v0.2, не готовая миграция. Применить к реальной Prisma schema с reviewed migrations.

## Таблицы и ключи
| Таблица | Ключевые поля / связи | Ограничения |
| --- | --- | --- |
| users | id, email?, phone?, status, created_at | unique verified contact, sensitive encrypted |
| sessions | user_id, hash, device_id, revoked_at, expires_at | hashed refresh/session ids |
| persons | id, user_id, verified_identity_status | unique user_id в MVP |
| personal_profiles | person_id, slug, visibility, description | unique person_id |
| professions | id, parent_id?, code, status | canonical code unique |
| profession_i18n | profession_id, locale, display_name, aliases | unique profession+locale |
| professional_profiles | id, person_id, profession_id, slug, lifecycle_status | unique(person_id, profession_id) |
| profile_revisions | id, profile_id, content, schema_version, published_at | immutable published |
| page_drafts | profile_id, blocks_json, optimistic_version | one active draft per profile |
| organizations | id, owner_person_id, legal_status, public_status | distinct ownership |
| organization_members | organization_id, user_id, role, scope, revoked_at | unique active memberships |
| locations | id, organization_id, address, geo_point, status | cascade closure policy |
| affiliations | id, professional_profile_id, organization_id, location_id?, type, status, start/end | period consistency |
| service_definitions | id, category, i18n, allowed_professions | canonical IDs |
| service_offers | id, seller_type/id, service_definition_id, location_id?, version, price, duration, status | seller & currency |
| service_assignments | id, offer_id, professional_profile_id, affiliation_id?, status, valid_from/to | active consent |
| bookings | id, customer_person_id, offer_id, provider_profile_id?, snapshot_json, state, version | transitions + idempotency |
| booking_events | id, booking_id, actor_id, action, metadata, occurred_at | append-only |
| service_experiences | id, booking_id, performed_at, verification_status | one logical completion |
| reviews | id, experience_id, author_person_id, target_kind, target_id, rating, status | unique experience/author/target |
| follows | id, follower_person_id, target_kind, target_id, notification_opt_in | unique pair |
| media_assets | id, owner, storage_key, visibility, scan_status | private by default |
| notifications | id, recipient_user_id, event_id, channel, status | dedupe |
| reports/cases | id, reporter_id, object_ref, status, resolution | reason + appeal |
| audit_events | id, actor, resource, action, reason, correlation_id, timestamp | append-only |
| outbox_events | id, type, payload, created_at, processed_at | retry safe |
| idempotency_keys | actor, key, operation, request_hash, response_ref, expiry | unique actor + key + operation |

Полиморфный seller/target через (type,id) не имеет полноценного FK. Для критических объектов рассмотрим явные nullable FK с CHECK exactly-one либо типизированные reference tables — решение фиксировать ADR. Нельзя оставлять ссылки на несуществующие объекты.

## Индексы
Professional profiles: unique(person_id, profession_id), partial public index(status, profession_id). Offers: composite(status, service_definition_id, location_id). Reviews: unique(experience_id,author,target_kind,target_id), index target. Affiliations: professional/profile and organization history; unique active pairs + interval exclusion after уточнения правил. Location: GiST geo_point/PostGIS при необходимости. Search: PostgreSQL FTS/trigram с нормализацией кириллицы/казахских букв.

## Снимок коммерческой операции
Booking.snapshot_json содержит immutable: human-readable service name, seller, price/currency, taxes where applicable, professional, company/location, cancellation policy, accepted_at. Новая версия offer не должна перезаписывать старую бронь.

## Транзакции
create profession: DB unique + stable retry semantics. confirm affiliation: invitation + affiliation + audit + outbox одной транзакцией. accept booking: check offer/assignment, reserve capacity, snapshot, event, outbox. finish booking/experience/review: ограничения на повтор, transaction boundary. Delete/archive: workflow, not giant cascade.

## Retention and privacy
Separate public profile data and PII; avoid keeping raw IDs/documents in logs, backup retention policies, export by owner, lawful deletion / anonymization. Encryption in transit & at rest, field encryption for sensitive values where needed. Казахстанскую территориальность БД, backup, CDN and analytics подтвердить до production.

## Миграции
Prisma migrations tracked, additive expand/migrate/contract, dry-run staging with existing data, backfills idempotent. Никаких автоматических destructive db push в production. Restore test и rollback deployment должны быть проверены.

## Неопределённости
Окончательный способ полиморфных targets; полные поля регулируемых профессий; SLA хранения по виду данных; мультивладение юридических лиц; резервирование временных окон. Это ADR перед реализацией.

## Дополнение v0.4 — глобальная география и покрытие услуг
Предусмотреть нормализованные **Country** (ISO 3166-1 alpha-2), **AdministrativeArea** (регион/область/штат, тип и локализованные имена, возможный ISO 3166-2), **City** (стабильный внутренний ID, имя, aliases, parent region, country, timezone IANA, координаты центра для поиска), **Location** (адрес/координаты только при согласии владельца на публикацию), **ServiceArea** (зона выезда/покрытия или набор регионов), **SearchLocationPreference** (в явном виде выбранный geo ID и scope, anonymous local device preference / optional account sync). Идентификатор города стабильный: нельзя полагаться на название «Париж», которое может повторяться в разных странах.

ServiceOffer: delivery_mode = at_location | at_customer | online | hybrid; доступные location_ids/service_area_ids, supported_regions/countries для онлайн, правила юрисдикции; currency ISO 4217 per offer, доступность времени в UTC вместе с IANA timezone филиала. Конкретная заявка хранит snapshot страны, местоположения, timezone и валюты. Не хранить GPS-координаты или IP посетителей без необходимости; отдельно определить retention consent/analytics.

Для ускорения запросов: country/area/city composite indexes; GiST/PostGIS для георадиуса только при необходимости; локализованные aliases и полнотекстовый поиск; индексация «активен + обслуживает выбранный регион», без утечки приватных адресов или зон, которые владелец не публиковал.

Порядок запуска: глобально готовые справочники/контракты, но категории и операции по конкретным странам включать после проверки законодательства и возможностей поддержки. Иностранные налоги/платежи не считать автоматическими только из-за универсальной схемы.

## Дополнение v0.5 — общий профиль в корпоративных контекстах, простой запрос, календарь
`CompanyProfessionalView` (organization_id, professional_profile_id, affiliation_id, location_id?, master_allowed_fields_json, company_selected_fields_json, company_content_json, revision, published_at) **не дублирует** профессиональную личность или отзывы. Предусмотреть отдельные принадлежность и revision для личных/корпоративных блоков, аудит обновления разрешений и invalidation публичного кеша. При конце Affiliation корпоративная публикация скрывается.

`ServiceOffer` с ровно одним владельцем: independent_professional_profile_id XOR organization_id (или типизированная reference table с полноценными FK); `performer_profile_id?`, `location_id?`, `contact_methods`, `acceptance_mode`, `availability_visibility`, необязательная справочная `display_price`/price_kind. Не требовать price для публикации, не создавать Quote и коммерческую таблицу переговоров для MVP.

`ServiceRequest` (id, seller_kind/id, offer_id, source_context_kind/id, performer_profile_id?, author_person_id?, guest_contact_id?, status, note?, scheduled_start/end?, timezone?, created_at, accepted_at?, cancelled_at?, idempotency_key, version). `ServiceRequestEvent`: append-only accepted/declined/cancelled/completed/time_changed, source actor, no price negotiation. Nullable customer person only при гостевой заявке; owner-ACL для продавца и client/guest-scoped доступа.

`AvailabilityAllocation` (professional_profile_id, work_context personal|organization, organization_id?, location_id?, timezone, recurrence, start/end, effective dates, exceptions, specialist_confirmed, organization_confirmed). `BusyBlock` (professional_profile_id, start_utc, end_utc, source_request_id?, private_scope, reason_private?) и выбор `CalendarVisibility` отдельно по контексту. Инвариант: один профессионал не может принять несовместимые **известные** слоты одного времени, а информация о корпоративном или личном блоке вне текущего контекста отображается только как недоступность. При отсутствии календаря никакие несуществующие слоты не должны автоматически генерироваться.

`SavedItem` (person_id, target_kind professional|organization|location|offer, target_id, created_at) уникален по (person_id, target_kind, target_id). `Follow` отдельно от сохранения в закладки; `AnalyticsEvent` / `SellerMetricDaily` агрегируют публичные просмотры, клики контактов, guest/authenticated requests, принятые и подтверждённые услуги; `unique_registered_customer_count` — только на основании правомерно связанных авторизованных обращений. Никакая статистика звонков/WhatsApp не доказывает выполненный заказ.

**Миграции и совместимость:** прежние проектные `bookings.snapshot_json.price` не означают обязательного поля; существующие события/отзывы при миграции должны оставаться доступными, но старые Quote/draft schema из планов не считать утверждённой моделью.

## Дополнение v0.7 — snapshot отмены, репутационные события и транзакционная доставка
Рекомендуемые таблицы/поля (проекционный дизайн, **ещё не Prisma migration**):
- `ServiceOfferCancellationPolicy(offer_id PK, free_cancel_before_minutes, revision, updated_by, updated_at)`, допустимый диапазон 0..10080 с server CHECK; предложения без времени не получают дедлайн.
- `ServiceRequestCancellationSnapshot(request_id UNIQUE, seller_kind, seller_id, policy_revision, scheduled_start_at_utc, timezone, free_cancel_before_minutes, free_cancel_until_utc, accepted_at)`, неизменяемый после принятия со временем, protected by seller/ACL.
- `CancellationEvent(id, request_id, initiated_by_role, initiated_by_person_id?, seller_id, status_from, status_to, reason_code, occurred_at, late, snapshot_id?, version)`, append-only; без текстов диагнозов/переговоров.
- `ReliabilityEvent(id, request_id, subject_kind customer_person|professional_profile|organization, subject_id, event_key UNIQUE, reason, weight, score_policy_version, status proposed|effective|suppressed|appealed|reversed, reviewed_by?, created_at)`; unique по subject + request + group, не штрафовать дважды за retry.
- `ReliabilityAggregate(subject_kind, subject_id, rolling_window, eligible_completed, weighted_penalties, score, sample_size, computed_at, formula_version)` обновляется из событий, не прямым редактированием администратора.
- `NotificationIntent(id, event_id, recipient_role, recipient_person_id?, verified_guest_contact_id?, channel, state pending|sent|delivered|failed, retry_count, next_retry_at, idempotency_key UNIQUE)` с двумя адресатами на любую отмену. При наличии inbox у компании направить через owner/operator routing без рассылки всем сотрудникам.

**Транзакция:** проверить `request.version` и ACL → статус cancel → записать CancellationEvent → снять резерв занятости → два NotificationIntent и при допустимости ReliabilityEvent → commit. Worker после commit выполняет retries, сообщает failure, обновляет агрегаты. Время UTC + timezone IANA для отображения, периоды и grace не менять задним числом, скрытые контакты не выводить в логи/CDN.

Индексировать `(seller_id,status,scheduled_start_at)`, `(customer_person_id,status)`, `(subject_id,occurred_at)`, `notification_intent(state,next_retry_at)`; privacy/retention и законное место хранения гостевых контактов остаются launch gate.

## Актуальная референсная схема v0.8 — источник для реализации
Чтобы ИИ-разработчики не восстанавливали ERD из разрозненных списков, в `contracts/prisma/` есть единая [Prisma schema (36 моделей)](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/schema.prisma), [PostgreSQL constraints/trigger design](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/constraints.sql), [руководство по миграциям](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/README.md) и [34 тестовых сценария](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/test-cases.md). **Она прошла синтаксическую Prisma-проверку в CI, но не является уже применённой миграцией.**

Важные принятые инварианты: один ProfessionalProfile на пару Person/Profession (включая archived), ровно один seller у ServiceOffer, customer XOR verified guest у ServiceRequest, snapshot seller/context при создании заявки, CompanyProfessionalView с настоящей Affiliation, добровольный календарь, отдельные reliability и quality reviews, cancellation snapshot при принятии датированной заявки, на каждую отмену ровно два логических NotificationIntent, отдельные per-channel NotificationDelivery и проверка пересечения известных BusyBlock через GiST.

**Примечание об источниках:** прежняя табличная ER-модель выше и старые имена bookings могут быть неполными или устаревшими; для новых разработок выбирать `contracts/prisma/schema.prisma` и ADR-0003/0004. Поля не копировать из старых таблиц без сверки с schema. Миграции переносить в `services-back` только после ревью SQL trigger, foreign keys, миграционных блокировок, recovery и PostgreSQL integration tests. Продуктовые правила не заменяют проверки ACL на сервере.

## Принятые уточнения v0.9 — 36 моделей, capabilities и общий outbox
Эталонная [Prisma schema](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/schema.prisma) теперь содержит 36 моделей. Добавлены `AccountAuthChallenge`, `AccountConsent`, `GuestCapability` с раздельными типами `CREATE_REQUEST`/ `READ_CANCEL`, а также `DomainOutboxEvent`. Реальный `ServiceRequest` хранит **seller и performer отдельно**. `BusyBlock.organization_id` и обязательный context (личный либо корпоративный) не дают случайно записать рабочие часы компании как личные.

Прежний вариант `NotificationIntent.cancellation_id required` **заменён**: теперь у уведомления всегда есть `domain_event_id`, а `cancellation_id` установлен только при отменах. При отмене двухсторонний deferred constraint требует ровно два cancellation intent; при создании/принятии можно создавать уведомления без ложного CancellationEvent. В [SQL guards](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/constraints.sql) добавлены проверки scopes/контекста, в [Postgres smoke](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/smoke.sql) — позитивные/негативные сценарии. Система должна сохранять один DomainOutboxEvent на один business event и дедуплицировать доставку.
