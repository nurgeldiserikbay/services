# 20. Backend: модули, операции, асинхронность и интеграции
> Архитектура реализации v0.2 · services-back · NestJS / Prisma / PostgreSQL.

## Общая схема технической архитектуры

![Схема Services: Next.js, PWA, Capacitor, Admin, CDN, NestJS API, PostgreSQL, фоновые задания и медиахранилище](../../assets/technical-architecture.svg)

Это схема **одной логической платформы**, а не требование запускать десятки серверов. Начать с одного модульного монолита NestJS, независимых Web/Admin приложений, PostgreSQL, объектного хранилища и фонового обработчика; масштабировать компоненты по метрикам. Для ИИ доступна [редактируемая Mermaid-схема](https://github.com/nurgeldiserikbay/services/blob/main/docs/diagrams/technical-architecture.mmd).

## Масштабирование без ненужных микросервисов
- Весь бизнес-процесс **не должен находиться в одном frontend bundle**: публичная витрина SSR/SEO и кешируемые страницы отделены от авторизованных кабинетов, тяжёлый конструктор грузится лениво; mobile делит фичи и компоненты, но не SSR runtime.
- **CDN** для статических ресурсов/изображений и опубликованных страниц; короткий публичный API cache по явному городу/сервису/языку с корректным invalidation. Приватные данные заявок, контактов клиентов, OTP и админские API — `Cache-Control: private, no-store`.
- **PostgreSQL** остаётся единственным источником истины: индексы по доступности offer, стране/городу/категории, курсорная пагинация, лимиты выдачи, materialized/aggregated read models по измеренной необходимости. Не делать дорогие JOIN и пересчёт репутации на каждом запросе.
- **Outbox + worker** для уведомлений, индексации, пересчёта агрегатов, загрузки медиа и антифрода. Очередь Redis/отдельный поисковик подключать только после профилирования. Ошибка пуша не отменяет подтверждённый заказ.
- **Безопасные транзакции** принятия заявки: idempotency key + optimistic version + row constraints на слоты только для активированного календаря. Нет необходимости хранить миллионы заранее сгенерированных свободных слотов.
- Горизонтальное масштабирование API при фактической нагрузке, соединения Postgres через pool, ограничения клиентских запросов и circuit breakers к сторонним услугам; CDN не может заменять проверку прав.

## Модель самостоятельного продавца и компании
`ServiceOffer.seller` — типизированный владелец предложения: independent_professional_profile_id **или** organization_id; check exactly-one и сильные FK/constraints. `Performer` и `ServiceAssignment` — отдельные объекты. У независимого продавца обработчик — владелец профильной услуги; у компании — явно уполномоченный оператор в рамках scope. Клиентская заявка хранит snapshot продавца, предложения, цены/условий. Нельзя перенести заказ компании в личный кабинет мастера только потому, что он выполнял услугу.

`OfferIntakeSettings`: `methods`, `manual_accept_required`, `availability_visibility`, `booking_mode`, `timezone`, `capacity?` и ограничения конкретного типа услуги. **Показ занятости и календарь добровольны**; отсутствие слотов не означает недоступность заявки или невозможность публикации предложения. `ServiceRequest` — запрос/контакт, `Booking` — подтверждённое соглашение; нужен ADR об их выделении или единой типизированной модели.

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

## Обновление v0.5 — минимальный intake engine и company professional views
Ориентироваться на [ADR-0003](https://github.com/nurgeldiserikbay/services/blob/main/docs/adr/0003-simple-booking-company-view.md). Вместо Quote/ценовых переговоров — сервисные заявки со статусами `pending, accepted, declined, cancelled_by_customer, cancelled_by_provider, completed` (+ optional expired), запись времени по желанию. Прямые WhatsApp/телефон вне Services не записываются как выполненные заказы. Ответственность за обработку определяется `offer.seller` и серверно подтверждённым `source_context`.

`ProfessionalProfile` неизменный источник личности профессии. `CompanyProfessionalView` — тонкая проекция из профиля, согласованной Affiliation и двух наборов настроек отображения (master field allowlist AND organization subset). В отличие от создания дублей здесь не переносится право владения, отзывы, персональные контакты и независимые обращения. Контекстная страница кешируется отдельно, обновления разрешений и отзыв связи инвалидируют её.

Рабочие периоды `AvailabilityAllocation` независимо для личных и корпоративных контекстов, известные `BusyBlock` блокируют конфликтные слоты независимо от внешней видимости. Компания видит за пределами своего scope только «недоступно», не подробности личных записей. При скрытом/неиспользуемом календаре запрос всё равно можно принимать вручную.

`SavedItem` для личного избранного клиента и отдельный ограниченный `AnalyticsSummary`: просмотры, клики контактов, заявки, принятые, выполненные, уникальные **авторизованные** клиенты. Не продавать/экспортировать списки «кто сохранил страницу», не считать клик WhatsApp выполненным заказом. Защита от спама и privacy-by-default во всех событиях.

## Архитектура исполнения отмены v0.7
Модули (NestJS): `Booking/ServiceRequest`, `CancellationPolicy`, `ReliabilityLedger`, `NotificationOutbox`, `ReputationReadModel`, `Disputes`. Не создавать новую инфраструктурную службу только из-за этой функции; соблюдать границы модульного монолита, PostgreSQL transaction и индексирование.

Команда `CancelServiceRequest` проверяет actor, seller и версию → актуальный snapshot дедлайна → атомарно меняет статус, освобождает известный BusyBlock, создаёт CancellationEvent, допустимый негативный ReliabilityEvent и **два NotificationIntent** (обеим сторонам), затем commit. Worker асинхронно уведомляет, делает retry/backoff и агрегирует score. При конфликте cancel/complete или параллельной второй отмене возвращать 409 либо идемпотентный ответ, не удваивать события.

Для агрегатов не пересчитывать весь граф запросов в поисковой выдаче: `ReliabilityAggregate` read-model c периодом, версией формулы и refresh после событий. Кеш только публичных агрегатов; субъект и админ читают персональные детали через private no-store endpoints. Недоставка уведомления отражается в доставке/поддержке, но не откатывает отмену.

## Модульные границы, производительность и безопасность v0.8
Подробная спецификация [Modular Boundaries](https://github.com/nurgeldiserikbay/services/blob/main/docs/architecture/modular-boundaries.md) фиксирует владельца каждой предметной модели: Identity, Geography, Taxonomy, Professional, Organization, Offer, Availability, ServiceRequest, Reliability, Experience/Reviews, Notifications, Engagement, Moderation. Она определяет транзакции создания/принятия/отмены заявки, публикации company view, отзывов и завершения Affiliation.

**Критично:** одна глобальная платформа не означает один JS-бандл и единый горячий SQL-запрос. SSR/CDN — для опубликованных страниц, `no-store` — для личных заявок, OTP, рейтинговых событий и контактов гостей. Индексы/пагинация, серверный geo/taxonomy lookup, раздельные lazy components и worker/outbox до масштабирования микросервисами. Публичная витрина не загружает редактор или календарь, пока пользователь не попросил их.

## Outbox, guest scopes, продавец и исполнитель v0.9
Уведомления больше не требуют выдуманного CancellationEvent для каждого события: `DomainOutboxEvent` хранит запись события после успешной доменной транзакции, `NotificationIntent.domain_event_id` — назначенных адресатов, `NotificationDelivery` — отдельные попытки email/SMS/in-app. На отмене существует дополнительная связь `cancellation_id` и **ровно два адресата**. Создание/принятие/отклонение используют общий outbox без fake cancellation.

В `ServiceRequest` роли `seller_professional|seller_organization` и `performer_professional_id?` различаются; company offer может быть выполнен мастером, но остаётся заявкой компании. `BusyBlock` имеет `context` и `organization_id?`, подтверждённый слот принадлежит соответствующему контексту; внешние подробности не раскрываются.

Auth: `AccountAuthChallenge` и `GuestCapability` с отдельными scopes и hashed secrets, session token-family rotation, User consent. Никакой guest OTP не создаёт User автоматически. Все SQL/Prisma reference находятся в `contracts/prisma/` и проходят CI с реальной временной PostgreSQL БД; перенос в `services-back` требует полноценного migration/test review.
