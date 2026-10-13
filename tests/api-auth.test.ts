import test from 'node:test'
import assert from 'node:assert/strict'
import { checkCsrf, isSameOrigin, newCsrfToken } from '../lib/api/csrf.ts'
import { classifyIdentifier, toApiRole, toApiSession } from '../lib/api/session.ts'

const base = { method: 'POST', origin: 'https://monganga.cd', host: 'monganga.cd', headerToken: 't', cookieToken: 't' }

test('CSRF : accepte token identique et même origine', () => {
  assert.deepEqual(checkCsrf(base), { ok: true })
})
test('CSRF : GET jamais bloqué', () => {
  assert.deepEqual(checkCsrf({ ...base, method: 'GET', origin: null, headerToken: null, cookieToken: null }), { ok: true })
})
test('CSRF : refuse origine étrangère ou absente', () => {
  assert.deepEqual(checkCsrf({ ...base, origin: 'https://evil.example' }), { ok: false, reason: 'origin' })
  assert.deepEqual(checkCsrf({ ...base, origin: null }), { ok: false, reason: 'origin' })
})
test('CSRF : refuse token absent ou différent', () => {
  assert.deepEqual(checkCsrf({ ...base, headerToken: null }), { ok: false, reason: 'token' })
  assert.deepEqual(checkCsrf({ ...base, headerToken: 'x' }), { ok: false, reason: 'token' })
  assert.deepEqual(checkCsrf({ ...base, cookieToken: null }), { ok: false, reason: 'token' })
})
test('CSRF : origine explicitement autorisée', () => {
  assert.equal(isSameOrigin('https://app.monganga.cd', 'api.monganga.cd', ['https://app.monganga.cd']), true)
})
test('CSRF : jetons aléatoires et longs', () => {
  assert.notEqual(newCsrfToken(), newCsrfToken())
  assert.equal(newCsrfToken().length, 64)
})

test('rôles : medecin -> doctor, inconnu refusé', () => {
  assert.equal(toApiRole('medecin'), 'doctor')
  assert.equal(toApiRole('patient'), 'patient')
  assert.equal(toApiRole('admin'), 'admin')
  assert.equal(toApiRole('superuser'), null)
})
test('session : médecin reçoit doctorId, patient non', () => {
  const doctor = toApiSession({ id: 'u1', role: 'medecin', fullName: 'Dr Ilunga', email: 'a@b.cd', expiresAtSeconds: 1900000000 })
  assert.equal(doctor?.doctorId, 'u1')
  assert.equal(doctor?.role, 'doctor')
  assert.equal(doctor?.expiresAt, new Date(1900000000 * 1000).toISOString())
  const patient = toApiSession({ id: 'u2', role: 'patient', fullName: '', email: 'aline@x.cd', expiresAtSeconds: 1900000000 })
  assert.equal('doctorId' in (patient ?? {}), false)
  assert.equal(patient?.name, 'aline')
})
test('session : rôle inconnu => null', () => {
  assert.equal(toApiSession({ id: 'u', role: 'x', fullName: 'n', email: 'e@e.cd', expiresAtSeconds: 1 }), null)
})
test('identifiant : email, téléphone, rejets', () => {
  assert.deepEqual(classifyIdentifier(' Aline@Mail.CD '), { kind: 'email', value: 'aline@mail.cd' })
  assert.deepEqual(classifyIdentifier('+243 81 234 5678'), { kind: 'phone', value: '+243812345678' })
  assert.equal(classifyIdentifier('pas un identifiant'), null)
  assert.equal(classifyIdentifier(''), null)
  assert.equal(classifyIdentifier('a@b'), null)
})

import { firstSlotByDoctor, initials, toApiDoctor, toApiSlot, toCents, UUID_RE } from '../lib/api/doctors.ts'

test('médecins : honoraires en centimes', () => {
  assert.equal(toCents('20.00'), 2000)
  assert.equal(toCents(12.5), 1250)
  assert.equal(toCents(null), 0)
  assert.equal(toCents(-3), 0)
})
test('médecins : initiales sans « Dr »', () => {
  assert.equal(initials('Dr Jean Ilunga'), 'JI')
  assert.equal(initials('Aline'), 'A')
})
test('médecins : Doctor ne contient aucune donnée privée ni valeur inventée', () => {
  const slot = { id: 's', doctor_id: 'd', start_time: '2026-10-20T09:00:00+00:00', end_time: '2026-10-20T09:45:00+00:00' }
  const doc = toApiDoctor({ id: 'd', full_name: 'Dr Jean Ilunga', specialty: 'Cardiologie', bio: null, consultation_fee: '25.00' }, slot)
  assert.equal(doc.priceCents, 2500)
  assert.equal(doc.durationMinutes, 45)
  assert.equal(doc.nextSlot, '2026-10-20T09:00:00.000Z')
  assert.equal(doc.rating, null)
  assert.deepEqual(Object.keys(doc).filter(k => /mail|phone|tel/i.test(k)), [])
})
test('créneaux : format et premier créneau par médecin', () => {
  const rows = [
    { id: 'a', doctor_id: 'd1', start_time: '2026-10-20T09:00:00Z', end_time: '2026-10-20T09:30:00Z' },
    { id: 'b', doctor_id: 'd1', start_time: '2026-10-20T10:00:00Z', end_time: '2026-10-20T10:30:00Z' },
    { id: 'c', doctor_id: 'd2', start_time: '2026-10-21T09:00:00Z', end_time: '2026-10-21T09:30:00Z' },
  ]
  const first = firstSlotByDoctor(rows)
  assert.equal(first.get('d1')?.id, 'a')
  assert.equal(first.get('d2')?.id, 'c')
  assert.deepEqual(toApiSlot(rows[0]), { id: 'a', doctorId: 'd1', start: '2026-10-20T09:00:00.000Z', durationMinutes: 30, booked: false })
})
test('médecins : identifiant non-UUID refusé', () => {
  assert.equal(UUID_RE.test('ilunga'), false)
  assert.equal(UUID_RE.test('0b0e9a0e-2f0c-4c3a-9d2e-1f6a3b7c8d90'), true)
})

import { validateRegistration } from '../lib/api/register.ts'

const goodReg = { name: ' Aline Kabila ', email: ' Aline@Mail.CD ', phone: '+243 81 234 5678', password: 'Test12345', consent: true }
test('inscription : données valides normalisées', () => {
  const r = validateRegistration(goodReg)
  assert.equal(r.ok, true)
  if (r.ok) assert.deepEqual(r.value, { name: 'Aline Kabila', email: 'aline@mail.cd', phone: '+243812345678', password: 'Test12345', consent: true })
})
test('inscription : téléphone facultatif', () => {
  const r = validateRegistration({ ...goodReg, phone: '' })
  assert.equal(r.ok && r.value.phone, null)
})
test('inscription : email obligatoire, mot de passe fort, consentement', () => {
  for (const [patch, field] of [
    [{ email: '' }, 'email'], [{ email: 'abc' }, 'email'], [{ password: 'faible' }, 'password'],
    [{ password: 'sansmajuscule1' }, 'password'], [{ consent: false }, 'consent'], [{ consent: 'true' }, 'consent'],
    [{ name: '  ' }, 'name'], [{ phone: 'abc' }, 'phone'],
  ] as const) {
    const r = validateRegistration({ ...goodReg, ...patch })
    assert.equal(r.ok, false)
    if (!r.ok) assert.ok(field in r.fields, field)
  }
  assert.equal(validateRegistration(null).ok, false)
})
test('inscription : un rôle envoyé par le navigateur est ignoré', () => {
  const r = validateRegistration({ ...goodReg, role: 'admin' })
  assert.equal(r.ok && 'role' in r.value, false)
})

test('inscription : une case cochée envoyée en chaîne « on » est refusée (le front doit envoyer un booléen)', () => {
  assert.equal(validateRegistration({ ...goodReg, consent: 'on' }).ok, false)
  assert.equal(validateRegistration({ ...goodReg, consent: true }).ok, true)
})

import { eurosToCents, splitPrescription, toApiBooking, toApiBookingStatus, toApiNotification, toApiPaymentStatus, toApiPrescription, toApiTransaction } from '../lib/api/mappers.ts'

const appt = {
  id: 'a1', patient_id: 'p1', doctor_id: 'd1', status: 'confirme', reservation_fee: '1.00', consultation_fee: '20.00',
  created_at: '2026-10-12T08:00:00Z',
  availabilities: { start_time: '2026-10-20T09:00:00Z', end_time: '2026-10-20T09:30:00Z' },
  payments: [
    { type: 'reservation', amount: '1.00', status: 'echoue', provider: 'mock', provider_reference: 'old', created_at: '2026-10-12T08:01:00Z' },
    { type: 'reservation', amount: '1.00', status: 'reussi', provider: 'mock', provider_reference: 'ref-2', created_at: '2026-10-12T08:05:00Z' },
  ],
}
test('rendez-vous : statuts français -> contrat du front', () => {
  assert.equal(toApiBookingStatus('en_attente'), 'payment_pending')
  assert.equal(toApiBookingStatus('confirme'), 'confirmed')
  assert.equal(toApiBookingStatus('termine'), 'completed')
  for (const s of ['refuse', 'annule', 'non_honore']) assert.equal(toApiBookingStatus(s), 'cancelled')
})
test('paiements : statuts', () => {
  assert.equal(toApiPaymentStatus('reussi'), 'paid')
  assert.equal(toApiPaymentStatus('rembourse'), 'refunded')
  assert.equal(toApiPaymentStatus(undefined), 'unpaid')
})
test('rendez-vous : montants en centimes, dernier paiement de réservation, créneau', () => {
  const b = toApiBooking(appt, { doctorName: 'Dr Ilunga', patientName: 'Aline', doctorFee: null })
  assert.equal(b.status, 'confirmed')
  assert.equal(b.paymentStatus, 'paid')
  assert.equal(b.priceCents, 2000)
  assert.equal(b.feeCents, 100)
  assert.equal(b.totalCents, 2100)
  assert.equal(b.slot, '2026-10-20T09:00:00.000Z')
  assert.equal(b.reference, 'ref-2')
  assert.equal(b.confirmedAt, '2026-10-12T08:05:00.000Z')
})
test('rendez-vous : sans honoraire propre, repli sur celui du médecin ; créneau en tableau accepté', () => {
  const b = toApiBooking({ ...appt, consultation_fee: null, payments: [], availabilities: [appt.availabilities] }, { doctorName: 'D', patientName: 'P', doctorFee: '25' })
  assert.equal(b.priceCents, 2500)
  assert.equal(b.paymentStatus, 'unpaid')
  assert.equal(b.slot, '2026-10-20T09:00:00.000Z')
})
test('euros -> centimes : arrondi et valeurs invalides', () => {
  assert.equal(eurosToCents('19.99'), 1999)
  assert.equal(eurosToCents(null), 0)
  assert.equal(eurosToCents('abc'), 0)
})
test('transactions : la réservation est la part plateforme, le reste 0', () => {
  const base = { id: 't', appointment_id: 'a1', payer_id: 'p1', amount: '1.00', status: 'reussi', provider: 'mock', provider_reference: null, created_at: '2026-10-12T08:05:00Z', appointments: { doctor_id: 'd1' } }
  const r = toApiTransaction({ ...base, type: 'reservation' }, 'Aline')
  assert.deepEqual([r.amountCents, r.feeCents, r.status, r.doctorId], [100, 100, 'paid', 'd1'])
  assert.equal(toApiTransaction({ ...base, type: 'consultation', amount: '20.00' }, 'Aline').feeCents, 0)
})
test('ordonnances : première ligne = médicament, reste = consignes', () => {
  assert.deepEqual(splitPrescription('Paracétamol 500 mg\n1 comprimé 3 fois par jour'), { medication: 'Paracétamol 500 mg', instructions: '1 comprimé 3 fois par jour' })
  assert.deepEqual(splitPrescription('Repos'), { medication: 'Repos', instructions: 'Repos' })
  const p = toApiPrescription({ id: 'r', doctor_id: 'd1', patient_id: 'p1', content: 'X\nY', created_at: '2026-10-12T08:00:00Z', consultations: [{ appointment_id: 'a1' }] }, { doctorName: 'D', patientName: 'P' })
  assert.deepEqual([p.bookingId, p.status, p.medication], ['a1', 'active', 'X'])
})
test('notifications : champs renommés', () => {
  assert.deepEqual(toApiNotification({ id: 'n', title: 'T', body: null, is_read: false, created_at: '2026-10-12T08:00:00Z' }), { id: 'n', title: 'T', message: '', read: false, createdAt: '2026-10-12T08:00:00.000Z' })
})
