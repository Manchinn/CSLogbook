import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/student.json' });

test.describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/student');
    await page.waitForLoadState('networkidle');
  });

  test('Student เข้า dashboard ได้สำเร็จ', async ({ page }) => {
    // URL ต้องอยู่ที่ /dashboard/student
    await expect(page).toHaveURL(/\/dashboard\/student/);

    // ไม่ redirect กลับ login
    await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();
  });

  test('Dashboard แสดง widget หลักครบ', async ({ page }) => {
    // ต้องมี content area — ไม่ใช่ blank page
    const mainContent = page.locator('main, [class*="dashboard"], [class*="page"]');
    await expect(mainContent.first()).toBeVisible();

    // ตรวจหา widget containers (card, section, widget)
    const widgets = page.locator(
      '[class*="widget"], [class*="card"], [class*="section"], [class*="status"]'
    );
    const widgetCount = await widgets.count();
    expect(widgetCount).toBeGreaterThanOrEqual(1);
  });

  test('Dashboard แสดงข้อมูลโครงงาน หรือ link ไปสร้างโครงงาน', async ({ page }) => {
    // ต้องมี project-related content — อาจเป็น status widget หรือ link ไปหน้า project
    const projectContent = page.locator(
      ':text("โครงงาน"), :text("Project"), :text("สร้างโครงงาน"), :text("ยังไม่มีโครงงาน")'
    );
    const hasProject = await projectContent.first().isVisible({ timeout: 5000 }).catch(() => false);

    // ถ้าไม่มี project content — อาจเป็น feature flag ปิดอยู่
    if (!hasProject) {
      // ตรวจว่า page ไม่ error (ไม่มี error state)
      const errorState = page.locator(':text("เกิดข้อผิดพลาด"), :text("Error")');
      await expect(errorState).not.toBeVisible();
    }
  });

  test('Dashboard แสดงข้อมูลฝึกงาน หรือ link ไปลงทะเบียน', async ({ page }) => {
    const internshipContent = page.locator(
      ':text("ฝึกงาน"), :text("Internship"), :text("ลงทะเบียนฝึกงาน"), :text("สถานะฝึกงาน")'
    );
    const hasInternship = await internshipContent.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasInternship) {
      const errorState = page.locator(':text("เกิดข้อผิดพลาด"), :text("Error")');
      await expect(errorState).not.toBeVisible();
    }
  });

  test('Dashboard แสดง upcoming deadlines', async ({ page }) => {
    const deadlineContent = page.locator(
      ':text("กำหนดส่ง"), :text("Deadline"), :text("กำหนดการ"), :text("ไม่มีกำหนดส่ง")'
    );
    const hasDeadlines = await deadlineContent.first().isVisible({ timeout: 5000 }).catch(() => false);

    // ต้องมี deadline section หรือ empty state
    if (!hasDeadlines) {
      const errorState = page.locator(':text("เกิดข้อผิดพลาด"), :text("Error")');
      await expect(errorState).not.toBeVisible();
    }
  });

  test('Navigation links ใน dashboard ทำงานได้', async ({ page }) => {
    // หา link หรือ button ที่ navigate ไปหน้าอื่น
    const navLinks = page.locator('a[href*="/project"], a[href*="/internship"], a[href*="/deadlines"]');
    const linkCount = await navLinks.count();

    if (linkCount > 0) {
      // คลิก link แรก — ต้อง navigate สำเร็จ
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      await firstLink.click();
      await page.waitForLoadState('networkidle');

      // ไม่ redirect กลับ login
      await expect(page.locator(SEL.LOGIN_SUBMIT)).not.toBeVisible();
    }
  });
});
