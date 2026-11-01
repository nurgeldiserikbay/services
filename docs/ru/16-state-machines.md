# 16. Машины состояний, гонки и исключения
> Контракт поведения v0.2. Никакое изменение статуса не должно происходить только на фронтенде.

## ProfessionalProfile: независимые оси
life_status: draft | published | paused | hidden | archived | pending_deletion | erased.
moderation_status: clear | review_required | restricted | suspended.
visibility: public | unlisted | private (не следует смешивать с life_status).
Последовательность переходов — из главы 02; администрация действует через moderation_status, не маскируя это под желание владельца.

## Organization и Location
Organization: draft → active ↔ paused → archived → pending_deletion. Location: draft → active ↔ temporarily_closed → permanently_closed, с историей. Закрытие филиала деактивирует будущие предложения, но не уничтожает прошлые booking/exposure/reviews. Последнее место работы нельзя автоматически раскрывать подписчикам без разрешения.

## Affiliation (работа/сотрудничество)
proposed → accepted/declined/expired/cancelled; accepted → active (если период начался) → ended/disputed. Для одной пары, вида связи и локации запрет пересекающихся активных интервалов при выбранных правилах, но повторное сотрудничество исторически допустимо. Исторический период неизменяем; спор о фактах → moderation case.

## ServiceAssignment
proposed → accepted → active → revoked/expired; отклонение proposed → rejected. Наличие active Affiliation и active ServiceOffer — необходимое условие доступности в компании. Отмена Affiliation каскадно отключает активные назначения через транзакционную политику, но не перезаписывает старые заказы.

## ServiceOffer
draft → active ↔ paused → archived. Изменение цены/условий создаёт новую версию для будущих заявок; принятые заявки держат snapshot. Неактивное предложение недоступно для новых заказов.

## ServiceRequest / Booking — простой MVP (ADR-0003)
В этой версии нет коммерческого Quote, переговоров о цене, обязательного in_progress и согласования новых цен. Прямой телефон/WhatsApp **не создаёт** ServiceRequest автоматически. Заявка создаётся только при отправке формы или выборе слота внутри Services.

| Текущий статус | Действие | Новый статус | Кому разрешено |
| --- | --- | --- | --- |
| — | submit | pending | Гость после OTP / авторизованный клиент |
| pending | accept | accepted | Указанный продавец / уполномоченный оператор |
| pending | decline | declined | Продавец / уполномоченный оператор |
| pending | cancel | cancelled_by_customer | Автор обращения с безопасным доступом |
| pending | expire (optional TTL) | expired | Системное событие |
| accepted | cancel | cancelled_by_customer / cancelled_by_provider | Клиент либо продавец по своей роли |
| accepted | complete | completed | Продавец / уполномоченный оператор |

Принятая запись может иметь `scheduled_start`, `scheduled_end`, `timezone`; при договорённости по телефону продавец вправе **изменить запись и вручную обновить занятость** с сохранением истории и доступным уведомлением клиенту. Изменение даты не требует workflow коммерческого предложения. Подтверждение факта услуги для verified review остаётся отдельной процедурой.

`source_context` и `seller_id` фиксируются при создании. Личная страница мастера → personal seller; страница компании, включая вложенную карточку мастера → company seller. Эти поля неизменяемы для существующей заявки, нельзя «перенаправить» её в другой контекст из-за смены работодателя.

**Календарь добровольный.** Слотная проверка требует активного режима бронирования; если слот виден, пересечение подтверждённых бронирований одного исполнителя проверяется транзакционно. Часы у компании и часы независимой работы учитывают одну и ту же занятость специалиста, но детали чужого контекста не выдаются. Если клиент договорился вне Services, система о записи не знает, пока продавец не добавил блок.

## Review
submitted → published (если eligible) → reported/under_review → retained/hidden/removed по политике → appealed → resolved. RatingAggregate асинхронно пересчитывается по допустимым опубликованным отзывам. Review.target_type и target_id неизменяемы.

## Известные гонки и обязательные решения
| Ситуация | Решение |
| --- | --- |
| Две команды create-profession одновременно | DB unique(person_id, profession_id) + 409 или существующий ресурс |
| Двойное подтверждение приглашения | Idempotency-Key + атомарный update pending → accepted |
| Два клиента заняли один слот | DB constraint/lock на reservation window при введении календаря |
| Клиент отменил и работник нажал complete | optimistic version + business transition 409 |
| Компания отозвала назначение при оформлении | финальная проверка assignment в транзакции |
| Старый черновик перезаписал новый | optimistic version / If-Match → 409 + сравнение |
| Повторная доставка push/webhook | outbox + дедупликация event_id |
| Удаление с активными заявками | блокировка финального стирания, процедура завершения обязательств |

## Чек-лист тестирования состояний
Для каждого перехода: позитивный тест, неверный actor, устаревшая версия, повтор команды, другая компания, несовместимое текущее состояние, отмена, журнал аудита, уведомление.

## Отмена и надёжность — переходы v0.7 (ADR-0004)
`pending → cancelled_by_customer|cancelled_by_provider` допустимо без негативного события; обе стороны получают уведомление. `accepted → cancelled_by_customer|cancelled_by_provider|cancelled_mutual` требует CAS состояния/версии, атомарной записи CancellationEvent, освобождения известного BusyBlock и **двух NotificationIntent**, плюс ровно одного eligible ReliabilityEvent для виновной стороны (или `none`, если исключение/в срок). `cancelled_mutual` доступен **только после подтверждения второй стороной**; первоначальная односторонняя отмена не должна ожидать второго согласия, чтобы освободить время.

Eligibility после accepted: зарегистрированный клиент отменил позже seller snapshot deadline и времени услуги; продавец отменил своё принятое обязательство без подтверждённого исключения (самостоятельный master vs organization seller), с меньшим весом за раннее уведомление; no-show требует проверки. Нет согласованного `scheduled_start_at` → customer late penalty невозможен. Policy change/последующая смена мастера не переписывает прежнее правило.

ReliabilityEvent: `proposed → effective|suppressed → appealed → retained|reversed`; `event_key = request_id + liable_party_role + reason_group`, unique, score агрегируется по versioned policy. Pending review, особенно no-show, не должен автоматически уменьшать публичный показатель. Повторные cancel event/notify подавляются по уникальному ключу. Если notify provider недоступен, retry/fallback, **не** отменять уже завершённый транзакционный переход.

Нужно проверять в тестах cancel vs complete, cancel vs reschedule, 2× cancel, company employee revoked during cancel, guest expired capability, timezone DST, новый offer policy против старого accepted, исключения и апелляции.
