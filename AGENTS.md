# AGENTS.md — Services documentation

## Mission
This repo is the authoritative human + AI product and architecture specification for the Services platform. All four repositories must follow the same domain invariants and API definitions. HTML is generated from Markdown; never edit index.html alone.

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
