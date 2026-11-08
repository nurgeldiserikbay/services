# Services — cross-repository integration acceptance runbook

**Release gate:** R3 / R2. **Status:** not executed as a complete deployed cross-repository journey. This runbook is an executable plan, not evidence of success.

## Preconditions

- Pin release candidate commit SHAs for `services`, `services-back`, `services-front`, `services-admin`; store CI run links in the release manifest.
- Provision a disposable **non-production** PostgreSQL 16 database with restricted credentials and isolated test identities. Do not point destructive tests at production.
- Configure the backend's documented environment variables from `.env.example`, including separate secrets per environment. Use a real OTP provider only in an authorized staging environment; otherwise keep public OTP feature flags disabled.
- Configure the frontend BFF to the **same backend deployment**; use HTTPS, correct cookie scope, CSRF protection and rate limits. Never expose backend/admin secrets to browser variables.
- Use approved test identities for guest, unrelated account, specialist, company operator and administrator. Ensure all test phone numbers and destinations are controlled by the tester.

## Backend reproducibility gate

Run from `services-back` at the pinned commit:

```sh
npm install --no-audit --no-fund
npm run typecheck
npm run build
npm run db:validate
npm run db:migrate
npm run db:seed:geo
npm run db:smoke
npm test
```

The backend GitHub Actions workflow already runs these categories against PostgreSQL 16. This local sequence is only a recheck; it is not proof of the frontend/backend deployed journey.

## Frontend and Admin reproducibility gates

At each pinned commit, separately:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

Run from the corresponding frontend/admin repository. A green build does not authorize enabling feature-gated OTP or mounting admin views.

## Integrated acceptance matrix

| ID | Scenario | Required observation |
| --- | --- | --- |
| I-01 | Anonymous user searches and opens published specialist/company profile | Only published, permitted data; no login required |
| I-02 | Guest starts OTP challenge, enters valid proof, submits request | Exactly one persisted request; status receipt bound to correct request and offer |
| I-03 | Wrong/expired/replayed OTP and oversized payload | Fail closed; no request created; no sensitive data in response/logs |
| I-04 | Repeat submission with same idempotency key and concurrent retries | Exactly one request and no duplicate notifications |
| I-05 | Correct seller views and accepts/declines request | Authorized state transition with version/ownership checks |
| I-06 | Unrelated seller or company attempts same request | 401/403 or privacy-preserving denial; no data exposure or mutation |
| I-07 | Guest polls request status using valid/invalid receipt | Only scoped status visible; stale responses never overwrite newer UI state |
| I-08 | Customer/provider cancellation before and after configured deadline | Correct policy snapshot, reliability decision and both-party notification intents |
| I-09 | Two competing decisions or cancel-vs-accept race | One valid terminal outcome; transactional rollback of losing action |
| I-10 | Admin reads moderation queue with valid/expired/insufficient-role session | Only scoped and redacted results; no access without verified privileged session and MFA |
| I-11 | Admin performs moderation write, auditor tries same write | Authorized write audited with reason; auditor mutation denied |
| I-12 | Restart backend after committed request/outbox before delivery | At-least-once retry with idempotent downstream effect; no lost intent |

Record HTTP status, redacted request/response shape, database assertions, notification delivery evidence, and linked CI or test artifact for every case. **Do not paste OTPs, bearer tokens, personal contact data or live secrets into evidence.**

## Exit criteria

- All I-01..I-12 pass on the same release candidate and staging deployment, or are explicitly marked blocked with an owner and issue link.
- Confirm backup **restore** on an isolated database, migration rollback strategy, monitoring alerts, privacy/data-residency review, accessibility and real-device checks.
- Only a reviewer-approved release manifest can close R2/R3/R5/R6. Missing provider, MFA or staging evidence keeps release blocked.
