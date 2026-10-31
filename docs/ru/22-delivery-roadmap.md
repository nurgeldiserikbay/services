# 22. План разработки: эпики, зависимости, релизы и DoD
> План v0.2. Оценки в неделях не фиксируются до оценки трудоёмкости; указаны зависимости и критерии выхода. Все изменения должны отражаться в сервисной документации.

## Четыре репозитория
| Репозиторий | Базовый стек / ответственность | Границы |
| --- | --- | --- |
| services | Markdown как source of truth, HTML-генерация, OpenAPI, ADR, acceptance | Нет runtime бизнес-логики |
| services-back | NestJS, Prisma, PostgreSQL, REST, workers | Не владеет клиентскими UI |
| services-admin | Next.js, internal administration, generated API client | Не прямой доступ к БД |
| services-front | pnpm workspace, Next.js web/PWA, React+Vite+Capacitor mobile, shared UI | Нет самостоятельных доменных правил |

## Фаза 0 — спецификация и разметка задач
- [x] Основное продуктовое направление, профиль/организация/отзывы — определены.
- [x] Структура документов и HTML — создана.
- [ ] Утвердить 10 открытых решений из раздела 12; юридические вопросы выделить отдельно.
- [ ] Закрепить канонический справочник MVP профессий и схемы конкретных услуг.
- [ ] Преобразовать API design в валидный OpenAPI 3.1 и согласовать error schemas.
**Выход:** все P0 требования имеют сценарий, владельца модуля и тестовый критерий, нет несогласованных отношений между сущностями.

## Фаза 1 — workspace foundation / параллельные работы
**Backend:** NestJS skeleton, Config, Auth, Prisma migrations, audit/outbox, CI, tests.
**Frontend:** Next.js+PWA, mobile Capacitor skeleton, shared UI/i18n, typed client, auth adapter, CI.
**Admin:** Next.js skeleton, privileged auth, roles, shell, basic moderation placeholders.
**Docs:** ADR по полиморфным ссылкам, режимам авторизации, upload, data residency.
**Выход:** приложения стартуют локально, есть staging, healthcheck, CI и smoke; нет fake «готовых» страниц.

## Фаза 2 — идентичности и профессиональные профили
**Backend:** User/Person, canonical professions, uniqueness, profile lifecycle, revisions, publish APIs.
**Frontend:** onboarding, 1-profile-per-profession, builder MVP, versions, account workspace.
**Admin:** справочник профессий, жалобы на профили и просмотр статуса.
**Выход:** создание/архив/восстановление/дубли с race tests; публичные и приватные режимы корректны; kk/ru.

## Фаза 3 — компании и конкретные услуги
**Backend:** Organization, Location, roles, Affiliation, ServiceOffer, ServiceAssignment with consent.
**Frontend:** организация, филиалы, команда, приглашения, список услуг и отображение текущего места работы.
**Admin:** спорные связи, проверка организаций, аудит.
**Выход:** одна профессия работает в двух компаниях без передачи собственности, назначения точны по услуге, прошлые связи не теряются.

## Фаза 4 — поиск, заявки, отзывы
**Backend:** Search, Booking transitions, Experience, Review target integrity, Follow, Notifications.
**Frontend:** каталог, карточки, заявка, история, два отзыва, подписки.
**Admin:** очередь жалоб, ревью отзывов, апелляции.
**Выход:** полный сквозной happy path, error/denied/race variants, реальный мобильный smoke.

## Фаза 5 — безопасность, запуск пилота
Data protection review, consent, audit, backup/restore drill, on-device Android/iOS, accessibility, load tests, abuse, anti-spam, app-store policies, SEO, observability.
**Выход:** staging sign-off, контроль незавершённых заявок и жалоб, эксплуатационный ответственный, rollback rehearsal, публикация пилота.

## Фаза 6 — retention/монетизация (после пилота)
Календарь, промокоды, loyalty, расширенные уведомления, Pro/Business, платное продвижение, аналитика — только по метрикам спроса и отдельным ADR/контрактам.

## Параллельные потоки
- Track A backend identity/profile → org/offers → booking/reviews.
- Track B front foundations → profile/builder → search/booking.
- Track C admin shell → verification/taxonomy → review moderation.
- Track D docs/contracts/QA → contract gate, acceptance, regression.
**Интеграция:** сначала docs + OpenAPI, затем backend contract tests, затем generated front/admin clients. Каждая команда имеет ownership и короткие PR.

## Definition of Ready
Задача имеет ID, сценарий, API/DTO, правила доступа, состояния, локализацию, UX, зависимость и тест приёмки. Если это не определено — не начинать изобретать правила в коде.

## Definition of Done
Код, миграция, unit/integration/e2e, security/ACL, API contract, UI empty/error/offline, kk/ru, accessibility, CI green, review, staging smoke, обновлены MD+HTML, release note. «Нарисовали UI» или «смержили PR» без теста ≠ готовая функция.

## Блокеры
Юридический продавец услуги, идентификация, точная политика удаления и отзывов, hosting KZ, первый город/вертикаль, provider уведомлений, Apple dev/signing, moderation staffing. Не маскировать решения фиктивными значениями.
