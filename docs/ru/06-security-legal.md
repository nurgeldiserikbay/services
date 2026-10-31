# 06. Безопасность, права, приватность, комплаенс
> Статус: обязательные ограничения v0.1 · Приоритет: до публичного запуска

## Модель доступа
RBAC на роль + ABAC на ресурс и его текущее состояние. Действующий session user не означает права управлять всей организацией. Разрешения проверяются в backend по person/profile/organization/location/offer, включая nested resources. Делегирование: явные AccessGrant с scope, expiration, revocation, last_used.

| Роль | Примеры разрешений |
| --- | --- |
| Person owner | Управление своими профессиями, приватностью, запрос удаления |
| Organization owner | Управление организацией, администраторами, филиалами |
| Organization admin | Команда и предложения в выданном scope |
| Operator | Записи и расписание, но не финансовые/владельческие права |
| Moderator | Чтение ограниченного набора жалоб, решение согласно политике |
| Platform admin | Проверяемое управление справочниками, модераторами |
| Auditor | Чтение допустимых журналов без мутации |

## Обязательная защита
Пароли: сильная политика и безопасное хеширование; session rotation/revocation, CSRF для cookie flow, secure httponly same-site cookies, rate limits, проверка email/телефона, MFA для админов. Authorization unit/integration tests, deny-by-default для новых API и объектов, инвалидация кешей при изменении прав.

Все критичные операции с idempotency: create profile, accept affiliation, publish revision, confirm booking, create review. Отложенные задания и повторные webhook-события не должны дублировать последствия. Ограничения на upload, signed URLs, malware scanning как отдельный этап; запрет сохранения секретов в git и клиентском bundle.

## Приватность
Разделение PII и публичного профиля, Data minimization; opt-in маркетинговых уведомлений; право на доступ, исправление и удаление в применимых рамках; retention matrix для profile, review, audit, booking, invoices, backups. Экспорт данных и механизм апелляции. Работодатель не получает историю клиентов специалиста вне собственной услуги.

## Казахстан
До запуска юридически подтвердить применимые нормы о персональных данных, локализации баз, передаче данных, рекламе, правах потребителей, ИП/организации, регулируемых профессиях. Это **не** заключение юриста. Инфраструктура, резервные копии, мобильная телеметрия и сторонние SDK должны пройти data mapping до использования.

## Верификация
Чётко различать «контакт подтверждён», «профиль владельца подтверждён», «организация проверена», «квалификация проверена». Одна галочка на все утверждения недопустима. Не публиковать сканы паспортов/дипломов без необходимости. Связь с компанией подтверждается обеими сторонами.

## Аудит
События: permissions.changed, profile.published, affiliation.accepted/ended, service_assignment.changed, booking.transitioned, review.moderated, admin.action. Хранить actor, target, reason, timestamp, correlation_id и безопасные diff/snapshot без ненужных PII.

## DoD
No secrets in repository; backup/restore drill; abuse reporting; rate-limited public API; accessibility; privacy notices; documented incident response; tests for IDOR, role escalation, duplicate operations and authorization revocation.
