import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

// In CI there is no wrangler/Worker available, so we use a tiny Node server
// that passes the readiness check. All API responses are intercepted by
// page.route() in fixtures/auth.ts and never reach the real server.
const apiServerCommand = process.env['CI']
  ? `node ${path.join(__dirname, 'mock-api-server.cjs')}`
  : 'pnpm --filter @flowdocs/api dev';

const commonBddConfig = {
  steps: 'steps/**/*.ts',
  importTestFrom: 'fixtures/auth.ts',
};

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? [['github'], ['list'], ['html']] : [['html']],

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
        outputDir: '.features-gen/desktop',
      }),
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testDir: defineBddConfig({
        ...commonBddConfig,
        features: 'features/mobile/**/*.feature',
        outputDir: '.features-gen/mobile',
      }),
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testDir: defineBddConfig({
        ...commonBddConfig,
        features: 'features/mobile/**/*.feature',
        outputDir: '.features-gen/mobile',
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
      command: apiServerCommand,
      url: 'http://localhost:8787/api/auth/status',
      cwd: repoRoot,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
