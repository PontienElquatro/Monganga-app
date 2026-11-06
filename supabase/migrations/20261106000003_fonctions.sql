-- =====================================================================
-- Fonctions métier : tout ce qui touche à l'argent, aux statuts et aux
-- données d'autrui passe ici. Chaque fonction vérifie elle-même qui l'appelle.
-- Les erreurs sont des codes (ex. CRENEAU_INDISPONIBLE) traduits par l'application.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Outils internes
-- ---------------------------------------------------------------------
create or replace function public._kin(p timestamptz) returns text
language sql stable set search_path = '' as $$
  select to_char(p at time zone 'Africa/Kinshasa', 'DD/MM/YYYY à HH24:MI')
$$;

create or replace function public._usd(p_cents integer) returns text
language sql immutable set search_path = '' as $$
  select replace(to_char(p_cents / 100.0, 'FM999990.00'), '.', ',') || ' $'
$$;

create or replace function public._notify(p_user uuid, p_kind text, p_title text, p_body text,
                                          p_link text default null, p_email boolean default true)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, link, send_email)
  values (p_user, p_kind, p_title, p_body, p_link, p_email)
$$;

create or replace function public._notify_admins(p_kind text, p_title text, p_body text, p_link text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select id, p_kind, p_title, p_body, p_link from public.profiles where role = 'admin' and suspended_at is null
$$;

create or replace function public._audit(p_action text, p_type text, p_id text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_type, p_id, coalesce(p_details, '{}'::jsonb))
$$;

create or replace function public._doctor_name(p_doctor uuid) returns text
language sql stable security definer set search_path = '' as $$
  select btrim(coalesce(d.title, 'Dr') || ' ' || p.first_name || ' ' || p.last_name)
  from public.profiles p join public.doctor_profiles d on d.id = p.id where p.id = p_doctor
$$;

create or replace function public._patient_name(p_patient uuid) returns text
language sql stable security definer set search_path = '' as $$
  select btrim(first_name || ' ' || last_name) from public.profiles where id = p_patient
$$;

-- Répartition d'un montant entre médecin et plateforme, selon la commission figée au rendez-vous.
create or replace function public._settle(p_appointment uuid, p_base_cents integer, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.appointments;
  v_doctor integer;
begin
  select * into a from public.appointments where id = p_appointment;
  v_doctor := round(p_base_cents * (100 - a.commission_rate) / 100.0);
  insert into public.ledger_entries (appointment_id, doctor_id, type, reason, amount_cents)
  values (a.id, a.doctor_id, 'part_medecin', p_reason, v_doctor),
         (a.id, a.doctor_id, 'part_plateforme', p_reason, p_base_cents - v_doctor)
  on conflict (appointment_id, type) do nothing;
end $$;

-- Ouvre un remboursement (traité par l'administration ou le prestataire de paiement).
create or replace function public._refund(p_payment uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  p public.payments;
begin
  select * into p from public.payments where id = p_payment and status = 'reussi';
  if not found then return; end if;
  insert into public.refunds (payment_id, appointment_id, amount_cents, reason)
  values (p.id, p.appointment_id, p.amount_cents, p_reason)
  on conflict (payment_id) do nothing;
  if found then
    perform public._notify(p.patient_id, 'remboursement', 'Remboursement en cours',
      'Nous vous remboursons ' || public._usd(p.amount_cents) || ' sur le moyen de paiement utilisé. Motif : ' || p_reason || '.',
      '/patient/rendez-vous');
  end if;
end $$;

create or replace function public._refund_all(p_appointment uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select id from public.payments where appointment_id = p_appointment and status = 'reussi' loop
    perform public._refund(r.id, p_reason);
  end loop;
  update public.payments set status = 'annule' where appointment_id = p_appointment and status = 'en_attente';
end $$;

-- ---------------------------------------------------------------------
-- Vue publique des médecins : uniquement les validés, sans coordonnées,
-- sans commission, sans note.
-- ---------------------------------------------------------------------
create or replace view public.doctors_public with (security_invoker = false) as
select
  d.id, d.title, p.first_name, p.last_name, p.avatar_url, d.specialty, d.bio, d.languages,
  d.years_experience, d.commune, d.fee_cents,
  (select min(s.starts_at) from public.availability_slots s
    where s.doctor_id = d.id and s.status = 'libre'
      and s.starts_at >= now() + make_interval(mins => public.setting_int('delai_min_reservation_minutes'))) as next_slot_at
from public.doctor_profiles d
join public.profiles p on p.id = d.id
where d.status = 'valide' and p.role = 'medecin' and p.suspended_at is null;

grant select on public.doctors_public to anon, authenticated;

-- ---------------------------------------------------------------------
-- Candidature médecin
-- ---------------------------------------------------------------------
create or replace function public._submit_application(
  p_user uuid, p_specialty text, p_bio text, p_fee_cents integer, p_languages text[], p_years integer,
  p_commune text, p_payout_method public.payout_method, p_payout_account text, p_payout_holder text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_role public.user_role;
  v_status public.doctor_status;
begin
  select role into v_role from public.profiles where id = p_user and suspended_at is null;
  if v_role is distinct from 'medecin' then raise exception 'COMPTE_NON_MEDECIN' using errcode = 'P0001'; end if;
  if coalesce(btrim(p_specialty), '') = '' then raise exception 'SPECIALITE_OBLIGATOIRE' using errcode = 'P0001'; end if;
  if p_payout_account is null or char_length(btrim(p_payout_account)) < 6 then raise exception 'COMPTE_VERSEMENT_INVALIDE' using errcode = 'P0001'; end if;

  select status into v_status from public.doctor_profiles where id = p_user;
  if v_status in ('valide', 'suspendu') then raise exception 'DOSSIER_DEJA_TRAITE' using errcode = 'P0001'; end if;

  insert into public.doctor_profiles (id, specialty, bio, fee_cents, languages, years_experience, commune,
                                      payout_method, payout_account, payout_holder, commission_rate, status, submitted_at)
  values (p_user, btrim(p_specialty), coalesce(btrim(p_bio), ''), p_fee_cents,
          coalesce(p_languages, array['Français', 'Lingala']), p_years, nullif(btrim(p_commune), ''),
          p_payout_method, btrim(p_payout_account), nullif(btrim(p_payout_holder), ''),
          public.setting_int('commission_defaut'), 'en_attente', now())
  on conflict (id) do update set
    specialty = excluded.specialty, bio = excluded.bio, fee_cents = excluded.fee_cents,
    languages = excluded.languages, years_experience = excluded.years_experience, commune = excluded.commune,
    payout_method = excluded.payout_method, payout_account = excluded.payout_account,
    payout_holder = excluded.payout_holder, status = 'en_attente', admin_message = null, submitted_at = now();

  perform public._notify_admins('candidature', 'Nouvelle candidature médecin',
    coalesce(public._doctor_name(p_user), 'Un médecin') || ' (' || btrim(p_specialty) || ') a déposé son dossier.',
    '/admin/validations/' || p_user);
end $$;

-- Dépôt ou nouvelle soumission par le médecin connecté.
create or replace function public.submit_application(
  p_specialty text, p_bio text, p_fee_cents integer, p_languages text[], p_years integer,
  p_commune text, p_payout_method public.payout_method, p_payout_account text, p_payout_holder text
) returns void language sql security definer set search_path = '' as $$
  select public._submit_application(auth.uid(), p_specialty, p_bio, p_fee_cents, p_languages, p_years,
                                    p_commune, p_payout_method, p_payout_account, p_payout_holder)
$$;

-- Dépôt au moment de l'inscription (le compte n'est pas encore confirmé) : réservé au serveur.
create or replace function public.service_submit_application(
  p_user uuid, p_specialty text, p_bio text, p_fee_cents integer, p_languages text[], p_years integer,
  p_commune text, p_payout_method public.payout_method, p_payout_account text, p_payout_holder text
) returns void language sql security definer set search_path = '' as $$
  select public._submit_application(p_user, p_specialty, p_bio, p_fee_cents, p_languages, p_years,
                                    p_commune, p_payout_method, p_payout_account, p_payout_holder)
$$;

-- ---------------------------------------------------------------------
-- Administration : médecins, utilisateurs, paramètres
-- ---------------------------------------------------------------------
create or replace function public._require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'ACCES_REFUSE' using errcode = 'P0001'; end if;
end $$;

create or replace function public.admin_validate_doctor(p_doctor uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_missing text[];
begin
  perform public._require_admin();
  select array_agg(k) into v_missing from unnest(array['photo', 'identite', 'diplome', 'ordre', 'cv']::public.document_kind[]) k
  where not exists (select 1 from public.doctor_documents d where d.doctor_id = p_doctor and d.kind = k);
  if v_missing is not null then raise exception 'PIECES_MANQUANTES' using errcode = 'P0001', detail = array_to_string(v_missing, ','); end if;

  update public.doctor_profiles set status = 'valide', admin_message = null, decided_at = now(), decided_by = auth.uid()
  where id = p_doctor and status in ('en_attente', 'complement_demande', 'refuse');
  if not found then raise exception 'DOSSIER_INTROUVABLE' using errcode = 'P0001'; end if;

  perform public._notify(p_doctor, 'dossier_valide', 'Votre dossier est validé',
    'Bienvenue sur MONGANGA. Vous pouvez ouvrir vos créneaux et recevoir vos premiers patients.', '/medecin');
  perform public._audit('valider_medecin', 'medecin', p_doctor::text);
end $$;

create or replace function public.admin_request_complement(p_doctor uuid, p_message text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin();
  if coalesce(btrim(p_message), '') = '' then raise exception 'MESSAGE_OBLIGATOIRE' using errcode = 'P0001'; end if;
  update public.doctor_profiles set status = 'complement_demande', admin_message = btrim(p_message), decided_at = now(), decided_by = auth.uid()
  where id = p_doctor and status in ('en_attente', 'complement_demande');
  if not found then raise exception 'DOSSIER_INTROUVABLE' using errcode = 'P0001'; end if;
  perform public._notify(p_doctor, 'dossier_complement', 'Un complément est demandé pour votre dossier', btrim(p_message), '/dossier');
  perform public._audit('demander_complement', 'medecin', p_doctor::text, jsonb_build_object('message', p_message));
end $$;

create or replace function public.admin_refuse_doctor(p_doctor uuid, p_message text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin();
  if coalesce(btrim(p_message), '') = '' then raise exception 'MOTIF_OBLIGATOIRE' using errcode = 'P0001'; end if;
  update public.doctor_profiles set status = 'refuse', admin_message = btrim(p_message), decided_at = now(), decided_by = auth.uid()
  where id = p_doctor and status in ('en_attente', 'complement_demande');
  if not found then raise exception 'DOSSIER_INTROUVABLE' using errcode = 'P0001'; end if;
  perform public._notify(p_doctor, 'dossier_refuse', 'Votre dossier n''a pas été validé', btrim(p_message), '/dossier');
  perform public._audit('refuser_medecin', 'medecin', p_doctor::text, jsonb_build_object('motif', p_message));
end $$;

create or replace function public.admin_set_commission(p_doctor uuid, p_rate numeric) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin();
  if p_rate is null or p_rate < 0 or p_rate > 100 then raise exception 'COMMISSION_INVALIDE' using errcode = 'P0001'; end if;
  update public.doctor_profiles set commission_rate = p_rate where id = p_doctor;
  if not found then raise exception 'DOSSIER_INTROUVABLE' using errcode = 'P0001'; end if;
  perform public._audit('modifier_commission', 'medecin', p_doctor::text, jsonb_build_object('taux', p_rate));
end $$;

-- Annulation par le médecin ou suite à une suspension : remboursement total du patient.
create or replace function public._cancel_full_refund(p_appointment uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.appointments;
begin
  select * into a from public.appointments where id = p_appointment for update;
  update public.appointments set status = 'annulee_medecin', cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = p_reason
  where id = a.id;
  update public.availability_slots set status = 'bloque' where id = a.slot_id;
  perform public._refund_all(a.id, 'consultation annulée par le médecin');
  perform public._notify(a.patient_id, 'rdv_annule_medecin', 'Votre rendez-vous est annulé',
    'Votre consultation du ' || public._kin(a.starts_at) || ' avec ' || public._doctor_name(a.doctor_id)
    || ' est annulée. Vous êtes remboursé intégralement.', '/patient/rendez-vous');
  perform public._notify_admins('alerte_annulation', 'Annulation par un médecin',
    public._doctor_name(a.doctor_id) || ' a annulé le rendez-vous ' || a.reference || ' (' || public._kin(a.starts_at) || '). Remboursement à traiter.',
    '/admin/transactions');
end $$;

create or replace function public.admin_set_suspended(p_user uuid, p_suspended boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  perform public._require_admin();
  if p_user = auth.uid() then raise exception 'ACTION_IMPOSSIBLE' using errcode = 'P0001'; end if;
  update public.profiles set suspended_at = case when p_suspended then now() else null end where id = p_user;
  if not found then raise exception 'UTILISATEUR_INTROUVABLE' using errcode = 'P0001'; end if;
  if p_suspended then
    for r in select id from public.appointments
             where doctor_id = p_user and status in ('en_attente_acompte', 'confirme') and starts_at > now() loop
      perform public._cancel_full_refund(r.id, 'Médecin indisponible');
    end loop;
  end if;
  perform public._audit(case when p_suspended then 'suspendre' else 'reactiver' end, 'utilisateur', p_user::text);
end $$;

create or replace function public.admin_update_setting(p_key text, p_value integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin();
  if p_value is null or p_value < 0 then raise exception 'VALEUR_INVALIDE' using errcode = 'P0001'; end if;
  update public.settings set value = to_jsonb(p_value), updated_at = now() where key = p_key;
  if not found then raise exception 'PARAMETRE_INCONNU' using errcode = 'P0001'; end if;
  perform public._audit('modifier_parametre', 'parametre', p_key, jsonb_build_object('valeur', p_value));
end $$;

-- ---------------------------------------------------------------------
-- Créneaux du médecin (tranches de 30 minutes, heure de Kinshasa)
-- ---------------------------------------------------------------------
create or replace function public.doctor_create_slots(p_date date, p_from time, p_to time) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_len interval := make_interval(mins => public.setting_int('duree_consultation_minutes'));
  v_start timestamptz := (p_date + p_from) at time zone 'Africa/Kinshasa';
  v_end timestamptz := (p_date + p_to) at time zone 'Africa/Kinshasa';
  v_count integer := 0;
begin
  if not public.is_valid_doctor() then raise exception 'MEDECIN_NON_VALIDE' using errcode = 'P0001'; end if;
  if p_to <= p_from then raise exception 'PLAGE_INVALIDE' using errcode = 'P0001'; end if;
  if p_date > (now() at time zone 'Africa/Kinshasa')::date + 60 then raise exception 'DATE_TROP_LOINTAINE' using errcode = 'P0001'; end if;
  while v_start + v_len <= v_end loop
    if v_start > now() then
      begin
        insert into public.availability_slots (doctor_id, starts_at, ends_at) values (auth.uid(), v_start, v_start + v_len);
        v_count := v_count + 1;
      exception when exclusion_violation then
        null; -- créneau déjà ouvert sur cette période : on le saute
      end;
    end if;
    v_start := v_start + v_len;
  end loop;
  return v_count;
end $$;

create or replace function public.doctor_delete_slot(p_slot uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_valid_doctor() then raise exception 'MEDECIN_NON_VALIDE' using errcode = 'P0001'; end if;
  delete from public.availability_slots s
  where s.id = p_slot and s.doctor_id = auth.uid() and s.status in ('libre', 'bloque')
    and not exists (select 1 from public.appointments a where a.slot_id = s.id);
  if not found then
    -- un créneau qui a déjà porté un rendez-vous est simplement bloqué
    update public.availability_slots set status = 'bloque'
    where id = p_slot and doctor_id = auth.uid() and status = 'libre';
    if not found then raise exception 'CRENEAU_NON_SUPPRIMABLE' using errcode = 'P0001'; end if;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Réservation
-- ---------------------------------------------------------------------
create or replace function public.book_appointment(p_slot uuid, p_reason text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  s public.availability_slots;
  d public.doctor_profiles;
  v_id uuid;
  v_deposit integer := public.setting_int('acompte_centimes');
begin
  if not public.is_active_patient() then raise exception 'COMPTE_NON_PATIENT' using errcode = 'P0001'; end if;

  select * into s from public.availability_slots where id = p_slot for update;
  if not found or s.status <> 'libre' then raise exception 'CRENEAU_INDISPONIBLE' using errcode = 'P0001'; end if;
  if s.starts_at < now() + make_interval(mins => public.setting_int('delai_min_reservation_minutes')) then
    raise exception 'CRENEAU_TROP_PROCHE' using errcode = 'P0001';
  end if;
  if not public.is_valid_doctor(s.doctor_id) then raise exception 'CRENEAU_INDISPONIBLE' using errcode = 'P0001'; end if;
  if (select count(*) from public.appointments where patient_id = auth.uid() and status = 'en_attente_acompte') >= 3 then
    raise exception 'TROP_DE_RESERVATIONS_EN_ATTENTE' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.appointments where patient_id = auth.uid()
             and status in ('en_attente_acompte', 'confirme', 'en_cours')
             and tstzrange(starts_at, ends_at, '[)') && tstzrange(s.starts_at, s.ends_at, '[)')) then
    raise exception 'CONFLIT_HORAIRE' using errcode = 'P0001';
  end if;

  select * into d from public.doctor_profiles where id = s.doctor_id;
  if d.fee_cents <= v_deposit then raise exception 'TARIF_INVALIDE' using errcode = 'P0001'; end if;

  insert into public.appointments (patient_id, doctor_id, slot_id, starts_at, ends_at, reason,
                                   fee_cents, deposit_cents, commission_rate, deposit_due_at)
  values (auth.uid(), s.doctor_id, s.id, s.starts_at, s.ends_at, nullif(btrim(coalesce(p_reason, '')), ''),
          d.fee_cents, v_deposit, d.commission_rate,
          now() + make_interval(mins => public.setting_int('delai_paiement_acompte_minutes')))
  returning id into v_id;

  update public.availability_slots set status = 'reserve' where id = s.id;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- Paiements
-- create_payment : appelée par le serveur avec la session du patient.
-- confirm_payment / fail_payment : réservées au serveur (service_role),
-- après confirmation par le prestataire (webhook) — jamais par le navigateur.
-- ---------------------------------------------------------------------
create or replace function public.create_payment(p_appointment uuid, p_kind public.payment_kind,
                                                 p_method public.payment_method, p_phone text, p_provider text)
returns table (payment_id uuid, amount_cents integer)
language plpgsql security definer set search_path = '' as $$
declare
  a public.appointments;
  v_amount integer;
  v_id uuid;
begin
  select * into a from public.appointments where id = p_appointment and patient_id = auth.uid() for update;
  if not found then raise exception 'RENDEZ_VOUS_INTROUVABLE' using errcode = 'P0001'; end if;
  if not public.is_active_patient() then raise exception 'COMPTE_NON_PATIENT' using errcode = 'P0001'; end if;

  if p_kind = 'acompte' then
    if a.status <> 'en_attente_acompte' or a.deposit_due_at < now() then raise exception 'ACOMPTE_IMPOSSIBLE' using errcode = 'P0001'; end if;
    v_amount := a.deposit_cents;
  else
    if a.status <> 'confirme' or a.balance_paid_at is not null then raise exception 'SOLDE_IMPOSSIBLE' using errcode = 'P0001'; end if;
    if now() < a.starts_at - make_interval(mins => public.setting_int('ouverture_solde_minutes')) then
      raise exception 'SOLDE_PAS_ENCORE_OUVERT' using errcode = 'P0001';
    end if;
    if now() > a.starts_at + make_interval(mins => public.setting_int('absence_minutes')) then
      raise exception 'SOLDE_TROP_TARD' using errcode = 'P0001';
    end if;
    v_amount := a.fee_cents - a.deposit_cents;
  end if;

  if p_method <> 'carte' and (p_phone is null or p_phone !~ '^[+0-9 ()\-]{9,20}$') then
    raise exception 'NUMERO_INVALIDE' using errcode = 'P0001';
  end if;

  update public.payments set status = 'annule'
  where appointment_id = a.id and kind = p_kind and status = 'en_attente';

  insert into public.payments (appointment_id, patient_id, kind, amount_cents, method, phone, provider)
  values (a.id, a.patient_id, p_kind, v_amount, p_method, nullif(btrim(coalesce(p_phone, '')), ''), p_provider)
  returning id into v_id;

  return query select v_id, v_amount;
end $$;

create or replace function public.set_payment_provider_ref(p_payment uuid, p_ref text) returns void
language sql security definer set search_path = '' as $$
  update public.payments set provider_ref = p_ref where id = p_payment and provider_ref is null
$$;

create or replace function public.confirm_payment(p_payment uuid, p_provider_ref text default null, p_raw jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  p public.payments;
  a public.appointments;
begin
  select * into p from public.payments where id = p_payment for update;
  if not found then raise exception 'PAIEMENT_INTROUVABLE' using errcode = 'P0001'; end if;
  if p.status = 'reussi' then return; end if;  -- idempotent : un webhook peut arriver deux fois

  update public.payments set status = 'reussi', paid_at = now(),
         provider_ref = coalesce(p_provider_ref, provider_ref), raw = coalesce(p_raw, raw), failure_reason = null
  where id = p.id;

  select * into a from public.appointments where id = p.appointment_id for update;

  if p.kind = 'acompte' then
    if a.status = 'en_attente_acompte' then
      update public.appointments set status = 'confirme', confirmed_at = now() where id = a.id;
      perform public._notify(a.patient_id, 'rdv_confirme', 'Rendez-vous confirmé',
        'Votre consultation avec ' || public._doctor_name(a.doctor_id) || ' est confirmée pour le ' || public._kin(a.starts_at)
        || '. Il restera ' || public._usd(a.fee_cents - a.deposit_cents) || ' à payer le jour de la visio.', '/patient/rendez-vous');
      perform public._notify(a.doctor_id, 'nouveau_rdv', 'Nouveau rendez-vous',
        public._patient_name(a.patient_id) || ' a réservé votre créneau du ' || public._kin(a.starts_at) || '.', '/medecin/agenda');
    else
      perform public._refund(p.id, 'acompte reçu après l''expiration de la réservation');
    end if;
  else
    if a.status in ('confirme', 'en_cours') and a.balance_paid_at is null then
      update public.appointments set balance_paid_at = now() where id = a.id;
      perform public._notify(a.patient_id, 'solde_paye', 'Solde payé',
        'Tout est prêt : vous pouvez rejoindre la consultation depuis votre espace.', '/patient/consultation/' || a.id, false);
    else
      perform public._refund(p.id, 'solde reçu alors que la consultation n''était plus possible');
    end if;
  end if;
end $$;

create or replace function public.fail_payment(p_payment uuid, p_reason text default null) returns void
language sql security definer set search_path = '' as $$
  update public.payments set status = 'echoue', failure_reason = left(p_reason, 300)
  where id = p_payment and status = 'en_attente'
$$;

-- ---------------------------------------------------------------------
-- Annulations
-- ---------------------------------------------------------------------
create or replace function public.cancel_by_patient(p_appointment uuid, p_reason text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  a public.appointments;
  v_deposit public.payments;
  v_result text;
begin
  select * into a from public.appointments where id = p_appointment and patient_id = auth.uid() for update;
  if not found then raise exception 'RENDEZ_VOUS_INTROUVABLE' using errcode = 'P0001'; end if;
  if a.status not in ('en_attente_acompte', 'confirme') or a.starts_at <= now() then
    raise exception 'ANNULATION_IMPOSSIBLE' using errcode = 'P0001';
  end if;

  update public.appointments set status = 'annulee_patient', cancelled_at = now(), cancelled_by = auth.uid(),
         cancel_reason = nullif(btrim(coalesce(p_reason, '')), '')
  where id = a.id;
  update public.availability_slots set status = 'libre' where id = a.slot_id and status = 'reserve';
  update public.payments set status = 'annule' where appointment_id = a.id and status = 'en_attente';

  if a.status = 'en_attente_acompte' then
    v_result := 'sans_frais';
  else
    select * into v_deposit from public.payments where appointment_id = a.id and kind = 'acompte' and status = 'reussi';
    if a.starts_at - now() >= make_interval(hours => public.setting_int('annulation_gratuite_heures')) then
      perform public._refund(v_deposit.id, 'annulation plus de 24 h avant la consultation');
      v_result := 'acompte_rembourse';
    else
      perform public._settle(a.id, a.deposit_cents, 'annulation_tardive');
      v_result := 'acompte_conserve';
    end if;
    perform public._notify(a.doctor_id, 'rdv_annule_patient', 'Rendez-vous annulé par le patient',
      'Le rendez-vous du ' || public._kin(a.starts_at) || ' a été annulé par le patient. Le créneau est de nouveau libre.', '/medecin/agenda');
  end if;
  return v_result;
end $$;

create or replace function public.cancel_by_doctor(p_appointment uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.appointments;
begin
  if not public.is_valid_doctor() then raise exception 'MEDECIN_NON_VALIDE' using errcode = 'P0001'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'MOTIF_OBLIGATOIRE' using errcode = 'P0001'; end if;
  select * into a from public.appointments where id = p_appointment and doctor_id = auth.uid();
  if not found then raise exception 'RENDEZ_VOUS_INTROUVABLE' using errcode = 'P0001'; end if;
  if a.status not in ('en_attente_acompte', 'confirme') or a.ends_at <= now() then
    raise exception 'ANNULATION_IMPOSSIBLE' using errcode = 'P0001';
  end if;
  perform public._cancel_full_refund(a.id, btrim(p_reason));
end $$;

-- ---------------------------------------------------------------------
-- Consultation
-- ---------------------------------------------------------------------
create or replace function public.join_consultation(p_appointment uuid)
returns table (room_name text, participant text, starts_at timestamptz, ends_at timestamptz, closes_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  a public.appointments;
  v_is_doctor boolean;
  v_closes timestamptz;
begin
  select * into a from public.appointments x where x.id = p_appointment for update;
  if not found or (a.patient_id <> auth.uid() and a.doctor_id <> auth.uid()) then
    raise exception 'RENDEZ_VOUS_INTROUVABLE' using errcode = 'P0001';
  end if;
  v_is_doctor := a.doctor_id = auth.uid();
  v_closes := a.ends_at + make_interval(mins => public.setting_int('fermeture_salle_minutes'));

  if a.status not in ('confirme', 'en_cours') then raise exception 'CONSULTATION_INDISPONIBLE' using errcode = 'P0001'; end if;
  if now() < a.starts_at - interval '5 minutes' then raise exception 'CONSULTATION_PAS_ENCORE_OUVERTE' using errcode = 'P0001'; end if;
  if now() > v_closes then raise exception 'CONSULTATION_FERMEE' using errcode = 'P0001'; end if;
  if v_is_doctor and not public.is_valid_doctor() then raise exception 'MEDECIN_NON_VALIDE' using errcode = 'P0001'; end if;
  if not v_is_doctor and a.balance_paid_at is null then raise exception 'SOLDE_NON_PAYE' using errcode = 'P0001'; end if;

  update public.appointments x set
    room_name = coalesce(x.room_name, 'mgg-' || replace(x.id::text, '-', '')),
    patient_joined_at = case when not v_is_doctor then coalesce(x.patient_joined_at, now()) else x.patient_joined_at end,
    doctor_joined_at = case when v_is_doctor then coalesce(x.doctor_joined_at, now()) else x.doctor_joined_at end
  where x.id = a.id
  returning * into a;

  if a.status = 'confirme' and a.patient_joined_at is not null and a.doctor_joined_at is not null then
    update public.appointments x set status = 'en_cours', started_at = now() where x.id = a.id;
  end if;

  return query select a.room_name, case when v_is_doctor then 'medecin' else 'patient' end, a.starts_at, a.ends_at, v_closes;
end $$;

create or replace function public.end_consultation(p_appointment uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.appointments;
begin
  select * into a from public.appointments where id = p_appointment and doctor_id = auth.uid() for update;
  if not found then raise exception 'RENDEZ_VOUS_INTROUVABLE' using errcode = 'P0001'; end if;
  if a.status <> 'en_cours' then raise exception 'CONSULTATION_NON_DEMARREE' using errcode = 'P0001'; end if;
  update public.appointments set status = 'terminee', ended_at = now() where id = a.id;
  perform public._settle(a.id, a.fee_cents, 'consultation');
  perform public._notify(a.patient_id, 'consultation_terminee', 'Consultation terminée',
    'Merci d''avoir consulté sur MONGANGA. Retrouvez votre ordonnance dans votre espace et donnez votre avis sur la consultation.',
    '/patient/rendez-vous');
end $$;

create or replace function public.save_doctor_note(p_appointment uuid, p_content text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_valid_doctor() then raise exception 'MEDECIN_NON_VALIDE' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.appointments where id = p_appointment and doctor_id = auth.uid()) then
    raise exception 'RENDEZ_VOUS_INTROUVABLE' using errcode = 'P0001';
  end if;
  insert into public.doctor_notes (appointment_id, doctor_id, content, updated_at)
  values (p_appointment, auth.uid(), left(coalesce(p_content, ''), 5000), now())
  on conflict (appointment_id) do update set content = excluded.content, updated_at = now();
end $$;

create or replace function public.issue_prescription(p_appointment uuid, p_items jsonb, p_instructions text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  a public.appointments;
  v_item jsonb;
  v_code text;
begin
  if not public.is_valid_doctor() then raise exception 'MEDECIN_NON_VALIDE' using errcode = 'P0001'; end if;
  select * into a from public.appointments where id = p_appointment and doctor_id = auth.uid();
  if not found then raise exception 'RENDEZ_VOUS_INTROUVABLE' using errcode = 'P0001'; end if;
  if a.status not in ('en_cours', 'terminee') then raise exception 'ORDONNANCE_IMPOSSIBLE' using errcode = 'P0001'; end if;
  if a.status = 'terminee' and a.ended_at < now() - interval '24 hours' then raise exception 'ORDONNANCE_TROP_TARD' using errcode = 'P0001'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'ORDONNANCE_VIDE' using errcode = 'P0001';
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    if coalesce(btrim(v_item->>'name'), '') = '' or char_length(v_item->>'name') > 120
       or char_length(coalesce(v_item->>'dosage', '')) > 200 or char_length(coalesce(v_item->>'duration', '')) > 80 then
      raise exception 'ORDONNANCE_LIGNE_INVALIDE' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.prescriptions (appointment_id, doctor_id, patient_id, items, instructions, expires_at)
  values (a.id, a.doctor_id, a.patient_id, p_items, nullif(btrim(coalesce(p_instructions, '')), ''),
          a.starts_at + make_interval(days => public.setting_int('conservation_jours')))
  on conflict (appointment_id) do update set items = excluded.items, instructions = excluded.instructions, issued_at = now()
  returning code into v_code;

  perform public._notify(a.patient_id, 'ordonnance', 'Votre ordonnance est disponible',
    public._doctor_name(a.doctor_id) || ' vous a envoyé une ordonnance. Elle reste disponible 30 jours.', '/patient/ordonnances');
  return v_code;
end $$;

create or replace function public.rate_appointment(p_appointment uuid, p_stars integer, p_comment text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.appointments;
begin
  select * into a from public.appointments where id = p_appointment and patient_id = auth.uid();
  if not found then raise exception 'RENDEZ_VOUS_INTROUVABLE' using errcode = 'P0001'; end if;
  if a.status <> 'terminee' then raise exception 'NOTATION_IMPOSSIBLE' using errcode = 'P0001'; end if;
  if p_stars not between 1 and 5 then raise exception 'NOTE_INVALIDE' using errcode = 'P0001'; end if;
  insert into public.ratings (appointment_id, patient_id, doctor_id, stars, comment)
  values (a.id, a.patient_id, a.doctor_id, p_stars, nullif(btrim(coalesce(p_comment, '')), ''));
exception when unique_violation then
  raise exception 'DEJA_NOTE' using errcode = 'P0001';
end $$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null) returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids))
$$;

-- ---------------------------------------------------------------------
-- Lectures composées (noms des autres parties, sans coordonnées)
-- ---------------------------------------------------------------------
create or replace function public.patient_appointments()
returns table (id uuid, reference text, status public.appointment_status, starts_at timestamptz, ends_at timestamptz,
               fee_cents integer, deposit_cents integer, deposit_due_at timestamptz, balance_paid_at timestamptz,
               doctor_id uuid, doctor_name text, doctor_specialty text, doctor_avatar text,
               has_prescription boolean, has_rating boolean, cancel_reason text, refund_status public.refund_status)
language sql stable security definer set search_path = '' as $$
  select a.id, a.reference, a.status, a.starts_at, a.ends_at, a.fee_cents, a.deposit_cents, a.deposit_due_at, a.balance_paid_at,
         a.doctor_id, public._doctor_name(a.doctor_id), d.specialty, p.avatar_url,
         exists (select 1 from public.prescriptions r where r.appointment_id = a.id),
         exists (select 1 from public.ratings r where r.appointment_id = a.id),
         a.cancel_reason,
         (select f.status from public.refunds f where f.appointment_id = a.id order by f.created_at desc limit 1)
  from public.appointments a
  join public.doctor_profiles d on d.id = a.doctor_id
  join public.profiles p on p.id = a.doctor_id
  where a.patient_id = auth.uid()
  order by a.starts_at desc
$$;

create or replace function public.doctor_agenda(p_from timestamptz, p_to timestamptz)
returns table (id uuid, reference text, status public.appointment_status, starts_at timestamptz, ends_at timestamptz,
               balance_paid boolean, reason text, patient_id uuid, patient_name text, patient_age integer,
               patient_sex text, patient_commune text, patient_avatar text, has_prescription boolean)
language sql stable security definer set search_path = '' as $$
  select a.id, a.reference, a.status, a.starts_at, a.ends_at, a.balance_paid_at is not null, a.reason,
         a.patient_id, btrim(p.first_name || ' ' || p.last_name),
         case when p.birth_date is null then null else date_part('year', age(p.birth_date))::integer end,
         p.sex, p.commune, p.avatar_url,
         exists (select 1 from public.prescriptions r where r.appointment_id = a.id)
  from public.appointments a join public.profiles p on p.id = a.patient_id
  where a.doctor_id = auth.uid() and public.is_valid_doctor()
    and a.starts_at >= p_from and a.starts_at < p_to
    and a.status <> 'expiree'
  order by a.starts_at
$$;

create or replace function public.doctor_patients()
returns table (patient_id uuid, patient_name text, patient_age integer, patient_sex text, patient_commune text,
               patient_avatar text, consultations integer, last_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, btrim(p.first_name || ' ' || p.last_name),
         case when p.birth_date is null then null else date_part('year', age(p.birth_date))::integer end,
         p.sex, p.commune, p.avatar_url,
         count(*) filter (where a.status = 'terminee')::integer, max(a.starts_at)
  from public.appointments a join public.profiles p on p.id = a.patient_id
  where a.doctor_id = auth.uid() and public.is_valid_doctor()
    and a.status in ('confirme', 'en_cours', 'terminee', 'absence_patient')
  group by p.id
  order by max(a.starts_at) desc
$$;

-- Informations affichées dans la salle de consultation pour l'autre participant.
create or replace function public.consultation_context(p_appointment uuid)
returns table (id uuid, reference text, status public.appointment_status, starts_at timestamptz, ends_at timestamptz,
               closes_at timestamptz, balance_paid boolean, viewer text, other_name text, other_avatar text,
               other_detail text, reason text)
language sql stable security definer set search_path = '' as $$
  select a.id, a.reference, a.status, a.starts_at, a.ends_at,
         a.ends_at + make_interval(mins => public.setting_int('fermeture_salle_minutes')),
         a.balance_paid_at is not null,
         case when a.doctor_id = auth.uid() then 'medecin' else 'patient' end,
         case when a.doctor_id = auth.uid() then btrim(pp.first_name || ' ' || pp.last_name) else public._doctor_name(a.doctor_id) end,
         case when a.doctor_id = auth.uid() then pp.avatar_url else dp.avatar_url end,
         case when a.doctor_id = auth.uid()
              then concat_ws(' · ',
                     case when pp.birth_date is not null then date_part('year', age(pp.birth_date))::integer || ' ans' end,
                     pp.commune)
              else d.specialty end,
         case when a.doctor_id = auth.uid() then a.reason end
  from public.appointments a
  join public.profiles pp on pp.id = a.patient_id
  join public.profiles dp on dp.id = a.doctor_id
  join public.doctor_profiles d on d.id = a.doctor_id
  where a.id = p_appointment and (a.patient_id = auth.uid() or a.doctor_id = auth.uid())
$$;

-- Vérification publique d'une ordonnance par QR : aucune donnée médicale ni nom.
create or replace function public.verify_prescription(p_code text)
returns table (code text, issued_at timestamptz, expires_at timestamptz, valid boolean)
language sql stable security definer set search_path = '' as $$
  select r.code, r.issued_at, r.expires_at, r.expires_at > now()
  from public.prescriptions r where r.code = upper(btrim(p_code))
$$;

-- ---------------------------------------------------------------------
-- Administration : argent
-- ---------------------------------------------------------------------
create or replace function public.admin_mark_refund_done(p_refund uuid, p_reference text) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.refunds;
begin
  perform public._require_admin();
  update public.refunds set status = 'effectue', reference = nullif(btrim(coalesce(p_reference, '')), ''),
         processed_at = now(), processed_by = auth.uid()
  where id = p_refund and status = 'a_traiter'
  returning * into f;
  if not found then raise exception 'REMBOURSEMENT_INTROUVABLE' using errcode = 'P0001'; end if;
  perform public._notify((select patient_id from public.payments where id = f.payment_id), 'remboursement_effectue',
    'Remboursement effectué', 'Nous vous avons remboursé ' || public._usd(f.amount_cents) || '.', '/patient/rendez-vous');
  perform public._audit('rembourser', 'remboursement', p_refund::text, jsonb_build_object('reference', p_reference));
end $$;

-- Prépare les versements : regroupe, par médecin, sa part non encore versée.
create or replace function public.admin_prepare_payouts(p_period_end date default ((now() at time zone 'Africa/Kinshasa')::date))
returns integer language plpgsql security definer set search_path = '' as $$
declare
  r record;
  v_payout uuid;
  v_count integer := 0;
  v_limit timestamptz := ((p_period_end + 1)::timestamp) at time zone 'Africa/Kinshasa';
begin
  perform public._require_admin();
  for r in
    select l.doctor_id, sum(l.amount_cents)::integer as total
    from public.ledger_entries l
    where l.type = 'part_medecin' and l.payout_id is null and l.created_at < v_limit
    group by l.doctor_id having sum(l.amount_cents) > 0
  loop
    v_payout := null;
    insert into public.payouts (doctor_id, period_end, amount_cents, method, account)
    select r.doctor_id, p_period_end, r.total, d.payout_method, d.payout_account
    from public.doctor_profiles d where d.id = r.doctor_id
    on conflict (doctor_id, period_end) do update
      set amount_cents = public.payouts.amount_cents + excluded.amount_cents
      where public.payouts.status = 'a_verser'
    returning id into v_payout;
    if v_payout is not null then
      update public.ledger_entries set payout_id = v_payout
      where doctor_id = r.doctor_id and type = 'part_medecin' and payout_id is null and created_at < v_limit;
      v_count := v_count + 1;
    end if;
  end loop;
  perform public._audit('preparer_versements', 'versement', p_period_end::text, jsonb_build_object('nombre', v_count));
  return v_count;
end $$;

create or replace function public.admin_mark_payout_paid(p_payout uuid, p_fees_cents integer, p_reference text) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.payouts;
begin
  perform public._require_admin();
  if coalesce(btrim(p_reference), '') = '' then raise exception 'REFERENCE_OBLIGATOIRE' using errcode = 'P0001'; end if;
  select * into v from public.payouts where id = p_payout and status = 'a_verser' for update;
  if not found then raise exception 'VERSEMENT_INTROUVABLE' using errcode = 'P0001'; end if;
  if p_fees_cents < 0 or p_fees_cents > v.amount_cents then raise exception 'FRAIS_INVALIDES' using errcode = 'P0001'; end if;
  update public.payouts set status = 'verse', fees_cents = p_fees_cents, reference = btrim(p_reference),
         paid_at = now(), paid_by = auth.uid()
  where id = v.id;
  perform public._notify(v.doctor_id, 'versement', 'Versement effectué',
    'MONGANGA vous a versé ' || public._usd(v.amount_cents - p_fees_cents) || ' (référence ' || btrim(p_reference) || ').', '/medecin/revenus');
  perform public._audit('verser', 'versement', p_payout::text, jsonb_build_object('reference', p_reference, 'frais', p_fees_cents));
end $$;

-- Décision de l'administration sur un rendez-vous « à examiner ».
create or replace function public.admin_resolve_appointment(p_appointment uuid, p_decision text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.appointments;
begin
  perform public._require_admin();
  select * into a from public.appointments where id = p_appointment and status = 'a_examiner' for update;
  if not found then raise exception 'RENDEZ_VOUS_INTROUVABLE' using errcode = 'P0001'; end if;
  if p_decision = 'absence_patient' then
    update public.appointments set status = 'absence_patient' where id = a.id;
    perform public._settle(a.id, a.deposit_cents, 'absence_patient');
    perform public._refund(p.id, 'solde rendu suite à l''absence') from public.payments p
      where p.appointment_id = a.id and p.kind = 'solde' and p.status = 'reussi';
  elsif p_decision = 'absence_medecin' then
    update public.appointments set status = 'absence_medecin' where id = a.id;
    perform public._refund_all(a.id, 'médecin absent');
  elsif p_decision = 'terminee' then
    update public.appointments set status = 'terminee', ended_at = coalesce(ended_at, now()) where id = a.id;
    perform public._settle(a.id, a.fee_cents, 'consultation');
  else
    raise exception 'DECISION_INVALIDE' using errcode = 'P0001';
  end if;
  perform public._audit('trancher_rendez_vous', 'rendez_vous', p_appointment::text, jsonb_build_object('decision', p_decision));
end $$;

-- ---------------------------------------------------------------------
-- Tâche périodique (toutes les minutes ou toutes les 5 minutes)
-- ---------------------------------------------------------------------
create or replace function public.tick() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r record;
  v_expired integer := 0;
  v_absent integer := 0;
  v_closed integer := 0;
  v_reminders integer := 0;
  v_purged integer := 0;
  v_absence interval := make_interval(mins => public.setting_int('absence_minutes'));
  v_grace interval := make_interval(mins => public.setting_int('fermeture_salle_minutes'));
  v_open interval := make_interval(mins => public.setting_int('ouverture_solde_minutes'));
  v_keep interval := make_interval(days => public.setting_int('conservation_jours'));
begin
  -- 1. Réservations dont l'acompte n'a pas été payé à temps : créneau libéré.
  for r in select a.* from public.appointments a
           where a.status = 'en_attente_acompte' and a.deposit_due_at < now()
             and not exists (select 1 from public.payments p where p.appointment_id = a.id and p.status = 'en_attente'
                             and p.created_at > now() - interval '10 minutes')
           for update skip locked loop
    update public.appointments set status = 'expiree' where id = r.id;
    update public.availability_slots set status = 'libre' where id = r.slot_id and status = 'reserve';
    update public.payments set status = 'annule' where appointment_id = r.id and status = 'en_attente';
    v_expired := v_expired + 1;
  end loop;

  -- 2. Rappel une heure avant : le paiement du solde est ouvert.
  for r in select a.* from public.appointments a
           where a.status = 'confirme' and a.reminder_sent_at is null
             and a.starts_at <= now() + v_open and a.starts_at > now()
           for update skip locked loop
    update public.appointments set reminder_sent_at = now() where id = r.id;
    perform public._notify(r.patient_id, 'rappel', 'Votre consultation commence bientôt',
      'Votre consultation avec ' || public._doctor_name(r.doctor_id) || ' commence le ' || public._kin(r.starts_at)
      || '. Vous pouvez dès maintenant payer le solde de ' || public._usd(r.fee_cents - r.deposit_cents) || ' et vous préparer.',
      '/patient/paiement/' || r.id || '?etape=solde');
    perform public._notify(r.doctor_id, 'rappel_medecin', 'Consultation dans moins d''une heure',
      'Consultation avec ' || public._patient_name(r.patient_id) || ' le ' || public._kin(r.starts_at) || '.', '/medecin/agenda');
    v_reminders := v_reminders + 1;
  end loop;

  -- 3. Solde toujours impayé 10 minutes après l'heure prévue : absence du patient.
  for r in select a.* from public.appointments a
           where a.status = 'confirme' and a.balance_paid_at is null and now() > a.starts_at + v_absence
           for update skip locked loop
    update public.appointments set status = 'absence_patient' where id = r.id;
    update public.payments set status = 'annule' where appointment_id = r.id and status = 'en_attente';
    perform public._settle(r.id, r.deposit_cents, 'absence_patient');
    perform public._notify(r.patient_id, 'absence_patient', 'Rendez-vous manqué',
      'Le solde n''a pas été payé à temps : le rendez-vous du ' || public._kin(r.starts_at) || ' est marqué comme manqué. L''acompte n''est pas remboursé.',
      '/patient/rendez-vous');
    perform public._notify(r.doctor_id, 'absence_patient_medecin', 'Patient absent',
      'Le patient du ' || public._kin(r.starts_at) || ' ne s''est pas présenté. Votre part de l''acompte vous sera versée samedi.', '/medecin/revenus');
    v_absent := v_absent + 1;
  end loop;

  -- 4. Salle fermée : on clôt les consultations selon qui s'est connecté.
  for r in select a.* from public.appointments a
           where a.status in ('confirme', 'en_cours') and now() > a.ends_at + v_grace
           for update skip locked loop
    if r.status = 'en_cours' then
      update public.appointments set status = 'terminee', ended_at = r.ends_at + v_grace where id = r.id;
      perform public._settle(r.id, r.fee_cents, 'consultation');
      perform public._notify(r.patient_id, 'consultation_terminee', 'Consultation terminée',
        'Retrouvez votre ordonnance dans votre espace et donnez votre avis sur la consultation.', '/patient/rendez-vous');
    elsif r.patient_joined_at is not null and r.doctor_joined_at is null then
      update public.appointments set status = 'absence_medecin' where id = r.id;
      perform public._refund_all(r.id, 'médecin absent');
      perform public._notify_admins('alerte_absence_medecin', 'Médecin absent',
        public._doctor_name(r.doctor_id) || ' ne s''est pas connecté au rendez-vous ' || r.reference || '. Le patient est remboursé.', '/admin/transactions');
    elsif r.doctor_joined_at is not null and r.patient_joined_at is null then
      update public.appointments set status = 'absence_patient' where id = r.id;
      perform public._settle(r.id, r.deposit_cents, 'absence_patient');
      perform public._refund(p.id, 'solde rendu suite à l''absence') from public.payments p
        where p.appointment_id = r.id and p.kind = 'solde' and p.status = 'reussi';
    else
      update public.appointments set status = 'a_examiner' where id = r.id;
      perform public._notify_admins('alerte_rendez_vous', 'Rendez-vous à examiner',
        'Personne ne s''est connecté au rendez-vous ' || r.reference || ' alors que le solde est payé. Décision à prendre.', '/admin/transactions');
    end if;
    v_closed := v_closed + 1;
  end loop;

  -- 5. Conservation limitée à 30 jours : ordonnances, messages et notes du médecin.
  delete from public.prescriptions where expires_at < now();
  get diagnostics v_purged = row_count;
  delete from public.consultation_messages m using public.appointments a
    where a.id = m.appointment_id and a.starts_at < now() - v_keep;
  delete from public.doctor_notes n using public.appointments a
    where a.id = n.appointment_id and a.starts_at < now() - v_keep;
  -- Les fichiers (Storage) sont supprimés par la route /api/cron, qui retire d'abord les objets stockés.

  return jsonb_build_object('expirees', v_expired, 'rappels', v_reminders, 'absences', v_absent,
                            'cloturees', v_closed, 'ordonnances_supprimees', v_purged);
end $$;

-- ---------------------------------------------------------------------
-- Droits d'exécution
-- ---------------------------------------------------------------------
revoke all on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.is_admin(), public.is_valid_doctor(uuid), public.current_role_name(), public.is_active_patient(uuid),
  public.is_participant(uuid), public.setting_int(text), public.verify_prescription(text)
to anon, authenticated;

grant execute on function
  public.submit_application(text, text, integer, text[], integer, text, public.payout_method, text, text),
  public.admin_validate_doctor(uuid), public.admin_request_complement(uuid, text), public.admin_refuse_doctor(uuid, text),
  public.admin_set_commission(uuid, numeric), public.admin_set_suspended(uuid, boolean), public.admin_update_setting(text, integer),
  public.doctor_create_slots(date, time, time), public.doctor_delete_slot(uuid),
  public.book_appointment(uuid, text), public.create_payment(uuid, public.payment_kind, public.payment_method, text, text),
  public.cancel_by_patient(uuid, text), public.cancel_by_doctor(uuid, text),
  public.join_consultation(uuid), public.end_consultation(uuid), public.save_doctor_note(uuid, text),
  public.issue_prescription(uuid, jsonb, text), public.rate_appointment(uuid, integer, text),
  public.mark_notifications_read(uuid[]),
  public.patient_appointments(), public.doctor_agenda(timestamptz, timestamptz), public.doctor_patients(),
  public.consultation_context(uuid),
  public.admin_mark_refund_done(uuid, text), public.admin_prepare_payouts(date),
  public.admin_mark_payout_paid(uuid, integer, text), public.admin_resolve_appointment(uuid, text)
to authenticated;

-- Réservées au serveur (clé service_role) : confirmation des paiements et tâche périodique.
grant execute on all functions in schema public to service_role;
