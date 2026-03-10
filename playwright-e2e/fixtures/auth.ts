import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  officerPage: Page;
  advisorPage: Page;
  studentPage: Page;
};

/**
 * Custom fixtures ที่ให้ pre-authenticated page per role
 * ใช้สำหรับ multi-role workflow tests (Phase 4)
 */
export const test = base.extend<AuthFixtures>({
  officerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: 'auth/officer.json' });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  advisorPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: 'auth/advisor.json' });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  studentPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: 'auth/student.json' });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
