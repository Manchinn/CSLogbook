import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/advisor.json' });

test.describe('Meeting Approvals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher/meeting-approvals');
  });

  test('Advisor เห็นรายการบันทึกพบอาจารย์', async ({ page }) => {
    // URL ไม่ redirect
    await expect(page).toHaveURL(/\/teacher\/meeting-approvals/);

    // Title "อนุมัติบันทึกการพบ" แสดง
    await expect(
      page.getByRole('heading', { name: /อนุมัติบันทึกการพบ/ })
    ).toBeVisible();

    await page.waitForLoadState('networkidle');

    // ต้องแสดง table rows หรือ empty state
    const table = page.locator('table tbody tr');
    const emptyState = page.locator(SEL.EMPTY_STATE).or(
      page.locator('text=ไม่มีบันทึกการพบที่รออนุมัติในขณะนี้')
    );

    const hasRows = await table.count() > 0;
    const hasEmpty = await emptyState.first().isVisible().catch(() => false);

    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test('Summary stats bar แสดง (ถ้ามีข้อมูล) หรือ empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // ถ้ามีข้อมูล → summary bar แสดง, ถ้าไม่มี → empty state แสดง
    const summaryBar = page.locator(SEL.SUMMARY_BAR).first();
    const emptyState = page.locator('text=ไม่มีบันทึกการพบที่รออนุมัติในขณะนี้');

    const hasSummary = await summaryBar.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasSummary || hasEmpty).toBeTruthy();
  });

  test('Status filter ทำงาน', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Filter select แสดง
    const filter = page.locator(SEL.ADVISOR_FILTER).first();
    await expect(filter).toBeVisible();

    // เลือก "รออนุมัติ" → page ไม่ crash
    await filter.selectOption({ label: 'รออนุมัติ' });
    await page.waitForTimeout(500);

    // Page ยังอยู่
    await expect(page).toHaveURL(/\/teacher\/meeting-approvals/);
  });

  // TODO: ต้อง seed pending meeting log ก่อนรัน test นี้
  test.skip('Advisor approve บันทึกพบอาจารย์', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // หา pending record ที่มีปุ่ม approve
    const approveBtn = page.locator(SEL.BTN_APPROVE).first();
    await expect(approveBtn).toBeVisible();

    // คลิก approve → modal แสดง
    await approveBtn.click();
    await expect(page.locator(SEL.DECISION_MODAL)).toBeVisible();

    // คลิก confirm
    await page.locator(SEL.MODAL_CONFIRM).click();

    // รอ modal หายไป + status เปลี่ยน
    await expect(page.locator(SEL.DECISION_MODAL)).not.toBeVisible();
  });
});
