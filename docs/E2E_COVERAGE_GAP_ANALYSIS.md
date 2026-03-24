# E2E Test Coverage Gap Analysis — CSLogbook

> วิเคราะห์เมื่อ: 2026-03-24
> Existing tests: 13 spec files (~2,400 lines)
> Application: 72 routes | 200+ API endpoints | 43+ models

---

## 1. สรุป Coverage ปัจจุบัน vs สิ่งที่ขาด

### Coverage Matrix

| Feature Domain | มี Test แล้ว | ยังขาด | % Coverage (ประมาณ) |
|---|---|---|---|
| **Auth & SSO** | Login 3 roles, logout, token storage | SSO flow, token refresh, password change | ~60% |
| **Role Guard & Security** | Access matrix 9 routes, file validation, token tests | ครอบคลุมดี | ~85% |
| **Admin Settings** | Academic tabs, notification toggles | Curriculum CRUD, constants config, workflow steps | ~40% |
| **Admin User Mgmt** | Student/teacher list + stats | CRUD operations, search/filter, bulk upload CSV | ~30% |
| **Admin Documents** | - | Internship doc review, project doc review, certificate mgmt | **0%** |
| **Admin Queues** | - | KP02 queue, system test queue, thesis queue | **0%** |
| **Admin Exam Results** | - | Topic exam, project exam, thesis exam results | **0%** |
| **Admin Reports** | - | All 7 report pages | **0%** |
| **Teacher Advisor Queue** | Project1 queue (basic) | System test queue, thesis queue | ~25% |
| **Teacher Meeting Approval** | List + filter (approve skipped) | Full approve/reject flow, bulk actions | ~30% |
| **Teacher Topic Exam** | - | Topic exam overview, export | **0%** |
| **Student Dashboard** | Redirect check only | Dashboard widgets, stats, deadlines | ~10% |
| **Student Project Phase 1** | Meeting logbook create+approve | Draft create, topic submit, exam day, proposal revision | ~20% |
| **Student Project Phase 2** | System test + thesis (basic) | Full system test evidence upload, defense scheduling | ~40% |
| **Internship Registration** | CS05 submit (B1) | Multi-step registration flow, eligibility check | ~30% |
| **Internship Logbook** | Basic entry add/edit (B4) | Check-in/out, reflection, stats, full timesheet | ~25% |
| **Internship Documents** | Acceptance letter upload (B2) | Cooperation letter, referral letter download | ~30% |
| **Internship Company Info** | Basic form fill (B3) | Company stats, company browse | ~40% |
| **Internship Evaluation** | - | Supervisor evaluation (token-based), request send | **0%** |
| **Internship Certificate** | - | Certificate request, download, status tracking | **0%** |
| **Public Token Pages** | - | Timesheet approval, supervisor evaluation | **0%** |
| **Notifications** | - | Real-time notifications, unread count, mark read | **0%** |
| **Project Pairs** | - | Pair management, member CRUD | **0%** |
| **Deadline Calendar** | - | Student calendar, teacher calendar, deadline filtering | **0%** |
| **Reports Hub** | - | Role-based redirect, all report pages | **0%** |
| **PDF Generation** | - | Cooperation letter, referral letter, logbook summary | **0%** |
| **Responsive/Mobile** | - | Mobile viewport tests | **0%** |

### Overall Coverage: ~20-25% ของทั้งหมด

---

## 2. รายละเอียด Test Cases ที่ต้องเพิ่ม (จัดตาม Priority)

---

### 🔴 Priority 1 — Critical Business Flows (ต้องมี)

#### 06-student-dashboard/dashboard.spec.ts
```
Tests:
  - Student เห็น dashboard widgets (project status, internship status, deadlines)
  - Dashboard แสดง upcoming deadlines ถูกต้อง
  - Quick links ไปยัง project/internship ทำงาน
  - Stats cards แสดงข้อมูลสรุป
```

#### 06-student/project-creation.spec.ts
```
Tests:
  - Student สร้าง project draft ใหม่ (ชื่อ, รายละเอียด, track)
  - เพิ่ม project member (คู่โปรเจค)
  - Activate project จาก draft → in_progress
  - Validation: ชื่อโปรเจคว่าง, ไม่เลือก track
  - Student เห็น project detail หลังสร้าง
```

#### 06-student/topic-exam-flow.spec.ts
```
Tests (serial, multi-role):
  - Student submit topic สำหรับสอบ
  - Advisor เห็น topic ใน queue
  - Officer จัดสอบ (schedule exam)
  - Student เข้าหน้า exam day
  - Officer บันทึกผลสอบ (pass/fail)
  - Student เห็นผล + acknowledge (กรณี fail)
```

#### 07-admin/document-management.spec.ts
```
Tests:
  - Officer เข้า /admin/documents/internship — เห็นรายการเอกสาร
  - Filter ตาม status (pending, approved, rejected)
  - เปิดดู document detail
  - Approve document + เห็น status เปลี่ยน
  - Reject document + ใส่เหตุผล
  - เข้า /admin/documents/project — เห็นรายการ
  - เข้า /admin/documents/certificates — เห็นรายการ
```

#### 07-admin/defense-queues.spec.ts
```
Tests:
  - Officer เข้า /admin/project1/kp02-queue — เห็น queue
  - Filter ตาม status
  - Verify request (กรอก note + confirm)
  - Schedule defense (เลือกวันสอบ)
  - Officer เข้า /admin/system-test/staff-queue
  - Officer เข้า /admin/thesis/staff-queue
  - Export queue list
```

#### 07-admin/exam-results.spec.ts
```
Tests:
  - Officer เข้า /admin/topic-exam/results — เห็นรายการ
  - บันทึกผลสอบ topic exam (pass/fail + score)
  - Officer เข้า /admin/project-exam/results
  - บันทึกผลสอบ project exam
  - Officer เข้า /admin/thesis/exam-results
  - บันทึกผลสอบ thesis
```

#### 08-internship/evaluation-flow.spec.ts
```
Tests (serial, multi-role + token):
  - Student กดส่ง evaluation request ไปหา supervisor
  - เปิด /evaluate/supervisor/[token] — เห็นฟอร์มประเมิน
  - กรอกคะแนน 5 หมวด (discipline, behavior, performance, method, relations)
  - Submit evaluation สำเร็จ
  - Student เห็นสถานะ "ประเมินแล้ว"
```

#### 08-internship/certificate-flow.spec.ts
```
Tests (serial, multi-role):
  - Student กด request certificate
  - Officer เห็น request ใน /admin/documents/certificates
  - Officer approve certificate
  - Student เห็นสถานะ approved
  - Student download certificate
```

#### 09-public/timesheet-approval.spec.ts
```
Tests:
  - เปิด /approval/timesheet/[token] — เห็นรายการ logbook
  - Approve timesheet entries
  - Reject + ใส่ comment
  - Token expired → แสดง error page
  - Token invalid → แสดง error page
```

---

### 🟡 Priority 2 — Important Features

#### 07-admin/reports.spec.ts
```
Tests:
  - Officer เข้า /admin/reports/advisor-workload — เห็นข้อมูล
  - เข้า /admin/reports/deadline-compliance — เห็นข้อมูล
  - เข้า /admin/reports/document-pipeline — เห็นข้อมูล
  - เข้า /admin/reports/internship — เห็นข้อมูล
  - เข้า /admin/reports/internship-supervisors — เห็นข้อมูล
  - เข้า /admin/reports/project — เห็นข้อมูล
  - เข้า /admin/reports/workflow-progress — เห็นข้อมูล
  - Filter ตาม academic year ทำงาน
  - Export CSV/PDF ทำงาน (ถ้ามี)
```

#### 07-admin/settings-curriculum.spec.ts
```
Tests:
  - Officer เข้า /admin/settings/curriculum — เห็นรายการ
  - สร้าง curriculum ใหม่
  - แก้ไข curriculum
  - ลบ curriculum
  - เห็น active curriculum ถูกต้อง
```

#### 07-admin/settings-constants.spec.ts
```
Tests:
  - Officer เข้า /admin/settings/constants — เห็น form
  - แก้ไข system constants
  - Save สำเร็จ + ค่าเปลี่ยน
```

#### 07-admin/user-crud.spec.ts
```
Tests:
  - Officer สร้าง student ใหม่
  - แก้ไข student info
  - ค้นหา student ด้วย search + filter
  - Officer สร้าง teacher ใหม่
  - แก้ไข teacher info + permissions
  - Bulk upload CSV
```

#### 06-student/internship-registration.spec.ts
```
Tests:
  - Student เข้า /internship-eligibility — เช็คคุณสมบัติ
  - เข้า /internship-requirements — เห็นเงื่อนไข
  - เข้า /internship-registration — เริ่มลงทะเบียน
  - เข้า /internship-registration/flow — multi-step form
  - Validation: step ไม่ครบ ไปต่อไม่ได้
```

#### 06-student/internship-logbook-full.spec.ts
```
Tests:
  - Student เข้า /internship-logbook/timesheet — เห็น calendar view
  - Check-in (clock in) สำเร็จ
  - Check-out (clock out + กรอกรายละเอียด)
  - ดู logbook stats (จำนวนวัน, ชั่วโมงรวม)
  - เขียน reflection
  - แก้ไข entry เก่า
  - ลบ entry
```

#### 10-notifications/notifications.spec.ts
```
Tests:
  - Student เห็น notification bell + unread count
  - คลิกเปิด notification list
  - Mark as read → count ลด
  - Mark all as read
  - Real-time: action จาก role อื่น → notification ขึ้น (ถ้า test ได้)
```

#### 06-student/deadline-calendar.spec.ts
```
Tests:
  - Student เข้า /student-deadlines/calendar — เห็น calendar
  - เห็น deadline items บน calendar
  - คลิก deadline → เห็นรายละเอียด
  - Teacher เข้า /teacher/deadlines/calendar
```

---

### 🟢 Priority 3 — Nice to Have

#### 06-student/project-pairs.spec.ts
```
Tests:
  - เข้า /project-pairs — เห็นรายการคู่โปรเจค
  - จัดคู่โปรเจคใหม่
  - เปลี่ยนสมาชิก
```

#### 11-responsive/mobile-views.spec.ts
```
Tests (viewport: 375x812 iPhone):
  - Login page responsive
  - Dashboard responsive
  - Navigation menu (hamburger) ทำงาน
  - Form inputs ไม่ล้นจอ
  - Table scroll horizontal
```

#### 08-internship/company-browse.spec.ts
```
Tests:
  - เข้า /internship-companies — เห็นรายการบริษัท
  - ค้นหาบริษัท
  - ดูสถิติบริษัท (จำนวนนักศึกษา, คะแนนเฉลี่ย)
  - ดู detail ของบริษัท
```

#### 12-pdf-generation/pdf-downloads.spec.ts
```
Tests:
  - Download cooperation letter → ได้ไฟล์ PDF
  - Download referral letter → ได้ไฟล์ PDF
  - Download logbook summary → ได้ไฟล์ PDF
  - Download certificate → ได้ไฟล์ PDF
  - PDF ไม่ corrupt (file size > 0)
```

#### 07-admin/bulk-upload.spec.ts
```
Tests:
  - Download CSV template
  - Upload CSV → เห็นจำนวน records
  - Upload history แสดงถูกต้อง
  - Reject invalid CSV format
```

#### 13-error-handling/error-states.spec.ts
```
Tests:
  - 404 page สำหรับ route ที่ไม่มีอยู่
  - Network error → แสดง error state
  - Empty state ทำงาน (ไม่มี data → แสดง empty message)
  - API timeout → UI ไม่ค้าง
```

#### 07-admin/workflow-steps.spec.ts
```
Tests:
  - Officer เข้าดู workflow steps
  - สร้าง step ใหม่
  - Reorder steps
  - แก้ไข step
  - ลบ step
```

---

## 3. โครงสร้างไฟล์ที่แนะนำ

```
playwright-e2e/tests/
├── 01-smoke/                    # ✅ มีแล้ว (3 files)
│   ├── health.spec.ts
│   ├── auth-flow.spec.ts
│   └── role-guard.spec.ts
│
├── 02-admin/                    # ✅ มีบางส่วน (3 files)
│   ├── settings-academic.spec.ts        ✅
│   ├── settings-notification.spec.ts    ✅
│   ├── user-management.spec.ts          ✅
│   ├── settings-curriculum.spec.ts      🆕 Priority 2
│   ├── settings-constants.spec.ts       🆕 Priority 2
│   ├── user-crud.spec.ts               🆕 Priority 2
│   └── workflow-steps.spec.ts           🆕 Priority 3
│
├── 03-teacher/                  # ✅ มีบางส่วน (2 files)
│   ├── advisor-queue.spec.ts            ✅
│   ├── meeting-approvals.spec.ts        ✅
│   └── topic-exam-overview.spec.ts      🆕 Priority 2
│
├── 04-workflows/                # ✅ มีบางส่วน (4 files)
│   ├── internship-flow.spec.ts          ✅
│   ├── kp02-defense-flow.spec.ts        ✅
│   ├── meeting-logbook-flow.spec.ts     ✅
│   ├── thesis-flow.spec.ts              ✅
│   ├── topic-exam-flow.spec.ts          🆕 Priority 1
│   ├── evaluation-flow.spec.ts          🆕 Priority 1
│   └── certificate-flow.spec.ts         🆕 Priority 1
│
├── 05-security/                 # ✅ มีแล้ว (1 file)
│   └── route-access.spec.ts
│
├── 06-student/                  # 🆕 ทั้งหมด
│   ├── dashboard.spec.ts                🆕 Priority 1
│   ├── project-creation.spec.ts         🆕 Priority 1
│   ├── internship-registration.spec.ts  🆕 Priority 2
│   ├── internship-logbook-full.spec.ts  🆕 Priority 2
│   ├── deadline-calendar.spec.ts        🆕 Priority 2
│   └── project-pairs.spec.ts           🆕 Priority 3
│
├── 07-admin/                    # 🆕 ทั้งหมด
│   ├── document-management.spec.ts      🆕 Priority 1
│   ├── defense-queues.spec.ts           🆕 Priority 1
│   ├── exam-results.spec.ts             🆕 Priority 1
│   ├── reports.spec.ts                  🆕 Priority 2
│   └── bulk-upload.spec.ts              🆕 Priority 3
│
├── 08-internship/               # 🆕 ทั้งหมด
│   └── company-browse.spec.ts           🆕 Priority 3
│
├── 09-public/                   # 🆕 ทั้งหมด
│   └── timesheet-approval.spec.ts       🆕 Priority 1
│
├── 10-notifications/            # 🆕 ทั้งหมด
│   └── notifications.spec.ts            🆕 Priority 2
│
├── 11-responsive/               # 🆕 ทั้งหมด
│   └── mobile-views.spec.ts             🆕 Priority 3
│
├── 12-pdf-generation/           # 🆕 ทั้งหมด
│   └── pdf-downloads.spec.ts            🆕 Priority 3
│
└── 13-error-handling/           # 🆕 ทั้งหมด
    └── error-states.spec.ts             🆕 Priority 3
```

---

## 4. สิ่งที่ต้องเตรียมเพิ่ม

### Selectors ที่ต้องเพิ่มใน helpers/selectors.ts

```typescript
// Admin Documents
ADMIN_DOC_TABLE: 'table, [class*="document"]',
ADMIN_DOC_FILTER_STATUS: 'select, [data-testid="status-filter"]',
ADMIN_DOC_APPROVE_BTN: 'text=อนุมัติ',
ADMIN_DOC_REJECT_BTN: 'text=ไม่อนุมัติ',

// Admin Reports
REPORT_YEAR_FILTER: 'select, [data-testid="year-filter"]',
REPORT_EXPORT_BTN: 'text=ส่งออก, text=Export',

// Student Dashboard
DASHBOARD_PROJECT_CARD: '[class*="project"], [data-testid="project-card"]',
DASHBOARD_DEADLINE_LIST: '[class*="deadline"], [data-testid="deadlines"]',
DASHBOARD_STATS: '[class*="stats"], [data-testid="stats"]',

// Notifications
NOTIFICATION_BELL: '[class*="notification"], [data-testid="notification-bell"]',
NOTIFICATION_COUNT: '[class*="badge"], [data-testid="unread-count"]',
NOTIFICATION_LIST: '[class*="notification-list"]',

// Calendar
CALENDAR_VIEW: '[class*="calendar"]',
CALENDAR_EVENT: '[class*="event"], [class*="deadline-item"]',

// Certificate
CERT_REQUEST_BTN: 'text=ขอใบรับรอง, text=Request Certificate',
CERT_DOWNLOAD_BTN: 'text=ดาวน์โหลด, text=Download',
CERT_STATUS: '[data-testid="cert-status"]',
```

### Seed Data ที่ต้องเพิ่มใน seed/seed-config.ts

```typescript
// สำหรับ evaluation flow
export const EVALUATION_TEST_DATA = {
  approvalToken: 'test-eval-token-xxx',
  timesheetToken: 'test-timesheet-token-xxx',
};

// สำหรับ document management
export const DOCUMENT_TEST_DATA = {
  pendingInternshipDoc: { id: 'xxx', type: 'cs05', status: 'pending' },
  pendingProjectDoc: { id: 'xxx', type: 'proposal', status: 'pending' },
  pendingCertificate: { id: 'xxx', status: 'pending' },
};

// สำหรับ exam results
export const EXAM_TEST_DATA = {
  pendingTopicExam: { projectId: 'xxx', studentName: 'E2E Student' },
  pendingProjectExam: { projectId: 'xxx' },
  pendingThesisExam: { projectId: 'xxx' },
};

// สำหรับ defense queues
export const QUEUE_TEST_DATA = {
  kp02PendingVerify: { requestId: 'xxx', status: 'advisor_approved' },
  systemTestPending: { requestId: 'xxx', status: 'pending_staff' },
};
```

---

## 5. จำนวน Test Cases โดยรวม

| Priority | จำนวน Spec Files | Test Cases (ประมาณ) | สถานะ |
|---|---|---|---|
| มีอยู่แล้ว | 13 | ~90 tests | ✅ Done |
| 🔴 Priority 1 | 9 | ~65 tests | ต้องทำ |
| 🟡 Priority 2 | 8 | ~55 tests | ควรทำ |
| 🟢 Priority 3 | 7 | ~40 tests | ทำได้ถ้ามีเวลา |
| **รวม** | **37** | **~250 tests** | |

### เป้าหมาย Coverage หลังเพิ่ม Priority 1: ~55%
### เป้าหมาย Coverage หลังเพิ่ม Priority 1+2: ~80%
### เป้าหมาย Coverage หลังเพิ่มทั้งหมด: ~95%

---

## 6. คำแนะนำการ Implement

1. **เริ่มจาก Priority 1** — เป็น critical business flows ที่ใช้จริงมากที่สุด
2. **เพิ่ม data-testid** ใน frontend components — จะทำให้ selector stable กว่าใช้ text ภาษาไทย
3. **Seed data ต้อง idempotent** — รัน seed ซ้ำได้ไม่พัง
4. **แยก API tests ออก** — ใช้ `request` context ของ Playwright test API โดยตรง (เร็วกว่า UI test)
5. **Integrate CI/CD** — เพิ่ม GitHub Actions step ให้รัน E2E ก่อน deploy
