# API route inventory — 2026-11-23 snapshot (historical filename retained)

Status: source inspection only; **not contract parity or release acceptance**.

Pinned sources: [backend main `59629b57f333` snapshot blob](https://github.com/nurgeldiserikbay/services-back/blob/main/contracts/runtime-route-inventory.json) (runtime source routes) and design OpenAPI in this repository. Historical controller names are preserved from 2026-11-18; any newly indexed route is deliberately labeled **Backend static inventory (controller not re-audited)** until independently inspected. This is a **static AppModule snapshot only**, not proof of route accessibility, DTO/auth parity, global prefix, production activation or staging acceptance.

- Design operations: 65
- Controller route declarations: 46
- Method/path shape matches: 29
- Design operations without a matching inspected declaration: 36
- Inspected declarations without a design operation: 17

## Controller declarations

| Method | Path | Controller | Design shape |
|---|---|---|---|
| DELETE | `/auth/sessions/{id}` | AccountBearerSessionController | Missing |
| GET | `/account/requests` | Backend static inventory (controller not re-audited) | Missing |
| GET | `/admin/moderation/cases` | PlatformModerationReadController | Missing |
| GET | `/auth/sessions` | AccountBearerSessionController | Match only |
| GET | `/geo/areas` | GeographyController | Match only |
| GET | `/geo/cities` | GeographyController | Match only |
| GET | `/geo/countries` | GeographyController | Match only |
| GET | `/health` | HealthController | Missing |
| GET | `/me` | Backend static inventory (controller not re-audited) | Match only |
| GET | `/me/notifications` | PersonInboxController | Match only |
| GET | `/me/professional-profiles` | Backend static inventory (controller not re-audited) | Match only |
| GET | `/me/professional-profiles/{id}/appealable-rejection` | Backend static inventory (controller not re-audited) | Missing |
| GET | `/me/professional-profiles/{id}/preview` | Backend static inventory (controller not re-audited) | Missing |
| GET | `/me/seller-requests` | SellerInboxController | Match only |
| GET | `/organizations/{id}` | PublicProfileController | Match only |
| GET | `/professionals/{slug}` | PublicProfileController | Match only |
| GET | `/professions` | TaxonomyController | Match only |
| GET | `/requests/{id}` | GuestRequestStatusHttpController | Match only |
| GET | `/search` | CatalogController | Match only |
| GET | `/service-definitions` | Backend static inventory (controller not re-audited) | Match only |
| GET | `/service-offers/{id}` | PublicOfferController | Match only |
| PATCH | `/me/professional-profiles/{id}` | Backend static inventory (controller not re-audited) | Match only |
| POST | `/account/requests` | Backend static inventory (controller not re-audited) | Missing |
| POST | `/account/requests/{id}/complete` | Backend static inventory (controller not re-audited) | Missing |
| POST | `/admin/moderation/cases/{id}/decision` | Backend static inventory (controller not re-audited) | Missing |
| POST | `/admin/session/logout` | PlatformAdminLogoutController | Missing |
| POST | `/auth/logout` | AccountBearerSessionController | Match only |
| POST | `/auth/private/account/challenges` | Backend static inventory (controller not re-audited) | Missing |
| POST | `/auth/private/account/verify` | AccountLoginPrivateController | Missing |
| POST | `/guest-requests` | GuestCreateHttpController | Match only |
| POST | `/guest-requests/challenges` | GuestOtpHttpController | Match only |
| POST | `/guest-requests/challenges/{id}/verify` | GuestOtpHttpController | Match only |
| POST | `/guest-requests/{id}/completion/challenges` | Backend static inventory (controller not re-audited) | Missing |
| POST | `/guest-requests/{id}/completion/challenges/{challengeId}/verify` | Backend static inventory (controller not re-audited) | Missing |
| POST | `/guest-requests/{id}/completion/confirm` | Backend static inventory (controller not re-audited) | Missing |
| POST | `/guest-requests/{requestId}/schedule-access/challenges` | GuestScheduleAccessHttpController | Match only |
| POST | `/guest-requests/{requestId}/schedule-access/challenges/{challengeId}/verify` | GuestScheduleAccessHttpController | Match only |
| POST | `/me/professional-profiles` | Backend static inventory (controller not re-audited) | Match only |
| POST | `/me/professional-profiles/{id}/appeals` | Backend static inventory (controller not re-audited) | Missing |
| POST | `/me/professional-profiles/{id}/publish` | Backend static inventory (controller not re-audited) | Missing |
| POST | `/requests/{id}/accept` | SellerDecisionHttpController | Match only |
| POST | `/requests/{id}/cancel` | Backend static inventory (controller not re-audited) | Match only |
| POST | `/requests/{id}/decline` | SellerDecisionHttpController | Match only |
| POST | `/requests/{id}/schedule-proposals` | ScheduleProposalHttpController | Match only |
| POST | `/requests/{id}/schedule-proposals/{proposalId}/confirm` | ScheduleProposalHttpController | Match only |
| POST | `/requests/{id}/schedule-proposals/{proposalId}/decline` | ScheduleProposalHttpController | Match only |

## Design operations without matching declaration

| Method | Path |
|---|---|
| POST | `/auth/challenges` |
| POST | `/auth/challenges/{id}/verify` |
| POST | `/auth/refresh` |
| POST | `/auth/logout-all` |
| POST | `/organizations` |
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
| POST | `/me/professional-profiles/{id}/lifecycle` |
| POST | `/organizations/{id}/affiliation-invites` |
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
