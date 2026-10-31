# 07. Архитектура Backend API
> Рекомендация v0.1 · Репозиторий: [services-back](https://github.com/nurgeldiserikbay/services-back)

## Стек и границы
NestJS + TypeScript, PostgreSQL + Prisma. Модульный монолит: единая схема и транзакции, чёткие module boundaries, без преждевременных микросервисов. Redis/queue, PostGIS, поисковый движок подключаются лишь после подтверждения нагрузки. Медиа — object storage с политиками доступа и ресайзингом.

## Модули
| Модуль | Ответственность | Владение данными |
| --- | --- | --- |
| Identity | Логин, сессии, MFA, верификация контактов | User, Session |
| People | Person, общий публичный профиль, настройки | Person, PersonalProfile |
| Professions | Справочник, синонимы, специализации | Profession, Specialization |
| Profiles | ProfessionalProfile, lifecycle, revisions, blocks | ProfessionalProfile, ProfileRevision |
| Organizations | Компании, филиалы, роли | Organization, Location, Membership |
| Affiliations | Приглашения, профессиональные связи, разрыв | Affiliation, Invitation |
| Catalog | ServiceDefinition, offers, searchable read models | ServiceOffer |
| Assignment | Согласование исполнителей по предложениям | ServiceAssignment |
| Booking | Запросы, статусы, конфликт времени | Booking, BookingEvent |
| Experience | Подтверждение факта услуги | ServiceExperience |
| Reputation | Отзывы, жалобы на отзывы, агрегаты | Review, RatingAggregate |
| Social | Follow, Recommendation, notification preferences | Follow, Recommendation |
| Notifications | Inbox, email/push dispatch, templates | Notification, Delivery |
| Media | Проверка загрузки, авторизация объектов | MediaAsset |
| Moderation | Жалобы, решение, апелляции | Report, ModerationCase |
| Audit | Append-only events, correlation | AuditEvent |

## Структура каждого модуля
controllers (HTTP) → application services/use cases → domain entities/policies → repositories/adapters. Контроллеры не содержат бизнес-правил. Cross-module доступ через публичные application interfaces/events; не импортировать Prisma модели чужого модуля в произвольный код.

## Транзакционная последовательность
Пример accept affiliation: authentication → ACL конкретного invited profile → validate invitation pending/unexpired → transaction optimistic/row lock → create active Affiliation + consume invitation → append AuditEvent + OutboxEvent → commit → asynchronous notification. Повторный idempotency key возвращает прежний результат.

## Целостность
Уникальный индекс person_id + profession_id в БД. Уникальность follow(profile, follower). Review unique(service_experience_id, author_person_id, target_type, target_id). Affiliation unique active pair with explicit location/period rules. Foreign keys, state transition constraints, timestamps, soft-archive columns. Long-lived review targets используют неизменяемый ID, не slug.

## Работа с событиями
Transactional outbox для уведомлений и аналитических событий, worker с idempotent delivery, retry+backoff, DLQ и наблюдаемостью. До роста нагрузки можно использовать PostgreSQL queue/outbox, не вводя Redis по умолчанию.

## Интеграции
Провайдер SMS/email/push через adapter; внешние карты/геокодинг за interface. На MVP нет необходимости хранить деньги клиентов. Лимитировать внешние вызовы, поддерживать таймауты, circuit breaker при необходимости, отмену неактуальных запросов со стороны frontend.

## Требования к тестам
Unit для доменных политик, Postgres integration на реальные ограничения/транзакции, contract tests для OpenAPI, authorization/IDOR и нагрузочные smoke для поиска и booking. Нельзя полагаться только на mock Prisma в проверках гонок.

## Развёртывание
Separate API и worker processes, container-based deployment, environments dev/staging/prod, migrations перед rollout с обратной совместимостью, health endpoints, structured logs, tracing, metrics, alerts, backup/recovery with documented RPO/RTO targets.
