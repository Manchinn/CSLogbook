import { test, expect } from '../../fixtures/auth';
import { SEL } from '../../helpers/selectors';

/**
 * Topic Exam Flow — Multi-role workflow
 * Student ส่งหัวข้อ → Teacher ดูใน overview → Officer บันทึกผลสอบ
 *
 * Prerequisite: Student ต้องมี project ที่ active + topic submitted
 */

// รันแค่ student project
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'student',
    'workflow tests run once under student project'
  );
});

let canProceed = true;

test.describe.serial('Topic Exam Flow', () => {
  test('Student เข้าหน้า topic-submit ได้', async ({ studentPage }) => {
    await studentPage.goto('/project/phase1/topic-submit');
    await studentPage.waitForLoadState('networkidle');

    // Skip ถ้าไม่มีโครงงาน
    const noProject = studentPage.locator(':text("ยังไม่มีโครงงาน"), :text("ไม่พบโครงงาน")');
    if (await noProject.isVisible({ timeout: 5000 }).catch(() => false)) {
      canProceed = false;
      test.skip(true, 'Student ไม่มี project — ต้อง seed ก่อน');
      return;
    }

    // ต้องเห็น topic submission content
    const content = studentPage.locator(
      ':text("หัวข้อ"), :text("เสนอหัวข้อ"), :text("Topic"), [class*="form"], [class*="topic"]'
    );
    const hasContent = await content.first().isVisible({ timeout: 5000 }).catch(() => false);

    // อาจ submit ไปแล้ว — เช็ค status
    const submitted = studentPage.locator(
      ':text("ส่งหัวข้อแล้ว"), :text("รอสอบ"), :text("ผ่านแล้ว"), :text("ไม่ผ่าน")'
    );
    const alreadySubmitted = await submitted.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasContent || alreadySubmitted).toBeTruthy();
  });

  test('Student เข้าหน้า topic-exam ดูสถานะสอบได้', async ({ studentPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    await studentPage.goto('/project/phase1/topic-exam');
    await studentPage.waitForLoadState('networkidle');

    // ต้องเห็น exam-related content
    const content = studentPage.locator(
      ':text("สอบหัวข้อ"), :text("ผลสอบ"), :text("Topic Exam"), :text("ยังไม่ได้กำหนด"), :text("กำหนดสอบ")'
    );
    const hasContent = await content.first().isVisible({ timeout: 5000 }).catch(() => false);

    const noAccess = studentPage.locator(
      ':text("ไม่สามารถเข้าถึง"), :text("ยังไม่ถึงขั้นตอน")'
    );
    const noAccessVisible = await noAccess.first().isVisible({ timeout: 3000 }).catch(() => false);

    // ต้องเห็น content หรือ message ว่ายังไม่ถึงขั้นตอน
    expect(hasContent || noAccessVisible).toBeTruthy();
  });

  test('Teacher เห็น Topic Exam Overview', async ({ advisorPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    await advisorPage.goto('/teacher/topic-exam/overview');
    await advisorPage.waitForLoadState('networkidle');

    // ต้องเห็น overview page
    const content = advisorPage.locator(
      ':text("สอบหัวข้อ"), :text("Topic Exam"), :text("ภาพรวม"), table, [class*="overview"]'
    );
    const hasContent = await content.first().isVisible({ timeout: 5000 }).catch(() => false);

    // หรือ empty state (ไม่มี student ที่พร้อมสอบ)
    const emptyState = advisorPage.locator(SEL.EMPTY_STATE);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasContent || isEmpty).toBeTruthy();
  });

  test('Officer เข้าหน้า Topic Exam Results ได้', async ({ officerPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    await officerPage.goto('/admin/topic-exam/results');
    await officerPage.waitForLoadState('networkidle');

    // ต้องเห็น header
    const header = officerPage.locator(':text("บันทึกผลสอบหัวข้อโครงงานพิเศษ")');
    await expect(header).toBeVisible({ timeout: 10000 });

    // ต้องเห็น stats cards
    const stats = officerPage.locator('[class*="stats"], [class*="stat"]');
    await expect(stats.first()).toBeVisible();
  });

  test('Officer เห็น filters และ table ใน Topic Exam Results', async ({ officerPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    await officerPage.goto('/admin/topic-exam/results');
    await officerPage.waitForLoadState('networkidle');

    // ตรวจ search input
    const searchInput = officerPage.locator('input[placeholder*="ค้นหา"]');
    await expect(searchInput.first()).toBeVisible();

    // ตรวจ table หรือ empty state
    const table = officerPage.locator('table, [class*="table"]');
    const emptyState = officerPage.locator(SEL.EMPTY_STATE);

    const hasTable = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
    const isEmpty = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || isEmpty).toBeTruthy();
  });

  test('Officer เห็น Export รายชื่อสอบ และ Export ผลสอบ buttons', async ({ officerPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    await officerPage.goto('/admin/topic-exam/results');
    await officerPage.waitForLoadState('networkidle');

    // ตรวจว่ามี 2 export buttons แยกกัน
    const exportListBtn = officerPage.locator('button:has-text("Export รายชื่อสอบ")');
    const exportResultsBtn = officerPage.locator('button:has-text("Export ผลสอบ")');

    await expect(exportListBtn).toBeVisible({ timeout: 5000 });
    await expect(exportResultsBtn).toBeVisible({ timeout: 5000 });
  });

  test('Officer ไม่เห็น Preview modal button (removed)', async ({ officerPage }) => {
    test.skip(!canProceed, 'ข้ามเพราะ prerequisite ไม่ครบ');

    await officerPage.goto('/admin/topic-exam/results');
    await officerPage.waitForLoadState('networkidle');

    // preview modal ถูกลบออกแล้ว — ต้องไม่มี button นี้
    const previewBtn = officerPage.locator('button:has-text("ดูตัวอย่างก่อนส่งออก")');
    await expect(previewBtn).not.toBeVisible();
  });
});
