# 18. Проектирование REST/OpenAPI и событий
> API contract v0.2. Этот документ — требования к будущему OpenAPI 3.1; маршрут не считается существующим до реализации и contract tests.

## Принципы
Единый versioned HTTPS REST /v1 для SSR web, PWA, Capacitor mobile и admin. Контракты в репозитории services, клиентские типы генерируются. Все mutate используют explicit auth+resource ACL; критичные POST — Idempotency-Key. Задачи асинхронные через outbox.

## Группы endpoints
| Группа | Endpoints и операции |
| --- | --- |
| Identity | /v1/auth/register, login, logout, sessions, contact/verify, password-reset, /v1/me |
| Person | GET/PATCH /v1/me/person; GET/PATCH /v1/me/public-profile, visibility |
| Professional | GET/POST /v1/me/professional-profiles; GET/PATCH /v1/me/professional-profiles/:id; lifecycle /publish,/archive,/restore,/delete |
| Editor | GET/PATCH /v1/professional-profiles/:id/draft; POST /preview,/publish; GET /revisions |
| Taxonomy | GET /v1/professions; GET /v1/service-definitions; filters by canonical ID and locale |
| Organization | POST /v1/organizations; GET/PATCH /v1/organizations/:id; /locations,/members |
| Affiliations | POST /v1/organizations/:id/invitations; POST /v1/affiliation-invites/:id/accept|decline; /v1/affiliations/:id/end |
| Offers | POST /v1/service-offers; PATCH /v1/service-offers/:id; /activate,/pause |
| Assignments | POST /v1/service-offers/:id/assignments; POST /v1/assignments/:id/accept|revoke |
| Search | GET /v1/search?q=&kind=&city=&profession=&page_size=&cursor= |
| Booking | POST /v1/bookings; GET /v1/bookings/:id; POST /v1/bookings/:id/accept|reject|cancel|complete |
| Experiences | POST /v1/bookings/:id/experience-confirmation; GET /v1/experiences/:id |
| Reviews | POST /v1/experiences/:id/reviews; GET /v1/reviews?target_kind=&target_id=; /report |
| Social | POST/DELETE /v1/follows; GET /v1/me/follows; POST /v1/recommendations (P1) |
| Notifications | GET /v1/me/notifications; PATCH /preferences; POST /mark-read |
| Admin | /v1/admin/cases, /v1/admin/verifications, /v1/admin/taxonomy, /v1/admin/audit with privileged policy |

## Контракт создания профессионального профиля (пример)
Request POST /v1/me/professional-profiles:
person_id определяется из session, не принимается с клиента;
body: { profession_id: UUID, preferred_slug?: string }.
Response 201: { id, profession_id, lifecycle_status: "draft", version: 1 }.
Повтор при том же idempotency key → тот же результат; попытка создать дубликат по другой команде → 409 PROFILE_ALREADY_EXISTS + existing_profile_id только если владелец тот же.

## Контракт отзыва (пример)
POST /v1/experiences/:id/reviews:
{ target_kind: "professional" | "organization" | "location", target_id: UUID, rating: 1..5, text?: string }.
Сервер проверяет автора, completion eligibility и что цель действительно участвовала в experience. Нельзя подставить другую компанию или другую профессию. Отзывы о разных целях независимы.

## Ошибки и типовые заголовки
{ code: "PROFILE_ALREADY_EXISTS", message: "Профиль этой профессии уже существует", details: { existing_profile_id }, request_id: "..." }; 400 malformed, 401 unauthenticated, 403 forbidden, 404 not revealed, 409 state/version conflict, 422 invalid domain action, 429 rate limit. Pagination: { items:[], next_cursor:null }. ETag/If-Match для revision. Security: no stack traces or PII in error.

## Версионирование и мобильные клиенты
Добавлять поля backwards-compatible, feature flag по версиям клиента; не ломать enum consumers и сериализацию старых приложений. Sunset/deprecation с периодом поддержки, вынесенным в ADR. Schema validation/Zod/DTO и contract tests для generated client.

## Async domain events
profile.published.v1, affiliation.accepted.v1, affiliation.ended.v1, assignment.revoked.v1, booking.accepted.v1, booking.completed.v1, review.created.v1, moderation.decided.v1, follow.changed.v1, deletion.requested.v1. Envelope: event_id, type, occurred_at, aggregate_id, correlation_id, schema_version, payload. Консьюмеры идемпотентны; не включать приватные поля без необходимости.

## API quality gates
Путь указан в документации → OpenAPI schema → бекенд handler → permissions tests → integration tests → generated client → UI states → E2E. Никакой ручной копии типизации в двух фронтендах.
