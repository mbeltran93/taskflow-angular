#!/usr/bin/env node
/**
 * Corre el suite E2E de Playwright sin tocar la semilla real `db.json`.
 *
 * 1. Copia `db.json` -> `db.e2e.json` (json-server --watch escribe ahi).
 * 2. Corre `playwright test` (que a su vez levanta json-server sobre
 *    `db.e2e.json` y `ng serve`, via `webServer` en playwright.config.ts).
 * 3. Borra `db.e2e.json`, pase lo que pase, para que no quede rastro y la
 *    proxima corrida siempre arranque desde la semilla original.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const seedPath = path.join(root, 'db.json');
const workingPath = path.join(root, 'db.e2e.json');

fs.copyFileSync(seedPath, workingPath);
console.log('[e2e] Copia de trabajo creada: db.e2e.json (a partir de db.json)');

const playwrightArgs = process.argv.slice(2);
const result = spawnSync('npx', ['playwright', 'test', ...playwrightArgs], {
  cwd: root,
  stdio: 'inherit',
  shell: true
});

try {
  fs.unlinkSync(workingPath);
  console.log('[e2e] db.e2e.json borrado. db.json queda intacto en su estado semilla.');
} catch (err) {
  console.warn('[e2e] No se pudo borrar db.e2e.json:', err.message);
}

process.exit(result.status ?? 1);
