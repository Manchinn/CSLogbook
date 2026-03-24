import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/student.json' });

test.describe('Student Project Creation & Management', () => {
  test('Student เข้าหน้า Project Phase 1 ได้', async ({ page }) => {
    await page.goto('/project/phase1');
    await page.waitForLoadState('networkidle');

    // ต้องไม่ redirect กลับ login
    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้องอยู่ที่ project-related URL
    await expect(page).toHaveURL(/\/project/);
  });

  test('Student เห็นหน้าสร้างโครงงาน หรือ โครงงานที่มีอยู่', async ({ page }) => {
    await page.goto('/project/phase1');
    await page.waitForLoadState('networkidle');

    // กรณี 1: มีโครงงานแล้ว — เห็น project detail/status
    const hasProject = page.locator(
      ':text("โครงงาน"), :text("สถานะ"), :text("ขั้นตอน"), [class*="stepper"], [class*="project"]'
    );
    // กรณี 2: ยังไม่มี — เห็นปุ่มสร้าง หรือ empty state
    const noProject = page.locator(
      ':text("สร้างโครงงาน"), :text("ยังไม่มีโครงงาน"), :text("เริ่มต้น")'
    );

    const showsProject = await hasProject.first().isVisible({ timeout: 5000 }).catch(() => false);
    const showsEmpty = await noProject.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(showsProject || showsEmpty).toBeTruthy();
  });

  test('Student เข้าหน้า /student/projects ดูรายการโครงงานได้', async ({ page }) => {
    await page.goto('/student/projects');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้องเห็น content — project list หรือ empty state
    const content = page.locator(
      'table, [class*="project"], [class*="card"], :text("ยังไม่มีโครงงาน"), :text("โครงงาน")'
    );
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Student เข้าหน้า meeting-logbook จาก Phase 1 ได้', async ({ page }) => {
    await page.goto('/project/phase1/meeting-logbook');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้องเห็น meeting content หรือ no-project message
    const content = page.locator(
      ':text("บันทึกการประชุม"), :text("การพบอาจารย์"), :text("ยังไม่มีโครงงาน"), [class*="meeting"]'
    );
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Student ดูหน้า project eligibility ได้', async ({ page }) => {
    await page.goto('/project-eligibility');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    // ต้องเห็น eligibility content
    const content = page.locator(
      ':text("คุณสมบัติ"), :text("เกณฑ์"), :text("สิทธิ์"), :text("ผ่าน"), :text("ไม่ผ่าน")'
    );
    const hasContent = await content.first().isVisible({ timeout: 5000 }).catch(() => false);

    // ถ้าไม่มี content — ตรวจว่าไม่ error
    if (!hasContent) {
      const errorState = page.locator(':text("เกิดข้อผิดพลาด")');
      await expect(errorState).not.toBeVisible();
    }
  });

  test('Student ดูหน้า project requirements ได้', async ({ page }) => {
    await page.goto('/project-requirements');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();

    const content = page.locator(
      ':text("เงื่อนไข"), :text("ข้อกำหนด"), :text("requirement"), :text("หน่วยกิต")'
    );
    const hasContent = await content.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasContent) {
      const errorState = page.locator(':text("เกิดข้อผิดพลาด")');
      await expect(errorState).not.toBeVisible();
    }
  });
});
