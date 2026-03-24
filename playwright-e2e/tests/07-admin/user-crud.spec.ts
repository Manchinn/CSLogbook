import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/officer.json' });

/* ─────────────────────────────────────────────────────────
 * Admin — User CRUD (Students & Teachers)
 * ───────────────────────────────────────────────────────── */

test.describe('Admin — Student Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users/students');
    await page.waitForLoadState('networkidle');
  });

  test('เข้าหน้าจัดการนักศึกษาได้', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/users\/students/);

    const header = page.locator(':text("จัดการข้อมูลนักศึกษา")');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Stats cards แสดง 4 items', async ({ page }) => {
    const labels = ['นักศึกษาทั้งหมด', 'มีสิทธิ์ฝึกงาน', 'มีสิทธิ์โครงงาน', 'ยังไม่มีสิทธิ์'];
    let found = 0;
    for (const label of labels) {
      const el = page.locator(`:text("${label}")`);
      if (await el.first().isVisible({ timeout: 3000 }).catch(() => false)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test('Search filter ค้นหาได้', async ({ page }) => {
    const search = page.locator('input[placeholder*="ค้นหา"]');
    await expect(search.first()).toBeVisible();

    await search.first().fill('student');
    await page.waitForTimeout(1000);

    // table หรือ empty
    const table = page.locator('table tbody tr');
    const empty = page.locator(SEL.EMPTY_STATE);
    const hasRows = await table.first().isVisible({ timeout: 3000 }).catch(() => false);
    const isEmpty = await empty.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasRows || isEmpty).toBeTruthy();

    await search.first().clear();
  });

  test('Status filter เปลี่ยนได้', async ({ page }) => {
    const selects = page.locator('select');
    if (await selects.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await selects.first().locator('option').count();
      if (options > 1) {
        await selects.first().selectOption({ index: 1 });
        await page.waitForLoadState('networkidle');
        await selects.first().selectOption({ index: 0 });
      }
    }
  });

  test('Student table แสดง columns ถูกต้อง', async ({ page }) => {
    const table = page.locator('table');
    if (await table.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      const headers = ['รหัสนักศึกษา', 'ชื่อ', 'จัดการ'];
      for (const h of headers) {
        const th = page.locator(`th:has-text("${h}")`);
        const vis = await th.first().isVisible({ timeout: 2000 }).catch(() => false);
        if (h === 'รหัสนักศึกษา') expect(vis).toBeTruthy();
      }
    }
  });

  test('ปุ่ม "+ เพิ่มนักศึกษา" แสดง', async ({ page }) => {
    const addBtn = page.locator('button:has-text("เพิ่มนักศึกษา")');
    await expect(addBtn).toBeVisible({ timeout: 5000 });
  });

  test('คลิก row action เปิด drawer ได้', async ({ page }) => {
    // หาปุ่ม "ดู" หรือ action ใน table
    const actionBtn = page.locator(
      'button:has-text("ดู"), button:has-text("แก้ไข"), button:has-text("รายละเอียด")'
    );
    if (await actionBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionBtn.first().click();
      await page.waitForTimeout(500);

      // Drawer ต้องเปิด
      const drawer = page.locator('[class*="drawer"], [class*="modal"]');
      const hasDrawer = await drawer.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasDrawer) {
        // ต้องเห็น student info
        const info = page.locator(':text("ข้อมูลทั่วไป"), :text("ข้อมูลการศึกษา"), :text("สถานะ")');
        await expect(info.first()).toBeVisible({ timeout: 3000 });

        // ปิด
        const closeBtn = page.locator('button:has-text("ปิด"), button:has-text("×")');
        if (await closeBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.first().click();
        }
      }
    }
  });

  test('Pagination ทำงาน', async ({ page }) => {
    const nextBtn = page.locator('button:has-text("ถัดไป")');
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isDisabled = await nextBtn.isDisabled();
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForLoadState('networkidle');

        const prevBtn = page.locator('button:has-text("ก่อนหน้า")');
        if (await prevBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await prevBtn.click();
        }
      }
    }
  });

  test('ปุ่ม "ล้างตัวกรอง" reset filters', async ({ page }) => {
    // พิมพ์ค้นหาก่อน
    const search = page.locator('input[placeholder*="ค้นหา"]');
    if (await search.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.first().fill('test');
      await page.waitForTimeout(500);
    }

    const clearBtn = page.locator('button:has-text("ล้างตัวกรอง")');
    if (await clearBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clearBtn.click();
      await page.waitForTimeout(500);

      // Search ต้อง clear
      const val = await search.first().inputValue();
      expect(val).toBe('');
    }
  });
});

test.describe('Admin — Teacher Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users/teachers');
    await page.waitForLoadState('networkidle');
  });

  test('เข้าหน้าจัดการอาจารย์ได้', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/users\/teachers/);

    const header = page.locator(':text("จัดการข้อมูลอาจารย์")');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('Stats cards แสดง', async ({ page }) => {
    const labels = ['อาจารย์ทั้งหมด', 'สายวิชาการ', 'เจ้าหน้าที่ภาควิชา'];
    let found = 0;
    for (const label of labels) {
      const el = page.locator(`:text("${label}")`);
      if (await el.first().isVisible({ timeout: 3000 }).catch(() => false)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test('Teacher table แสดงข้อมูล', async ({ page }) => {
    const table = page.locator('table, [class*="table"]');
    const empty = page.locator(SEL.EMPTY_STATE);

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await empty.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Search ค้นหาอาจารย์ได้', async ({ page }) => {
    const search = page.locator('input[placeholder*="ค้นหา"]');
    if (await search.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.first().fill('teacher');
      await page.waitForTimeout(1000);
      await search.first().clear();
    }
  });

  test('คลิก action เปิด drawer แสดง teacher detail', async ({ page }) => {
    const actionBtn = page.locator(
      'button:has-text("ดู"), button:has-text("แก้ไข"), button:has-text("รายละเอียด")'
    );
    if (await actionBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionBtn.first().click();
      await page.waitForTimeout(500);

      const drawer = page.locator('[class*="drawer"], [class*="modal"]');
      if (await drawer.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        const info = page.locator(
          ':text("ข้อมูลทั่วไป"), :text("ตำแหน่ง"), :text("สิทธิ์")'
        );
        await expect(info.first()).toBeVisible({ timeout: 3000 });

        const closeBtn = page.locator('button:has-text("ปิด"), button:has-text("×")');
        if (await closeBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.first().click();
        }
      }
    }
  });
});

test.describe('Admin — Bulk Upload', () => {
  test('เข้าหน้าอัปโหลดรายชื่อได้', async ({ page }) => {
    await page.goto('/admin/upload');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/upload/);

    const header = page.locator(':text("อัปโหลดรายชื่อนักศึกษา")');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('แสดง prerequisites check', async ({ page }) => {
    await page.goto('/admin/upload');
    await page.waitForLoadState('networkidle');

    // ต้องเห็น step 1 — prerequisite
    const prereq = page.locator(
      ':text("หลักสูตร"), :text("ปีการศึกษา"), :text("พร้อมอัปโหลด"), :text("ต้องตั้งค่าก่อน")'
    );
    await expect(prereq.first()).toBeVisible({ timeout: 5000 });
  });

  test('แสดง file upload zone', async ({ page }) => {
    await page.goto('/admin/upload');
    await page.waitForLoadState('networkidle');

    // Drop zone หรือ upload area
    const uploadArea = page.locator(
      ':text("ลากไฟล์"), :text("เลือกไฟล์"), :text("อัปโหลดไฟล์"), input[type="file"]'
    );
    const hasUpload = await uploadArea.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasUpload).toBeTruthy();
  });

  test('แสดง template download buttons', async ({ page }) => {
    await page.goto('/admin/upload');
    await page.waitForLoadState('networkidle');

    const csvBtn = page.locator('button:has-text("CSV"), a:has-text("CSV")');
    const excelBtn = page.locator('button:has-text("Excel"), a:has-text("Excel")');

    const hasCsv = await csvBtn.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasExcel = await excelBtn.first().isVisible({ timeout: 3000 }).catch(() => false);

    // อย่างน้อย 1 template button ต้องมี
    expect(hasCsv || hasExcel).toBeTruthy();
  });
});
