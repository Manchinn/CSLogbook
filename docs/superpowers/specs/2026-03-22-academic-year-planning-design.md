# Design: Academic Year Planning & Dynamic Year Filtering

**Date:** 2026-03-22
**Status:** Approved
**Approach:** A — Filter by Active Academic Year

---

## Requirements

1. สามารถวางแผน (draft) ปีการศึกษาถัดไปล่วงหน้าได้ โดยไม่กระทบ flow ปัจจุบัน
2. ทุกจุดที่แสดง year dropdown ต้องดึงจาก DB (source of truth) ไม่ hardcode

## Constraint

- ห้ามกระทบ flow เดิมที่ทำงานอยู่ — เพียงเพิ่ม guard ให้ agent filter ตามปี active
- ไม่เปลี่ยน data model, ไม่เพิ่ม migration

---

## Part 1: Backend — Agent Academic Year Filtering

### 1.0 Shared Helper: `getActiveAcademicYearFilter()`

สร้าง utility function ที่ agent ทั้ง 3 ตัวใช้ร่วมกัน (`backend/utils/academicYearHelper.js`):

```js
async function getActiveAcademicYearFilter() {
  const { Academic } = require('../models');
  const active = await Academic.findOne({ where: { status: 'active' } })
    || await Academic.findOne({ where: { isCurrent: true } });
  if (!active) return null;
  const year = parseInt(active.academicYear, 10);
  const adYear = year >= 2500 ? year - 543 : year;
  const beYear = year >= 2500 ? year : year + 543;
  return { [Op.in]: [String(adYear), String(beYear)] };
}
```

- รองรับทั้ง ค.ศ. และ พ.ศ. (pattern เดียวกับ `importantDeadlineService.getAll()`)
- Return `null` ถ้าไม่พบ active year → caller skip พร้อม log warning (flow เดิมไม่ crash)

### 1.1 deadlineStatusUpdater.js

**ปัญหา:** query `ImportantDeadline.findAll()` ไม่ filter `academicYear`

**แก้ไข:** ใน `checkAndUpdateStatuses()` เรียก `getActiveAcademicYearFilter()` ครั้งเดียว แล้วส่งต่อให้ `processDeadlineAt(now, yearFilter)` และ `processEndDate(now, yearFilter)` เพิ่ม `academicYear: yearFilter` ใน where clause

### 1.2 projectDeadlineMonitor.js

**ปัญหา:** เป็น enhanced version ของ deadlineStatusUpdater มี `processDeadlineAt()` และ `processEndDate()` ที่ไม่ filter `academicYear` เหมือนกัน (line 161-169, 244-252)

**แก้ไข:** เพิ่ม `academicYear` filter เหมือน 1.1 — ใช้ `getActiveAcademicYearFilter()` ร่วมกัน

### 1.3 deadlineReminderAgent.js

**ปัญหา:**
1. ไม่ filter deadline ตาม academicYear
2. ส่ง notification ให้นักศึกษาทุกคน ไม่กรองตาม relatedTo

**แก้ไข:**
1. เพิ่ม active year filter เหมือน deadlineStatusUpdater (reuse helper pattern)
2. กรองนักศึกษาตาม `deadline.relatedTo`:
   - `internship` → `Student.findAll({ where: { isEnrolledInternship: true } })`
   - `project1` / `project2` → `Student.findAll({ where: { isEnrolledProject: true } })`
   - `general` → ส่งทุกคน (behavior เดิม)

---

## Part 2: Backend — Academic Years API

### 2.1 New endpoint: `GET /api/academic/years`

**Service method:** `AcademicService.getDistinctYears()`
- Query: `Academic.findAll()` แล้ว deduplicate by `academicYear` ฝั่ง JS (เอาปีละ 1 row, priority: active > published > draft)
- Returns: `[{ academicYear: 2568, status: 'active' }, { academicYear: 2567, status: 'published' }, ...]`

**Route:** เพิ่มใน `academicRoutes.js` (mount อยู่แล้วที่ `/api/academic`)

**ไม่กระทบ flow เดิม:** เป็น GET endpoint ใหม่ ไม่แก้ route เดิม

---

## Part 3: Frontend — Dynamic Year Dropdown

### 3.1 Shared Hook: `useAcademicYears`

```ts
// src/hooks/useAcademicYears.ts
// เรียก GET /api/academic/years
// staleTime: 10 นาที
// Returns: { data: { academicYear: number, status: string }[], isLoading }
```

### 3.2 แก้หน้าที่ hardcode

**approve-documents/page.tsx** (line 376-378):
- ลบ hardcoded `<option value="2567">` etc.
- ใช้ `useAcademicYears()` แล้ว `.map()` สร้าง options

**teacher/topic-exam/overview/page.tsx** (line 35-37):
- เหมือนกัน

---

## Files Changed

| # | ไฟล์ | การแก้ไข | Impact |
|---|---|---|---|
| 1 | `backend/agents/deadlineStatusUpdater.js` | เพิ่ม active year filter | Agent เท่านั้น |
| 2 | `backend/agents/schedulers/deadlineReminderAgent.js` | เพิ่ม active year + student filter | Agent เท่านั้น |
| 3 | `backend/services/academicService.js` | เพิ่ม `getDistinctYears()` | New method |
| 4 | `backend/routes/` (academic route) | เพิ่ม `GET /academic/years` | New endpoint |
| 5 | `backend/utils/academicYearHelper.js` | Shared helper ใหม่ | New file |
| 6 | `backend/agents/projectDeadlineMonitor.js` | เพิ่ม active year filter | Agent เท่านั้น |
| 7 | `frontend-next/src/lib/services/academicService.ts` | เพิ่ม `getAcademicYears()` | New function |
| 8 | `frontend-next/src/hooks/useAcademicYears.ts` | Hook ใหม่ | New file |
| 9 | `frontend-next/src/app/(app)/approve-documents/page.tsx` | Dynamic dropdown | UI only |
| 10 | `frontend-next/src/app/(app)/teacher/topic-exam/overview/page.tsx` | Dynamic dropdown | UI only |

## Testing

- สร้าง Academic schedule ปีถัดไป status=draft → verify agent ไม่ process deadline ปีนั้น
- Activate ปีใหม่ → verify agent เริ่ม process deadline ปีนั้น
- ตรวจ year dropdown แสดงปีจาก DB ถูกต้อง
- ตรวจว่า flow เดิม (ปีปัจจุบัน) ยังทำงานปกติ
