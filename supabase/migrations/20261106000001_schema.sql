-- =====================================================================
-- MONGANGA na Tshombo — Schéma de la base de données (v2)
-- BisoTech · novembre 2026
--
-- Règles métier (dossier de présentation validé) :
--   * le médecin fixe son tarif ; la plateforme prend une commission (30 % par défaut,
--     ajustable par médecin) ; le médecin reçoit le reste chaque samedi ;
--   * acompte de 1 $ inclus dans le tarif, payé à la réservation ; solde payé
--     à partir d'une heure avant la consultation ;
--   * consultation de 30 minutes ; avertissement 5 min avant la fin ; salle fermée
--     10 min après la fin prévue ;
--   * patient absent (solde non payé 10 min après l'heure) : acompte partagé
--     selon la commission ; annulation patient > 24 h : acompte remboursé ;
--     < 24 h : acompte conservé ; médecin absent ou annule : remboursement total ;
--   * ordonnances, documents et messages supprimés 30 jours après la consultation ;
--   * notes des patients visibles par l'administration seulement ;
--   * aucune coordonnée du médecin visible côté patient ;
--   * l'administration n'a pas accès aux ordonnances ni au contenu médical.
-- Montants : en centimes de dollar (USD). Fuseau métier : Africa/Kinshasa.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type public.user_role as enum ('patient', 'medecin', 'admin');
create type public.doctor_status as enum ('en_attente', 'complement_demande', 'valide', 'refuse', 'suspendu');
create type public.document_kind as enum ('photo', 'identite', 'diplome', 'ordre', 'cv', 'specialisation', 'autre');
create type public.slot_status as enum ('libre', 'reserve', 'bloque');
create type public.appointment_status as enum (
  'en_attente_acompte',  -- créneau retenu, acompte pas encore payé
  'confirme',            -- acompte payé
  'en_cours',            -- consultation démarrée
  'terminee',            -- consultation terminée
  'annulee_patient',
  'annulee_medecin',
  'absence_patient',
  'absence_medecin',
  'expiree',             -- acompte jamais payé
  'a_examiner'           -- situation ambiguë, décision de l'administration
);
create type public.payment_kind as enum ('acompte', 'solde');
create type public.payment_status as enum ('en_attente', 'reussi', 'echoue', 'annule');
create type public.payment_method as enum ('mpesa', 'orange_money', 'airtel_money', 'carte');
create type public.payout_method as enum ('mpesa', 'orange_money', 'airtel_money', 'banque');
create type public.refund_status as enum ('a_traiter', 'effectue');
create type public.ledger_type as enum ('part_medecin', 'part_plateforme');
create type public.payout_status as enum ('a_verser', 'verse');

-- ---------------------------------------------------------------------
-- Paramètres de la plateforme (modifiables par l'administration)
-- ---------------------------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null,
  description text not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value, description) values
  ('acompte_centimes', '100', 'Montant de l''acompte de réservation, en centimes de dollar (inclus dans le tarif).'),
  ('commission_defaut', '30', 'Commission de la plateforme par défaut, en pourcentage du tarif.'),
  ('duree_consultation_minutes', '30', 'Durée d''une consultation.'),
  ('delai_min_reservation_minutes', '120', 'Délai minimum entre la réservation et le début de la consultation.'),
  ('delai_paiement_acompte_minutes', '15', 'Temps laissé au patient pour payer l''acompte avant de libérer le créneau.'),
  ('ouverture_solde_minutes', '60', 'Le solde peut être payé à partir de ce nombre de minutes avant la consultation.'),
  ('annulation_gratuite_heures', '24', 'Au-delà de ce délai avant la consultation, l''annulation par le patient rembourse l''acompte.'),
  ('absence_minutes', '10', 'Minutes après l''heure prévue au-delà desquelles un solde impayé vaut absence du patient.'),
  ('fermeture_salle_minutes', '10', 'La salle de visio se ferme ce nombre de minutes après la fin prévue.'),
  ('conservation_jours', '30', 'Durée de conservation des ordonnances, documents et messages après la consultation.'),
  ('tarif_min_centimes', '500', 'Tarif minimum qu''un médecin peut fixer.'),
  ('tarif_max_centimes', '50000', 'Tarif maximum qu''un médecin peut fixer.');

create or replace function public.setting_int(p_key text) returns integer
language sql stable security definer set search_path = '' as $$
  select (value #>> '{}')::integer from public.settings where key = p_key
$$;

-- ---------------------------------------------------------------------
-- Profils
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'patient',
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  email text not null default '',
  phone text check (phone is null or phone ~ '^[+0-9 ()\-]{9,20}$'),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://res\.cloudinary\.com/'),
  birth_date date check (birth_date is null or birth_date between '1900-01-01' and current_date),
  sex text check (sex is null or sex in ('F', 'M')),
  commune text check (commune is null or char_length(commune) <= 60),
  accepted_terms_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------
-- Médecins
-- ---------------------------------------------------------------------
create table public.doctor_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  title text not null default 'Dr',
  specialty text not null check (char_length(specialty) between 2 and 80),
  bio text not null default '' check (char_length(bio) <= 1200),
  languages text[] not null default array['Français', 'Lingala'],
  years_experience integer check (years_experience is null or years_experience between 0 and 70),
  commune text check (commune is null or char_length(commune) <= 60),
  fee_cents integer not null check (fee_cents > 0),
  status public.doctor_status not null default 'en_attente',
  -- Champs privés : jamais visibles des patients ; la commission n'est pas visible du médecin.
  commission_rate numeric(5,2) not null default 30 check (commission_rate between 0 and 100),
  payout_method public.payout_method not null default 'mpesa',
  payout_account text not null check (char_length(payout_account) between 6 and 60),
  payout_holder text check (payout_holder is null or char_length(payout_holder) <= 120),
  admin_message text,           -- motif du refus ou complément demandé
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index doctor_profiles_status_idx on public.doctor_profiles (status);

create table public.doctor_documents (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  kind public.document_kind not null,
  storage_path text not null unique,
  file_name text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_at timestamptz not null default now()
);
create index doctor_documents_doctor_idx on public.doctor_documents (doctor_id);

-- ---------------------------------------------------------------------
-- Créneaux et rendez-vous
-- ---------------------------------------------------------------------
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.slot_status not null default 'libre',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint availability_no_overlap exclude using gist (
    doctor_id with =, tstzrange(starts_at, ends_at, '[)') with &&
  )
);
create index availability_slots_doctor_start_idx on public.availability_slots (doctor_id, starts_at);
create index availability_slots_free_idx on public.availability_slots (starts_at) where status = 'libre';

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('MGA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  patient_id uuid not null references public.profiles(id),
  doctor_id uuid not null references public.doctor_profiles(id),
  slot_id uuid references public.availability_slots(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'en_attente_acompte',
  reason text check (reason is null or char_length(reason) <= 500),
  -- Instantanés au moment de la réservation : les montants ne bougent plus ensuite.
  fee_cents integer not null check (fee_cents > 0),
  deposit_cents integer not null check (deposit_cents > 0),
  commission_rate numeric(5,2) not null,
  deposit_due_at timestamptz not null,
  confirmed_at timestamptz,
  balance_paid_at timestamptz,
  reminder_sent_at timestamptz,
  patient_joined_at timestamptz,
  doctor_joined_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id),
  cancel_reason text check (cancel_reason is null or char_length(cancel_reason) <= 500),
  room_name text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (deposit_cents < fee_cents),
  check (ends_at > starts_at)
);
create index appointments_patient_idx on public.appointments (patient_id, starts_at desc);
create index appointments_doctor_idx on public.appointments (doctor_id, starts_at desc);
create index appointments_status_idx on public.appointments (status, starts_at);
-- Un créneau ne porte qu'un seul rendez-vous actif.
create unique index appointments_one_active_per_slot on public.appointments (slot_id)
  where status in ('en_attente_acompte', 'confirme', 'en_cours');

-- ---------------------------------------------------------------------
-- Paiements, remboursements, répartition, versements
-- ---------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id),
  patient_id uuid not null references public.profiles(id),
  kind public.payment_kind not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD',
  method public.payment_method not null,
  phone text,
  provider text not null,                 -- 'test', 'maishapay', 'flexpay', ...
  provider_ref text,
  provider_fee_cents integer,             -- commission du prestataire, si connue
  status public.payment_status not null default 'en_attente',
  failure_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  raw jsonb
);
create index payments_appointment_idx on public.payments (appointment_id);
create index payments_status_idx on public.payments (status, created_at desc);
create unique index payments_one_success_per_kind on public.payments (appointment_id, kind) where status = 'reussi';
create unique index payments_provider_ref_idx on public.payments (provider, provider_ref) where provider_ref is not null;

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id),
  appointment_id uuid not null references public.appointments(id),
  amount_cents integer not null check (amount_cents > 0),
  reason text not null,
  status public.refund_status not null default 'a_traiter',
  reference text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id)
);
create index refunds_status_idx on public.refunds (status, created_at);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles(id),
  period_end date not null,
  amount_cents integer not null check (amount_cents >= 0),
  fees_cents integer not null default 0 check (fees_cents >= 0),
  net_cents integer generated always as (amount_cents - fees_cents) stored,
  method public.payout_method not null,
  account text not null,
  status public.payout_status not null default 'a_verser',
  reference text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  unique (doctor_id, period_end)
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id),
  doctor_id uuid not null references public.doctor_profiles(id),
  type public.ledger_type not null,
  reason text not null,                   -- 'consultation' ou 'absence_patient' ou 'annulation_tardive'
  amount_cents integer not null check (amount_cents >= 0),
  payout_id uuid references public.payouts(id),
  created_at timestamptz not null default now(),
  unique (appointment_id, type)
);
create index ledger_doctor_unpaid_idx on public.ledger_entries (doctor_id) where payout_id is null and type = 'part_medecin';

-- ---------------------------------------------------------------------
-- Consultation : notes, ordonnances, messages, fichiers, notes de qualité
-- ---------------------------------------------------------------------
create table public.doctor_notes (
  appointment_id uuid primary key references public.appointments(id) on delete cascade,
  doctor_id uuid not null references public.doctor_profiles(id),
  content text not null default '' check (char_length(content) <= 5000),
  updated_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  doctor_id uuid not null references public.doctor_profiles(id),
  patient_id uuid not null references public.profiles(id),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20),
  instructions text check (instructions is null or char_length(instructions) <= 1500),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index prescriptions_patient_idx on public.prescriptions (patient_id, issued_at desc);
create index prescriptions_expiry_idx on public.prescriptions (expires_at);

create table public.consultation_messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index consultation_messages_appt_idx on public.consultation_messages (appointment_id, created_at);

create table public.consultation_files (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id),
  storage_path text not null unique,
  file_name text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);
create index consultation_files_appt_idx on public.consultation_files (appointment_id);

create table public.ratings (
  appointment_id uuid primary key references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.profiles(id),
  doctor_id uuid not null references public.doctor_profiles(id),
  stars smallint not null check (stars between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
create index ratings_doctor_idx on public.ratings (doctor_id);

-- ---------------------------------------------------------------------
-- Notifications et journal d'administration
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  link text,
  send_email boolean not null default true,
  emailed_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_email_queue_idx on public.notifications (created_at) where send_email and emailed_at is null;

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------
-- Horodatage automatique
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger doctor_profiles_touch before update on public.doctor_profiles for each row execute function public.touch_updated_at();
create trigger appointments_touch before update on public.appointments for each row execute function public.touch_updated_at();
