import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

test.describe('Settings — Notification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings/notification-settings');
  });

  test('หน้า Notification Settings โหลดได้', async ({ page }) => {
    // Page loads — ไม่ redirect
    await expect(page).toHaveURL(/\/admin\/settings\/notification-settings/);

    // Title แสดง
    await expect(
      page.locator(SEL.SETTINGS_TITLE).or(page.locator('h1:has-text("การตั้งค่าระบบ")'))
    ).toBeVisible();

    // Tab "การแจ้งเตือน" เป็น active
    const activeTab = page.locator('[class*="settingsTabActive"]');
    await expect(activeTab).toContainText('การแจ้งเตือน');
  });

  test('form elements แสดง — toggles และปุ่มควบคุม', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // ปุ่ม action แสดง
    await expect(page.locator(SEL.BTN_REFRESH).first()).toBeVisible();
    await expect(page.locator(SEL.BTN_ENABLE_ALL).first()).toBeVisible();
    await expect(page.locator(SEL.BTN_DISABLE_ALL).first()).toBeVisible();
  });

  test('notification items แสดงรายการ', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Notification list มี items
    const notifItems = page.locator(
      SEL.NOTIF_LIST + ' > *'
    ).or(page.locator('[class*="notifItem"], [class*="notifRow"]'));
    await expect(notifItems.first()).toBeVisible();

    // มี toggle switches
    const toggles = page.locator('[class*="toggle"]');
    const toggleCount = await toggles.count();
    expect(toggleCount).toBeGreaterThan(0);
  });

  test('ไม่มี console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/admin/settings/notification-settings');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });
});
