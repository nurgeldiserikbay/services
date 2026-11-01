# 23. Тест-план, безопасность, CI/CD и эксплуатация
> Quality strategy v0.2 · Пилот и production gates.

## Пирамида тестов
| Уровень | Примеры | Репозиторий |
| --- | --- | --- |
| Unit domain | Uniqueness policy, lifecycle state machine, review target, affiliation consent | back |
| DB integration | Unique/foreign keys, concurrent requests, transaction rollback, outbox | back |
| API contract | OpenAPI validation, DTO, pagination, error codes, backwards compatibility | back + docs |
| RBAC / security | IDOR, cross-tenant, member revocation, admin privilege escalation | back/admin |
| UI component | Inputs, builder, profile cards, keyboard, aria, localization | front/admin |
| E2E web | Register→profession→invite→offer→booking→review→move employer | front + back |
| Mobile smoke | Android/iOS login, deep links, files, push, offline/retry, app resume | front |
| Ops | DB restore drill, migration rollback, alarms, backup schedule | back/infra |

## Приоритетные тест-кейсы с ID
T-01: два параллельных создания одинаковой профессии → 1 профиль.
T-02: восстановление архивной профессии не создаёт второй.
T-03: компания видит личный профиль сотрудника, но не может менять его биографию.
T-04: accepted affiliation без service assignment не отображает право исполнять все услуги.
T-05: завершение affiliation блокирует новые назначения и создаёт план обработки будущих bookings.
T-06: два отзыва после одного experience адресуются разным целям.
T-07: мастер уходит — его рейтинг и followers остаются.
T-08: администрация не может напрямую редактировать rating.
T-09: два POST booking с одним Idempotency-Key → одна заявка.
T-10: draft revision не изменяет публичный контент до publish.
T-11: запрос private/other org returns 403/404.
T-12: запрет privilege escalation через organization membership.
T-13: отказ push/SMTP не откатывает корректную транзакцию booking, outbox retry.
T-14: скрытая страница не индексируется, нередактируемые отзывы не маскируются user blocks.
T-15: корректные KZ/RU формы, доступность и мобильная клавиатура.
T-16: удаление аккаунта учитывает retention и активные заявки.

## CI
On pull request: lint/typecheck, unit, integration (ephemeral Postgres), contract checker, security/dependency audit, build, accessibility smoke. On main: staged deployment migrations and smoke. Protect branches from bypass, keep main deployable.

## Производительность
Pilot target (hypothesis, не гарантия): server p95 common API <500ms при тестовой нагрузке; catalog page LCP under practical mobile budget; small bundle and optimized images. Measurements: actual devices and RUM, not synthetic only. Установить SLO после профилирования.

## Monitoring
Structured JSON logs with correlation_id; request/error/latency; DB pool; outbox age and dead-letter; booking funnel; complaint queue; error tracking without PII. Incident runbook: severity, on-call, rollback, user notification, postmortem. Failed notification != failed booking.

## Мобильная матрица
Android recent OS + слабое реальное устройство; iOS supported baseline plus actual device. Cold/warm deep-links, keyboard/safe-area, permission denial, slow network, background/resume, multiple locales, installed PWA update, native upgrade, logout/session expiry. iOS signing only macOS/Xcode.

## Безопасность и эксплуатация
Secrets store; migration approvals; DB backups and tested restores; WAF/rate limits; HTTPS; upload scanning; incident response; privacy/legal review; least privilege; user data retention matrix. Данные пользователей Казахстана — data residency review до выхода в production.

## Релизные ворота
R0 docs/contracts verified; R1 identity+security; R2 organization+offers; R3 booking/reviews; R4 real pilot with monitoring; R5 public launch and store builds. Ни один R не достигнут только созданием Markdown; требуется evidence, ссылки на CI и QA артефакты.

## Performance & resilience: один глобальный каталог без единой тяжёлой страницы

**Глобальный сервис не равен одному гигантскому запросу или JavaScript bundle.** Сегментировать чтение по geo/category/query, а операции заказов — отдельный защищённый контур. Начать с NestJS modular monolith + PostgreSQL, Next SSR/PWA, отдельной Admin и worker. Микросервисы, кластер поиска и многорегиональные данные не создавать заранее без профилирования.

### Рекомендуемые бюджеты как гипотезы, не гарантии
| Сценарий | Метрика и проверка |
| --- | --- |
| Публичная главная/профиль | LCP mobile p75 ≤2.5s на тестовой сети; реально мерить RUM и Web Vitals |
| Публичная выдача | Бюджет latency server p95 ≤500ms при согласованном pilot load; проверять холодный и тёплый кеш |
| Отправка заявки | API p95 и rate-limits в реальной транзакции; повторные запросы не создают дубликаты |
| Search масштабирование | План EXPLAIN ANALYZE по индексу city/category/status, курсорная пагинация и ограниченный page size |
| Mobile/PWA | Lazy-loading кабинетов и конструктора; offline fallback без хранения приватной заявки в общедоступном кеше |
| Нагрузка | Проверить 100/1 000/10 000 опубликованных услуг, 100 одновременных запросов как сценарии испытаний, а не прогноз трафика |

### Стратегия кеширования
- Static JS/CSS/images: CDN, hashed immutable assets; lazy images, thumbnails и responsive sizes.
- SSR page/public DTO: небольшой cache TTL по locale, country/city, category, visibility и версии профиля; invalidation после publish/archive/moderation. Не кешировать данные из `Authorization` context в общем кеше.
- Privileged API, OTP, заявки, контакты клиентов, аудит, настройки личного кабинета: `private, no-store`; response не должен попадать в публичные CDN, Service Worker или analytics.
- Rating aggregates и количество выполненных услуг пересчитывать worker-ом/инкрементально, не JOIN на каждую карточку.
- Никакой принудительной загрузки календаря, медиагалереи, карты или конструктора на простом поисковом экране.

### Тесты конкурентности и безопасности
- Продавец может **скрыть занятость**, отключить календарь, оставить только контакт или ручную заявку; доступность публичной страницы не зависит от слотов.
- Два одновременных подтверждения одного заказа → один переход; повторный запрос с тем же Idempotency-Key → один ресурс.
- Самостоятельный мастер не меняет цену корпоративного offer; оператор компании не получает контакты независимых клиентов мастера.
- Гость отправляет заявку с OTP, но не может выдать свой отзыв за verified без авторизации и подтверждённого ServiceExperience.
- Проверить 401/403/404/409/422, роль и scope, XSS через page-builder, SSRF во внешних URL/медиа, SQL injection, злонамеренные ссылки, upload, path traversal и rate limiting.
- Тестировать отзыв разрешений после увольнения, права на архив, публикацию по стране/регулируемой категории, а также удаление персональных данных и резервные копии.
- Профилировать поиск по городам и редким категориям отдельно; при росте нагрузки масштабировать stateless API и worker, Postgres pool/индексы, затем обсуждать поисковик.

### Не считать готовым без доказательств
OpenAPI должен пройти настоящий schema validator и contract tests; выполнение скрипта проверки структуры Markdown не валидирует весь YAML. Перед выпуском — CI, реальный браузер и телефон, нагрузочный прогон, пентест/ревью, восстановление из backup, проверка фактических юрисдикционных требований и оповещения/поддержки.
