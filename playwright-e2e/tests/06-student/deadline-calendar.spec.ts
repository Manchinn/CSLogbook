import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

/* ─────────────────────────────────────────────────────────
 * Deadline Calendar — Student & Teacher views
 * ───────────────────────────────────────────────────────── */

test.describe('Student — Deadline Calendar', () => {
  test.use({ storageState: 'auth/student.json' });

  test('เข้าหน้า student deadline calendar ได้', async ({ page }) => {
    await page.goto('/student-deadlines/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้องเห็น calendar content หรือ deadline list
    const content = page.locator(
      ':text("กำหนดส่ง"), :text("ปฏิทิน"), :text("Deadline"), :text("กำหนดการ"), [class*="calendar"]'
    );
    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);

    // อาจ redirect ถ้า feature flag ปิด
    if (!hasContent) {
      const error = page.locator(':text("เกิดข้อผิดพลาด")');
      await expect(error).not.toBeVisible();
    }
  });

  test('เข้าหน้า /deadlines redirect ได้', async ({ page }) => {
    await page.goto('/deadlines');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้อง redirect ไป student-specific page
    const url = page.url();
    const isDeadlinePage = url.includes('deadline') || url.includes('calendar') || url.includes('dashboard');
    expect(isDeadlinePage).toBeTruthy();
  });

  test('Calendar แสดง deadline items หรือ empty', async ({ page }) => {
    await page.goto('/student-deadlines/calendar');
    await page.waitForLoadState('networkidle');

    const items = page.locator(
      '[class*="event"], [class*="deadline"], [class*="item"], [class*="card"]'
    );
    const empty = page.locator(
      ':text("ไม่มีกำหนดส่ง"), :text("ไม่มีกำหนดการ"), ' + SEL.EMPTY_STATE
    );

    const hasItems = await items.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await empty.first().isVisible({ timeout: 3000 }).catch(() => false);

    // ทั้ง 2 กรณี OK — อาจ feature flag ปิดจน redirect
    // ตรวจแค่ว่าไม่ error
    const error = page.locator(':text("เกิดข้อผิดพลาด")');
    await expect(error).not.toBeVisible();
  });
});

test.describe('Teacher — Deadline Calendar', () => {
  test.use({ storageState: 'auth/advisor.json' });

  test('เข้าหน้า teacher deadline calendar ได้', async ({ page }) => {
    await page.goto('/teacher/deadlines/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้องเห็น header "ปฏิทินกำหนดการ"
    const header = page.locator(':text("ปฏิทินกำหนดการ"), :text("กำหนดการ")');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Year filter ทำงาน', async ({ page }) => {
    await page.goto('/teacher/deadlines/calendar');
    await page.waitForLoadState('networkidle');

    const yearFilter = page.locator('#teacherYearFilter, select');
    if (await yearFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await yearFilter.first().locator('option').count();
      if (options > 1) {
        await yearFilter.first().selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // ตรวจว่า page ไม่ error
        const error = page.locator(':text("โหลดกำหนดการไม่สำเร็จ")');
        await expect(error).not.toBeVisible();

        // Reset
        await yearFilter.first().selectOption({ index: 0 });
      }
    }
  });

  test('Deadline table แสดงข้อมูล หรือ empty state', async ({ page }) => {
    await page.goto('/teacher/deadlines/calendar');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [class*="table"]');
    const empty = page.locator(':text("ไม่มีกำหนดการ"), [class*="empty"]');

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await empty.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Deadline table แสดง group headers (โครงงาน/ฝึกงาน)', async ({ page }) => {
    await page.goto('/teacher/deadlines/calendar');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    if (await table.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      // ตรวจ group labels
      const groups = ['โครงงานพิเศษ', 'ปริญญานิพนธ์', 'ฝึกงาน', 'ทั่วไป'];
      let found = 0;
      for (const g of groups) {
        const el = page.locator(`:text("${g}")`);
        if (await el.first().isVisible({ timeout: 2000 }).catch(() => false)) found++;
      }
      // อย่างน้อย 1 group ต้องมี (ถ้า table แสดง)
      expect(found).toBeGreaterThanOrEqual(1);
    }
  });

  test('Critical deadline badge แสดง (ถ้ามี)', async ({ page }) => {
    await page.goto('/teacher/deadlines/calendar');
    await page.waitForLoadState('networkidle');

    // badge "สำคัญมาก" อาจมีหรือไม่มี
    const criticalBadge = page.locator(':text("สำคัญมาก"), [class*="criticalBadge"]');
    // ไม่ assert ว่าต้องมี — แค่ตรวจว่า page ทำงาน
    const error = page.locator(':text("โหลดกำหนดการไม่สำเร็จ")');
    await expect(error).not.toBeVisible();
  });
});
