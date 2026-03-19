# Official Document Number (เลขที่อว. 3 ตัวท้าย)

## Problem

เอกสารราชการ (หนังสือขอความอนุเคราะห์, หนังสือส่งตัว) ต้องมีเลขที่เอกสารในรูปแบบ `อว 7105(05)/XXX` โดย XXX คือเลขที่เอกสารราชการจริง ปัจจุบันระบบใช้ `documentId` (auto-increment) ซึ่งไม่ใช่เลขที่ราชการจริง ต้องการให้เจ้าหน้าที่ภาควิชาเป็นคนกำหนดเลข 3 ตัวท้ายนี้ได้ ตอนขั้นตอน review (ตรวจและส่งต่อ)

## Scope

- เจ้าหน้าที่กำหนดเลข 3 ตัวท้ายตอน reviewByStaff
- ใช้กับเอกสาร 2 ประเภท: CS05 (หนังสือขอความอนุเคราะห์) และ ACCEPTANCE_LETTER (หนังสือส่งตัว)
- เลขที่นี้ใช้ใน PDF ที่ generate ออกมา

## Design

### 1. Database

เพิ่ม column `official_number` ใน `documents` table:

```sql
ALTER TABLE documents ADD COLUMN official_number VARCHAR(10) NULL AFTER review_comment;
```

- VARCHAR(10) — รองรับเลข 3 หลัก + buffer สำหรับอนาคต
- NULL — backward compatible กับเอกสารเดิม

### 2. Backend — Controllers

#### cp05ApprovalController.js — reviewByStaff

```js
// เพิ่มรับ officialNumber จาก req.body
const { comment, officialNumber } = req.body || {};

// Validate: ตัวเลข 1-3 หลัก, required สำหรับ CS05
if (!officialNumber || !/^\d{1,3}$/.test(officialNumber)) {
  return res.status(400).json({
    success: false,
    message: 'กรุณาระบุเลขที่เอกสาร (ตัวเลข 1-3 หลัก)'
  });
}

await doc.update({
  status: 'pending',
  reviewerId: req.user.userId,
  reviewDate: new Date(),
  reviewComment: comment || null,
  official_number: officialNumber  // เพิ่ม
});
```

#### acceptanceApprovalController.js — reviewByStaff

เหมือนกัน — รับ `officialNumber`, validate, save ลง `official_number`

### 3. Backend — PDF Services

#### referralLetter.service.js (หนังสือส่งตัว)

บรรทัด 234 & 303 — เปลี่ยนจาก `documentId` เป็น `official_number`:

```js
// เตรียมข้อมูล
const docNumber = cs05Document.official_number || `${documentId}`;

// ใน PDF
pdf.text(`ที่ อว 7105(05)/${docNumber}`, ML, y, { lineBreak: false });
```

หมายเหตุ: หนังสือส่งตัว generate จาก CS05 document → ต้องดึง `official_number` จาก CS05 ที่ linked

#### cooperationLetter.service.js (หนังสือขอความอนุเคราะห์)

บรรทัด 100 — เปลี่ยนเหมือนกัน:

```js
documentNumber: doc.official_number || `CS05/${buddhistYear}/${documentId}`,
```

### 4. Frontend

#### adminInternshipDocumentsService.ts

เพิ่ม parameter `officialNumber` ใน `reviewInternshipDocumentByStaff`:

```ts
export async function reviewInternshipDocumentByStaff(
  documentId: number,
  documentName?: string,
  comment?: string,
  officialNumber?: string  // เพิ่ม
) {
  const body = { comment: comment ?? null, officialNumber };
  // ... ส่งไป review API
}
```

#### useAdminInternshipDocuments.ts

เพิ่ม `officialNumber` ใน mutation type:

```ts
const reviewMutation = useMutation({
  mutationFn: ({
    documentId,
    documentName,
    comment,
    officialNumber,  // เพิ่ม
  }: {
    documentId: number;
    documentName?: string;
    comment?: string;
    officialNumber?: string;  // เพิ่ม
  }) => reviewInternshipDocumentByStaff(documentId, documentName, comment, officialNumber),
  onSuccess: invalidate,
});
```

#### page.tsx — Admin Documents Internship

เพิ่ม modal สำหรับกรอกเลขที่อว. ก่อน review:

- เมื่อกด "ตรวจและส่งต่อ" (ทั้ง single และ bulk) → เปิด modal
- Modal มี input สำหรับกรอกเลขที่ 3 ตัวท้าย
- Validate: ตัวเลข 1-3 หลัก, required
- กด "ยืนยัน" → เรียก reviewDocument พร้อม officialNumber

**Bulk review:**
- สำหรับ bulk เลือกหลายรายการ เจ้าหน้าที่ต้องกรอกเลขที่ทีละรายการ (เพราะแต่ละเอกสารมีเลขที่ต่างกัน)
- แสดง list ในModal ให้กรอก เลขที่ข้างๆ ชื่อนักศึกษาแต่ละคน

### 5. Document Model

เพิ่ม field `official_number` ใน model definition:

```js
official_number: {
  type: DataTypes.STRING(10),
  allowNull: true,
  field: 'official_number',
},
```

## Data Flow

```
เจ้าหน้าที่กด "ตรวจและส่งต่อ"
→ Modal เปิด: กรอกเลขที่อว. 3 ตัวท้าย (เช่น "047")
→ POST /internship/cs-05/:id/review { officialNumber: "047" }
→ Document.official_number = "047"
→ ตอน generate PDF: "ที่ อว 7105(05)/047"
```

## Backward Compatibility

- `official_number` เป็น nullable → เอกสารเดิมไม่กระทบ
- PDF fallback ใช้ `documentId` ถ้า `official_number` เป็น null
- ไม่แก้ API response structure ที่มีอยู่

## Files to Modify

| File | Change |
|---|---|
| `backend/models/Document.js` | เพิ่ม `official_number` field |
| `backend/migrations/XXXXXX-add-official-number.js` | Migration ใหม่ |
| `backend/controllers/documents/cp05ApprovalController.js` | รับ + validate + save `officialNumber` |
| `backend/controllers/documents/acceptanceApprovalController.js` | เหมือนกัน |
| `backend/services/internship/referralLetter.service.js` | ใช้ `official_number` ใน PDF |
| `backend/services/internship/cooperationLetter.service.js` | ใช้ `official_number` ใน PDF |
| `frontend-next/src/lib/services/adminInternshipDocumentsService.ts` | เพิ่ม param |
| `frontend-next/src/hooks/useAdminInternshipDocuments.ts` | เพิ่ม param ใน mutation |
| `frontend-next/src/app/(app)/admin/documents/internship/page.tsx` | เพิ่ม modal กรอกเลข |
