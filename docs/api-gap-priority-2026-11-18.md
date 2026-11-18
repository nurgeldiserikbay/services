# API gap delivery sequence — 2026-11-18

**Engineering proposal; not approved scope reduction.** The 42 unmatched design operations are sequenced below, not declared unimplemented beyond the inspected controller set. P0 means resolve before dependent core release gates; P1 means sequence after P0, not optional. No operation is approved for deferral or removal. See [pinned route inventory](api-runtime-route-inventory-2026-11-18.md) and [MVP acceptance](ru/26-acceptance-checklist.md).

## G1 identity — P0

Account sign-in, session lifecycle and own profile; private verification is not a substitute for the entire flow.

| Method | Design path |
|---|---|
| POST | `/auth/challenges` |
| POST | `/auth/challenges/{id}/verify` |
| POST | `/auth/refresh` |
| POST | `/auth/logout-all` |
| GET | `/me` |

## G1/G2 seller builder — P0

Required by MVP profile, organization, affiliation and offer lifecycle; preserve ACL and independent professional identity.

| Method | Design path |
|---|---|
| GET | `/service-definitions` |
| POST | `/organizations` |
| PATCH | `/me/professional-profiles/{id}` |
| PUT | `/professional-profiles/{id}/company-views/{organization_id}/permissions` |
| PUT | `/organizations/{id}/professionals/{profile_id}/view` |
| POST | `/service-offers` |
| PATCH | `/service-offers/{id}` |
| GET | `/me/professional-profiles` |
| POST | `/me/professional-profiles` |
| POST | `/me/professional-profiles/{id}/lifecycle` |
| POST | `/organizations/{id}/affiliation-invites` |
| GET | `/organizations/{id}/professionals/{profile_id}` |

## G3 request lifecycle — P0

Authenticated booking, completion, scheduling and cancellation; private transaction helpers must not be exposed without session/CSRF checks.

| Method | Design path |
|---|---|
| POST | `/requests` |
| POST | `/requests/{id}/complete` |
| PATCH | `/requests/{id}/schedule` |
| GET | `/me/requests` |
| POST | `/requests/{id}/cancel` |
| GET | `/requests/{id}/cancellation-preview` |
| GET | `/service-offers/{id}/cancellation-policy` |
| PUT | `/service-offers/{id}/cancellation-policy` |
| POST | `/requests/{id}/no-show-claims` |
| POST | `/requests/{id}/no-show-claims/{claimId}/response` |
| POST | `/guest-requests/recovery/challenges` |
| POST | `/guest-requests/recovery/challenges/{id}/verify` |
| POST | `/guest-requests/recovery/requests/{id}/session` |

## G3 calendar — P0

Availability and collision handling with privacy-safe public projection.

| Method | Design path |
|---|---|
| GET | `/me/availability-allocations` |
| PUT | `/me/availability-allocations` |
| GET | `/public-availability` |

## G3 reputation — P0

Verified review, separate reliability and appeal/no-show flow; no public penalty without evidence.

| Method | Design path |
|---|---|
| GET | `/me/reliability` |
| GET | `/sellers/{kind}/{id}/reliability` |
| POST | `/reliability-events/{id}/appeal` |
| POST | `/experiences/{id}/reviews` |
| POST | `/admin/no-show-claims/{claimId}/decision` |

## G3 saved items — P1

Approved MVP scope; sequencing after core journey does not remove release requirement.

| Method | Design path |
|---|---|
| DELETE | `/me/saved-items/{id}` |
| GET | `/me/saved-items` |
| POST | `/me/saved-items` |

## G3 geography — P1

Regional UX enhancement; verify whether existing country/area/city endpoints meet acceptance before any deferral.

| Method | Design path |
|---|---|
| GET | `/geo/suggestion` |

## Runtime-only route disposition

| Route | Proposed disposition | Required verification |
|---|---|---|
| GET /health | Operational contract | Minimal liveness response; no environment or secrets |
| DELETE /auth/sessions/{id} | Document account session revocation | Owner scope, revoked/expired session, 204, CSRF at BFF |
| POST /auth/private/account/verify | Separate internal contract | Trusted BFF, default-off behavior, OTP replay and no PII |
| GET /admin/moderation/cases | Separate privileged contract | Grant, organization scope, MFA, revocation, no-cache |
| POST /admin/session/logout | Separate privileged contract | Session binding, CSRF at BFF, revocation, no-cache |

Internal contract disposition is proposed, not an approval to expose routes. Keep default-off flags until staging sign-off.

## Implementation gate for every operation

1. Inspect existing service, repository and schema before writing a controller; reuse transactional invariants.
2. Agree exact DTO/status/auth and BFF consumer; negative tests for malformed input, unauthenticated and cross-owner access, replay/CSRF where applicable.
3. Add real PostgreSQL HTTP and cross-repository E2E with pinned SHAs and passing CI.
4. Update master checklist evidence; do not close overall parity until scope and all relevant operations are verified.

## Coverage

42 of 42 unmatched operations categorized; G1 identity: 5; G1/G2 seller builder: 12; G3 request lifecycle: 13; G3 calendar: 3; G3 reputation: 5; G3 saved items: 3; G3 geography: 1. No release acceptance items closed.
