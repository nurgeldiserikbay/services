# Domain model

The following is a logical model, not finalized persistence DDL.

| Entity | Meaning |
|---|---|
| User | Authentication and session subject |
| Person | Individual identity underlying public and professional profiles |
| PersonalProfile | Optional public overview of selected professional identities |
| Profession | Canonical taxonomy entry with stable ID and parent/specialization relations |
| ProfessionalProfile | One professional identity for one person and one canonical profession |
| Organization | Business legal/operational identity |
| OrganizationLocation | Branch or service location |
| Affiliation | Confirmed professional-to-organization relationship with start/end and category |
| ServiceDefinition | Canonical service taxonomy |
| ServiceOffer | Marketable service, price/policy/seller/location |
| ServiceAssignment | Professional authorized for a particular organization offer, with consent and validity |
| Booking | Client service request/appointment and state transitions |
| ServiceExperience | Recorded service occurrence, professional, company/location, and booking reference |
| Review | Target-specific assessment of professional profile, organization or location tied to eligible experience |
| Follow | Client's opt-in follow of a chosen profile or location |
| PageTemplate / PageBlock / ProfileRevision | Profession-specific page layout and immutable published revision |
| Credential / Verification | Professional documentation and verification outcome |
| AccessGrant | Delegated management permissions |
| AuditEvent | Durable trace of consequential actions |

## Relationships
One User may manage one Person and multiple Organizations through explicit roles. Person 1:N ProfessionalProfiles, with uniqueness (person_id, profession_id) for all retained profile states. Organization 1:N Locations. ProfessionalProfile N:M Organization through Affiliation. Professionals join offers via ServiceAssignment; employment does not automatically grant service assignment.

## Reputation ownership
Review targets must be explicit, immutable identifiers. The same experience can lead to separate professional and company reviews. Affiliation ending has no cascading deletion of professional reviews.

## Service accountability
Offer identifies seller, service location and individual provider(s) where applicable. Customer-facing terms must explain responsible contracting party and applicable return/cancellation rules.

## Privacy
Personal profile can reveal selected professions only. Professional profiles never automatically expose all occupations or private contact details. Customer records of company A are not accessible through company B by virtue of an affiliation.
