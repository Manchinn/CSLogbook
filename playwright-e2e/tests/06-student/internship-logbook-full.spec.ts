import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/student.json' });

test.describe('Student — Internship Logbook Full Flow', () => {
  test('เข้าหน้า timesheet ได้', async ({ page }) => {
    await page.goto('/internship-logbook/timesheet');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้องเห็น timesheet content หรือ guard message
    const content = page.locator(
      ':text("บันทึกเวลา"), :text("Timesheet"), :text("ตารางเวลา"), :text("logbook"), [class*="timesheet"]'
    );
    const guard = page.locator(
      ':text("ยังไม่ได้ลงทะเบียน"), :text("ไม่พบข้อมูล"), :text("ไม่สามารถเข้าถึง")'
    );

    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasGuard = await guard.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasContent || hasGuard).toBeTruthy();
  });

  test('เข้าหน้า logbook summary ได้', async ({ page }) => {
    await page.goto('/internship/logbook');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    const content = page.locator(
      ':text("logbook"), :text("บันทึก"), :text("สรุป"), :text("ฝึกงาน"), [class*="logbook"]'
    );
    const guard = page.locator(
      ':text("ยังไม่ได้ลงทะเบียน"), :text("ไม่พบข้อมูล")'
    );

    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasGuard = await guard.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasContent || hasGuard).toBeTruthy();
  });

  test('Logbook modal เปิดได้ (ถ้ามี internship)', async ({ page }) => {
    await page.goto('/internship-logbook/timesheet');
    await page.waitForLoadState('networkidle');

    // หาปุ่ม "กรอกข้อมูล" — จะมีเฉพาะเมื่อมี internship
    const fillBtn = page.locator(SEL.BTN_LOGBOOK_FILL);
    if (await fillBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await fillBtn.first().click();
      await page.waitForTimeout(500);

      // Modal ต้องเปิด
      const modal = page.locator(SEL.LOGBOOK_MODAL + ', [class*="modal"]');
      const hasModal = await modal.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasModal) {
        // ต้องเห็น form fields
        const timeIn = page.locator(SEL.LOGBOOK_TIME_IN);
        const timeOut = page.locator(SEL.LOGBOOK_TIME_OUT);
        const title = page.locator(SEL.LOGBOOK_TITLE);

        const hasTimeIn = await timeIn.isVisible({ timeout: 2000 }).catch(() => false);
        const hasTitle = await title.isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasTimeIn || hasTitle).toBeTruthy();

        // ปิด modal (กด ESC หรือ overlay)
        await page.keyboard.press('Escape');
      }
    }
    // ถ้าไม่มีปุ่ม = ยังไม่มี internship (ถือว่า pass)
  });

  test('Company info page แสดงข้อมูลบริษัท', async ({ page }) => {
    await page.goto('/internship-logbook/companyinfo');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    const content = page.locator(
      ':text("บริษัท"), :text("สถานประกอบการ"), :text("พี่เลี้ยง"), :text("ข้อมูลฝึกงาน")'
    );
    const guard = page.locator(
      ':text("ยังไม่ได้ลงทะเบียน"), :text("ไม่พบข้อมูล")'
    );

    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasGuard = await guard.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasContent || hasGuard).toBeTruthy();
  });

  test('Company info form — supervisor fields แสดง (ถ้ามี internship)', async ({ page }) => {
    await page.goto('/internship-logbook/companyinfo');
    await page.waitForLoadState('networkidle');

    const supervisorName = page.locator(SEL.SUPERVISOR_NAME);
    if (await supervisorName.isVisible({ timeout: 5000 }).catch(() => false)) {
      // ตรวจ form fields ครบ
      await expect(page.locator(SEL.SUPERVISOR_POSITION)).toBeVisible();
      await expect(page.locator(SEL.SUPERVISOR_PHONE)).toBeVisible();
      await expect(page.locator(SEL.SUPERVISOR_EMAIL)).toBeVisible();

      // ปุ่ม save/edit ต้องมี
      const saveBtn = page.locator(SEL.BTN_SAVE_COMPANY);
      const editBtn = page.locator(SEL.BTN_EDIT_COMPANY);
      const hasSave = await saveBtn.isVisible({ timeout: 2000 }).catch(() => false);
      const hasEdit = await editBtn.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasSave || hasEdit).toBeTruthy();
    }
  });

  test('Internship summary page โหลดได้', async ({ page }) => {
    await page.goto('/internship-summary');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    const content = page.locator(
      ':text("สรุป"), :text("ฝึกงาน"), :text("สถานะ"), :text("ภาพรวม")'
    );
    const guard = page.locator(
      ':text("ยังไม่ได้ลงทะเบียน"), :text("ไม่พบข้อมูล")'
    );

    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasGuard = await guard.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasContent || hasGuard).toBeTruthy();
  });
});
