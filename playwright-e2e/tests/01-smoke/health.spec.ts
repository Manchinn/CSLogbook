import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.describe('Health Check', () => {
  test('backend API is healthy', async ({ request }) => {
    const apiUrl = process.env.API_URL || 'http://localhost:5000/api';
    const res = await request.get(`${apiUrl}/health`);

    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('frontend login page loads', async ({ page }) => {
    await page.goto('/login');

    // SSO button ต้องแสดง
    await expect(page.locator(SEL.SSO_BUTTON)).toBeVisible();

    // Credential toggle ต้องแสดง
    await expect(page.locator(SEL.EXPAND_CREDENTIALS)).toBeVisible();
  });

  test('credential form expands on click', async ({ page }) => {
    await page.goto('/login');

    // ก่อนคลิก — form ยังไม่แสดง
    await expect(page.locator(SEL.USERNAME_INPUT)).not.toBeVisible();

    // คลิกเปิด credential form
    await page.click(SEL.EXPAND_CREDENTIALS);

    // หลังคลิก — form แสดง
    await expect(page.locator(SEL.USERNAME_INPUT)).toBeVisible();
    await expect(page.locator(SEL.PASSWORD_INPUT)).toBeVisible();
    await expect(page.locator(SEL.LOGIN_SUBMIT)).toBeVisible();
  });
});
