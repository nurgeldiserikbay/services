# 11. Инфраструктура, CI/CD, мониторинг и качество
> Рекомендация v0.1 · Все четыре репозитория

## Окружения
Local, staging, production; независимые БД и ключи; конфигурация через validated env; secrets only in secret store, no secrets in git. Казахстанская data residency и трансграничные сервисы требуют правовой проверки. Нет прямого доступа frontend/admin к базе.

## Поток разработки
1. Изменение правила фиксируется в docs с user story, инвариантом и тестовыми критериями.
2. Контракт API меняется до реализации breaking behavior.
3. Backend мигрирует БД безопасно (expand → deploy → contract), проходит DB/integration/security tests.
4. Front/Admin импортируют сгенерированный типизированный клиент; мобильные версии требуют backward-compatible API.
5. CI: format/lint → types → unit → integration → E2E/accessibility → security/dependency scan → build. Review и PR; main всегда собирается.
6. Staging smoke на центральный сценарий; затем deployment и мониторинг.

## Разработка в параллельных сессиях
Изолированные feature-ветки, ownership модулей, не менять общие contracts без координации, маленькие PR, без самовольного merge. Документация не считается реализованной функциональностью. Общие правила в AGENTS.md каждого репозитория.

## Наблюдаемость
Structured logs с request_id и trace_id, error reporting без PII, health checks, saturation, latency, booking funnel metrics, очередь уведомлений, rate-limit alarms. Analytics events — только минимально необходимые, с consent и retention.

## Backup / DR
Encrypted DB backups and restore rehearsals, object storage lifecycle + versioning, documented retention, RPO/RTO targets, offsite copies subject to local data rules. План инцидентов с ролями, уведомлениями и постмортем.

## Надёжность
Backend разруливает конкурентные запросы, unique constraints, explicit transactions, idempotency tokens. На клиенте double-click prevention, abort stale requests, optimistic rollback, sensible retries with jitter. Для внешних каналов уведомления — eventual consistency и deduplicated outbox.

## Контроль качества
- Domain: one-profession-one-profile including archive.
- Privacy: no cross-organization customer leakage.
- Reviews: separate immutable targets, professional portability.
- Lifecycle: archive→restore, deletion processing, revisions.
- Bookings: duplicates, cancellations, reassignment.
- Admin: permission escalation, fake verification, audit.
- Performance: mobile LCP, search p95, image budgets.
- Mobile: deep links, orientation, safe areas, signing, permissions.

## Выпуск
Фичефлаги для категорий и новых полей; rollout постепенно; обратная совместимость для мобильных клиентов, которые обновляются медленно. Release checklist включает юридические тексты, accessibility, security, staging, backups, monitoring, store policies and incident response.
