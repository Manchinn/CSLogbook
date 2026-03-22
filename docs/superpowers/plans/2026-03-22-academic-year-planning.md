# Academic Year Planning & Dynamic Year Filtering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้ระบบสามารถ draft ปีการศึกษาถัดไปล่วงหน้าได้อย่างปลอดภัย (agent ไม่ process deadline ปีที่ยังไม่ active) และ year dropdown ทุกจุดดึงจาก DB

**Architecture:** สร้าง shared helper สำหรับ query active academic year แล้วใช้ filter ใน agent 3 ตัว + เพิ่ม API endpoint `GET /academic/years` + สร้าง shared hook `useAcademicYears` แทน hardcoded dropdown

**Tech Stack:** Node.js/Sequelize (backend), Next.js/TanStack Query (frontend)

**Spec:** `docs/superpowers/specs/2026-03-22-academic-year-planning-design.md`

---

## Phase 1: Foundation (sequential)

### Task 1: Create shared helper `academicYearHelper.js`

**Files:**
- Create: `cslogbook/backend/utils/academicYearHelper.js`

- [ ] **Step 1: Create helper file**

```js
// cslogbook/backend/utils/academicYearHelper.js
const { Op } = require('sequelize');
const logger = require('./logger');

/**
 * ดึง filter สำหรับ academicYear จาก Academic ที่ active อยู่
 * รองรับทั้ง ค.ศ. และ พ.ศ. (return Op.in array)
 * @returns {Object|null} Sequelize where condition หรือ null ถ้าไม่พบ
 */
async function getActiveAcademicYearFilter() {
  try {
    const { Academic } = require('../models');
    const active = await Academic.findOne({ where: { status: 'active' } })
      || await Academic.findOne({ where: { isCurrent: true } });

    if (!active || !active.academicYear) {
      logger.warn('academicYearHelper: No active academic year found');
      return null;
    }

    const year = parseInt(active.academicYear, 10);
    if (isNaN(year)) {
      logger.warn(`academicYearHelper: Invalid academicYear value: ${active.academicYear}`);
      return null;
    }

    // รองรับทั้ง ค.ศ. และ พ.ศ. (pattern เดียวกับ importantDeadlineService.getAll)
    const adYear = year >= 2500 ? year - 543 : year;
    const beYear = year >= 2500 ? year : year + 543;

    return { [Op.in]: [String(adYear), String(beYear)] };
  } catch (error) {
    logger.error('academicYearHelper: Error fetching active academic year:', error);
    return null;
  }
}

module.exports = { getActiveAcademicYearFilter };
```

- [ ] **Step 2: Verify file created**

Run: `node -e "const h = require('./cslogbook/backend/utils/academicYearHelper'); console.log(typeof h.getActiveAcademicYearFilter)"`
Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add cslogbook/backend/utils/academicYearHelper.js
git commit -m "feat: add shared academicYearHelper for agent year filtering"
```

---

### Task 2: Add `GET /api/academic/years` endpoint

**Files:**
- Modify: `cslogbook/backend/services/academicService.js` — เพิ่ม method `getDistinctYears()`
- Modify: `cslogbook/backend/controllers/academicController.js` — เพิ่ม handler `getAcademicYears`
- Modify: `cslogbook/backend/routes/academicRoutes.js` — เพิ่ม route

- [ ] **Step 1: Add `getDistinctYears()` to academicService.js**

เพิ่มก่อน closing `}` ของ class (ก่อนบรรทัด `module.exports`):

```js
  /**
   * ดึงรายการปีการศึกษาที่มีใน DB (deduplicate, เรียงจากล่าสุด)
   * ใช้สำหรับ dropdown filter ใน frontend
   * @returns {Array<{academicYear: number, status: string}>}
   */
  async getDistinctYears() {
    const schedules = await Academic.findAll({
      attributes: ['academicYear', 'status'],
      order: [['academicYear', 'DESC']],
    });

    // Deduplicate by academicYear — เก็บ status ที่มี priority สูงสุด
    const statusPriority = { active: 0, published: 1, draft: 2 };
    const yearMap = new Map();

    for (const s of schedules) {
      const year = s.academicYear;
      if (!year) continue;
      const existing = yearMap.get(year);
      if (!existing || (statusPriority[s.status] ?? 99) < (statusPriority[existing.status] ?? 99)) {
        yearMap.set(year, { academicYear: Number(year), status: s.status || 'draft' });
      }
    }

    return Array.from(yearMap.values());
  }
```

- [ ] **Step 2: Add controller handler in `academicController.js`**

เพิ่มหลัง `exports.activateAcademicSchedule` (ท้ายไฟล์):

```js
exports.getAcademicYears = async (req, res) => {
  try {
    const years = await academicService.getDistinctYears();
    res.json({ success: true, data: years });
  } catch (error) {
    logger.error('Error fetching academic years:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถดึงรายการปีการศึกษาได้' });
  }
};
```

- [ ] **Step 3: Add route in `academicRoutes.js`**

เพิ่มหลัง `router.get("/current", ...)` (ก่อน admin routes):

```js
// ดึงรายการปีการศึกษาทั้งหมด (สำหรับ dropdown filter)
router.get(
  "/years",
  authenticateToken,
  academicController.getAcademicYears
);
```

- [ ] **Step 4: Verify endpoint**

Run: `cd cslogbook/backend && node -e "const app = require('./app'); console.log('app loaded ok')"`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add cslogbook/backend/services/academicService.js cslogbook/backend/controllers/academicController.js cslogbook/backend/routes/academicRoutes.js
git commit -m "feat: add GET /api/academic/years endpoint for dynamic year dropdown"
```

---

## Phase 2: Parallel Tasks (4 independent subagents)

> Tasks 3, 4, 5, 6 แก้ไฟล์ต่างกันทั้งหมด สามารถรันพร้อมกันได้

### Task 3: Fix `deadlineStatusUpdater.js` — add year filter

**Files:**
- Modify: `cslogbook/backend/agents/deadlineStatusUpdater.js`

- [ ] **Step 1: Add import at top (after line 21)**

```js
const { getActiveAcademicYearFilter } = require('../utils/academicYearHelper');
```

- [ ] **Step 2: Modify `checkAndUpdateStatuses()` to fetch year filter once**

แก้ method `checkAndUpdateStatuses()` (line 70-94) — เพิ่ม year filter query ก่อนเรียก process:

```js
  async checkAndUpdateStatuses() {
    if (this.checkInProgress) {
      logger.warn('DeadlineStatusUpdater: Previous check still running, skipping...');
      return;
    }

    this.checkInProgress = true;
    logger.info('DeadlineStatusUpdater: Starting status check...');

    try {
      const now = dayjs().tz('Asia/Bangkok');

      // ดึง filter ปีการศึกษาที่ active
      const yearFilter = await getActiveAcademicYearFilter();
      if (!yearFilter) {
        logger.warn('DeadlineStatusUpdater: No active academic year found, skipping deadline check');
        return;
      }

      // Job 1: Process soft deadlines (deadline_at)
      await this.processDeadlineAt(now, yearFilter);

      // Job 2: Process hard deadlines (end_date / windowEndAt)
      await this.processEndDate(now, yearFilter);

      logger.info('DeadlineStatusUpdater: Status check completed successfully');
    } catch (error) {
      logger.error('DeadlineStatusUpdater: Error in checkAndUpdateStatuses:', error);
    } finally {
      this.checkInProgress = false;
    }
  }
```

- [ ] **Step 3: Update `processDeadlineAt()` signature and query**

แก้ method signature เป็น `async processDeadlineAt(now, yearFilter)` แล้วเพิ่ม `academicYear: yearFilter` ใน where clause ของ `ImportantDeadline.findAll()` (line 108-116):

```js
  async processDeadlineAt(now, yearFilter) {
    logger.info('DeadlineStatusUpdater: Processing soft deadlines (deadline_at)...');

    let transitionedCount = 0;
    let errorCount = 0;

    try {
      // Find deadlines that just passed (within last 24 hours)
      const passedDeadlines = await ImportantDeadline.findAll({
        where: {
          deadlineAt: {
            [Op.lte]: now.toDate(),
            [Op.gte]: now.subtract(1, 'day').toDate()
          },
          relatedTo: { [Op.in]: ['project1', 'project2'] },
          academicYear: yearFilter
        }
      });
```

(ส่วนที่เหลือของ method คงเดิม ไม่เปลี่ยน)

- [ ] **Step 4: Update `processEndDate()` signature and query**

แก้ method signature เป็น `async processEndDate(now, yearFilter)` แล้วเพิ่ม `academicYear: yearFilter` (line 211-219):

```js
  async processEndDate(now, yearFilter) {
    logger.info('DeadlineStatusUpdater: Processing hard deadlines (end_date)...');

    let transitionedCount = 0;
    let errorCount = 0;

    try {
      // Find deadlines whose end_date just passed
      const closedDeadlines = await ImportantDeadline.findAll({
        where: {
          windowEndAt: {
            [Op.lte]: now.toDate(),
            [Op.gte]: now.subtract(1, 'day').toDate()
          },
          relatedTo: { [Op.in]: ['project1', 'project2'] },
          academicYear: yearFilter
        }
      });
```

(ส่วนที่เหลือของ method คงเดิม)

- [ ] **Step 5: Commit**

```bash
git add cslogbook/backend/agents/deadlineStatusUpdater.js
git commit -m "fix: filter deadlineStatusUpdater by active academic year"
```

---

### Task 4: Fix `projectDeadlineMonitor.js` — add year filter

**Files:**
- Modify: `cslogbook/backend/agents/projectDeadlineMonitor.js`

- [ ] **Step 1: Add import (after existing requires, around line 23)**

```js
const { getActiveAcademicYearFilter } = require('../utils/academicYearHelper');
```

- [ ] **Step 2: Find `processDeadlineStateTransitions()` method and add year filter**

ค้นหา method ที่เรียก `processDeadlineAt()` + `processEndDate()` — เพิ่ม yearFilter query ก่อนเรียก:

```js
    // ดึง filter ปีการศึกษาที่ active
    const yearFilter = await getActiveAcademicYearFilter();
    if (!yearFilter) {
      logger.warn('ProjectDeadlineMonitor: No active academic year, skipping deadline transitions');
      return;
    }
```

แล้วส่ง `yearFilter` เข้า `processDeadlineAt(now, yearFilter)` และ `processEndDate(now, yearFilter)`

- [ ] **Step 3: Update `processDeadlineAt()` — add `academicYear: yearFilter` to ImportantDeadline query**

เปลี่ยน signature เป็น `async processDeadlineAt(now, yearFilter)` แล้วเพิ่มใน where clause (line 161-169):

```js
      const passedDeadlines = await ImportantDeadline.findAll({
        where: {
          deadlineAt: {
            [Op.lte]: now.toDate(),
            [Op.gte]: now.subtract(1, 'day').toDate()
          },
          relatedTo: { [Op.in]: ['project1', 'project2'] },
          academicYear: yearFilter
        }
      });
```

- [ ] **Step 4: Update `processEndDate()` — same pattern**

เปลี่ยน signature เป็น `async processEndDate(now, yearFilter)` แล้วเพิ่มใน where clause (line 244-252):

```js
      const closedDeadlines = await ImportantDeadline.findAll({
        where: {
          windowEndAt: {
            [Op.lte]: now.toDate(),
            [Op.gte]: now.subtract(1, 'day').toDate()
          },
          relatedTo: { [Op.in]: ['project1', 'project2'] },
          academicYear: yearFilter
        }
      });
```

- [ ] **Step 5: Commit**

```bash
git add cslogbook/backend/agents/projectDeadlineMonitor.js
git commit -m "fix: filter projectDeadlineMonitor by active academic year"
```

---

### Task 5: Fix `deadlineReminderAgent.js` — add year + student filter

**Files:**
- Modify: `cslogbook/backend/agents/schedulers/deadlineReminderAgent.js`

- [ ] **Step 1: Add import (after line 4)**

```js
const { getActiveAcademicYearFilter } = require('../../utils/academicYearHelper');
```

- [ ] **Step 2: Add year filter in `checkDeadlines()` method**

เพิ่มที่ต้นของ try block (หลัง line 65) — ดึง yearFilter แล้วเพิ่มใน where clause ของทั้ง 2 queries:

```js
    try {
      // ดึง filter ปีการศึกษาที่ active
      const yearFilter = await getActiveAcademicYearFilter();
      if (!yearFilter) {
        logger.warn('DeadlineReminderAgent: No active academic year, skipping');
        return;
      }

      // ค้นหากำหนดส่งที่ใกล้จะถึง
      const upcomingDeadlines = await ImportantDeadline.findAll({
        where: {
          [Op.or]: [
            { deadline_at: { [Op.between]: [now, warningDate] } },
            { [Op.and]: [ { deadline_at: { [Op.is]: null } }, { date: { [Op.between]: [now, warningDate] } } ] }
          ],
          notified: false,
          academicYear: yearFilter
        }
      });

      // ค้นหากำหนดส่งที่ใกล้มากและสำคัญ
      const criticalDeadlines = await ImportantDeadline.findAll({
        where: {
          [Op.or]: [
            { deadline_at: { [Op.between]: [now, criticalDate] } },
            { [Op.and]: [ { deadline_at: { [Op.is]: null } }, { date: { [Op.between]: [now, criticalDate] } } ] }
          ],
          isCritical: true,
          criticalNotified: false,
          academicYear: yearFilter
        }
      });
```

- [ ] **Step 3: Add student filtering in `sendDeadlineNotification()`**

แก้ query นักศึกษาใน `sendDeadlineNotification()` (line 118-121) ให้กรองตาม `deadline.relatedTo`:

```js
      // กรองนักศึกษาตาม relatedTo ของ deadline
      let studentWhere = {};
      if (deadline.relatedTo === 'internship') {
        studentWhere = { isEnrolledInternship: true };
      } else if (['project1', 'project2', 'project'].includes(deadline.relatedTo)) {
        studentWhere = { isEnrolledProject: true };
      }
      // general → ไม่กรอง (ส่งทุกคน เหมือน behavior เดิม)

      const students = await Student.findAll({ where: studentWhere });
```

- [ ] **Step 4: Commit**

```bash
git add cslogbook/backend/agents/schedulers/deadlineReminderAgent.js
git commit -m "fix: filter deadlineReminderAgent by active year and relevant students"
```

---

### Task 6: Frontend — dynamic year dropdown

**Files:**
- Modify: `cslogbook/frontend-next/src/lib/services/academicService.ts` — เพิ่ม `getAcademicYears()`
- Create: `cslogbook/frontend-next/src/hooks/useAcademicYears.ts` — shared hook
- Modify: `cslogbook/frontend-next/src/app/(app)/approve-documents/page.tsx` — dynamic dropdown
- Modify: `cslogbook/frontend-next/src/app/(app)/teacher/topic-exam/overview/page.tsx` — dynamic dropdown

- [ ] **Step 1: Add `getAcademicYears()` to frontend academicService.ts**

เพิ่มท้ายไฟล์ `cslogbook/frontend-next/src/lib/services/academicService.ts`:

```ts
export type AcademicYearOption = {
  academicYear: number;
  status: string;
};

export async function getAcademicYears(): Promise<AcademicYearOption[]> {
  return apiFetchData<AcademicYearOption[]>("/academic/years") ?? [];
}
```

- [ ] **Step 2: Create `useAcademicYears.ts` hook**

```ts
// cslogbook/frontend-next/src/hooks/useAcademicYears.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getAcademicYears, type AcademicYearOption } from "@/lib/services/academicService";

export function useAcademicYears() {
  return useQuery<AcademicYearOption[]>({
    queryKey: ["academic-years"],
    queryFn: getAcademicYears,
    staleTime: 10 * 60 * 1000, // 10 นาที
  });
}
```

- [ ] **Step 3: Fix `approve-documents/page.tsx` — replace hardcoded years**

เพิ่ม import:
```tsx
import { useAcademicYears } from "@/hooks/useAcademicYears";
```

เพิ่ม hook call ใน component (ใกล้กับ state declarations):
```tsx
const { data: academicYears = [] } = useAcademicYears();
```

แก้ lines 375-378 จาก:
```tsx
                <option value="">ทุกปีการศึกษา</option>
                <option value="2567">2567</option>
                <option value="2566">2566</option>
                <option value="2565">2565</option>
```
เป็น:
```tsx
                <option value="">ทุกปีการศึกษา</option>
                {academicYears.map((y) => (
                  <option key={y.academicYear} value={String(y.academicYear)}>
                    {y.academicYear}
                  </option>
                ))}
```

- [ ] **Step 4: Fix `teacher/topic-exam/overview/page.tsx` — replace hardcoded years**

เพิ่ม import:
```tsx
import { useAcademicYears } from "@/hooks/useAcademicYears";
```

เพิ่ม hook call:
```tsx
const { data: academicYears = [] } = useAcademicYears();
```

แก้ lines 34-37 จาก:
```tsx
              <option value="">ทั้งหมด</option>
              <option value="2567">2567</option>
              <option value="2566">2566</option>
              <option value="2565">2565</option>
```
เป็น:
```tsx
              <option value="">ทั้งหมด</option>
              {academicYears.map((y) => (
                <option key={y.academicYear} value={String(y.academicYear)}>
                  {y.academicYear}
                </option>
              ))}
```

- [ ] **Step 5: Commit**

```bash
git add cslogbook/frontend-next/src/lib/services/academicService.ts cslogbook/frontend-next/src/hooks/useAcademicYears.ts cslogbook/frontend-next/src/app/\(app\)/approve-documents/page.tsx cslogbook/frontend-next/src/app/\(app\)/teacher/topic-exam/overview/page.tsx
git commit -m "feat: replace hardcoded year dropdowns with dynamic useAcademicYears hook"
```

---

## Dependency Graph

```
Task 1 (helper) ──┬──→ Task 3 (deadlineStatusUpdater)
                   ├──→ Task 4 (projectDeadlineMonitor)
                   ├──→ Task 5 (deadlineReminderAgent)
Task 2 (API)   ──────→ Task 6 (frontend)

Tasks 3, 4, 5, 6 = parallel (ไฟล์ไม่ซ้ำกัน)
```

## Verification

หลัง implement ครบทุก task:
- `cd cslogbook/backend && node -e "require('./app')"` — backend loads ok
- `cd cslogbook/frontend-next && npx next lint` — no lint errors
- ตรวจว่า flow เดิมไม่กระทบ: agent ยัง process deadline ปีปัจจุบันได้ปกติ
