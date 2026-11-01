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

## Дополнение v0.3 — публичный read API и гостевые запросы (контракт для детализации)
**Принцип:** чтение публичных опубликованных данных не требует Authorization. Возвращать отдельные public DTO (только whitelisted данные), не просто исключать пару полей из приватной сущности. Для SSR/индексации — согласованные cache-control/ETag и безопасная инвалидация публикации/архива.

| Операция | Доступ | Правило |
| --- | --- | --- |
| GET /v1/search | anonymous | Каталог и фильтры; только опубликованные/активные данные |
| GET /v1/professionals/:slug | anonymous | Публичная версия профессиональной страницы |
| GET /v1/organizations/:slug | anonymous | Публичная версия компании и доступных филиалов |
| GET /v1/service-offers/:id | anonymous | Цена/диапазон, продавец, условия, доступные исполнители |
| GET /v1/reviews?target_kind=&target_id= | anonymous | Только допустимые опубликованные отзывы |
| POST /v1/guest-inquiries/challenges | anonymous, rate-limited | Создать проверку контакта; не раскрывать существование аккаунта |
| POST /v1/guest-inquiries/challenges/:id/verify | anonymous + OTP | Ограниченная проверка канала; TTL, попытки, anti-bruteforce |
| POST /v1/guest-inquiries | verified guest capability | Идемпотентное создание обращения без User/Person |
| GET /v1/guest-inquiries/:id | verified guest capability | Только свой запрос и минимально необходимые поля |
| POST /v1/guest-inquiries/:id/cancel | verified guest capability | Ограниченный переход с проверкой статуса |

**Статус:** предлагаемые маршруты, их ещё нет в частичном `contracts/openapi.yaml`; до разработки нужно дополнить полную схему OpenAPI 3.1 и зафиксировать авторизацию web/mobile. Не хранить OTP или bearer capability в URL аналитики, logs и сторонних referer. На опубликованных контактах — только те данные, на распространение которых владелец явно согласился.

Гостевая заявка может быть представлена отдельной таблицей GuestInquiry с безопасной связью на Booking либо Booking с guest_contact_id и nullable customer_person_id; решение о форме persistence зафиксировать ADR. Для последующей привязки заявки к аккаунту требуется новое подтверждение владения каналом и отсутствие конфликтов, а не совпадение номера без проверки.

## Дополнение v0.4 — география поиска, глобальная доступность и контракт предпочтений
**API для гостя:** открытый GET /v1/geo/countries, GET /v1/geo/areas?country_id=, GET /v1/geo/cities?q=&country_id=&area_id= с locale и пагинацией. Географические ссылки используют стабильные IDs, ISO-коды и локализованные наименования, а не свободный city string. Каталог GET /v1/search принимает `country_id`, `area_id`, `city_id`, `scope` (city/area/country/global), `delivery_mode` (at_location/at_customer/online/any) и только разрешённые комбинации. Отдельный GET /v1/geo/suggestion может возвращать **примерную** `{country_id, area_id?, city_id?, source:'network'|'fallback', confidence:'low'|'medium'}`, без ложной точности и без сохранения raw IP.

Явно выбранный регион — **клиентское предпочтение**, хранимое локально без регистрации. Пользовательский GET/PATCH /v1/me/preferences/search-location (после входа) синхронизирует настройку, но не переписывает более новый ручной выбор на устройстве. Публичный API не должен получать точные координаты без отдельного действия. Для «Рядом со мной» точные координаты передаются в защищённый запрос только после согласия, минимизируются и не логируются. Локация поиска отличается от адреса оказания услуги, местоположения аккаунта, юридической страны пользователя и языка интерфейса.

В каждый результат включать `location_label`/`service_area`, `delivery_mode`, `currency`, `is_sponsored`, `is_within_selected_area` (с корректной проверкой зоны обслуживания). При недостатке результатов возвращать `suggested_expansions` с явными действиями, но не менять scope автоматически без обозначения. Публичные ссылки /{locale}/{country}/{city}/... или эквивалентные канонические маршруты требуют ADR: один город в разных странах должен иметь разные стабильные идентификаторы, `hreflang`, `canonical` и sitemap только для страниц с доступным предложением.

**Глобальность данных не означает доступность услуг во всех странах.** Feature flags по стране/категории, отдельные условия обработки персональных данных, валюты и регуляторика; возможность гостевого поиска не зависит от юридического наличия локального продавца.

## Дополнение v0.5 — простые заявки и страницы мастера в компании
[ADR-0003](https://github.com/nurgeldiserikbay/services/blob/main/docs/adr/0003-simple-booking-company-view.md) отменяет ранее приведённые примеры `reschedule_requested` и `Quote` для MVP. API должен иметь только простые переходы `pending → accepted|declined|cancelled`, `accepted → completed|cancelled`; изменение времени — `PATCH /v1/requests/:id/schedule` с версией, проверкой роли и историей.

| Операция (предлагаемая) | Доступ | Назначение |
| --- | --- | --- |
| GET /v1/professionals/:slug | Гость | Независимая страница и личные CTA/услуги |
| GET /v1/organizations/:org_id/professionals/:profile_id | Гость | View внутри компании с пересечением разрешений двух сторон |
| PATCH /v1/professional-profiles/:id/company-views/:org_id/permissions | Мастер | Разрешает корпоративный показ полей и фото |
| PATCH /v1/organizations/:org_id/team/:profile_id/view | Компания | Выбирает разрешённые поля, брендовый layout и корпоративное описание |
| GET/PUT /v1/service-offers/:id/intake | Продавец | Выбор каналов, скрытия календаря, режима приёма |
| POST /v1/requests | Клиент или guest capability | Создаёт `pending`; seller определяется сервером по offer/context |
| POST /v1/requests/:id/accept | Продавец/оператор | Принятие с idempotency и проверкой известных слотов |
| POST /v1/requests/:id/decline | Продавец/оператор | Отклонение |
| POST /v1/requests/:id/cancel | Клиент или продавец согласно ACL | Отмена с освобождением известного busy block |
| POST /v1/requests/:id/complete | Продавец/оператор | Отметка выполнения, не автоматический verified review |
| PATCH /v1/requests/:id/schedule | Продавец/оператор | Меняет дату после внешней договорённости, уведомляет по возможности |
| GET/PUT /v1/me/availability-allocations | Мастер | Личные/корпоративные интервалы и исключения |
| GET/PUT /v1/organizations/:id/availability-allocations | Компания в scope | Согласование корпоративных интервалов мастера |
| GET /v1/public-availability?offer_id= | Гость | Только публичные свободные/занятые интервалы выбранного контекста |
| GET/POST/DELETE /v1/me/saved-items | Авторизованный клиент | Сохранение страниц/услуг в своём кабинете |
| GET /v1/seller/analytics | Продавец с ACL | Агрегаты и только допустимые уникальные авторизованные обращения |

**Общие правила:** открытые публичные endpoints не возвращают неразрешённые компанией/мастером поля или приватную занятость. Действие по корпоративному offer не может стать заявкой независимого специалиста по подменённому `seller_id`; запрещать IDOR. Все mutating POST — idempotency, ограничение частоты и optimistic version. Гостевой контакт с OTP даёт scoped доступ к своей заявке, но не к другим данным клиента. Платформа не должна сохранять текст звонков или WhatsApp без отдельной, правомерной функции.

**OpenAPI в `contracts/openapi.yaml` остаётся частичным draft:** до генерации SDK дополнить указанные endpoints, схемы и ошибочные случаи, убрать старые enum/маршруты `Quote` или переговорных стадий.

## API v0.7 — настройка отмены, надёжность и уведомления
[ADR-0004](https://github.com/nurgeldiserikbay/services/blob/main/docs/adr/0004-cancellation-reliability-and-defaults.md) — нормативная схема.

| Метод (проектный контракт) | Актор | Вход и результат |
| --- | --- | --- |
| GET /v1/service-offers/:id/cancellation-policy | Гость | Public `free_cancel_before_minutes`, локализованная политика, если есть слот |
| PUT /v1/service-offers/:id/cancellation-policy | Продавец/оператор в scope | `minutes` 0..10080, optimistic version, новый revision лишь для будущих принятий |
| GET /v1/requests/:id/cancellation-preview | Автор заявки / seller / verified guest | `can_cancel`, `will_affect_reliability`, deadline, timezone, reason без чужих данных |
| POST /v1/requests/:id/cancel | Клиент/продавец/guest capability | `reason_code?`, `Idempotency-Key`, `If-Match`; server snapshot + cancellation record + outbox×2 + possible reliability event |
| GET /v1/me/reliability | Авторизованный клиент | Его собственная надёжность, размер выборки, формула, изменения, апелляции |
| GET /v1/sellers/:kind/:id/reliability | Гость/разрешённая сторона | Только публикабельный агрегат продавца, «недостаточно данных», без персональных деталей |
| POST /v1/reliability-events/:id/appeal | Владелец затронутого customer/provider | Причина/минимальные доказательства, без чувствительных текстов в открытом доступе |
| GET /v1/me/notifications | Авторизованный участник | Личные событийные уведомления и статус канала; guest видит только своё по capability |

`CancellationPreview`: `request_id`, `current_status`, `scheduled_start_at?`, `free_cancel_until?`, `policy_revision`, `warning_kind` (none/late_customer/provider_cancel), `reliability_may_change`, `timezone`. Preview не источник истины: POST пересчитывает eligibility по snapshot и актуальному серверному времени.

`CancellationResult`: `request_id`, `status`, `cancelled_at`, `actor_kind`, `reliability_event_state` (none/proposed/effective), `notification_state` (queued), `version`. **Не обещать доставку** в том же ответе: outbox → retries → notification delivery status.

`ReliabilitySummary` содержит `subject_kind`, `period_days=180`, `formula_version`, `score?`, `sample_size`, `has_enough_data`, `negative_event_count`, `updated_at`. Разные контексты seller/consumer используют собственные scopes. Автоматическая блокировка и изменение сервисных звёзд отсутствуют.

**Требуется перед генерацией SDK:** привести draft `contracts/openapi.yaml` к единому `ServiceRequest` (вместо наследственного названия Booking), добавить полные DTO и коды 401/403/409/422/429, conditional requests/OTP cases, контрактные negative tests, валидацию OpenAPI 3.1. Пока это спецификация, не production API.

## Актуальный контракт v0.8 — карта маршрутов для backend/frontend
Единый проектный [OpenAPI 3.1](https://github.com/nurgeldiserikbay/services/blob/main/contracts/openapi.yaml) расширен до публичной таксономии/географии, создания предложений, корпоративных представлений мастера, личных/гостевых заявок, принятия/отмены, добровольного календаря, уведомлений, закладок и надёжности. [API MVP matrix](https://github.com/nurgeldiserikbay/services/blob/main/contracts/api-mvp-matrix.md) содержит **покрытие, недостающие операции, права, HTTP-ошибки и критерии готовности**.

Все публичные операции не должны требовать учётной записи; private requests/OTP/notification/reliability history — `no-store`. Создание заявки определяет seller на сервере по ServiceOffer и соответствующему личному/корпоративному контексту. Продавец ставит deadline отмены для offer, сохраняется snapshot, две NotificationIntent на каждую отмену, reliability отдельно от review stars. Старый маршрут `/bookings` и имя `LegacyBooking` в OpenAPI помечены для устранения перед генерацией SDK: текущая единая сущность — `ServiceRequest`.

**Статус:** Prisma и бандлинг OpenAPI проверяются в [GitHub Actions Validate technical contracts](https://github.com/nurgeldiserikbay/services/actions/workflows/contracts.yml); формальное разрешение ссылок — **не** полноценная проверка API/authorization/совместимости. Не считать contracts ready до заполнения missing endpoints/DTO/ошибок и typed generated client tests. В актуальную реализацию не вводить Quote/торги/принудительную цену.

## API v0.9 — единое именование requests и passwordless auth
В `contracts/openapi.yaml` обновлён набор для `/auth/challenges`, `verify`, `refresh`, `logout`, `logout-all`, `sessions`: явный `sign_up|sign_in`, web cookie или mobile bearer/refresh, срок действия, отказ от выдачи сведений о наличии аккаунта. Guest API теперь назван `/guest-requests/challenges`, `/guest-requests`; отдельная `guestCapability` security scheme для только своей заявки. Старый `/bookings` удалён как дубликат; единая модель — `ServiceRequest`.

**Security contract:** browser `webSession` (HttpOnly cookie + CSRF/Origin server controls), native `sessionAuth` bearer, guest `guestCapability` per request; никаких универсальных пустых `security: {}` на приватных GET/cancel. Изменения должны оставаться в typed clients и тестах, не копировать предполагаемую permission-модель из UI.

После Redocly bundle выполняется [семантическая проверка](https://github.com/nurgeldiserikbay/services/blob/main/scripts/check-api-contract.mjs): уникальные operationId, соответствие path-параметров, наличие критичных routes, разделение guest/session/public. Настоящие contract/E2E тесты с реальными HTTP ответами и ошибками всё ещё обязательны.

## Технический контракт v0.9 — семантическая валидация
В [OpenAPI](https://github.com/nurgeldiserikbay/services/blob/main/contracts/openapi.yaml) теперь отдельно моделируются `/auth/challenges` и `/guest-requests`, три механизма доступа (`webSession`, `sessionAuth`, `guestCapability`), единый ресурс `/requests`. Старый `/bookings` удалён; **не** создавать отдельный Booking module/таблицу только ради старого названия. [Скрипт проверок](https://github.com/nurgeldiserikbay/services/blob/main/scripts/check-api-contract.mjs) проверяет уникальные operationId, обязательные path params и критичные границы публичного, аккаунтного и гостевого доступа на собранном JSON.

**Важный раздел:** договорённость по телефону не становится автоматически принятой заявкой Services; право `guest:request:{id}:read|cancel` выдаётся отдельно от права `guest:create_request`. Server никогда не доверяет получателю или исполнителю из публичного ввода без проверки Offer/Assignment. Полные 401/403/409/422/429, уведомления и guest renewal ещё требуют backend contract tests.
