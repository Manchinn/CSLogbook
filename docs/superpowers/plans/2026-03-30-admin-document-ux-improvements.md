# Admin Document UX Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve 8 admin document pages with consistent drawer detail views, bulk actions, default status filters, and XLSX export across all pages.

**Architecture:** 4 independent change categories applied across shared components. Frontend uses React Query mutations + shared CSS module. Backend uses ExcelJS for XLSX generation with streaming response. Changes follow existing patterns from internship documents (bulk) and topic-exam (export).

**Tech Stack:** Next.js 16 / React 19 / TanStack Query v5 / TypeScript | Node.js / Express / ExcelJS / Sequelize

**Spec:** `docs/superpowers/specs/2026-03-30-admin-document-ux-improvements-design.md`

---

## File Structure

### Frontend Modified
| File | Responsibility |
|---|---|
| `src/components/admin/project-documents/AdminProjectExamResultsPage.tsx` | Replace inline expand with drawer |
| `src/components/admin/project-documents/AdminProjectExamResultsPage.local.module.css` | Remove unused expand styles, keep checkbox/info styles |
| `src/components/admin/project-documents/DefenseStaffQueuePage.tsx` | Add bulk verify/reject, change default status |
| `src/components/admin/project-documents/SystemTestStaffQueuePage.tsx` | Add bulk approve/reject, change default status |
| `src/app/(app)/admin/documents/certificates/page.tsx` | Add bulk approve/reject, change default status + label |
| `src/app/(app)/admin/documents/internship/page.tsx` | Fix label "อนุมัติ" → "อนุมัติแล้ว" |
| `src/app/(app)/admin/topic-exam/results/page.tsx` | Add status filter with default "pending" |
| `src/hooks/useAdminProjectExamResults.ts` | Add export mutation |
| `src/hooks/useAdminSystemTestQueue.ts` | Add export mutation |
| `src/hooks/useAdminInternshipDocuments.ts` | Add export mutation |
| `src/hooks/useAdminInternshipCertificates.ts` | Add export mutation |
| `src/lib/services/adminProjectExamResultService.ts` | Add export function |
| `src/lib/services/adminSystemTestService.ts` | Add export function |
| `src/lib/services/adminInternshipDocumentsService.ts` | Add export function |
| `src/lib/services/adminInternshipCertificatesService.ts` | Add export function |

### Backend Modified/Created
| File | Responsibility |
|---|---|
| `backend/routes/projectRoutes.js` | Add exam-results export + system-test export routes |
| `backend/routes/adminRoutes.js` | Add internship docs export + certificate export routes |
| `backend/controllers/topicExamController.js` | Reference pattern for ExcelJS export |
| `backend/controllers/projectDefenseRequestController.js` | Add exam results export function |
| `backend/controllers/systemTestController.js` | Add system test export function (new file or extend) |
| `backend/services/projectDefenseRequestService.js` | Add exam results export query + ExcelJS |
| `backend/services/systemTestService.js` | Add system test export query + ExcelJS |
| `backend/controllers/adminDocumentController.js` | Add internship documents export |
| `backend/controllers/adminCertificateController.js` | Add certificate requests export |

---

## Task Dependency Graph

```
Task 1 (Drawer)          ─┐
Task 2 (Default status)  ─┤── All independent, can run in parallel
Task 3 (Bulk defense)    ─┤
Task 4 (Bulk sys-test)   ─┤
Task 5 (Bulk certs)      ─┤
Task 6 (BE export exam)  ─┤
Task 7 (BE export stest) ─┤
Task 8 (BE export intern)─┤
Task 9 (BE export certs) ─┘
Task 10 (FE export wiring) ── depends on Tasks 6-9
```

---

## Task 1: Inline Expand → Drawer (AdminProjectExamResultsPage)

**Files:**
- Modify: `src/components/admin/project-documents/AdminProjectExamResultsPage.tsx`
- Modify: `src/components/admin/project-documents/AdminProjectExamResultsPage.local.module.css`

**Context:** This component currently uses `expandedProjectId` state to show an inline dashed-border panel below the table. Replace with a right-side drawer (680px) matching `DefenseStaffQueuePage` pattern. Keep both modals (record result + update document status) unchanged.

- [ ] **Step 1: Replace expand state with drawer state**

In `AdminProjectExamResultsPage.tsx`, replace the expand state variables:

```typescript
// REMOVE these lines (~line 91):
const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

// ADD these lines in same location:
const [drawerOpen, setDrawerOpen] = useState(false);
const [drawerTarget, setDrawerTarget] = useState<AdminProjectExamRow | null>(null);
```

- [ ] **Step 2: Replace detail query trigger**

Change the detail query to use drawer state instead of expandedProjectId:

```typescript
// REMOVE (~line 118):
const detailQuery = useAdminProjectExamResultDetail(expandedProjectId, examType, Boolean(expandedProjectId));

// ADD:
const detailQuery = useAdminProjectExamResultDetail(drawerTarget?.projectId ?? null, examType, drawerOpen && Boolean(drawerTarget));
```

- [ ] **Step 3: Replace expandedDetail computed value**

```typescript
// REMOVE the entire expandedDetail useMemo block (~lines 142-152)

// ADD drawer helper functions and activeRecord:
const openDrawer = (row: AdminProjectExamRow) => {
  setDrawerTarget(row);
  setDrawerOpen(true);
};

const closeDrawer = () => {
  setDrawerOpen(false);
  setDrawerTarget(null);
};

const activeRecord = useMemo(() => {
  if (!drawerTarget) return null;
  const detailRow = detailQuery.data;
  if (!detailRow) return drawerTarget;
  return { ...drawerTarget, examResult: detailRow };
}, [detailQuery.data, drawerTarget]);
```

- [ ] **Step 4: Update the table action buttons**

In the table row actions section, replace the expand toggle button:

```typescript
// REMOVE (~line 417):
<button
  type="button"
  className={styles.button}
  onClick={() => setExpandedProjectId(isExpanded ? null : row.projectId)}
>
  {isExpanded ? "ซ่อนรายละเอียด" : "รายละเอียด"}
</button>

// ADD:
<button
  type="button"
  className={styles.button}
  onClick={() => openDrawer(row)}
>
  รายละเอียด
</button>
```

Also remove the `isExpanded` variable from the row map:
```typescript
// REMOVE (~line 364):
const isExpanded = expandedProjectId === row.projectId;
```

- [ ] **Step 5: Remove inline expand panel, add drawer**

Remove the entire `{expandedDetail ? ( <div className={local.expandPanel}> ... </div> ) : null}` block (~lines 444-489).

Add the drawer JSX before the closing `</div>` of the page (after the document modal, before the final `</div>`):

```tsx
{drawerOpen && drawerTarget ? (
  <div className={styles.drawerOverlay}>
    <aside className={styles.drawer}>
      <header className={styles.drawerHeader}>
        <div>
          <p className={styles.drawerTitle}>รายละเอียดผลสอบ</p>
          <p className={styles.subText}>
            {activeRecord?.projectNameTh || activeRecord?.projectNameEn || "-"}
          </p>
        </div>
        <button type="button" className={styles.button} onClick={closeDrawer}>
          ปิด
        </button>
      </header>
      <div className={styles.drawerBody}>
        {detailQuery.isLoading ? (
          <p className={styles.empty}>กำลังโหลดรายละเอียด...</p>
        ) : null}

        <section className={styles.detailSection}>
          <h3 className={styles.detailTitle}>ข้อมูลโครงงาน</h3>
          <p>ชื่อโครงงาน (ไทย): {activeRecord?.projectNameTh || "-"}</p>
          <p>ชื่อโครงงาน (อังกฤษ): {activeRecord?.projectNameEn || "-"}</p>
          <p>รหัส: {activeRecord?.projectCode || "-"}</p>
          <p>
            ปีการศึกษา: {activeRecord?.academicYear || "-"} / ภาคเรียน{" "}
            {activeRecord?.semester || "-"}
          </p>
          <p>อาจารย์ที่ปรึกษาหลัก: {activeRecord?.advisor?.name || "-"}</p>
          <p>อาจารย์ที่ปรึกษาร่วม: {activeRecord?.coAdvisor?.name || "-"}</p>
          {activeRecord?.members.length ? (
            <>
              <p className={styles.subText}>สมาชิก:</p>
              <ul>
                {activeRecord.members.map((m) => (
                  <li
                    key={`${activeRecord.projectId}-${m.studentId ?? m.studentCode}`}
                    className={styles.subText}
                  >
                    {m.studentCode || "-"} {m.name || "-"}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section className={styles.detailSection}>
          <h3 className={styles.detailTitle}>รายละเอียดการสอบ</h3>
          <p>
            สถานะคำขอสอบ:{" "}
            {DEFENSE_STATUS_LABEL[activeRecord?.defenseRequest?.status ?? ""] ||
              activeRecord?.defenseRequest?.status ||
              "-"}
          </p>
          <p>ยื่นคำขอเมื่อ: {formatDateTime(activeRecord?.defenseRequest?.submittedAt)}</p>
          <p>
            อาจารย์อนุมัติเมื่อ:{" "}
            {formatDateTime(activeRecord?.defenseRequest?.advisorApprovedAt)}
          </p>
          <p>
            เจ้าหน้าที่ตรวจเมื่อ:{" "}
            {formatDateTime(activeRecord?.defenseRequest?.staffVerifiedAt)}
          </p>
        </section>

        <section className={styles.detailSection}>
          <h3 className={styles.detailTitle}>ผลการสอบ</h3>
          {activeRecord?.examResult ? (
            <>
              <p>
                ผลสอบ:{" "}
                {activeRecord.examResult.result === "PASS" ? "ผ่าน" : "ไม่ผ่าน"}
              </p>
              <p>คะแนน: {activeRecord.examResult.score ?? "-"}</p>
              <p>หมายเหตุ: {activeRecord.examResult.notes || "-"}</p>
              <p>ผู้บันทึก: {activeRecord.examResult.recordedByName || "-"}</p>
              <p>บันทึกเมื่อ: {formatDateTime(activeRecord.examResult.recordedAt)}</p>
              {activeRecord.examResult.result === "PASS" &&
              activeRecord.examResult.requireScopeRevision ? (
                <p className={styles.subText}>* ต้องแก้ไข scope ก่อนเข้าขั้นตอนถัดไป</p>
              ) : null}
              {activeRecord.examResult.result === "FAIL" ? (
                <p>
                  รับทราบผลโดยนักศึกษา:{" "}
                  {formatDateTime(activeRecord.examResult.studentAcknowledgedAt)}
                </p>
              ) : null}
            </>
          ) : (
            <p>ยังไม่มีผลสอบ</p>
          )}
        </section>

        {examType === ADMIN_EXAM_TYPE_THESIS ? (
          <section className={styles.detailSection}>
            <h3 className={styles.detailTitle}>สถานะเล่มเอกสาร</h3>
            <p>
              สถานะ:{" "}
              {activeRecord?.finalDocument
                ? FINAL_DOCUMENT_LABEL[activeRecord.finalDocument.status ?? ""] ||
                  activeRecord.finalDocument.status ||
                  "-"
                : "ยังไม่ส่งเล่ม"}
            </p>
            <p>ส่งเมื่อ: {formatDateTime(activeRecord?.finalDocument?.submittedAt)}</p>
            <p>ตรวจล่าสุด: {formatDateTime(activeRecord?.finalDocument?.reviewDate)}</p>
            <p>ผู้ตรวจ: {activeRecord?.finalDocument?.reviewerName || "-"}</p>
          </section>
        ) : null}
      </div>

      <footer className={styles.drawerFooter}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => {
            if (drawerTarget) openRecordModal(drawerTarget);
          }}
          disabled={Boolean(activeRecord?.examResult)}
        >
          {activeRecord?.examResult ? "บันทึกแล้ว" : "บันทึกผลสอบ"}
        </button>
        {examType === ADMIN_EXAM_TYPE_THESIS ? (
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              if (drawerTarget) openDocumentModal(drawerTarget);
            }}
          >
            อัปเดตสถานะเล่ม
          </button>
        ) : null}
      </footer>
    </aside>
  </div>
) : null}
```

- [ ] **Step 6: Add drawerFooter CSS if missing**

Check if `styles.drawerFooter` exists in `admin-queue.module.css`. If not, add:

```css
.drawerFooter {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}
```

- [ ] **Step 7: Clean up reset filter handler**

In the reset filter button onClick, remove `setExpandedProjectId(null)` and replace with `closeDrawer()`:

```typescript
// In the reset button onClick handler:
onClick={() => {
  setStatus("pending");
  setAcademicYear("");
  setSemester("");
  setSearch("");
  setPage(1);
  closeDrawer(); // was: setExpandedProjectId(null)
}}
```

- [ ] **Step 8: Remove unused expand CSS**

In `AdminProjectExamResultsPage.local.module.css`, remove `.expandPanel` and `.expandGrid` (keep `.checkboxField` and `.infoBox` which are used by modals):

```css
/* REMOVE these two rules: */
.expandPanel { ... }
.expandGrid { ... }
```

- [ ] **Step 9: Verify build**

```bash
cd cslogbook/frontend-next && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add src/components/admin/project-documents/AdminProjectExamResultsPage.tsx src/components/admin/project-documents/AdminProjectExamResultsPage.local.module.css src/styles/shared/admin-queue.module.css
git commit -m "refactor: replace inline expand with drawer in exam results pages"
```

---

## Task 2: Default Status & Naming Consistency

**Files:**
- Modify: `src/components/admin/project-documents/DefenseStaffQueuePage.tsx`
- Modify: `src/components/admin/project-documents/SystemTestStaffQueuePage.tsx`
- Modify: `src/components/admin/project-documents/AdminProjectExamResultsPage.tsx`
- Modify: `src/app/(app)/admin/documents/certificates/page.tsx`
- Modify: `src/app/(app)/admin/documents/internship/page.tsx`
- Modify: `src/app/(app)/admin/topic-exam/results/page.tsx`

**Context:** Unify default status filters to show "pending/waiting" items first, and align Thai status labels across all pages.

- [ ] **Step 1: DefenseStaffQueuePage — change default status**

In `DefenseStaffQueuePage.tsx`, change the initial state:

```typescript
// CHANGE (~line 71):
const [status, setStatus] = useState("all");
// TO:
const [status, setStatus] = useState("advisor_approved");
```

Also update the reset filter handler to match:
```typescript
// In reset button onClick, change:
setStatus("all");
// TO:
setStatus("advisor_approved");
```

- [ ] **Step 2: SystemTestStaffQueuePage — change default status**

In `SystemTestStaffQueuePage.tsx`, change the initial state:

```typescript
// CHANGE (~line 58):
const [status, setStatus] = useState("all");
// TO:
const [status, setStatus] = useState("pending_staff");
```

Also update the reset filter handler to match.

- [ ] **Step 3: Certificates page — change default status + label**

In `certificates/page.tsx`, change:

```typescript
// CHANGE default status (~line 39):
const [status, setStatus] = useState("");
// TO:
const [status, setStatus] = useState("pending");
```

Change the label in the status dropdown:
```typescript
// CHANGE:
<option value="pending">รอดำเนินการ</option>
// TO:
<option value="pending">รอตรวจสอบ</option>
```

- [ ] **Step 4: Internship page — fix approved label**

In `internship/page.tsx`, change the approved label in the status filter dropdown:

```typescript
// CHANGE:
<option value="approved">อนุมัติ</option>
// TO:
<option value="approved">อนุมัติแล้ว</option>
```

- [ ] **Step 5: AdminProjectExamResultsPage — fix exam result labels**

In `AdminProjectExamResultsPage.tsx`, change the status filter options:

```typescript
// CHANGE:
<option value="passed">ผ่านแล้ว</option>
<option value="failed">ไม่ผ่านแล้ว</option>
// TO:
<option value="passed">ผ่าน</option>
<option value="failed">ไม่ผ่าน</option>
```

- [ ] **Step 6: Topic exam page — add status filter**

In `topic-exam/results/page.tsx`, check if status filter exists. If missing, add a status state and dropdown. The page currently has search, academicYear, semester filters. Add status:

```typescript
// Add state (~after other filter states):
const [examStatus, setExamStatus] = useState("pending");

// Add to filters object:
examStatus: examStatus === "all" ? undefined : examStatus,

// Add dropdown in filters section (before academicYear select):
<select
  className={styles.select}
  value={examStatus}
  onChange={(event) => {
    setExamStatus(event.target.value);
    setPage(1);
  }}
>
  <option value="pending">รอบันทึกผล</option>
  <option value="passed">ผ่าน</option>
  <option value="failed">ไม่ผ่าน</option>
  <option value="all">ทั้งหมด</option>
</select>
```

Also update the reset handler to include `setExamStatus("pending")`.

**Note:** Check if the backend `/projects/topic-exam/overview` endpoint supports a `status` query param. If not, filter client-side using the existing data (the `meta` field from the response may contain this info). Read the `topicExamService.getTopicOverview` to verify.

- [ ] **Step 7: Verify build**

```bash
cd cslogbook/frontend-next && npm run build
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "fix: unify default status filters and Thai status labels across admin pages"
```

---

## Task 3: Bulk Actions — DefenseStaffQueuePage

**Files:**
- Modify: `src/components/admin/project-documents/DefenseStaffQueuePage.tsx`
- Modify: `src/hooks/useAdminDefenseQueue.ts`
- Modify: `src/lib/services/adminDefenseQueueService.ts`

**Context:** Add checkbox multi-select + bulk verify + bulk reject to defense queue pages (คพ.02 and คพ.03). Follow the exact pattern from `internship/page.tsx`. Only rows with `status === "advisor_approved"` are selectable.

- [ ] **Step 1: Add selection state to DefenseStaffQueuePage**

Add after existing state declarations:

```typescript
const [selectedIds, setSelectedIds] = useState<number[]>([]);
const [bulkVerifyOpen, setBulkVerifyOpen] = useState(false);
const [bulkVerifyNote, setBulkVerifyNote] = useState("");
const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
const [bulkRejectReason, setBulkRejectReason] = useState("");
```

Add selectability function:

```typescript
function canSelectRow(row: DefenseQueueRecord): boolean {
  return row.status === "advisor_approved";
}
```

Add toggle functions:

```typescript
const onToggleSelected = (requestId: number, checked: boolean) => {
  setSelectedIds((prev) =>
    checked ? [...prev, requestId] : prev.filter((id) => id !== requestId),
  );
};

const onToggleSelectAll = (checked: boolean) => {
  setSelectedIds(
    checked ? rows.filter(canSelectRow).map((r) => r.requestId) : [],
  );
};

const allSelectableRows = rows.filter(canSelectRow);
const isAllSelected =
  allSelectableRows.length > 0 &&
  selectedIds.length === allSelectableRows.length;
const selectedCount = selectedIds.length;
```

- [ ] **Step 2: Add checkbox column to table**

Add checkbox header:
```tsx
<thead>
  <tr>
    <th style={{ width: 40 }}>
      <input
        type="checkbox"
        checked={isAllSelected}
        onChange={(e) => onToggleSelectAll(e.target.checked)}
        disabled={allSelectableRows.length === 0}
      />
    </th>
    <th>โครงงาน</th>
    {/* ... existing columns ... */}
  </tr>
</thead>
```

Add checkbox cell in each row:
```tsx
<td>
  {canSelectRow(row) ? (
    <input
      type="checkbox"
      checked={selectedIds.includes(row.requestId)}
      onChange={(e) => onToggleSelected(row.requestId, e.target.checked)}
    />
  ) : null}
</td>
```

Update all `colSpan` values (loading/empty rows) from 5 to 6.

- [ ] **Step 3: Add bulk action buttons**

Add bulk buttons in the header `buttonRow` area (before the reset button):

```tsx
<button
  type="button"
  className={`${styles.button} ${styles.buttonPrimary}`}
  onClick={() => {
    setBulkVerifyNote("");
    setBulkVerifyOpen(true);
  }}
  disabled={!selectedCount || isBusy}
>
  ตรวจสอบแล้ว ({selectedCount})
</button>
<button
  type="button"
  className={`${styles.button} ${styles.buttonDanger}`}
  onClick={() => {
    setBulkRejectReason("");
    setBulkRejectOpen(true);
  }}
  disabled={!selectedCount || isBusy}
>
  ปฏิเสธ ({selectedCount})
</button>
```

- [ ] **Step 4: Add bulk verify modal**

Add before the closing `</div>` of the page:

```tsx
{bulkVerifyOpen && selectedCount > 0 ? (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h3 className={styles.modalTitle}>
        ยืนยันการตรวจสอบ {selectedCount} รายการ
      </h3>
      <label className={styles.field}>
        <span>หมายเหตุถึงนักศึกษา (ไม่บังคับ)</span>
        <textarea
          className={styles.textarea}
          rows={4}
          value={bulkVerifyNote}
          onChange={(e) => setBulkVerifyNote(e.target.value)}
          placeholder="ระบุหมายเหตุเพิ่มเติม"
        />
      </label>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.button}
          onClick={() => setBulkVerifyOpen(false)}
          disabled={isBusy}
        >
          ยกเลิก
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => void submitBulkVerify()}
          disabled={isBusy}
        >
          {isBusy ? "กำลังบันทึก..." : "ยืนยัน"}
        </button>
      </div>
    </div>
  </div>
) : null}
```

- [ ] **Step 5: Add bulk reject modal**

```tsx
{bulkRejectOpen && selectedCount > 0 ? (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h3 className={styles.modalTitle}>
        ปฏิเสธคำร้อง {selectedCount} รายการ
      </h3>
      <label className={styles.field}>
        <span>เหตุผลการปฏิเสธ</span>
        <textarea
          className={styles.textarea}
          rows={4}
          value={bulkRejectReason}
          onChange={(e) => setBulkRejectReason(e.target.value)}
          placeholder="ระบุเหตุผล (อย่างน้อย 10 ตัวอักษร)"
        />
      </label>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.button}
          onClick={() => setBulkRejectOpen(false)}
          disabled={isBusy}
        >
          ยกเลิก
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonDanger}`}
          onClick={() => void submitBulkReject()}
          disabled={isBusy || bulkRejectReason.trim().length < 10}
        >
          {isBusy ? "กำลังบันทึก..." : "ปฏิเสธ"}
        </button>
      </div>
    </div>
  </div>
) : null}
```

- [ ] **Step 6: Add submit handlers**

```typescript
const submitBulkVerify = async () => {
  try {
    const results = await Promise.allSettled(
      selectedIds.map((requestId) => {
        const row = rows.find((r) => r.requestId === requestId);
        return verifyRequest.mutateAsync({
          projectId: row?.projectId ?? 0,
          defenseType,
          note: bulkVerifyNote,
        });
      }),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;
    setSelectedIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
    setBulkVerifyOpen(false);
    setFeedback({
      tone: failed > 0 ? "warning" : "success",
      message: failed > 0
        ? `สำเร็จ ${succeeded} รายการ, ล้มเหลว ${failed} รายการ`
        : `ตรวจสอบเรียบร้อยแล้ว ${succeeded} รายการ`,
    });
  } catch (error) {
    setFeedback({
      tone: "warning",
      message: error instanceof Error ? error.message : "ไม่สามารถบันทึกได้",
    });
  }
};

const submitBulkReject = async () => {
  if (bulkRejectReason.trim().length < 10) {
    setFeedback({ tone: "warning", message: "เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร" });
    return;
  }
  try {
    const results = await Promise.allSettled(
      selectedIds.map((requestId) => {
        const row = rows.find((r) => r.requestId === requestId);
        return rejectDefenseRequest.mutateAsync({
          projectId: row?.projectId ?? 0,
          defenseType,
          reason: bulkRejectReason.trim(),
        });
      }),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;
    setSelectedIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
    setBulkRejectOpen(false);
    setFeedback({
      tone: failed > 0 ? "warning" : "success",
      message: failed > 0
        ? `สำเร็จ ${succeeded} รายการ, ล้มเหลว ${failed} รายการ`
        : `ปฏิเสธเรียบร้อยแล้ว ${succeeded} รายการ`,
    });
  } catch (error) {
    setFeedback({
      tone: "warning",
      message: error instanceof Error ? error.message : "ไม่สามารถปฏิเสธได้",
    });
  }
};
```

- [ ] **Step 7: Add reject mutation to hook + service**

In `adminDefenseQueueService.ts`, add:

```typescript
export async function rejectDefenseQueueRequest(
  projectId: number,
  defenseType: DefenseType,
  reason: string,
): Promise<void> {
  const endpoint = defenseType === DEFENSE_TYPE_THESIS
    ? `/projects/${projectId}/kp03/reject`
    : `/projects/${projectId}/kp02/reject`;
  await apiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify({ reason }),
    headers: { "Content-Type": "application/json" },
  });
}
```

In `useAdminDefenseQueue.ts`, add to `useAdminDefenseQueueMutations`:

```typescript
const rejectDefenseRequest = useMutation({
  mutationFn: (payload: { projectId: number; defenseType: DefenseType; reason: string }) =>
    rejectDefenseQueueRequest(payload.projectId, payload.defenseType, payload.reason),
  onSuccess: invalidate,
});

return { verifyRequest, exportQueue, rejectDefenseRequest };
```

- [ ] **Step 8: Check/add backend reject endpoint**

Check if `POST /api/projects/:id/kp02/reject` exists in `projectRoutes.js`. If not, add it following the pattern of verify:

```javascript
// In projectRoutes.js, after the kp02/verify route:
router.post('/:id/kp02/reject',
  authenticateToken,
  authorize('project', 'kp02StaffVerify'),
  projectDefenseRequestController.rejectDefenseRequest
);
```

In `projectDefenseRequestController.js`, add:

```javascript
async rejectDefenseRequest(req, res) {
  try {
    const projectId = Number(req.params.id);
    const { reason } = req.body;
    const defenseType = resolveDefenseType(req, DEFENSE_TYPE_PROJECT1);
    await projectDefenseRequestService.rejectDefenseRequest(projectId, defenseType, reason, req.user);
    return res.json({ success: true, message: 'ปฏิเสธคำร้องเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('rejectDefenseRequest error', { error: error.message });
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
}
```

In `projectDefenseRequestService.js`, add a `rejectDefenseRequest` method that updates the defense request status back to `advisor_in_review` or `cancelled` and creates a notification. Follow existing patterns in the service.

- [ ] **Step 9: Clear selection on filter change**

Add `setSelectedIds([])` to the filter onChange handlers and the reset button.

- [ ] **Step 10: Verify build**

```bash
cd cslogbook/frontend-next && npm run build
cd cslogbook/backend && node -e "require('./app')" # smoke test
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add bulk verify/reject to defense queue pages (คพ.02/03)"
```

---

## Task 4: Bulk Actions — SystemTestStaffQueuePage

**Files:**
- Modify: `src/components/admin/project-documents/SystemTestStaffQueuePage.tsx`

**Context:** Add bulk approve/reject to system test queue. Follow exact same pattern as Task 3. Only rows with `status === "pending_staff"` are selectable. Uses existing `submitDecision` mutation with `decision: "approve" | "reject"`.

- [ ] **Step 1: Add selection state**

Same pattern as Task 3 Step 1 but with `canSelectRow`:

```typescript
function canSelectRow(row: AdminSystemTestQueueRecord): boolean {
  return row.status === "pending_staff";
}
```

- [ ] **Step 2: Add checkbox column to table**

Same pattern as Task 3 Step 2. Update colSpan from 6 to 7.

- [ ] **Step 3: Add bulk action buttons**

```tsx
<button
  type="button"
  className={`${styles.button} ${styles.buttonPrimary}`}
  onClick={() => { setBulkApproveNote(""); setBulkApproveOpen(true); }}
  disabled={!selectedCount || isBusy}
>
  อนุมัติ ({selectedCount})
</button>
<button
  type="button"
  className={`${styles.button} ${styles.buttonDanger}`}
  onClick={() => { setBulkRejectNote(""); setBulkRejectOpen(true); }}
  disabled={!selectedCount || isBusy}
>
  ส่งกลับ ({selectedCount})
</button>
```

- [ ] **Step 4: Add bulk approve modal + submit handler**

Modal with optional note textarea. Submit calls existing `submitDecision.mutateAsync` per item:

```typescript
const submitBulkApprove = async () => {
  try {
    const results = await Promise.allSettled(
      selectedIds.map((requestId) => {
        const row = rows.find((r) => r.requestId === requestId);
        return submitDecision.mutateAsync({
          projectId: row?.projectId ?? 0,
          decision: "approve",
          note: bulkApproveNote,
        });
      }),
    );
    // ... same partial success pattern as Task 3
  } catch (error) { /* ... */ }
};
```

- [ ] **Step 5: Add bulk reject modal + submit handler**

Same pattern with `decision: "reject"`.

- [ ] **Step 6: Clear selection on filter change**

- [ ] **Step 7: Verify build + Commit**

```bash
git commit -m "feat: add bulk approve/reject to system test staff queue"
```

---

## Task 5: Bulk Actions — Certificates Page

**Files:**
- Modify: `src/app/(app)/admin/documents/certificates/page.tsx`

**Context:** Add bulk approve (per-item certificate number input, like internship bulk review pattern) + bulk reject. Only rows with `status === "pending"` are selectable.

- [ ] **Step 1: Add selection state**

```typescript
const [selectedIds, setSelectedIds] = useState<number[]>([]);
const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
const [bulkApproveIds, setBulkApproveIds] = useState<number[]>([]);
const [certNumbers, setCertNumbers] = useState<Record<number, string>>({});
const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
const [bulkRejectReason, setBulkRejectReason] = useState("");

function canSelectRow(row: AdminCertificateRequest): boolean {
  return row.status === "pending";
}
```

- [ ] **Step 2: Add checkbox column + toggle functions**

Same pattern as Tasks 3-4.

- [ ] **Step 3: Add bulk approve modal with per-item cert numbers**

Pattern from internship page bulk review — scrollable list with an input per item:

```tsx
{bulkApproveOpen && bulkApproveIds.length > 0 ? (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h3 className={styles.modalTitle}>
        อนุมัติใบรับรอง {bulkApproveIds.length} รายการ
      </h3>
      <p className={styles.subText}>กรอกเลขที่ใบรับรองสำหรับแต่ละรายการ</p>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {bulkApproveIds.map((id) => {
          const row = rows.find((r) => r.requestId === id);
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span className={styles.subText} style={{ minWidth: 140 }}>
                {row?.studentCode || "-"} {row?.fullName || "-"}
              </span>
              <input
                className={styles.input}
                style={{ width: 180 }}
                placeholder="เลขที่ใบรับรอง"
                value={certNumbers[id] || ""}
                onChange={(e) =>
                  setCertNumbers((prev) => ({ ...prev, [id]: e.target.value }))
                }
              />
            </div>
          );
        })}
      </div>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.button} onClick={() => setBulkApproveOpen(false)} disabled={isBusy}>
          ยกเลิก
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => void submitBulkApprove()}
          disabled={isBusy || !bulkApproveIds.every((id) => (certNumbers[id] || "").trim().length > 0)}
        >
          {isBusy ? "กำลังอนุมัติ..." : "อนุมัติทั้งหมด"}
        </button>
      </div>
    </div>
  </div>
) : null}
```

- [ ] **Step 4: Add bulk reject modal**

Single textarea for shared reason (same as Task 3).

- [ ] **Step 5: Add submit handlers**

```typescript
const submitBulkApprove = async () => {
  const allFilled = bulkApproveIds.every((id) => (certNumbers[id] || "").trim().length > 0);
  if (!allFilled) {
    setFeedback({ tone: "warning", message: "กรุณากรอกเลขที่ใบรับรองให้ครบทุกรายการ" });
    return;
  }
  try {
    const results = await Promise.allSettled(
      bulkApproveIds.map((id) =>
        approveRequest.mutateAsync({
          requestId: id,
          certificateNumber: certNumbers[id].trim(),
        }),
      ),
    );
    // ... partial success pattern
    setSelectedIds((prev) => prev.filter((id) => !bulkApproveIds.includes(id)));
    setBulkApproveOpen(false);
  } catch (error) { /* ... */ }
};
```

- [ ] **Step 6: Open handler for bulk approve**

```typescript
const handleBulkApprove = () => {
  const initial: Record<number, string> = {};
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  const month = String(now.getMonth() + 1).padStart(2, "0");
  selectedIds.forEach((id) => {
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    initial[id] = `ว ${buddhistYear}/${month}/${rand}`;
  });
  setCertNumbers(initial);
  setBulkApproveIds(selectedIds);
  setBulkApproveOpen(true);
};
```

- [ ] **Step 7: Verify build + Commit**

```bash
git commit -m "feat: add bulk approve/reject to certificates page"
```

---

## Task 6: Backend Export — Project Exam Results

**Files:**
- Modify: `backend/routes/projectRoutes.js`
- Modify: `backend/controllers/projectDefenseRequestController.js` (or create separate controller)
- Modify: `backend/services/projectDefenseRequestService.js` (or create separate service)

**Context:** Add `GET /api/projects/exam-results/export` endpoint using ExcelJS. Follow pattern from `topicExamController.exportOverview`.

- [ ] **Step 1: Add route**

In `projectRoutes.js`, add after existing exam-result routes:

```javascript
router.get('/exam-results/export',
  authenticateToken,
  authorize('project', 'examRecord'),
  projectDefenseRequestController.exportExamResults
);
```

- [ ] **Step 2: Add controller function**

In `projectDefenseRequestController.js`, add:

```javascript
async exportExamResults(req, res) {
  try {
    const { examType = 'PROJECT1', academicYear, semester, status, search } = req.query;
    const { buffer, filename } = await projectDefenseRequestService.exportExamResults({
      examType,
      academicYear: academicYear ? Number(academicYear) : undefined,
      semester: semester ? Number(semester) : undefined,
      status: status || undefined,
      search: search || undefined,
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    return res.send(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  } catch (error) {
    logger.error('exportExamResults error', { error: error.message });
    return res.status(error.statusCode || 400).json({ success: false, message: error.message || 'ไม่สามารถส่งออกได้' });
  }
}
```

- [ ] **Step 3: Add service function**

In `projectDefenseRequestService.js`, add:

```javascript
async exportExamResults(filters = {}) {
  const { examType = 'PROJECT1' } = filters;
  // Reuse existing pending results query
  const { rows } = await this.getExamPendingResults({ ...filters, limit: 9999, offset: 0 });

  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  const sheetName = examType === 'THESIS' ? 'ผลสอบปริญญานิพนธ์' : 'ผลสอบโครงงานพิเศษ 1';
  const ws = wb.addWorksheet(sheetName);

  ws.columns = [
    { header: 'ลำดับ', key: 'order', width: 8 },
    { header: 'รหัสโครงงาน', key: 'code', width: 15 },
    { header: 'ชื่อโครงงาน (ไทย)', key: 'nameTh', width: 45 },
    { header: 'ชื่อโครงงาน (อังกฤษ)', key: 'nameEn', width: 45 },
    { header: 'สมาชิก', key: 'members', width: 40 },
    { header: 'อาจารย์ที่ปรึกษา', key: 'advisor', width: 25 },
    { header: 'ผลสอบ', key: 'result', width: 12 },
    { header: 'คะแนน', key: 'score', width: 10 },
    { header: 'หมายเหตุ', key: 'notes', width: 30 },
    { header: 'วันที่บันทึก', key: 'recordedAt', width: 20 },
  ];

  rows.forEach((row, idx) => {
    const members = (row.members || [])
      .map(m => `${m.studentCode || '-'} ${m.name || ''}`.trim())
      .join('\n');
    const examResult = row.examResult;
    ws.addRow({
      order: idx + 1,
      code: row.projectCode || '-',
      nameTh: row.projectNameTh || '-',
      nameEn: row.projectNameEn || '-',
      members: members || '-',
      advisor: row.advisor?.name || '-',
      result: examResult?.result === 'PASS' ? 'ผ่าน' : examResult?.result === 'FAIL' ? 'ไม่ผ่าน' : 'รอบันทึก',
      score: examResult?.score ?? '-',
      notes: examResult?.notes || '-',
      recordedAt: examResult?.recordedAt || '-',
    });
  });

  ws.getRow(1).font = { bold: true };
  ws.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true }; });

  const buffer = await wb.xlsx.writeBuffer();
  const prefix = examType === 'THESIS' ? 'ผลสอบปริญญานิพนธ์' : 'ผลสอบโครงงานพิเศษ1';
  return { buffer, filename: `${prefix}_${Date.now()}.xlsx` };
}
```

**Note:** Verify `getExamPendingResults` method exists and accepts these filter params. If the method name differs, use the correct one by reading the service file.

- [ ] **Step 4: Test endpoint manually**

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:5000/api/projects/exam-results/export?examType=PROJECT1" --output test.xlsx
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add XLSX export endpoint for project exam results"
```

---

## Task 7: Backend Export — System Test

**Files:**
- Modify: `backend/routes/projectRoutes.js`
- Modify or create: `backend/controllers/systemTestController.js`

**Context:** Add `GET /api/projects/system-test/staff-queue/export` endpoint.

- [ ] **Step 1: Add route**

```javascript
router.get('/system-test/staff-queue/export',
  authenticateToken,
  authorize('project', 'systemTestStaffQueue'),
  systemTestController.exportStaffQueue
);
```

- [ ] **Step 2: Add controller + service**

Follow same ExcelJS pattern as Task 6. Columns:

```javascript
ws.columns = [
  { header: 'ลำดับ', key: 'order', width: 8 },
  { header: 'รหัสโครงงาน', key: 'code', width: 15 },
  { header: 'ชื่อโครงงาน', key: 'name', width: 45 },
  { header: 'ผู้ยื่นคำขอ', key: 'submitter', width: 30 },
  { header: 'ช่วงทดสอบ', key: 'testPeriod', width: 30 },
  { header: 'สถานะ', key: 'status', width: 20 },
  { header: 'วันที่ยื่น', key: 'submittedAt', width: 20 },
];
```

- [ ] **Step 3: Test + Commit**

```bash
git commit -m "feat: add XLSX export endpoint for system test queue"
```

---

## Task 8: Backend Export — Internship Documents

**Files:**
- Modify: `backend/routes/adminRoutes.js`
- Modify: `backend/controllers/adminDocumentController.js`

**Context:** Add `GET /api/admin/documents/export` endpoint for internship documents.

- [ ] **Step 1: Add route**

In `adminRoutes.js`:

```javascript
router.get('/documents/export', adminAuth, documentController.exportDocuments);
```

- [ ] **Step 2: Add controller function**

Columns:

```javascript
ws.columns = [
  { header: 'ลำดับ', key: 'order', width: 8 },
  { header: 'ประเภทเอกสาร', key: 'docType', width: 25 },
  { header: 'รหัสนักศึกษา', key: 'studentCode', width: 15 },
  { header: 'ชื่อ-นามสกุล', key: 'studentName', width: 30 },
  { header: 'บริษัท', key: 'company', width: 35 },
  { header: 'สถานะ', key: 'status', width: 15 },
  { header: 'เลขที่ อว.', key: 'officialNumber', width: 20 },
  { header: 'วันที่ส่ง', key: 'submittedAt', width: 20 },
];
```

- [ ] **Step 3: Test + Commit**

```bash
git commit -m "feat: add XLSX export endpoint for internship documents"
```

---

## Task 9: Backend Export — Certificate Requests

**Files:**
- Modify: `backend/routes/adminRoutes.js`
- Modify: `backend/controllers/adminCertificateController.js`

**Context:** Add `GET /api/admin/certificate-requests/export` endpoint.

- [ ] **Step 1: Add route**

```javascript
router.get('/certificate-requests/export', adminAuth, documentController.exportCertificateRequests);
```

- [ ] **Step 2: Add controller function**

Columns:

```javascript
ws.columns = [
  { header: 'ลำดับ', key: 'order', width: 8 },
  { header: 'รหัสนักศึกษา', key: 'studentCode', width: 15 },
  { header: 'ชื่อ-นามสกุล', key: 'fullName', width: 30 },
  { header: 'บริษัท', key: 'company', width: 35 },
  { header: 'ชั่วโมงฝึกงาน', key: 'totalHours', width: 15 },
  { header: 'คะแนนรวม', key: 'score', width: 15 },
  { header: 'สถานะ', key: 'status', width: 15 },
  { header: 'วันที่ขอ', key: 'requestedAt', width: 20 },
];
```

- [ ] **Step 3: Test + Commit**

```bash
git commit -m "feat: add XLSX export endpoint for certificate requests"
```

---

## Task 10: Frontend Export Wiring (4 pages)

**Depends on:** Tasks 6-9 (backend endpoints must exist)

**Files:**
- Modify: `src/lib/services/adminProjectExamResultService.ts`
- Modify: `src/lib/services/adminSystemTestService.ts`
- Modify: `src/lib/services/adminInternshipDocumentsService.ts`
- Modify: `src/lib/services/adminInternshipCertificatesService.ts`
- Modify: `src/hooks/useAdminProjectExamResults.ts`
- Modify: `src/hooks/useAdminSystemTestQueue.ts`
- Modify: `src/hooks/useAdminInternshipDocuments.ts`
- Modify: `src/hooks/useAdminInternshipCertificates.ts`
- Modify: `src/components/admin/project-documents/AdminProjectExamResultsPage.tsx`
- Modify: `src/components/admin/project-documents/SystemTestStaffQueuePage.tsx`
- Modify: `src/app/(app)/admin/documents/internship/page.tsx`
- Modify: `src/app/(app)/admin/documents/certificates/page.tsx`

**Context:** Wire up frontend export buttons to backend endpoints. Follow the existing pattern from `adminTopicExamService.ts` `exportAdminTopicExamOverview` and `adminDefenseQueueService.ts` `exportDefenseQueue`.

- [ ] **Step 1: Add shared download helper**

Check if a shared blob download utility exists. If not, add to each service file this pattern (from existing `adminTopicExamService.ts`):

```typescript
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function extractFilename(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = header.match(/filename[^;=\n]*=(['"]*)(.*?)\1/);
  if (match?.[2]) return decodeURIComponent(match[2]);
  return fallback;
}
```

- [ ] **Step 2: Add export service functions (4 files)**

In each service file, add an export function following this template:

```typescript
// adminProjectExamResultService.ts
export async function exportAdminProjectExamResults(
  examType: AdminExamType,
  filters: AdminProjectExamFilters = {},
): Promise<void> {
  const params = new URLSearchParams();
  params.set("examType", examType);
  if (filters.status) params.set("status", filters.status);
  if (filters.academicYear) params.set("academicYear", String(filters.academicYear));
  if (filters.semester) params.set("semester", String(filters.semester));
  if (filters.search) params.set("search", filters.search);

  const token = localStorage.getItem("cslogbook:auth-token");
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/projects/exam-results/export?${params}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  if (!response.ok) throw new Error("Export failed");
  const blob = await response.blob();
  const filename = extractFilename(
    response.headers.get("content-disposition"),
    `ผลสอบ_${Date.now()}.xlsx`,
  );
  downloadBlob(blob, filename);
}
```

Repeat for system test, internship docs, and certificates with appropriate endpoints and parameter names.

- [ ] **Step 3: Add export mutations (4 hooks)**

In each hook file, add an export mutation:

```typescript
// useAdminProjectExamResults.ts — add to useAdminProjectExamMutations
const exportResults = useMutation({
  mutationFn: (payload: { examType: AdminExamType; filters: AdminProjectExamFilters }) =>
    exportAdminProjectExamResults(payload.examType, payload.filters),
});

return { recordExamResult, updateFinalDocumentStatus, exportResults };
```

Repeat for the other 3 hooks.

- [ ] **Step 4: Add export buttons (4 pages)**

In each component, add a "ส่งออก Excel" button in the header `buttonRow`:

```tsx
<button
  type="button"
  className={`${styles.button} ${styles.buttonPrimary}`}
  onClick={() => void exportResults.mutateAsync({ examType, filters })}
  disabled={exportResults.isPending}
>
  {exportResults.isPending ? "กำลังส่งออก..." : "ส่งออก Excel"}
</button>
```

- [ ] **Step 5: Verify build**

```bash
cd cslogbook/frontend-next && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add XLSX export buttons to exam results, system test, internship docs, and certificates pages"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] All 8 admin pages load without errors
- [ ] Exam results pages show drawer (not inline expand)
- [ ] All pages default to "pending/waiting" status filter
- [ ] Status labels are consistent (ผ่าน/ไม่ผ่าน, อนุมัติแล้ว, รอตรวจสอบ)
- [ ] Bulk select works on: defense queue, system test, certificates
- [ ] Bulk verify/approve/reject modals function correctly
- [ ] Export XLSX downloads on all 8 pages
- [ ] `npm run build` passes with no TypeScript errors
