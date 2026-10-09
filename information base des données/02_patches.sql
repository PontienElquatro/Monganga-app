-- =====================================================================
-- MONGANGA — Correctifs de sécurité et droits d'accès
-- A exécuter APRES 01_schema.sql, une seule fois, dans le SQL Editor
-- de Supabase. Ce fichier regroupe les correctifs déjà appliqués sur
-- le projet de développement, pour pouvoir recréer la base à l'identique
-- (nouveau projet, staging, production).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DROITS D'ACCES (le projet est créé avec "Automatically expose new
--    tables" désactivé : sans ces GRANT, toute requête échoue avec
--    "permission denied").
--    La RLS filtre ensuite ligne par ligne.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;

-- Lecture publique (visiteur non connecté) : seulement ce qui sert à
-- la recherche de médecins. PAS la table profiles (contient le téléphone).
grant select on public.doctor_profiles, public.availabilities to anon;

-- Utilisateurs connectés (la RLS filtre ensuite)
grant select on public.profiles, public.doctor_profiles, public.availabilities,
  public.appointments, public.consultations, public.prescriptions,
  public.notifications, public.payments, public.ledger_entries, public.payouts
  to authenticated;

-- Ecritures limitées COLONNE PAR COLONNE : empêche un utilisateur de se
-- donner le rôle admin ou de valider son propre compte médecin.
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant insert (id, specialty, bio, consultation_fee) on public.doctor_profiles to authenticated;
grant update (specialty, bio, consultation_fee) on public.doctor_profiles to authenticated;
grant insert, update, delete on public.availabilities to authenticated;
grant insert, update on public.appointments to authenticated;   -- sera resserré avec les fonctions de réservation
grant insert, update, delete on public.consultations to authenticated;
grant insert on public.prescriptions to authenticated;
grant update on public.notifications to authenticated;

-- ---------------------------------------------------------------------
-- 2. CONFIDENTIALITE : aucune coordonnée personnelle du médecin visible
--    par les patients (demande du client).
--    profiles n'est lisible que par son propriétaire (et l'admin).
--    La recherche de médecins passe par la vue doctors_public.
-- ---------------------------------------------------------------------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');
revoke select on public.profiles from anon;

create or replace view public.doctors_public as
select d.id, p.full_name, p.avatar_url, d.specialty, d.bio, d.consultation_fee
from public.doctor_profiles d
join public.profiles p on p.id = d.id
where d.status = 'valide';

grant select on public.doctors_public to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. COMPTE ADMIN DE TEST (à lancer à la main, avec un vrai e-mail).
--    Un rôle ne peut JAMAIS être changé depuis l'application.
-- ---------------------------------------------------------------------
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'TON_EMAIL_ICI');

-- ---------------------------------------------------------------------
-- 4. DEVELOPPEMENT UNIQUEMENT : confirmer les comptes de test sans e-mail
--    (à ne PAS faire en production : réactiver "Confirm email").
-- ---------------------------------------------------------------------
-- update auth.users set email_confirmed_at = now() where email_confirmed_at is null;
