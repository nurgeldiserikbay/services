# Services — продуктовая и техническая документация

Независимая платформа специалистов, организаций и клиентов: один человек может иметь несколько профессий, но **не более одной профессиональной страницы для одной канонической профессии**. Отзывы специалистов и компаний принадлежат разным профилям, а сотрудничество с компанией не передаёт ей профессиональную репутацию.

## Читать документацию как сайт

- **GitHub Pages:** https://nurgeldiserikbay.github.io/services/.
- **Исходный HTML:** [index.html](index.html) — готовая самостоятельная HTML-страница, работает без сторонних библиотек.
- **Исходные разделы:** [docs/ru/](docs/ru/) — Markdown для редактирования бизнес-логики и архитектуры.

### Публикация

Сайт развёрнут через GitHub Pages из ветки **main / (root)**. Публикация подтверждена успешным Pages deployment от 31 октября 2026. В [Settings → Pages](https://github.com/nurgeldiserikbay/services/settings/pages) источник — **Deploy from a branch**, main, /(root).

После изменения Markdown сначала запусти `node scripts/build-site.mjs`, затем закоммить **и Markdown, и сгенерированный index.html**. GitHub Pages публикует index.html из main. Workflow `Validate documentation HTML` проверяет, что файл сгенерирован из актуальных исходников, и не пытается повторно деплоить сайт. Это исключает конфликт стандартного Pages deployment с собственным workflow.

### Разделы

| № | Раздел |
| --- | --- |
| 01 | [Продукт, роли и границы](docs/ru/01-product.md) |
| 02 | [Профессиональные профили: жизненный цикл](docs/ru/02-identities-lifecycle.md) |
| 03 | [Организации, связи и услуги](docs/ru/03-organizations-services.md) |
| 04 | [Заявки, визиты, отзывы и рекомендации](docs/ru/04-booking-reviews.md) |
| 05 | [Конструктор страниц и отраслевые шаблоны](docs/ru/05-page-builder.md) |
| 06 | [Безопасность, роли и приватность](docs/ru/06-security-legal.md) |
| 07 | [Архитектура Backend API](docs/ru/07-backend-architecture.md) |
| 08 | [Модель данных и API](docs/ru/08-data-api.md) |
| 09 | [Frontend, PWA, Android и iOS](docs/ru/09-frontend-architecture.md) |
| 10 | [Архитектура админ-панели](docs/ru/10-admin-architecture.md) |
| 11 | [Инфраструктура, CI/CD и качество](docs/ru/11-infrastructure-quality.md) |
| 12 | [Roadmap, риски и открытые решения](docs/ru/12-roadmap-decisions.md) |

## Пересборка HTML локально

Требуется Node.js 22+. Без npm install, внешних пакетов или сетевых запросов:

```bash
node scripts/build-site.mjs
```

Команда обновляет [index.html](index.html) из 12 исходных Markdown-документов. Открой `index.html` в браузере. Сайт содержит поиск, оглавление, адаптивный дизайн, тёмную тему и печать / сохранение PDF.

## Четыре репозитория

- [services](https://github.com/nurgeldiserikbay/services) — бизнес-правила и технические контракты.
- [services-back](https://github.com/nurgeldiserikbay/services-back) — Backend API.
- [services-admin](https://github.com/nurgeldiserikbay/services-admin) — внутренняя админ-панель платформы.
- [services-front](https://github.com/nurgeldiserikbay/services-front) — SSR Web/PWA и Capacitor Android/iOS.

## Статус

Документация **v0.1 / project blueprint**: предлагаемая модель и правила, а не утверждение, что функции уже реализованы или юридически проверены. По открытым решениям см. [roadmap](docs/ru/12-roadmap-decisions.md). Изменения бизнес-логики должны сначала отражаться в документации, потом — в API/коде с тестами.
