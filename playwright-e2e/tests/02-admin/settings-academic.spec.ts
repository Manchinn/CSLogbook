import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

test.describe('Settings — Academic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings/academic');
  });

  test('เจ้าหน้าที่เข้าหน้า Settings > Academic ได้', async ({ page }) => {
    // Page loads สำเร็จ — ไม่ redirect กลับ login
    await expect(page).toHaveURL(/\/admin\/settings\/academic/);

    // Title "การตั้งค่าระบบ" แสดง
    await expect(
      page.locator(SEL.SETTINGS_TITLE).or(page.locator('h1:has-text("การตั้งค่าระบบ")'))
    ).toBeVisible();
  });

  test('tab bar แสดงครบ 3 tabs', async ({ page }) => {
    // Tab bar visible
    await expect(page.locator(SEL.SETTINGS_TAB_BAR)).toBeVisible();

    // 3 tabs: หลักสูตร, ปีการศึกษา, การแจ้งเตือน
    await expect(page.locator(SEL.TAB_CURRICULUM)).toBeVisible();
    await expect(page.locator(SEL.TAB_ACADEMIC)).toBeVisible();
    await expect(page.locator(SEL.TAB_NOTIFICATION)).toBeVisible();
  });

  test('tab navigation ทำงาน — คลิกแต่ละ tab แล้ว URL เปลี่ยน', async ({ page }) => {
    // คลิก "หลักสูตร" → /curriculum
    await page.click(SEL.TAB_CURRICULUM);
    await expect(page).toHaveURL(/\/admin\/settings\/curriculum/);

    // คลิก "การแจ้งเตือน" → /notification-settings
    await page.click(SEL.TAB_NOTIFICATION);
    await expect(page).toHaveURL(/\/admin\/settings\/notification-settings/);

    // คลิก "ปีการศึกษา" → /academic
    await page.click(SEL.TAB_ACADEMIC);
    await expect(page).toHaveURL(/\/admin\/settings\/academic/);
  });

  test('academic year data แสดงข้อมูล (ไม่ใช่ empty state)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // ต้องมี content ที่ไม่ใช่ empty — section, table, หรือ form fields
    const contentArea = page.locator(
      '[class*="section"], [class*="card"], [class*="mainInfo"], table'
    );
    await expect(contentArea.first()).toBeVisible();

    // ตรวจว่าไม่มี empty state message
    const emptyState = page.locator('[class*="empty"]:has-text("ไม่มีข้อมูล")');
    await expect(emptyState).toHaveCount(0);
  });
});
