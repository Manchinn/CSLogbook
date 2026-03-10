import { test, expect } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

test.use({ storageState: 'auth/advisor.json' });

test.describe('Advisor Queue — Project 1 (คพ.02)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher/project1/advisor-queue');
  });

  test('Advisor เข้าหน้า Advisor Queue ได้', async ({ page }) => {
    // URL ไม่ redirect
    await expect(page).toHaveURL(/\/teacher\/project1\/advisor-queue/);

    // Title "คำขอสอบ คพ.02" แสดง
    await expect(
      page.getByRole('heading', { name: /คำขอสอบ คพ\.02/ })
    ).toBeVisible();
  });

  test('Queue list หรือ empty state แสดง', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // ต้องแสดง table rows หรือ empty state
    const table = page.locator('table tbody tr');
    const emptyState = page.locator(SEL.EMPTY_STATE).or(
      page.locator('text=ไม่มีคำขอสอบที่รออนุมัติในขณะนี้')
    );

    const hasRows = await table.count() > 0;
    const hasEmpty = await emptyState.first().isVisible().catch(() => false);

    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test('Summary stats bar แสดง (ถ้ามีข้อมูล) หรือ empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // ถ้ามีข้อมูล → summary bar แสดง, ถ้าไม่มี → empty state แสดง
    const summaryBar = page.locator(SEL.SUMMARY_BAR).first();
    const emptyState = page.locator('text=ไม่มีคำขอสอบ คพ.02 ที่รออนุมัติในขณะนี้');

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

    // Page ยังอยู่ (ไม่ error)
    await expect(page).toHaveURL(/\/teacher\/project1\/advisor-queue/);
  });
});
