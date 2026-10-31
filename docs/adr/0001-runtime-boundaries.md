# ADR-0001: границы приложений и источник бизнес-правил
Статус: proposed · 2026-10-31

## Контекст
Нужно четыре репозитория и одновременно SEO-сайт, PWA, Android/iOS, отдельная платформа модерации, один API и профессиональные связи. Нельзя запускать Next.js SSR внутри Capacitor.

## Решение
services хранит Markdown, OpenAPI, ADR и собирает HTML. services-back реализует модульный монолит NestJS/PostgreSQL/Prisma. services-front содержит pnpm workspace: Next.js для SSR web + PWA, React/Vite для Capacitor mobile, общие ui/features/api-client/i18n. services-admin — отдельный Next.js c privileged доступом через backend API.

## Причины
Единая бизнес-логика, индексация публичных страниц, переиспользование UI, низкая сложность деплоя, понятная авторизация, независимая модерация и возможность mobile deployment.

## Издержки
Два UI runtime требуют тестов и адаптеров auth/push/deep links; shared package должен быть совместим с обоими bundlers. Без документации API возможен drift — нужен OpenAPI + generated clients.

## Альтернативы
Единый Next.js для Capacitor (нельзя запустить SSR внутри WebView); microservices с первого дня (избыточно); отдельные repo web/android/ios (увеличивают дублирование и рассинхронизацию).

## Проверка
Собран SSR web, mobile Android/iOS из одних features; end-to-end запрос/отзыв работает через единый API; GitHub CI и contract compatibility зелёные.
