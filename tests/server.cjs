const { spawn } = require('node:child_process');
const path = require('node:path');
exports.start = async function start() {
  if (process.env.BASE_URL) return { base: process.env.BASE_URL, close: async () => {} };
  const port = Number(process.env.PORT || 3000);
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.resolve(__dirname, '../node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  const close = () => new Promise(resolve => {
    if (child.exitCode !== null) return resolve();
    child.once('exit', resolve); child.kill('SIGTERM');
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw Error(logs);
    try { const response = await fetch(base); if (response.ok) return { base, close }; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await close(); throw Error(`Next.js ne démarre pas : ${logs}`);
};
