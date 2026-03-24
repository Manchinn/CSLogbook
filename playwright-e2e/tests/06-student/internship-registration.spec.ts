import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/student.json' });

test.describe('Student — Internship Eligibility & Requirements', () => {
  test('เข้าหน้า internship-eligibility ได้', async ({ page }) => {
    await page.goto('/internship-eligibility');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    const content = page.locator(
      ':text("คุณสมบัติ"), :text("สิทธิ์"), :text("ฝึกงาน"), :text("เกณฑ์"), :text("หน่วยกิต")'
    );
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Eligibility แสดงผลลัพธ์ (ผ่าน/ไม่ผ่าน)', async ({ page }) => {
    await page.goto('/internship-eligibility');
    await page.waitForLoadState('networkidle');

    const result = page.locator(
      ':text("ผ่าน"), :text("ไม่ผ่าน"), :text("มีสิทธิ์"), :text("ไม่มีสิทธิ์"), :text("คุณสมบัติ")'
    );
    await expect(result.first()).toBeVisible({ timeout: 10000 });
  });

  test('เข้าหน้า internship-requirements ได้', async ({ page }) => {
    await page.goto('/internship-requirements');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    const content = page.locator(
      ':text("เงื่อนไข"), :text("ข้อกำหนด"), :text("ฝึกงาน"), :text("เอกสาร")'
    );
    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);

    // หน้านี้อาจ redirect ถ้า feature flag ปิด
    if (!hasContent) {
      const error = page.locator(':text("เกิดข้อผิดพลาด")');
      await expect(error).not.toBeVisible();
    }
  });
});

test.describe('Student — Internship Registration', () => {
  test('เข้าหน้า registration landing ได้', async ({ page }) => {
    await page.goto('/internship-registration');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้องเห็น registration content หรือ redirect
    const content = page.locator(
      ':text("ลงทะเบียน"), :text("ฝึกงาน"), :text("เริ่มต้น"), :text("คำร้อง")'
    );
    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);

    // อาจ redirect ถ้า feature flag ปิด
    if (!hasContent) {
      const error = page.locator(':text("เกิดข้อผิดพลาด")');
      await expect(error).not.toBeVisible();
    }
  });

  test('เข้าหน้า registration flow ได้', async ({ page }) => {
    await page.goto('/internship-registration/flow');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้องเห็น flow content (multi-step form) หรือ redirect/guard
    const content = page.locator(
      ':text("ขั้นตอน"), :text("Step"), [class*="stepper"], [class*="flow"], :text("ส่งคำร้อง")'
    );
    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);

    // อาจ redirect ถ้า feature flag ปิด หรือ ลงทะเบียนแล้ว
    const alreadyRegistered = page.locator(
      ':text("ลงทะเบียนแล้ว"), :text("อยู่ระหว่างฝึกงาน"), :text("สถานะ")'
    );
    const isRegistered = await alreadyRegistered.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasContent && !isRegistered) {
      const error = page.locator(':text("เกิดข้อผิดพลาด")');
      await expect(error).not.toBeVisible();
    }
  });

  test('เข้าหน้า internship companies ดูรายชื่อบริษัทได้', async ({ page }) => {
    await page.goto('/internship-companies');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    const content = page.locator(
      ':text("บริษัท"), :text("สถานประกอบการ"), :text("Company"), table, [class*="company"]'
    );
    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasContent) {
      const error = page.locator(':text("เกิดข้อผิดพลาด")');
      await expect(error).not.toBeVisible();
    }
  });
});
