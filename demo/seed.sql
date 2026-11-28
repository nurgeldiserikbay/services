BEGIN;
DO $$ BEGIN
 IF current_database() <> 'services_demo' THEN RAISE EXCEPTION 'Demo database required'; END IF;
END $$;
INSERT INTO users(id) VALUES ('10000000-0000-4000-8000-000000000001') ON CONFLICT DO NOTHING;
INSERT INTO persons(id,user_id,display_name) VALUES ('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Demo specialist') ON CONFLICT DO NOTHING;
INSERT INTO professions(id,code,name) VALUES ('10000000-0000-4000-8000-000000000003','demo-tutor','Репетитор / Мұғалім') ON CONFLICT DO NOTHING;
INSERT INTO service_definitions(id,code,name) VALUES ('10000000-0000-4000-8000-000000000004','demo-lesson','Онлайн сабақ / Онлайн урок') ON CONFLICT DO NOTHING;
INSERT INTO profession_services(profession_id,service_id) VALUES ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000004') ON CONFLICT DO NOTHING;
INSERT INTO professional_profiles(id,person_id,profession_id,slug,status,title) VALUES ('10000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','demo-specialist','PUBLISHED','Demo: Математика мұғалімі') ON CONFLICT DO NOTHING;
INSERT INTO organizations(id,owner_person_id,slug,name,status) VALUES ('10000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000002','demo-company','Demo: Оқу орталығы','ACTIVE') ON CONFLICT DO NOTHING;
INSERT INTO service_offers(id,definition_id,professional_id,title,status,delivery_mode,contacts) VALUES ('10000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000005','Demo: Математика сабағы','PUBLISHED','online','{}'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO service_offers(id,definition_id,organization_id,title,status,delivery_mode,contacts) VALUES ('10000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000006','Demo: Онлайн курс','PUBLISHED','online','{}'::jsonb) ON CONFLICT DO NOTHING;
COMMIT;
