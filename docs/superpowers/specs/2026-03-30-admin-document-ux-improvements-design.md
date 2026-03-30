# Admin Document Pages — UX Improvements

**Date:** 2026-03-30
**Scope:** 8 admin document management pages
**Changes:** 4 categories — Drawer migration, Bulk actions, Default status alignment, XLSX export

---

## 1. Inline Expand → Drawer (Exam Results Pages)

### Problem

`AdminProjectExamResultsPage` (used by `/admin/project-exam/results` and `/admin/thesis/exam-results`) uses inline expand to show details — the only 2 pages out of 8 that don't use the drawer pattern.

### Solution

Replace inline expand with right-side drawer (680px), matching `DefenseStaffQueuePage` pattern.

### State Changes

```
// Remove
- expandedProjectId: number | null

// Add
+ drawerOpen: boolean
+ selected: AdminProjectExamRow | null
```

### Drawer Content Sections

1. **ข้อมูลโครงงาน** — ชื่อไทย/อังกฤษ, รหัส, ปีการศึกษา/ภาคเรียน, สมาชิก (รหัส+ชื่อ), อาจารย์ที่ปรึกษา (หลัก+ร่วม)
2. **ข้อมูลคำขอสอบ** — สถานะ defense request, วันที่ยื่น, วันที่อาจารย์อนุมัติ, วันที่เจ้าหน้าที่ตรวจสอบ
3. **ผลสอบ** — ผล (PASS/FAIL), คะแนน, หมายเหตุ/ข้อเสนอแนะ, ผู้บันทึก, วันที่บันทึก, (FAIL: วันที่นักศึกษารับทราบ), (Project1 + PASS: ต้องแก้ scope)
4. **สถานะเล่มเอกสาร** (Thesis only) — สถานะ, วันที่ส่ง, วันที่ review, ผู้ตรวจ

### Drawer Footer Actions

- "บันทึกผลสอบ" button → opens existing record result modal (visible only when result not yet recorded)
- "อัปเดตสถานะเล่ม" button → opens existing document status modal (Thesis only)

### Files Modified

| File | Change |
|---|---|
| `src/components/admin/project-documents/AdminProjectExamResultsPage.tsx` | Replace inline expand with drawer; add drawer state; move detail content to drawer sections |
| `src/components/admin/project-documents/AdminProjectExamResultsPage.local.module.css` | Remove expand panel styles (if any remain unused) |

### What Stays the Same

- Record result modal (JSX + logic unchanged)
- Update document status modal (JSX + logic unchanged)
- Detail query hook (`useAdminProjectExamResultDetail`)
- Table columns and filters
- Stats cards

---

## 2. Bulk Actions

### Scope

Bulk actions added to pages where the primary action uses **shared input** (same reason/note for all items). Pages that require per-row input (exam result recording) remain single-action.

### Pages Receiving Bulk

| Page | Component | Bulk Actions | Selectable When |
|---|---|---|---|
| คำร้อง คพ.02/03 | `DefenseStaffQueuePage` | ตรวจสอบแล้ว (verify), ปฏิเสธ | `status === "advisor_approved"` |
| คำขอทดสอบระบบ | `SystemTestStaffQueuePage` | อนุมัติ, ส่งกลับ | `status === "pending_staff"` |
| ใบรับรองฝึกงาน | `certificates/page.tsx` | อนุมัติ (per-item cert number), ปฏิเสธ | `status === "pending"` |

### Pages NOT Receiving Bulk

- ผลสอบหัวข้อ — ต้องเลือกอาจารย์ที่ปรึกษาต่างกันทุกแถว
- ผลสอบโครงงาน/ปริญญานิพนธ์ — ต้องกรอก PASS/FAIL + คะแนนต่างกัน
- คำร้องฝึกงาน — มี bulk อยู่แล้ว (ไม่ต้องแก้)

### Shared Pattern (from internship page)

```typescript
// State
const [selectedIds, setSelectedIds] = useState<number[]>([]);

// Selectability
function canSelectRow(row: RowType): boolean {
  return row.status === ACTIONABLE_STATUS;
}

// Select all (header checkbox)
const onToggleSelectAll = (checked: boolean) => {
  setSelectedIds(checked ? rows.filter(canSelectRow).map(r => r.id) : []);
};

// Submit
const results = await Promise.allSettled(
  selectedIds.map(id => mutation.mutateAsync({ id, ...sharedInput }))
);
// Partial success feedback
```

### Bulk Modal Specs

**DefenseStaffQueuePage — Bulk Verify:**
- Title: "ยืนยันการตรวจสอบ {count} รายการ"
- Input: textarea "หมายเหตุถึงนักศึกษา (ไม่บังคับ)"
- Submit: call `verifyRequest.mutateAsync()` per item with shared note

**DefenseStaffQueuePage — Bulk Reject:**
- Title: "ปฏิเสธคำร้อง {count} รายการ"
- Input: textarea "เหตุผลการปฏิเสธ" (required, min 10 chars)
- Submit: new `rejectRequest` mutation per item with shared reason
- Backend: need new reject endpoint for defense requests (or reuse existing if available)

**SystemTestStaffQueuePage — Bulk Approve:**
- Title: "อนุมัติคำขอ {count} รายการ"
- Input: textarea "หมายเหตุ (ไม่บังคับ)"
- Submit: call `submitDecision.mutateAsync({ decision: 'approve', note })` per item

**SystemTestStaffQueuePage — Bulk Reject:**
- Title: "ส่งกลับคำขอ {count} รายการ"
- Input: textarea "เหตุผล (ไม่บังคับ)"
- Submit: call `submitDecision.mutateAsync({ decision: 'reject', note })` per item

**Certificates — Bulk Approve:**
- Title: "อนุมัติใบรับรอง {count} รายการ"
- Input: list of items, each with cert number input (pattern from internship bulk review — per-item input with scrollable list)
- Validation: all items must have cert number filled
- Submit: call `approveRequest.mutateAsync({ certificateNumber })` per item

**Certificates — Bulk Reject:**
- Title: "ปฏิเสธใบรับรอง {count} รายการ"
- Input: textarea "เหตุผล" (required)
- Submit: call `rejectRequest.mutateAsync({ remarks })` per item

### UI Changes Per Component

Each component adds:
1. Checkbox column (th + td) in table
2. Select-all checkbox in header
3. Bulk action buttons in filter bar area (disabled when count=0)
4. Bulk modal(s)
5. `selectedIds` state + `canSelectRow` function
6. Clear selection after successful bulk action + query invalidation

### Files Modified

| File | Change |
|---|---|
| `DefenseStaffQueuePage.tsx` | Add checkbox column, selectedIds state, canSelectRow, bulk verify/reject modals, bulk action buttons |
| `SystemTestStaffQueuePage.tsx` | Add checkbox column, selectedIds state, canSelectRow, bulk approve/reject modals, bulk action buttons |
| `certificates/page.tsx` | Add checkbox column, selectedIds state, canSelectRow, bulk approve (with per-item cert number)/reject modals |
| `useAdminDefenseQueue.ts` | Add `rejectRequest` mutation (if not exists) |

### Backend Changes (if needed)

Check if defense queue reject endpoint exists. If not:
- Add `POST /api/projects/:id/kp02/reject` (or PATCH status) in `projectRoutes.js`
- Add controller + service method for rejecting defense requests

---

## 3. Default Status & Naming Consistency

### Default Status Changes

| Page | Component | Current Default | New Default |
|---|---|---|---|
| คำร้องฝึกงาน | internship page | `"pending"` | `"pending"` (no change) |
| ใบรับรอง | certificates page | `""` (all) | `"pending"` |
| ผลสอบหัวข้อ | topic-exam page | (no filter) | `"pending"` (add status filter if missing) |
| คพ.02/03 | `DefenseStaffQueuePage` | `"all"` | `"advisor_approved"` |
| ผลสอบโครงงาน/ปริญญานิพนธ์ | `AdminProjectExamResultsPage` | `"pending"` | `"pending"` (no change) |
| System test | `SystemTestStaffQueuePage` | `"all"` | `"pending_staff"` |

### Label Normalization

**Principle:** Status labels describe what the staff needs to do. Use consistent suffixes: "แล้ว" for completed states, no suffix for pending states.

| Status Value | Current Label(s) | Normalized Label | Pages Affected |
|---|---|---|---|
| `pending` (documents) | "รอตรวจสอบ" / "รอดำเนินการ" | **"รอตรวจสอบ"** | certificates |
| `approved` (documents) | "อนุมัติ" / "อนุมัติแล้ว" | **"อนุมัติแล้ว"** | internship |
| `passed` (exam results) | "ผ่าน" / "ผ่านแล้ว" | **"ผ่าน"** | project-exam, thesis-exam |
| `failed` (exam results) | "ไม่ผ่าน" / "ไม่ผ่านแล้ว" | **"ไม่ผ่าน"** | project-exam, thesis-exam |

### Files Modified

| File | Change |
|---|---|
| `certificates/page.tsx` | Default `""` → `"pending"`, label "รอดำเนินการ" → "รอตรวจสอบ" |
| `DefenseStaffQueuePage.tsx` | Default `"all"` → `"advisor_approved"` |
| `SystemTestStaffQueuePage.tsx` | Default `"all"` → `"pending_staff"` |
| `AdminProjectExamResultsPage.tsx` | Labels "ผ่านแล้ว" → "ผ่าน", "ไม่ผ่านแล้ว" → "ไม่ผ่าน" |
| `internship/page.tsx` | Label "อนุมัติ" → "อนุมัติแล้ว" |
| `topic-exam/results/page.tsx` | Add status filter if missing, default to `"pending"` |

---

## 4. XLSX Export — All Pages

### Current State

| Page | Has Export? |
|---|---|
| ผลสอบหัวข้อ | Yes (backend ExcelJS) |
| คพ.02/03 | Yes (backend ExcelJS) |
| ผลสอบโครงงาน/ปริญญานิพนธ์ | **No** |
| System test | **No** |
| คำร้องฝึกงาน | **No** |
| ใบรับรอง | **No** |

### New Backend Endpoints (4)

All endpoints follow the same pattern: authenticate → authorize (admin + teacher:support) → query with filters → ExcelJS workbook → stream response.

#### 4.1 Project Exam Results Export

```
GET /api/projects/exam-results/export?examType=PROJECT1|THESIS&academicYear=&semester=&status=
```

**Columns:**
| Header | Data |
|---|---|
| ลำดับ | Sequential number |
| รหัสโครงงาน | projectCode |
| ชื่อโครงงาน (ไทย) | projectNameTh |
| ชื่อโครงงาน (อังกฤษ) | projectNameEn |
| สมาชิก | studentCode + name (multi-line) |
| อาจารย์ที่ปรึกษา | advisor name |
| ผลสอบ | PASS / FAIL / รอบันทึก |
| คะแนน | score or "-" |
| หมายเหตุ | notes |
| วันที่บันทึก | recordedAt |

**Files:**
- Route: `backend/routes/projectRoutes.js` — add export route
- Controller: `backend/controllers/projectExamResultController.js` (new or extend existing)
- Service: reuse existing query from `adminProjectExamResultService` + add ExcelJS generation

#### 4.2 System Test Export

```
GET /api/projects/system-test/staff-queue/export?academicYear=&semester=&status=
```

**Columns:**
| Header | Data |
|---|---|
| ลำดับ | Sequential number |
| รหัสโครงงาน | projectCode |
| ชื่อโครงงาน | projectNameTh |
| ผู้ยื่นคำขอ | studentCode + name |
| ช่วงทดสอบ | testStartDate - testDueDate |
| สถานะ | status label |
| วันที่ยื่น | submittedAt |
| วันที่อัปเดต | updatedAt |

**Files:**
- Route: `backend/routes/projectRoutes.js` — add export route
- Controller/Service: extend system test controller/service

#### 4.3 Internship Documents Export

```
GET /api/admin/documents/export?type=internship&academicYear=&semester=&status=
```

**Columns:**
| Header | Data |
|---|---|
| ลำดับ | Sequential number |
| ประเภทเอกสาร | CS05 / หนังสือตอบรับ |
| รหัสนักศึกษา | studentCode |
| ชื่อ-นามสกุล | studentName |
| บริษัท | companyName |
| สถานะ | status label |
| เลขที่ อว. | officialNumber |
| วันที่ส่ง | submittedAt |

**Files:**
- Route: `backend/routes/adminRoutes.js` — add export route
- Controller: extend `adminDocumentController`
- Service: extend with ExcelJS generation

#### 4.4 Certificate Requests Export

```
GET /api/admin/certificate-requests/export?academicYear=&semester=&status=
```

**Columns:**
| Header | Data |
|---|---|
| ลำดับ | Sequential number |
| รหัสนักศึกษา | studentCode |
| ชื่อ-นามสกุล | fullName |
| บริษัท | companyName |
| ชั่วโมงฝึกงาน | totalHours |
| คะแนนรวม | overallScore / fullScore |
| สถานะ | status label |
| วันที่ขอ | requestedAt |

**Files:**
- Route: `backend/routes/adminRoutes.js` — add export route
- Controller: extend `adminCertificateController`
- Service: extend with ExcelJS generation

### Frontend Changes (4 pages)

Each page needs:

1. **Service function** — `export[Name](filters)` that fetches blob and triggers download
2. **Hook mutation** — `useMutation` wrapping the service function
3. **Button** — "ส่งออก Excel" in page header area

| Page | Service File | Hook File |
|---|---|---|
| ผลสอบโครงงาน/ปริญญานิพนธ์ | `adminProjectExamResultService.ts` | `useAdminProjectExamResults.ts` |
| System test | `adminSystemTestService.ts` | `useAdminSystemTestQueue.ts` |
| คำร้องฝึกงาน | `adminInternshipDocumentsService.ts` | `useAdminInternshipDocuments.ts` |
| ใบรับรอง | `adminInternshipCertificatesService.ts` | `useAdminInternshipCertificates.ts` |

### Download Pattern (reuse from existing)

```typescript
// Service function pattern
export async function exportXlsx(filters: Filters): Promise<void> {
  const query = new URLSearchParams(filters).toString();
  const response = await apiFetchRaw(`/path/export?${query}`);
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  const filename = extractFilename(disposition) || "fallback.xlsx";
  downloadBlob(blob, filename);
}

// Shared download utility (extract if not exists)
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Summary — All Files

### Frontend Modified

| # | File | Changes |
|---|---|---|
| 1 | `AdminProjectExamResultsPage.tsx` | Inline→Drawer, label fixes |
| 2 | `AdminProjectExamResultsPage.local.module.css` | Remove unused expand styles |
| 3 | `DefenseStaffQueuePage.tsx` | Bulk actions, default status |
| 4 | `SystemTestStaffQueuePage.tsx` | Bulk actions, default status |
| 5 | `certificates/page.tsx` | Bulk actions, default status, label fix |
| 6 | `internship/page.tsx` | Label fix ("อนุมัติ" → "อนุมัติแล้ว") |
| 7 | `topic-exam/results/page.tsx` | Add status filter default, label check |
| 8 | `adminProjectExamResultService.ts` | Add export function |
| 9 | `adminSystemTestService.ts` | Add export function |
| 10 | `adminInternshipDocumentsService.ts` | Add export function |
| 11 | `adminInternshipCertificatesService.ts` | Add export function |
| 12 | `useAdminProjectExamResults.ts` | Add export mutation |
| 13 | `useAdminSystemTestQueue.ts` | Add export mutation |
| 14 | `useAdminInternshipDocuments.ts` | Add export mutation |
| 15 | `useAdminInternshipCertificates.ts` | Add export mutation |
| 16 | `useAdminDefenseQueue.ts` | Add reject mutation (if needed for bulk reject) |

### Backend Modified/Created

| # | File | Changes |
|---|---|---|
| 17 | `routes/projectRoutes.js` | Add exam-results export + system-test export routes |
| 18 | `routes/adminRoutes.js` | Add documents export + certificate export routes |
| 19 | `controllers/projectExamResultController.js` | New/extend: export function |
| 20 | `controllers/systemTestController.js` | Extend: export function |
| 21 | `controllers/adminDocumentController.js` | Extend: export function |
| 22 | `controllers/adminCertificateController.js` | Extend: export function |
| 23 | `services/projectExamResultService.js` | Extend: export query + ExcelJS |
| 24 | `services/systemTestService.js` | Extend: export query + ExcelJS |
| 25 | `services/adminDocumentService.js` | Extend: export query + ExcelJS |
| 26 | `services/adminCertificateService.js` | Extend: export query + ExcelJS |

### Not Modified

- Existing export endpoints (topic-exam, defense queue) — already working
- Existing modals (record result, update document status) — logic unchanged
- Shared CSS (`admin-queue.module.css`) — already has all needed styles (drawer, modal, checkbox, bulk)
- Backend models — no schema changes
