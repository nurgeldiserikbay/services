# Services — product & architecture documentation

Source of truth for the multi-profession services platform: independent personal and professional profiles, organizations, affiliations, service offers, bookings, reviews, and page composition.

## Repositories
- [services](https://github.com/nurgeldiserikbay/services): product, business rules, API contracts, architecture, decisions.
- [services-back](https://github.com/nurgeldiserikbay/services-back): backend.
- [services-admin](https://github.com/nurgeldiserikbay/services-admin): platform administration.
- [services-front](https://github.com/nurgeldiserikbay/services-front): website, PWA, Capacitor Android/iOS.

## Core rules
1. A user can represent one person and manage multiple professional profiles; **at most one profile per person per canonical profession**, across draft, active, hidden, archived and pending-deletion states.
2. Every professional profile has its own services, portfolio, reviews and followers. The public personal profile can show selected professional profiles.
3. Organizations and locations have independent profiles and reputation.
4. A confirmed affiliation connects a professional profile to an organization/location; it does **not** transfer ownership of the profile.
5. A service assignment links the professional to a specific company offer. Affiliation alone is not permission to deliver all company services.
6. A review targets the service professional and/or organization/location separately, based on a concrete service experience. Professional reviews remain with the professional profile when an affiliation ends.
7. Profile lifecycle, historical revisions, review integrity, privacy and data retention require explicit rules and audit trails.

## Documentation
Start with [product vision](docs/product/vision.md), [domain model](docs/domain/model.md), [invariants](docs/domain/invariants.md), [MVP](docs/product/mvp.md) and [development policy](docs/engineering/collaboration.md).

Status: architecture and discovery groundwork, **not** production-ready or implemented features. Working project name: Services (brand not finalized).
