# Services — документация глобальной платформы услуг

**Продукт:** глобальный открытый маркетплейс услуг с локальной выдачей по выбранному или приблизительно определённому городу; поиск и публичные профили доступны без регистрации. Профессионалы и компании публикуют и продвигают свои услуги. Один человек может вести несколько профессий, но только **одну профессиональную страницу на каждую каноническую профессию**. Профессиональная репутация сохраняется при смене места работы; компания получает только собственные отзывы.

## Читать документацию

- **HTML-сайт:** https://nurgeldiserikbay.github.io/services/
- **Готовый статический файл:** [index.html](index.html)
- **Редактируемые Markdown-главы:** [docs/ru](docs/ru)
- **Начальный машинный контракт API (draft):** [contracts/openapi.yaml](contracts/openapi.yaml)
- **Архитектурные решения:** [ADR-0001 — границы приложений](docs/adr/0001-runtime-boundaries.md), [ADR-0002 — глобальный поиск с локальной выдачей](docs/adr/0002-global-local-discovery.md), [ADR-0003 — простые заявки и два контекста мастера](docs/adr/0003-simple-booking-company-view.md), [ADR-0004 — отмены и надёжность обеих сторон](docs/adr/0004-cancellation-reliability-and-defaults.md)
- **Правила ИИ:** [AGENTS.md](AGENTS.md), [глава 25](docs/ru/25-ai-development.md)
- **Продуктовая концепция v0.6:** [глава 01 — полная картина](docs/ru/01-product.md)
- **Утверждённые и открытые решения:** [глава 12](docs/ru/12-roadmap-decisions.md)
- **План разработки:** [глава 22](docs/ru/22-delivery-roadmap.md)
- **Критерии готовности:** [глава 26](docs/ru/26-acceptance-checklist.md)

Markdown — источник смысла и требований; HTML генерируется из тех же файлов автоматически при локальной сборке. HTML не редактировать вручную.

**География:** выбор страны, региона и города без регистрации; ручной выбор имеет приоритет над IP и языком, GPS — только с отдельного разрешения; можно искать по миру или онлайн. Начальный пилот в одном городе не ограничивает глобальную архитектуру.

**Быстрое резюме:** Services — открытый глобальный каталог услуг с локальным поиском по умолчанию, где посетитель без регистрации ищет и связывается с исполнителем. Специалист и компания развивают собственные страницы; регистрация клиента нужна для избранного, истории и отзывов. **Отмена:** продавец сам задаёт срок бесплатной отмены для каждого offer. После срока у авторизованного клиента снижается **надёжность**, при отмене принятого заказа продавцом — надёжность мастера или компании. При любой отмене **уведомляются обе стороны**; звёзды за качество услуги не меняются. Исключения/апелляции/уведомления описаны в ADR-0004.

**Актуальная модель заказов:** личная страница специалиста направляет заявку самому специалисту, страница компании (и мастер внутри неё) — компании. Продавец сам выбирает телефон/WhatsApp/простую заявку/необязательный календарь. Подтверждение заявки — «принять» или «отклонить», без смет, торгов и контроля стоимости. Мастер и компания настраивают корпоративное представление его профиля с двух сторон; рабочие часы могут быть распределены между компанией и личной практикой. Аккаунт клиента нужен для личного избранного, истории и более надёжной статистики зарегистрированных клиентов, не для поиска.

## Схемы для понимания платформы

| Человеку (SVG, встроены в HTML) | ИИ/разработчику (Mermaid) |
| --- | --- |
| [Общая бизнес-схема](assets/platform-overview.svg) | [Редактируемая схема платформы](docs/diagrams/platform-overview.mmd) |
| [Процесс обращения и заказа](assets/order-lifecycle.svg) | [Редактируемая схема заказа](docs/diagrams/order-lifecycle.mmd) |
| [Отмена и надёжность обеих сторон](assets/cancellation-reliability.svg) | [Редактируемая схема отмен](docs/diagrams/cancellation-reliability.mmd) |
| [Техническая архитектура](assets/technical-architecture.svg) | [Редактируемая схема архитектуры](docs/diagrams/technical-architecture.mmd) |

Все схемы пояснены в [docs/diagrams/README.md](docs/diagrams/README.md). На HTML-сайте они встроены в главы 01, 04 и 20: можно читать прямо на странице или открыть рисунок крупно. Источник бизнес-правил — Markdown-спецификация; SVG — наглядное дополнение.

## Содержание

| № | Раздел |
| --- | --- |
| 01 | [Продукт, роли, границы](docs/ru/01-product.md) |
| 02 | [Профили и жизненный цикл](docs/ru/02-identities-lifecycle.md) |
| 03 | [Организации, связи, услуги](docs/ru/03-organizations-services.md) |
| 04 | [Заявки и независимые отзывы](docs/ru/04-booking-reviews.md) |
| 05 | [Конструктор страниц](docs/ru/05-page-builder.md) |
| 06 | [Безопасность и приватность](docs/ru/06-security-legal.md) |
| 07 | [Архитектура Backend](docs/ru/07-backend-architecture.md) |
| 08 | [Данные и REST API](docs/ru/08-data-api.md) |
| 09 | [Frontend, PWA, Capacitor](docs/ru/09-frontend-architecture.md) |
| 10 | [Архитектура Admin](docs/ru/10-admin-architecture.md) |
| 11 | [CI/CD и качество](docs/ru/11-infrastructure-quality.md) |
| 12 | [Риски и открытые решения](docs/ru/12-roadmap-decisions.md) |
| 13 | [Полный каталог функциональности](docs/ru/13-functional-catalog.md) |
| 14 | [Маршруты, экраны, сценарии](docs/ru/14-user-journeys-screens.md) |
| 15 | [Матрица прав доступа](docs/ru/15-permissions-matrix.md) |
| 16 | [Состояния и конфликтные сценарии](docs/ru/16-state-machines.md) |
| 17 | [PostgreSQL и Prisma-модель](docs/ru/17-database-design.md) |
| 18 | [REST/OpenAPI контракты](docs/ru/18-api-design.md) |
| 19 | [Frontend и дизайн-система](docs/ru/19-frontend-design-system.md) |
| 20 | [Модули и реализация Backend](docs/ru/20-backend-implementation.md) |
| 21 | [Рабочие процессы Admin](docs/ru/21-admin-operations.md) |
| 22 | [Поэтапный план разработки](docs/ru/22-delivery-roadmap.md) |
| 23 | [Тесты, безопасность, релизы](docs/ru/23-quality-tests-release.md) |
| 24 | [Бизнес-модель и рост](docs/ru/24-business-monetization.md) |
| 25 | [Правила для ИИ-разработчиков](docs/ru/25-ai-development.md) |
| 26 | [Проверки приёмки MVP](docs/ru/26-acceptance-checklist.md) |

## Технологии и репозитории

| Репозиторий | Ответственность | Стек |
| --- | --- | --- |
| [services](https://github.com/nurgeldiserikbay/services) | Требования, Markdown/HTML, OpenAPI, ADR | Markdown + Node генератор |
| [services-back](https://github.com/nurgeldiserikbay/services-back) | Бизнес-логика, данные, API, фоновые операции | NestJS, TypeScript, PostgreSQL, Prisma |
| [services-admin](https://github.com/nurgeldiserikbay/services-admin) | Внутренняя модерация платформы | Next.js, TypeScript |
| [services-front](https://github.com/nurgeldiserikbay/services-front) | Публичный SSR-сайт, PWA, Android/iOS | Next.js + React/Vite + Capacitor; pnpm workspaces |

Redis/outbox, PostGIS, search, payment providers добавляются по необходимости и отдельным решениям, а не автоматически.

## Генерация HTML

Node.js 22+; не нужны npm install и внешние библиотеки:

```bash
node scripts/build-site.mjs
git add docs/ru index.html scripts/build-site.mjs
```

На PR/пуше workflow **Validate documentation HTML** пересобирает index.html и проверяет его идентичность Markdown. GitHub Pages публикует main/(root). Для новой главы: добавить Markdown, расширить список глав в scripts/build-site.mjs, выполнить сборку и обновить это оглавление.

## Как делать задачи

1. Найти ID в [полном каталоге](docs/ru/13-functional-catalog.md), прочитать контекст и инварианты в 02–06.
2. Проверить [матрицу разрешений](docs/ru/15-permissions-matrix.md), [состояния](docs/ru/16-state-machines.md), [модель данных](docs/ru/17-database-design.md).
3. Уточнить API в [главе 18](docs/ru/18-api-design.md) и [OpenAPI](contracts/openapi.yaml), согласовать breaking changes.
4. Реализовать в соответствующем репозитории, добавить тесты и локализации kk/ru.
5. Проверить [DoD и release gate](docs/ru/22-delivery-roadmap.md), обновить Markdown+HTML.

## Текущий статус и ограничения

**Продуктовая модель v0.6; реализационная спецификация ещё draft** — проработка целевой бизнес-логики и архитектуры. Это не доказательство наличия production-приложения. OpenAPI — начальный частичный контракт, его необходимо расширить и валидировать до использования для генерации SDK. Юридические положения Казахстана, инфраструктура и регулируемые профессии требуют отдельной проверки перед запуском. Открытые решения перечислены в [главе 12](docs/ru/12-roadmap-decisions.md).


## Готовность к реализации

Бизнес-направление согласовано, но проект **ещё не признан implementation-ready**: в [главе 12](docs/ru/12-roadmap-decisions.md) продуктовые решения OPEN-01..14 выбраны как defaults в ADR-0004, но TECH-01..08 и юридические launch gates остаются. До основной реализации согласовать спорные бизнес-правила, UX, единую Prisma/REST модель и безопасность. Подробнее — [глава 22](docs/ru/22-delivery-roadmap.md). Схемы/Markdown не доказывают наличие готового к эксплуатации ПО.
