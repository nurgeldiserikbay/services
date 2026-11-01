-- Real PostgreSQL smoke tests for Prisma baseline + constraints.sql.
-- A single transaction intentionally rolls back all fixture rows.
-- This does NOT replace comprehensive concurrency, auth, privacy or migration tests.
BEGIN;
DO $smoke$
DECLARE
  owner_user UUID := gen_random_uuid();
  owner_person UUID := gen_random_uuid();
  customer_user UUID := gen_random_uuid();
  customer_person UUID := gen_random_uuid();
  profession_id UUID := gen_random_uuid();
  professional_id UUID := gen_random_uuid();
  service_id UUID := gen_random_uuid();
  personal_offer UUID := gen_random_uuid();
  company_id UUID := gen_random_uuid();
  bad_offer UUID := gen_random_uuid();
  request_id UUID := gen_random_uuid();
  cancellation_id UUID := gen_random_uuid();
  busy_id UUID := gen_random_uuid();
  did_reject BOOLEAN;
BEGIN
  INSERT INTO users(id,email) VALUES(owner_user,'owner-smoke@example.invalid'),(customer_user,'client-smoke@example.invalid');
  INSERT INTO persons(id,user_id) VALUES(owner_person,owner_user),(customer_person,customer_user);
  INSERT INTO professions(id,code,name) VALUES(profession_id,'smoke-electrician','Electrician');
  INSERT INTO professional_profiles(id,person_id,profession_id,slug)
    VALUES(professional_id,owner_person,profession_id,'smoke-electrician');
  INSERT INTO service_definitions(id,code,name) VALUES(service_id,'smoke-install','Install');
  INSERT INTO organizations(id,owner_person_id,slug,name)
    VALUES(company_id,owner_person,'smoke-org','Smoke company');

  -- Offer must have exactly one seller, not zero.
  did_reject := false;
  BEGIN
    INSERT INTO service_offers(id,definition_id,title,delivery_mode,contacts)
      VALUES(bad_offer,service_id,'Broken','online','{}'::jsonb);
  EXCEPTION WHEN check_violation THEN
    did_reject := true;
  END;
  IF NOT did_reject THEN RAISE EXCEPTION 'XOR offer guard did not reject'; END IF;

  INSERT INTO service_offers(id,definition_id,professional_id,title,delivery_mode,contacts)
    VALUES(personal_offer,service_id,professional_id,'Personal installation','online','{}'::jsonb);

  -- User's professional profile is unique per profession, including archived.
  did_reject := false;
  BEGIN
    INSERT INTO professional_profiles(id,person_id,profession_id,slug,status)
      VALUES(gen_random_uuid(),owner_person,profession_id,'smoke-duplicate','ARCHIVED');
  EXCEPTION WHEN unique_violation THEN
    did_reject := true;
  END;
  IF NOT did_reject THEN RAISE EXCEPTION 'Professional unique key did not reject duplicate'; END IF;

  -- Request seller must correspond exactly to the offer.
  did_reject := false;
  BEGIN
    INSERT INTO service_requests(id,offer_id,customer_person_id,source_context,seller_organization_id)
      VALUES(request_id,personal_offer,customer_person,'PERSONAL',company_id);
  EXCEPTION WHEN check_violation THEN
    did_reject := true;
  END;
  IF NOT did_reject THEN RAISE EXCEPTION 'Request seller trigger did not reject wrong seller'; END IF;

  INSERT INTO service_requests(id,offer_id,customer_person_id,source_context,seller_professional_id,status,scheduled_start_at,scheduled_end_at)
    VALUES(request_id,personal_offer,customer_person,'PERSONAL',professional_id,'ACCEPTED',
      '2030-01-01 10:00:00+00','2030-01-01 11:00:00+00');

  INSERT INTO busy_blocks(id,professional_id,request_id,start_at,end_at,context)
    VALUES(busy_id,professional_id,request_id,'2030-01-01 10:00:00+00','2030-01-01 11:00:00+00','PERSONAL');

  did_reject := false;
  BEGIN
    INSERT INTO busy_blocks(id,professional_id,start_at,end_at,context)
      VALUES(gen_random_uuid(),professional_id,'2030-01-01 10:30:00+00','2030-01-01 11:30:00+00','ORGANIZATION');
  EXCEPTION WHEN exclusion_violation THEN
    did_reject := true;
  END;
  IF NOT did_reject THEN RAISE EXCEPTION 'Busy overlap GiST did not reject'; END IF;

  -- A contiguous interval is allowed, even if it belongs to another context.
  INSERT INTO busy_blocks(id,professional_id,start_at,end_at,context)
    VALUES(gen_random_uuid(),professional_id,'2030-01-01 11:00:00+00','2030-01-01 12:00:00+00','PERSONAL');

  UPDATE service_requests SET status='CANCELLED_BY_CUSTOMER',version=version+1 WHERE id=request_id;
  DELETE FROM busy_blocks WHERE id=busy_id;
  INSERT INTO cancellation_events(id,request_id,actor,reason_code)
    VALUES(cancellation_id,request_id,'CUSTOMER','changed_plans');
  INSERT INTO notification_intents(id,cancellation_id,recipient_person_id,audience,channel,dedupe_key)
    VALUES(gen_random_uuid(),cancellation_id,customer_person,'INITIATOR','in_app','smoke-confirm'),
          (gen_random_uuid(),cancellation_id,owner_person,'COUNTERPARTY','in_app','smoke-other');

  -- Real DB checks the deferred "exactly two" trigger at constraint evaluation.
  SET CONSTRAINTS cancellation_two_intents IMMEDIATE;

  IF (SELECT count(*) FROM notification_intents WHERE cancellation_id = (SELECT id FROM cancellation_events WHERE request_id=request_id)) <> 2 THEN
    RAISE EXCEPTION 'Expected two notification intents';
  END IF;
  RAISE NOTICE 'Postgres smoke passed: seller XOR, profile unique, seller routing, busy overlap, two intents';
END
$smoke$;
ROLLBACK;
