-- =====================================================================
-- Rôles de l'administration (à lancer après 10_scenarios.sql, sur la même base).
-- =====================================================================
\set QUIET on
\pset tuples_only on
\o /dev/null
set client_min_messages = notice;

select tst.as_postgres();
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'finance@monganga.test', '{"first_name":"Fanny","last_name":"Finance"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'support@monganga.test', '{"first_name":"Serge","last_name":"Support"}'),
  ('00000000-0000-0000-0000-0000000000f3', 'valid@monganga.test', '{"first_name":"Véro","last_name":"Validation"}');

-- Super administrateur : gère l'équipe
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select public.admin_set_team_roles('Finance@monganga.test', '{finance}');
select public.admin_set_team_roles('support@monganga.test', '{support}');
select public.admin_set_team_roles('valid@monganga.test', '{validation,validation}');
select tst.ok((select role from public.profiles where email = 'finance@monganga.test') = 'admin', 'un super admin nomme un membre Finance');
select tst.ok((select admin_roles from public.profiles where email = 'valid@monganga.test') = '{validation}', 'les rôles en double sont fusionnés');
select tst.fails($$select public.admin_set_team_roles('ilunga@monganga.test', '{support}')$$, 'COMPTE_MEDECIN', 'un compte médecin ne devient pas administrateur');
select tst.fails($$select public.admin_set_team_roles('inconnu@monganga.test', '{support}')$$, 'UTILISATEUR_INTROUVABLE', 'adresse inconnue refusée');
select tst.fails($$select public.admin_set_team_roles('admin@monganga.test', '{finance}')$$, 'DERNIER_SUPER_ADMIN', 'le dernier super administrateur ne peut pas perdre ce rôle');

-- Finance
select tst.as_user('00000000-0000-0000-0000-0000000000f1');
select tst.ok((select count(*) from public.payments) > 0, 'Finance voit les paiements');
select tst.ok((select count(*) from public.payouts) > 0, 'Finance voit les versements');
select tst.ok((select count(*) from public.doctor_documents) = 0, 'Finance ne voit pas les pièces des médecins');
select tst.ok((select count(*) from storage.objects where bucket_id = 'candidatures') = 0, 'Finance n''ouvre pas les fichiers de candidature');
select tst.ok((select count(*) from public.audit_log) = 0, 'Finance ne lit pas le journal d''audit');
select tst.fails($$select public.admin_validate_doctor('00000000-0000-0000-0000-00000000000e')$$, 'ACCES_REFUSE', 'Finance ne valide pas les médecins');
select tst.fails($$select public.admin_set_team_roles('support@monganga.test', '{finance}')$$, 'ACCES_REFUSE', 'Finance ne gère pas l''équipe');
select tst.fails($$select public.admin_update_setting('acompte_centimes', 200)$$, 'ACCES_REFUSE', 'Finance ne change pas les paramètres');
select tst.fails($$select public.admin_set_commission('00000000-0000-0000-0000-00000000000d', 20)$$, 'ACCES_REFUSE', 'Finance ne change pas les commissions');
select tst.fails($$select * from public.admin_user_appointments('00000000-0000-0000-0000-000000000001')$$, 'ACCES_REFUSE', 'Finance n''utilise pas la vue support');
select tst.ok((public.admin_activity()->>'patients')::int > 0, 'Finance voit les chiffres d''activité');

-- Support
select tst.as_user('00000000-0000-0000-0000-0000000000f2');
select tst.ok((select count(*) from public.payments) = 0, 'Support ne voit pas les paiements');
select tst.ok((select count(*) from public.refunds) = 0, 'Support ne voit pas les remboursements');
select tst.ok((select count(*) from public.ledger_entries) = 0, 'Support ne voit pas la répartition');
select tst.ok((select count(*) from public.appointments) = 0, 'Support ne lit pas les rendez-vous avec leurs montants');
select tst.ok((select count(*) from public.admin_user_appointments('00000000-0000-0000-0000-000000000001')) > 0, 'Support voit les rendez-vous d''un utilisateur, sans montant');
select tst.ok((select count(*) from public.profiles) > 1, 'Support voit les utilisateurs');
select tst.fails($$select public.admin_prepare_payouts()$$, 'ACCES_REFUSE', 'Support ne prépare pas les versements');
select tst.fails($$select public.admin_set_suspended('00000000-0000-0000-0000-0000000000f1', true)$$, 'ACCES_REFUSE', 'Support ne suspend pas un membre de l''équipe');
select public.admin_set_suspended('00000000-0000-0000-0000-000000000002', true);
select tst.ok((select suspended_at from public.profiles where id = '00000000-0000-0000-0000-000000000002') is not null, 'Support suspend un patient');
select public.admin_set_suspended('00000000-0000-0000-0000-000000000002', false);

-- Validation
select tst.as_user('00000000-0000-0000-0000-0000000000f3');
select tst.ok((select count(*) from public.doctor_documents) > 0, 'Validation voit les pièces des médecins');
select tst.ok((select count(*) from storage.objects where bucket_id = 'candidatures') > 0, 'Validation ouvre les fichiers de candidature');
select tst.ok((select count(*) from public.payments) = 0, 'Validation ne voit pas les paiements');
select tst.fails($$select public.admin_set_suspended('00000000-0000-0000-0000-000000000002', true)$$, 'ACCES_REFUSE', 'Validation ne suspend pas les comptes');

-- Personne ne lit le contenu médical
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select tst.ok((select count(*) from public.prescriptions) + (select count(*) from public.doctor_notes) + (select count(*) from public.consultation_messages) = 0,
              'même un super administrateur ne lit ni ordonnances, ni notes, ni messages');

-- Alertes adressées aux bons rôles
select tst.as_postgres();
select public._notify_admins('candidature', 'Nouvelle candidature', 'Test');
select tst.ok((select count(*) from public.notifications where kind = 'candidature' and title = 'Nouvelle candidature' and body = 'Test'
               and user_id = '00000000-0000-0000-0000-0000000000f3') = 1, 'une candidature est signalée à Validation');
select tst.ok((select count(*) from public.notifications where kind = 'candidature' and body = 'Test'
               and user_id in ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2')) = 0, 'mais pas à Finance ni au Support');
select public._notify_admins('alerte_rendez_vous', 'A trancher', 'Test');
select tst.ok((select count(*) from public.notifications where kind = 'alerte_rendez_vous' and body = 'Test'
               and user_id = '00000000-0000-0000-0000-0000000000f1') = 1, 'un rendez-vous à trancher est signalé à Finance');

-- Retrait des rôles
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select public.admin_set_team_roles('support@monganga.test', '{}');
select tst.ok((select role from public.profiles where email = 'support@monganga.test') = 'patient', 'sans rôle, le membre redevient un simple compte');
select public.admin_set_team_roles('finance@monganga.test', '{super}');
select public.admin_set_team_roles('admin@monganga.test', '{finance}');
select tst.ok((select admin_roles from public.profiles where email = 'admin@monganga.test') = '{finance}', 'avec un second super administrateur, le premier peut changer de rôle');
