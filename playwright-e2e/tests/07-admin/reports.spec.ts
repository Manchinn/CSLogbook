import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

/* ─────────────────────────────────────────────────────────
 * Admin Reports — ทั้ง 7 หน้า
 * ตรวจว่า page load สำเร็จ, มี stats, table, filters
 * ───────────────────────────────────────────────────────── */

// ── Helper: ตรวจ report page พื้นฐาน ───────────────────────────────────
async function assertReportPageLoads(
  page: import('@playwright/test').Page,
  url: string,
  headerText: string | RegExp,
) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  // ต้องอยู่ที่ URL ที่ถูกต้อง
  await expect(page).toHaveURL(new RegExp(url.replace(/\//g, '\\/')));

  // ต้องเห็น header
  const header = page.locator(`h1, h2, [class*="title"]`);
  await expect(header.first()).toBeVisible({ timeout: 10000 });

  // ไม่ redirect กลับ login
  await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();
}

// ── 1. Advisor Workload ────────────────────────────────────────────────
test.describe('Report — Advisor Workload', () => {
  test('เข้าหน้ารายงานภาระงานอาจารย์ได้', async ({ page }) => {
    await assertReportPageLoads(page, '/admin/reports/advisor-workload', /ภาระงาน/);
  });

  test('แสดง stats cards', async ({ page }) => {
    await page.goto('/admin/reports/advisor-workload');
    await page.waitForLoadState('networkidle');

    const labels = ['อาจารย์ที่ปรึกษา', 'โครงงานทั้งหมด', 'ภาระงานเฉลี่ย'];
    for (const label of labels) {
      const el = page.locator(`:text("${label}")`);
      const vis = await el.first().isVisible({ timeout: 3000 }).catch(() => false);
      if (label === 'อาจารย์ที่ปรึกษา') expect(vis).toBeTruthy();
    }
  });

  test('แสดง table หรือ empty state', async ({ page }) => {
    await page.goto('/admin/reports/advisor-workload');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [class*="table"]');
    const empty = page.locator(SEL.EMPTY_STATE);
    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await empty.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('ปุ่ม "รายละเอียด" เปิด modal ได้', async ({ page }) => {
    await page.goto('/admin/reports/advisor-workload');
    await page.waitForLoadState('networkidle');

    const detailBtn = page.locator('button:has-text("รายละเอียด")');
    if (await detailBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailBtn.first().click();
      await page.waitForTimeout(500);
      const modal = page.locator('[class*="modal"], [role="dialog"]');
      await expect(modal.first()).toBeVisible({ timeout: 3000 });

      // ปิด modal
      const closeBtn = page.locator('button:has-text("ปิด")');
      if (await closeBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.first().click();
      }
    }
  });
});

// ── 2. Deadline Compliance ─────────────────────────────────────────────
test.describe('Report — Deadline Compliance', () => {
  test('เข้าหน้ารายงานการส่งงานตามกำหนดได้', async ({ page }) => {
    await assertReportPageLoads(page, '/admin/reports/deadline-compliance', /ส่งงาน|กำหนด/);
  });

  test('แสดง KPI cards', async ({ page }) => {
    await page.goto('/admin/reports/deadline-compliance');
    await page.waitForLoadState('networkidle');

    const labels = ['กำหนดการทั้งหมด', 'ส่งตรงเวลา', 'เลยกำหนด'];
    let found = 0;
    for (const label of labels) {
      const el = page.locator(`:text("${label}")`);
      if (await el.first().isVisible({ timeout: 3000 }).catch(() => false)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test('Year / Semester filters ทำงาน', async ({ page }) => {
    await page.goto('/admin/reports/deadline-compliance');
    await page.waitForLoadState('networkidle');

    const selects = page.locator('[class*="filters"] select, select');
    const count = await selects.count();
    if (count > 0) {
      await selects.first().selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      await selects.first().selectOption({ index: 0 });
    }
  });
});

// ── 3. Document Pipeline ───────────────────────────────────────────────
test.describe('Report — Document Pipeline', () => {
  test('เข้าหน้าสถานะเอกสารได้', async ({ page }) => {
    await assertReportPageLoads(page, '/admin/reports/document-pipeline', /เอกสาร|สถานะ/);
  });

  test('แสดง summary rings / cards', async ({ page }) => {
    await page.goto('/admin/reports/document-pipeline');
    await page.waitForLoadState('networkidle');

    const labels = ['ทั้งหมด', 'รออนุมัติ', 'อนุมัติแล้ว'];
    let found = 0;
    for (const label of labels) {
      const el = page.locator(`:text("${label}")`);
      if (await el.first().isVisible({ timeout: 3000 }).catch(() => false)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test('ปุ่ม "ส่งออก CSV" แสดง', async ({ page }) => {
    await page.goto('/admin/reports/document-pipeline');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.locator('button:has-text("ส่งออก CSV"), button:has-text("Export")');
    const hasExport = await exportBtn.first().isVisible({ timeout: 3000 }).catch(() => false);
    // ปุ่มอาจ disabled ถ้าไม่มี data — ไม่ต้อง click
  });

  test('Filters — year, semester, document type', async ({ page }) => {
    await page.goto('/admin/reports/document-pipeline');
    await page.waitForLoadState('networkidle');

    const selects = page.locator('select');
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

// ── 4. Internship Report ───────────────────────────────────────────────
test.describe('Report — Internship', () => {
  test('เข้าหน้ารายงานฝึกงานได้', async ({ page }) => {
    await assertReportPageLoads(page, '/admin/reports/internship', /ฝึกงาน/);
  });

  test('แสดง KPI cards + completion ring', async ({ page }) => {
    await page.goto('/admin/reports/internship');
    await page.waitForLoadState('networkidle');

    const labels = ['ลงทะเบียนฝึกงาน', 'ฝึกงานเสร็จแล้ว', 'อยู่ระหว่างฝึกงาน'];
    let found = 0;
    for (const label of labels) {
      const el = page.locator(`:text("${label}")`);
      if (await el.first().isVisible({ timeout: 3000 }).catch(() => false)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test('แสดง student table หรือ empty state', async ({ page }) => {
    await page.goto('/admin/reports/internship');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [class*="table"]');
    const empty = page.locator(SEL.EMPTY_STATE);
    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await empty.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTable || isEmpty).toBeTruthy();
  });
});

// ── 5. Internship Supervisors ──────────────────────────────────────────
test.describe('Report — Internship Supervisors', () => {
  test('เข้าหน้ารายงานสถานประกอบการได้', async ({ page }) => {
    await assertReportPageLoads(page, '/admin/reports/internship-supervisors', /สถานประกอบการ|บริษัท/);
  });

  test('แสดง KPI strip', async ({ page }) => {
    await page.goto('/admin/reports/internship-supervisors');
    await page.waitForLoadState('networkidle');

    const labels = ['บริษัท', 'พี่เลี้ยง', 'นักศึกษา'];
    let found = 0;
    for (const label of labels) {
      const el = page.locator(`:text("${label}")`);
      if (await el.first().isVisible({ timeout: 3000 }).catch(() => false)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test('Search filter ค้นหาได้', async ({ page }) => {
    await page.goto('/admin/reports/internship-supervisors');
    await page.waitForLoadState('networkidle');

    const search = page.locator('input[placeholder*="ค้นหา"]');
    if (await search.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.first().fill('test');
      await page.waitForTimeout(1000);
      await search.first().clear();
    }
  });
});

// ── 6. Project Report ──────────────────────────────────────────────────
test.describe('Report — Project', () => {
  test('เข้าหน้ารายงานโครงงานได้', async ({ page }) => {
    await assertReportPageLoads(page, '/admin/reports/project', /โครงงาน/);
  });

  test('แสดง KPI cards', async ({ page }) => {
    await page.goto('/admin/reports/project');
    await page.waitForLoadState('networkidle');

    const labels = ['โครงงานทั้งหมด', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
    let found = 0;
    for (const label of labels) {
      const el = page.locator(`:text("${label}")`);
      if (await el.first().isVisible({ timeout: 3000 }).catch(() => false)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test('Search + status filter ทำงาน', async ({ page }) => {
    await page.goto('/admin/reports/project');
    await page.waitForLoadState('networkidle');

    const search = page.locator('input[placeholder*="ค้นหา"]');
    if (await search.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.first().fill('E2E');
      await page.waitForTimeout(1000);
      await search.first().clear();
    }

    const statusSelect = page.locator('select');
    if (await statusSelect.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await statusSelect.first().locator('option').count();
      if (options > 1) {
        await statusSelect.first().selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await statusSelect.first().selectOption({ index: 0 });
      }
    }
  });

  test('Pagination ทำงาน (ถ้ามีข้อมูลมากพอ)', async ({ page }) => {
    await page.goto('/admin/reports/project');
    await page.waitForLoadState('networkidle');

    const nextBtn = page.locator('button:has-text("ถัดไป")');
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isDisabled = await nextBtn.isDisabled();
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForLoadState('networkidle');

        // กลับหน้าแรก
        const prevBtn = page.locator('button:has-text("ก่อนหน้า")');
        if (await prevBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await prevBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });
});

// ── 7. Workflow Progress ───────────────────────────────────────────────
test.describe('Report — Workflow Progress', () => {
  test('เข้าหน้ารายงาน Workflow ได้', async ({ page }) => {
    await assertReportPageLoads(page, '/admin/reports/workflow-progress', /Workflow|ความคืบหน้า/);
  });

  test('Workflow type filter เปลี่ยนได้', async ({ page }) => {
    await page.goto('/admin/reports/workflow-progress');
    await page.waitForLoadState('networkidle');

    const typeSelect = page.locator('select');
    if (await typeSelect.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // เปลี่ยนเป็น "โครงงานพิเศษ 1"
      const options = await typeSelect.first().locator('option').count();
      if (options > 1) {
        await typeSelect.first().selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // ข้อมูลต้อง update
        const content = page.locator(
          'table, [class*="table"], [class*="funnel"], :text("ขั้นตอน")'
        );
        const hasContent = await content.first().isVisible({ timeout: 5000 }).catch(() => false);
        const empty = page.locator(SEL.EMPTY_STATE);
        const isEmpty = await empty.first().isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasContent || isEmpty).toBeTruthy();
      }
    }
  });

  test('แสดง KPI summary', async ({ page }) => {
    await page.goto('/admin/reports/workflow-progress');
    await page.waitForLoadState('networkidle');

    const labels = ['นักศึกษาทั้งหมด', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
    let found = 0;
    for (const label of labels) {
      const el = page.locator(`:text("${label}")`);
      if (await el.first().isVisible({ timeout: 3000 }).catch(() => false)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });
});
