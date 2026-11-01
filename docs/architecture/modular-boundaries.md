# Services · границы модульного монолита, масштабирование и безопасность v0.8
**Status:** архитектурное проектное решение для реализации, не deployed system. Компоненты: Next.js SSR/PWA Web; React/Vite+Capacitor Mobile; отдельный Next.js Admin; NestJS modular monolith + PostgreSQL; media storage/CDN; transaction outbox/worker. Продуктовый источник: [глава 01](../ru/01-product.md), [ADR-0002](../adr/0002-global-local-discovery.md), [ADR-0003](../adr/0003-simple-booking-company-view.md), [ADR-0004](../adr/0004-cancellation-reliability-and-defaults.md).

## Принцип одного сайта, но не одной тяжёлой системы
Универсальность достигается общим **core Offer, Role, Location, ServiceRequest, Profile**, а не единым UI для всех профессий. На публичном поиске загружать только поиск и минимальные карточки. Конструктор страниц, календари, медиа-редактор, графики, организация и админка — отдельные lazy chunks/routes; не отдавать приватную GraphQL-модель на публичные страницы. Международный справочник не означает передачу на клиент всех городов мира; поиск справочника серверный, с курсором и кэшем.

## Server-domain modules и владельцы таблиц
| Module | Пишет / владеет | Публикует domain events | Не должен делать |
| --- | --- | --- | --- |
| Identity | User, Person, Session, GuestContact/OTP | user.created, guest.verified | Не присваивать бизнес-профили по совпадению телефона |
| Geography | Country, Area, City, service coverage | geo.updated | Не перезаписывать явный выбор пользователя по IP |
| Taxonomy | Profession, Definition, aliases | taxonomy.changed | Не создавать дубликаты ProfessionalProfile из специализации |
| Professional | ProfessionalProfile, personal page revisions | profile.published, profile.archived | Не присваивать компанию или её заявки |
| Organization | Organization, Location, Member, Affiliation, CompanyProfessionalView | affiliation.accepted/ended, view.changed | Не менять оригинальные данные мастера |
| Offer | ServiceOffer, Assignment, ContactMethods, CancellationPolicy | offer.published, policy.changed | Не менять seller задним числом |
| Availability | Allocation, BusyBlock | allocation.approved, busy.changed | Не раскрывать чужую занятость |
| Request | ServiceRequest, RequestEvent, CancellationSnapshot, CancellationEvent | request.created/accepted/cancelled/completed | Не реализовывать Quote/платёжные переговоры |
| Reliability | ReliabilityEvent, aggregates, appeals | reliability.changed | Не менять звёзды качества и не блокировать пользователей без проверки |
| Experience/Review | ServiceExperience, Review, aggregates | review.published/removed | Не объявлять completed автоматически verified |
| Notification | NotificationIntent, NotificationDelivery | delivery.sent/failed | Не делать send SMS внутри request transaction |
| Engagement | SavedItem, Follow, privacy-safe metrics | saved.changed, metrics.updated | Не показывать бизнесу список чужих закладок |
| Moderation/Admin | Cases, Verification, country/category flags, audit | case.resolved, restriction.changed | Не обходить domain ACL прямой записью в БД |

**Зависимости:** HTTP controllers → application use cases → domain policies → repository interfaces; adapters (Prisma/notifications/media) реализуют интерфейсы. Один модуль — владелец write model. Другим модулям — explicit query APIs/domain events, не произвольные JOIN через слои. Не превращать в распределённые микросервисы, пока нет доказанной потребности.

## Транзакционные границы
- **Create request:** resolve published offer + seller/context + guest/customer identity; enforce owner ACL/anti-spam; idempotency key; insert `ServiceRequest` PENDING; outbox notification to seller. No payment/Quote.
- **Accept request:** check seller/organization role & active assignment, version/state, known work allocation+busy blocks; insert reservation atomically if date exists; snapshot policy only if concrete agreed time; outbox notifications. Never trust `seller_id` from request body.
- **Cancel request:** CAS state/version; check requester/seller guest capability; calculate deadline eligibility from immutable snapshot; insert CancellationEvent (unique); release BusyBlock; insert **exactly two logical** NotificationIntent (initiator/counterparty) and optional ReliabilityEvent; commit. Notification delivery asynchronous, idempotent and observable.
- **Affiliation end:** revoke company view and assignments, maintain history and own professional profile/reviews; invalidate SSR/cache with version key. No silent transfer of pending/accepted seller orders.
- **Review publish:** require authorized author and ServiceExperience evidence, dedupe per experience+target, moderation; aggregate asynchronously; never mix reliability with quality.
- **Company view publish:** verify current mutually approved affiliation and master allowlist ∩ company selection ∩ platform policy. Content never copied into second professional identity.

## Read models, search and performance budgets
Public profiles/offers are high-read, low-write: SSR/CDN cache by stable `locale/country/city/slug/revision`; purge on publish/archive/moderation or permission revocation. Private request/OTP/notification/analytics/preview: always `private, no-store`. CDN never caches responses tied to Authorization/Cookie accidentally.

Start with PostgreSQL B-tree indexes for `published + city + definition`, (offerId+scheduledAt), (sellerId+status+createdAt), unique profile ownership, partial active memberships. GiST prevents overlapping known professional busy blocks. Use EXPLAIN ANALYZE and cursor pagination, bound `page_size`; never join all review rows on each search result—materialize counter/summary asynchronously.

Suggested initial, **not guaranteed** performance targets: Web Vitals LCP p75 under 2.5 s on representative mobile network; public search p95 server processing under 500 ms at tested pilot load; 95th percentile write latency measured separately. Keep request bodies, profile media and response sizes bounded. Track server CPU, DB p95 queries/locks, worker lag, cache hit-rate, error/rate-limit outcomes, search zero-result ratio. Use SLOs only after gathering real traffic.

Scaling order: optimize query and indexes → move media through CDN/resize → stateless web/API horizontal replicas + connection pools → background queue/Redis if needed → dedicated full-text/geosearch engine if justified → regional isolation per data/residency law. **Never distribute sensitive data cross-border for speed without legal approval.**

## Security boundaries
- Auth web/mobile/admin have separate token transport policies. Session hash at rest, rotation/revocation, CSRF for cookie flows, MFA for business claims/high-risk/admin. Profile owner not equal company operator by affiliation.
- Server resource-level ACL/IDOR tests; optional delegated company actions require explicit scope and revocation on employment exit.
- No mass scraping of personal contacts: only opt-in public contacts, rate limits, spam detection, abuse reporting; guest OTP codes hashed, few tries, short TTL; guest capability only on one request and no unsafe URL.
- Renderer permits only versioned typed blocks, sanitized text and validated media. Upload MIME/magic bytes, size and anti-malware. Block arbitrary JS/HTML, untrusted iframe and SSRF URL fetches.
- Audit immutable actions: seller changes, affiliation, view permissions, offer publication, cancellations, reliability reversals, moderator decisions. Sensitive messages, OTP, IP/GPS, personal availability details not sent to analytics.
- Feature flags by country/category only after legal review of licences, privacy, consumer-protection, marketing and data-residency/backup flows.

## Recovery and reliability
Outbox records committed with write transaction; worker pulls with bounded retries/backoff and dedupeKey; failed notification does **not** reverse accepted/cancelled request. Retry queue, failure visibility and incident runbook required. Idempotency keys scoped to actor/action plus request body fingerprint; stale `If-Match` returns 409. Backups must include restore drills, key rotation and tested tenant/privacy boundaries.

## What is missing before implementation-ready
The reference [Prisma model](../../contracts/prisma/schema.prisma) and [SQL safeguard draft](../../contracts/prisma/constraints.sql) require real migration tests. The [OpenAPI](../../contracts/openapi.yaml) still needs completion of auth endpoints, errors and guest aliases documented in [API matrix](../../contracts/api-mvp-matrix.md). The [UX screen spec](../ux/mvp-screen-contracts.md) needs visual mockups and kk/ru text review. Laws of actual launch countries and regulated categories require external verification. Passing CI syntax checks is not proof of production readiness.
