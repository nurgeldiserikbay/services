# 20. Backend: модули, операции, асинхронность и интеграции
> Архитектура реализации v0.2 · services-back · NestJS / Prisma / PostgreSQL.

## Слои
Controller (HTTP, auth, DTO) → Application use case (orchestration/transaction) → Domain policy (invariants/state machine) → Repository interface → Prisma adapter. Разделять REST payload и внутренние domain objects. Общий модуль Config, Logger, Exception filter, Request Context, AuthGuard, Authorization Policy Engine, Transaction Manager. Нельзя писать бизнес-переходы внутри controller или Prisma middleware.

## Границы модулей
Identity/Auth, People, ProfessionalProfiles, Taxonomy, Organizations, Affiliation, Offers, Assignments, Booking, Experience, Reputation, Social, Media, PageBuilder, Notifications, Verification, Moderation, Billing (P2), Audit/Outbox. Публичные интерфейсы модулей, не прямые импорты внутренних таблиц через весь код.

## Первые use cases в порядке разработки
1. RegisterUser, VerifyContact, CreatePerson, ListWorkspaces.
2. CreateProfessionalProfile (unique DB), SaveProfileDraft (version), PublishProfile, Pause, Hide, Archive, Restore, RequestDeletion.
3. CreateOrganization, CreateLocation, InviteOrganizationMember, AssignScopedRole.
4. InviteAffiliation, AcceptAffiliation, EndAffiliation.
5. CreateServiceOffer, PublishOffer, ProposeAssignment, AcceptAssignment, RevokeAssignment.
6. SearchProfiles/Offers, GetPublicProfessional, GetPublicOrganization.
7. RequestBooking, AcceptBooking, CancelBooking, CompleteBooking, RecordServiceExperience.
8. CreateReview (professional + organization separately), FollowProfile, NotifyFollowers.
9. ReportContent, ModerateCase, AppealDecision.

## Данные и транзакции
PostgreSQL является source of truth. Использовать DB constraints для уникальности и FK, explicit $transaction для состояния+события+аудита. Повторные команды безопасны: actor_id+operation+idempotency_key и response hash; проверять request_hash, чтобы один ключ нельзя было повторно использовать с другим payload. Optimistic concurrency на draft/booking.

## Outbox
В транзакции пишутся доменное изменение, AuditEvent, OutboxEvent. Worker публикует уведомления после commit. Job consumer проверяет event_id; exponential retries, dead-letter/manual replay. Redis/queue не обязателен на старте, если outbox в Postgres достаточно. На уровне HTTP не ждать доставки email/push.

## Работа с медиа
Предварительный authenticated upload intent → signed upload URL (если доступен) → scan/validation → media asset ready → публикация. Публичные и приватные объекты разделены; thumbnails оптимизированы; лимиты и контроль EXIF/PII. При удалении профиля медиа удаляются или открепляются по retention policy.

## Search
На старте PostgreSQL (tsvector, trigram) с индексацией названий kk/ru и нормализацией транслитерации. Три сущности поиска: professional, organization, offer; deduplicate по профилю, разделить типы. Релевантность: текстовое совпадение, сфера, география, доступность, рейтинг доверия — без неявного платного повышения органического ранга. Elasticsearch/OpenSearch только после фактической потребности.

## Интеграции
Adapters для SMS/Email, push (FCM/APNs через mobile), карты/geocoding, analytics, платежи (P2). Timeout, retry policies, rate-limits, безопасное логирование, стоимости API под контролем.

## Env / topology
API как stateless контейнер, PostgreSQL с миграциями, storage bucket, worker. Dev/staging/prod изолированы. Schema migration review, health checks, graceful shutdown, request deadlines, structured JSON logs. Secrets не должны попадать в frontend.

## Acceptance by layer
Unit: profiles one-per-profession; domain transitions; review target. DB integration: uniqueness/races; foreign keys; cross-org isolation. Contract: OpenAPI response/error. Security: auth, IDOR, revoked role, spam, upload. E2E: full user journey. Performance: latency/search under pilot load.
