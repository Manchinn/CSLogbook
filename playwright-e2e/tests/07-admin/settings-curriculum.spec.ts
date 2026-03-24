import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

test.describe('Settings — Curriculum', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings/curriculum');
    await page.waitForLoadState('networkidle');
  });

  test('เข้าหน้า curriculum ได้', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/settings\/curriculum/);

    // ต้องเห็น settings title
    await expect(
      page.locator(SEL.SETTINGS_TITLE).or(page.locator('h1:has-text("การตั้งค่าระบบ")'))
    ).toBeVisible();
  });

  test('แสดง curriculum form', async ({ page }) => {
    // ต้องเห็น form fields
    const codeInput = page.locator('input').first();
    await expect(codeInput).toBeVisible({ timeout: 5000 });

    // ปุ่ม "บันทึกหลักสูตร"
    const saveBtn = page.locator('button:has-text("บันทึกหลักสูตร")');
    await expect(saveBtn).toBeVisible();
  });

  test('แสดง curriculum list table หรือ empty state', async ({ page }) => {
    const table = page.locator('table, [class*="table"]');
    const empty = page.locator(':text("ไม่พบข้อมูลหลักสูตร")');

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await empty.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Table แสดง columns ถูกต้อง', async ({ page }) => {
    const table = page.locator('table');
    if (await table.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      // ตรวจ header columns
      const headers = ['รหัส', 'ชื่อ', 'สถานะ', 'จัดการ'];
      for (const h of headers) {
        const th = page.locator(`th:has-text("${h}")`);
        const vis = await th.first().isVisible({ timeout: 2000 }).catch(() => false);
        // อย่างน้อย "รหัส" ต้องมี
        if (h === 'รหัส') expect(vis).toBeTruthy();
      }
    }
  });

  test('ปุ่ม "แก้ไข" โหลด form ได้ (ถ้ามี data)', async ({ page }) => {
    const editBtn = page.locator('button:has-text("แก้ไข")');
    if (await editBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.first().click();
      await page.waitForTimeout(500);

      // Form ต้อง populated ด้วยข้อมูล
      const codeInput = page.locator('input').first();
      const value = await codeInput.inputValue();
      // ถ้ากด edit แล้ว input ต้องมีค่า
      expect(value.length).toBeGreaterThan(0);

      // กด "ล้างฟอร์ม" เพื่อ reset
      const clearBtn = page.locator('button:has-text("ล้างฟอร์ม")');
      if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clearBtn.click();
      }
    }
  });

  test('ปุ่ม "รีเฟรช" reload ข้อมูล', async ({ page }) => {
    const refreshBtn = page.locator(SEL.BTN_REFRESH);
    if (await refreshBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await refreshBtn.click();
      await page.waitForLoadState('networkidle');

      const error = page.locator(':text("เกิดข้อผิดพลาด")');
      await expect(error).not.toBeVisible();
    }
  });
});
