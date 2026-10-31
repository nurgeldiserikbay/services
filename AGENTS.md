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
