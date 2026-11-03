# Services — жобаның аяқталу чеклисті

**Snapshot: 2026-11-03.** Бұл құжат — тексерілген код/PR күйінің суреті. Backend және Frontend README-лері ескірген болуы мүмкін; негізгі дәлел — merged commit және CI.

## Мәртебе ережелері

- **[x] Дайын:** сәйкес код `main` ішінде; бастапқы CI бар. Бұл production-ready деген сөз емес.
- **[ ] 🔄 Жұмыста:** код тармақта немесе жоба бөлігі ғана дайын, толық acceptance жоқ.
- **[ ] ⏳ Күтуде:** функционалдың тексерілген іске асыру дәлелі жоқ.

## Жалпы прогресс

- **20/70 (29%)** — чеклист пункттері бойынша **аяқталған** (бәрі тең салмақты).
- **8** — жұмыста, **42** — басталмаған/дәлелденбеген.
- Бақылау индексі, жұмыстағы пункт = 0.5: **34%**.

**Маңызды:** бұл өнімнің нақты дайындық пайызы емес. Үлкен қауіпсіздік модулі шағын UI өзгерісінен ондаған есе күрделі болуы мүмкін. Тек release gate барлық шарттары орындалғанда шығарылымға дайын деп есептейміз.

## Толық чеклист

### ТЗ / архитектура — 3/9 аяқталды

- [x] ADR және негізгі бизнес ережелер жазылған
- [x] OpenAPI мен Prisma reference contracts бар
- [x] Негізгі contracts CI құрастырылған
- [ ] 🔄 G0 outbox/recovery/no-show өзгерістерін бекіту (Docs PR #4)
- [ ] 🔄 Geography контрактісі (Docs PR #5)
- [ ] 🔄 Жария профиль контрактісі (Docs PR #6)
- [ ] 🔄 Қызмет ұсынысының public projection контрактісі (branch)
- [ ] ⏳ Тәуелсіз бизнес және security sign-off
- [ ] ⏳ Frontend/Backend cross-repo contract compatibility тесті

### Backend / PostgreSQL — 6/20 аяқталды

- [x] NestJS, config және health endpoint
- [x] Prisma baseline миграциясы мен PostgreSQL smoke CI
- [x] Idempotent KZ starter seed: 3 қала ғана
- [x] Public search GET /v1/search
- [x] Geo countries/areas/cities GET API
- [x] Маман мен компанияның published-only public API-і
- [ ] 🔄 Жария service-offer details API (unmerged branch)
- [ ] ⏳ Әлемдік география және көптілді іздеу анықтамалығы
- [ ] ⏳ Санаттар және service taxonomy
- [ ] ⏳ Account login/OTP/sessions
- [ ] ⏳ Professional/organization CRUD және ACL
- [ ] ⏳ Affiliation және company roles
- [ ] ⏳ Offer CRUD және publication
- [ ] ⏳ Guest OTP және request create
- [ ] ⏳ Қабылдау/бас тарту, bilateral schedule
- [ ] ⏳ Busy blocks, booking calendar, race conditions
- [ ] ⏳ Cancellation, reliability, no-show, appeals
- [ ] ⏳ Domain outbox және екі тарапқа notifications
- [ ] ⏳ Pagination/metrics/load-ready search
- [ ] ⏳ Production-like migration, rollback және backup

### Frontend Web — 6/14 аяқталды

- [x] Next.js / TypeScript құрылымы
- [x] KK/RU discovery UI және typed API client
- [x] Бос және қате жауап UX
- [x] Ел/қала selector + server proxy
- [x] Маман/компания SSR public pages
- [x] Профильдегі жария қызмет ұсыныстарының тізімі
- [ ] 🔄 Service offer жеке SSR беті (unmerged branch)
- [ ] ⏳ Рұқсат етілген phone/WhatsApp байланыс әрекеттері
- [ ] ⏳ Guest OTP және request UI
- [ ] ⏳ Орындаушы күнтізбесі және өтінімдері
- [ ] ⏳ Профиль мен offer басқару
- [ ] ⏳ Company/affiliation workspace
- [ ] ⏳ Notifications және cancellation UI
- [ ] ⏳ SEO, accessibility және E2E толық аудит

### Admin — 1/6 аяқталды

- [x] services-admin репозиторийі мен шекарасы анықталған
- [ ] ⏳ Admin Next.js runtime, login және MFA
- [ ] ⏳ RBAC және аудит
- [ ] ⏳ Moderation / verified profiles
- [ ] ⏳ No-show, review, appeal moderation
- [ ] ⏳ Geo/taxonomy management

### Mobile — 0/5 аяқталды

- [ ] ⏳ Capacitor app shell және shared components
- [ ] ⏳ Android native build және deep links
- [ ] ⏳ iOS native build және deep links
- [ ] ⏳ Mobile secure session/OTP storage
- [ ] ⏳ Push/offline lifecycle

### Қауіпсіздік / сапа — 4/10 аяқталды

- [x] Backend typecheck/build/test CI
- [x] Frontend typecheck/build/test CI
- [x] PostgreSQL constraints smoke CI
- [x] CORS қауіпсіз бастапқы конфигурациясы
- [ ] 🔄 Published-only public read boundary (толық ACL әлі жоқ)
- [ ] ⏳ IDOR/CSRF/OTP abuse/authorization tests
- [ ] ⏳ Concurrency/idempotency/outbox integration tests
- [ ] ⏳ Accessibility және browser/mobile E2E
- [ ] ⏳ Performance, load және penetration tests
- [ ] ⏳ Backup/restore/incident-response drill

### Infra / compliance — 0/6 аяқталды

- [ ] 🔄 KZ residency ADR бар, нақты deployment дәлелі жоқ
- [ ] ⏳ Staging/production pipeline
- [ ] ⏳ Residency + subprocessor legal review
- [ ] ⏳ Observability / secrets / key rotation
- [ ] ⏳ Data erase/export/retention policies implementation
- [ ] ⏳ Launch sign-off және rollback plan

## Release gate — барлығы міндетті

- [ ] Каталог → жария профиль → телефон/WhatsApp немесе өтінім → орындаушы қабылдауы → күнтізбе → екі тарапқа хабарлама staging-де E2E өтеді.
- [ ] Backend/Frontend/Admin және мобильді қолжетімділік пен бизнес функциялар қабылданды.
- [ ] ACL, guest OTP, cancellation, reliability, no-show, appeals және idempotency/concurrency интеграциялық тесттері өтті.
- [ ] Residency, құпиялылық, деректерді өшіру, мониторинг, backup/restore, жүктеме және қауіпсіздік аудиті орындалды.
- [ ] Техникалық reviewer + Product owner release sign-off берді.

## Дәлелдер және байланыстырылған PR-лар

- [Services Docs](https://github.com/nurgeldiserikbay/services): G0 [PR #4](https://github.com/nurgeldiserikbay/services/pull/4), Geo [PR #5](https://github.com/nurgeldiserikbay/services/pull/5), Public profile [PR #6](https://github.com/nurgeldiserikbay/services/pull/6) — осы snapshot бойынша ашық.
- [Services Backend](https://github.com/nurgeldiserikbay/services-back): Geo PR #3 және Profile PR #4 merged; offer details әлі unmerged branch.
- [Services Frontend](https://github.com/nurgeldiserikbay/services-front): Geo PR #3 және Profile PR #4 merged; offer details әлі unmerged branch.
- [Services Admin](https://github.com/nurgeldiserikbay/services-admin): README/AGENTS ғана, runnable UI жоқ.

## Жаңарту тәртібі

1. PR/issue нақты чеклист тармағына сілтеме жасайды.
2. Feature branch және жасыл CI — `🔄`; `main` және тиісті acceptance болса — `[x]`.
3. Жаңа функционал немесе тәуекел анықталса, пункт қосып, есепті қайта санаймыз.
4. Әр негізгі merge не релизде snapshot күні мен дәлелді жаңартамыз.

## Келесі P0

1. G0 PR #4/5/6 қарау, контрактілерді main-ға сәйкестендіру және тәуелсіз sign-off.
2. Service offer detail API/UI merge, contract және smoke test.
3. Guest OTP → қарапайым request → calendar accept/decline → екі тарапқа notification transactional vertical slice.
