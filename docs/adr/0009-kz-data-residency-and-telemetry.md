# ADR-0009 — размещение и передача персональных данных для пилота РК

**Статус:** PROPOSED SECURITY/COMPLIANCE BASELINE, 2026-11-03. Не юридическое заключение.

## Правовое основание и разграничение

Публичная доступность глобального поиска **не означает** необходимость хранения персональных данных пользователей РК за рубежом. Закон РК «О персональных данных и их защите» №94-V, ст.12(2), в редакции с изменениями 2026 г., предусматривает хранение ПД в базе и/или цифровом объекте на территории РК. Ст.16 устанавливает отдельные правила трансграничной передачи. Для охвата GDPR необходимо отдельно оценить применимость его территориальных критериев, роль controller/processor, правовые основания и механизмы международных передач; глобальная доступность сайта сама по себе не делает GDPR безусловно применимым.

Источники для юридической сверки:
- https://old.adilet.zan.kz/rus/docs/Z1300000094
- https://www.gov.kz/org/telecom/documents/details/175?lang=ru
- https://prg.kz/document/?doc_id=31396226 (редакция на 14.09.2026)

## Архитектурная граница пилота

1. Для первоначального пилота РК выбрать поставщиков **с подтверждённым фактическим размещением** БД, хранилищ PII, backup, файлов, очередей с ПД, логов и observability в Казахстане; отразить контрактный регион, список subprocessors, места репликации/backup и аварийного восстановления. Не предполагать, что конкретный бренд или название облака автоматически обеспечивает суверенный регион.
2. Внешние CDN/SSR/edge, поисковые индексы, error tracking, email/SMS gateway, analytics, customer support и CI рассматриваются как **потенциальные получатели/хранилища** ПД. Разрешить стороннюю передачу только после data-flow inventory, правовой оценки, соответствующих оснований, политики доступа и договоров. Просто «маскировать телефоны» недостаточно.
3. Изолировать `dev`, `staging`, `production`: разные БД, секреты, ключи, домены, telemetry sinks и права. В тестовых средах использовать синтетические данные; копирование production PII запрещено без согласованного обезличивания и основания.
4. Глобальный каталог: публичные данные ограничены явно опубликованными полями. Приватные персональные сведения (номер клиента, guest contact, OTP, note, точное местоположение, cookie/token) не экспортируются в глобальный CDN/cache/index. Для приватного — `Cache-Control: no-store`, серверная ACL и политика удаления.
5. Перед выходом за пределы РК по странам/категориям создать отдельную матрицу `country -> lawful basis, data residency, transfer permissions, localization, processor/retention`. Country flags не подменяют юридическую проверку.

## Обязательные средства контроля в services-back

- **Structured allowlist logging** вместо попытки замаскировать все виды ПД регулярными выражениями: явный набор полей `event, action, coarse status, duration, correlation id`; по умолчанию исключить body, query, Authorization, Cookie, Set-Cookie, OTP, email, phone, notes, guest capability, IP, precise geo, sensitive payloads.
- Sanitization/redaction во всех слоях: NestJS exceptions/validation errors, HTTP logger/interceptors, job processor, SQL logging, tracing, Sentry-like SDK, analytics и reverse proxy. Не передавать raw `idempotency-key` и контактные хеши/долговременные fingerprint; при отладке применять короткоживущий непрямой correlation id. Ошибки провайдера не логировать целиком.
- Egress restrictions и конфигурационный `DATA_RESIDENCY_REGION=KZ` + проверяемые allowlists telemetry endpoints; deploy preflight должен падать при неподтверждённом processor/region и включённом экспорте PII.
- Шифрование на диске и канале, KMS/секреты в разрешённом регионе, отдельные минимальные service accounts, backup encryption/restore drills, retention schedule с удалением из backup и audit exception, инцидентный playbook.
- Для публичных профилей применять видимые согласия, отзыв публикации и немедленную инвалидацию кэша. Корпоративные страницы не копируют приватную базу мастера.

## Таблица потоков перед production

| Поток | PII? | Допустимое размещение для KZ pilot | Gate |
| --- | --- | --- | --- |
| PostgreSQL + backups | Да | Подтверждённая территория РК | Mandatory |
| NestJS workers, Redis, outbox | Возможно / Да | Подтверждённая территория РК | Mandatory |
| Files + object storage | Возможно / Да | Подтверждённая территория РК | Mandatory |
| Web SSR/edge/CDN | Public-only by default | Проверить каждый payload/cache | Mandatory |
| Logs/traces/error reports | Потенциально | KZ endpoint или строго анонимизированные данные после review | Mandatory |
| SMS/email gateway | Номер/email + сообщения | Документировать processor и трансграничную передачу | Mandatory |
| Product analytics | По умолчанию без PII | Проверить SDK, region, retention | Mandatory |
| CI/CD and support | Секреты/ошибки могут содержать PII | Synthetic data; scoped access | Mandatory |

## Порог приёмки

- Inventory: каждая категория ПД, источник, цель, правовое основание, получатель, регион, срок и удаление.
- Automated tests: redaction не допускает email, phone, OTP, Cookie, `Idempotency-Key`, guest token, клиентские заметки в логах и trace; проверять не только happy path, но исключения/HTTP 4xx/5xx/job failures.
- Runtime telemetry test и outbound network audit: убедиться, что реальные процессы не экспортируют PII в неразрешённые регионы.
- Legal/privacy review действующей редакции закона РК и GDPR applicability перед запуском; audit evidence и подписанное решение владельца.

**Итог:** архитектура публичного поиска остаётся глобальной, но хранение и обработка PII пилота РК проектируются с локальными boundaries и доказуемым контролем subprocessors/telemetry.
