-- Services · PostgreSQL reference invariants, migration REVIEW REQUIRED.
-- Apply AFTER Prisma-generated baseline migrations; do not execute blindly.
-- This file is a design contract, not evidence of an applied migration.
-- Names match @@map/@map in contracts/prisma/schema.prisma.
--
-- 1. Each offer and request has EXACTLY ONE seller.
ALTER TABLE service_offers
  ADD CONSTRAINT service_offers_seller_xor
  CHECK ((professional_id IS NOT NULL) <> (organization_id IS NOT NULL));
ALTER TABLE service_requests
  ADD CONSTRAINT service_requests_seller_xor
  CHECK ((seller_professional_id IS NOT NULL) <> (seller_organization_id IS NOT NULL));
ALTER TABLE service_requests
  ADD CONSTRAINT service_requests_customer_xor
  CHECK ((customer_person_id IS NOT NULL) <> (guest_contact_id IS NOT NULL));
ALTER TABLE service_requests
  ADD CONSTRAINT service_requests_time_valid
  CHECK (scheduled_start_at IS NULL OR scheduled_end_at IS NULL OR scheduled_end_at > scheduled_start_at);
ALTER TABLE service_offers
  ADD CONSTRAINT service_offers_delivery_mode_valid
  CHECK (delivery_mode IN ('at_location','at_customer','online','hybrid'));

-- 2. Reference semantics and bounded cancellation policy.
ALTER TABLE cancellation_policies
  ADD CONSTRAINT cancellation_policies_window
  CHECK (free_cancel_before_min BETWEEN 0 AND 10080 AND revision > 0);
ALTER TABLE cancellation_snapshots
  ADD CONSTRAINT cancellation_snapshots_window
  CHECK (free_cancel_before_min BETWEEN 0 AND 10080
         AND free_cancel_until <= scheduled_start_at
         AND accepted_at <= scheduled_start_at);
ALTER TABLE busy_blocks
  ADD CONSTRAINT busy_blocks_time_valid CHECK (end_at > start_at);
ALTER TABLE reviews
  ADD CONSTRAINT reviews_target_xor
  CHECK (num_nonnulls(professional_id,organization_id,location_id) = 1);
ALTER TABLE reviews
  ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE reliability_events
  ADD CONSTRAINT reliability_subject_target_match
  CHECK ((subject::text = 'CUSTOMER' AND customer_person_id IS NOT NULL
          AND professional_id IS NULL AND organization_id IS NULL)
      OR (subject::text = 'PROFESSIONAL' AND professional_id IS NOT NULL
          AND customer_person_id IS NULL AND organization_id IS NULL)
      OR (subject::text = 'ORGANIZATION' AND organization_id IS NOT NULL
          AND professional_id IS NULL AND customer_person_id IS NULL));
ALTER TABLE reliability_events
  ADD CONSTRAINT reliability_weight_valid CHECK (weight >= 0);
ALTER TABLE notification_intents
  ADD CONSTRAINT notification_recipient_xor
  CHECK (num_nonnulls(recipient_person_id,recipient_org_id,guest_contact_id) = 1);
ALTER TABLE notification_intents
  ADD CONSTRAINT notification_audience
  CHECK (audience IN ('INITIATOR','COUNTERPARTY'));

-- 3. Conditional uniqueness. An ended affiliation is preserved; only one ACTIVE.
CREATE UNIQUE INDEX IF NOT EXISTS active_affiliation_unique_pair
  ON affiliations (organization_id,professional_id) WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX IF NOT EXISTS active_organization_member_unique
  ON organization_members (organization_id,user_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cancellation_intent_unique_audience
  ON notification_intents (cancellation_id,audience);

-- 4. A person cannot be busy in two contexts simultaneously when the system knows the blocks.
-- Requires privileges for btree_gist extension in the chosen managed Postgres.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE busy_blocks
  ADD CONSTRAINT no_overlapping_known_busy_blocks
  EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(start_at,end_at,'[)') WITH &&
  );

-- 5. Verify route ownership from the canonical ServiceOffer every time.
-- A request's seller and personal/company source cannot be substituted by HTTP client.
CREATE OR REPLACE FUNCTION enforce_request_seller() RETURNS trigger AS $$
DECLARE
  p UUID;
  o UUID;
BEGIN
  SELECT professional_id, organization_id INTO p,o
    FROM service_offers WHERE id=NEW.offer_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown offer' USING ERRCODE='23503'; END IF;
  IF NEW.seller_professional_id IS DISTINCT FROM p
     OR NEW.seller_organization_id IS DISTINCT FROM o THEN
    RAISE EXCEPTION 'Seller must match offer' USING ERRCODE='23514';
  END IF;
  IF (NEW.source_context::text = 'PERSONAL' AND p IS NULL)
     OR (NEW.source_context::text = 'ORGANIZATION' AND o IS NULL) THEN
    RAISE EXCEPTION 'Incorrect source context' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' AND
     (NEW.offer_id IS DISTINCT FROM OLD.offer_id
       OR NEW.customer_person_id IS DISTINCT FROM OLD.customer_person_id
       OR NEW.guest_contact_id IS DISTINCT FROM OLD.guest_contact_id
       OR NEW.source_context IS DISTINCT FROM OLD.source_context
       OR NEW.seller_professional_id IS DISTINCT FROM OLD.seller_professional_id
       OR NEW.seller_organization_id IS DISTINCT FROM OLD.seller_organization_id) THEN
    RAISE EXCEPTION 'Request identity/seller is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER service_requests_seller_guard
  BEFORE INSERT OR UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION enforce_request_seller();

-- Reject changing the seller of an offer with a recorded customer request.
CREATE OR REPLACE FUNCTION guard_offer_seller_change() RETURNS trigger AS $$
BEGIN
  IF (NEW.professional_id IS DISTINCT FROM OLD.professional_id
      OR NEW.organization_id IS DISTINCT FROM OLD.organization_id)
      AND EXISTS (SELECT 1 FROM service_requests WHERE offer_id=OLD.id) THEN
    RAISE EXCEPTION 'Cannot reassign seller of an offered service with requests'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER service_offers_seller_guard
  BEFORE UPDATE OF professional_id,organization_id ON service_offers
  FOR EACH ROW EXECUTE FUNCTION guard_offer_seller_change();

-- Verify company projection belongs to EXACTLY the approved affiliation.
CREATE OR REPLACE FUNCTION enforce_company_view_link() RETURNS trigger AS $$
DECLARE
  a RECORD;
BEGIN
  SELECT organization_id,professional_id,status,specialist_approved_at,company_approved_at
    INTO a FROM affiliations WHERE id=NEW.affiliation_id FOR SHARE;
  IF NOT FOUND OR a.organization_id <> NEW.organization_id
     OR a.professional_id <> NEW.professional_id THEN
    RAISE EXCEPTION 'Company view does not match affiliation'
      USING ERRCODE='23514';
  END IF;
  IF NEW.published_at IS NOT NULL AND
     (a.status::text <> 'ACTIVE'
      OR a.specialist_approved_at IS NULL OR a.company_approved_at IS NULL) THEN
    RAISE EXCEPTION 'Cannot publish view without mutual approval'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER company_views_affiliation_guard
  BEFORE INSERT OR UPDATE ON company_professional_views
  FOR EACH ROW EXECUTE FUNCTION enforce_company_view_link();

-- 6. Each cancellation must atomically enqueue EXACTLY TWO logical intents:
-- the initiator's confirmation and counterparty's notification.
-- Keep per-channel attempts in notification_deliveries, not extra logical intents.
CREATE OR REPLACE FUNCTION validate_cancel_notifications() RETURNS trigger AS $$
DECLARE
  cnt integer;
  initiators integer;
  counterparties integer;
BEGIN
  SELECT count(*),count(*) FILTER (WHERE audience='INITIATOR'),
         count(*) FILTER (WHERE audience='COUNTERPARTY')
    INTO cnt,initiators,counterparties
    FROM notification_intents WHERE cancellation_id=NEW.id;
  IF cnt<>2 OR initiators<>1 OR counterparties<>1 THEN
    RAISE EXCEPTION 'Cancellation requires initiator and counterparty notifications'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER cancellation_two_intents
  AFTER INSERT ON cancellation_events
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION validate_cancel_notifications();

-- 7. Intentionally NOT represented solely as SQL CHECK:
-- * guest OTP + scoped-capability security and consent;
-- * actor access/revocation and conditional time-allocation approval;
-- * cancellation time/grace/reliability eligibility and no-show appeal;
-- * review experience verification;
-- * protection of company field-visibility intersection and cache invalidation.
-- These MUST be transactional server-domain policies with negative tests.
--
-- Migration plan: baseline Prisma migration -> this reviewed SQL -> backfill
-- -> staging EXPLAIN/locks/rollback test -> migrate production under controlled window.
