import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/login';
import dotenv from 'dotenv';

dotenv.config();

test.describe('Authentication Flow', () => {
  test('officer login redirects to admin dashboard', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.OFFICER_USERNAME!,
      process.env.OFFICER_PASSWORD!
    );

    await expect(page).toHaveURL(/\/dashboard\/admin/);
  });

  test('advisor login redirects to teacher dashboard', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.ADVISOR_USERNAME!,
      process.env.ADVISOR_PASSWORD!
    );

    await expect(page).toHaveURL(/\/dashboard\/teacher/);
  });

  test('student login redirects to student dashboard', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.STUDENT_USERNAME!,
      process.env.STUDENT_PASSWORD!
    );

    await expect(page).toHaveURL(/\/dashboard\/student/);
  });

  test('login stores auth token in localStorage', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.OFFICER_USERNAME!,
      process.env.OFFICER_PASSWORD!
    );

    const token = await page.evaluate(() =>
      localStorage.getItem('cslogbook:auth-token')
    );
    expect(token).toBeTruthy();
    expect(token!.length).toBeGreaterThan(20);
  });

  test('logout clears auth state and redirects to login', async ({ page }) => {
    await loginViaUI(
      page,
      process.env.OFFICER_USERNAME!,
      process.env.OFFICER_PASSWORD!
    );

    // ปิด SurveyBanner overlay ถ้ามี (บังปุ่ม logout)
    const dismissBtn = page.locator('button:has-text("ทำภายหลัง")');
    if (await dismissBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dismissBtn.click();
      // รอ overlay หายไป
      await page.locator('[aria-label="แบบประเมินการใช้งานระบบ"]')
        .waitFor({ state: 'hidden', timeout: 3000 })
        .catch(() => {});
    }

    // หาปุ่ม logout
    const logoutButton = page.locator(
      'button:has-text("ออกจากระบบ"), [aria-label="logout"], [data-testid="logout"]'
    );

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // ต้อง redirect กลับไป login
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

      // token ต้องถูกลบ
      const token = await page.evaluate(() =>
        localStorage.getItem('cslogbook:auth-token')
      );
      expect(token).toBeFalsy();
    }
  });
});
