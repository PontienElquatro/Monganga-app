-- =====================================================================
-- Sécurité : création des profils, rôles, règles d'accès (RLS) et droits.
-- Principe : la base vérifie elle-même chaque accès ; l'écran ne suffit jamais.
-- Toute écriture sensible passe par des fonctions (voir migration 3).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fonctions d'aide (security definer pour éviter la récursion RLS)
-- ---------------------------------------------------------------------
create or replace function public.current_role_name() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and suspended_at is null
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and suspended_at is null)
$$;

create or replace function public.is_valid_doctor(p_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.doctor_profiles d join public.profiles p on p.id = d.id
    where d.id = p_id and d.status = 'valide' and p.role = 'medecin' and p.suspended_at is null
  )
$$;

create or replace function public.is_active_patient(p_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = p_id and role = 'patient' and suspended_at is null)
$$;

create or replace function public.is_participant(p_appointment uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.appointments a
    where a.id = p_appointment and (a.patient_id = auth.uid() or a.doctor_id = auth.uid())
  )
$$;

-- ---------------------------------------------------------------------
-- Création du profil à l'inscription.
-- Les métadonnées viennent du navigateur : on n'en accepte que les noms,
-- le téléphone et l'intention « médecin ». Personne ne devient admin ainsi.
-- Un candidat médecin a le rôle « medecin » mais aucun droit tant que son
-- dossier n'est pas validé (voir is_valid_doctor).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.user_role := case when meta->>'account_type' = 'medecin' then 'medecin' else 'patient' end;
  v_phone text := nullif(btrim(meta->>'phone'), '');
begin
  if v_phone is not null and v_phone !~ '^[+0-9 ()\-]{9,20}$' then
    v_phone := null;
  end if;
  insert into public.profiles (id, role, first_name, last_name, email, phone, accepted_terms_at)
  values (
    new.id,
    v_role,
    left(coalesce(btrim(meta->>'first_name'), ''), 80),
    left(coalesce(btrim(meta->>'last_name'), ''), 80),
    coalesce(new.email, ''),
    v_phone,
    case when (meta->>'accepted_terms') = 'true' then now() end
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Activation de la RLS partout
-- ---------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.profiles enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.doctor_documents enable row level security;
alter table public.availability_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.payouts enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.doctor_notes enable row level security;
alter table public.prescriptions enable row level security;
alter table public.consultation_messages enable row level security;
alter table public.consultation_files enable row level security;
alter table public.ratings enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

-- On part de zéro : aucun droit implicite pour les rôles de l'API.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ---------------------------------------------------------------------
-- Paramètres : lisibles par tous, modifiables par l'admin (via fonction).
-- ---------------------------------------------------------------------
grant select on public.settings to anon, authenticated;
create policy settings_read on public.settings for select using (true);

-- ---------------------------------------------------------------------
-- Profils : chacun voit et modifie le sien ; l'admin voit tout.
-- Un médecin voit le nom de ses patients via des fonctions dédiées.
-- ---------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (first_name, last_name, phone, avatar_url, birth_date, sex, commune) on public.profiles to authenticated;
create policy profiles_select_own on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- Médecins : le médecin voit son dossier, sauf la commission (droits par colonne).
-- Les patients passent par la vue publique doctors_public.
-- ---------------------------------------------------------------------
grant select (id, title, specialty, bio, languages, years_experience, commune, fee_cents, status,
              payout_method, payout_account, payout_holder, admin_message, submitted_at, decided_at,
              created_at, updated_at)
  on public.doctor_profiles to authenticated;
grant update (bio, languages, years_experience, commune, fee_cents, payout_method, payout_account, payout_holder)
  on public.doctor_profiles to authenticated;
create policy doctor_profiles_select_own on public.doctor_profiles for select using (id = auth.uid() or public.is_admin());
create policy doctor_profiles_update_own on public.doctor_profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Contrôle du tarif à chaque modification (bornes définies dans les paramètres).
create or replace function public.check_doctor_fee() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.fee_cents < public.setting_int('tarif_min_centimes') or new.fee_cents > public.setting_int('tarif_max_centimes') then
    raise exception 'TARIF_HORS_LIMITES' using errcode = 'P0001';
  end if;
  if new.fee_cents <= public.setting_int('acompte_centimes') then
    raise exception 'TARIF_INFERIEUR_ACOMPTE' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger doctor_profiles_fee_check before insert or update of fee_cents on public.doctor_profiles
  for each row execute function public.check_doctor_fee();

-- Pièces de candidature : le candidat gère les siennes tant qu'il n'est pas validé ; l'admin les lit.
grant select, insert, delete on public.doctor_documents to authenticated;
create policy doctor_documents_select on public.doctor_documents for select using (doctor_id = auth.uid() or public.is_admin());
create policy doctor_documents_insert on public.doctor_documents for insert with check (
  doctor_id = auth.uid()
  and exists (select 1 from public.doctor_profiles d where d.id = auth.uid() and d.status in ('en_attente', 'complement_demande', 'refuse'))
  and storage_path like auth.uid()::text || '/%'
);
create policy doctor_documents_delete on public.doctor_documents for delete using (
  doctor_id = auth.uid()
  and exists (select 1 from public.doctor_profiles d where d.id = auth.uid() and d.status in ('en_attente', 'complement_demande', 'refuse'))
);

-- ---------------------------------------------------------------------
-- Créneaux : lecture publique des créneaux des médecins validés ;
-- écriture par fonctions uniquement.
-- ---------------------------------------------------------------------
grant select on public.availability_slots to anon, authenticated;
create policy slots_read on public.availability_slots for select using (
  public.is_valid_doctor(doctor_id) or doctor_id = auth.uid() or public.is_admin()
);

-- ---------------------------------------------------------------------
-- Rendez-vous et argent : lecture par les intéressés ; écriture par fonctions.
-- ---------------------------------------------------------------------
-- Toutes les colonnes sauf la commission (instantané) : le médecin ne voit jamais le taux.
grant select (id, reference, patient_id, doctor_id, slot_id, starts_at, ends_at, status, reason, fee_cents, deposit_cents,
              deposit_due_at, confirmed_at, balance_paid_at, reminder_sent_at, patient_joined_at, doctor_joined_at,
              started_at, ended_at, cancelled_at, cancelled_by, cancel_reason, room_name, created_at, updated_at)
  on public.appointments to authenticated;
create policy appointments_read on public.appointments for select using (
  patient_id = auth.uid() or doctor_id = auth.uid() or public.is_admin()
);

grant select on public.payments to authenticated;
create policy payments_read on public.payments for select using (patient_id = auth.uid() or public.is_admin());

grant select on public.refunds to authenticated;
create policy refunds_read on public.refunds for select using (
  public.is_admin() or exists (select 1 from public.payments p where p.id = payment_id and p.patient_id = auth.uid())
);

-- Le médecin ne voit que sa part, jamais la part de la plateforme.
grant select on public.ledger_entries to authenticated;
create policy ledger_read on public.ledger_entries for select using (
  public.is_admin() or (doctor_id = auth.uid() and type = 'part_medecin')
);

grant select on public.payouts to authenticated;
create policy payouts_read on public.payouts for select using (doctor_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- Contenu médical : jamais l'administration.
-- ---------------------------------------------------------------------
grant select, insert, update on public.doctor_notes to authenticated;
create policy doctor_notes_own on public.doctor_notes for all
  using (doctor_id = auth.uid())
  with check (
    doctor_id = auth.uid() and public.is_valid_doctor()
    and exists (select 1 from public.appointments a where a.id = appointment_id and a.doctor_id = auth.uid())
  );

grant select on public.prescriptions to authenticated;
create policy prescriptions_read on public.prescriptions for select using (patient_id = auth.uid() or doctor_id = auth.uid());

grant select, insert on public.consultation_messages to authenticated;
create policy messages_read on public.consultation_messages for select using (public.is_participant(appointment_id));
create policy messages_insert on public.consultation_messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.appointments a
    where a.id = appointment_id and (a.patient_id = auth.uid() or a.doctor_id = auth.uid())
      and a.status in ('confirme', 'en_cours')
      and now() between a.starts_at - interval '15 minutes'
                    and a.ends_at + make_interval(mins => public.setting_int('fermeture_salle_minutes'))
  )
);

grant select, insert on public.consultation_files to authenticated;
create policy files_read on public.consultation_files for select using (public.is_participant(appointment_id));
create policy files_insert on public.consultation_files for insert with check (
  uploader_id = auth.uid()
  and storage_path like appointment_id::text || '/%'
  and exists (
    select 1 from public.appointments a
    where a.id = appointment_id and (a.patient_id = auth.uid() or a.doctor_id = auth.uid())
      and a.status in ('confirme', 'en_cours')
      and now() between a.starts_at - interval '15 minutes'
                    and a.ends_at + make_interval(mins => public.setting_int('fermeture_salle_minutes'))
  )
);

-- Notes de qualité : administration uniquement (écriture par fonction).
grant select on public.ratings to authenticated;
create policy ratings_admin on public.ratings for select using (public.is_admin());

-- Notifications : chacun les siennes.
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_read on public.notifications for select using (user_id = auth.uid());
create policy notifications_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.audit_log to authenticated;
create policy audit_admin on public.audit_log for select using (public.is_admin());

-- Fonctions d'aide utilisables par l'API
grant execute on function public.is_admin(), public.is_valid_doctor(uuid), public.current_role_name(),
  public.is_active_patient(uuid), public.is_participant(uuid), public.setting_int(text)
  to anon, authenticated;
