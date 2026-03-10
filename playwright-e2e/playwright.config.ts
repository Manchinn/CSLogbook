import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html'], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },

  globalSetup: './global-setup.ts',

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'officer',
      use: { storageState: 'auth/officer.json' },
      dependencies: ['setup'],
    },
    {
      name: 'advisor',
      use: { storageState: 'auth/advisor.json' },
      dependencies: ['setup'],
    },
    {
      name: 'student',
      use: { storageState: 'auth/student.json' },
      dependencies: ['setup'],
    },
  ],
});
