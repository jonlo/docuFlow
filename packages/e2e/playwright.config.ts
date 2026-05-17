import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  testDir: defineBddConfig({
    features: 'features/**/*.feature',
    steps: 'steps/**/*.ts',
    importTestFrom: 'fixtures/auth.ts',
  }),
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter @flowdocs/web dev',
      url: 'http://localhost:5173',
      cwd: repoRoot,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @flowdocs/api dev',
      url: 'http://localhost:8787/api/auth/status',
      cwd: repoRoot,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
