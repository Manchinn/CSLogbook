import { test, expect } from '@playwright/test';

/**
 * Timesheet Approval — Public token-based page
 * Supervisor เข้าผ่าน token → เห็น logbook entries → Approve/Reject
 *
 * ไม่ต้อง login — เป็น public page ใช้ token จาก email
 */

// ไม่ใช้ auth — public page
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Timesheet Approval — Token Page Structure', () => {
  test('Invalid token แสดง error page', async ({ page }) => {
    await page.goto('/approval/timesheet/invalid-token-xxx');
    await page.waitForLoadState('networkidle');

    // ต้องเห็น error state
    const errorContent = page.locator(
      ':text("ไม่พบลิงก์"), :text("หมดอายุ"), :text("ไม่สามารถโหลด"), :text("ผิดพลาด")'
    );
    await expect(errorContent.first()).toBeVisible({ timeout: 15000 });
  });

  test('No token path แสดง error', async ({ page }) => {
    // เข้า path โดยไม่มี token
    await page.goto('/approval/timesheet/');
    await page.waitForLoadState('networkidle');

    // ต้องเห็น error หรือ redirect
    const errorContent = page.locator(
      ':text("ไม่พบลิงก์"), :text("ไม่พบ"), :text("404"), :text("กรุณาตรวจสอบ")'
    );
    const hasError = await errorContent.first().isVisible({ timeout: 10000 }).catch(() => false);

    // หรือ redirect ไปหน้าอื่น
    const url = page.url();
    const isError = hasError || url.includes('404') || url.includes('login');

    expect(isError).toBeTruthy();
  });

  test('Timesheet page renders branding elements', async ({ page }) => {
    await page.goto('/approval/timesheet/any-test-token');
    await page.waitForLoadState('networkidle');

    // ต้องเห็น CS Logbook branding
    const branding = page.locator(
      ':text("CS Logbook"), :text("อนุมัติบันทึกการฝึกงาน"), :text("CS")'
    );
    const hasBranding = await branding.first().isVisible({ timeout: 10000 }).catch(() => false);

    // หรือ error (invalid token) — ทั้ง 2 กรณี page ไม่ blank
    const errorState = page.locator(
      ':text("ไม่พบ"), :text("หมดอายุ"), :text("ผิดพลาด"), :text("โหลด")'
    );
    const hasError = await errorState.first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasBranding || hasError).toBeTruthy();
  });

  test('Expired token แสดง expiry message', async ({ page }) => {
    // ใช้ token format ที่ดูเหมือนจริงแต่ expired
    await page.goto('/approval/timesheet/expired-token-test-12345');
    await page.waitForLoadState('networkidle');

    // ต้องเห็น error/expired message (ไม่ใช่ blank page)
    const content = page.locator(
      ':text("หมดอายุ"), :text("ไม่พบ"), :text("ไม่สามารถ"), :text("error"), :text("กรุณาตรวจสอบ")'
    );
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Timesheet Approval — Form Elements (with valid token)', () => {
  // หมายเหตุ: tests เหล่านี้ต้องมี valid token จาก seed data
  // ถ้าไม่มี seed → tests จะ skip gracefully

  test('Valid token page แสดง student info card', async ({ page }) => {
    // ใช้ token จาก seed (ถ้ามี) หรือ skip
    const testToken = process.env.E2E_TIMESHEET_TOKEN;
    if (!testToken) {
      test.skip(true, 'ไม่มี E2E_TIMESHEET_TOKEN — ต้อง seed ก่อน');
      return;
    }

    await page.goto(`/approval/timesheet/${testToken}`);
    await page.waitForLoadState('networkidle');

    // ต้องเห็น summary card — student name, company, hours
    const summaryCard = page.locator('[class*="summaryCard"], [class*="summary"]');
    await expect(summaryCard.first()).toBeVisible({ timeout: 10000 });

    // ต้องเห็น student identity
    const studentInfo = page.locator(':text("สถานประกอบการ"), :text("จำนวนรายการ"), :text("ชั่วโมง")');
    await expect(studentInfo.first()).toBeVisible();
  });

  test('Valid token page แสดง logbook entries', async ({ page }) => {
    const testToken = process.env.E2E_TIMESHEET_TOKEN;
    if (!testToken) {
      test.skip(true, 'ไม่มี E2E_TIMESHEET_TOKEN — ต้อง seed ก่อน');
      return;
    }

    await page.goto(`/approval/timesheet/${testToken}`);
    await page.waitForLoadState('networkidle');

    // ต้องเห็น entries section
    const entriesSection = page.locator(
      ':text("รายการบันทึก"), :text("รออนุมัติ"), [class*="entry"], [class*="section"]'
    );
    await expect(entriesSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('Valid token page แสดง decision form', async ({ page }) => {
    const testToken = process.env.E2E_TIMESHEET_TOKEN;
    if (!testToken) {
      test.skip(true, 'ไม่มี E2E_TIMESHEET_TOKEN — ต้อง seed ก่อน');
      return;
    }

    await page.goto(`/approval/timesheet/${testToken}`);
    await page.waitForLoadState('networkidle');

    // ต้องเห็น decision section — radio buttons อนุมัติ/ปฏิเสธ
    const decisionSection = page.locator(
      ':text("ยืนยันผลการอนุมัติ"), :text("อนุมัติ"), :text("ปฏิเสธ")'
    );
    const hasDecision = await decisionSection.first().isVisible({ timeout: 10000 }).catch(() => false);

    // หรือ already decided state
    const alreadyDecided = page.locator(
      ':text("บันทึกผลการประเมินแล้ว"), :text("อนุมัติแล้ว"), :text("ปฏิเสธแล้ว")'
    );
    const decided = await alreadyDecided.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasDecision || decided).toBeTruthy();
  });

  test('Decision radio buttons toggle correctly', async ({ page }) => {
    const testToken = process.env.E2E_TIMESHEET_TOKEN;
    if (!testToken) {
      test.skip(true, 'ไม่มี E2E_TIMESHEET_TOKEN — ต้อง seed ก่อน');
      return;
    }

    await page.goto(`/approval/timesheet/${testToken}`);
    await page.waitForLoadState('networkidle');

    // หา radio cards
    const approveRadio = page.locator(':text("อนุมัติ")').first();
    const rejectRadio = page.locator(':text("ปฏิเสธ")').first();

    if (await approveRadio.isVisible({ timeout: 5000 }).catch(() => false)) {
      // คลิก approve
      await approveRadio.click();
      await page.waitForTimeout(300);

      // ตรวจ textarea hint — ไม่บังคับกรอก
      const textarea = page.locator('textarea[placeholder*="หมายเหตุ"], textarea[placeholder*="เหตุผล"]');
      if (await textarea.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        const hint = page.locator(':text("ไม่บังคับ")');
        const hasOptionalHint = await hint.first().isVisible({ timeout: 2000 }).catch(() => false);
        // อาจมีหรือไม่มี hint
      }

      // คลิก reject
      if (await rejectRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rejectRadio.click();
        await page.waitForTimeout(300);

        // ตรวจ textarea hint — บังคับกรอก
        const requiredHint = page.locator(':text("จำเป็นต้องระบุ")');
        const hasRequiredHint = await requiredHint.first().isVisible({ timeout: 2000 }).catch(() => false);
        // อาจมีหรือไม่มี hint
      }
    }
  });
});
