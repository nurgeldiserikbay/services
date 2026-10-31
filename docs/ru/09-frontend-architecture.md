# 09. Архитектура Frontend, PWA, Android и iOS
> Рекомендация v0.1 · Репозиторий: [services-front](https://github.com/nurgeldiserikbay/services-front)

## Цель
Один дизайн-язык и переиспользуемые продуктовые модули, но **два runtime приложения**: SSR web и Capacitor mobile. WebView Capacitor не запускает сервер Next.js. Подход: pnpm monorepo внутри services-front.

## Структура
\`\`\`text
services-front/
  apps/
    web/         # Next.js: SEO public pages, SSR, PWA
    mobile/      # React + Vite + Capacitor: Android / iOS
  packages/
    ui/          # Design tokens, accessible components
    features/    # Profiles, services, bookings, reviews UI + state
    api-client/  # Generated OpenAPI types, transport
    auth/        # Session-aware abstraction, platform adapters
    i18n/        # kk/ru, later en
    config/      # Typed runtime flags
\`\`\`

## Public web (SSR/SEO)
Indexable professional, company, service, profession and city pages; canonical URLs, metadata, structured data only when verifiable, XML sitemap, robots policy. Draft/hidden/archived/disputed private pages noindex, prevent CDN caching of private content. Avoid duplicate SEO pages for identical profession aliases.

## Mobile
Capacitor packages independent static assets, talks to same HTTPS API. Features such as push, share sheet, camera/gallery, deep links, native permissions behind adapters. Login/callback/deep-link tested on real Android and iOS. Do not embed backend secrets in app. iOS builds require macOS/Xcode and Apple signing.

## State strategy
Server state via typed query cache with cancellation and dedupe; UI state local/feature-scoped. Avoid duplicate submit: disabled submit + server Idempotency-Key. Invalidate targeted cache after mutation; optimistic updates only for reversible actions, rollback on error. Abort obsolete search requests on query change.

## Authentication
Web: secure httpOnly cookies with CSRF protection as applicable. Mobile: app-specific token/session design with secure keychain/keystore, refresh rotation and explicit revoke. Do not put tokens into LocalStorage or URLs. The API must support both contexts with separate policy.

## Workspaces
Unified account shell with switches: customer, personal identity, barber profession, chef profession, organization A, organization B. Route guard and server-side ACL for each. Do not infer authorization from visible menu. Tabs and navigational hierarchy based on current workspace, not separate registrations.

## UX
Mobile-first, accessible buttons, minimal forms, clear empty/error/loading states, image compression, skeletons, search with filters. Key user flows: find service; inspect professional and company; select offer/location; request; manage upcoming appointment; rate separately; follow. Professional: create profession, edit draft, manage affiliations/assignments. Business: manage locations/offers/team.

## PWA/offline
App shell and explicitly safe public assets can cache. Private reviews, booking details, contact data and sessions should not be cached indiscriminately. Initially offline read-only status with retry on reconnect; no offline booking commitments unless separately designed for conflict resolution.

## Performance and accessibility
Responsive images, lazy-loading, code splitting, route-based chunking, Core Web Vitals monitoring, WCAG 2.2 AA design target, keyboard navigation, screen-reader labels, touch targets, low-end Android testing and reduced-motion support.

## Platform test matrix
Web Chromium/Firefox/WebKit, Android device emulator+real, iOS simulator+real, PWA install/update, deep-link cold/warm starts, camera permissions, offline/reconnect, push opt-in, sign-in, background resume, different locale/viewport.
