-- =====================================================================
-- Ouverture de la salle de visio : réglable par le super administrateur
-- (Administration → Paramètres). 5 minutes avant le rendez-vous par défaut.
-- =====================================================================

insert into public.settings (key, value, description) values
  ('ouverture_salle_minutes', '5', 'La salle de visio ouvre ce nombre de minutes avant le rendez-vous.')
on conflict (key) do nothing;

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
  if now() < a.starts_at - make_interval(mins => public.setting_int('ouverture_salle_minutes')) then
    raise exception 'CONSULTATION_PAS_ENCORE_OUVERTE' using errcode = 'P0001';
  end if;
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
