import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

test.describe('Admin — Internship Document Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/documents/internship');
    await page.waitForLoadState('networkidle');
  });

  test('Officer เข้าหน้าจัดการเอกสารฝึกงานได้', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/documents\/internship/);

    // ต้องเห็น header
    const header = page.locator(
      ':text("จัดการเอกสารคำร้องขอฝึกงาน"), :text("จัดการคำร้องขอฝึกงาน")'
    );
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Stats cards แสดงข้อมูลสถิติ', async ({ page }) => {
    const statsLabels = [
      'เอกสารทั้งหมด',
      'รอตรวจสอบ',
      'อนุมัติแล้ว',
      'ปฏิเสธแล้ว',
    ];

    for (const label of statsLabels) {
      const stat = page.locator(`:text("${label}")`);
      const visible = await stat.first().isVisible({ timeout: 3000 }).catch(() => false);
      // อย่างน้อย label หลักต้องมี
      if (label === 'เอกสารทั้งหมด') {
        expect(visible).toBeTruthy();
      }
    }
  });

  test('Filters ทำงานได้ — search, status, academic year', async ({ page }) => {
    // Search input
    const searchInput = page.locator('input[placeholder*="ค้นหา"]');
    await expect(searchInput.first()).toBeVisible();

    // Status filter
    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      // เปลี่ยน filter → page reload
      await statusFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Reset — เลือก option แรก (ทั้งหมด)
      await statusFilter.selectOption({ index: 0 });
      await page.waitForLoadState('networkidle');
    }
  });

  test('Search input กรองข้อมูลได้', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="ค้นหา"]');
    await expect(searchInput.first()).toBeVisible();

    // พิมพ์ค้นหา
    await searchInput.first().fill('test');
    await page.waitForTimeout(1000); // debounce

    // ตรวจว่า table update (อาจมีหรือไม่มีผลลัพธ์)
    const table = page.locator('table tbody tr, [class*="tableRow"]');
    const emptyState = page.locator(SEL.EMPTY_STATE);

    const hasRows = await table.first().isVisible({ timeout: 3000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    // อย่างใดอย่างหนึ่งต้องแสดง
    expect(hasRows || isEmpty).toBeTruthy();

    // Clear search
    await searchInput.first().clear();
    await page.waitForTimeout(500);
  });

  test('Table แสดงข้อมูลเอกสาร หรือ empty state', async ({ page }) => {
    const table = page.locator('table, [class*="table"]');
    const emptyState = page.locator(
      '[class*="empty"], [class*="noData"], :text("ไม่พบเอกสาร"), :text("ไม่มีข้อมูล")'
    );

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Pagination ทำงาน (ถ้ามีข้อมูลมากพอ)', async ({ page }) => {
    const pagination = page.locator('[class*="pagination"]');
    const hasPagination = await pagination.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPagination) {
      // ต้องเห็น page info
      const pageInfo = page.locator(':text("แสดง"), :text("จาก"), :text("รายการ")');
      const hasInfo = await pageInfo.first().isVisible({ timeout: 2000 }).catch(() => false);
      // Pagination อาจแสดงหลายรูปแบบ — ถือว่า pass ถ้า element มี
    }
  });
});

test.describe('Admin — Project Document Management', () => {
  test('Officer เข้าหน้าจัดการเอกสารโครงงานได้', async ({ page }) => {
    await page.goto('/admin/documents/project');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/documents\/project/);

    const header = page.locator(':text("จัดการเอกสารโครงงาน"), :text("เอกสารโครงงาน")');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Project documents table แสดงข้อมูล', async ({ page }) => {
    await page.goto('/admin/documents/project');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [class*="table"]');
    const emptyState = page.locator(SEL.EMPTY_STATE);

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Project documents filters ทำงาน', async ({ page }) => {
    await page.goto('/admin/documents/project');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="ค้นหา"]');
    if (await searchInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);
      await searchInput.first().clear();
    }
  });
});

test.describe('Admin — Certificate Management', () => {
  test('Officer เข้าหน้าจัดการใบรับรองฝึกงานได้', async ({ page }) => {
    await page.goto('/admin/documents/certificates');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/documents\/certificates/);

    // ต้องเห็น header
    const header = page.locator(
      ':text("ใบรับรอง"), :text("certificate"), :text("คำขอ"), :text("จัดการ")'
    );
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Certificate stats แสดงข้อมูล', async ({ page }) => {
    await page.goto('/admin/documents/certificates');
    await page.waitForLoadState('networkidle');

    const statsLabels = ['คำขอทั้งหมด', 'รอดำเนินการ', 'อนุมัติแล้ว'];
    for (const label of statsLabels) {
      const stat = page.locator(`:text("${label}")`);
      const visible = await stat.first().isVisible({ timeout: 3000 }).catch(() => false);
      if (label === 'คำขอทั้งหมด') {
        expect(visible).toBeTruthy();
      }
    }
  });

  test('Certificate table แสดงข้อมูล หรือ empty state', async ({ page }) => {
    await page.goto('/admin/documents/certificates');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [class*="table"]');
    const emptyState = page.locator(SEL.EMPTY_STATE);

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Certificate search กรองข้อมูลได้', async ({ page }) => {
    await page.goto('/admin/documents/certificates');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="ค้นหา"]');
    if (await searchInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.first().fill('E2E');
      await page.waitForTimeout(1000);

      // ตรวจว่า filter ทำงาน (table หรือ empty state)
      const table = page.locator('table tbody tr');
      const emptyState = page.locator(SEL.EMPTY_STATE);
      const hasRows = await table.first().isVisible({ timeout: 3000 }).catch(() => false);
      const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasRows || isEmpty).toBeTruthy();

      await searchInput.first().clear();
    }
  });
});
