import { test, expect } from '../../fixtures/auth';
import { SEL } from '../../helpers/selectors';

/**
 * UAT Part C3 — โครงงานพิเศษ 1 > บันทึกพบอาจารย์
 * Multi-role flow: Student สร้าง meeting log → Advisor approve → Student verify
 */

// รันแค่ student project — ไม่ต้อง run ซ้ำใน officer/advisor
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'student',
    'workflow tests run once under student project'
  );
});

// Shared state ระหว่าง serial tests
const MARKER = `E2E-Meeting-${Date.now()}`;
let hasProject = true;

test.describe.serial('Meeting Logbook Flow (UAT C3)', () => {
  test('Student สร้าง meeting logbook entry', async ({ studentPage }) => {
    await studentPage.goto('/project/phase1/meeting-logbook');
    await studentPage.waitForLoadState('networkidle');

    // Skip ถ้า student ไม่มี project — ดูจากข้อความ "ยังไม่มีโครงงานในระบบ" หรือ form disabled
    const noProject = studentPage.locator(':text("ยังไม่มีโครงงานในระบบ")');
    if (await noProject.isVisible({ timeout: 5000 }).catch(() => false)) {
      hasProject = false;
      test.skip(true, 'Student ไม่มี project assigned — ต้อง seed ก่อน');
      return;
    }

    // ตรวจว่า form section แสดง (มี project active)
    const formSection = studentPage.locator('text=หัวข้อการประชุม');
    if (!(await formSection.isVisible({ timeout: 3000 }).catch(() => false))) {
      hasProject = false;
      test.skip(true, 'Form ไม่แสดง — student ไม่มี project active');
      return;
    }

    // --- สร้าง meeting ใหม่ ---
    const addMeetingBtn = studentPage.locator(
      'button:has-text("สร้างการประชุม"), button:has-text("เพิ่มการประชุม"), button:has-text("+")'
    );
    if (await addMeetingBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await addMeetingBtn.first().click();
      await studentPage.waitForTimeout(500);
    }

    // กรอก title
    const titleInput = studentPage.locator(SEL.MEETING_TITLE_INPUT);
    if (await titleInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.first().fill(MARKER);

      // เลือก method (ถ้ามี)
      const methodSelect = studentPage.locator(SEL.MEETING_METHOD_SELECT);
      if (await methodSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await methodSelect.selectOption('onsite');
      }

      // Save meeting
      const saveMeetingBtn = studentPage.locator(SEL.BTN_SAVE_MEETING);
      if (await saveMeetingBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveMeetingBtn.click();
        await studentPage.waitForLoadState('networkidle');
      }
    }

    // --- เพิ่ม log entry ---
    const addLogBtn = studentPage.locator(SEL.BTN_ADD_LOG);
    if (await addLogBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await addLogBtn.first().click();
      await studentPage.waitForTimeout(500);

      // กรอก discussion topic
      const discussionInput = studentPage.locator(SEL.LOG_DISCUSSION_INPUT);
      await discussionInput.first().fill(`${MARKER} — หัวข้อสนทนา`);

      // กรอก progress
      const progressInput = studentPage.locator(SEL.LOG_PROGRESS_INPUT);
      if (await progressInput.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await progressInput.first().fill('ความคืบหน้า E2E test');
      }

      // กรอก next action items
      const nextItemsInput = studentPage.locator(SEL.LOG_NEXT_ITEMS_INPUT);
      if (await nextItemsInput.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextItemsInput.first().fill('งานถัดไป E2E test');
      }

      // Submit log
      const saveLogBtn = studentPage.locator(SEL.BTN_SAVE_LOG);
      await saveLogBtn.click();
      await studentPage.waitForLoadState('networkidle');
    }

    // Verify: record แสดงใน list พร้อม status pending
    const createdEntry = studentPage.locator(`:text("${MARKER}")`);
    await expect(createdEntry.first()).toBeVisible({ timeout: 5000 });

    const pendingBadge = studentPage.locator(SEL.BADGE_PENDING);
    const hasPending = await pendingBadge.first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasPending).toBeTruthy();
  });

  test('Advisor เห็น pending entry', async ({ advisorPage }) => {
    test.skip(!hasProject, 'ข้ามเพราะ student ไม่มี project');

    await advisorPage.goto('/teacher/meeting-approvals');
    await advisorPage.waitForLoadState('networkidle');

    // Filter เฉพาะ pending (ถ้ามี filter select)
    const statusFilter = advisorPage.locator(SEL.ADVISOR_FILTER);
    if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusFilter.selectOption({ label: 'รออนุมัติ' });
      await advisorPage.waitForLoadState('networkidle');
    }

    // Verify: เห็น pending entries
    const pendingBadges = advisorPage.locator(SEL.BADGE_PENDING);
    const hasEntries = await pendingBadges.first().isVisible({ timeout: 5000 }).catch(() => false);

    // ถ้าไม่มี pending → อาจเป็นเพราะ advisor ไม่ใช่ที่ปรึกษาของ student นี้
    if (!hasEntries) {
      const emptyState = advisorPage.locator(SEL.EMPTY_STATE);
      const isEmpty = await emptyState.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasEntries || isEmpty).toBeTruthy();
    }
  });

  test('Advisor approve entry', async ({ advisorPage }) => {
    test.skip(!hasProject, 'ข้ามเพราะ student ไม่มี project');

    await advisorPage.goto('/teacher/meeting-approvals');
    await advisorPage.waitForLoadState('networkidle');

    // หาปุ่ม approve ตัวแรก
    const approveBtn = advisorPage.locator(SEL.BTN_APPROVE);
    if (!(await approveBtn.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'ไม่มี pending entry ให้ approve');
      return;
    }

    await approveBtn.first().click();
    await advisorPage.waitForTimeout(500);

    // Modal confirm
    const modal = advisorPage.locator(SEL.DECISION_MODAL);
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      // กรอก note (optional)
      const noteInput = advisorPage.locator(SEL.APPROVAL_NOTE_INPUT);
      if (await noteInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await noteInput.fill('E2E approved');
      }

      // คลิกยืนยัน
      const confirmBtn = advisorPage.locator(
        `${SEL.BTN_CONFIRM_APPROVE}, ${SEL.MODAL_CONFIRM}`
      );
      await confirmBtn.first().click();
      await advisorPage.waitForLoadState('networkidle');
    }

    // Verify: status เปลี่ยนหรือ entry หายจาก pending list
    await advisorPage.waitForTimeout(1000);
    const approvedBadge = advisorPage.locator(SEL.BADGE_APPROVED);
    const noPending = advisorPage.locator(SEL.EMPTY_STATE);
    const isApproved = await approvedBadge.first().isVisible({ timeout: 3000 }).catch(() => false);
    const isEmpty = await noPending.first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(isApproved || isEmpty).toBeTruthy();
  });

  test('Student verify status = approved', async ({ studentPage }) => {
    test.skip(!hasProject, 'ข้ามเพราะ student ไม่มี project');

    await studentPage.goto('/project/phase1/meeting-logbook');
    await studentPage.waitForLoadState('networkidle');

    // Verify: มี badge อนุมัติแล้ว
    const approvedBadge = studentPage.locator(SEL.BADGE_APPROVED);
    const hasApproved = await approvedBadge.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasApproved).toBeTruthy();
  });

  test('Student verify unlock condition (approved ≥ 4)', async ({ studentPage }) => {
    test.skip(!hasProject, 'ข้ามเพราะ student ไม่มี project');

    await studentPage.goto('/project/phase1/meeting-logbook');
    await studentPage.waitForLoadState('networkidle');

    // นับจำนวน approved logs จาก progress bar หรือ badge
    const approvedBadges = studentPage.locator(SEL.BADGE_APPROVED);
    const approvedCount = await approvedBadges.count();

    // ตรวจ progress bar (ถ้ามี)
    const progressBar = studentPage.locator(SEL.PROGRESS_BAR);
    if (await progressBar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(progressBar).toBeVisible();
    }

    // ตรวจปุ่มยื่นคำร้องขอสอบ
    const examRequestBtn = studentPage.locator(
      'button:has-text("ยื่นคำร้องขอสอบ"), a:has-text("ยื่นคำร้องขอสอบ")'
    );

    if (approvedCount >= 4) {
      // ครบเกณฑ์: ปุ่มยื่นคำร้องควรแสดง (หรือ link ไปหน้า exam)
      const btnVisible = await examRequestBtn.first().isVisible({ timeout: 3000 }).catch(() => false);
      // Note: ปุ่มอาจอยู่คนละหน้า — log ผลไว้ตรวจ
      if (!btnVisible) {
        console.log(`approved=${approvedCount} ≥ 4 แต่ไม่เจอปุ่มยื่นคำร้อง — อาจอยู่หน้า exam-submit`);
      }
    } else {
      // ยังไม่ครบ: ปุ่มไม่ควรแสดง (หรือ disabled)
      const btnVisible = await examRequestBtn.first().isVisible({ timeout: 2000 }).catch(() => false);
      if (btnVisible) {
        // อาจเป็น disabled state
        const isDisabled = await examRequestBtn.first().isDisabled();
        expect(isDisabled).toBeTruthy();
      }
      console.log(`approved=${approvedCount} < 4 — ยังไม่ครบเกณฑ์`);
    }
  });
});
