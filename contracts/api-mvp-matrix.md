# Services · API MVP coverage and implementation sequence v0.8

**This is a design contract, not a deployed HTTP API.** Canonical machine-readable draft: [openapi.yaml](openapi.yaml) (OpenAPI 3.1, bundled by CI). Architecture and endpoint guidance: [chapter 18](../docs/ru/18-api-design.md). Database reference: [Prisma schema](prisma/schema.prisma), [SQL invariants](prisma/constraints.sql). UX: [16 MVP screens](../docs/ux/mvp-screen-contracts.md).

## Shared HTTP contract
- Public read: no Authorization for published profiles, company pages, offers, geography, search, review aggregates and visible availability. Returns **public DTO only**; SSR/CDN caches must not include private phone numbers, customer data, guest secrets or hidden company fields.
- Authenticated writes: server-side session/bearer adapter, role ACL **at the resource**, CSRF on cookie-based web, rate limiting. `Idempotency-Key` for create/accept/decline/cancel/complete and notifications; `If-Match`/optimistic version for competing edits.
- Guest request: verify contact (OTP, rate-limited, no account-enumeration); scope ephemeral capability to *one* request; never put secret in URL, analytics or shared cache. Authenticated/guest flows resolve the same underlying `ServiceRequest`.
- Seller determined from **Offer ownership in DB**, not client-supplied seller ID; company embedded card routes to the company only while effective affiliation/assignment exists. `ProfessionalProfile` not cloned.
- Booking status PENDING/ACCEPTED/DECLINED/CANCELLED_BY_CUSTOMER/CANCELLED_BY_PROVIDER/CANCELLED_MUTUAL/COMPLETED/EXPIRED; `Quote`, commercial negotiations, mandatory prices and payments are out of scope.
- Cancellation: seller's offer policy snapshot at accepted booking **with agreed time**; cancellation always possible. Two logical notification intents atomically created per cancellation (initiator + counterparty) and notification delivery retried after commit. Reliability is separate from review stars, appealable, no automated financial fines/bans.
- HTTP error body `{code,message,request_id,details?}`; errors: `400` malformed, `401` needs login, `403` forbidden, `404` unknown/hidden, `409` stale version or competing slot, `422` invalid fields, `429` rate-limit; never reveal private target existence.

## Routes and status

| Domain | API operations represented in current draft | Required further detail before READY |
| --- | --- | --- |
| Identity | `GET /me`, `GET/POST /me/professional-profiles`, lifecycle and profile edit, saved items, reliability | Real auth/register/OTP/session and consent endpoints, cookie/mobile split |
| Geo/taxonomy | `GET /geo/countries, /geo/areas, /geo/cities, /geo/suggestion, /professions, /service-definitions` | Pagination, i18n aliases and disambiguation, live country/category flags |
| Discovery | `GET /search`, `GET /professionals/{slug}`, `GET /organizations/{id}`, `GET /service-offers/{id}` | SEO/public DTO whitelists, filters, stable cursor, anti-spam/ranking |
| Companies | `POST /organizations`, affiliation invites, corporate master public view and two-sided edit permissions | Confirmation/revocation/role operations, location endpoints, claims and operator ACL |
| Offers | `POST /service-offers`, `GET/PATCH /service-offers/{id}`, cancellation policy | Publish/archive/assignment flows, verified contact and media/country rules |
| Requests | `POST /requests`, `GET /requests/{id}`, `GET /me/requests`, accept/decline/cancel/complete/schedule | Full state guards, events, guest cancellation linked to unified model |
| Guest | `POST /guest-inquiries/challenges`, `POST /guest-inquiries/challenges/{id}/verify`, `POST /guest-inquiries` | Unify names as `guest-requests` when SDK approved; secure detail/cancel/query |
| Calendar | `GET/PUT /me/availability-allocations`, `GET /public-availability` | Corporate approval/reject, manual busy-block writes, DST and conflict cases |
| Cancellation/reliability | GET/PUT offer policy, preview, request cancel, customer/seller score, appeal | Event history endpoints, admin case decisions, response no-show evidence |
| Reviews | `POST /experiences/{id}/reviews` | Client confirms experience, target-specific review read/list, report/appeal |
| Notifications | `GET /me/notifications` | Delivery preferences, inbox pagination, guest status and provider failures |
| Analytics | Not yet complete in OpenAPI | Privacy-safe seller-scoped daily counts, definitions and no unique guests inferred |

## Explicit contract gaps
Before code generation call these `OPEN TECH`, **not** implicit authorisation to invent fields:
1. `RequestBody/Response` completeness of legacy `/bookings` and `/guest-inquiries` vs canonical `/requests`: legacy aliases **must not** become two independent domain tables.
2. Exact authentication interface for Next.js cookie/session and native Capacitor token handling, refresh/revocation and CSRF.
3. Reusable `Error` response on every operation including 401/403/404/409/422/429 and rate-limit headers.
4. Consistent envelopes and cursor pagination for notification/history pages. Public search uses an opaque keyset cursor anchored to its deterministic `(title, kind, id)` ordering, with a maximum page size of 50.
5. Country/language/city alias and regulated profession publication permissions.
6. Company master view list, approval and revocation, content field schemas, safe media URLs, current revision/If-Match.
7. ServiceExperience customer confirmation, vendor cannot self-certify review; anti-fraud and moderator appeals.
8. Provider reliability event history/explanation, versioned scoring and appeal outcomes; legal review before any consequential use.
9. NotificationDelivery channels, retry/fallback and delivery status. `queued` is not `delivered`.
10. Signed, versioned public offer/cancellation snapshot and guest data retention/erasure.

## Definition of Ready for every endpoint
- Typed DTO, `additionalProperties: false` where mutating, correct nullability; no sensitive IDs allowed to bypass server-side seller determination.
- Clear access role + resource scope, public cache/no-store, rate limiting.
- Status transition guard, idempotency/If-Match, 409 response for races and blocked transitions.
- Error codes, localization strategy kk/ru, mobile/SSR response parity.
- DB/Prisma model mapping and unique/check/transaction strategy.
- Positive, forbidden, stale, conflict, replay, revoked relation and offline tests.
- OpenAPI bundle/validator and generated typed SDK pass; **then** implementation-ready. Current status is design draft.

## Minimum end-to-end contract probes
1. Guest queries local city, changes city manually, contacts independent professional without signup.
2. Guest verifies OTP and submits simple request; correct seller receives exactly one.
3. Embedded card inside organization routes to organization; master independent request is separate.
4. Offer with phone/WhatsApp only works without calendar, price or in-platform request.
5. Company/master publish view permitted fields intersection, revocation hides private content.
6. Customer cancels pending/on-time/late; seller cancels accepted; two intents, correct reliability recipient.
7. Same customer/multi-company resource cannot expose other business's customer, private busy reasons or saved items.
8. Logged-in customer saves item, sees only own history; verified review requires confirmed experience.

## Изменения v0.9 — удаление дублирования и безопасность
- **Единственный canonical заказ: `ServiceRequest` в `/requests`**. Старый `/bookings` удалён. Заявка гостя создаётся через `/guest-requests`, но сохраняется в той же таблице ServiceRequest с `guest_contact_id`. Подтверждение контакта через `/guest-requests/challenges` выдаёт создание-заявки capability; ответ на создание выдаёт другую request-scoped capability для чтения/отмены.
- `/auth/challenges`, `/auth/challenges/{id}/verify`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/sessions`: passwordless sign-up/login с явным intent. OTP challenge не сообщает, зарегистрирован ли контакт. Web BFF cookie/CSRF и Native bearer/rotated refresh — разные transport modes; не создавать permanent User при guest OTP.
- Для private endpoints указаны `webSession` и `sessionAuth`, а для ограниченного доступа гостя — `guestCapability`. Реальная серверная проверка контекста, срока, role ACL и CSRF всё ещё требуется при реализации.
- CI теперь проверяет не только bundle schema, но и [операционные инварианты OpenAPI](../scripts/check-api-contract.mjs). Метрики полного contract coverage ещё не означают готового backend.

## Актуальная модель v0.9
Единые маршруты **/requests** и **/guest-requests**; не создавать /bookings и /guest-inquiries. Раздельные `AccountAuthChallenge` и `GuestCapability` соответствуют [Prisma reference](prisma/schema.prisma). `Guest-Capability` после верификации контакта допускает однократное создание заявки; в ответ выдать новое право на собственную заявку, не превращая гостя в User. WebSession cookie с CSRF и mobile bearer/rotated refresh обязательны, прежде чем выпускать приложения.

Общий `DomainOutboxEvent` обеспечивает уведомления при создании и принятии; `NotificationIntent.cancellation_id` nullable кроме cancel. CancellationIntent×2 в одной транзакции — строгое правило. Текущая OpenAPI в CI бандлится и дополнительно проверяется на operationId/path-params и публичные/защищённые маршруты. Полнота DTO/реальных ошибок ещё не подтверждена.
