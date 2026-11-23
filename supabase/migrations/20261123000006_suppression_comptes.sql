-- =====================================================================
-- Suppression des comptes par le super administrateur.
--   * Compte sans activité (aucun rendez-vous, paiement, ordonnance…) : suppression définitive.
--     L'adresse e-mail redevient libre.
--   * Compte avec un historique : anonymisation. La connexion est bloquée pour toujours,
--     les données personnelles sont effacées, l'historique (rendez-vous, paiements,
--     ordonnances) est conservé sans nom pour la comptabilité et le dossier médical.
-- Les fichiers du dossier médecin sont effacés par le serveur avant l'appel.
-- =====================================================================

alter table public.profiles add column if not exists deleted_at timestamptz;

create or replace function public.admin_delete_user(p_user uuid, p_check_only boolean default false) returns text
language plpgsql security definer set search_path = '' as $$
declare
  t public.profiles;
  v_mail text := 'supprime-' || p_user::text || '@monganga.invalid';
begin
  perform public._require_admin_role('super');
  if p_user = auth.uid() then raise exception 'ACTION_IMPOSSIBLE' using errcode = 'P0001'; end if;
  select * into t from public.profiles where id = p_user;
  if not found then raise exception 'UTILISATEUR_INTROUVABLE' using errcode = 'P0001'; end if;
  if t.deleted_at is not null then raise exception 'COMPTE_DEJA_SUPPRIME' using errcode = 'P0001'; end if;
  if t.role = 'admin' and 'super' = any(t.admin_roles)
     and not exists (select 1 from public.profiles p where p.role = 'admin' and p.suspended_at is null and p.deleted_at is null
                     and 'super' = any(p.admin_roles) and p.id <> t.id) then
    raise exception 'DERNIER_SUPER_ADMIN' using errcode = 'P0001';
  end if;

  -- Ce qui doit être réglé avant de supprimer.
  if exists (select 1 from public.appointments a
             where (a.patient_id = p_user or a.doctor_id = p_user)
               and a.status in ('en_attente_acompte', 'confirme', 'en_cours')) then
    raise exception 'RDV_A_VENIR' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.refunds r join public.appointments a on a.id = r.appointment_id
             where a.patient_id = p_user and r.status = 'a_traiter') then
    raise exception 'REMBOURSEMENT_EN_ATTENTE' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.ledger_entries l where l.doctor_id = p_user and l.type = 'part_medecin' and l.payout_id is null)
     or exists (select 1 from public.payouts v where v.doctor_id = p_user and v.status = 'a_verser') then
    raise exception 'VERSEMENT_EN_ATTENTE' using errcode = 'P0001';
  end if;

  if p_check_only then return 'verifie'; end if;

  -- 1. Sans historique : suppression définitive (le profil et le dossier suivent).
  begin
    delete from auth.users where id = p_user;
    perform public._audit('supprimer_compte', 'utilisateur', p_user::text,
      jsonb_build_object('mode', 'definitif', 'email', t.email, 'role', t.role));
    return 'definitif';
  exception when foreign_key_violation then
    null; -- un historique existe : on anonymise.
  end;

  -- 2. Avec historique : anonymisation.
  update public.profiles set
    first_name = 'Compte', last_name = 'supprimé', email = v_mail, phone = null, avatar_url = null,
    birth_date = null, sex = null, commune = null, admin_roles = '{}',
    suspended_at = coalesce(suspended_at, now()), deleted_at = now()
  where id = p_user;
  update public.doctor_profiles set
    status = 'suspendu', bio = '', commune = null, payout_account = 'supprime', payout_holder = null, admin_message = null
  where id = p_user;
  delete from public.doctor_documents where doctor_id = p_user;
  delete from public.notifications where user_id = p_user;
  delete from public.availability_slots where doctor_id = p_user and status = 'libre';

  update auth.users set email = v_mail, phone = null, raw_user_meta_data = '{}'::jsonb,
    encrypted_password = '', banned_until = '2999-12-31 00:00:00+00'
  where id = p_user;
  delete from auth.identities where user_id = p_user;
  delete from auth.sessions where user_id = p_user;

  perform public._audit('supprimer_compte', 'utilisateur', p_user::text,
    jsonb_build_object('mode', 'anonymise', 'email', t.email, 'role', t.role));
  return 'anonymise';
end $$;

revoke all on function public.admin_delete_user(uuid, boolean) from public, anon;
grant execute on function public.admin_delete_user(uuid, boolean) to authenticated;
