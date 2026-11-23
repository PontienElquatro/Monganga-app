-- =====================================================================
-- Rôles de l'administration : super, finance, support, validation.
-- Chaque membre de l'équipe a un ou plusieurs rôles ; « super » donne tous les droits
-- et seul lui gère l'équipe et les paramètres. Les droits sont vérifiés ici, dans la base :
-- l'écran ne fait qu'afficher ce que la base autorise.
-- Aucun rôle ne donne accès aux ordonnances, notes médicales ou messages de consultation.
-- =====================================================================

create type public.admin_permission as enum ('super', 'finance', 'support', 'validation');

alter table public.profiles add column admin_roles public.admin_permission[] not null default '{}';

-- Les administrateurs déjà existants deviennent super administrateurs.
update public.profiles set admin_roles = '{super}' where role = 'admin' and admin_roles = '{}';

-- ---------------------------------------------------------------------
-- Vérification des droits
-- ---------------------------------------------------------------------
create or replace function public.has_admin_role(p_role public.admin_permission) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and suspended_at is null
      and ('super' = any(admin_roles) or p_role = any(admin_roles))
  )
$$;

create or replace function public._require_admin_role(p_role public.admin_permission) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_admin_role(p_role) then raise exception 'ACCES_REFUSE' using errcode = 'P0001'; end if;
end $$;

-- ---------------------------------------------------------------------
-- Alertes : chaque alerte va aux rôles concernés (et toujours aux super administrateurs).
-- ---------------------------------------------------------------------
create or replace function public._notify_admins(p_kind text, p_title text, p_body text, p_link text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select id, p_kind, p_title, p_body, p_link from public.profiles
  where role = 'admin' and suspended_at is null
    and ('super' = any(admin_roles) or admin_roles && (case
          when p_kind = 'candidature' then array['validation']
          when p_kind in ('alerte_annulation', 'alerte_absence_medecin') then array['finance', 'support']
          when p_kind = 'alerte_rendez_vous' then array['finance']
          else array[]::text[]
        end)::public.admin_permission[])
$$;

-- ---------------------------------------------------------------------
-- Actions de l'administration, chacune réservée à son rôle
-- ---------------------------------------------------------------------
-- admin_validate_doctor : rôle « validation »
create or replace function public.admin_validate_doctor(p_doctor uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_missing text[];
begin
  perform public._require_admin_role('validation');
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

-- admin_request_complement : rôle « validation »
create or replace function public.admin_request_complement(p_doctor uuid, p_message text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin_role('validation');
  if coalesce(btrim(p_message), '') = '' then raise exception 'MESSAGE_OBLIGATOIRE' using errcode = 'P0001'; end if;
  update public.doctor_profiles set status = 'complement_demande', admin_message = btrim(p_message), decided_at = now(), decided_by = auth.uid()
  where id = p_doctor and status in ('en_attente', 'complement_demande');
  if not found then raise exception 'DOSSIER_INTROUVABLE' using errcode = 'P0001'; end if;
  perform public._notify(p_doctor, 'dossier_complement', 'Un complément est demandé pour votre dossier', btrim(p_message), '/dossier');
  perform public._audit('demander_complement', 'medecin', p_doctor::text, jsonb_build_object('message', p_message));
end $$;

-- admin_refuse_doctor : rôle « validation »
create or replace function public.admin_refuse_doctor(p_doctor uuid, p_message text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin_role('validation');
  if coalesce(btrim(p_message), '') = '' then raise exception 'MOTIF_OBLIGATOIRE' using errcode = 'P0001'; end if;
  update public.doctor_profiles set status = 'refuse', admin_message = btrim(p_message), decided_at = now(), decided_by = auth.uid()
  where id = p_doctor and status in ('en_attente', 'complement_demande');
  if not found then raise exception 'DOSSIER_INTROUVABLE' using errcode = 'P0001'; end if;
  perform public._notify(p_doctor, 'dossier_refuse', 'Votre dossier n''a pas été validé', btrim(p_message), '/dossier');
  perform public._audit('refuser_medecin', 'medecin', p_doctor::text, jsonb_build_object('motif', p_message));
end $$;

-- admin_set_commission : rôle « super »
create or replace function public.admin_set_commission(p_doctor uuid, p_rate numeric) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin_role('super');
  if p_rate is null or p_rate < 0 or p_rate > 100 then raise exception 'COMMISSION_INVALIDE' using errcode = 'P0001'; end if;
  update public.doctor_profiles set commission_rate = p_rate where id = p_doctor;
  if not found then raise exception 'DOSSIER_INTROUVABLE' using errcode = 'P0001'; end if;
  perform public._audit('modifier_commission', 'medecin', p_doctor::text, jsonb_build_object('taux', p_rate));
end $$;

-- admin_set_suspended : rôle « support »
create or replace function public.admin_set_suspended(p_user uuid, p_suspended boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  perform public._require_admin_role('support');
  if p_user = auth.uid() then raise exception 'ACTION_IMPOSSIBLE' using errcode = 'P0001'; end if;
  -- Seul un super administrateur peut suspendre un membre de l'équipe.
  if exists (select 1 from public.profiles where id = p_user and role = 'admin') and not public.has_admin_role('super') then
    raise exception 'ACCES_REFUSE' using errcode = 'P0001';
  end if;
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

-- admin_update_setting : rôle « super »
create or replace function public.admin_update_setting(p_key text, p_value integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._require_admin_role('super');
  if p_value is null or p_value < 0 then raise exception 'VALEUR_INVALIDE' using errcode = 'P0001'; end if;
  update public.settings set value = to_jsonb(p_value), updated_at = now() where key = p_key;
  if not found then raise exception 'PARAMETRE_INCONNU' using errcode = 'P0001'; end if;
  perform public._audit('modifier_parametre', 'parametre', p_key, jsonb_build_object('valeur', p_value));
end $$;

-- admin_mark_refund_done : rôle « finance »
create or replace function public.admin_mark_refund_done(p_refund uuid, p_reference text) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.refunds;
begin
  perform public._require_admin_role('finance');
  update public.refunds set status = 'effectue', reference = nullif(btrim(coalesce(p_reference, '')), ''),
         processed_at = now(), processed_by = auth.uid()
  where id = p_refund and status = 'a_traiter'
  returning * into f;
  if not found then raise exception 'REMBOURSEMENT_INTROUVABLE' using errcode = 'P0001'; end if;
  perform public._notify((select patient_id from public.payments where id = f.payment_id), 'remboursement_effectue',
    'Remboursement effectué', 'Nous vous avons remboursé ' || public._usd(f.amount_cents) || '.', '/patient/rendez-vous');
  perform public._audit('rembourser', 'remboursement', p_refund::text, jsonb_build_object('reference', p_reference));
end $$;

-- admin_prepare_payouts : rôle « finance »
create or replace function public.admin_prepare_payouts(p_period_end date default ((now() at time zone 'Africa/Kinshasa')::date))
returns integer language plpgsql security definer set search_path = '' as $$
declare
  r record;
  v_payout uuid;
  v_count integer := 0;
  v_limit timestamptz := ((p_period_end + 1)::timestamp) at time zone 'Africa/Kinshasa';
begin
  perform public._require_admin_role('finance');
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

-- admin_mark_payout_paid : rôle « finance »
create or replace function public.admin_mark_payout_paid(p_payout uuid, p_fees_cents integer, p_reference text) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.payouts;
begin
  perform public._require_admin_role('finance');
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

-- admin_resolve_appointment : rôle « finance »
create or replace function public.admin_resolve_appointment(p_appointment uuid, p_decision text) returns void
language plpgsql security definer set search_path = '' as $$
declare a public.appointments;
begin
  perform public._require_admin_role('finance');
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
-- Équipe : seul un super administrateur donne ou retire des rôles.
-- La personne doit d'abord avoir un compte (patient) sur le site ; un compte médecin
-- ne peut pas devenir administrateur. Il reste toujours au moins un super administrateur.
-- ---------------------------------------------------------------------
create or replace function public.admin_set_team_roles(p_email text, p_roles public.admin_permission[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  t public.profiles;
  v_roles public.admin_permission[];
begin
  perform public._require_admin_role('super');
  select array_agg(distinct r order by r) into v_roles from unnest(coalesce(p_roles, '{}')) r;
  v_roles := coalesce(v_roles, '{}');

  select * into t from public.profiles where lower(email) = lower(btrim(coalesce(p_email, ''))) for update;
  if not found then raise exception 'UTILISATEUR_INTROUVABLE' using errcode = 'P0001'; end if;
  if t.role = 'medecin' then raise exception 'COMPTE_MEDECIN' using errcode = 'P0001'; end if;
  if t.role = 'admin' and 'super' = any(t.admin_roles) and not ('super' = any(v_roles))
     and not exists (select 1 from public.profiles p where p.role = 'admin' and p.suspended_at is null
                     and 'super' = any(p.admin_roles) and p.id <> t.id) then
    raise exception 'DERNIER_SUPER_ADMIN' using errcode = 'P0001';
  end if;

  if cardinality(v_roles) = 0 then
    update public.profiles set role = 'patient', admin_roles = '{}', updated_at = now() where id = t.id;
  else
    update public.profiles set role = 'admin', admin_roles = v_roles, updated_at = now() where id = t.id;
  end if;
  perform public._audit('modifier_equipe', 'utilisateur', t.id::text, jsonb_build_object('roles', v_roles));
end $$;

-- ---------------------------------------------------------------------
-- Support : rendez-vous d'un utilisateur, sans aucun montant.
-- ---------------------------------------------------------------------
create or replace function public.admin_user_appointments(p_user uuid)
returns table (id uuid, reference text, status public.appointment_status, starts_at timestamptz,
               as_role text, other_name text, cancel_reason text)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public._require_admin_role('support');
  return query
  select a.id, a.reference, a.status, a.starts_at,
         case when a.patient_id = p_user then 'patient' else 'medecin' end,
         case when a.patient_id = p_user then public._doctor_name(a.doctor_id) else public._patient_name(a.patient_id) end,
         a.cancel_reason
  from public.appointments a
  where a.patient_id = p_user or a.doctor_id = p_user
  order by a.starts_at desc
  limit 200;
end $$;

-- Chiffres d'activité sans montants (tableau de bord de chaque rôle).
create or replace function public.admin_activity() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_today timestamptz := ((now() at time zone 'Africa/Kinshasa')::date)::timestamp at time zone 'Africa/Kinshasa';
begin
  if not public.is_admin() then raise exception 'ACCES_REFUSE' using errcode = 'P0001'; end if;
  return jsonb_build_object(
    'rdv_aujourdhui', (select count(*) from public.appointments where status in ('confirme', 'en_cours', 'terminee')
                        and starts_at >= v_today and starts_at < v_today + interval '1 day'),
    'rdv_a_examiner', (select count(*) from public.appointments where status = 'a_examiner'),
    'annulations_medecin_7j', (select count(*) from public.appointments where status in ('annulee_medecin', 'absence_medecin')
                        and starts_at >= now() - interval '7 days'),
    'patients', (select count(*) from public.profiles where role = 'patient'),
    'nouveaux_patients_7j', (select count(*) from public.profiles where role = 'patient' and created_at >= now() - interval '7 days'),
    'comptes_suspendus', (select count(*) from public.profiles where suspended_at is not null),
    'dossiers_en_attente', (select count(*) from public.doctor_profiles where status = 'en_attente'),
    'complements_demandes', (select count(*) from public.doctor_profiles where status = 'complement_demande'),
    'medecins_valides', (select count(*) from public.doctor_profiles where status = 'valide')
  );
end $$;

-- ---------------------------------------------------------------------
-- Lecture des données sensibles selon le rôle
-- ---------------------------------------------------------------------
drop policy doctor_documents_select on public.doctor_documents;
create policy doctor_documents_select on public.doctor_documents for select using (
  doctor_id = auth.uid() or public.has_admin_role('validation')
);

drop policy appointments_read on public.appointments;
create policy appointments_read on public.appointments for select using (
  patient_id = auth.uid() or doctor_id = auth.uid() or public.has_admin_role('finance')
);

drop policy payments_read on public.payments;
create policy payments_read on public.payments for select using (patient_id = auth.uid() or public.has_admin_role('finance'));

drop policy refunds_read on public.refunds;
create policy refunds_read on public.refunds for select using (
  public.has_admin_role('finance') or exists (select 1 from public.payments p where p.id = payment_id and p.patient_id = auth.uid())
);

drop policy ledger_read on public.ledger_entries;
create policy ledger_read on public.ledger_entries for select using (
  public.has_admin_role('finance') or (doctor_id = auth.uid() and type = 'part_medecin')
);

drop policy payouts_read on public.payouts;
create policy payouts_read on public.payouts for select using (doctor_id = auth.uid() or public.has_admin_role('finance'));

drop policy ratings_admin on public.ratings;
create policy ratings_admin on public.ratings for select using (
  public.has_admin_role('validation') or public.has_admin_role('support')
);

drop policy audit_admin on public.audit_log;
create policy audit_admin on public.audit_log for select using (public.has_admin_role('super'));

drop policy "candidatures : lecture candidat et admin" on storage.objects;
create policy "candidatures : lecture candidat et admin" on storage.objects for select to authenticated using (
  bucket_id = 'candidatures' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_admin_role('validation'))
);

-- ---------------------------------------------------------------------
-- Droits d'exécution (les nouvelles fonctions sont fermées par défaut)
-- ---------------------------------------------------------------------
revoke all on function public.has_admin_role(public.admin_permission), public._require_admin_role(public.admin_permission),
  public.admin_set_team_roles(text, public.admin_permission[]), public.admin_user_appointments(uuid), public.admin_activity()
  from public, anon, authenticated;
grant execute on function public.has_admin_role(public.admin_permission) to anon, authenticated;
grant execute on function public.admin_set_team_roles(text, public.admin_permission[]), public.admin_user_appointments(uuid),
  public.admin_activity() to authenticated;
grant execute on function public.has_admin_role(public.admin_permission), public._require_admin_role(public.admin_permission),
  public.admin_set_team_roles(text, public.admin_permission[]), public.admin_user_appointments(uuid), public.admin_activity()
  to service_role;
