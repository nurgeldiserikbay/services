# AGENTS.md — Services documentation

## Mission
This repo is the authoritative human + AI product and architecture specification for the Services platform. All four repositories must follow the same domain invariants and API definitions. HTML is generated from Markdown; never edit index.html alone.

## v0.6 source-of-truth precedence
1. docs/ru/01-product.md — canonical current product blueprint, not older appended drafts.
2. docs/ru/12-roadmap-decisions.md — ACCEPTED/OPEN/DEFERRED + technical gate. Unresolved business choices must not be improvised by an agent.
3. docs/adr/0003-simple-booking-company-view.md — binding owner decision: simple seller-accepted requests, optional calendar, two-sided company views, no Quote or price negotiation.
4. docs/ru/22-delivery-roadmap.md — actual implementation phases and Definition of Done.
5. Other chapters and draft contracts provide implementation detail; when inconsistent, resolve and document before coding.
Do not claim code is implemented or legal requirements are satisfied merely because docs say so.

## Start here
1. README.md
2. docs/ru/13-functional-catalog.md (requirement IDs)
3. docs/ru/01-product.md and docs/ru/02-identities-lifecycle.md
4. docs/ru/03-organizations-services.md and docs/ru/04-booking-reviews.md
5. docs/ru/15-permissions-matrix.md, docs/ru/16-state-machines.md
6. docs/ru/17-database-design.md, docs/ru/18-api-design.md, contracts/openapi.yaml
7. docs/ru/19-frontend-design-system.md / 20-backend-implementation.md / 21-admin-operations.md
8. docs/ru/22-delivery-roadmap.md, 23-quality-tests-release.md, 25-ai-development.md, 26-acceptance-checklist.md

## Global discovery decision
- Read docs/adr/0002-global-local-discovery.md, docs/ru/13-functional-catalog.md (GEO-01..10) and chapter 14 (J-08..12).
- Services is globally addressable, but anonymous clients see selected/estimated local city by default. Manual city/country overrides IP, language and automatic location inference.
- Never require login or GPS for browsing, searching, or viewing publicly shared seller contacts. GPS only on explicit consent; show city switcher and global/online options.
- Organizations/professionals can publish their actual service areas and delivery modes. Expansion beyond local region must be obvious.
- Market rollout can start in one city without hard-coding country boundaries in schemas or frontend.

## Diagrams and source of truth
- Read editable diagrams in docs/diagrams/platform-overview.mmd, order-lifecycle.mmd, technical-architecture.mmd for overall workflows; the equivalent SVG files under assets/ are embedded in docs/ru/01, 04 and 20 for people.
- Keep business rules in Markdown authoritative over diagrams; update both SVG and Mermaid when changing a relationship.
- Every ServiceOffer has exactly one seller (independent specialist OR company); person performing a company's job does not automatically own the client's order.
- Seller chooses intake methods and whether workload/calendar is visible. Booking slots are optional, and direct contact is not a confirmed booking.
- A guest may initiate an inquiry, but verified public reviews require authenticated author and verified experience.
- Public read cache/CDN and private transactional endpoints have different cache/privacy policies; country-specific legal enablement is required before regulated services and cross-border personal-data processing.

## Owner-approved simplified booking model — ADR-0003 (2026-11-01)
- Read docs/adr/0003-simple-booking-company-view.md before implementing offers, booking, calendars, professional-company pages, analytics, customer accounts.
- **Do not implement Quote / price negotiation / mandatory pricing / forced calendars.** Guest/authenticated user sends a simple request; the seller accepts/declines; cancellation and manually recording busy time are supported.
- Requests initiated on a professional's **independent** page belong to that professional. Requests initiated on a **company** page, including the embedded professional card, belong to the company. Never silently change seller.
- One canonical professional profile per profession. CompanyProfessionalView is a two-sided projection: professional allowlist AND company selection AND platform rule. No cloning profiles/reviews, no leaking personal contacts/schedule.
- Work allocations may be company hours in daytime and independent hours in evening; conflict detection on *known* platform bookings and minimal busy-only privacy across contexts.
- Registered consumers get saved pages and private history; public search, click-to-contact and verified guest requests stay accessible without accounts. Analytics must distinguish page views, contact clicks, actual requests and uniquely identified registered consumers.
- ADR-0003 supersedes old draft references to Quote, price negotiation, mandatory accepted snapshots of price and former Booking state enums.

## Hard invariants
- One Person has at most one retained ProfessionalProfile per canonical Profession, including draft/hidden/archived.
- Professional, company and branch reviews target separate immutable entities; they do not transfer with employment changes.
- Organization Affiliation and consented ServiceAssignment are separate relationships.
- A company does not own a person's professional identity, followers, reviews or personal client data.
- Profile lifecycle and draft revisions cannot rewrite completed bookings, reviews, verified service experiences or past commercial snapshots.
- Authorization/ownership checks must be enforced by backend on every resource.
- Privacy, regulated credentials and Kazakhstan data residency must be reviewed before launch.

## Editing contract
- All functional changes require documented actor, preconditions, happy/alternative paths, permissions, states, error handling, localization, acceptance tests and affected components.
- Update source Markdown; then run `node scripts/build-site.mjs`; include generated index.html. CI checks the output.
- Keep consistent with ADR. For API changes, update contracts/openapi.yaml and all generated client plans.
- Use feature branches and PRs for parallel work unless owner explicitly directs otherwise. Do not self-merge or declare tests passed without proof.
- Never commit credentials, secrets, customer PII or non-consensual images.
- Do not represent design docs as implemented production features.

## Recommended stacks
services-back NestJS + TypeScript + PostgreSQL/Prisma modular monolith; services-admin Next.js; services-front Next.js SSR/PWA and React/Vite/Capacitor mobile in pnpm workspace; kk/ru initially, en-ready.

## Product decisions v0.7: cancellation and reliability
- Read docs/adr/0004-cancellation-reliability-and-defaults.md and docs/ru/12-roadmap-decisions.md. OPEN-01..14 now have design defaults, not proof of production readiness.
- Each independent seller/company configures the **customer cancellation grace window** per offer. Snapshot on accepted request with mutually known time; never retroactively change existing records.
- Cancelling pending or cancelling in time does not penalize customer. Late cancellation by authenticated customer affects **customer reliability**, provider cancellation affects **seller reliability** of independent professional OR company; not the professional assigned by company automatically. Keep quality review stars separate.
- For **every** cancelled request, create **two** transactional notification intents (initiator and counterparty), then asynchronously deliver with retries and status. Cancellation remains effective if SMS fails.
- Appeals and explainability; no-show requires review; don't block account or apply monetary penalty based on reliability score.
- Diagram in docs/diagrams/cancellation-reliability.mmd and assets/cancellation-reliability.svg. Legal/data residency/country checks remain launch gates, not settled by Markdown.

## Implementation references v0.8
- Design DB: contracts/prisma/schema.prisma (Prisma reference), contracts/prisma/constraints.sql (PG migration safeguards), contracts/prisma/test-cases.md (negative/concurrency tests), contracts/prisma/README.md (non-deployed design status). Never assume the reference was migrated.
- Design API: contracts/openapi.yaml, contracts/api-mvp-matrix.md; unresolved gaps require contract decisions, not backend improvisation. Legacy /bookings is deprecated, canonical ServiceRequest.
- UX contract for client/seller/admin: docs/ux/mvp-screen-contracts.md. This is a behavior spec, not approved visual mockups; design review remains necessary.
- GitHub Actions contracts.yml validates Prisma syntax and Redocly OpenAPI reference bundling, not execution of PostgreSQL SQL, ACL, or legal compliance.

## Modular architecture and performance v0.8
Read docs/architecture/modular-boundaries.md before implementing cross-module changes. Each module owns its write model; public search/SSR must be cached separately from private guest requests, auth, cancellations and analytics. Cancellation is one transaction (status + busy release + event + exactly two logical notification intents), followed by async delivery; do not create notification sends inside a DB transaction. Use PostgreSQL constraints and idempotency to handle races, and show no foreign-context busy details. Search and listing are thin lazy routes; no payment or Quote workflow.
