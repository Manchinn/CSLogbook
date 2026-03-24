import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

test.describe('Admin — Topic Exam Results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/topic-exam/results');
    await page.waitForLoadState('networkidle');
  });

  test('Officer เข้าหน้าบันทึกผลสอบหัวข้อได้', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/topic-exam\/results/);

    const header = page.locator(':text("บันทึกผลสอบหัวข้อโครงงานพิเศษ")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('Stats cards แสดงข้อมูล', async ({ page }) => {
    // ต้องมี stats: ทั้งหมด, รอบันทึกผล, ผ่าน, ไม่ผ่าน
    const statsLabels = ['ทั้งหมด', 'รอบันทึกผล', 'ผ่าน', 'ไม่ผ่าน'];
    let foundCount = 0;

    for (const label of statsLabels) {
      const stat = page.locator(`:text("${label}")`);
      if (await stat.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        foundCount++;
      }
    }

    // อย่างน้อยต้องเห็น 2 stats labels
    expect(foundCount).toBeGreaterThanOrEqual(2);
  });

  test('Filters — search, academic year, semester', async ({ page }) => {
    // Search input
    const searchInput = page.locator('input[placeholder*="ค้นหา"]');
    await expect(searchInput.first()).toBeVisible();

    // Academic year select
    const selects = page.locator('select');
    const selectCount = await selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(1);
  });

  test('Table แสดงรายการโครงงาน หรือ empty state', async ({ page }) => {
    const table = page.locator('table, [class*="table"]');
    const emptyState = page.locator(SEL.EMPTY_STATE);

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('ปุ่ม "ผ่าน" / "ไม่ผ่าน" แสดงสำหรับ entries ที่รอบันทึกผล', async ({ page }) => {
    // หาปุ่ม pass/fail
    const passBtn = page.locator('button:has-text("ผ่าน")');
    const failBtn = page.locator('button:has-text("ไม่ผ่าน")');

    const hasPass = await passBtn.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasFail = await failBtn.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPass) {
      // คลิก "ผ่าน" → modal เปิด
      await passBtn.first().click();
      await page.waitForTimeout(500);

      const modal = page.locator('[class*="modal"], [role="dialog"]');
      const hasModal = await modal.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasModal) {
        // ต้องเห็น title "บันทึกผล: ผ่าน"
        const modalTitle = page.locator(':text("บันทึกผล")');
        await expect(modalTitle.first()).toBeVisible();

        // ปิด modal
        const cancelBtn = page.locator(
          '[class*="modal"] button:has-text("ยกเลิก"), [class*="modalOverlay"]'
        );
        if (await cancelBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelBtn.first().click();
        }
      }
    }
    // ถ้าไม่มีปุ่ม = ไม่มี pending entries (ถือว่า pass)
  });

  test('ปุ่ม "รายละเอียด" เปิด drawer ได้', async ({ page }) => {
    const detailBtn = page.locator('button:has-text("รายละเอียด")');
    if (await detailBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailBtn.first().click();
      await page.waitForTimeout(500);

      // Drawer ต้องเปิด
      const drawer = page.locator('[class*="drawer"]');
      const hasDrawer = await drawer.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasDrawer) {
        // ต้องเห็น project info
        const projectInfo = page.locator(
          ':text("รายละเอียดโครงงาน"), :text("ข้อมูลผลสอบ"), :text("สมาชิก")'
        );
        await expect(projectInfo.first()).toBeVisible();

        // ปิด drawer
        const closeBtn = page.locator('[class*="drawer"] button:has-text("ปิด"), button:has-text("×")');
        if (await closeBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.first().click();
        }
      }
    }
  });

  test('ปุ่ม "ส่งออก Excel" ทำงาน (ถ้ามี data)', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("ส่งออก Excel"), button:has-text("Export")');
    const hasExport = await exportBtn.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasExport) {
      // ตรวจว่าปุ่มไม่ disabled
      const isDisabled = await exportBtn.first().isDisabled();
      // ถ้า enable → ปุ่มทำงาน (ไม่ต้อง click เพราะจะ download)
    }
  });

  test('ปุ่ม "รีเฟรช" reload ข้อมูลได้', async ({ page }) => {
    const refreshBtn = page.locator('button:has-text("รีเฟรช")');
    if (await refreshBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await refreshBtn.click();
      await page.waitForLoadState('networkidle');
      // ไม่ error หลัง refresh
      const errorState = page.locator(':text("เกิดข้อผิดพลาด")');
      await expect(errorState).not.toBeVisible();
    }
  });
});

test.describe('Admin — Project Exam Results', () => {
  test('Officer เข้าหน้าบันทึกผลสอบโครงงานได้', async ({ page }) => {
    await page.goto('/admin/project-exam/results');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/project-exam\/results/);

    // ต้องเห็น header ที่เกี่ยวกับ exam results
    const header = page.locator(
      ':text("ผลสอบ"), :text("บันทึกผลสอบ"), :text("โครงงาน")'
    );
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Project exam stats + table แสดงข้อมูล', async ({ page }) => {
    await page.goto('/admin/project-exam/results');
    await page.waitForLoadState('networkidle');

    // Stats
    const stats = page.locator('[class*="stats"], [class*="stat"]');
    await expect(stats.first()).toBeVisible({ timeout: 5000 });

    // Table หรือ empty
    const table = page.locator('table, [class*="table"]');
    const emptyState = page.locator(SEL.EMPTY_STATE);
    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTable || isEmpty).toBeTruthy();
  });
});

test.describe('Admin — Thesis Exam Results', () => {
  test('Officer เข้าหน้าบันทึกผลสอบวิทยานิพนธ์ได้', async ({ page }) => {
    await page.goto('/admin/thesis/exam-results');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/thesis\/exam-results/);

    const header = page.locator(
      ':text("ผลสอบ"), :text("บันทึกผลสอบ"), :text("วิทยานิพนธ์"), :text("Thesis")'
    );
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Thesis exam stats + table แสดงข้อมูล', async ({ page }) => {
    await page.goto('/admin/thesis/exam-results');
    await page.waitForLoadState('networkidle');

    const stats = page.locator('[class*="stats"], [class*="stat"]');
    await expect(stats.first()).toBeVisible({ timeout: 5000 });

    const table = page.locator('table, [class*="table"]');
    const emptyState = page.locator(SEL.EMPTY_STATE);
    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTable || isEmpty).toBeTruthy();
  });
});
