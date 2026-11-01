# 22. План разработки Services и критерии готовности
> Delivery Plan v0.6 · Планы, не отчёт о выполненной реализации. Источник продукта: глава 01; реестр решений: глава 12; [ADR-0003](https://github.com/nurgeldiserikbay/services/blob/main/docs/adr/0003-simple-booking-company-view.md).

## Главная стратегия
**До реализации MVP** согласовать сложные границы прав и состояний, но **не** строить избыточный CRM, коммерческие предложения, платёжную инфраструктуру, микросервисы и полный календарь для каждого. Начать с хорошо проверяемого сквозного сценария: гость ищет в своём городе → открывает профессионала/компанию → контакт/заявка → продавец принимает/отклоняет → при желании запись в календарь → отметка выполнения → отзыв по проверяемому опыту → клиент сохраняет страницу.

Глобальная техническая модель изначально, но продуктовый пилот — одна утверждённая география и несколько типовых категорий. Объём операций по странам включается постепенно после правовой проверки.

## Репозитории и границы
| Репозиторий | Ответственность | Нельзя делать |
| --- | --- | --- |
| [services](https://github.com/nurgeldiserikbay/services) | MD/HTML, контрактный OpenAPI, ADR, ER, QA, roadmap, diagrams | Хранить продакшен-код бизнес-операций |
| [services-back](https://github.com/nurgeldiserikbay/services-back) | NestJS, TypeScript, PostgreSQL/Prisma, доменные модели, API/ACL, outbox/worker | Переносить предметные правила в контроллеры/UI |
| [services-front](https://github.com/nurgeldiserikbay/services-front) | Next.js SSR/PWA, React/Vite+Capacitor mobile, common packages, поиск, страницы, кабинеты | Подменять backend-разрешения состоянием frontend |
| [services-admin](https://github.com/nurgeldiserikbay/services-admin) | Отдельный Next.js для проверки компаний, профилей, жалоб, справочников, аудита | Получать доступ напрямую в БД или считать себя владельцем пользовательских профилей |

**Актуальный стек:** модульный монолит NestJS + PostgreSQL/Prisma; Next.js SEO SSR и PWA; мобильные React/Vite/Capacitor, общие UI/feature packages; Next.js Admin; Redis/очереди и отдельный поисковый движок — только по измеренной необходимости. kk/ru приоритетны при запуске, архитектура i18n не привязана к конкретной стране.

## Фаза G0 — продукт и контракты (до основной реализации)
**Пакет обязательных документов и результатов:**
- [ ] Принять или уточнить все OPEN-01..14 в главе 12, не возвращая цену/Quote в workflow.
- [ ] Описать schema вариантов типа услуги: личный специалист, компания, выезд, по адресу, онлайн; необязательные цены/часы.
- [ ] Утвердить поля корпоративной карточки, разрешения с обеих сторон, прекращение связи и соответствующие UX-макеты.
- [ ] Определить пересечения известных календарных записей между компаниями и самостоятельной работой; статусы и исключения.
- [ ] Утвердить метод получения verified reviews, защиту от накрутки и права после выполнения.
- [ ] Утвердить retention гостевых контактов, security model и пределы аналитики зарегистрированных клиентов.
- [ ] Описать уместные юридические/регуляторные ограничения по выбранным странам/категориям.
- [ ] Привести главы 13–18 к единому списку состояний/сущностей и **полностью валидировать OpenAPI 3.1**, а также реальную Prisma schema и миграционную стратегию.
**Выход:** для каждого требования MVP есть владелец, пользовательский сценарий, UX state, ACL, API DTO/error, DB правило и проверка тестом. Неизвестные поля нельзя маскировать фиктивной реализацией.

## Фаза G1 — основы платформы и единая система компонентов
**Backend:** Config/env validation; migrations, Auth/Person, domain modules, ACL, audit+outbox, health endpoints, basic seeded professions/geo.
**Frontend:** pnpm workspace, Next web SSR/PWA, Capacitor mobile shell, shared UI/feature modules, kk/ru, generated API client, auth/guest adapters.
**Admin:** isolated session/RBAC, moderation shell, taxonomy.
**Infrastructure:** dev/staging, CI for lint/types/unit/DB tests, secrets, SSL, backups, crash/error monitoring.
**Выход:** четыре repo собираются с проверенными CI и staging smoke; нет фальшивой «готовности» по одному UI.

## Фаза G2 — публичный каталог и страницы
- Backend: global country/area/city, profession/service taxonomy, public search, professional profiles, organizations/locations, media uploads, company affiliation and assignments, published revisions.
- Frontend: search без входа, локальный город по умолчанию/ручной выбор/online, фильтры, понятная выдача, личная страница специалиста, company page, basic builder with typed blocks.
- CompanyProfessionalView: мастер позволяет конкретные поля компании, компания выбирает подмножество; личная карточка не копируется. SSR SEO, canonical, cache invalidation, noindex приватных.
- Admin: taxonomy editing, moderation/verification basics.
**Выход:** мастер публикует личную страницу, компания публикует страницу и с согласия мастера показывает его в своей команде; URL и выдача доступны гостю, приватные поля не просачиваются.

## Фаза G3 — простой запрос и добровольный календарь
- Public CTA на каждом offer: телефон, WhatsApp, guest request, optional slots; продавец выбирает каналы, цена/календарь необязательны.
- Guest contact verification+rate limits+scoped access, зарегистрированный client flow; seller routing **от страницы** без неявной смены.
- Simple lifecycle pending → accepted/declined → cancelled/completed; idempotency, history, доступ продавца, уведомления.
- Availability allocations personal/company/timezone, per-context busy-only/free slots, ручной busy block, защита известных конфликтующих записей.
**Выход:** клиент без входа подал заявку; мастер/компания по своему контексту приняли или отклонили; календарь можно отключить; компания не видит личную запись мастера.

## Фаза G4 — удержание, доверие и операционная готовность
- Account client saved items/follows/history; верификация ServiceExperience, авторизованные отзывы и раздельные рейтинги, жалобы/апелляции, разумные уведомления.
- Базовые безопасные seller metrics: views, contact clicks, requests, accepted, experiences, unique **registered** requesters (не выдавать их за всех клиентов).
- Moderation and anti-abuse: verified organization/profession claims, content moderation, upload policies, country/category features.
- UX accessibility mobile/desktop, real device QA, performance, load and privacy/security reviews.
**Выход:** сквозные customer/seller/company journeys проверены в реальном браузере и на мобильном устройстве; юридические требования выбранного рынка проверены, включая хранение/backup персональных данных.

## Фаза G5 — ограниченный пилот
Реальные специалисты и компании в выбранном городе/нише; поддержка заявок/споров о контенте, время ответа продавцов, конверсия поиска→контакт→заявка, повторные клиенты, полнота справочника, ручная проверка качества выдачи, отдельный privacy/legal sign-off.
**Выход:** фактическая ценность для потребителей и продавцов подтверждена; проблемные сценарии выявлены до масштабирования.

## Позже — не блокирует начальный запуск
Advanced calendar synchronization, подгрузка нескольких ресурсных календарей, multi-worker jobs, групповые услуги, расширенная аналитика, рекламный кабинет/Pro subscription, loyalty, CRM интеграции, платежи, лицензируемые специфичные workflows. Ничего не обещать как готовое до реализации.

## Параллельная разработка и контроль изменений
- **Contract-first:** бизнес-решение в services → OpenAPI/ER/ADR и тесты → backend → generated client → front/admin → E2E. Изменения не должны разъезжаться между repo.
- Общие файлы изменяются только владельцем модуля или через согласованный PR. Работа в отдельных feature ветках, без self-merge; прямое изменение main возможно лишь после явного распоряжения владельца проекта.
- Раздельные пакеты/модули по domain; не копировать UI-карточки, DTO, состояние форм и правила auth.
- Каждой фиче присваивать ID из главы 13, ссылку на утверждённый ADR, проверяемые acceptance criteria, ownership и evidence (CI run/PR/скрин/проверка устройства).

## Definition of Ready
Требование не противоречит другим, актор и продавец ясны, права backend определены, вход/выход/ошибка/конкурентный запрос описаны, API/schema и UX states утверждены, kk/ru и mobile учтены. Если нет — карточка blocked, а не «ИИ догадается».

## Definition of Done
Код, типы, миграция/обратимость, ACL/IDOR и race tests, HTTP contract, UI loading/error/empty/permission, kk/ru, accessibility, security/privacy, CI green, staging + real mobile check где требуется, обновлены Markdown/HTML, явная ссылка на проверку. Созданный файл или работающий mock не означают готовой функции.

## Приоритетный принцип производительности
Глобальность данных — не один JS-bundle: CDN и оптимизированные изображения для открытых страниц, SSR/PWA для SEO, lazy modules для кабинетов и редактора, public cache только опубликованных данных, private/OTP no-store, PostgreSQL индексы + пагинация, фоновые уведомления, наблюдаемость. Усложнять инфраструктуру только по профилированию и требованиям конкретной страны.

## Готовность v0.7 — отмены и проектные решения закрыты
**Продуктовые решения OPEN-01..14:** базовые defaults приняты [ADR-0004](https://github.com/nurgeldiserikbay/services/blob/main/docs/adr/0004-cancellation-reliability-and-defaults.md), не возвращать их в бесконечное обсуждение. Доработать в фазе G0 тестируемые сценарии и юридические исключения. По-прежнему требуются **TECH-01..08**, реальные валидированные OpenAPI/Prisma, выбранные провайдеры OTP/уведомлений, утверждённые UI-макеты, country launch checks и privacy/retention; проект не объявлять production-ready.

В G3 добавить `CancellationPolicy` per offer, `CancellationSnapshot` на принятой датированной записи, cancel клиента/продавца/гостя, transaction NotificationIntent×2, ReliabilityLedger отдельный для зарегистрированного клиента и конкретного seller, explain/appeal. В G4 — verifiable experience и антифрод. MVP **не** содержит денежных штрафов, автоматических блокировок по рейтингу, торгов/Quote и обязательной цены.

Порядок контрактных задач: (1) API/DB политика, (2) простой UI срока/предупреждения/истории/апелляции, (3) backend транзакции и outbox, (4) frontend/admin с типизированным клиентом, (5) CI test matrix и проверка двух каналов уведомления на staging, (6) юридическое одобрение перед запуском конкретной юрисдикции.

## Отчёт о технической подготовке v0.8 (документы ≠ реализация)
В `services` добавлены [Prisma reference](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/schema.prisma), [SQL safeguards](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/constraints.sql), [DB test matrix](https://github.com/nurgeldiserikbay/services/blob/main/contracts/prisma/test-cases.md), [expanded OpenAPI](https://github.com/nurgeldiserikbay/services/blob/main/contracts/openapi.yaml), [API coverage](https://github.com/nurgeldiserikbay/services/blob/main/contracts/api-mvp-matrix.md) и [UX 16 screens](https://github.com/nurgeldiserikbay/services/blob/main/docs/ux/mvp-screen-contracts.md).

**G0 evidence:** Prisma CLI `validate` и OpenAPI Redocly bundle выполняются в CI, проверяя синтаксис/ссылки. **Ещё обязательны:** запуск реальных migrations и SQL triggers на PostgreSQL в `services-back`, 34 race/privacy теста, окончание всех DTO/ошибок/состояний OpenAPI, реальная авторизация+guest scope, визуальные UX-прототипы, проверка законов/host/data flows выбранного пилота. Не переносить референсный schema в production без review; не объявлять TECH-01..08 завершёнными только на основании этих файлов.
