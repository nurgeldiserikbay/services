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
