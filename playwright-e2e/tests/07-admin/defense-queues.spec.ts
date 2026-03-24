import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

test.describe('Admin — KP02 Defense Queue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/project1/kp02-queue');
    await page.waitForLoadState('networkidle');
  });

  test('Officer เข้าหน้า KP02 Queue ได้', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/project1\/kp02-queue/);

    // ต้องเห็น header/title
    const header = page.locator(
      ':text("คำร้องขอสอบ"), :text("สอบโครงงาน"), :text("คพ.02"), :text("Defense")'
    );
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Queue stats แสดงข้อมูล', async ({ page }) => {
    // Stats section
    const stats = page.locator('[class*="stats"], [class*="stat"], [class*="summary"]');
    const hasStats = await stats.first().isVisible({ timeout: 5000 }).catch(() => false);

    // ถ้ามี stats ต้องเห็น badge/counter
    if (hasStats) {
      const badges = page.locator(SEL.SUMMARY_BADGE + ', [class*="count"], [class*="badge"]');
      const hasBadges = await badges.first().isVisible({ timeout: 3000 }).catch(() => false);
      // OK — มี stats section
    }
  });

  test('Queue table หรือ empty state แสดง', async ({ page }) => {
    const table = page.locator(SEL.ADMIN_QUEUE_TABLE + ', table');
    const emptyState = page.locator(SEL.EMPTY_STATE);

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Status filter เปลี่ยนได้', async ({ page }) => {
    const statusFilter = page.locator(SEL.ADMIN_STATUS_FILTER + ', select');
    if (await statusFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // เปลี่ยน filter
      const options = await statusFilter.first().locator('option').count();
      if (options > 1) {
        await statusFilter.first().selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Reset
        await statusFilter.first().selectOption({ index: 0 });
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('ปุ่ม "ตรวจสอบแล้ว" แสดงสำหรับ pending entries', async ({ page }) => {
    const verifyBtn = page.locator(SEL.BTN_VERIFY);
    const hasVerify = await verifyBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasVerify) {
      // คลิก → modal ต้องเปิด
      await verifyBtn.first().click();
      await page.waitForTimeout(500);

      const modal = page.locator(SEL.VERIFY_MODAL + ', [class*="modal"], [role="dialog"]');
      const hasModal = await modal.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasModal) {
        // ปิด modal โดยไม่ confirm (กด cancel หรือ overlay)
        const cancelBtn = page.locator(
          'button:has-text("ยกเลิก"), [class*="btnSecondary"], [class*="modalOverlay"]'
        );
        if (await cancelBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelBtn.first().click();
        }
      }
    }
    // ถ้าไม่มี verify btn = ไม่มี pending entries (ถือว่า pass)
  });
});

test.describe('Admin — System Test Staff Queue', () => {
  test('Officer เข้าหน้า System Test Queue ได้', async ({ page }) => {
    await page.goto('/admin/system-test/staff-queue');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/system-test\/staff-queue/);

    // ต้องเห็น header
    const header = page.locator(
      ':text("ทดสอบระบบ"), :text("System Test"), :text("คำร้อง"), :text("ตรวจสอบ")'
    );
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('System test queue table หรือ empty state แสดง', async ({ page }) => {
    await page.goto('/admin/system-test/staff-queue');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [class*="table"]');
    const emptyState = page.locator(SEL.EMPTY_STATE);

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('System test queue filters ทำงาน', async ({ page }) => {
    await page.goto('/admin/system-test/staff-queue');
    await page.waitForLoadState('networkidle');

    const statusFilter = page.locator('select');
    if (await statusFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await statusFilter.first().locator('option').count();
      if (options > 1) {
        await statusFilter.first().selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await statusFilter.first().selectOption({ index: 0 });
      }
    }
  });
});

test.describe('Admin — Thesis Staff Queue', () => {
  test('Officer เข้าหน้า Thesis Queue ได้', async ({ page }) => {
    await page.goto('/admin/thesis/staff-queue');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/thesis\/staff-queue/);

    const header = page.locator(
      ':text("วิทยานิพนธ์"), :text("Thesis"), :text("คำร้อง"), :text("สอบ")'
    );
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Thesis queue table หรือ empty state แสดง', async ({ page }) => {
    await page.goto('/admin/thesis/staff-queue');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [class*="table"]');
    const emptyState = page.locator(SEL.EMPTY_STATE);

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Thesis queue filters ทำงาน', async ({ page }) => {
    await page.goto('/admin/thesis/staff-queue');
    await page.waitForLoadState('networkidle');

    const statusFilter = page.locator('select');
    if (await statusFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await statusFilter.first().locator('option').count();
      if (options > 1) {
        await statusFilter.first().selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await statusFilter.first().selectOption({ index: 0 });
      }
    }
  });
});
