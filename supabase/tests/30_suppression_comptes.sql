-- =====================================================================
-- Suppression des comptes (à lancer après 20_roles_administration.sql, sur la même base).
-- À ce stade : finance@ est super administrateur, admin@ n'a plus que « finance ».
-- =====================================================================
\set QUIET on
\pset tuples_only on
\o /dev/null
set client_min_messages = notice;

select tst.as_postgres();
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f4', 'jetable@monganga.test', '{"first_name":"Jean","last_name":"Jetable"}'),
  ('00000000-0000-0000-0000-0000000000f5', 'ancien@monganga.test', '{"first_name":"Anne","last_name":"Ancienne"}');
insert into auth.identities (user_id) values ('00000000-0000-0000-0000-0000000000f4'), ('00000000-0000-0000-0000-0000000000f5');
insert into auth.sessions (user_id) values ('00000000-0000-0000-0000-0000000000f4'), ('00000000-0000-0000-0000-0000000000f5');
-- Un historique pour f5 (une trace qui la référence).
insert into public.audit_log (actor_id, action, target_type, target_id) values ('00000000-0000-0000-0000-0000000000f5', 'test', 'test', 'test');

-- Seul un super administrateur supprime
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select tst.fails($$select public.admin_delete_user('00000000-0000-0000-0000-0000000000f4')$$, 'ACCES_REFUSE', 'un administrateur Finance ne supprime pas de compte');

select tst.as_user('00000000-0000-0000-0000-0000000000f1');
select tst.fails($$select public.admin_delete_user('00000000-0000-0000-0000-0000000000f1')$$, 'ACTION_IMPOSSIBLE', 'on ne supprime pas son propre compte');
select tst.ok(public.admin_delete_user('00000000-0000-0000-0000-0000000000f4', true) = 'verifie', 'la vérification préalable ne supprime rien');
select tst.ok(exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000f4'), 'le compte est toujours là après la vérification');

-- Sans activité : suppression définitive
select tst.ok(public.admin_delete_user('00000000-0000-0000-0000-0000000000f4') = 'definitif', 'un compte sans activité est supprimé définitivement');
select tst.ok(not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000f4'), 'le profil disparaît');
select tst.as_postgres();
select tst.ok(not exists (select 1 from auth.users where email = 'jetable@monganga.test'), 'l''adresse e-mail redevient libre');
select tst.as_user('00000000-0000-0000-0000-0000000000f1');

-- Avec historique : anonymisation
select tst.ok(public.admin_delete_user('00000000-0000-0000-0000-0000000000f5') = 'anonymise', 'un compte avec historique est anonymisé');
select tst.ok((select first_name = 'Compte' and phone is null and deleted_at is not null and suspended_at is not null and email like 'supprime-%@monganga.invalid'
               from public.profiles where id = '00000000-0000-0000-0000-0000000000f5'), 'ses données personnelles sont effacées');
select tst.as_postgres();
select tst.ok((select banned_until > now() + interval '100 years' and email like 'supprime-%' from auth.users where id = '00000000-0000-0000-0000-0000000000f5'), 'sa connexion est bloquée pour toujours');
select tst.ok(not exists (select 1 from auth.users where email = 'ancien@monganga.test'), 'son ancienne adresse redevient libre');
select tst.ok(not exists (select 1 from auth.identities where user_id = '00000000-0000-0000-0000-0000000000f5')
              and not exists (select 1 from auth.sessions where user_id = '00000000-0000-0000-0000-0000000000f5'), 'ses sessions sont fermées');
select tst.as_user('00000000-0000-0000-0000-0000000000f1');
select tst.ok(exists (select 1 from public.audit_log where target_id = '00000000-0000-0000-0000-0000000000f5' and action = 'supprimer_compte' and details->>'mode' = 'anonymise'), 'la suppression est notée dans le journal');
select tst.fails($$select public.admin_delete_user('00000000-0000-0000-0000-0000000000f5')$$, 'COMPTE_DEJA_SUPPRIME', 'un compte déjà supprimé ne l''est pas deux fois');

-- Ce qui doit être réglé avant : un rendez-vous encore actif bloque la suppression
select tst.as_postgres();
create temp table cible as select id, patient_id, doctor_id, status from public.appointments where status = 'terminee' limit 1;
grant select on cible to authenticated;
update public.appointments a set status = 'confirme' from cible c where a.id = c.id;
select tst.as_user('00000000-0000-0000-0000-0000000000f1');
select tst.fails(format('select public.admin_delete_user(%L)', (select patient_id from cible)), 'RDV_A_VENIR', 'un patient avec un rendez-vous actif n''est pas supprimé');
select tst.fails(format('select public.admin_delete_user(%L)', (select doctor_id from cible)), 'RDV_A_VENIR', 'un médecin avec un rendez-vous actif non plus');
select tst.ok((select deleted_at is null from public.profiles where id = (select patient_id from cible)), 'et le compte reste intact');
select tst.as_postgres();
update public.appointments a set status = c.status from cible c where a.id = c.id;
