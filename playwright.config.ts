import { defineConfig } from '@playwright/test'
const production = process.env.NOVOTIUM_TEST_PRODUCTION === '1'
const port = production ? 4173 : 5173
const url = 'http://127.0.0.1:' + port
export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  timeout: 150000,
  workers: 1,
  use: {
    baseURL: url,
    channel: process.env.PW_CHANNEL || 'chrome',
    viewport: { width: 1280, height: 800 },
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command:
      'npm run ' +
      (production ? 'preview' : 'dev') +
      ' -- --host 127.0.0.1 --port ' +
      port +
      ' --strictPort',
    url,
    reuseExistingServer: !production,
  },
})
