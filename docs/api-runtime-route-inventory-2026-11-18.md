# API route inventory — 2026-11-18

Status: source inspection only; **not contract parity or release acceptance**.

Pinned sources: [backend f306742](https://github.com/nurgeldiserikbay/services-back/tree/f30674204571a8993d21e2a852c44dc3e111f25f), [design OpenAPI 88b402e](https://github.com/nurgeldiserikbay/services/blob/88b402ed0bbff4ed9e7af1a98deb0e4ea6b0ec5a/contracts/openapi.yaml). Inspected controllers listed in AppModule and its directly imported feature modules; compared HTTP method and relative route template, normalizing parameter names only. Global prefix, conditional availability, authorization, schema and actual HTTP behavior are not established by this comparison.

- Design operations: 65
- Controller route declarations: 28
- Method/path shape matches: 23
- Design operations without a matching inspected declaration: 42
- Inspected declarations without a design operation: 5

## Controller declarations

| Method | Path | Controller | Design shape |
|---|---|---|---|
| GET | `/health` | HealthController | Missing |
| GET | `/search` | CatalogController | Match only |
| GET | `/professions` | TaxonomyController | Match only |
| GET | `/professionals/{slug}` | PublicProfileController | Match only |
| GET | `/organizations/{id}` | PublicProfileController | Match only |
| GET | `/geo/countries` | GeographyController | Match only |
| GET | `/geo/areas` | GeographyController | Match only |
| GET | `/geo/cities` | GeographyController | Match only |
| GET | `/service-offers/{id}` | PublicOfferController | Match only |
| POST | `/requests/{id}/accept` | SellerDecisionHttpController | Match only |
| POST | `/requests/{id}/decline` | SellerDecisionHttpController | Match only |
| POST | `/requests/{id}/schedule-proposals` | ScheduleProposalHttpController | Match only |
| POST | `/requests/{id}/schedule-proposals/{proposalId}/decline` | ScheduleProposalHttpController | Match only |
| POST | `/requests/{id}/schedule-proposals/{proposalId}/confirm` | ScheduleProposalHttpController | Match only |
| GET | `/me/seller-requests` | SellerInboxController | Match only |
| GET | `/requests/{id}` | GuestRequestStatusHttpController | Match only |
| POST | `/guest-requests` | GuestCreateHttpController | Match only |
| GET | `/auth/sessions` | AccountBearerSessionController | Match only |
| DELETE | `/auth/sessions/{id}` | AccountBearerSessionController | Missing |
| POST | `/auth/logout` | AccountBearerSessionController | Match only |
| POST | `/guest-requests/{requestId}/schedule-access/challenges` | GuestScheduleAccessHttpController | Match only |
| POST | `/guest-requests/{requestId}/schedule-access/challenges/{challengeId}/verify` | GuestScheduleAccessHttpController | Match only |
| GET | `/me/notifications` | PersonInboxController | Match only |
| POST | `/auth/private/account/verify` | AccountLoginPrivateController | Missing |
| POST | `/guest-requests/challenges` | GuestOtpHttpController | Match only |
| POST | `/guest-requests/challenges/{id}/verify` | GuestOtpHttpController | Match only |
| GET | `/admin/moderation/cases` | PlatformModerationReadController | Missing |
| POST | `/admin/session/logout` | PlatformAdminLogoutController | Missing |

## Design operations without matching declaration

| Method | Path |
|---|---|
| POST | `/auth/challenges` |
| POST | `/auth/challenges/{id}/verify` |
| POST | `/auth/refresh` |
| POST | `/auth/logout-all` |
| GET | `/service-definitions` |
| POST | `/organizations` |
| PATCH | `/me/professional-profiles/{id}` |
| PUT | `/professional-profiles/{id}/company-views/{organization_id}/permissions` |
| PUT | `/organizations/{id}/professionals/{profile_id}/view` |
| POST | `/service-offers` |
| PATCH | `/service-offers/{id}` |
| POST | `/requests` |
| POST | `/requests/{id}/complete` |
| PATCH | `/requests/{id}/schedule` |
| GET | `/me/requests` |
| GET | `/me/availability-allocations` |
| PUT | `/me/availability-allocations` |
| GET | `/public-availability` |
| DELETE | `/me/saved-items/{id}` |
| GET | `/me` |
| GET | `/me/professional-profiles` |
| POST | `/me/professional-profiles` |
| POST | `/me/professional-profiles/{id}/lifecycle` |
| POST | `/organizations/{id}/affiliation-invites` |
| POST | `/requests/{id}/cancel` |
| GET | `/requests/{id}/cancellation-preview` |
| GET | `/service-offers/{id}/cancellation-policy` |
| PUT | `/service-offers/{id}/cancellation-policy` |
| GET | `/me/reliability` |
| GET | `/sellers/{kind}/{id}/reliability` |
| POST | `/reliability-events/{id}/appeal` |
| GET | `/me/saved-items` |
| POST | `/me/saved-items` |
| GET | `/organizations/{id}/professionals/{profile_id}` |
| POST | `/experiences/{id}/reviews` |
| GET | `/geo/suggestion` |
| POST | `/requests/{id}/no-show-claims` |
| POST | `/requests/{id}/no-show-claims/{claimId}/response` |
| POST | `/admin/no-show-claims/{claimId}/decision` |
| POST | `/guest-requests/recovery/challenges` |
| POST | `/guest-requests/recovery/challenges/{id}/verify` |
| POST | `/guest-requests/recovery/requests/{id}/session` |

## Next verification gates

1. Classify unmatched design operations as mandatory, deferred or intentionally internal; obtain product/security approval rather than removing them to inflate readiness.
2. For every runtime-only route, record exposure, feature flag, auth and response schema; keep private routes disabled until authorized acceptance. In particular, inspect private account verify, admin moderation and logout, and session revocation.
3. For matched routes, verify exact path parameter names (schedule access currently differs), request/response DTOs, HTTP status, security, BFF consumers and live PostgreSQL HTTP tests. GET /requests/{id} is currently declared by the guest status controller; a path match does not prove account request semantics.
4. Add pinned cross-repository E2E evidence and an automated drift gate before closing API contract parity. Do not expose internal cancellation or admin MFA solely to match the design.

Historical integration evidence: [backend CI](https://github.com/nurgeldiserikbay/services-back/actions/runs/44088086157), [frontend CI](https://github.com/nurgeldiserikbay/services-front/actions/runs/44088031282), [admin CI](https://github.com/nurgeldiserikbay/services-admin/actions/runs/43854510440). These runs predate the pinned backend commit and are not proof of its complete route parity.
