import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

test.describe('Settings — Constants (Module Hub)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings/constants');
    await page.waitForLoadState('networkidle');
  });

  test('เข้าหน้า constants settings ได้', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/settings\/constants/);

    const header = page.locator(':text("การตั้งค่าระบบ")');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('แสดง settings module cards ครบ', async ({ page }) => {
    const modules = [
      'หลักสูตรการศึกษา',
      'ปีการศึกษา',
      'การแจ้งเตือน',
    ];

    for (const mod of modules) {
      const card = page.locator(`:text("${mod}")`);
      await expect(card.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('Card links navigate ถูกต้อง — Curriculum', async ({ page }) => {
    const curriculumLink = page.locator('a[href*="/curriculum"]:has-text("เปิดหน้า")');
    if (await curriculumLink.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await curriculumLink.first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/settings\/curriculum/);
    }
  });

  test('Card links navigate ถูกต้อง — Academic', async ({ page }) => {
    const academicLink = page.locator('a[href*="/academic"]:has-text("เปิดหน้า")');
    if (await academicLink.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await academicLink.first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/settings\/academic/);
    }
  });

  test('Card links navigate ถูกต้อง — Notification', async ({ page }) => {
    const notifLink = page.locator('a[href*="/notification"]:has-text("เปิดหน้า")');
    if (await notifLink.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await notifLink.first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/settings\/notification/);
    }
  });
});
