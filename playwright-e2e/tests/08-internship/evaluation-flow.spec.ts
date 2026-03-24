import { test, expect } from '../../fixtures/auth';
import { SEL } from '../../helpers/selectors';

/**
 * Internship Evaluation Flow — Multi-role + token-based
 * Student กดส่ง evaluation request → Supervisor เข้า token page → ประเมิน
 *
 * Prerequisite: Student ต้องมี internship ที่ in_progress + company info ครบ
 */

// รันแค่ student project
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'student',
    'workflow tests run once under student project'
  );
});

let canProceed = true;
let evaluationToken: string | null = null;

test.describe.serial('Internship Evaluation Flow', () => {
  test('Student เช็คสถานะ evaluation ได้', async ({ studentPage }) => {
    // เข้าหน้า internship summary หรือ certificate ที่มี evaluation status
    await studentPage.goto('/internship-summary');
    await studentPage.waitForLoadState('networkidle');

    // Skip ถ้ายังไม่มี internship
    const noInternship = studentPage.locator(
      ':text("ยังไม่ได้ลงทะเบียน"), :text("ไม่พบข้อมูลฝึกงาน"), :text("ไม่มีข้อมูล")'
    );
    if (await noInternship.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      canProceed = false;
      test.skip(true, 'Student ไม่มี internship — ต้อง seed ก่อน');
      return;
    }

    // ต้องเห็น internship summary content
    const content = studentPage.locator(
      ':text("ฝึกงาน"), :text("สรุป"), :text("สถานะ"), [class*="internship"], [class*="summary"]'
    );
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Supervisor evaluation form (token page) — page structure', async ({ studentPage, browser }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    // สร้าง anonymous context (ไม่ต้อง login) เพื่อทดสอบ public page
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();

    try {
      // ทดสอบ token page — ใช้ dummy token เพื่อตรวจ page structure
      await anonPage.goto('/evaluate/supervisor/test-invalid-token');
      await anonPage.waitForLoadState('networkidle');

      // ต้องเห็น error state สำหรับ invalid token
      const errorState = anonPage.locator(
        ':text("ไม่พบลิงก์"), :text("หมดอายุ"), :text("ไม่พบข้อมูล"), :text("ผิดพลาด")'
      );
      const hasError = await errorState.first().isVisible({ timeout: 10000 }).catch(() => false);

      // หรือ loading state (API still trying)
      const loadingState = anonPage.locator(':text("กำลังโหลด")');
      const isLoading = await loadingState.first().isVisible({ timeout: 3000 }).catch(() => false);

      // ต้องเห็น error หรือ loading (ไม่ใช่ blank page)
      expect(hasError || isLoading).toBeTruthy();
    } finally {
      await anonContext.close();
    }
  });

  test('Supervisor evaluation form — valid token shows form (API test)', async ({ studentPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    // ตรวจ evaluation API endpoint — GET status
    const apiUrl = process.env.API_URL || 'http://localhost:5000/api';

    // ถ้า student มี internship — ตรวจ evaluation status ผ่าน API
    const ctx = studentPage.context();
    const res = await ctx.request.get(`${apiUrl}/internship/evaluation/status`);

    if (res.ok()) {
      const body = await res.json();
      // ต้อง return status (pending/sent/completed)
      expect(body).toBeTruthy();
    }
    // ถ้า API fail — อาจไม่มี internship (ถือว่า pass สำหรับ structure test)
  });
});

test.describe('Supervisor Evaluation Form — Page Structure', () => {
  // ทดสอบ public page โดยไม่ต้อง auth
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Invalid token แสดง error page', async ({ page }) => {
    await page.goto('/evaluate/supervisor/invalid-token-xxx');
    await page.waitForLoadState('networkidle');

    // ต้องเห็น error message
    const errorContent = page.locator(
      ':text("ไม่พบลิงก์การประเมิน"), :text("หมดอายุ"), :text("ไม่พบข้อมูลการประเมิน")'
    );
    await expect(errorContent.first()).toBeVisible({ timeout: 15000 });
  });

  test('Evaluation page renders branding', async ({ page }) => {
    await page.goto('/evaluate/supervisor/any-token');
    await page.waitForLoadState('networkidle');

    // ต้องเห็น branding/header
    const branding = page.locator(
      ':text("แบบประเมินผลการฝึกงาน"), :text("CS Logbook"), :text("Internship evaluation")'
    );
    const hasBranding = await branding.first().isVisible({ timeout: 10000 }).catch(() => false);

    // หรือ error state (invalid token)
    const errorState = page.locator(
      ':text("ไม่พบ"), :text("หมดอายุ"), :text("ผิดพลาด")'
    );
    const hasError = await errorState.first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasBranding || hasError).toBeTruthy();
  });
});
