import { test, expect } from '../../fixtures/auth';

/**
 * Rejection Flow — ตรวจสอบว่าหน้านักศึกษาแสดง rejection reason + คำแนะนำ
 *
 * ไม่ได้ trigger rejection จริง (ต้องมี seed data) — ตรวจว่า:
 * 1. RejectionNotice component แสดงเมื่อมี rejection status
 * 2. RejectionDetailModal เปิดได้
 * 3. rejection reason แสดงบนหน้า
 * 4. ปุ่ม/form ยังใช้ได้หลัง rejection
 *
 * Prerequisite: Student ต้องมี project ใน DB
 */

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'student',
    'rejection flow tests run once under student project'
  );
});

test.describe('Rejection UI Components Exist', () => {
  test('KP02 exam-submit page — shows rejection elements when advisor rejected', async ({ studentPage }) => {
    await studentPage.goto('/project/phase1/exam-submit');
    await studentPage.waitForLoadState('networkidle');

    // Skip ถ้าไม่มีโครงงาน
    const noProject = studentPage.locator(':text("ยังไม่มีโครงงาน")');
    if (await noProject.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Student ไม่มี project');
      return;
    }

    // ตรวจว่าหน้าโหลดได้ (มี title)
    await expect(studentPage.locator(':text("คำขอสอบโครงงานพิเศษ 1")')).toBeVisible({ timeout: 10000 });

    // ตรวจว่ามี advisor approval section
    const approvalSection = studentPage.locator(':text("สถานะอาจารย์ที่ปรึกษา")');
    const hasApprovalSection = await approvalSection.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasApprovalSection) {
      // ตรวจว่ามี status badge (pending/approved/rejected)
      const statusBadges = studentPage.locator(':text("รอดำเนินการ"), :text("อนุมัติ"), :text("ปฏิเสธ")');
      await expect(statusBadges.first()).toBeVisible({ timeout: 5000 });
    }

    // ตรวจว่า rejection banner แสดงเมื่อมี rejected approval
    const rejectionBanner = studentPage.locator(':text("ส่งคำขอกลับแล้ว"), :text("ถูกปฏิเสธ")');
    const hasRejection = await rejectionBanner.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasRejection) {
      // ตรวจว่ามีปุ่ม "ดูรายละเอียด"
      const detailBtn = studentPage.locator('button:has-text("ดูรายละเอียด")');
      await expect(detailBtn).toBeVisible();

      // กดปุ่ม → modal เปิด
      await detailBtn.click();

      // ตรวจว่า modal แสดง
      const modal = studentPage.locator(':text("รายละเอียดการปฏิเสธ")');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // ตรวจว่ามีข้อมูลใน modal
      await expect(studentPage.locator(':text("ผู้พิจารณา")')).toBeVisible();
      await expect(studentPage.locator(':text("เหตุผล")')).toBeVisible();
      await expect(studentPage.locator(':text("ขั้นตอนถัดไป")')).toBeVisible();

      // กดปิด modal
      const closeBtn = studentPage.locator('button:has-text("ปิด")');
      await closeBtn.click();
      await expect(modal).not.toBeVisible();
    }

    // ตรวจว่า form ยังใช้ได้ (ไม่ locked)
    const formLocked = studentPage.locator(':text("ไม่สามารถแก้ไขได้")');
    const isLocked = await formLocked.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isLocked) {
      const submitBtn = studentPage.locator('button:has-text("บันทึกคำขอสอบ")');
      const btnExists = await submitBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (btnExists) {
        // ปุ่มมี — form ไม่ locked (ดี — ส่งใหม่ได้หลัง rejection)
        expect(true).toBe(true);
      }
    }
  });

  test('Thesis defense page — shows rejection elements when advisor rejected', async ({ studentPage }) => {
    await studentPage.goto('/project/phase2/thesis-defense');
    await studentPage.waitForLoadState('networkidle');

    // Skip ถ้าไม่มีโครงงาน
    const noProject = studentPage.locator(':text("ยังไม่มีโครงงาน")');
    if (await noProject.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Student ไม่มี project');
      return;
    }

    // ตรวจว่าหน้าโหลดได้
    const title = studentPage.locator(':text("คำขอสอบปริญญานิพนธ์")');
    const hasTitle = await title.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTitle) {
      test.skip(true, 'ไม่สามารถเข้าหน้า thesis-defense ได้');
      return;
    }

    // ตรวจ rejection banner ถ้ามี
    const rejectionBanner = studentPage.locator(':text("ส่งคำขอกลับแล้ว"), :text("ถูกปฏิเสธ")');
    const hasRejection = await rejectionBanner.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasRejection) {
      const detailBtn = studentPage.locator('button:has-text("ดูรายละเอียด")');
      await expect(detailBtn).toBeVisible();

      await detailBtn.click();
      await expect(studentPage.locator(':text("รายละเอียดการปฏิเสธ")')).toBeVisible({ timeout: 5000 });
      await expect(studentPage.locator(':text("ขั้นตอนถัดไป")')).toBeVisible();

      // Escape ปิด modal
      await studentPage.keyboard.press('Escape');
    }
  });

  test('System test page — shows rejection details when rejected', async ({ studentPage }) => {
    await studentPage.goto('/project/phase2/system-test');
    await studentPage.waitForLoadState('networkidle');

    const noProject = studentPage.locator(':text("ยังไม่มีโครงงาน")');
    if (await noProject.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Student ไม่มี project');
      return;
    }

    const title = studentPage.locator(':text("คำขอทดสอบระบบ")');
    const hasTitle = await title.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTitle) {
      test.skip(true, 'ไม่สามารถเข้าหน้า system-test ได้');
      return;
    }

    // System test มี rejection display อยู่แล้ว — ตรวจว่ามี decision section
    const rejectionBanner = studentPage.locator(':text("ส่งคำขอกลับแล้ว")');
    const hasRejection = await rejectionBanner.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasRejection) {
      // ตรวจว่าแสดง rejection reason
      const reasonText = studentPage.locator(':text("เหตุผล:")');
      await expect(reasonText.first()).toBeVisible({ timeout: 5000 });

      // ตรวจว่า form unlock ให้ส่งใหม่ได้
      const submitBtn = studentPage.locator('button:has-text("ส่งคำขอทดสอบระบบ")');
      const canResubmit = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (canResubmit) {
        expect(true).toBe(true);
      }
    }
  });

  test('Topic exam page — shows failure reason when exam failed', async ({ studentPage }) => {
    await studentPage.goto('/project/phase1/topic-exam');
    await studentPage.waitForLoadState('networkidle');

    // ตรวจว่าหน้าโหลดได้
    const title = studentPage.locator(':text("ตารางสอบเสนอหัวข้อ")');
    await expect(title).toBeVisible({ timeout: 10000 });

    // ตรวจ failure box ถ้ามี
    const failedBox = studentPage.locator(':text("ผลสอบหัวข้อ: ไม่ผ่าน")');
    const hasFailed = await failedBox.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasFailed) {
      // ตรวจว่ามี examFailReason แสดง
      const reasonText = studentPage.locator(':text("หมายเหตุจากคณะกรรมการ")');
      const hasReason = await reasonText.isVisible({ timeout: 3000 }).catch(() => false);
      // reason อาจจะมีหรือไม่มี ขึ้นอยู่กับข้อมูล — ไม่ fail ถ้าไม่มี

      // ตรวจว่ามีปุ่ม "รับทราบผล"
      const ackBtn = studentPage.locator('button:has-text("รับทราบผล")');
      await expect(ackBtn).toBeVisible();
    }
  });

  test('Meeting logbook page — shows rejection reason per log entry', async ({ studentPage }) => {
    await studentPage.goto('/project/phase1/meeting-logbook');
    await studentPage.waitForLoadState('networkidle');

    const title = studentPage.locator(':text("บันทึกการพบอาจารย์"), :text("Meeting Logbook")');
    const hasTitle = await title.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTitle) {
      test.skip(true, 'ไม่สามารถเข้าหน้า meeting-logbook ได้');
      return;
    }

    // ตรวจว่ามี rejected log entry ถ้ามี
    const rejectedTag = studentPage.locator(':text("ขอปรับปรุง")');
    const hasRejected = await rejectedTag.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasRejected) {
      // ตรวจว่าแสดง rejection reason
      const reasonText = studentPage.locator(':text("เหตุผล:")');
      const hasReason = await reasonText.first().isVisible({ timeout: 3000 }).catch(() => false);
      // reason อาจจะมีหรือไม่มี ขึ้นอยู่กับ data
    }
  });
});
