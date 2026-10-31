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

## Booking
| Исходное | Событие | Следующее | Проверки |
| --- | --- | --- | --- |
| draft | submit | requested | idempotency, offer active |
| requested | accept | accepted | seller permission, price snapshot |
| requested | reject/withdraw | rejected/withdrawn | actor, reason |
| accepted | start | in_progress | due time, operator |
| in_progress | complete | completed | подтверждение факта услуги |
| accepted | cancel | cancelled_by_client/provider | cancellation rules, уведомление |
| accepted | propose_change | reschedule_requested | новый snapshot |
| reschedule_requested | client_accept | accepted | явное согласие |
| completed | contest | disputed | только отдельный case, история не стирается |

No-show — отдельное событие, а не попытка перезаписать completed. Confirmed experience не обязательно равна completed, если исполнение оспаривается: отзыв с меткой verified требует достаточной проверки.

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
