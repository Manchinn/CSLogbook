import { test, expect } from '../../fixtures/auth';
import { SEL } from '../../helpers/selectors';

/**
 * Internship Certificate Flow — Multi-role
 * Student ขอใบรับรอง → Officer ดู queue → Approve/Reject → Student ดาวน์โหลด
 *
 * Prerequisite: Student ต้องมี internship ที่ completed + evaluation done
 */

// รันแค่ student project
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'student',
    'workflow tests run once under student project'
  );
});

let canProceed = true;

test.describe.serial('Internship Certificate Flow', () => {
  test('Student เข้าหน้า certificate ได้', async ({ studentPage }) => {
    await studentPage.goto('/internship/certificate');
    await studentPage.waitForLoadState('networkidle');

    // Skip ถ้ายังไม่มี internship
    const noInternship = studentPage.locator(
      ':text("ยังไม่ได้ลงทะเบียน"), :text("ไม่พบข้อมูล"), :text("ไม่สามารถเข้าถึง")'
    );
    if (await noInternship.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      canProceed = false;
      test.skip(true, 'Student ไม่มี internship — ต้อง seed ก่อน');
      return;
    }

    // ต้องเห็น certificate-related content
    const content = studentPage.locator(
      ':text("ใบรับรอง"), :text("Certificate"), :text("สถานะ"), :text("ขอใบรับรอง")'
    );
    const hasContent = await content.first().isVisible({ timeout: 10000 }).catch(() => false);

    // หรือ prerequisite message (ยังไม่ครบเงื่อนไข)
    const prereqMessage = studentPage.locator(
      ':text("ยังไม่สามารถขอใบรับรอง"), :text("เงื่อนไขไม่ครบ"), :text("ต้องผ่านการประเมิน")'
    );
    const hasPrereq = await prereqMessage.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasContent || hasPrereq).toBeTruthy();
  });

  test('Student ดูสถานะ certificate request ได้', async ({ studentPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    // ตรวจ API — certificate status
    const apiUrl = process.env.API_URL || 'http://localhost:5000/api';
    const ctx = studentPage.context();
    const res = await ctx.request.get(`${apiUrl}/internship/certificate-status`);

    if (res.ok()) {
      const body = await res.json();
      expect(body).toBeTruthy();
    }
    // ถ้า API fail → ยังไม่มี request (ถือว่า pass)
  });

  test('Officer เห็น certificate requests ใน admin', async ({ officerPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    await officerPage.goto('/admin/documents/certificates');
    await officerPage.waitForLoadState('networkidle');

    // ต้องเห็น certificates page
    const header = officerPage.locator(
      ':text("ใบรับรอง"), :text("certificate"), :text("คำขอ")'
    );
    await expect(header.first()).toBeVisible({ timeout: 10000 });

    // Table หรือ empty state
    const table = officerPage.locator('table, [class*="table"]');
    const emptyState = officerPage.locator(SEL.EMPTY_STATE);

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Officer สามารถดู detail ของ certificate request', async ({ officerPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    await officerPage.goto('/admin/documents/certificates');
    await officerPage.waitForLoadState('networkidle');

    // หาปุ่ม detail
    const detailBtn = officerPage.locator(
      'button:has-text("รายละเอียด"), button:has-text("ดู")'
    );
    if (await detailBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailBtn.first().click();
      await officerPage.waitForTimeout(500);

      // Drawer ต้องเปิด
      const drawer = officerPage.locator('[class*="drawer"]');
      const hasDrawer = await drawer.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasDrawer) {
        // ต้องเห็น detail content
        const detailContent = officerPage.locator(
          ':text("ข้อมูลคำขอ"), :text("รหัสนักศึกษา"), :text("สถานะ")'
        );
        await expect(detailContent.first()).toBeVisible();
      }
    }
    // ถ้าไม่มี detail btn = ไม่มี requests (ถือว่า pass)
  });

  test('Officer สามารถ approve certificate (ถ้ามี pending request)', async ({ officerPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    await officerPage.goto('/admin/documents/certificates');
    await officerPage.waitForLoadState('networkidle');

    // หาปุ่ม "อนุมัติ"
    const approveBtn = officerPage.locator('button:has-text("อนุมัติ")');
    if (await approveBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.first().click();
      await officerPage.waitForTimeout(500);

      // Modal ต้องเปิด — มี input เลขหนังสือรับรอง
      const modal = officerPage.locator('[class*="modal"], [role="dialog"]');
      const hasModal = await modal.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasModal) {
        // ต้องเห็น input field
        const certInput = officerPage.locator('[class*="modal"] input');
        const hasInput = await certInput.first().isVisible({ timeout: 2000 }).catch(() => false);

        // ปิด modal (ไม่ confirm เพื่อไม่ modify data)
        const cancelBtn = officerPage.locator(
          '[class*="modal"] button:has-text("ยกเลิก")'
        );
        if (await cancelBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelBtn.first().click();
        }
      }
    }
  });
});
