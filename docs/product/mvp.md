# MVP scope and acceptance

## Release slice
First pilot: a single city and a narrow vertical. All domains allow future expansion without implementing every vertical workflow at launch.

### Included
- Sign up/in and account safety; private personal identity, optional public personal overview.
- Create one professional profile per canonical profession, with biography, specializations, portfolio and offerings.
- Draft, publish, pause service intake, hide, archive and restore; request deletion with clear status.
- Profession-specific page template and safe composable blocks with preview/versioned publishing.
- Organization and location pages, verified ownership/admin roles, team member invitations/acceptance/end.
- Link professionals to particular organizational service offers through consented assignments.
- Search/discovery by service, professional and organization; basic location filter.
- Booking/request with acceptance/decline/completion; protect against repeat requests.
- Verified-service-context professional and organizational reviews with separate targets.
- Opt-in follows and notifications for relevant public updates, including workplace changes.
- Moderation/reporting, basic audit, privacy/terms/consent surfaces.

### Deferred
Complex scheduling, full payment processing, CRM bulk import, referral rewards, loyalty ledger, AI recommendations, marketplace ad auction, real-time chat, advanced analytics.

## Primary end-to-end acceptance
A salon creates its profile and confirms affiliation with a barber; both consent to a specific offered haircut. A client finds the barber through the salon, submits a request, completes a visit and reviews professional and company separately. Barber ends affiliation and joins another company; follower can discover new public workplace; professional review stays on the barber and salon review remains with old salon.

## Reliability acceptance
Repeated create-profile request cannot create duplicates. Consecutive accept clicks are idempotent. Ending affiliation disables future offer assignments but preserves already booked appointment history and triggers explicit rescheduling/cancellation handling. Restore archived page is not a second profile. All edits require resource authorization.

## KPIs (pilot hypotheses)
Active, fully set-up specialist/company profiles; valid affiliations; successful requests/visits; follows; repeat service use; professional retention; customer acquisition cost. Targets set after discovery interviews.
