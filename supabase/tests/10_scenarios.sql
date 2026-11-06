-- =====================================================================
-- Scénarios de test de la base (PostgreSQL local + stubs, voir README).
-- Chaque vérification lève une erreur si la règle n'est pas respectée.
-- Lancer : psql -v ON_ERROR_STOP=1 -f 00_stubs_local.sql, les migrations, puis ce fichier.
-- =====================================================================
\set QUIET on
\pset tuples_only on
\o /dev/null
set client_min_messages = warning;

-- Outils de test --------------------------------------------------------
create schema if not exists tst;
create or replace function tst.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p::text, ''), false);
  if p is null then execute 'set role anon'; else execute 'set role authenticated'; end if;
end $$;
create or replace function tst.as_service() returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '', false); execute 'set role service_role'; end $$;
create or replace function tst.as_postgres() returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '', false); execute 'reset role'; end $$;
create or replace function tst.ok(p_cond boolean, p_msg text) returns void language plpgsql as $$
begin if not coalesce(p_cond, false) then raise exception 'ÉCHEC : %', p_msg; end if; raise notice 'ok : %', p_msg; end $$;
-- Vérifie qu'une instruction échoue avec le message attendu.
create or replace function tst.fails(p_sql text, p_expected text, p_msg text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(p_expected in sqlerrm) > 0 then raise notice 'ok : % (%)', p_msg, sqlerrm; return; end if;
    raise exception 'ÉCHEC : % — erreur inattendue : %', p_msg, sqlerrm;
  end;
  raise exception 'ÉCHEC : % — aucune erreur', p_msg;
end $$;
grant execute on all functions in schema tst to anon, authenticated, service_role;
grant usage on schema tst to anon, authenticated, service_role;

set client_min_messages = notice;

-- Comptes ---------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@monganga.test', '{"first_name":"Ada","last_name":"Admin"}'),
  ('00000000-0000-0000-0000-00000000000d', 'ilunga@monganga.test', '{"first_name":"Paul","last_name":"Ilunga","account_type":"medecin","accepted_terms":"true"}'),
  ('00000000-0000-0000-0000-00000000000e', 'grace@monganga.test', '{"first_name":"Grâce","last_name":"Mwamba","account_type":"medecin"}'),
  ('00000000-0000-0000-0000-000000000001', 'aline@monganga.test', '{"first_name":"Aline","last_name":"Kabila","phone":"+243 81 234 5678","accepted_terms":"true"}'),
  ('00000000-0000-0000-0000-000000000002', 'jean@monganga.test', '{"first_name":"Jean","last_name":"Mbala","account_type":"admin"}');

select tst.ok((select role from public.profiles where id = '00000000-0000-0000-0000-000000000002') = 'patient',
                  'les métadonnées ne permettent pas de devenir admin');
select tst.ok((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000d') = 'medecin',
                  'un candidat médecin a le rôle medecin');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a';

-- Candidature -----------------------------------------------------------
select tst.as_user('00000000-0000-0000-0000-00000000000d');
select tst.fails($$select public.doctor_create_slots(current_date + 3, '09:00', '11:00')$$, 'MEDECIN_NON_VALIDE',
                     'un candidat non validé ne peut pas ouvrir de créneaux');
select tst.fails($$select public.submit_application('Médecine générale', 'Bio', 300, null, 12, 'Gombe', 'mpesa', '+243810000000', null)$$,
                     'TARIF_HORS_LIMITES', 'tarif sous le minimum refusé');
select public.submit_application('Médecine générale', 'Médecin généraliste.', 1500, array['Français','Lingala'], 12, 'Gombe',
                                 'mpesa', '+243 81 000 0012', 'Paul Ilunga');
select tst.ok((select status from public.doctor_profiles where id = auth.uid()) = 'en_attente', 'dossier en attente');
select tst.fails($$select commission_rate from public.doctor_profiles$$, 'permission denied',
                     'le médecin ne peut pas lire sa commission');
select tst.fails($$select commission_rate from public.appointments$$, 'permission denied',
                     'le médecin ne peut pas lire la commission des rendez-vous');
insert into public.doctor_documents (doctor_id, kind, storage_path, file_name, size_bytes)
select auth.uid(), k::public.document_kind, auth.uid() || '/' || k || '.pdf', k || '.pdf', 1000
from unnest(array['photo','identite','diplome','ordre']) k;

select tst.as_user('00000000-0000-0000-0000-000000000001');
select tst.fails($$select public.admin_validate_doctor('00000000-0000-0000-0000-00000000000d')$$, 'ACCES_REFUSE',
                     'un patient ne peut pas valider un médecin');

select tst.as_user('00000000-0000-0000-0000-00000000000a');
select tst.fails($$select public.admin_validate_doctor('00000000-0000-0000-0000-00000000000d')$$, 'PIECES_MANQUANTES',
                     'validation impossible sans CV');
select tst.as_user('00000000-0000-0000-0000-00000000000d');
insert into public.doctor_documents (doctor_id, kind, storage_path, file_name, size_bytes)
values (auth.uid(), 'cv', auth.uid() || '/cv.pdf', 'cv.pdf', 1000);
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select public.admin_validate_doctor('00000000-0000-0000-0000-00000000000d');
select tst.ok(public.is_valid_doctor('00000000-0000-0000-0000-00000000000d'), 'médecin validé');

-- Refus avec motif puis nouvelle soumission (deuxième candidat)
select tst.as_user('00000000-0000-0000-0000-00000000000e');
select public.submit_application('Pédiatrie', '', 2000, null, 5, 'Lingwala', 'airtel_money', '+243 99 000 0000', null);
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select tst.fails($$select public.admin_refuse_doctor('00000000-0000-0000-0000-00000000000e', '  ')$$, 'MOTIF_OBLIGATOIRE', 'refus sans motif impossible');
select public.admin_refuse_doctor('00000000-0000-0000-0000-00000000000e', 'Attestation de l''Ordre illisible.');
select tst.as_user('00000000-0000-0000-0000-00000000000e');
select tst.ok((select admin_message from public.doctor_profiles where id = auth.uid()) like 'Attestation%', 'le candidat voit le motif');
select public.submit_application('Pédiatrie', 'Corrigé', 2000, null, 5, 'Lingwala', 'airtel_money', '+243 99 000 0000', null);
select tst.ok((select status from public.doctor_profiles where id = auth.uid()) = 'en_attente', 'nouvelle soumission possible');

-- Visibilité publique ---------------------------------------------------
select tst.as_user(null);
select tst.ok((select count(*) from public.doctors_public) = 1, 'seul le médecin validé est public');
select tst.fails($$select * from public.profiles$$, 'permission denied', 'un visiteur ne lit pas les profils');

-- Créneaux --------------------------------------------------------------
select tst.as_user('00000000-0000-0000-0000-00000000000d');
select tst.ok(public.doctor_create_slots(((now() at time zone 'Africa/Kinshasa')::date + 3), '09:00', '12:00') = 6, '6 créneaux de 30 min');
select tst.ok(public.doctor_create_slots(((now() at time zone 'Africa/Kinshasa')::date + 3), '09:00', '10:00') = 0, 'pas de doublon');
select tst.ok(public.doctor_create_slots(((now() at time zone 'Africa/Kinshasa')::date + 4), '14:00', '17:00') = 6, '6 autres créneaux');
select tst.ok((select to_char(min(starts_at) at time zone 'Africa/Kinshasa', 'HH24:MI') from public.availability_slots
                   where starts_at::date = (now() + interval '3 days')::date) = '09:00', 'créneaux à l''heure de Kinshasa');

create temp table ids (k text primary key, v uuid);
grant all on ids to anon, authenticated, service_role;
insert into ids select 's' || row_number() over (order by starts_at), id from public.availability_slots;

-- Réservation, acompte, solde, visio, ordonnance, notation --------------
select tst.as_user('00000000-0000-0000-0000-000000000001');
select tst.fails($$select * from public.doctor_profiles$$, 'permission denied', 'un patient ne lit pas la table des médecins');
insert into ids values ('a1', public.book_appointment((select v from ids where k = 's1'), 'Toux depuis 5 jours'));
select tst.ok((select status from public.appointments where id = (select v from ids where k = 'a1')) = 'en_attente_acompte', 'réservation en attente d''acompte');

select tst.as_user('00000000-0000-0000-0000-000000000002');
select tst.fails($$select public.book_appointment((select v from ids where k = 's1'))$$, 'CRENEAU_INDISPONIBLE', 'un créneau ne se réserve qu''une fois');
select tst.ok((select count(*) from public.appointments) = 0, 'un patient ne voit pas les rendez-vous des autres');

select tst.as_user('00000000-0000-0000-0000-000000000001');
select tst.fails($$update public.appointments set status = 'confirme'$$, 'permission denied', 'impossible de confirmer soi-même un rendez-vous');
select tst.fails($$update public.profiles set role = 'admin' where id = auth.uid()$$, 'permission denied', 'impossible de changer son rôle');
select tst.fails($$select public.create_payment((select v from ids where k = 'a1'), 'solde', 'mpesa', '+243812345678', 'test')$$,
                     'SOLDE_IMPOSSIBLE', 'pas de solde avant l''acompte');
insert into ids select 'p1', payment_id from public.create_payment((select v from ids where k = 'a1'), 'acompte', 'mpesa', '+243 81 234 5678', 'test');
select tst.ok((select amount_cents from public.payments where id = (select v from ids where k = 'p1')) = 100, 'acompte de 1 $');
select tst.fails($$select public.confirm_payment((select v from ids where k = 'p1'))$$, 'permission denied',
                     'le navigateur ne peut pas confirmer un paiement');

select tst.as_service();
select public.confirm_payment((select v from ids where k = 'p1'), 'TEST-1', '{}');
select public.confirm_payment((select v from ids where k = 'p1'), 'TEST-1', '{}'); -- deuxième webhook : sans effet
select tst.ok((select status from public.appointments where id = (select v from ids where k = 'a1')) = 'confirme', 'rendez-vous confirmé par l''acompte');
select tst.ok((select count(*) from public.notifications where kind in ('rdv_confirme', 'nouveau_rdv')) = 2, 'patient et médecin prévenus');

select tst.as_user('00000000-0000-0000-0000-000000000001');
select tst.fails($$select public.create_payment((select v from ids where k = 'a1'), 'solde', 'mpesa', '+243812345678', 'test')$$,
                     'SOLDE_PAS_ENCORE_OUVERT', 'solde fermé plus d''une heure avant');

-- On avance l'horloge : la consultation commence dans 30 minutes.
select tst.as_postgres();
update public.appointments set starts_at = now() + interval '30 minutes', ends_at = now() + interval '60 minutes'
where id = (select v from ids where k = 'a1');
select public.tick();
select tst.ok((select reminder_sent_at is not null from public.appointments where id = (select v from ids where k = 'a1')), 'rappel une heure avant');

select tst.as_user('00000000-0000-0000-0000-000000000001');
insert into ids select 'p2', payment_id from public.create_payment((select v from ids where k = 'a1'), 'solde', 'orange_money', '+243 89 000 0000', 'test');
select tst.ok((select amount_cents from public.payments where id = (select v from ids where k = 'p2')) = 1400, 'solde = tarif − acompte');
select tst.fails($$select * from public.join_consultation((select v from ids where k = 'a1'))$$, 'CONSULTATION_PAS_ENCORE_OUVERTE', 'salle fermée 30 min avant');
select tst.as_postgres();
update public.appointments set starts_at = now() + interval '2 minutes', ends_at = now() + interval '32 minutes'
where id = (select v from ids where k = 'a1');
select tst.as_user('00000000-0000-0000-0000-000000000001');
select tst.fails($$select * from public.join_consultation((select v from ids where k = 'a1'))$$, 'SOLDE_NON_PAYE', 'pas de visio sans solde');
select tst.as_service();
select public.confirm_payment((select v from ids where k = 'p2'), 'TEST-2', '{}');

select tst.as_user('00000000-0000-0000-0000-000000000001');
select tst.ok((select participant from public.join_consultation((select v from ids where k = 'a1'))) = 'patient', 'le patient rejoint la salle');
insert into public.consultation_messages (appointment_id, sender_id, body) values ((select v from ids where k = 'a1'), auth.uid(), 'Bonjour docteur');
select tst.as_user('00000000-0000-0000-0000-00000000000d');
select tst.ok((select room_name from public.join_consultation((select v from ids where k = 'a1'))) like 'mgg-%', 'le médecin rejoint la même salle');
select tst.ok((select status from public.appointments where id = (select v from ids where k = 'a1')) = 'en_cours', 'consultation en cours');
select tst.ok((select patient_name from public.doctor_agenda(now() - interval '1 day', now() + interval '10 days') limit 1) = 'Aline Kabila',
                  'le médecin voit le nom de son patient');
select public.save_doctor_note((select v from ids where k = 'a1'), 'Toux sèche, pas de fièvre.');
select tst.ok(public.issue_prescription((select v from ids where k = 'a1'),
  '[{"name":"Paracétamol 500 mg","dosage":"1 comprimé 3 fois par jour","duration":"5 jours"}]') like 'ORD-%', 'ordonnance émise');

select tst.as_user('00000000-0000-0000-0000-000000000002');
select tst.ok((select count(*) from public.consultation_messages) = 0, 'un tiers ne lit pas les messages');
select tst.ok((select count(*) from public.prescriptions) = 0, 'un tiers ne lit pas les ordonnances');
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select tst.ok((select count(*) from public.prescriptions) = 0, 'l''administration ne lit pas les ordonnances');
select tst.ok((select count(*) from public.doctor_notes) = 0, 'l''administration ne lit pas les notes médicales');
select tst.as_user('00000000-0000-0000-0000-000000000001');
select tst.ok((select count(*) from public.prescriptions) = 1, 'le patient lit son ordonnance');
select tst.ok((select count(*) from public.doctor_notes) = 0, 'le patient ne lit pas les notes du médecin');
select tst.as_postgres();
create temp table codes as select code from public.prescriptions;
grant select on codes to anon;
select tst.as_user(null);
select tst.ok((select valid from public.verify_prescription((select code from codes))), 'vérification publique par QR');
select tst.ok((select count(*) from public.verify_prescription('ORD-INCONNU')) = 0, 'code inconnu');

select tst.as_user('00000000-0000-0000-0000-00000000000d');
select public.end_consultation((select v from ids where k = 'a1'));
select tst.ok((select count(*) from public.ledger_entries) = 1, 'le médecin ne voit que sa part');
select tst.ok((select amount_cents from public.ledger_entries) = 1050, 'part du médecin = 70 % de 15 $');

select tst.as_user('00000000-0000-0000-0000-000000000001');
select public.rate_appointment((select v from ids where k = 'a1'), 5, 'Très bien');
select tst.fails($$select public.rate_appointment((select v from ids where k = 'a1'), 4)$$, 'DEJA_NOTE', 'une seule note');
select tst.ok((select count(*) from public.ratings) = 0, 'le patient ne relit pas les notes');
select tst.as_user('00000000-0000-0000-0000-00000000000d');
select tst.ok((select count(*) from public.ratings) = 0, 'le médecin ne voit pas ses notes');
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select tst.ok((select count(*) from public.ratings) = 1, 'l''administration voit les notes');
select tst.ok((select count(*) from public.ledger_entries) = 2, 'l''administration voit les deux parts');

-- Absence du patient ----------------------------------------------------
select tst.as_user('00000000-0000-0000-0000-000000000002');
insert into ids values ('a2', public.book_appointment((select v from ids where k = 's2')));
insert into ids select 'p3', payment_id from public.create_payment((select v from ids where k = 'a2'), 'acompte', 'airtel_money', '+243 99 111 2222', 'test');
select tst.as_service();
select public.confirm_payment((select v from ids where k = 'p3'), 'TEST-3', '{}');
select tst.as_postgres();
update public.appointments set starts_at = now() - interval '15 minutes', ends_at = now() + interval '15 minutes'
where id = (select v from ids where k = 'a2');
select public.tick();
select tst.ok((select status from public.appointments where id = (select v from ids where k = 'a2')) = 'absence_patient', 'absence du patient');
select tst.ok((select amount_cents from public.ledger_entries where appointment_id = (select v from ids where k = 'a2') and type = 'part_medecin') = 70,
                  'le médecin reçoit 70 % de l''acompte');

-- Annulations -----------------------------------------------------------
select tst.as_user('00000000-0000-0000-0000-000000000002');
insert into ids values ('a3', public.book_appointment((select v from ids where k = 's3')));
insert into ids select 'p4', payment_id from public.create_payment((select v from ids where k = 'a3'), 'acompte', 'mpesa', '+243 81 111 2222', 'test');
select tst.as_service();
select public.confirm_payment((select v from ids where k = 'p4'), 'TEST-4', '{}');
select tst.as_user('00000000-0000-0000-0000-000000000002');
select tst.ok(public.cancel_by_patient((select v from ids where k = 'a3')) = 'acompte_rembourse', 'annulation à plus de 24 h remboursée');
select tst.ok((select count(*) from public.refunds where status = 'a_traiter') = 1, 'remboursement à traiter');
select tst.ok((select status from public.availability_slots where id = (select v from ids where k = 's3')) = 'libre', 'créneau libéré');

select tst.as_user('00000000-0000-0000-0000-000000000001');
insert into ids values ('a4', public.book_appointment((select v from ids where k = 's4')));
insert into ids select 'p5', payment_id from public.create_payment((select v from ids where k = 'a4'), 'acompte', 'mpesa', '+243 81 234 5678', 'test');
select tst.as_service();
select public.confirm_payment((select v from ids where k = 'p5'), 'TEST-5', '{}');
select tst.as_postgres();
update public.appointments set starts_at = now() + interval '5 hours', ends_at = now() + interval '5 hours 30 minutes'
where id = (select v from ids where k = 'a4');
select tst.as_user('00000000-0000-0000-0000-000000000001');
select tst.ok(public.cancel_by_patient((select v from ids where k = 'a4')) = 'acompte_conserve', 'annulation tardive : acompte conservé');

select tst.as_user('00000000-0000-0000-0000-000000000002');
insert into ids values ('a5', public.book_appointment((select v from ids where k = 's5')));
insert into ids select 'p6', payment_id from public.create_payment((select v from ids where k = 'a5'), 'acompte', 'carte', null, 'test');
select tst.as_service();
select public.confirm_payment((select v from ids where k = 'p6'), 'TEST-6', '{}');
select tst.as_user('00000000-0000-0000-0000-00000000000d');
select tst.fails($$select public.cancel_by_doctor((select v from ids where k = 'a5'), '')$$, 'MOTIF_OBLIGATOIRE', 'annulation médecin avec motif');
select public.cancel_by_doctor((select v from ids where k = 'a5'), 'Urgence à l''hôpital');
select tst.as_user('00000000-0000-0000-0000-000000000002');
select tst.ok((select refund_status from public.patient_appointments() where id = (select v from ids where k = 'a5')) = 'a_traiter',
                  'le patient voit son remboursement');
select tst.as_postgres();
select tst.ok((select status from public.availability_slots where id = (select v from ids where k = 's5')) = 'bloque', 'créneau bloqué');
select tst.ok((select count(*) from public.notifications n join public.profiles p on p.id = n.user_id
                   where p.role = 'admin' and n.kind = 'alerte_annulation') = 1, 'administration alertée');

-- Expiration d'un acompte non payé ---------------------------------------
select tst.as_user('00000000-0000-0000-0000-000000000002');
insert into ids values ('a6', public.book_appointment((select v from ids where k = 's6')));
select tst.as_postgres();
update public.appointments set deposit_due_at = now() - interval '1 minute' where id = (select v from ids where k = 'a6');
select public.tick();
select tst.ok((select status from public.appointments where id = (select v from ids where k = 'a6')) = 'expiree', 'réservation expirée');
select tst.ok((select status from public.availability_slots where id = (select v from ids where k = 's6')) = 'libre', 'créneau rendu');

-- Médecin absent ---------------------------------------------------------
select tst.as_user('00000000-0000-0000-0000-000000000001');
insert into ids values ('a7', public.book_appointment((select v from ids where k = 's7')));
insert into ids select 'p7', payment_id from public.create_payment((select v from ids where k = 'a7'), 'acompte', 'mpesa', '+243 81 234 5678', 'test');
select tst.as_service();
select public.confirm_payment((select v from ids where k = 'p7'), 'TEST-7', '{}');
select tst.as_postgres();
update public.appointments set starts_at = now() - interval '2 minutes', ends_at = now() + interval '28 minutes',
       balance_paid_at = now(), patient_joined_at = now() where id = (select v from ids where k = 'a7');
update public.appointments set starts_at = now() - interval '45 minutes', ends_at = now() - interval '15 minutes'
where id = (select v from ids where k = 'a7');
select public.tick();
select tst.ok((select status from public.appointments where id = (select v from ids where k = 'a7')) = 'absence_medecin', 'médecin absent');
select tst.ok((select count(*) from public.refunds where appointment_id = (select v from ids where k = 'a7')) = 1, 'patient remboursé');

-- Versements du samedi ---------------------------------------------------
select tst.as_user('00000000-0000-0000-0000-00000000000d');
select tst.fails($$select public.admin_prepare_payouts()$$, 'ACCES_REFUSE', 'seul l''admin prépare les versements');
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select tst.ok(public.admin_prepare_payouts() = 1, 'un versement préparé');
select tst.ok((select amount_cents from public.payouts) = 1050 + 70 + 70, 'consultation + absence + annulation tardive');
select tst.fails($$select public.admin_mark_payout_paid((select id from public.payouts), 50, '')$$, 'REFERENCE_OBLIGATOIRE', 'référence obligatoire');
select public.admin_mark_payout_paid((select id from public.payouts), 18, 'MP-55120');
select tst.ok((select net_cents from public.payouts) = 1172, 'net après frais de transfert');
select public.admin_mark_refund_done((select id from public.refunds where appointment_id = (select v from ids where k = 'a3')), 'RB-1');
select tst.ok((select count(*) from public.refunds where status = 'effectue') = 1, 'remboursement effectué');

-- Suspension d'un médecin : ses rendez-vous futurs sont annulés et remboursés
select tst.as_user('00000000-0000-0000-0000-000000000002');
insert into ids values ('a8', public.book_appointment((select v from ids where k = 's8')));
insert into ids select 'p8', payment_id from public.create_payment((select v from ids where k = 'a8'), 'acompte', 'mpesa', '+243 81 111 2222', 'test');
select tst.as_service();
select public.confirm_payment((select v from ids where k = 'p8'), 'TEST-8', '{}');
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select public.admin_set_suspended('00000000-0000-0000-0000-00000000000d', true);
select tst.as_postgres();
select tst.ok((select status from public.appointments where id = (select v from ids where k = 'a8')) = 'annulee_medecin', 'rendez-vous annulé à la suspension');
select tst.as_user(null);
select tst.ok((select count(*) from public.doctors_public) = 0, 'médecin suspendu retiré de la recherche');

-- Stockage privé ---------------------------------------------------------
select tst.as_user('00000000-0000-0000-0000-00000000000e');
insert into storage.objects (bucket_id, name, owner) values ('candidatures', '00000000-0000-0000-0000-00000000000e/diplome.pdf', auth.uid());
select tst.fails($$insert into storage.objects (bucket_id, name) values ('candidatures', '00000000-0000-0000-0000-000000000001/x.pdf')$$,
                 'row-level security', 'un candidat ne dépose pas dans le dossier d''un autre');
select tst.as_user('00000000-0000-0000-0000-000000000001');
select tst.ok((select count(*) from storage.objects where bucket_id = 'candidatures') = 0, 'un patient ne voit pas les pièces des candidats');
select tst.fails($$insert into storage.objects (bucket_id, name) values ('candidatures', '00000000-0000-0000-0000-000000000001/x.pdf')$$,
                 'row-level security', 'un patient ne dépose pas de pièces de candidature');
select tst.fails($$insert into storage.objects (bucket_id, name) values ('consultations', (select v from ids where k = 'a8') || '/x.pdf')$$,
                 'row-level security', 'pas de dépôt hors d''une consultation ouverte');
select tst.as_user('00000000-0000-0000-0000-00000000000a');
select tst.ok((select count(*) from storage.objects where bucket_id = 'candidatures') = 1, 'l''administration voit les pièces');

select tst.as_postgres();
\echo '=== Tous les scénarios sont passés ==='
