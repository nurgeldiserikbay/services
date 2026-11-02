# ADR-0005 — авторизация, регистрация, гостевой доступ и web/mobile сессии
**Статус:** DESIGN DEFAULT v0.9, рекомендовано для реализации, не запущено. 2026-11-01. Продуктовые решения — ADR-0003/0004. В случае запуска в других странах проверить законность каналов OTP, хранения данных и возрастные ограничения.

## Цель и границы
Публичный поиск, просмотр, звонок/WhatsApp и простая гостевая заявка **не требуют постоянной регистрации**. Аккаунт создаётся осознанно, чтобы сохранить страницы и подписки, видеть свои заявки и отзывы. Специалист и компания используют этот же аккаунт для рабочих пространств — **отдельная регистрация для профессии не нужна**. Отсутствие телефона/приложения не должно препятствовать поиску.

Предлагаемая основа входа MVP — **passwordless OTP** через подтверждённый e-mail или телефон (если доступен поддерживаемый провайдер/страна). Возможность passkey/OIDC — позже, с отдельной policy для связывания идентичностей. **Не создавать User незаметно** в guest verification; signup требует явного действия и принятия актуальных обязательных условий. Подтверждение контакта не доказывает юридическую личность, профессию, право представлять компанию или факт получения услуги.

## Три контекста доступа
| Контекст | Механизм | Ограничения |
| --- | --- | --- |
| Анонимный посетитель | Нет токена; публичный SSR/CDN | Только опубликованная информация, без личных данных гостя |
| Guest request | После проверки контакта краткосрочная непрозрачная capability `Guest-Capability` | Только одна конкретная заявка и разрешённые действия, никакой связи с аккаунтами по совпадению телефона |
| Registered Person | Web: HttpOnly Secure SameSite cookie/BFF. Mobile: короткий bearer access token + ротационный refresh в системном защищённом хранилище | Приватный saved/history, роли владельца профессиональной страницы, полномочия компании с конкретными scopes |

**Admin**: отдельный домен/приложение, с отдельными сессиями и MFA для повышенных прав; простой вход клиента не даёт доступа к админке. Corporate owner transfer, claim recovery и опасные действия требуют step-up/MFA и аудита.

## Учётная запись и OTP
1. `POST /auth/challenges` получает `channel`, `contact`, `purpose: sign_in|sign_up`, `locale`; возвращает **202** с непроговаривающим о наличии аккаунта результатом и короткоживущим `challenge_id`. Реальная отправка асинхронная. Ограничение количества challenge по хешу контакта, IP-контексту (краткосрочно), устройству и глобальному бюджету.
2. `POST /auth/challenges/{id}/verify` проверяет код constant-time, TTL (проектный default 5 мин), максимум 5 попыток; codeHash, one-time consume, запрет повторного входа по тому же challenge. Назначение challenge нельзя переиспользовать для иной операции.
3. Для `sign_up` только явный intent и согласие с актуальными Terms/Privacy; проверка канала не создаёт владение компанией. Для `sign_in` неверный/неизвестный пользователь не должен выдать чужую сессию; UI может безопасно предложить регистрацию без раскрытия лишних данных.
4. При удачном `sign_in` web BFF устанавливает `__Host-services_session` (Secure HttpOnly, Path=/, SameSite=Lax/Strict по проверенному дизайну), а mobile возвращает краткоживущий access token и refresh token, хранимый только в OS secure storage. Не сохранять refresh в localStorage/analytics. Никогда не возвращать web session в JS-readable body.
5. `POST /auth/refresh` в mobile делает rotate family, предыдущий refresh больше не работает; повторное использование revoke family и сигнал security. `POST /auth/logout` завершает текущую сессию, `POST /auth/logout-all` — все сессии (повышенная проверка).
6. Все защищённые операции проверяют session validity, user.status, revoked operator membership, seller/context. Отмена/accept требуют идемпотентности, а не только client-side disabled button.
7. Web cookie mutation требует anti-CSRF (одноразовый/double-submit cookie или origin-bound synchronizer), Origin и CORS allowlist; SameSite **не заменяет** CSRF. Защита XSS CSP, Trusted Types если поддерживается, ограниченный third-party JS; native bearer не использовать в произвольных webview.

## Гость и отдельная заявка
- `POST /guest-requests/challenges` запускает SMS/e-mail OTP; `verify` выдаёт короткий `Guest-Capability` для **создания** одной заявки. После создания выдаётся отдельная request-scoped capability на **чтение/отмену именно этой заявки** (или повторная проверка контакта). Это **разные scopes**: `guest:create_request` и `guest:request:{id}:read|cancel`.
- Capability — случайный непрозрачный секрет ≥128 бит, в БД только hash. TTL: creation 15 мин, request-scoped 24 ч (продлевается проверкой контакта), exact binding to guest contact and request ID. Never put in URL (включая query/hash), SSR cache, referrer, logs, crash telemetry или clipboard analytics. Передаётся только заголовком по HTTPS.
- Guest cancel pending или accepted создаёт одинаковые уведомления обеим сторонам, но **нет постоянного рейтинга клиента**. Нельзя переносить штрафы/отзывы с guest на будущий зарегистрированный Person автоматически. Привязка исторической заявки к аккаунту возможна только через отдельную проверенную и явно согласованную процедуру позже.
- Если capability истекла, пользователь снова подтверждает **тот же** контакт, чтобы получить доступ к той же заявке. Rate limit и дедупликация обращения по Idempotency-Key / sender + offer TTL; статус не выдаётся по одному UUID.
- Контакт гостя и данные заявки шифруются, хранятся только для выполнения обращения и установленных законных сроков; удалить по retention/заявлению с учётом обязательной законной истории. OTP и capability-hash не должны оказываться в публичном контенте.

## Права, ошибки и безопасность API
- Одинаковое сообщение для неизвестного/известного контакта на этапе отправки OTP; не раскрывать флаг наличия пользователя. TTL и ошибки `400 invalid_input`, `401 invalid_credentials`, `403 forbidden`, `409 conflict`, `410 expired_capability`, `422 validation_error`, `429 rate_limited` с `Retry-After` где уместно.
- Данные профессионала и компании всегда запрашиваются через **scope** (owner Person + OrganizationMember с ролью/филиалом/сроком). Affiliation не является RBAC grant. Отозванное членство в компании должно немедленно перестать давать права даже при ещё живой сессии.
- Audit trail важных операций с actor, resource, outcome, timestamp, request ID; без исходных OTP, bearer, cookie, guest token, приватных сообщений или контактных значений в логах.

## Что должен проверить CI/staging
- Web cookie HttpOnly, Secure, __Host-/Path, CSRF на POST/PATCH/DELETE, CORS/Origin; mobile token-family rotation/replay detection.
- OTP replay, 5 wrong attempts, duplicate submission, challenge expiration, brute-force / account enumeration.
- Гость может прочитать/отменить только свою заявку. Подмена `source_context`/seller и попытка guest обновить корпоративные поля → 403/404 без утечки существования.
- После увольнения company operator старый access token теряет scope; independent professional history не попадает в company workspace.
- Время отмены и policy snapshot не подменяются мобильным телефоном клиента.
- Logout all / revoke session family / account deletion, recovery, change contact, owner step-up.

## Не решено текстом
Поставщики SMS/e-mail и фактические тарифы, legal basis/retention и возрастной порог по юрисдикциям, hostname/cookie topology, MFA recovery policy, verified company ID proof, реальные security/pentest результаты. До production — явная проверка и ADR по конкретному окружению. Не обещать одно и то же правовое соответствие во всех странах.


## Дополнение v0.10 — гостевой доступ к согласованию времени (PROPOSED, 2026-11-02)

Проектный ADR-0006 вводит `MANAGE_SCHEDULE` как третью, **независимую** область `GuestCapabilityScope`. Наличие `READ_CANCEL` не разрешает предлагать, подтверждать или отклонять время; `MANAGE_SCHEDULE` не предоставляет права отменять заявку и не является сессией.

1. Гость начинает `POST /guest-requests/{id}/schedule-access/challenges` с краткосрочным `READ_CANCEL` capability для **этой же** заявки. Сервер проверяет связь `request.guestContactId`, разрешённый статус заявки, rate limits и контакт, зафиксированный при создании; не принимает новую произвольную почту/телефон. Ответ не раскрывает содержимое заявки и даёт только challenge ID.
2. `POST /guest-requests/{id}/schedule-access/challenges/{challengeId}/verify` подтверждает одноразовый код, привязанный к исходному guest contact, request, purpose=MANAGE_SCHEDULE, TTL и счётчику попыток. При успехе выдаёт короткоживущий непрозрачный токен `MANAGE_SCHEDULE`, храня его исключительно в виде хеша. Одноразовое поглощение challenge — атомарное. OTP и токен не записывать в логи или analytics.
3. Обе операции должны поддерживать безопасный anti-enumeration: неверная заявка, capability, заблокированный запрос и непроверенный контакт не позволяют обнаружить чужую запись. Переиздание capability не меняет seller/performer/customer.
4. Управление предложением требует `MANAGE_SCHEDULE` + соответствующий ID заявки + корректную роль customer; действующая сессия продавца проверяется отдельно. Токен гостя не превращает клиента в продавца и не создаёт постоянную учётную запись.
5. Изменение/отмена заявки и возможность подтвердить время не объединяются в одну универсальную capability. После финального состояния заявки все schedule capabilities становятся бесполезны, даже если TTL не истёк.

Это дополнение — **проектное уточнение** к принятому ADR-0005, а не подтверждение реализованной защиты. До запуска нужны threat model, проверка на реальном PostgreSQL, тесты brute-force/race и review privacy/retention.
