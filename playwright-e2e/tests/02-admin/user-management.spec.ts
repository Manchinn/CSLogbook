import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

test.describe('User Management — Students', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users/students');
  });

  test('student list โหลดและแสดงข้อมูล', async ({ page }) => {
    // Title แสดง
    await expect(
      page.getByRole('heading', { name: 'จัดการข้อมูลนักศึกษา' })
    ).toBeVisible();

    // รอ data โหลด
    await page.waitForLoadState('networkidle');

    // Table มี rows (ไม่ใช่ empty)
    const tableRows = page.locator('table tbody tr, [class*="tableRow"]');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('สถิตินักศึกษาแสดง', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Stats cards แสดง
    const stats = page.locator(SEL.STAT_CARD);
    const statCount = await stats.count();
    expect(statCount).toBeGreaterThan(0);
  });

  test('สามารถค้นหานักศึกษาได้', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Search input แสดง
    const searchInput = page.locator(SEL.USER_SEARCH);
    await expect(searchInput).toBeVisible();

    // พิมพ์ค้นหา — table ควรยังแสดงอยู่ (ไม่ crash)
    await searchInput.fill('test');

    // รอ debounce + re-render
    await page.waitForTimeout(500);

    // Table ยังแสดงอยู่ (อาจมีหรือไม่มี results ก็ได้)
    const table = page.locator('table, [class*="table"]');
    await expect(table.first()).toBeVisible();
  });
});

test.describe('User Management — Teachers', () => {
  test('teacher list โหลดและแสดงข้อมูล', async ({ page }) => {
    await page.goto('/admin/users/teachers');

    // Title แสดง
    await expect(
      page.getByRole('heading', { name: 'จัดการข้อมูลอาจารย์' })
    ).toBeVisible();

    // รอ data โหลด
    await page.waitForLoadState('networkidle');

    // Table มี rows
    const tableRows = page.locator('table tbody tr, [class*="tableRow"]');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('สถิติอาจารย์แสดง', async ({ page }) => {
    await page.goto('/admin/users/teachers');
    await page.waitForLoadState('networkidle');

    // Stats cards แสดง
    const stats = page.locator(SEL.STAT_CARD);
    const statCount = await stats.count();
    expect(statCount).toBeGreaterThan(0);
  });
});
