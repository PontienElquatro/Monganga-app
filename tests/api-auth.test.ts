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
