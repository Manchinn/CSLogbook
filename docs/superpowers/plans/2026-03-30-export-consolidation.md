# Export Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all exports to Excel-only, eliminate CSV, reduce duplication via shared utilities.

**Architecture:** Create `ExcelExportBuilder` (backend) and `downloadExcelFile` (frontend) as shared utilities. Refactor 6 existing exports + add 5 new endpoints to replace client-side CSV. Delete all CSV export code.

**Tech Stack:** ExcelJS, dayjs (buddhistEra plugin), Express, Next.js, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-30-export-consolidation-design.md`

---

## File Map

### Create

| File | Responsibility |
| --- | --- |
| `cslogbook/backend/utils/excelExportBuilder.js` | Shared ExcelExportBuilder class + formatThaiDate helper |
| `cslogbook/frontend-next/src/lib/utils/excelDownload.ts` | Shared downloadExcelFile utility (token + fetch + blob) |

### Modify

| File | Change |
| --- | --- |
| `cslogbook/backend/controllers/documents/documentController.js` | Refactor exportDocuments + exportCertificateRequests → Builder |
| `cslogbook/backend/controllers/projectDefenseRequestController.js` | Refactor exportExamResults → Builder, remove projectCode column |
| `cslogbook/backend/controllers/projectSystemTestController.js` | Refactor exportStaffQueue → Builder, remove projectCode column |
| `cslogbook/backend/controllers/topicExamController.js` | Refactor exportOverview → Builder |
| `cslogbook/backend/services/projectDefenseRequestService.js` | Refactor exportStaffVerificationList → Builder.toBuffer() |
| `cslogbook/backend/controllers/reportController.js` | Add 4 Excel export functions, remove `?format=csv` branches |
| `cslogbook/backend/routes/reportRoutes.js` | Add 4 export routes |
| `cslogbook/backend/routes/adminRoutes.js` | Add 1 deadlines export route |
| `cslogbook/frontend-next/src/lib/services/adminInternshipDocumentsService.ts` | Replace inline fetch → downloadExcelFile, delete extractFileName |
| `cslogbook/frontend-next/src/lib/services/adminInternshipCertificatesService.ts` | Same |
| `cslogbook/frontend-next/src/lib/services/adminProjectExamResultService.ts` | Same |
| `cslogbook/frontend-next/src/lib/services/adminSystemTestService.ts` | Same |
| `cslogbook/frontend-next/src/lib/services/adminTopicExamService.ts` | Same |
| `cslogbook/frontend-next/src/lib/services/adminDefenseQueueService.ts` | Same |
| `cslogbook/frontend-next/src/lib/services/reportService.ts` | Add 4 export functions |
| `cslogbook/frontend-next/src/lib/services/adminSettingsService.ts` | Add exportAcademicDeadlines (or nearby service) |
| `cslogbook/frontend-next/src/app/(app)/admin/reports/internship/page.tsx` | CSV→Excel button |
| `cslogbook/frontend-next/src/app/(app)/admin/reports/project/page.tsx` | CSV→Excel button |
| `cslogbook/frontend-next/src/app/(app)/admin/reports/document-pipeline/page.tsx` | CSV→Excel button |
| `cslogbook/frontend-next/src/app/(app)/admin/reports/internship-supervisors/page.tsx` | CSV→Excel button |
| `cslogbook/frontend-next/src/app/(app)/admin/settings/academic/page.tsx` | CSV→Excel button |

### Delete

| File/Code | Reason |
| --- | --- |
| `cslogbook/backend/utils/csvExport.js` | No longer used |
| `cslogbook/frontend-next/src/lib/utils/csvExport.ts` | No longer used |

---

## Task 1: Create ExcelExportBuilder + formatThaiDate (Backend)

**Files:**
- Create: `cslogbook/backend/utils/excelExportBuilder.js`

- [ ] **Step 1: Create `excelExportBuilder.js`**

```js
// cslogbook/backend/utils/excelExportBuilder.js
const ExcelJS = require('exceljs');
const dayjs = require('dayjs');
require('dayjs/locale/th');
const buddhistEra = require('dayjs/plugin/buddhistEra');
dayjs.extend(buddhistEra);

/**
 * Format date to Thai Buddhist era: "30 มี.ค. 2569"
 */
function formatThaiDate(value) {
  if (!value) return '-';
  const d = dayjs(value);
  if (!d.isValid()) return '-';
  return d.locale('th').format('D MMM BBBB');
}

class ExcelExportBuilder {
  constructor(filenamePrefix) {
    this.workbook = new ExcelJS.Workbook();
    this.filenamePrefix = filenamePrefix;
    this.headerStyle = { font: { bold: true } };
    this._filename = null;
  }

  get filename() {
    if (!this._filename) {
      this._filename = `${this.filenamePrefix}_${Date.now()}.xlsx`;
    }
    return this._filename;
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

module.exports = { ExcelExportBuilder, formatThaiDate };
```

- [ ] **Step 2: Verify dayjs plugins are available**

Run: `cd cslogbook/backend && node -e "const dayjs = require('dayjs'); require('dayjs/locale/th'); const b = require('dayjs/plugin/buddhistEra'); dayjs.extend(b); console.log(dayjs('2026-03-30').locale('th').format('D MMM BBBB'))"`

Expected: `30 มี.ค. 2569`

- [ ] **Step 3: Commit**

```bash
git add cslogbook/backend/utils/excelExportBuilder.js
git commit -m "feat: add ExcelExportBuilder utility with formatThaiDate helper"
```

---

## Task 2: Create downloadExcelFile Utility (Frontend)

**Files:**
- Create: `cslogbook/frontend-next/src/lib/utils/excelDownload.ts`

- [ ] **Step 1: Create `excelDownload.ts`**

```ts
// cslogbook/frontend-next/src/lib/utils/excelDownload.ts
import { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEY } from "@/lib/auth/storageKeys";
import { env } from "@/lib/config/env";

interface ExcelDownloadOptions {
  /** API endpoint path e.g. '/admin/documents/export' */
  endpoint: string;
  /** Query params — undefined/empty values are filtered out */
  params?: Record<string, string | number | undefined | null>;
  /** Fallback filename if server doesn't send Content-Disposition */
  fallbackFilename?: string;
  /** Override token (for SSR or testing) */
  token?: string;
}

export async function downloadExcelFile({
  endpoint,
  params,
  fallbackFilename = "export.xlsx",
  token,
}: ExcelDownloadOptions): Promise<void> {
  const authToken =
    token ??
    localStorage.getItem(AUTH_TOKEN_KEY) ??
    localStorage.getItem(LEGACY_TOKEN_KEY);

  const url = new URL(`${env.apiUrl}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "ไม่สามารถส่งออกข้อมูลได้");
  }

  const filename = extractFileName(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

function extractFileName(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (!contentDisposition) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = /filename="?([^";\n]+)"?/i.exec(contentDisposition);
  if (plainMatch?.[1]) return plainMatch[1];
  return fallback;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd cslogbook/frontend-next && npx tsc --noEmit src/lib/utils/excelDownload.ts 2>&1 | head -20`

Expected: No errors (or only unrelated project-wide errors)

- [ ] **Step 3: Commit**

```bash
git add cslogbook/frontend-next/src/lib/utils/excelDownload.ts
git commit -m "feat: add downloadExcelFile frontend utility"
```

---

## Task 3: Refactor Existing Backend Exports → Builder

**Files:**
- Modify: `cslogbook/backend/controllers/documents/documentController.js`
- Modify: `cslogbook/backend/controllers/projectDefenseRequestController.js`
- Modify: `cslogbook/backend/controllers/projectSystemTestController.js`
- Modify: `cslogbook/backend/controllers/topicExamController.js`
- Modify: `cslogbook/backend/services/projectDefenseRequestService.js`

- [ ] **Step 1: Refactor `documentController.js` — exportDocuments (lines 603-671)**

Add import at top of file:

```js
const { ExcelExportBuilder, formatThaiDate } = require('../../utils/excelExportBuilder');
```

Replace the body of `exportDocuments` (lines ~620-671) — keep the query/filter logic at the top, replace only the ExcelJS portion:

```js
// ... existing filter/query logic stays ...
// Replace from where ExcelJS workbook is created to the end:

const STATUS_MAP = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  revising: 'แก้ไข',
};

const columns = [
  { header: 'ลำดับ', key: 'order', width: 8 },
  { header: 'ประเภทเอกสาร', key: 'docType', width: 20 },
  { header: 'รหัสนักศึกษา', key: 'studentCode', width: 15 },
  { header: 'ชื่อ-นามสกุล', key: 'studentName', width: 25 },
  { header: 'บริษัท', key: 'company', width: 30 },
  { header: 'สถานะ', key: 'status', width: 15 },
  { header: 'เลขที่หนังสือ', key: 'officialNumber', width: 15 },
  { header: 'วันที่ส่ง', key: 'submittedAt', width: 18 },
];

const rows = documents.map((row, i) => ({
  order: i + 1,
  docType: row.documentType || '-',
  studentCode: row.studentCode || '-',
  studentName: row.studentName || '-',
  company: row.companyName || '-',
  status: STATUS_MAP[row.status] || row.status || '-',
  officialNumber: row.officialNumber || '-',
  submittedAt: formatThaiDate(row.created_at),
}));

await new ExcelExportBuilder('เอกสารฝึกงาน')
  .addSheet('เอกสารฝึกงาน', columns, rows)
  .sendResponse(res);
```

- [ ] **Step 2: Refactor `documentController.js` — exportCertificateRequests (lines 674-734)**

Replace the ExcelJS portion similarly:

```js
const STATUS_MAP = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
};

const columns = [
  { header: 'ลำดับ', key: 'order', width: 8 },
  { header: 'รหัสนักศึกษา', key: 'studentCode', width: 15 },
  { header: 'ชื่อ-นามสกุล', key: 'fullName', width: 25 },
  { header: 'บริษัท', key: 'company', width: 30 },
  { header: 'ชั่วโมงรวม', key: 'totalHours', width: 12 },
  { header: 'คะแนน', key: 'score', width: 10 },
  { header: 'สถานะ', key: 'status', width: 15 },
  { header: 'วันที่ขอ', key: 'requestedAt', width: 18 },
];

const rows = requests.map((row, i) => ({
  order: i + 1,
  studentCode: row.studentCode || '-',
  fullName: row.fullName || '-',
  company: row.companyName || '-',
  totalHours: row.totalHours || '-',
  score: row.score || '-',
  status: STATUS_MAP[row.status] || row.status || '-',
  requestedAt: formatThaiDate(row.requestDate || row.requestedAt),
}));

await new ExcelExportBuilder('คำขอหนังสือรับรอง')
  .addSheet('คำขอหนังสือรับรอง', columns, rows)
  .sendResponse(res);
```

- [ ] **Step 3: Refactor `projectDefenseRequestController.js` — exportExamResults (lines 278-369)**

Add import at top:

```js
const { ExcelExportBuilder, formatThaiDate } = require('../utils/excelExportBuilder');
```

Replace ExcelJS portion. **Note: remove projectCode column:**

```js
const RESULT_MAP = { PASS: 'ผ่าน', FAIL: 'ไม่ผ่าน' };

const columns = [
  { header: 'ลำดับ', key: 'order', width: 8 },
  { header: 'ชื่อโครงงาน (ไทย)', key: 'nameTh', width: 40 },
  { header: 'ชื่อโครงงาน (อังกฤษ)', key: 'nameEn', width: 40 },
  { header: 'สมาชิก', key: 'members', width: 35 },
  { header: 'อาจารย์ที่ปรึกษา', key: 'advisor', width: 25 },
  { header: 'ผลสอบ', key: 'result', width: 12 },
  { header: 'คะแนน', key: 'score', width: 10 },
  { header: 'หมายเหตุ', key: 'notes', width: 30 },
  { header: 'วันที่บันทึก', key: 'recordedAt', width: 18 },
];

const rows = results.map((exam, i) => ({
  order: i + 1,
  nameTh: exam.projectNameTh || '-',
  nameEn: exam.projectNameEn || '-',
  members: (exam.members || []).map(m => `${m.studentCode} ${m.name}`).join('\n'),
  advisor: exam.advisorName || '-',
  result: RESULT_MAP[exam.result] || exam.result || '-',
  score: exam.score ?? '-',
  notes: exam.notes || '-',
  recordedAt: formatThaiDate(exam.recordedAt),
}));

const sheetName = examType === 'THESIS' ? 'ผลสอบปริญญานิพนธ์' : 'ผลสอบโครงงานพิเศษ 1';
const filePrefix = examType === 'THESIS' ? 'ผลสอบปริญญานิพนธ์' : 'ผลสอบโครงงานพิเศษ1';

await new ExcelExportBuilder(filePrefix)
  .addSheet(sheetName, columns, rows)
  .sendResponse(res);
```

- [ ] **Step 4: Refactor `projectSystemTestController.js` — exportStaffQueue (lines 97-159)**

Add import at top:

```js
const { ExcelExportBuilder, formatThaiDate } = require('../utils/excelExportBuilder');
```

Replace ExcelJS portion. **Note: remove projectCode column:**

```js
const STATUS_MAP = {
  pending_advisor: 'รออาจารย์ที่ปรึกษา',
  pending_staff: 'รอเจ้าหน้าที่',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
};

const columns = [
  { header: 'ลำดับ', key: 'order', width: 8 },
  { header: 'ชื่อโครงงาน', key: 'name', width: 40 },
  { header: 'ผู้ยื่น', key: 'submitter', width: 25 },
  { header: 'ช่วงทดสอบ', key: 'testPeriod', width: 25 },
  { header: 'สถานะ', key: 'status', width: 18 },
  { header: 'วันที่ยื่น', key: 'submittedAt', width: 18 },
];

const rows = queue.map((project, i) => ({
  order: i + 1,
  name: project.projectName || '-',
  submitter: project.submitterName || '-',
  testPeriod: [project.testStartDate, project.testDueDate].filter(Boolean).join(' - '),
  status: STATUS_MAP[project.status] || project.status || '-',
  submittedAt: formatThaiDate(project.submittedAt),
}));

await new ExcelExportBuilder('คิวทดสอบระบบ')
  .addSheet('คิวทดสอบระบบ', columns, rows)
  .sendResponse(res);
```

- [ ] **Step 5: Refactor `topicExamController.js` — exportOverview (lines 51-92)**

Add import at top:

```js
const { ExcelExportBuilder } = require('../utils/excelExportBuilder');
```

Replace ExcelJS portion:

```js
const columns = [
  { header: 'ลำดับ', key: 'order', width: 8 },
  { header: 'หัวข้อโครงงาน', key: 'titleTh', width: 50 },
  { header: 'รหัสนักศึกษา', key: 'studentCode', width: 15 },
  { header: 'ชื่อ-นามสกุล', key: 'studentName', width: 25 },
  { header: 'หมายเหตุ', key: 'remark', width: 20 },
];

const rows = flatRows.map((row, i) => ({
  order: i + 1,
  titleTh: row.titleTh || '-',
  studentCode: row.studentCode || '-',
  studentName: row.studentName || '-',
  remark: row.remark || '',
}));

await new ExcelExportBuilder('รายชื่อหัวข้อโครงงานพิเศษ')
  .addSheet('หัวข้อโครงงาน', columns, rows)
  .sendResponse(res);
```

- [ ] **Step 6: Refactor `projectDefenseRequestService.js` — exportStaffVerificationList (lines 1261-1313)**

Add import at top of file:

```js
const { ExcelExportBuilder } = require('../utils/excelExportBuilder');
```

Replace workbook creation in `exportStaffVerificationList`:

```js
async exportStaffVerificationList(filters = {}) {
  const { defenseType = DEFENSE_TYPE_PROJECT1 } = filters;
  const exportFilters = { ...filters, withMetrics: false };
  const records = await this.getStaffVerificationQueue(exportFilters);

  const worksheetName = defenseType === DEFENSE_TYPE_THESIS
    ? 'รายชื่อสอบปริญญานิพนธ์'
    : 'รายชื่อสอบโครงงานพิเศษ 1';

  const columns = [
    { header: 'ลำดับ', key: 'index', width: 10 },
    { header: 'ชื่อโครงงานพิเศษ', key: 'titleTh', width: 50 },
    { header: 'สมาชิก', key: 'members', width: 45 },
    { header: 'อาจารย์ที่ปรึกษา', key: 'advisor', width: 30 },
  ];

  const rows = records.map((record, index) => {
    const project = record.project || {};
    const members = (project.members || [])
      .map(m => `${m.studentCode || '-'} ${m.name || ''}`.trim())
      .join('\n');
    return {
      index: index + 1,
      titleTh: project.projectNameTh || '-',
      members: members || '-',
      advisor: project.advisor?.name || '-',
    };
  });

  const filenamePrefix = DEFENSE_EXPORT_PREFIX[defenseType] || DEFENSE_EXPORT_PREFIX[DEFENSE_TYPE_PROJECT1];
  const builder = new ExcelExportBuilder(filenamePrefix)
    .setHeaderStyle({ bold: true, fill: 'FFE0E0E0' })
    .addSheet(worksheetName, columns, rows);

  const buffer = await builder.toBuffer();
  logger.info('exportStaffVerificationList success', { rowCount: records.length, defenseType });
  return { buffer, filename: builder.filename };
}
```

- [ ] **Step 7: Remove old ExcelJS require from refactored files**

In each file that was refactored, remove the direct `const ExcelJS = require('exceljs');` if it's no longer used elsewhere in the file. Check each file individually.

- [ ] **Step 8: Test backend server starts**

Run: `cd cslogbook/backend && node -e "require('./utils/excelExportBuilder')" && echo "OK"`

Expected: `OK`

- [ ] **Step 9: Commit**

```bash
git add cslogbook/backend/controllers/ cslogbook/backend/services/projectDefenseRequestService.js
git commit -m "refactor: migrate 6 existing exports to ExcelExportBuilder

- Use shared Builder for all Excel exports
- Add Thai date formatting (Buddhist era) to all date columns
- Remove projectCode column from exportExamResults and exportStaffQueue
- Remove direct ExcelJS requires from controllers"
```

---

## Task 4: Add 5 New Backend Export Endpoints

**Files:**
- Modify: `cslogbook/backend/controllers/reportController.js`
- Modify: `cslogbook/backend/routes/reportRoutes.js`
- Modify: `cslogbook/backend/routes/adminRoutes.js`

- [ ] **Step 1: Add 4 export functions to `reportController.js`**

Add import at top of file:

```js
const { ExcelExportBuilder, formatThaiDate } = require('../utils/excelExportBuilder');
```

Add these export functions at the end of the file (before `module.exports` if present, or just export them):

```js
exports.exportEnrolledStudents = async (req, res, next) => {
  try {
    const { year, semester } = req.query;
    const data = await reportService.getEnrolledInternshipStudents({ year, semester });

    const STATUS_MAP = {
      not_started: 'ยังไม่เริ่ม',
      in_progress: 'อยู่ระหว่างฝึกงาน',
      completed: 'เสร็จสิ้น',
      withdrawn: 'ถอน',
    };

    const columns = [
      { header: 'รหัสนักศึกษา', key: 'studentCode', width: 15 },
      { header: 'ชื่อ-นามสกุล', key: 'fullName', width: 25 },
      { header: 'ชั้นปี', key: 'studentYear', width: 8 },
      { header: 'สถานะ', key: 'internshipStatus', width: 18 },
      { header: 'บริษัท', key: 'companyName', width: 30 },
      { header: 'ตำแหน่ง', key: 'internshipPosition', width: 25 },
      { header: 'พี่เลี้ยง', key: 'supervisorName', width: 20 },
      { header: 'อีเมลพี่เลี้ยง', key: 'supervisorEmail', width: 25 },
      { header: 'วันเริ่ม', key: 'startDate', width: 18 },
      { header: 'วันสิ้นสุด', key: 'endDate', width: 18 },
      { header: 'จำนวน Logbook', key: 'logCount', width: 14 },
      { header: 'ชั่วโมงรวม', key: 'totalHours', width: 12 },
      { header: 'Logbook พี่เลี้ยงอนุมัติ', key: 'logSupervisorApproved', width: 22 },
      { header: 'Logbook อ.อนุมัติ', key: 'logAdvisorApproved', width: 18 },
      { header: 'ประเมินแล้ว', key: 'evaluated', width: 12 },
      { header: 'คะแนนรวม', key: 'overallScore', width: 12 },
      { header: 'ผ่าน/ไม่ผ่าน', key: 'passFail', width: 12 },
      { header: 'ส่งสรุปผล', key: 'reflectionSubmitted', width: 12 },
      { header: 'ใบรับรอง', key: 'certificateStatus', width: 12 },
    ];

    const rows = data.map((s) => ({
      studentCode: s.studentCode || '-',
      fullName: s.fullName || '-',
      studentYear: s.studentYear || '-',
      internshipStatus: STATUS_MAP[s.internshipStatus] || s.internshipStatus || '-',
      companyName: s.companyName || '-',
      internshipPosition: s.internshipPosition || '-',
      supervisorName: s.supervisorName || '-',
      supervisorEmail: s.supervisorEmail || '-',
      startDate: formatThaiDate(s.startDate),
      endDate: formatThaiDate(s.endDate),
      logCount: s.logCount ?? 0,
      totalHours: s.totalHours ?? 0,
      logSupervisorApproved: s.logSupervisorApproved ?? 0,
      logAdvisorApproved: s.logAdvisorApproved ?? 0,
      evaluated: s.evaluated ? 'ใช่' : 'ไม่',
      overallScore: s.overallScore ?? '-',
      passFail: s.passFail || '-',
      reflectionSubmitted: s.reflectionSubmitted ? 'ส่งแล้ว' : 'ยังไม่ส่ง',
      certificateStatus: s.certificateStatus || '-',
    }));

    await new ExcelExportBuilder('รายงานฝึกงาน')
      .addSheet('นักศึกษาฝึกงาน', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};

exports.exportProjectReport = async (req, res, next) => {
  try {
    const { year, semester } = req.query;
    const data = await reportService.getProjectStatusSummary({ year, semester });
    const projects = data.projects || data || [];

    const columns = [
      { header: 'ชื่อโครงงาน', key: 'projectTitle', width: 45 },
      { header: 'สถานะ', key: 'status', width: 18 },
      { header: 'นักศึกษา', key: 'members', width: 35 },
      { header: 'ที่ปรึกษา', key: 'advisorName', width: 25 },
    ];

    const rows = projects.map((p) => ({
      projectTitle: p.projectTitle || p.projectNameTh || '-',
      status: p.statusLabel || p.status || '-',
      members: (p.members || []).map(m => `${m.studentCode} ${m.name}`).join(', '),
      advisorName: p.advisorName || '-',
    }));

    await new ExcelExportBuilder('รายงานโครงงาน')
      .addSheet('โครงงาน', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};

exports.exportDocumentPipeline = async (req, res, next) => {
  try {
    const { year, semester, documentType } = req.query;
    const data = await reportService.getDocumentPipeline({ year, semester, documentType });

    const STATUS_MAP = {
      pending: 'รอดำเนินการ',
      approved: 'อนุมัติ',
      rejected: 'ปฏิเสธ',
      revising: 'แก้ไข',
    };

    const columns = [
      { header: 'ประเภท', key: 'documentType', width: 15 },
      { header: 'ชื่อเอกสาร', key: 'documentName', width: 30 },
      { header: 'สถานะ', key: 'status', width: 15 },
      { header: 'จำนวน', key: 'count', width: 10 },
    ];

    const rows = [];
    (data.pipeline || []).forEach((doc) => {
      Object.entries(doc.statuses || {}).forEach(([status, count]) => {
        rows.push({
          documentType: doc.documentType === 'INTERNSHIP' ? 'ฝึกงาน' : 'โครงงาน',
          documentName: doc.documentName || '-',
          status: STATUS_MAP[status] || status,
          count,
        });
      });
    });

    await new ExcelExportBuilder('Document-Pipeline')
      .addSheet('Document Pipeline', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};

exports.exportSupervisorReport = async (req, res, next) => {
  try {
    const { year, semester } = req.query;
    const data = await reportService.getInternshipSupervisorReport({ year, semester });

    const columns = [
      { header: 'บริษัท', key: 'companyName', width: 30 },
      { header: 'พี่เลี้ยง', key: 'supervisorName', width: 20 },
      { header: 'อีเมลพี่เลี้ยง', key: 'supervisorEmail', width: 25 },
      { header: 'จำนวน นศ.', key: 'studentCount', width: 12 },
      { header: 'Logbook ทั้งหมด', key: 'totalLogs', width: 15 },
      { header: 'พี่เลี้ยงอนุมัติ (%)', key: 'supervisorApprovalRate', width: 18 },
      { header: 'ประเมินครบ (%)', key: 'evaluationCompletionRate', width: 16 },
      { header: 'ประเมินแล้ว (คน)', key: 'evaluatedStudents', width: 16 },
    ];

    const rows = (data.supervisors || []).map((s) => ({
      companyName: s.companyName || '-',
      supervisorName: s.supervisorName || '-',
      supervisorEmail: s.supervisorEmail || '-',
      studentCount: s.studentCount ?? 0,
      totalLogs: s.totalLogs ?? 0,
      supervisorApprovalRate: s.supervisorApprovalRate ?? 0,
      evaluationCompletionRate: s.evaluationCompletionRate ?? 0,
      evaluatedStudents: s.evaluatedStudents ?? 0,
    }));

    await new ExcelExportBuilder('รายงานพี่เลี้ยง')
      .addSheet('พี่เลี้ยงฝึกงาน', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 2: Add academic deadlines export to reportController (or a new controller)**

Check if `adminRoutes.js` already has a controller for important-deadlines (lines 151-157). Add export to that controller or to reportController:

```js
// Add to reportController.js (or the controller that handles important-deadlines)
const { ImportantDeadline } = require('../models');

exports.exportAcademicDeadlines = async (req, res, next) => {
  try {
    const { academicYear, semester } = req.query;
    const where = {};
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;

    const deadlines = await ImportantDeadline.findAll({
      where,
      order: [['deadlineDate', 'ASC']],
    });

    const TYPE_MAP = {
      SUBMISSION: 'ส่งเอกสาร',
      ANNOUNCEMENT: 'ประกาศ',
      MILESTONE: 'เหตุการณ์สำคัญ',
    };
    const RELATED_MAP = {
      project: 'โครงงาน',
      internship: 'ฝึกงาน',
      general: 'ทั่วไป',
    };

    const columns = [
      { header: 'ชื่อกำหนดการ', key: 'name', width: 35 },
      { header: 'หมวด', key: 'relatedTo', width: 12 },
      { header: 'ปีการศึกษา', key: 'academicYear', width: 12 },
      { header: 'ภาคเรียน', key: 'semester', width: 10 },
      { header: 'ประเภท', key: 'deadlineType', width: 15 },
      { header: 'วันครบกำหนด', key: 'deadlineDate', width: 18 },
      { header: 'เวลา', key: 'deadlineTime', width: 10 },
      { header: 'สำคัญ', key: 'isCritical', width: 8 },
    ];

    const rows = deadlines.map((d) => ({
      name: d.name || '-',
      relatedTo: RELATED_MAP[d.relatedTo] || d.relatedTo || '-',
      academicYear: d.academicYear || '-',
      semester: d.semester || '-',
      deadlineType: TYPE_MAP[d.deadlineType] || d.deadlineType || '-',
      deadlineDate: formatThaiDate(d.deadlineDate),
      deadlineTime: d.deadlineTime || '',
      isCritical: d.isCritical ? 'ใช่' : 'ไม่',
    }));

    await new ExcelExportBuilder('กำหนดการสำคัญ')
      .addSheet('กำหนดการสำคัญ', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 3: Add routes in `reportRoutes.js`**

Add after existing report routes (around line 28):

```js
// Excel export endpoints
router.get('/internships/enrolled-students/export', reportController.exportEnrolledStudents);
router.get('/projects/export', reportController.exportProjectReport);
router.get('/documents/pipeline/export', reportController.exportDocumentPipeline);
router.get('/internships/supervisors/export', reportController.exportSupervisorReport);
```

- [ ] **Step 4: Add deadlines export route in `adminRoutes.js`**

Add near the existing important-deadlines routes (around line 157):

```js
router.get('/important-deadlines/export', importantDeadlineController.exportAcademicDeadlines || reportController.exportAcademicDeadlines);
```

Note: Check which controller already handles important-deadlines and add the export there. If it's a separate controller, add the function there instead.

- [ ] **Step 5: Remove `?format=csv` branches from `reportController.js`**

In `getDocumentPipeline` (around lines 107-115), `getInternshipSupervisorReport` (around lines 129-135), and `getEnrolledInternshipStudents` (around lines 146-156) — remove the `if (req.query.format === 'csv')` blocks.

Also remove the `sendCsvResponse` helper (lines 7-12) and the `csvExport` require.

- [ ] **Step 6: Test server starts**

Run: `cd cslogbook/backend && node -e "require('./app')" && echo "OK"`

Expected: `OK`

- [ ] **Step 7: Commit**

```bash
git add cslogbook/backend/controllers/reportController.js cslogbook/backend/routes/reportRoutes.js cslogbook/backend/routes/adminRoutes.js
git commit -m "feat: add 5 new Excel export endpoints, remove CSV branches

- /reports/internships/enrolled-students/export
- /reports/projects/export
- /reports/documents/pipeline/export
- /reports/internships/supervisors/export
- /admin/important-deadlines/export
- Remove ?format=csv from 3 report endpoints
- Remove sendCsvResponse helper and csvExport require"
```

---

## Task 5: Refactor 6 Frontend Services → downloadExcelFile

**Files:**
- Modify: `cslogbook/frontend-next/src/lib/services/adminInternshipDocumentsService.ts`
- Modify: `cslogbook/frontend-next/src/lib/services/adminInternshipCertificatesService.ts`
- Modify: `cslogbook/frontend-next/src/lib/services/adminProjectExamResultService.ts`
- Modify: `cslogbook/frontend-next/src/lib/services/adminSystemTestService.ts`
- Modify: `cslogbook/frontend-next/src/lib/services/adminTopicExamService.ts`
- Modify: `cslogbook/frontend-next/src/lib/services/adminDefenseQueueService.ts`

- [ ] **Step 1: Refactor `adminInternshipDocumentsService.ts`**

Remove the `extractFileName` function (lines 334-341). Replace `exportAdminInternshipDocuments` (lines 343-376) with:

```ts
import { downloadExcelFile } from "@/lib/utils/excelDownload";

export function exportAdminInternshipDocuments(
  filters: Omit<AdminInternshipDocumentListFilters, "limit" | "offset"> = {},
) {
  return downloadExcelFile({
    endpoint: "/admin/documents/export",
    params: { type: "internship", ...filters },
    fallbackFilename: "เอกสารฝึกงาน.xlsx",
  });
}
```

Remove unused imports: `AUTH_TOKEN_KEY`, `LEGACY_TOKEN_KEY` (if no longer used elsewhere in the file). Keep `env` import only if used elsewhere.

- [ ] **Step 2: Refactor `adminInternshipCertificatesService.ts`**

Remove `extractFileName` (lines 249-256). Replace `exportAdminCertificateRequests` (lines 258-291) with:

```ts
import { downloadExcelFile } from "@/lib/utils/excelDownload";

export function exportAdminCertificateRequests(
  filters: Omit<AdminCertificateListFilters, "page" | "limit"> = {},
) {
  return downloadExcelFile({
    endpoint: "/admin/certificate-requests/export",
    params: { ...filters },
    fallbackFilename: "ใบรับรองฝึกงาน.xlsx",
  });
}
```

- [ ] **Step 3: Refactor `adminProjectExamResultService.ts`**

Remove `extractFileName` (lines 332-339). Replace `exportAdminProjectExamResults` (lines 341-376) with:

```ts
import { downloadExcelFile } from "@/lib/utils/excelDownload";

export function exportAdminProjectExamResults(
  examType: AdminExamType,
  filters: Omit<AdminProjectExamFilters, "limit" | "offset"> = {},
) {
  const fallback = examType === ADMIN_EXAM_TYPE_THESIS
    ? "ผลสอบปริญญานิพนธ์.xlsx"
    : "ผลสอบโครงงานพิเศษ.xlsx";
  return downloadExcelFile({
    endpoint: "/projects/exam-results/export",
    params: { examType, ...filters },
    fallbackFilename: fallback,
  });
}
```

- [ ] **Step 4: Refactor `adminSystemTestService.ts`**

Remove `extractFileName` (lines 257-264). Replace `exportAdminSystemTestQueue` (lines 266-299) with:

```ts
import { downloadExcelFile } from "@/lib/utils/excelDownload";

export function exportAdminSystemTestQueue(
  filters: Omit<AdminSystemTestQueueFilters, "limit" | "offset"> = {},
) {
  return downloadExcelFile({
    endpoint: "/projects/system-test/staff-queue/export",
    params: { ...filters },
    fallbackFilename: "คำขอทดสอบระบบ.xlsx",
  });
}
```

- [ ] **Step 5: Refactor `adminTopicExamService.ts`**

Remove `extractFileName` (lines 180-190). Replace `exportAdminTopicExamOverview` (lines 234-258) with:

```ts
import { downloadExcelFile } from "@/lib/utils/excelDownload";

export function exportAdminTopicExamOverview(
  filters: Omit<AdminTopicExamFilters, "limit" | "offset"> = {},
) {
  return downloadExcelFile({
    endpoint: "/projects/topic-exam/export",
    params: { ...filters },
    fallbackFilename: "หัวข้อโครงงาน.xlsx",
  });
}
```

- [ ] **Step 6: Refactor `adminDefenseQueueService.ts`**

Remove `extractFileName` (lines 283-290). Replace `exportDefenseQueue` (lines 330-357) with:

```ts
import { downloadExcelFile } from "@/lib/utils/excelDownload";

export function exportDefenseQueue(
  defenseType: DefenseType,
  filters: Omit<DefenseQueueFilters, "limit" | "offset"> = {},
) {
  const query = buildQueueQuery(filters, defenseType);
  const fallback = defenseType === DEFENSE_TYPE_THESIS
    ? "thesis-queue.xlsx"
    : "project1-queue.xlsx";
  return downloadExcelFile({
    endpoint: `/projects/kp02/staff-queue/export?${query}`,
    fallbackFilename: fallback,
  });
}
```

- [ ] **Step 7: Clean up unused imports in all 6 files**

In each file, check if `AUTH_TOKEN_KEY`, `LEGACY_TOKEN_KEY`, `env`, `resolveToken`, `fetch` are still used elsewhere. Remove if unused.

- [ ] **Step 8: Commit**

```bash
git add cslogbook/frontend-next/src/lib/services/admin*.ts
git commit -m "refactor: migrate 6 frontend export services to downloadExcelFile

- Remove duplicate extractFileName() from 6 service files
- Remove inline fetch/blob/download pattern
- Use shared downloadExcelFile utility"
```

---

## Task 6: Add 5 Frontend Service Functions for New Endpoints

**Files:**
- Modify: `cslogbook/frontend-next/src/lib/services/reportService.ts` (or create if doesn't exist)

- [ ] **Step 1: Add export functions to report service**

Find the existing report service file (may be `reportService.ts` or similar). Add:

```ts
import { downloadExcelFile } from "@/lib/utils/excelDownload";

export function exportEnrolledStudents(filters: { year?: string; semester?: string } = {}) {
  return downloadExcelFile({
    endpoint: "/reports/internships/enrolled-students/export",
    params: filters,
    fallbackFilename: "รายงานฝึกงาน.xlsx",
  });
}

export function exportProjectReport(filters: { year?: string; semester?: string } = {}) {
  return downloadExcelFile({
    endpoint: "/reports/projects/export",
    params: filters,
    fallbackFilename: "รายงานโครงงาน.xlsx",
  });
}

export function exportDocumentPipeline(filters: { year?: string; semester?: string; documentType?: string } = {}) {
  return downloadExcelFile({
    endpoint: "/reports/documents/pipeline/export",
    params: filters,
    fallbackFilename: "Document-Pipeline.xlsx",
  });
}

export function exportSupervisorReport(filters: { year?: string; semester?: string } = {}) {
  return downloadExcelFile({
    endpoint: "/reports/internships/supervisors/export",
    params: filters,
    fallbackFilename: "รายงานพี่เลี้ยง.xlsx",
  });
}

export function exportAcademicDeadlines(filters: { academicYear?: string; semester?: string } = {}) {
  return downloadExcelFile({
    endpoint: "/admin/important-deadlines/export",
    params: filters,
    fallbackFilename: "กำหนดการสำคัญ.xlsx",
  });
}
```

Note: If `reportService.ts` doesn't exist yet or if these functions belong in different files, adapt accordingly. The key point is each function is a thin wrapper around `downloadExcelFile`.

- [ ] **Step 2: Commit**

```bash
git add cslogbook/frontend-next/src/lib/services/
git commit -m "feat: add 5 frontend export service functions for new endpoints"
```

---

## Task 7: Update 5 Frontend Pages (CSV → Excel)

**Files:**
- Modify: `cslogbook/frontend-next/src/app/(app)/admin/reports/internship/page.tsx`
- Modify: `cslogbook/frontend-next/src/app/(app)/admin/reports/project/page.tsx`
- Modify: `cslogbook/frontend-next/src/app/(app)/admin/reports/document-pipeline/page.tsx`
- Modify: `cslogbook/frontend-next/src/app/(app)/admin/reports/internship-supervisors/page.tsx`
- Modify: `cslogbook/frontend-next/src/app/(app)/admin/settings/academic/page.tsx`

- [ ] **Step 1: Update `internship/page.tsx`**

Remove import:
```ts
// DELETE: import { downloadCSV } from "@/lib/utils/csvExport";
```

Add import:
```ts
import { exportEnrolledStudents } from "@/lib/services/reportService";
```

Replace the CSV download button (lines 186-219) with:

```tsx
<button
  type="button"
  className={btn.button}
  disabled={filteredStudents.length === 0}
  onClick={() => exportEnrolledStudents({ year: String(year) })}
>
  ส่งออก Excel
</button>
```

Remove the `formatDate` helper function if it was only used for CSV export.

- [ ] **Step 2: Update `project/page.tsx`**

Remove import:
```ts
// DELETE: import { downloadCSV } from "@/lib/utils/csvExport";
```

Add import:
```ts
import { exportProjectReport } from "@/lib/services/reportService";
```

Replace CSV button (lines 159-177) with:

```tsx
<button
  type="button"
  className={btn.button}
  disabled={projects.length === 0}
  onClick={() => exportProjectReport({ year: String(year) })}
>
  ส่งออก Excel
</button>
```

- [ ] **Step 3: Update `document-pipeline/page.tsx`**

Remove import:
```ts
// DELETE: import { downloadCSV } from "@/lib/utils/csvExport";
```

Add import:
```ts
import { exportDocumentPipeline } from "@/lib/services/reportService";
```

Remove `handleExportCsv` function (lines 130-153). Replace CSV button (line 178) with:

```tsx
<button
  type="button"
  className={btn.button}
  disabled={pipeline.length === 0}
  onClick={() => exportDocumentPipeline({ year: year ?? undefined })}
>
  ส่งออก Excel
</button>
```

- [ ] **Step 4: Update `internship-supervisors/page.tsx`**

Remove import:
```ts
// DELETE: import { downloadCSV } from "@/lib/utils/csvExport";
```

Add import:
```ts
import { exportSupervisorReport } from "@/lib/services/reportService";
```

Remove `handleExportCsv` function (lines 76-91). Replace CSV button (line 105) with:

```tsx
<button
  type="button"
  className={btn.button}
  disabled={filtered.length === 0}
  onClick={() => exportSupervisorReport({ year: year ?? undefined })}
>
  ส่งออก Excel
</button>
```

- [ ] **Step 5: Update `academic/page.tsx`**

Remove import:
```ts
// DELETE: import { downloadCSV } from "@/lib/utils/csvExport";
```

Add import:
```ts
import { exportAcademicDeadlines } from "@/lib/services/reportService";
```

Remove `handleExportCSV` function (lines 639-656). Replace CSV button (line 1292) with:

```tsx
<button
  type="button"
  className={btn.button}
  onClick={() => exportAcademicDeadlines({
    academicYear: deadlineYearFilter || undefined,
    semester: deadlineSemesterFilter || undefined,
  })}
>
  ส่งออก Excel
</button>
```

- [ ] **Step 6: Verify frontend builds**

Run: `cd cslogbook/frontend-next && npm run build 2>&1 | tail -20`

Expected: Build succeeds with no errors

- [ ] **Step 7: Commit**

```bash
git add cslogbook/frontend-next/src/app/
git commit -m "refactor: update 5 report pages from CSV to Excel export

- Replace downloadCSV() with server-side Excel export
- Change button labels 'ส่งออก CSV' → 'ส่งออก Excel'
- Remove handleExportCsv/handleExportCSV functions
- Remove csvExport imports"
```

---

## Task 8: Delete CSV Utilities and Dead Code

**Files:**
- Delete: `cslogbook/backend/utils/csvExport.js`
- Delete: `cslogbook/frontend-next/src/lib/utils/csvExport.ts`

- [ ] **Step 1: Verify no remaining references to csvExport**

Run: `grep -r "csvExport\|csv-export\|csvexport" cslogbook/backend/ --include="*.js" -l`
Run: `grep -r "csvExport\|csv-export\|csvexport" cslogbook/frontend-next/src/ --include="*.ts" --include="*.tsx" -l`

Expected: No files returned (or only the utility files themselves)

- [ ] **Step 2: Delete CSV utility files**

```bash
rm cslogbook/backend/utils/csvExport.js
rm cslogbook/frontend-next/src/lib/utils/csvExport.ts
```

- [ ] **Step 3: Check if `xlsx` npm package is used anywhere else**

Run: `grep -r "require.*xlsx\|from.*xlsx" cslogbook/backend/ --include="*.js" -l`

If only `csvExport.js` (now deleted) used it, remove from package.json:

```bash
cd cslogbook/backend && npm uninstall xlsx
```

If other files still use it, keep it.

- [ ] **Step 4: Verify no broken imports**

Run: `cd cslogbook/backend && node -e "require('./app')" && echo "OK"`
Run: `cd cslogbook/frontend-next && npx tsc --noEmit 2>&1 | grep -i "csvExport\|error" | head -20`

Expected: No errors related to csvExport

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete CSV export utilities and dead code

- Delete backend/utils/csvExport.js
- Delete frontend-next/src/lib/utils/csvExport.ts
- Remove xlsx npm dependency (if unused)"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Backend smoke test**

Run: `cd cslogbook/backend && npm run dev &` then test one export:

```bash
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <test-token>" "http://localhost:5000/api/reports/documents/pipeline/export?year=2568"
```

Expected: 200 (or 401 if no valid token — at least no 500)

- [ ] **Step 2: Frontend build test**

Run: `cd cslogbook/frontend-next && npm run build`

Expected: Build succeeds

- [ ] **Step 3: Verify no csvExport references remain**

Run: `grep -r "downloadCSV\|csvExport\|format=csv\|text/csv" cslogbook/ --include="*.js" --include="*.ts" --include="*.tsx" -l | grep -v node_modules | grep -v csvParser`

Expected: No files returned (csvParser.js is OK — it's for import, not export)

- [ ] **Step 4: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: post-consolidation cleanup"
```
