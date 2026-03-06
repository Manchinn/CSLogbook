## Session Progress Log

### Branch: `claude/claude-md-mm56ik11ksjo6flh-JgWXL`

---

### UX/UI Audit (2026-03-02)

| Metric | Score | Notes |
|--------|-------|-------|
| Overall UX Maturity | 5/10 | Mid-level - has foundations but lacks systemization |
| Design System | 3/10 | No component library; custom CSS everywhere |
| Consistency | 4/10 | Patterns exist but not enforced |
| Accessibility | 2/10 | Minimal ARIA, browser dialogs, no keyboard testing |
| Maintainability | 6/10 | Good code organization, hooks pattern solid |

#### Critical Issues Found & Fixed

| Priority | Issue | Location | Fix | Status |
|----------|-------|----------|-----|--------|
| 1 | Form labels not associated with inputs | admin/students, admin/teachers, project-pairs | Add `htmlFor`/`id` | ✅ Done |
| 2 | `window.confirm()` for destructive actions | 3 files | Create ConfirmDialog component | ✅ Done |
| 3 | No skeleton loading states | admin/students | Create TableSkeleton, StatSkeleton | ✅ Done |
| 4 | Table overflow on mobile | Admin tables | Add responsive styles | Pending |
| 5 | No error boundaries | Entire app | Add ErrorBoundary wrapper | Pending |
| 6 | Inconsistent spacing scale | CSS modules | Define spacing constants | Pending |
| 7 | Duplicated button CSS | ~15 files | Extract Button component | Pending |
| 8 | No focus management after actions | All drawers | Add focus ref management | Pending |

---

### ✅ งานที่ทำเสร็จแล้ว

#### Session 1 — Bug Fixes & Quality (2026-02-27)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Fix login error แสดง raw JSON แทนข้อความภาษาไทย | `src/lib/api/client.ts` |
| Fix dashboard status badges แสดง raw enum (`not_requested` → `ยังไม่ร้องขอ`) | `StudentInternshipStatusWidget.tsx` |
| สร้าง shared utility `statusLabels.ts` | `src/lib/utils/statusLabels.ts` (ใหม่) |
| Fix teacher dashboard label "โปรเจกต์ที่ active" → "โปรเจกต์ที่ใช้งานอยู่" | `TeacherOverviewWidget.tsx` |
| Fix teacher meeting-approvals page แสดงหน้าว่าง (type mismatch) | `teacherService.ts` |
| ขยาย `labelStatus()` ไปยัง TopicExamContent, StudentDeadlineCalendar, InternshipSummaryView, admin academic page | 4 ไฟล์ |
| Fix certificate PDF: เพิ่ม Thai font (Loma) ให้ render ภาษาไทยได้ | `certificate.service.js`, `Dockerfile`, `fonts/` |
| Fix certificate PDF: แก้การแสดงวันที่ผิด | `documentService.js` |
| Fix certificate-request validator: อนุญาต `studentId` + `totalHours` | `internshipValidators.js` |
| เพิ่ม compatibility docs (ROUTE_USAGE_REPORT, SAFE_DEPRECATION_LIST, DO_NOT_REMOVE_API_USAGE, ROUTE_CLEAN_LIST) | `frontend-next/docs/compatibility/` |
| เพิ่ม CLAUDE.md project instructions | `CLAUDE.md` |
| ลบ PATCH_PLAN_SETTINGS_ENDPOINTS.md (deferred to backlog) | — |

#### Session 2 — Phase 2 Teacher/Staff Approval Fix (2026-02-28)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Fix `submitKP02AdvisorDecision` ไม่ส่ง `defenseType` → backend fallback เป็น PROJECT1 เสมอ (bug ทำให้ thesis approval ทำงานผิด) | `teacherService.ts` |
| อัปเดต `useSubmitKP02AdvisorDecision` hook ให้รับและส่ง `defenseType` พร้อม fix cache invalidation ให้ครอบคลุมทั้ง kp02 และ thesis queue | `useTeacherModule.ts` |
| Pass `defenseType: "THESIS"` ใน thesis advisor queue page | `teacher/thesis/advisor-queue/page.tsx` |
| Pass `defenseType: "PROJECT1"` ใน project1 advisor queue page | `teacher/project1/advisor-queue/page.tsx` |

#### Session 3 — Phase 2 Overview Page Parity (2026-02-28)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| แก้ raw `currentPhase` enum แสดงเป็น Thai labels (`IN_PROGRESS` → "กำลังดำเนินการ") | `ProjectPhase2Content.tsx` |
| เพิ่ม thesis exam result card (ผ่าน=เขียว/ไม่ผ่าน=แดง) เมื่อ `thesisExamResult` มีค่า | `ProjectPhase2Content.tsx`, `phase2.module.css` |
| อัปเกรด step badges เป็น tone-aware (success/danger/warning/info) | `ProjectPhase2Sections.tsx`, `phase2.module.css` |
| เพิ่ม `canSubmitThesisDefense` gating — ล็อก thesis step เมื่อ workflow state ไม่อนุญาต | `ProjectPhase2Sections.tsx`, `ProjectPhase2Content.tsx` |
| เพิ่มปุ่ม "ไปยังบันทึกการพบ" ใน meeting logbook section | `ProjectPhase2Sections.tsx`, `phase2.module.css` |
| เพิ่ม loading state + empty "ยังไม่มีโครงงาน" notice | `ProjectPhase2Content.tsx` |
| ใช้ shared `DEFAULT_DEADLINE_KEYWORD_FILTER` แทน local copy | `ProjectPhase2Content.tsx` |

#### Session 4 — Phase 2 Advisor Name Display (2026-03-01)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม `Teacher` include (advisor + coAdvisor) ใน `projectDocumentService.getProjectById()` | `backend/services/projectDocumentService.js` |
| เพิ่ม `advisorName`, `coAdvisorName` ใน `serialize()` | `backend/services/projectDocumentService.js` |
| เพิ่ม `advisorName?`, `coAdvisorName?` fields ใน `ProjectSummary` type | `src/lib/services/studentService.ts` |
| แสดงชื่ออาจารย์ที่ปรึกษา (+ ร่วม) ใน hero card ของ Phase 2 overview | `ProjectPhase2Content.tsx` |

#### Session 5 — Admin UI Pattern Refactor (2026-03-01)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| แก้ teachers drawer view mode: เพิ่ม `detailSection` grouping (ข้อมูลทั่วไป / ตำแหน่ง / สิทธิ์การใช้งาน) | `admin/users/teachers/page.tsx` |
| แก้ teachers subtitle จาก dev text เป็น user-facing | `admin/users/teachers/page.tsx` |
| เพิ่ม `.detailSection`, `.detailTitle`, `.alert*` ใน teachers CSS | `admin/users/teachers/page.module.css` |
| แก้ project-pairs feedback banner ให้ใช้ `.alert.alertSuccess/alertWarning` แทน tagOk/tagMuted | `project-pairs/page.tsx` |
| แก้ "เพิ่มโครงงานพิเศษ" button เป็น `buttonPrimary` (blue) | `project-pairs/page.tsx` |
| แก้ project-pairs subtitle จาก dev text เป็น user-facing | `project-pairs/page.tsx` |
| เพิ่ม `type="button"` ทุกปุ่มใน project-pairs | `project-pairs/page.tsx` |
| แก้ drawer structure: เพิ่ม `drawerFooter` — ย้าย action buttons ออกจาก drawerBody | `project-pairs/page.tsx` |
| ใช้ `detailSection` grouping ใน drawer view mode (เหมือน students) | `project-pairs/page.tsx` |
| Expand one-liner JSX เป็น readable multi-line | `project-pairs/page.tsx` |
| เพิ่ม `.alert*`, `.buttonPrimary`, `.buttonDanger`, `.drawerFooter`, `.detailSection` | `project-pairs/page.module.css` |
| อัปเดต `.drawer` grid: `auto 1fr` → `auto 1fr auto` | `project-pairs/page.module.css` |
| สร้าง docs/claudefix/admin-ui-pattern-refactor.md | `docs/claudefix/admin-ui-pattern-refactor.md` (ใหม่) |

#### Session 6 — Unified Project Page Redesign & Naming Audit (2026-03-01)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| สร้าง `ProjectContent.tsx` — unified component รวม Phase 1 + Phase 2 ในหน้าเดียว | `project/phase1/view/ProjectContent.tsx` (ใหม่) |
| `PhaseStepsGrid`: เพิ่ม `showSectionDividers` prop + section dividers ระหว่าง phase1/phase2 | `ProjectPhase1Sections.tsx` |
| เพิ่ม CSS สำหรับ section dividers | `phase1.module.css` |
| `phase1/page.tsx`: เปลี่ยน import เป็น `ProjectContent` | `project/phase1/page.tsx` |
| `phase2/page.tsx`: เปลี่ยนเป็น `redirect("/project/phase1")` แบบ clean | `project/phase2/page.tsx` |
| ลบ phase2 ออกจาก navigation menu | `src/lib/navigation/menuConfig.ts` |
| Naming audit ครบ 10 ไฟล์: `"โครงงานพิเศษ 2"` → `"ปริญญานิพนธ์"` ทุกที่ | หลายไฟล์ (ดู doc) |
| แก้ `InternshipSummaryView`: text wrapping + tone-aware status tags | `InternshipSummaryView.tsx`, `summary.module.css` |
| สร้าง docs/claudefix/project-unified-redesign.md | `docs/claudefix/project-unified-redesign.md` (ใหม่) |

#### Session 7 — Admin Documents UI + Teacher Position Flow (2026-03-01)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม custom select dropdown styles (SVG arrow, hover/focus) ทุก admin page | `admin/documents/certificates/page.module.css`, `admin/documents/internship/page.module.css`, `admin/settings/settings.module.css`, `admin/topic-exam/results/page.module.css`, `admin/upload/page.module.css`, `admin/users/students/page.module.css`, `admin/users/teachers/page.module.css` |
| เพิ่ม `teacherPosition` ใน token generation + verify-token response | `backend/services/authService.js`, `backend/routes/authRoutes.js` |
| อัปเดต `authService.ts` frontend ให้รับ `teacherPosition` จาก login/verifyToken | `src/lib/api/authService.ts` |
| อัปเดต `menuConfig.ts`: `canApproveDocuments` ใช้ `teacherPosition` แทน role | `src/lib/navigation/menuConfig.ts` |
| อัปเดต `RoleGuard.tsx`: `requireHeadOfDepartment` ตรวจ `teacherPosition` | `src/components/auth/RoleGuard.tsx` |
| ปรับ admin documents internship page — icon buttons + UI improvements | `admin/documents/internship/page.tsx`, `admin/documents/internship/page.module.css` |
| ปรับ admin documents certificates page | `admin/documents/certificates/page.tsx` |
| ปรับ approve-documents page | `approve-documents/page.tsx` |
| เพิ่ม admin project documents detailed view + สร้าง service | `admin/documents/project/page.tsx`, `src/lib/services/adminProjectDocumentsService.ts` |
| ปรับ admin system-test staff-queue + topic-exam results + students pages | `admin/system-test/staff-queue/page.tsx`, `admin/topic-exam/results/page.tsx`, `admin/users/students/page.tsx` |

#### Session 8 — UX/UI Audit: ConfirmDialog + Skeleton Loading (2026-03-02)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| สร้าง `ConfirmDialog` component — แทน `window.confirm` ทุกที่ | `src/components/common/ConfirmDialog.tsx` (ใหม่) |
| สร้าง `Skeleton` component + CSS — skeleton loading สำหรับ table/card | `src/components/common/Skeleton.tsx` (ใหม่), `src/components/common/Skeleton.module.css` (ใหม่) |
| แทนที่ `window.confirm` ด้วย `ConfirmDialog` ใน admin students/teachers delete | `admin/users/students/page.tsx`, `admin/users/teachers/page.tsx` |
| แทนที่ `window.confirm` ด้วย `ConfirmDialog` ใน meeting logbook deletion | `project/phase1/meeting-logbook/page.tsx` |
| เพิ่ม skeleton loading ใน AdminStudentsPage, AdminTeachersPage, ProjectPairsPage | `admin/users/students/page.tsx`, `admin/users/teachers/page.tsx`, `project-pairs/page.tsx` |
| CSS improvements สำหรับ form fields | `admin/users/students/page.module.css`, `admin/users/teachers/page.module.css`, `project-pairs/page.module.css` |

#### Session 11 — Cross-Layer System Audit & Critical Fixes (2026-03-03)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| SECURITY: เพิ่ม RBAC middleware (`authorize.fromAllowed`) บน admin workflow statistics endpoint | `backend/routes/projectWorkflowStateRoutes.js` |
| เปลี่ยน 4 TODO stub controllers เป็น 501 Not Implemented (ป้องกัน fake success) | `backend/controllers/teacherController.js` |
| Extract hardcoded `passScore = 70` เป็น `config/scoring.js` กลาง | `backend/config/scoring.js` (ใหม่) |
| อัปเดต documentService ใช้ `PASS_SCORE` จาก config | `backend/services/documentService.js` |
| อัปเดต evaluation.service ใช้ `PASS_SCORE` จาก config | `backend/services/internship/evaluation.service.js` |
| อัปเดต reportService ใช้ `SCORE_BUCKETS` + `scoreToBucket()` จาก config | `backend/services/reportService.js` |
| ลบ orphaned route files (duplicate ที่ mount แล้วใน adminRoutes + dead files) | ลบ 4 ไฟล์: `notificationSettingsRoutes.js`, `workflowStepDefinitionRoutes.js`, `studentpairsRoutes.js`, `internship-status-update.js` |
| ลบ unused backend code | ลบ: `services/projectEventService.js`, `controllers/documents/documentStatusController.js` |

#### Session 12 — Multi-Layer Audit + Bug Fixes (2026-03-03)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| อัปเดต CLAUDE.md เพิ่ม Session 7 และ Session 8 ที่ขาดหายไป | `CLAUDE.md` |
| Fix P1: แก้ query key mismatch — `useTeacherOverview` ใช้ `["teacher-overview", token]` แต่ mutations invalidate `["teacher", "overview"]` → dashboard ไม่ refresh หลัง approve | `src/hooks/useTeacherOverview.ts` |
| Fix console error: `<>` ใน `.map()` ไม่รับ `key` prop → เปลี่ยนเป็น `<Fragment key={...}>` | `src/components/teacher/AdvisorQueueTable.tsx` |
| Revert P2 (incorrect fix): field name `note` ถูกต้องอยู่แล้วทั้ง backend และ frontend — ไม่ใช่ `comments` ตามที่ audit ครั้งก่อนระบุผิด | `src/lib/services/teacherService.ts` |
| Security Audit: teacher API endpoints — พบ IDOR risk ใน `PUT /teachers/:id`, dead routes 5 ตัว, report endpoints ไม่มี role check | (audit only) |
| Integration Audit: cross-layer teacher frontend↔backend — พบ cache key mismatch (fixed), unverified internship endpoints 6 ตัว | (audit only) |
| Approval Flow Audit: ตรวจสอบ 6 document types ครบ — Topic Exam, คพ.02, Project1 Result, System Test, คพ.03, Thesis Result | (audit only) |

#### Session 13 (user, 2026-03-03) — CI/CD Pipeline & Infrastructure

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| CI/CD pipeline with GitHub Actions for zero-downtime deployment | `.github/workflows/production-deploy.yml` |
| Fix: normalize image owner to lowercase for GHCR compatibility | `.github/workflows/production-deploy.yml` |
| Fix: frontend image build step with env handling | `.github/workflows/production-deploy.yml` |
| เพิ่ม `ALLOWED_ORIGINS` env var สำหรับ CORS configuration | `backend/.env.example`, `backend/app.js`, `backend/server.js`, `docker-compose.production.yml` |
| เพิ่ม public timeline endpoint + restructure Nginx configuration | `backend/app.js`, `backend/server.js`, `nginx/cslogbook.conf` |
| เพิ่ม healthcheck สำหรับ backend service | `docker-compose.production.yml` |
| CORS middleware with dynamic allowed origins | `backend/app.js`, `backend/config/corsOrigins.js` (ใหม่), `backend/server.js` |
| Fix: เพิ่ม `teacherPosition` field ใน `VerifyTokenResponse` type | `src/lib/api/authService.ts` |
| Enhance status labels and translations ทั่ว frontend | หลายไฟล์ (17 ไฟล์) |
| เปลี่ยนคำว่า "แดชบอร์ด" → "หน้าหลัก" ทั้ง frontend + docs | หลายไฟล์ (12 ไฟล์) |
| Enhance admin settings UI and validation (academic semester) | `backend/agents/schedulers/academicSemesterScheduler.js`, `backend/routes/adminRoutes.js`, `backend/services/academicService.js`, `backend/validators/academicValidators.js`, frontend admin settings |

#### Session 14 (user + claude, 2026-03-04) — Features, UI Polish & Internship

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม CSLogbook logo component + update branding in layout | `src/components/layout/` |
| Enhance exam submission and meeting logbook features + DefenseRequestStepper | `project/phase1/exam-submit/`, `project/phase1/meeting-logbook/`, `project/phase2/system-test/`, `project/phase2/thesis-defense/`, `src/components/common/DefenseRequestStepper.tsx` (ใหม่) |
| เพิ่ม progress bar for approved logs in meeting logbook | `project/phase1/meeting-logbook/page.tsx` |
| Refactor button styles + introduce design tokens (`globals.css`) | `src/app/globals.css`, `project/phase1/meeting-logbook/` |
| Refactor CreateWizard to single form layout + enhance Step components | `project/phase1/topic-submit/CreateWizard.tsx`, `StepClassification.tsx`, `StepMembers.tsx`, `StepReview.tsx`, `TopicSubmitContent.tsx` |
| Update Thai language strings for improved clarity | `ProjectContent.tsx`, `ProjectPhase1Sections.tsx`, `TopicSubmitContent.tsx` |
| Enhance `ProjectDefenseRequest` type — เพิ่ม advisor name + comment fields | `src/lib/services/projectService.ts` |
| Update internship registration links + เพิ่ม NotFound page | `not-found.tsx` (ใหม่), internship views (4 ไฟล์) |
| Update CSS styles for student profile + eligibility widget | `student-profile/page.tsx`, `StudentEligibilityWidget.tsx` |
| เพิ่ม SurveyBanner component ใน admin/student/teacher dashboards | `src/components/dashboard/SurveyBanner.tsx` (ใหม่), dashboard pages (3 ไฟล์) |
| เพิ่ม hooks สำหรับ internship referral letter status + download | `src/hooks/useInternshipReferralLetter.ts` (ใหม่), `backend/routes/documents/internshipRoutes.js`, `backend/controllers/documents/internshipController.js` |
| เพิ่ม acceptance letter template PDF | `backend/public/forms/acceptance-letter-template.pdf` (ใหม่) |
| (claude) เพิ่ม approval request button + modal ใน internship logbook page | `internship/logbook/InternshipLogbookView.tsx`, `logbook.module.css`, `useInternshipLogbook.ts` |
| (claude) Fix: remove invalid Academic association from referral letter query | `backend/services/internship/referralLetter.service.js` |

#### Session 15 (user, 2026-03-05) — Survey & Timesheet

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Fix SURVEY_URL to actual Google Form link + enable card display | `SurveyBanner.tsx`, `ProjectContent.tsx`, `ProjectPhase1Sections.tsx` |
| เพิ่ม delete functionality for timesheet entries with confirmation dialog | `backend/controllers/logbooks/internshipLogbookController.js`, `backend/routes/documents/logbookRoutes.js`, `backend/services/internshipLogbookService.js`, frontend timesheet view + hook + service |

#### Session 16 (claude, 2026-03-06) — Teacher Queue Status Filters & Endpoint Verification

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| ยืนยัน 7 Unverified Endpoints — ทุก route มีอยู่จริงใน backend + มี RBAC ครบ | (audit only — ลบออกจาก backlog) |
| Backend: เพิ่ม status query param support ใน system-test advisor queue | `backend/controllers/projectSystemTestController.js`, `backend/services/projectSystemTestService.js` |
| Frontend: เพิ่ม status filter dropdown ใน meeting-approvals page | `teacher/meeting-approvals/page.tsx`, `MeetingApprovals.module.css` |
| Frontend: เพิ่ม status filter ใน AdvisorQueueTable shared component | `components/teacher/AdvisorQueueTable.tsx`, `AdvisorQueue.module.css` |
| อัปเดต hooks + services ให้รับ filter params ทั้ง 4 หน้า | `useTeacherModule.ts`, `teacherService.ts` |
| เพิ่ม `AdvisorQueueFilters` type + ส่ง status filter จาก 3 advisor queue pages | `project1/advisor-queue/page.tsx`, `thesis/advisor-queue/page.tsx`, `system-test/advisor-queue/page.tsx` |

#### Session 17 (claude, 2026-03-06) — Teacher Queue Always-Show Table + Summary Stats

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม `QueueSummary` + `MeetingApprovalsResponse` types — service คืน `{ items, summary }` แทน array | `src/lib/services/teacherService.ts` |
| อัปเดต `useTeacherMeetingApprovals` hook รองรับ response shape ใหม่ | `src/hooks/useTeacherModule.ts` |
| เพิ่ม `summary` prop ใน `AdvisorQueueTable` — แสดง summary badges (total/pending/approved/rejected) | `src/components/teacher/AdvisorQueueTable.tsx` |
| Table แสดงเสมอ — empty row message แทนการซ่อน table ทั้งหมด | `src/components/teacher/AdvisorQueueTable.tsx` |
| เพิ่ม CSS: `.summaryBar`, `.summaryBadge`, `.emptyRow` | `src/components/teacher/AdvisorQueue.module.css` |
| Meeting-approvals page: ใช้ summary จาก API + table แสดงเสมอ + ลบ `TeacherEmptyState` | `teacher/meeting-approvals/page.tsx` |
| เพิ่ม CSS: summary bar + empty row สำหรับ meeting-approvals | `teacher/meeting-approvals/MeetingApprovals.module.css` |

#### Session 18 (claude, 2026-03-06) — Advisor Queue Summary Stats (Backend + Frontend)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Backend: เพิ่ม summary aggregation (COUNT GROUP BY status) ใน `getAdvisorApprovalQueue()` — คืน `{ items, summary }` แทน flat array | `backend/services/projectDefenseRequestService.js` |
| Backend: เพิ่ม summary aggregation ใน `advisorQueue()` — map system-test statuses เป็น pending/approved/rejected | `backend/services/projectSystemTestService.js` |
| Frontend: เพิ่ม `AdvisorQueueResponse<T>` type + อัปเดต 3 service functions ให้คืน `{ items, summary }` | `src/lib/services/teacherService.ts` |
| Frontend: อัปเดต 3 advisor queue pages ให้ destructure `{ items, summary }` + pass `summary` prop ไปยัง `AdvisorQueueTable` | `teacher/project1/advisor-queue/page.tsx`, `teacher/thesis/advisor-queue/page.tsx`, `teacher/system-test/advisor-queue/page.tsx` |

#### Session 19 (claude, 2026-03-06) — Teacher Queue UI Redesign + Meeting Approvals Bug Fix

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Fix: meeting-approvals React key warning — backend returns `logId` but frontend used `id`; เพิ่ม data mapping layer ใน service | `src/lib/services/teacherService.ts` |
| Redesign: AdvisorQueue CSS — elevated summary badges, gradient table header, status dot indicators, spring-curve button animations, modal backdrop blur + slide-in, expanded row fade-in | `src/components/teacher/AdvisorQueue.module.css` |
| Redesign: MeetingApprovals CSS — consistent design language กับ AdvisorQueue, polished bulk action bar + slide-in animation | `teacher/meeting-approvals/MeetingApprovals.module.css` |
| Refactor: รวม filter + summary เป็น `.toolbar` flex row (summary pushed right) ใน AdvisorQueueTable | `src/components/teacher/AdvisorQueueTable.tsx` |
| Refactor: รวม filter + summary เป็น `.toolbar` flex row ใน meeting-approvals page | `teacher/meeting-approvals/page.tsx` |
| Accessibility: เพิ่ม `aria-label` บน checkboxes, `sr-only` text บน expand column, ลบ inline styles | `AdvisorQueueTable.tsx`, `meeting-approvals/page.tsx` |

#### Session 20 (claude, 2026-03-06) — Staging / Regression Test Plan Update

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| อัปเดต `STAGING_TEST_PLAN.md` ให้ครอบคลุม Sessions 1-19 (เดิมเป็น version 2026-02-15 ยังใช้ feature flags) | `docs/STAGING_TEST_PLAN.md` |
| จัดหมวดหมู่ test cases ตาม priority: P0 (critical path), P1 (module-level), P2 (cross-cutting), P3 (UI quality) | `docs/STAGING_TEST_PLAN.md` |
| เพิ่ม test cases ใหม่สำหรับ: teacher queue redesign, summary stats, ConfirmDialog, Skeleton, DefenseRequestStepper, SurveyBanner, referral letter, timesheet delete, 404 page | `docs/STAGING_TEST_PLAN.md` |
| อัปเดต CLAUDE.md — เพิ่ม Session 20, ย้าย staging testing เป็น "Planned" | `CLAUDE.md` |

#### Session 21 (claude, 2026-03-06) — Dead Routes Cleanup & Report RBAC

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| ลบ 9 dead routes จาก teacherRoutes.js: `/me/profile`, `/user/:userId`, `PUT /:id` (IDOR risk), `DELETE /:id`, + 4 stub routes (support/documents) | `backend/routes/teacherRoutes.js` |
| ลบ 6 dead controller functions: `getMyTeacherProfile`, `getTeacherByUserId`, `getAdvisees`, `submitEvaluation`, `getSupportDashboard`, `createAnnouncement`, `getDocuments` | `backend/controllers/teacherController.js` |
| ⚠️ **False positive:** ลบ `getAcademicDashboard` route + controller ผิด — frontend teacher dashboard ยังใช้อยู่ → แก้ไขแล้วใน Session 22 | — |
| SECURITY: เพิ่ม RBAC (`authorize.fromAllowed(['admin', 'teacher'])`) บน report routes ทั้ง 17 เส้น — เดิม student สามารถดู admin reports ได้ | `backend/routes/reportRoutes.js` |
| ลบ unused permission policies: `selfProfile`, `supportOnly`, `teacherOnly` | `backend/policies/permissions.js` |

#### Session 22 (claude, 2026-03-06) — Hotfix: Restore Teacher Dashboard Endpoint

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Hotfix: เพิ่ม `getAcademicDashboard` controller กลับ — ถูกลบผิดใน Session 21 (false positive: frontend ยังใช้ `/teachers/academic/dashboard`) | `backend/controllers/teacherController.js` |
| Hotfix: เพิ่ม route `GET /academic/dashboard` กลับ พร้อม RBAC `teachers.academicOnly` | `backend/routes/teacherRoutes.js` |

---

### ❌ งานที่ยังต้องทำต่อ

#### 1. Staging / Regression Testing — PLANNED

- ทดสอบ end-to-end ตาม `docs/STAGING_TEST_PLAN.md` (อัปเดตแล้ว 2026-03-06)
- **P0 Critical Path** (6 test groups): Auth, Unified Project Page, Topic Submit, Exam/Defense, Meeting Logbook, Phase 2 sub-pages
- **P1 Module-Level** (10 test groups): Teacher dashboard/queues (4), Admin users/pairs/docs/settings/dashboard (5), Student internship (4)
- **P2 Cross-Cutting** (4 test groups): Status labels, UI components, Security/RBAC, CORS/Infra
- **P3 UI Quality** (3 test groups): Responsive, Console errors, Design consistency

#### 2. Student Result Pages (Out of Scope — ไม่ได้อยู่ในขอบเขตงาน)
- `/project/phase1/exam-day` — ยังเป็น stub ("กำลังเตรียมฟีเจอร์") — **ตั้งใจ ไม่ใช่ bug**
- Thesis exam result detail page — นักศึกษาเห็นแค่ hero badge — **ตั้งใจ ไม่ใช่ bug**