# Services · UX specification for MVP (web, PWA, Android/iOS)
**Status:** v0.8 design contract for humans and coding agents, not approved visual mockups. Product: [chapter 01](../ru/01-product.md); domain: [ADR-0003](../adr/0003-simple-booking-company-view.md); cancellation: [ADR-0004](../adr/0004-cancellation-reliability-and-defaults.md).

## General UX principles
- Mobile-first, bright, light, calm, high contrast and fast. Search is the product's front door; **never open with a blocking sign-in**. Screen must distinguish actual service from profession and company.
- Country/city selector always discoverable, never silently switches manually chosen region due to IP/VPN; location permission only for explicit "Nearby".
- Header sticky; SSR public offer/profile and category pages with stable URLs and SEO. Progressive disclosure: don't show calendar controls on offers that didn't enable calendar; don't show a price value if seller didn't publish one.
- Search and profile should not load admin, editor, auth-provider SDKs, maps, analytics dashboard or calendar JS until explicitly needed.
- Safe links only from allowlist: `tel:`, `https://wa.me/` (after canonical numeric validation), vetted `https:` URLs. Don't expose private phone if seller didn't allow publication.
- Responsive CSS, 44×44 touch targets, keyboard navigation, semantics, screen-reader labels, kk/ru strings, RTL architecture optional later, reduced-motion support.
- One account can act as client, professional and company owner; workspace selector explicit, but user never signs in twice.

## Required screens and minimum content

| Screen ID | Public/role | Main content and primary CTA | States / risks |
| --- | --- | --- | --- |
| UX-01 Home | Guest/public | Search prompt, city selector, major categories and nearby examples; no mandatory login | Detect approximate city, unknown city, slow network, no results |
| UX-02 Search | Guest/public | Filter by actual service, category, city, delivery mode, online, price **only when provided**; organic/ad labels | Loading, filters, zero results, explicit expand geography, cursor |
| UX-03 Service Offer | Guest/public | Seller identity, company vs specialist, service, media, location/coverage, contact methods and cancellation terms when booking | Inactive offer, unsafe contact, no availability, anonymous CTA |
| UX-04 Independent Professional | Guest/public | Professional biography, services as independent seller, portfolio, independent reviews, optional own schedule, affiliations | Public data privacy, archived profile, distinct CTA receiver |
| UX-05 Organization | Guest/public | Company's brand, locations, services, team cards, company reviews and booking CTA | Multiple branches, company closed, no active assignments |
| UX-06 Professional inside company | Guest/public | Company visual style, permitted master fields ∩ company-selected fields, corporate offer/contact | No duplicate profile, redacted image after revoke, CTA MUST route to company |
| UX-07 Guest Request | Guest | Minimal note, optional preferred time, contact, OTP, consent, clear seller and cancellation policy | OTP expired, spam/rate-limit, retry, duplicate submit, no phantom account |
| UX-08 Booking Request Result | Guest/customer | Pending/accepted/declined/cancelled/completed with seller/slot and allowed actions; secure status link guest | No token in URL/logs; account-only access otherwise |
| UX-09 Cancellation | Guest/customer/seller | Who cancels, deadline and local time, warning if reliability may change; final confirmation and notifications status | Pending, on-time/late, no slot, guest, seller, concurrent change, non-delivery |
| UX-10 Customer cabinet | Signed-in | Saved professionals/companies/offers, subscriptions, personal requests/history, own reliability and appeals | Empty state, no privacy leak, never list other customers |
| UX-11 Professional editor | Professional | Personal profile blocks, independent service offers, contacts, company affiliation grants and local availability | Draft, publish, cache invalidation, field-level permissions |
| UX-12 Company dashboard | Owner/operator | Corporate offers, locations, team permissions, service requests, calendar and metrics | Role-scoped branch, employee exit, claim disputes, owner loss |
| UX-13 Two-sided company view editor | Professional & company (distinct editors) | Professional grants fields to company; company chooses a subset and branding | Permission revoked, async revision, unavailable fields never render |
| UX-14 Work allocation calendar | Professional/company | Day/week split (personal/company A/company B) and private busy intervals; display toggle | DST, overlap, unknown outside bookings, no personal details to company |
| UX-15 Notifications | Signed-in/guest via verified channel | Cancellation accepted/rejected/changed, event history and delivery status | Retry pending, provider failed, communication consent, accessible links |
| UX-16 Admin moderation | Platform roles | Verifications, abuse reports, appeals, restricted country/category activation and audit | MFA, scoped privacy, no direct DB bypass, human review |

## Detailed flows and wireframe descriptions

### A. Guest: search → contact/request
**Top row:** small Services brand, visible location chip "Karaganda, Kazakhstan ▾", language switch, optional discreet sign-in. **Search row:** "What service do you need?" + search action, category chips, optional price/online and distance only when relevant. **Results:** cards clearly labelled "Independent professional", "Company" or "Service"; price optional, location/coverage explicit, review count and verified indicators separate. Avoid showing 5.0 for zero reviews.

On detail page **sticky bottom action on mobile** where useful: "Call", "WhatsApp", or "Send request" according to seller's settings. Login is never necessary to **view** an offer or use the published phone/WhatsApp channel. Guest in-platform request requires verified contact, not full registration.

### B. The same person shown personally and inside company
On professional independent page: personal hero, professional name, professions and real reviews, private offers and optional calendar. Affiliated companies can appear as explicit navigation with company name. The independent CTA names the master.

On company page: team card uses company colors/layout, but data comes from single professional profile; company can add branch/role/offer and choose an allowed subset of fields. The CTA says "**Request at [Company Name]**", not "Book this professional personally". Clicking through to the master's personal page changes context only via explicit user action and shows different CTA. On affiliation termination company card disappears (cache purge), master public profile remains.

### C. Seller chooses communication and schedule
Seller's offer creation uses three short steps: "What do you offer?" → "How clients reach you?" (phone/WhatsApp/request/slots, select any working channel) → "Publish". Date availability and indicative price are optional. More settings are behind "Advanced": cancel window, per-context calendar visibility, recurrent company hours/personal hours.

Calendar makes no promise about external appointments; provide a quick "Mark busy" after phone. Multiple context allocations are agreed by master and relevant company. If an existing busy block conflicts, only show **Unavailable**, never reveal the other seller/client's data.

### D. Cancellation and reliability
- Before confirmed booking, show seller's cancellation window and **exact deadline** once a date is known (country timezone).
- On cancel confirmation, give plain-language outcome: "Cancel without impact" or "Cancelling now may reduce your reliability". Never force a reason or sensitive health details.
- After action, show "Booking cancelled" and independent status "Notification queued" (not "SMS delivered" without confirmation).
- Seller cancellation reduces seller reliability of master/company scope, not assigned staff. Quality-review stars don't change. Exemptions and appeals must be accessible.
- New user with too little reliable data sees "Not enough history", never an unearned 100/100 badge.

## State machine for all actionable controls
Each action supports `idle → pending → success / validation_error / permission_denied / conflict / offline / expired`. Disable duplicate clicks while pending but still use backend idempotency; abort obsolete search requests, never abort a committed cancellation just because a user closed the page. If 409 version conflict, refresh server state and explain; don't retry non-idempotent writes with a new key automatically.

## Privacy and trust copy
- Explain what "verified experience" actually means, never conflate authenticated login with confirmed service.
- Show seller identity and request receiver before submit, never silently transfer a request.
- Customer saved pages are private. Seller analytics count real visits/requests separately from contact clicks and use privacy-preserving aggregates.
- Ads labelled, different from organic rankings. Public profile not indexed if paused/archived, revoked company permissions invalidate public CDN cache.
- Each geo locale/country may restrict bookable categories until legal enablement. Do not show unavailable/regulated offer as purchasable merely because it exists in database.

## Acceptance checklist for UX review
1. Guest finds service, changes city, clicks WhatsApp without login.
2. Guest sends request with OTP; clear pending; seller accepts/declines.
3. Master personal CTA and same master's company card route to different **correct** sellers.
4. Both parties control company fields; revoked field disappears even from SSR caches.
5. Master works company hours by day, independently in evening, with no leak of other context.
6. On-time and late cancellation explain separate reliability effect; **both parties notified**.
7. Signed-in client saves provider, sees history, but seller never sees private saved list.
8. Mobile, tablet, desktop, keyboard, screen-reader, kk/ru, network failure and back navigation tested.

## Remaining design assets and sign-off
This is a **screen specification**, not a pixel-perfect interactive prototype. Before implementation sign-off, produce Figma/mobile visual prototypes, usability review and confirm real text length in kk/ru. Do not claim UX approved on the strength of this file alone.
