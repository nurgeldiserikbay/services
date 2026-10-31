# Non-negotiable business invariants

1. One person has no more than one retained professional profile per canonical profession; archived, hidden, draft or pending deletion profiles block duplicates. Enforce transactionally with DB uniqueness.
2. A specialization is nested under a canonical profession; additional profile creation cannot circumvent the uniqueness rule.
3. Owner of a personal/professional profile is independent of employers. Affiliations cannot change ownership.
4. Both parties must confirm an active affiliation; any party may end it with an audit event. Truthful historical status and dispute handling are explicit.
5. Affiliations do not automatically imply permission to perform all organization services. Service assignments need authorization and may have separate price, availability, seller and validity.
6. Organization/location reviews never silently become professional reviews, and vice versa.
7. A professional review survives employment termination; review target and service-time context are immutable. Fraud/dispute moderation may hide/remove public display under policy.
8. Client data cannot move from an organization to a departing professional merely due to affiliation.
9. Profile layout edits are versioned. Publishing content never rewrites financial, booking, review or legal facts.
10. Archived profiles remain restorable and unique; hidden/paused/archive/delete are distinct states. Pending deletion and erasure respect legal retention and anonymization requirements.
11. Closing a branch does not erase organization or professional histories.
12. A person may have roles as client, professional and organization administrator simultaneously; permissions must be checked per action and resource.
13. Account registration alone does not confer verified-professional or verified-organization status.
14. Recommendations, follows and paid promotion must be distinct from verified customer reviews.
