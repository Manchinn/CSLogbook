import { test, expect } from '@playwright/test';

test.describe('Role Guard — Access Control', () => {
  test('unauthenticated user is redirected to login', async ({ browser }) => {
    // สร้าง context ใหม่โดยไม่มี auth state (override project default)
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();

    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });

    await ctx.close();
  });

  test('advisor cannot access admin dashboard', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'auth/advisor.json',
    });
    const page = await ctx.newPage();

    await page.goto('/dashboard/admin');

    // ต้อง redirect ออกจาก admin dashboard
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).not.toContain('/dashboard/admin');

    await ctx.close();
  });

  test('officer can access admin settings', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'auth/officer.json',
    });
    const page = await ctx.newPage();

    await page.goto('/admin/settings/academic');
    await expect(page).toHaveURL(/\/admin\/settings\/academic/);

    // Page ต้อง load สำเร็จ (ไม่ redirect กลับ login)
    await expect(
      page.locator('h1, h2, [class*="title"], [class*="header"]').first()
    ).toBeVisible();

    await ctx.close();
  });

  test('student cannot access admin pages', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'auth/student.json',
    });
    const page = await ctx.newPage();

    await page.goto('/admin/users/students');

    // ต้อง redirect ออกจาก admin
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).not.toContain('/admin/');

    await ctx.close();
  });
});
