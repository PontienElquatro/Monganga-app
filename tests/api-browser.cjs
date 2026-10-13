const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const server = await require('./server.cjs').start();
  const args = ['--no-sandbox', '--disable-dev-shm-usage'];
  if (process.env.CHROMIUM_EXECUTABLE) args.push('--single-process', '--no-zygote', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined, args }).catch(async error => { await server.close(); throw error; });
  try {
    const legacy = await fetch(server.base + '/patient/doctor.html?id=ilunga', { redirect: 'manual' });
    assert.equal(legacy.status, 308);
    assert.equal(legacy.headers.get('location'), '/patient/doctor?id=ilunga');
    assert.equal((await fetch(server.base + '/page-absente')).status, 404);
    assert.equal((await fetch(server.base + '/api/v1/doctors')).status, 503);
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Exercise the API frontend with controlled responses, without touching
    // production code or requiring a live medical backend.
    await page.addInitScript(() => {
      let value;
      Object.defineProperty(window, 'MONGANGA_CONFIG', {
        configurable: true, get: () => value,
        set: config => { value = Object.freeze({ ...config, mode: 'api' }); },
      });
    });
    let rejected = true, credentials, csrf;
    const session = { id: 'api-patient', name: 'Marie API', role: 'patient', expiresAt: new Date(Date.now() + 3600000).toISOString() };
    await page.route('**/api/v1/**', async route => {
      const pathname = new URL(route.request().url()).pathname;
      let payload = [];
      if (pathname.endsWith('/auth/csrf')) payload = { csrfToken: 'test-token' };
      if (pathname.endsWith('/auth/login')) {
        credentials = route.request().postDataJSON();
        csrf = route.request().headers()['x-csrf-token'];
        if (rejected) return route.fulfill({ status: 401, contentType: 'application/json', body: '{"code":"INVALID_CREDENTIALS"}' });
        payload = session;
      }
      if (pathname.endsWith('/auth/me')) payload = session;
      if (pathname.endsWith('/doctors')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Indisponible"}' });
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(payload) });
    });
    await page.goto(server.base + '/auth/login');
    await page.waitForFunction(() => document.body.dataset.authState === 'ready');
    assert.equal(await page.locator('.demo-hint').isVisible(), false);
    await page.fill('#loginEmail', '+243820003333');
    await page.fill('#loginPassword', 'Test1234');
    await page.check('[name="remember"]');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await page.locator('.form-error:not([hidden])').waitFor();
    assert.match(await page.locator('.form-error').textContent(), /Identifiant ou mot de passe incorrect/);
    assert.equal(credentials.identifier, '+243820003333');
    assert.equal(credentials.remember, true);
    assert.equal(csrf, 'test-token');
    rejected = false;
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await page.waitForURL('**/patient/dashboard');
    await page.waitForFunction(() => document.body.dataset.authState === 'ready');
    assert.equal(await page.locator('#mode-indicator').isVisible(), false);
    await page.goto(server.base + '/public/doctors');
    await page.getByRole('button', { name: 'Réessayer', exact: true }).waitFor();
    assert.equal(await page.locator('.doctor-card').count(), 0);
    assert.deepEqual(errors, []);
    console.log('API navigateur : connexion, erreur 401, CSRF, session, panne sans fixtures, redirections et 404 validés.');
  } finally { await browser.close(); await server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
