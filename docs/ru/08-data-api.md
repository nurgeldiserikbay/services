# 08. Модель данных, API и контракты
> Дизайн v0.1 · Контракты предварительные, не реализованы

## Реляционная модель
Person 1:N ProfessionalProfile; Profession 1:N ProfessionalProfile; unique(person_id, profession_id). Organization 1:N Location. ProfessionalProfile ↔ Organization через Affiliation, профессионал ↔ конкретное ServiceOffer через ServiceAssignment. Booking содержит offer_id, professional_profile_id и location_id как snapshot/foreign-key context. ServiceExperience связан с Booking, а Review адресуется immutable target_id и target_type.

## Состояния
Хранить enum/state машинно и явно валидировать переходы. Для архива/скрытия/удаления необходимо различать status, visibility, moderation_state и deletion_deadline — один status не должен пытаться выражать всё. PublishedRevision неизменяема, DraftRevision использует optimistic locking.

## Первоначальные REST endpoints (примеры)
| Метод | Путь | Назначение |
| --- | --- | --- |
| POST | /v1/auth/register | Регистрация |
| GET | /v1/me | Аккаунт, доступные пространства |
| GET/POST | /v1/me/professional-profiles | Мои профессии / создать |
| PATCH | /v1/me/professional-profiles/:id | Редактировать черновик |
| POST | /v1/me/professional-profiles/:id/publish | Публикация редакции |
| POST | /v1/me/professional-profiles/:id/lifecycle | Переход состояния |
| GET | /v1/professionals/:slug | Публичная профессиональная страница |
| GET/POST | /v1/organizations | Публичный поиск / создание бизнеса |
| POST | /v1/organizations/:id/affiliation-invites | Приглашение |
| POST | /v1/affiliation-invites/:id/accept | Подтверждение приглашения |
| POST | /v1/service-offers/:id/assignments | Назначение исполнителя |
| POST | /v1/bookings | Создать заявку |
| POST | /v1/bookings/:id/transitions | Изменить состояние |
| POST | /v1/experiences/:id/reviews | Отзыв по подтверждённому опыту |
| POST | /v1/follows | Подписаться |
| GET | /v1/search | Каталог |
| GET | /v1/admin/reports | Жалобы с серверной проверкой admin ACL |

API должен возвращать consistent error shape: code, message, details, request_id; статус 409 для конфликтов уникальности, 422 для недопустимых бизнес-переходов, 403 для отсутствия прав, 404 если объект не следует раскрывать.

## Пагинация/поиск
Cursor pagination на больших коллекциях, whitelisted sort/filter, limit caps, normalization query, index по profession/location/status, full-text/trigram для русских/казахских названий и aliases. Клиент может найти услугу, мастера или компанию; рекламные позиции всегда помечаются и не подменяют рейтинговый порядок.

## Контрактные события
profile.published, profile.archived, affiliation.accepted/ended, assignment.activated/revoked, booking.requested/accepted/completed/cancelled, review.created/moderated, follow.created, deletion.requested. Event schema versioning для совместимости.

## Схема публикации и связи
Любые идентификаторы проверяются на принадлежность owner/role, включая дочерние ресурсы. Контроллер не доверяет profile_id, присланному клиентом, без проверки владельца.

## Версионирование
API /v1, additive first, deprecation window, backwards-compatible migrations. Отдельный OpenAPI артефакт — единственный источник DTO типов для клиентов. При расширении поля enum учитывать старые мобильные версии; Feature flags и fallback UI.

## Нефункциональные ориентиры
Для пилота гипотезы SLO: доступность 99.5%, p95 простых GET до 500 мс (без внешнего геокодинга), без потери подтверждённых заказов. Цели утверждаются после нагрузки и бюджета; это не гарантированная производительность.
