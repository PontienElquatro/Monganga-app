-- =====================================================================
-- MONGANGA — Schéma initial Supabase
-- A exécuter dans : Dashboard Supabase > SQL Editor > New query
-- Lance tout le fichier d'un coup (Run). Il est idempotent sur les
-- extensions (if not exists) mais PAS sur les tables : ne le relance
-- pas une 2e fois sans l'adapter si les tables existent déjà.
-- =====================================================================


-- =====================================================================
-- 0. EXTENSIONS
-- =====================================================================
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "btree_gist";     -- empêche le double-booking d'un créneau
-- pg_cron : sur certains projets Free, active-la d'abord via
-- Dashboard > Database > Extensions > pg_cron, puis relance juste la
-- section 7 (nettoyage programmé) plus bas.
create extension if not exists "pg_cron";


-- =====================================================================
-- 1. TYPES (ENUMS)
-- =====================================================================
create type public.user_role as enum ('patient', 'medecin', 'admin');
create type public.doctor_status as enum ('en_attente', 'valide', 'rejete', 'suspendu');
create type public.appointment_status as enum (
  'en_attente', 'confirme', 'refuse', 'annule', 'termine', 'non_honore'
);
create type public.payment_type as enum ('reservation', 'consultation');
create type public.payment_status as enum ('en_attente', 'reussi', 'echoue', 'rembourse');
create type public.payout_status as enum ('en_attente', 'verse', 'echoue');


-- =====================================================================
-- 2. TABLES
-- =====================================================================

-- --- Profils (étend auth.users) ---------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'patient',
  full_name text not null default '',
  phone text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- Profil médecin (infos spécifiques + validation admin) ------------
create table public.doctor_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  specialty text not null,
  bio text,
  status doctor_status not null default 'en_attente',
  consultation_fee numeric(10,2),
  commission_rate numeric(5,2) not null default 30.00, -- % plateforme (dégressif = à faire évoluer plus tard)
  rejection_reason text,
  validated_at timestamptz,
  validated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- Créneaux de disponibilité ------------------------------------------
create table public.availabilities (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint availabilities_time_check check (end_time > start_time)
);

-- Empêche deux créneaux qui se chevauchent pour un même médecin
alter table public.availabilities
  add constraint no_overlapping_slots
  exclude using gist (doctor_id with =, tstzrange(start_time, end_time) with &&);

-- --- Rendez-vous ---------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  availability_id uuid not null references public.availabilities(id),
  status appointment_status not null default 'en_attente',
  reservation_fee numeric(10,2) not null default 1.00,
  reservation_paid boolean not null default false,
  consultation_fee numeric(10,2),
  consultation_paid boolean not null default false,
  no_show_by text, -- 'patient' | 'medecin' | null
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- Consultations (= la téléconsultation réalisée) ----------------------
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  call_session_id text, -- id de session Daily.co ou équivalent
  notes text,
  created_at timestamptz not null default now()
);

-- --- Ordonnances (suppression auto après 30 jours, cf section 7) -------
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  doctor_id uuid not null references public.doctor_profiles(id),
  patient_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

-- --- Notifications ---------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- --- Paiements (réservation 1$ ou consultation) ---------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  payer_id uuid not null references public.profiles(id),
  type payment_type not null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status payment_status not null default 'en_attente',
  provider text not null default 'mock', -- 'mock' | 'pawapay' | 'serdipay' | ...
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- Ledger (répartition 70/30 par transaction) ---------------------------
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  beneficiary_id uuid not null references public.profiles(id),
  beneficiary_role text not null, -- 'medecin' | 'plateforme'
  amount numeric(10,2) not null,
  rate_applied numeric(5,2),
  status text not null default 'a_verser', -- 'a_verser' | 'verse'
  payout_id uuid, -- rempli au moment du reversement (fk ajoutée plus bas)
  created_at timestamptz not null default now()
);

-- --- Reversements hebdomadaires aux médecins ------------------------------
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id),
  period_start date not null,
  period_end date not null,
  gross_amount numeric(10,2) not null,
  fees numeric(10,2) not null default 0,
  net_amount numeric(10,2) not null,
  status payout_status not null default 'en_attente',
  provider_reference text,
  created_at timestamptz not null default now()
);

alter table public.ledger_entries
  add constraint ledger_entries_payout_fk
  foreign key (payout_id) references public.payouts(id);

-- --- Événements webhook bruts (agrégateur Mobile Money) -------------------
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text,
  payload jsonb not null,
  processed boolean not null default false,
  received_at timestamptz not null default now()
);


-- =====================================================================
-- 3. FONCTIONS UTILITAIRES
-- =====================================================================

-- Rôle de l'utilisateur courant (pour les policies RLS)
create or replace function public.current_user_role()
returns user_role
language sql stable security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Auto-création du profil à l'inscription (auth.users -> profiles)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'patient'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at_doctor_profiles before update on public.doctor_profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at_appointments before update on public.appointments
  for each row execute function public.set_updated_at();
create trigger set_updated_at_payments before update on public.payments
  for each row execute function public.set_updated_at();


-- =====================================================================
-- 4. ROW LEVEL SECURITY — activation
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.availabilities enable row level security;
alter table public.appointments enable row level security;
alter table public.consultations enable row level security;
alter table public.prescriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payouts enable row level security;
alter table public.webhook_events enable row level security;
-- webhook_events : aucune policy ci-dessous => verrouillée pour tout
-- le monde sauf le service_role (utilisé par les Edge Functions).


-- =====================================================================
-- 5. ROW LEVEL SECURITY — policies
-- =====================================================================

-- --- profiles : chacun voit son propre profil ; les médecins sont
-- visibles publiquement (recherche) ; l'admin voit tout -----------------
create policy "profiles_select"
  on public.profiles for select
  using (
    id = auth.uid()
    or role = 'medecin'
    or public.current_user_role() = 'admin'
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- --- doctor_profiles : visible si validé (recherche patient), ou si
-- c'est le médecin lui-même, ou si admin --------------------------------
create policy "doctor_profiles_select"
  on public.doctor_profiles for select
  using (
    status = 'valide'
    or id = auth.uid()
    or public.current_user_role() = 'admin'
  );

create policy "doctor_profiles_update_own"
  on public.doctor_profiles for update
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "doctor_profiles_insert_own"
  on public.doctor_profiles for insert
  with check (id = auth.uid());

-- --- availabilities : lecture publique (pour la prise de RDV), écriture
-- réservée au médecin propriétaire ou à l'admin --------------------------
create policy "availabilities_select"
  on public.availabilities for select
  using (true);

create policy "availabilities_write_own"
  on public.availabilities for all
  using (doctor_id = auth.uid() or public.current_user_role() = 'admin')
  with check (doctor_id = auth.uid() or public.current_user_role() = 'admin');

-- --- appointments : visible par le patient et le médecin concernés, et
-- l'admin ; création par le patient ; mise à jour par les 2 parties -----
create policy "appointments_select"
  on public.appointments for select
  using (
    patient_id = auth.uid()
    or doctor_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

create policy "appointments_insert"
  on public.appointments for insert
  with check (patient_id = auth.uid());

create policy "appointments_update"
  on public.appointments for update
  using (
    patient_id = auth.uid()
    or doctor_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

-- --- consultations : visibles par patient/médecin concernés ; gérées
-- par le médecin ----------------------------------------------------------
create policy "consultations_select"
  on public.consultations for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = consultations.appointment_id
        and (a.patient_id = auth.uid() or a.doctor_id = auth.uid())
    )
    or public.current_user_role() = 'admin'
  );

create policy "consultations_write_doctor"
  on public.consultations for all
  using (
    exists (
      select 1 from public.appointments a
      where a.id = consultations.appointment_id
        and a.doctor_id = auth.uid()
    )
    or public.current_user_role() = 'admin'
  );

-- --- prescriptions : patient et médecin concernés UNIQUEMENT (pas
-- l'admin, conformément à la demande du client sur la confidentialité) --
create policy "prescriptions_select"
  on public.prescriptions for select
  using (
    (patient_id = auth.uid() or doctor_id = auth.uid())
    and expires_at > now()
  );

create policy "prescriptions_insert_doctor"
  on public.prescriptions for insert
  with check (doctor_id = auth.uid());

-- --- notifications : chacun voit et marque lues ses propres notifs -----
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid());

-- --- payments : lecture pour le payeur, le médecin concerné, l'admin.
-- Aucune policy d'insert/update => seules les Edge Functions
-- (service_role, qui bypass RLS) peuvent créer/modifier un paiement. ----
create policy "payments_select"
  on public.payments for select
  using (
    payer_id = auth.uid()
    or exists (
      select 1 from public.appointments a
      where a.id = payments.appointment_id and a.doctor_id = auth.uid()
    )
    or public.current_user_role() = 'admin'
  );

-- --- ledger_entries : le médecin voit SA part, l'admin voit tout ; pas
-- d'écriture côté client -------------------------------------------------
create policy "ledger_entries_select_own"
  on public.ledger_entries for select
  using (
    beneficiary_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

-- --- payouts : le médecin voit ses reversements, l'admin voit tout -----
create policy "payouts_select_own"
  on public.payouts for select
  using (
    doctor_id = auth.uid()
    or public.current_user_role() = 'admin'
  );


-- =====================================================================
-- 6. INDEX
-- =====================================================================
create index idx_doctor_profiles_status on public.doctor_profiles(status);
create index idx_availabilities_doctor on public.availabilities(doctor_id);
create index idx_availabilities_booked on public.availabilities(is_booked);
create index idx_appointments_patient on public.appointments(patient_id);
create index idx_appointments_doctor on public.appointments(doctor_id);
create index idx_appointments_status on public.appointments(status);
create index idx_notifications_user on public.notifications(user_id, is_read);
create index idx_payments_appointment on public.payments(appointment_id);
create index idx_ledger_beneficiary on public.ledger_entries(beneficiary_id, status);
create index idx_payouts_doctor on public.payouts(doctor_id);
create index idx_prescriptions_expires on public.prescriptions(expires_at);


-- =====================================================================
-- 7. NETTOYAGE PROGRAMMÉ — ordonnances supprimées après 30 jours
-- (demande explicite du client) + médecins qui dorment en non-réponse
-- =====================================================================
create or replace function public.cleanup_expired_prescriptions()
returns void
language plpgsql security definer
as $$
begin
  delete from public.prescriptions where expires_at < now();
end;
$$;

-- Tourne tous les jours à 2h du matin (heure du serveur, UTC)
select cron.schedule(
  'cleanup-prescriptions-daily',
  '0 2 * * *',
  $$select public.cleanup_expired_prescriptions();$$
);

-- NB : si "create extension pg_cron" plus haut échoue (selon le plan),
-- active-la depuis Dashboard > Database > Extensions, puis relance
-- uniquement cette section 7.


-- =====================================================================
-- FIN — prochaines étapes côté Next.js :
-- 1. npm install @supabase/supabase-js
-- 2. .env.local :
--    NEXT_PUBLIC_SUPABASE_URL=...
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (client, respecte la RLS)
--    SUPABASE_SERVICE_ROLE_KEY=...       (serveur UNIQUEMENT, jamais
--                                          exposée au navigateur —
--                                          utilisée par les Edge
--                                          Functions de paiement)
-- 3. Génère les types TypeScript depuis le schéma :
--    npx supabase gen types typescript --project-id <ton-project-id> > types/supabase.ts
-- =====================================================================
