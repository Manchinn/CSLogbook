# Official Document Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้เจ้าหน้าที่กำหนดเลข 3 ตัวท้ายของ "เลขที่อว." ตอน review เอกสาร แล้วนำไปใช้ใน PDF หนังสือขอความอนุเคราะห์และหนังสือส่งตัว

**Architecture:** เพิ่ม column `official_number` ใน `documents` table, แก้ reviewByStaff controllers ทั้ง CS05 + ACCEPTANCE_LETTER ให้รับ + validate + save, แก้ PDF services ให้ใช้ official_number แทน documentId, เพิ่ม modal ในหน้า admin

**Tech Stack:** Sequelize migration, Express controllers, PDFKit, Next.js/React/TanStack Query

**Spec:** `docs/superpowers/specs/2026-03-19-official-number-design.md`

---

### Task 1: Database — Migration + Model

**Files:**
- Create: `cslogbook/backend/migrations/20260319120000-add-official-number-to-documents.js`
- Modify: `cslogbook/backend/models/Document.js`

- [ ] **Step 1: Create migration file**

```js
// cslogbook/backend/migrations/20260319120000-add-official-number-to-documents.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("documents", "official_number", {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: null,
      after: "review_comment",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("documents", "official_number");
  },
};
```

- [ ] **Step 2: Add field to Document model**

In `cslogbook/backend/models/Document.js`, add after `reviewComment` field (after line 81):

```js
officialNumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'official_number',
},
```

- [ ] **Step 3: Run migration**

Run: `cd cslogbook/backend && npx sequelize-cli db:migrate`
Expected: Migration runs successfully, `official_number` column added

- [ ] **Step 4: Commit**

```bash
git add cslogbook/backend/migrations/20260319120000-add-official-number-to-documents.js cslogbook/backend/models/Document.js
git commit -m "feat: add official_number column to documents table"
```

---

### Task 2: Backend — CS05 Controller (reviewByStaff)

**Files:**
- Modify: `cslogbook/backend/controllers/documents/cp05ApprovalController.js:114-148`

- [ ] **Step 1: Add officialNumber to reviewByStaff**

In `cp05ApprovalController.js`, modify `exports.reviewByStaff`:

```js
// line 116: เพิ่ม officialNumber
const { comment, officialNumber } = req.body || {};

// เพิ่มหลัง line 117 (ก่อน loadCS05): validate officialNumber
if (!officialNumber || !/^\d{1,3}$/.test(String(officialNumber))) {
  return res.status(400).json({
    success: false,
    message: 'กรุณาระบุเลขที่เอกสาร (ตัวเลข 1-3 หลัก)',
  });
}

// line 131-136: เพิ่ม official_number ใน doc.update
await doc.update({
  status: 'pending',
  reviewerId: req.user.userId,
  reviewDate: new Date(),
  reviewComment: comment || null,
  officialNumber: officialNumber,  // เพิ่ม
});
```

- [ ] **Step 2: Commit**

```bash
git add cslogbook/backend/controllers/documents/cp05ApprovalController.js
git commit -m "feat: accept officialNumber in CS05 reviewByStaff"
```

---

### Task 3: Backend — Acceptance Controller (reviewByStaff)

**Files:**
- Modify: `cslogbook/backend/controllers/documents/acceptanceApprovalController.js:147-178`

- [ ] **Step 1: Add officialNumber to reviewByStaff**

Same pattern as Task 2. In `acceptanceApprovalController.js`, modify `exports.reviewByStaff`:

```js
// line 150: เพิ่ม officialNumber
const { comment, officialNumber } = req.body || {};

// validate
if (!officialNumber || !/^\d{1,3}$/.test(String(officialNumber))) {
  return res.status(400).json({
    success: false,
    message: 'กรุณาระบุเลขที่เอกสาร (ตัวเลข 1-3 หลัก)',
  });
}

// line 158-163: เพิ่ม officialNumber ใน doc.update
await doc.update({
  status: 'pending',
  reviewerId: req.user.userId,
  reviewDate: new Date(),
  reviewComment: comment || null,
  officialNumber: officialNumber,  // เพิ่ม
});
```

- [ ] **Step 2: Commit**

```bash
git add cslogbook/backend/controllers/documents/acceptanceApprovalController.js
git commit -m "feat: accept officialNumber in acceptance reviewByStaff"
```

---

### Task 4: Backend — Cooperation Letter PDF

**Files:**
- Modify: `cslogbook/backend/services/internship/cooperationLetter.service.js:100`

- [ ] **Step 1: Use official_number in PDF**

In `cooperationLetter.service.js`, line 100 — change `documentNumber` in `pdfData`:

```js
// เดิม:
documentNumber: `CS05/${buddhistYear}/${documentId}`,

// เปลี่ยนเป็น:
documentNumber: cs05Document.officialNumber
  ? `อว 7105(05)/${cs05Document.officialNumber}`
  : `CS05/${buddhistYear}/${documentId}`,
```

- [ ] **Step 2: Commit**

```bash
git add cslogbook/backend/services/internship/cooperationLetter.service.js
git commit -m "feat: use official_number in cooperation letter PDF"
```

---

### Task 5: Backend — Referral Letter PDF

**Files:**
- Modify: `cslogbook/backend/services/internship/referralLetter.service.js:195-203,234`

- [ ] **Step 1: Use official_number from acceptanceLetter**

In `referralLetter.service.js`, the `acceptanceLetter` variable is already fetched at line 195-203. Change line 234 in the `data` object:

```js
// เดิม (line 234):
docNumber: `${documentId}`,

// เปลี่ยนเป็น:
docNumber: acceptanceLetter.officialNumber || `${documentId}`,
```

Line 303 (`pdf.text(...)`) ไม่ต้องแก้เพราะใช้ `data.docNumber` อยู่แล้ว

- [ ] **Step 2: Commit**

```bash
git add cslogbook/backend/services/internship/referralLetter.service.js
git commit -m "feat: use official_number in referral letter PDF"
```

---

### Task 6: Frontend — Service + Hook

**Files:**
- Modify: `cslogbook/frontend-next/src/lib/services/adminInternshipDocumentsService.ts:220-242`
- Modify: `cslogbook/frontend-next/src/hooks/useAdminInternshipDocuments.ts:57-68`

- [ ] **Step 1: Add officialNumber param to service function**

In `adminInternshipDocumentsService.ts`, modify `reviewInternshipDocumentByStaff` (line 220):

```ts
export async function reviewInternshipDocumentByStaff(
  documentId: number,
  documentName?: string,
  comment?: string,
  officialNumber?: string,
) {
  const normalizedName = (documentName ?? "").toUpperCase();
  const body = { comment: comment ?? null, officialNumber: officialNumber ?? null };

  if (normalizedName === "CS05") {
    return apiFetch(`/internship/cs-05/${documentId}/review`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  if (normalizedName === "ACCEPTANCE_LETTER") {
    return apiFetch(`/internship/acceptance/${documentId}/review`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  return apiFetch(`/admin/documents/${documentId}/approve`, {
    method: "POST",
  });
}
```

- [ ] **Step 2: Add officialNumber to mutation hook**

In `useAdminInternshipDocuments.ts`, modify `reviewMutation` (line 57-68):

```ts
const reviewMutation = useMutation({
  mutationFn: ({
    documentId,
    documentName,
    comment,
    officialNumber,
  }: {
    documentId: number;
    documentName?: string;
    comment?: string;
    officialNumber?: string;
  }) => reviewInternshipDocumentByStaff(documentId, documentName, comment, officialNumber),
  onSuccess: invalidate,
});
```

- [ ] **Step 3: Commit**

```bash
git add cslogbook/frontend-next/src/lib/services/adminInternshipDocumentsService.ts cslogbook/frontend-next/src/hooks/useAdminInternshipDocuments.ts
git commit -m "feat: add officialNumber param to review service and hook"
```

---

### Task 7: Frontend — Review Modal with Official Number Input

**Files:**
- Modify: `cslogbook/frontend-next/src/app/(app)/admin/documents/internship/page.tsx`

- [ ] **Step 1: Add state for review modal**

Add these state variables after the existing state declarations (after line 76):

```tsx
const [reviewModalOpen, setReviewModalOpen] = useState(false);
const [reviewIds, setReviewIds] = useState<number[]>([]);
const [officialNumbers, setOfficialNumbers] = useState<Record<number, string>>({});
```

- [ ] **Step 2: Add review modal open handlers**

Replace `handleBulkReview` (line 160-180) and `handleSingleReview` (line 223-233):

```tsx
const handleBulkReview = () => {
  if (!selectedIds.length) return;
  const initial: Record<number, string> = {};
  selectedIds.forEach((id) => { initial[id] = ""; });
  setOfficialNumbers(initial);
  setReviewIds(selectedIds);
  setReviewModalOpen(true);
};

const handleSingleReview = (document: AdminInternshipDocument) => {
  setOfficialNumbers({ [document.id]: "" });
  setReviewIds([document.id]);
  setReviewModalOpen(true);
};
```

- [ ] **Step 3: Add submit review handler**

Add after the handlers above:

```tsx
const submitReview = async () => {
  // Client-side validate ทุกรายการก่อน submit
  const allValid = reviewIds.every((id) => /^\d{1,3}$/.test(officialNumbers[id] ?? ""));
  if (!allValid) {
    setFeedback({ tone: "warning", message: "กรุณากรอกเลขที่เอกสาร (ตัวเลข 1-3 หลัก) ให้ครบทุกรายการ" });
    return;
  }

  try {
    const results = await Promise.allSettled(
      reviewIds.map((documentId) => {
        const row = rows.find((item) => item.id === documentId);
        return reviewDocument.mutateAsync({
          documentId,
          documentName: row?.documentName,
          officialNumber: officialNumbers[documentId],
        });
      }),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;

    setSelectedIds((prev) => prev.filter((id) => !reviewIds.includes(id)));
    setReviewModalOpen(false);
    setReviewIds([]);
    setOfficialNumbers({});

    if (failed > 0) {
      setFeedback({ tone: "warning", message: `สำเร็จ ${succeeded} รายการ, ล้มเหลว ${failed} รายการ` });
    } else {
      setFeedback({ tone: "success", message: "ตรวจและส่งต่อเอกสารเรียบร้อยแล้ว" });
    }
  } catch (error) {
    setFeedback({
      tone: "warning",
      message: error instanceof Error ? error.message : "ไม่สามารถตรวจและส่งต่อเอกสารได้",
    });
  }
};
```

- [ ] **Step 4: Add review modal JSX**

Add before the closing `</div>` of the page (before `</RoleGuard>`), after the reject modal:

```tsx
{reviewModalOpen ? (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h3 className={styles.modalTitle}>ระบุเลขที่เอกสาร (อว.)</h3>
      <p className={styles.subText}>
        กรอกเลข 3 ตัวท้ายของเลขที่ อว 7105(05)/XXX สำหรับเอกสาร {reviewIds.length} รายการ
      </p>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {reviewIds.map((id) => {
          const row = rows.find((item) => item.id === id);
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ flex: 1, fontSize: 14 }}>
                {row?.studentName || "-"} ({documentNameLabel(row?.documentName)})
              </span>
              <input
                className={styles.input}
                style={{ width: 100 }}
                placeholder="เลข 3 หลัก"
                maxLength={3}
                value={officialNumbers[id] ?? ""}
                onChange={(e) =>
                  setOfficialNumbers((prev) => ({ ...prev, [id]: e.target.value.replace(/\D/g, "").slice(0, 3) }))
                }
              />
            </div>
          );
        })}
      </div>
      <div className={btn.buttonRow} style={{ marginTop: 12 }}>
        <button
          type="button"
          className={btn.button}
          onClick={() => {
            if (isBulkBusy) return;
            setReviewModalOpen(false);
          }}
        >
          ยกเลิก
        </button>
        <button
          type="button"
          className={`${btn.button} ${btn.buttonPrimary}`}
          onClick={submitReview}
          disabled={isBulkBusy}
        >
          ยืนยันส่งต่อ
        </button>
      </div>
    </div>
  </div>
) : null}
```

- [ ] **Step 5: Commit**

```bash
git add cslogbook/frontend-next/src/app/(app)/admin/documents/internship/page.tsx
git commit -m "feat: add review modal with official number input"
```

---

### Task 8: Verification

- [ ] **Step 1: Run backend (check no startup errors)**

Run: `cd cslogbook/backend && node -e "require('./models')"`
Expected: No errors

- [ ] **Step 2: Run frontend lint**

Run: `cd cslogbook/frontend-next && npx next lint`
Expected: No new errors

- [ ] **Step 3: Run frontend build**

Run: `cd cslogbook/frontend-next && npx next build`
Expected: Build succeeds

- [ ] **Step 4: Final commit (if any lint fixes needed)**
