import { defineConfig, devices } from '@playwright/test';

/**
 * Config de Playwright para los tests E2E de TaskFlow.
 *
 * `webServer` levanta automaticamente el backend mock (json-server sobre
 * `db.e2e.json`, una copia de trabajo de la semilla) y la app de Angular,
 * en ese orden, antes de correr los tests. `npm run test:e2e` se encarga de
 * crear esa copia antes de arrancar Playwright y de borrarla al terminar,
 * para que `db.json` nunca se toque.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'npx json-server --watch db.e2e.json --port 3000',
      url: 'http://localhost:3000/users',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe'
    },
    {
      command: 'npx ng serve --port 4200',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe'
    }
  ]
});
