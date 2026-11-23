-- =====================================================================
-- Stockage privé des fichiers, temps réel et tâche planifiée.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Espaces de stockage privés (jamais publics)
--   candidatures/<id du médecin>/<fichier>   : pièces des candidats
--   consultations/<id du rendez-vous>/<fichier> : documents échangés en consultation
-- Les photos de profil sont sur Cloudinary.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('candidatures', 'candidatures', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('consultations', 'consultations', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "candidatures : depot par le candidat" on storage.objects for insert to authenticated with check (
  bucket_id = 'candidatures'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.doctor_profiles d where d.id = auth.uid() and d.status in ('en_attente', 'complement_demande', 'refuse'))
);
create policy "candidatures : lecture candidat et admin" on storage.objects for select to authenticated using (
  bucket_id = 'candidatures' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
create policy "candidatures : suppression par le candidat" on storage.objects for delete to authenticated using (
  bucket_id = 'candidatures'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.doctor_profiles d where d.id = auth.uid() and d.status in ('en_attente', 'complement_demande', 'refuse'))
);

create policy "consultations : depot par les participants" on storage.objects for insert to authenticated with check (
  bucket_id = 'consultations'
  and exists (
    select 1 from public.appointments a
    where a.id::text = (storage.foldername(name))[1]
      and (a.patient_id = auth.uid() or a.doctor_id = auth.uid())
      and a.status in ('confirme', 'en_cours')
      and now() between a.starts_at - interval '15 minutes'
                    and a.ends_at + make_interval(mins => public.setting_int('fermeture_salle_minutes'))
  )
);
create policy "consultations : lecture par les participants" on storage.objects for select to authenticated using (
  bucket_id = 'consultations'
  and exists (
    select 1 from public.appointments a
    where a.id::text = (storage.foldername(name))[1] and (a.patient_id = auth.uid() or a.doctor_id = auth.uid())
  )
);

-- ---------------------------------------------------------------------
-- Temps réel : messages et documents de consultation, notifications (la RLS s'applique).
-- ---------------------------------------------------------------------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.consultation_messages, public.consultation_files, public.notifications;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Tâche planifiée toutes les minutes (pg_cron, disponible sur Supabase).
-- Les e-mails et la suppression des fichiers sont faits par /api/cron (Vercel).
-- ---------------------------------------------------------------------
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule('monganga-tick', '* * * * *', 'select public.tick()');
  end if;
end $$;
