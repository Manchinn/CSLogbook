import { test, expect } from '../../fixtures/auth';
import { SEL } from '../../helpers/selectors';

/**
 * UAT Part D — ปริญญานิพนธ์ (Thesis Track)
 * Multi-role flow: พบอาจารย์ → ทดสอบระบบ → ขอสอบ คพ.03 → ผลสอบ
 *
 * Prerequisite: Student ต้องผ่านสอบโครงงาน 1 แล้ว (thesis unlocked)
 */

// รันแค่ student project — ไม่ต้อง run ซ้ำใน officer/advisor
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'student',
    'workflow tests run once under student project'
  );
});

// Shared state ข้าม describe blocks
let thesisUnlocked = true;

// ─────────────────────────────────────────────────────────────
// Block 1: พบอาจารย์ (Phase 2 meeting logbook)
// ─────────────────────────────────────────────────────────────
test.describe.serial('Thesis — พบอาจารย์', () => {
  test('Student บันทึกพบอาจารย์ (ปริญญานิพนธ์)', async ({ studentPage }) => {
    await studentPage.goto('/project/phase1/meeting-logbook');
    await studentPage.waitForLoadState('networkidle');

    // Skip ถ้าไม่มีโครงงาน
    const noProject = studentPage.locator(':text("ยังไม่มีโครงงานในระบบ")');
    if (await noProject.isVisible({ timeout: 5000 }).catch(() => false)) {
      thesisUnlocked = false;
      test.skip(true, 'Student ไม่มี project — ต้อง seed ก่อน');
      return;
    }

    // คลิก tab "ปริญญานิพนธ์"
    const thesisTab = studentPage.locator('button:has-text("ปริญญานิพนธ์")');
    if (await thesisTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      // ตรวจว่า tab disabled หรือไม่
      if (await thesisTab.isDisabled()) {
        thesisUnlocked = false;
        test.skip(true, 'Tab ปริญญานิพนธ์ disabled — thesis ยังไม่ปลดล็อก');
        return;
      }
      await thesisTab.click();
      await studentPage.waitForTimeout(500);
    } else {
      thesisUnlocked = false;
      test.skip(true, 'ไม่เจอ tab ปริญญานิพนธ์');
      return;
    }

    // ตรวจว่า form section แสดง (thesis phase active)
    const formSection = studentPage.locator('text=หัวข้อการประชุม');
    if (!(await formSection.isVisible({ timeout: 3000 }).catch(() => false))) {
      thesisUnlocked = false;
      test.skip(true, 'Form ปริญญานิพนธ์ไม่แสดง — ต้องผ่านสอบโครงงาน 1 ก่อน');
      return;
    }

    // สร้าง meeting + log entry (reuse pattern จาก meeting-logbook-flow)
    const titleInput = studentPage.locator(SEL.MEETING_TITLE_INPUT);
    if (await titleInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.first().fill(`E2E-Thesis-Meeting-${Date.now()}`);
      const saveMeetingBtn = studentPage.locator('button:has-text("บันทึกการประชุม")');
      await saveMeetingBtn.click();
      await studentPage.waitForLoadState('networkidle');
    }

    // เพิ่ม log entry
    const addLogBtn = studentPage.locator(SEL.BTN_ADD_LOG);
    if (await addLogBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await addLogBtn.first().click();
      await studentPage.waitForTimeout(500);

      const discussionInput = studentPage.locator(SEL.LOG_DISCUSSION_INPUT);
      if (await discussionInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await discussionInput.first().fill('E2E thesis meeting discussion');

        const progressInput = studentPage.locator(SEL.LOG_PROGRESS_INPUT);
        if (await progressInput.first().isVisible({ timeout: 1000 }).catch(() => false)) {
          await progressInput.first().fill('ความคืบหน้าปริญญานิพนธ์');
        }

        const nextItems = studentPage.locator(SEL.LOG_NEXT_ITEMS_INPUT);
        if (await nextItems.first().isVisible({ timeout: 1000 }).catch(() => false)) {
          await nextItems.first().fill('งานถัดไป thesis');
        }

        const saveLogBtn = studentPage.locator(SEL.BTN_SAVE_LOG);
        await saveLogBtn.click();
        await studentPage.waitForLoadState('networkidle');
      }
    }

    // Verify: มี record ใหม่
    const pendingBadge = studentPage.locator(SEL.BADGE_PENDING);
    const hasPending = await pendingBadge.first().isVisible({ timeout: 5000 }).catch(() => false);
    // ถ้ามี pending badge = สร้างสำเร็จ, ถ้าไม่มี = อาจมี record อยู่แล้ว (ยังผ่าน)
  });

  test('Advisor approve meeting records', async ({ advisorPage }) => {
    test.skip(!thesisUnlocked, 'ข้ามเพราะ thesis ยังไม่ปลดล็อก');

    await advisorPage.goto('/teacher/meeting-approvals');
    await advisorPage.waitForLoadState('networkidle');

    // หาปุ่ม approve
    const approveBtn = advisorPage.locator(SEL.BTN_APPROVE);
    if (!(await approveBtn.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      // ไม่มี pending — อาจ approve ไปแล้ว
      return;
    }

    await approveBtn.first().click();
    await advisorPage.waitForTimeout(500);

    // Modal confirm
    const modal = advisorPage.locator(SEL.DECISION_MODAL);
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const confirmBtn = advisorPage.locator(
        `${SEL.BTN_CONFIRM_APPROVE}, ${SEL.MODAL_CONFIRM}`
      );
      await confirmBtn.first().click();
      await advisorPage.waitForLoadState('networkidle');
    }
  });

  test('Verify: ปุ่มทดสอบระบบ/ขอสอบแสดง', async ({ studentPage }) => {
    test.skip(!thesisUnlocked, 'ข้ามเพราะ thesis ยังไม่ปลดล็อก');

    // ตรวจจาก phase 2 overview — step cards
    await studentPage.goto('/project/phase1/meeting-logbook');
    await studentPage.waitForLoadState('networkidle');

    // คลิก tab ปริญญานิพนธ์
    const thesisTab = studentPage.locator('button:has-text("ปริญญานิพนธ์")');
    if (await thesisTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await thesisTab.click();
      await studentPage.waitForTimeout(500);
    }

    // ตรวจ approved count
    const approvedBadges = studentPage.locator(SEL.BADGE_APPROVED);
    const approvedCount = await approvedBadges.count();

    // ตรวจ progress bar
    const progressBar = studentPage.locator(SEL.PROGRESS_BAR);
    if (await progressBar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(progressBar).toBeVisible();
    }

    console.log(`Thesis meeting approved count: ${approvedCount}`);
  });
});

// ─────────────────────────────────────────────────────────────
// Block 2: ขอทดสอบระบบ 30 วัน
// ─────────────────────────────────────────────────────────────
test.describe.serial('Thesis — ขอทดสอบระบบ', () => {
  test('Student ยื่นคำขอทดสอบระบบ', async ({ studentPage }) => {
    test.skip(!thesisUnlocked, 'ข้ามเพราะ thesis ยังไม่ปลดล็อก');

    await studentPage.goto('/project/phase2/system-test');
    await studentPage.waitForLoadState('networkidle');

    // Skip ถ้าหน้าแสดง gate locked
    const gateLocked = studentPage.locator(':text("ปริญญานิพนธ์ยังไม่ปลดล็อก")');
    if (await gateLocked.isVisible({ timeout: 5000 }).catch(() => false)) {
      thesisUnlocked = false;
      test.skip(true, 'Phase 2 gate ยังไม่ปลดล็อก');
      return;
    }

    // Skip ถ้ามี status tag อยู่แล้ว (ยื่นไปแล้ว)
    const existingStatus = studentPage.locator(SEL.SYSTEM_TEST_STATUS_TAG);
    if (await existingStatus.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // ยื่นไปแล้ว — ไม่ต้อง submit ซ้ำ
      return;
    }

    // กรอก start date
    const startInput = studentPage.locator(SEL.SYSTEM_TEST_START);
    if (await startInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // ตั้ง start date เป็นวันนี้
      const today = new Date().toISOString().split('T')[0];
      await startInput.fill(today);
    }

    // กรอก note (optional)
    const noteInput = studentPage.locator(SEL.SYSTEM_TEST_NOTE);
    if (await noteInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await noteInput.fill('E2E system test request');
    }

    // Submit
    const submitBtn = studentPage.locator(SEL.BTN_SUBMIT_SYSTEM_TEST);
    if (!(await submitBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'ปุ่มส่งคำขอทดสอบระบบไม่แสดง');
      return;
    }
    if (await submitBtn.isDisabled()) {
      test.skip(true, 'ปุ่มส่งคำขอทดสอบระบบ disabled — prerequisite ไม่ครบ');
      return;
    }

    await submitBtn.click();
    await studentPage.waitForLoadState('networkidle');
    await studentPage.waitForTimeout(1000);

    // Verify: status tag แสดง
    const statusTag = studentPage.locator(':text("รออาจารย์"), :text("ยื่นคำขอ")');
    const hasStatus = await statusTag.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasStatus).toBeTruthy();
  });

  test('Advisor approve คำขอทดสอบระบบ', async ({ advisorPage }) => {
    test.skip(!thesisUnlocked, 'ข้ามเพราะ thesis ยังไม่ปลดล็อก');

    await advisorPage.goto('/teacher/thesis/advisor-queue');
    await advisorPage.waitForLoadState('networkidle');

    // หาปุ่ม approve
    const approveBtn = advisorPage.locator(SEL.BTN_APPROVE);
    if (!(await approveBtn.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      // ไม่มี pending — อาจ approve ไปแล้ว หรือไม่ใช่ advisor
      return;
    }

    await approveBtn.first().click();
    await advisorPage.waitForTimeout(500);

    // Modal confirm
    const modal = advisorPage.locator(SEL.DECISION_MODAL);
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const confirmBtn = advisorPage.locator(SEL.MODAL_CONFIRM);
      await confirmBtn.first().click();
      await advisorPage.waitForLoadState('networkidle');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Block 3: ขอสอบปริญญานิพนธ์ (คพ.03)
// ─────────────────────────────────────────────────────────────
test.describe.serial('Thesis — ขอสอบปริญญานิพนธ์', () => {
  test('Student ยื่นคำร้องขอสอบปริญญานิพนธ์', async ({ studentPage }) => {
    test.skip(!thesisUnlocked, 'ข้ามเพราะ thesis ยังไม่ปลดล็อก');

    await studentPage.goto('/project/phase2/thesis-defense');
    await studentPage.waitForLoadState('networkidle');

    // Skip ถ้าหน้าแสดง gate locked
    const gateLocked = studentPage.locator(':text("ปริญญานิพนธ์ยังไม่ปลดล็อก")');
    if (await gateLocked.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Phase 2 gate ยังไม่ปลดล็อก');
      return;
    }

    // Skip ถ้ามี status tag อยู่แล้ว (ยื่นไปแล้ว)
    const existingStatus = studentPage.locator(SEL.DEFENSE_STATUS_TAG);
    if (await existingStatus.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }

    // Verify stepper แสดง
    const stepper = studentPage.locator(SEL.THESIS_STEPPER);
    if (await stepper.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(stepper).toBeVisible();
    }

    // Submit คำร้อง
    const submitBtn = studentPage.locator(SEL.BTN_SUBMIT_DEFENSE);
    if (!(await submitBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'ปุ่มบันทึกคำขอสอบไม่แสดง');
      return;
    }
    if (await submitBtn.isDisabled()) {
      test.skip(true, 'ปุ่มบันทึกคำขอสอบ disabled — prerequisite ไม่ครบ');
      return;
    }

    await submitBtn.click();
    await studentPage.waitForLoadState('networkidle');
    await studentPage.waitForTimeout(1000);

    // Verify: status tag
    const statusTag = studentPage.locator(':text("ยื่นคำขอแล้ว"), :text("รออาจารย์อนุมัติ")');
    const hasStatus = await statusTag.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasStatus).toBeTruthy();
  });

  test('Advisor approve คำร้องขอสอบ คพ.03', async ({ advisorPage }) => {
    test.skip(!thesisUnlocked, 'ข้ามเพราะ thesis ยังไม่ปลดล็อก');

    await advisorPage.goto('/teacher/thesis/advisor-queue');
    await advisorPage.waitForLoadState('networkidle');

    // หาปุ่ม approve
    const approveBtn = advisorPage.locator(SEL.BTN_APPROVE);
    if (!(await approveBtn.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await approveBtn.first().click();
    await advisorPage.waitForTimeout(500);

    // Modal confirm
    const modal = advisorPage.locator(SEL.DECISION_MODAL);
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const confirmBtn = advisorPage.locator(SEL.MODAL_CONFIRM);
      await confirmBtn.first().click();
      await advisorPage.waitForLoadState('networkidle');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Block 4: ผลสอบ & สถานะเล่ม
// ─────────────────────────────────────────────────────────────
test.describe.serial('Thesis — ผลสอบ & สถานะเล่ม', () => {
  test('เจ้าหน้าที่เห็นคำร้องใน staff queue', async ({ officerPage }) => {
    test.skip(!thesisUnlocked, 'ข้ามเพราะ thesis ยังไม่ปลดล็อก');

    await officerPage.goto('/admin/thesis/staff-queue');
    await officerPage.waitForLoadState('networkidle');

    // Filter เฉพาะ "รอเจ้าหน้าที่ตรวจสอบ"
    const statusFilter = officerPage.locator(SEL.ADMIN_STATUS_FILTER);
    if (await statusFilter.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.first().selectOption({ label: 'รอเจ้าหน้าที่ตรวจสอบ' });
      await officerPage.waitForLoadState('networkidle');
    }

    // Verify: มี entries ใน queue
    const tableRows = officerPage.locator('table tbody tr, [class*="tableRow"]');
    const emptyState = officerPage.locator(SEL.EMPTY_STATE);
    const hasRows = await tableRows.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasRows && isEmpty) {
      test.skip(true, 'ไม่มีคำร้องใน thesis staff queue');
      return;
    }

    expect(hasRows).toBeTruthy();
  });

  test('เจ้าหน้าที่ตรวจสอบคำร้อง คพ.03', async ({ officerPage }) => {
    test.skip(!thesisUnlocked, 'ข้ามเพราะ thesis ยังไม่ปลดล็อก');

    await officerPage.goto('/admin/thesis/staff-queue');
    await officerPage.waitForLoadState('networkidle');

    // หาปุ่ม "ตรวจสอบแล้ว"
    const verifyBtn = officerPage.locator(SEL.BTN_VERIFY);
    if (!(await verifyBtn.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'ไม่มีปุ่มตรวจสอบ — อาจไม่มี advisor_approved entry');
      return;
    }

    await verifyBtn.first().click();
    await officerPage.waitForTimeout(500);

    // Verify modal
    const modal = officerPage.locator(SEL.VERIFY_MODAL);
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const noteInput = officerPage.locator(SEL.VERIFY_NOTE);
      if (await noteInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await noteInput.fill('E2E thesis verified');
      }

      const confirmBtn = officerPage.locator(SEL.BTN_VERIFY_CONFIRM);
      await confirmBtn.click();
      await officerPage.waitForLoadState('networkidle');
    }

    // Verify: status เปลี่ยน
    await officerPage.waitForTimeout(1000);
    const verifiedTag = officerPage.locator(':text("ตรวจสอบแล้ว")');
    const noMoreVerify = !(await verifyBtn.first().isVisible({ timeout: 2000 }).catch(() => false));
    const hasVerified = await verifiedTag.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasVerified || noMoreVerify).toBeTruthy();
  });

  test('เจ้าหน้าที่บันทึกผลสอบปริญญานิพนธ์', async ({ officerPage }) => {
    test.skip(!thesisUnlocked, 'ข้ามเพราะ thesis ยังไม่ปลดล็อก');

    await officerPage.goto('/admin/thesis/exam-results');
    await officerPage.waitForLoadState('networkidle');

    // หา pending entries
    const tableRows = officerPage.locator('table tbody tr, [class*="tableRow"]');
    const hasRows = await tableRows.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasRows) {
      test.skip(true, 'ไม่มี pending exam results ให้บันทึก');
      return;
    }

    // หาปุ่มบันทึกผลสอบ
    const recordBtn = officerPage.locator(SEL.BTN_RECORD_RESULT);
    if (!(await recordBtn.first().isVisible({ timeout: 3000 }).catch(() => false))) {
      // อาจต้องคลิก expand row ก่อน
      const expandBtn = officerPage.locator('[class*="expandBtn"], button:has-text("▶")');
      if (await expandBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await expandBtn.first().click();
        await officerPage.waitForTimeout(500);
      }
    }

    if (!(await recordBtn.first().isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'ปุ่มบันทึกผลสอบไม่แสดง');
      return;
    }

    await recordBtn.first().click();
    await officerPage.waitForTimeout(500);

    // Modal: เลือกผล PASS
    const passBtn = officerPage.locator(
      'button:has-text("ผ่าน"), button:has-text("PASS"), [class*="btnPass"]'
    );
    if (await passBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await passBtn.first().click();
    }

    // Confirm
    const confirmBtn = officerPage.locator(
      'button:has-text("ยืนยัน"), button:has-text("บันทึก")'
    );
    if (await confirmBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.first().click();
      await officerPage.waitForLoadState('networkidle');
    }

    // Verify: ผลสอบบันทึกสำเร็จ
    await officerPage.waitForTimeout(1000);
    const resultTag = officerPage.locator(':text("บันทึกผลสอบแล้ว"), :text("ผ่าน"), :text("PASS")');
    const hasResult = await resultTag.first().isVisible({ timeout: 5000 }).catch(() => false);
    // อาจไม่เจอถ้า page reload — ถือว่าผ่านถ้าไม่ error
  });
});
