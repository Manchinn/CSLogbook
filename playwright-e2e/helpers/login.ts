import { Page, expect } from '@playwright/test';
import { SEL } from './selectors';

/**
 * Login ผ่าน browser UI (credential form)
 * ใช้ได้กับทุก role: officer, advisor, student
 */
export async function loginViaUI(page: Page, username: string, password: string) {
  await page.goto('/login');

  // Expand credential form (ซ่อนอยู่ default — ต้องกดเปิดก่อน)
  await page.click(SEL.EXPAND_CREDENTIALS);

  // Fill credentials
  await page.fill(SEL.USERNAME_INPUT, username);
  await page.fill(SEL.PASSWORD_INPUT, password);

  // Submit
  await page.click(SEL.LOGIN_SUBMIT);

  // Wait for dashboard redirect (ทุก role redirect ไป /dashboard/*)
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}
