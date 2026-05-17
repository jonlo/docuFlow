import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

const commonBddConfig = {
  steps: 'steps/**/*.ts',
  importTestFrom: 'fixtures/auth.ts',
};

export default defineConfig({
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
      testDir: defineBddConfig({
        ...commonBddConfig,
        features: 'features/desktop/**/*.feature',
      }),
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testDir: defineBddConfig({
        ...commonBddConfig,
        features: 'features/mobile/**/*.feature',
      }),
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testDir: defineBddConfig({
        ...commonBddConfig,
        features: 'features/mobile/**/*.feature',
      }),
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
