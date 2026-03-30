# Export Consolidation — Design Spec

**Date:** 2026-03-30
**Goal:** Consolidate all export functionality to Excel (XLSX) only, eliminate CSV exports, reduce code duplication via shared utilities on both backend and frontend.

---

## Problem Statement

ระบบ export ปัจจุบันมีปัญหา:

1. **Code duplication** — Backend: แต่ละ controller สร้าง ExcelJS workbook เอง (~30 lines ซ้ำต่อ export) รวมถึง header styling, response headers, error handling. Frontend: `extractFileName()` + token resolution + blob download ถูก copy-paste ใน 3+ service files
2. **Mixed formats** — Excel (6 exports) + CSV backend (3 endpoints ไม่มี frontend ใช้) + CSV client-side (5 pages) รวม 14 exports ที่ไม่มี consistency
3. **Dead code** — Backend `?format=csv` branches ใน reportController.js ไม่มี frontend เรียกใช้
4. **Inconsistencies** — Error handling ต่างกัน (บาง controller เช็ค `headersSent`, บางตัวใช้ `next(err)`), filter passing ต่างกัน, header styling ต่างกัน

## Scope

### In Scope

- สร้าง shared `ExcelExportBuilder` class (backend)
- สร้าง shared `downloadExcelFile()` utility (frontend)
- Refactor 6 existing Excel exports ใช้ Builder
- สร้าง 5 backend endpoints ใหม่ แทน 5 หน้า report ที่เคย export CSV client-side
- Refactor 6 frontend service files ใช้ `downloadExcelFile()`
- เพิ่ม 5 frontend service functions ใหม่สำหรับ report endpoints
- ลบ CSV export code ทั้งหมด (utilities, `?format=csv` branches, client-side CSV)

### Out of Scope

- CSV template สำหรับ import (keep as-is)
- `csv-parser` package และ `csvParser.js` (ใช้สำหรับ upload)
- เพิ่ม export ใหม่ที่ยังไม่มี
- เปลี่ยน Excel formatting/styling (ใช้ bold header เหมือนเดิม)

---

## Design

### 1. Backend — `ExcelExportBuilder` (Builder Pattern)

**ไฟล์:** `backend/utils/excelExportBuilder.js`

```js
const ExcelJS = require('exceljs');

class ExcelExportBuilder {
  constructor(filenamePrefix) {
    this.workbook = new ExcelJS.Workbook();
    this.filenamePrefix = filenamePrefix;
    this.headerStyle = { font: { bold: true } };
  }

  addSheet(name, columns, rows) {
    const ws = this.workbook.addWorksheet(name);
    ws.columns = columns;
    ws.addRows(rows);
    const headerRow = ws.getRow(1);
    Object.assign(headerRow.font, this.headerStyle.font);
    if (this.headerStyle.fill) headerRow.fill = this.headerStyle.fill;
    headerRow.alignment = { vertical: 'middle', wrapText: true };
    return this;
  }

  setHeaderStyle({ bold, fill }) {
    this.headerStyle = {
      font: { bold: bold ?? true },
      fill: fill
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
        : undefined,
    };
    return this;
  }

  get filename() {
    if (!this._filename) {
      this._filename = `${this.filenamePrefix}_${Date.now()}.xlsx`;
    }
    return this._filename;
  }

  async sendResponse(res) {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(this.filename)}`
    );
    await this.workbook.xlsx.write(res);
    res.end();
  }

  async toBuffer() {
    return this.workbook.xlsx.writeBuffer();
  }
}

module.exports = { ExcelExportBuilder };
```

**Usage pattern ใน controller:**

```js
const { ExcelExportBuilder } = require('../../utils/excelExportBuilder');

// Before: ~30 lines inline ExcelJS
// After: 3-4 lines
await new ExcelExportBuilder('เอกสารฝึกงาน')
  .addSheet('เอกสารฝึกงาน', columns, rows)
  .sendResponse(res);
```

**สำหรับ service ที่ต้อง return buffer:**

```js
const builder = new ExcelExportBuilder('คิวสอบป้องกัน');
builder.addSheet('คิวสอบ', columns, rows)
  .setHeaderStyle({ bold: true, fill: 'FFE0E0E0' });
const buffer = await builder.toBuffer();
return { buffer, filename: builder.filename };
```

### 2. Frontend — `downloadExcelFile` Utility

**ไฟล์:** `frontend-next/src/lib/utils/excelDownload.ts`

```ts
import { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEY } from '@/constants/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ExcelDownloadOptions {
  endpoint: string;
  params?: Record<string, string | number | undefined>;
  fallbackFilename?: string;
  token?: string;
}

export async function downloadExcelFile({
  endpoint,
  params,
  fallbackFilename = 'export.xlsx',
  token,
}: ExcelDownloadOptions): Promise<void> {
  const authToken =
    token ??
    localStorage.getItem(AUTH_TOKEN_KEY) ??
    localStorage.getItem(LEGACY_TOKEN_KEY);

  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Export failed: ${res.status}`);
  }

  const filename = extractFileName(
    res.headers.get('Content-Disposition'),
    fallbackFilename
  );

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

function extractFileName(
  contentDisposition: string | null,
  fallback: string
): string {
  if (!contentDisposition) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = /filename="?([^";\n]+)"?/i.exec(contentDisposition);
  if (plainMatch?.[1]) return plainMatch[1];
  return fallback;
}
```

**Usage pattern ใน service:**

```ts
// Before: ~35 lines (token + fetch + extractFileName + blob)
// After: 5 lines
export function exportAdminInternshipDocuments(filters: DocumentFilters) {
  return downloadExcelFile({
    endpoint: '/admin/documents/export',
    params: { type: 'internship', ...filters },
    fallbackFilename: 'เอกสารฝึกงาน.xlsx',
  });
}
```

### 3. New Backend Endpoints (5 ตัว)

แทนที่ CSV client-side exports ด้วย backend Excel endpoints:

| # | Endpoint | Data Source | Columns |
| --- | --- | --- | --- |
| 1 | `GET /reports/internships/enrolled-students/export` | `reportService.getEnrolledInternshipStudents()` | studentCode, fullName, studentYear, internshipStatus, companyName, position, supervisor, dates, logCount, hours, approvals, score, passFail, certificateStatus |
| 2 | `GET /reports/projects/export` | `reportService.getProjectStatusSummary()` | projectTitle, status, members, advisorName |
| 3 | `GET /reports/documents/pipeline/export` | `reportService.getDocumentPipeline()` | documentType, documentName, status, count |
| 4 | `GET /reports/internships/supervisors/export` | `reportService.getSupervisorReport()` | companyName, supervisorName, email, studentCount, totalLogs, approvalRates |
| 5 | `GET /admin/settings/academic/deadlines/export` | `academicDeadlineService.getAll()` | name, relatedTo, academicYear, semester, deadlineType, date, time, isCritical |

ทุก endpoint:

- ใช้ `ExcelExportBuilder`
- ต้องผ่าน `authenticateToken` + `authorize` middleware
- รับ filter params เดียวกับ GET endpoint ที่มีอยู่แล้ว (academicYear, semester ฯลฯ)
- Column headers เป็นภาษาไทย
- Status/enum values แปลเป็นภาษาไทย (เหมือนที่ frontend ทำอยู่ใน CSV)

### 4. Refactor Existing Exports (6 ตัว)

แต่ละ controller function เปลี่ยนจาก inline ExcelJS → `ExcelExportBuilder`:

| Controller | Function | ลดโค้ดประมาณ |
| --- | --- | --- |
| `documentController.js` | `exportDocuments()` | ~25 lines → ~5 lines |
| `documentController.js` | `exportCertificateRequests()` | ~25 lines → ~5 lines |
| `projectDefenseRequestController.js` | `exportExamResults()` | ~30 lines → ~8 lines |
| `projectDefenseRequestController.js` | `exportStaffVerificationList()` | ไม่เปลี่ยนมาก (delegates to service) |
| `projectSystemTestController.js` | `exportStaffQueue()` | ~25 lines → ~5 lines |
| `topicExamController.js` | `exportOverview()` | ~20 lines → ~5 lines |
| `projectDefenseRequestService.js` | `exportStaffVerificationList()` | ใช้ Builder `.toBuffer()` |

### 5. Frontend Service Refactor (6 ตัว + 5 ใหม่)

**Refactor existing (ลบ inline fetch/blob/extractFileName):**

- `adminInternshipDocumentsService.ts` → `downloadExcelFile()`
- `adminInternshipCertificatesService.ts` → `downloadExcelFile()`
- `adminProjectExamResultService.ts` → `downloadExcelFile()`
- `adminSystemTestService.ts` → `downloadExcelFile()`
- `adminTopicExamService.ts` → `downloadExcelFile()`
- `adminDefenseQueueService.ts` → `downloadExcelFile()`

**New service functions (สำหรับ 5 endpoints ใหม่):**

- `reportService.ts` — `exportEnrolledStudents()`, `exportProjectReport()`, `exportDocumentPipeline()`, `exportSupervisorReport()`
- `adminSettingsService.ts` — `exportAcademicDeadlines()`

### 6. Frontend Page Changes (5 หน้า)

เปลี่ยนปุ่ม "ส่งออก CSV" → "ส่งออก Excel" และเรียก service function แทน `downloadCSV()`:

| Page | ก่อน | หลัง |
| --- | --- | --- |
| `admin/reports/internship/page.tsx` | `downloadCSV(data, columns, ...)` | `exportEnrolledStudents(filters)` |
| `admin/reports/project/page.tsx` | `downloadCSV(data, columns, ...)` | `exportProjectReport(filters)` |
| `admin/reports/document-pipeline/page.tsx` | `downloadCSV(data, columns, ...)` | `exportDocumentPipeline(filters)` |
| `admin/reports/internship-supervisors/page.tsx` | `downloadCSV(data, columns, ...)` | `exportSupervisorReport(filters)` |
| `admin/settings/academic/page.tsx` | `downloadCSV(data, columns, ...)` | `exportAcademicDeadlines(filters)` |

---

## Deletion Checklist

| Target | Type | Reason |
| --- | --- | --- |
| `backend/utils/csvExport.js` | File | ไม่ใช้แล้ว — ทุก export เป็น Excel |
| `frontend-next/src/lib/utils/csvExport.ts` | File | ไม่ใช้แล้ว — ทุก export เป็น Excel |
| `reportController.js` `?format=csv` branches | Code (3 จุด) | ไม่มี frontend เรียก, แทนที่ด้วย Excel endpoints |
| `extractFileName()` ใน service files | Code (3+ จุด) | ย้ายเข้า `excelDownload.ts` แล้ว |
| `xlsx` npm package (backend) | Dependency | ตรวจสอบก่อนว่าไม่มีที่อื่นใช้ — เหลือแค่ `exceljs` |

## Keep As-Is

| Target | Reason |
| --- | --- |
| `backend/templates/*.csv` | Template สำหรับ import |
| `backend/routes/template.js` | CSV template download endpoint |
| `backend/utils/csvParser.js` | Parse CSV upload |
| `csv-parser` npm package | ใช้สำหรับ import |

---

## Estimated Impact

| Metric | Before | After |
| --- | --- | --- |
| Export formats | 2 (Excel + CSV) | 1 (Excel only) |
| Total export code lines (backend) | ~350 lines across 5 files | ~150 lines (utility + slim controllers) |
| Frontend duplicate code | ~105 lines (3 service files × 35 lines) | 0 (shared utility) |
| Frontend CSV utility | 53 lines | Deleted |
| Backend CSV utility | 37 lines | Deleted |
| Dead `?format=csv` code | 3 branches (~40 lines) | Deleted |
| Consistency | Mixed patterns | Single pattern everywhere |
