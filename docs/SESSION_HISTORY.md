# Session History — CSLogbook

Detailed session logs moved from CLAUDE.md to reduce token usage.
Branch: `claude/claude-md-mm56ik11ksjo6flh-JgWXL`

---

## Summary

| # | Date | Summary |
|---|---|---|
| 1 | 02-27 | Bug fixes: login error, status badges, Thai font PDF, statusLabels utility |
| 2 | 02-28 | Fix KP02 advisor decision missing `defenseType` |
| 3 | 02-28 | Phase 2 overview: Thai labels, exam result card, thesis gating |
| 4 | 03-01 | Phase 2 advisor name display in hero card |
| 5 | 03-01 | Admin UI refactor: detailSection, drawer footer, alert patterns |
| 6 | 03-01 | Unified project page (Phase 1+2), naming audit "ปริญญานิพนธ์" |
| 7 | 03-01 | Admin documents UI + teacherPosition in JWT/RBAC |
| 8 | 03-02 | ConfirmDialog + Skeleton components, replace window.confirm |
| 11 | 03-03 | RBAC audit, scoring.js extraction, dead route cleanup |
| 12 | 03-03 | Query key mismatch fix, security/integration audits |
| 13 | 03-03 | CI/CD pipeline, CORS dynamic origins, "หน้าหลัก" rename |
| 14 | 03-04 | Logo, DefenseRequestStepper, design tokens, SurveyBanner, 404 page |
| 15 | 03-05 | Survey URL fix, timesheet delete |
| 16 | 03-06 | Teacher queue status filters, endpoint verification |
| 17 | 03-06 | Queue summary stats, always-show table pattern |
| 18 | 03-06 | Backend summary aggregation for advisor queues |
| 19 | 03-06 | Teacher queue UI redesign, meeting-approvals key fix |
| 20 | 03-06 | Staging test plan update (P0-P3 categories) |
| 21 | 03-06 | Dead routes cleanup, report RBAC (17 routes) |
| 22 | 03-06 | Hotfix: restore getAcademicDashboard (false positive) |
| 23 | 03-06 | Academic/curriculum bug fixes (B1-F5), settings page redesign |
| 24 | 03-07 | PDF system audit: Thai font fix, data correctness, departmentInfo config |
| 26 | 03-07 | Notification settings UI: Thai labels + bullet details, email infra audit |
| 27 | 03-07 | Gmail REST API migration, SSO email mapping, login notification |
| 28 | 03-07 | Email improvements: retry logic, base template, fire-and-forget, tx bug fix |
| 29 | 03-08 | Status/workflow audit (3 layers), remove 4 unused ProjectWorkflowState columns |
| 30 | 03-08 | C3-C6 tech debt fixes: label centralization, phantom statuses, ENUM constraints |
| 31 | 03-08 | Workflow state audit → WORKFLOW_STATES.md, evidence_submitted virtual→real fix |
| 32 | 03-08 | Generate workflowStates.ts constants (enums, transitions, UI config) + 5-round verification |
| 33 | 03-08 | Playwright E2E testing setup: 156 tests (153 pass), 5 phases, multi-role auth |
| 34 | 03-08 | E2E tests: admin settings & teacher advisor (22 tests, 21 pass) |
| 35 | 03-08 | E2E tests: multi-role workflow specs — meeting-logbook, kp02-defense, thesis-flow (19 tests) |
| 36 | 03-08 | E2E tests: security route-access (40 tests) + internship workflow B1-B5 (66 tests) |
| 37 | 03-09 | E2E seed script (7-step pipeline) + fix test skip conditions (160 pass, 172 skip) |
| 38 | 03-09 | PDF audit + สร้างหนังสือขอความอนุเคราะห์ (NEW PDF) + แก้ flow ปุ่ม download 3 ปุ่ม |
| 39 | 03-09 | PDF data flow deep dive + fix 3 bugs (studentCode, date format, doc number year) |
| 40 | 03-09 | PDF preview/download audit + fix filename .pdf, Content-Disposition header |
| 41 | 03-09 | PDF security audit + IDOR fixes (6/6) + PDF_AUDIT_REPORT.md |
| 42 | 03-09 | Data Integrity audit (P6) + cooperation letter recovery + fix C1/C2/H2 |
| 43 | 03-09 | Fix C3 certificate PDF (rewire to pdfkit) + H4 internshipId filter (7/7 queries) |

### Pending

- Staging regression testing — `docs/STAGING_TEST_PLAN.md`
- Student result pages (out of scope — intentional stubs)

---

## Detailed Logs

### Session 1 (claude, 2026-02-27) — Bug Fixes & Quality

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

## Session 2 (claude, 2026-02-28) — Phase 2 Teacher/Staff Approval Fix

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Fix `submitKP02AdvisorDecision` ไม่ส่ง `defenseType` → backend fallback เป็น PROJECT1 เสมอ | `teacherService.ts` |
| อัปเดต `useSubmitKP02AdvisorDecision` hook ให้รับและส่ง `defenseType` | `useTeacherModule.ts` |
| Pass `defenseType: "THESIS"` ใน thesis advisor queue page | `teacher/thesis/advisor-queue/page.tsx` |
| Pass `defenseType: "PROJECT1"` ใน project1 advisor queue page | `teacher/project1/advisor-queue/page.tsx` |

## Session 3 (claude, 2026-02-28) — Phase 2 Overview Page Parity

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| แก้ raw `currentPhase` enum แสดงเป็น Thai labels | `ProjectPhase2Content.tsx` |
| เพิ่ม thesis exam result card + tone-aware step badges | `ProjectPhase2Content.tsx`, `ProjectPhase2Sections.tsx`, `phase2.module.css` |
| เพิ่ม `canSubmitThesisDefense` gating | `ProjectPhase2Sections.tsx`, `ProjectPhase2Content.tsx` |
| เพิ่มปุ่ม "ไปยังบันทึกการพบ" + loading state + empty notice | `ProjectPhase2Sections.tsx`, `ProjectPhase2Content.tsx` |

## Session 4 (claude, 2026-03-01) — Phase 2 Advisor Name Display

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม `Teacher` include (advisor + coAdvisor) ใน `projectDocumentService.getProjectById()` | `backend/services/projectDocumentService.js` |
| เพิ่ม `advisorName`, `coAdvisorName` ใน serialize + ProjectSummary type | `backend/services/projectDocumentService.js`, `src/lib/services/studentService.ts` |
| แสดงชื่ออาจารย์ที่ปรึกษาใน hero card ของ Phase 2 overview | `ProjectPhase2Content.tsx` |

## Session 5 (claude, 2026-03-01) — Admin UI Pattern Refactor

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| แก้ teachers drawer: เพิ่ม `detailSection` grouping + subtitle | `admin/users/teachers/page.tsx`, `page.module.css` |
| แก้ project-pairs: feedback banner, button styles, drawer footer, detailSection | `project-pairs/page.tsx`, `page.module.css` |
| สร้าง docs/claudefix/admin-ui-pattern-refactor.md | `docs/claudefix/admin-ui-pattern-refactor.md` (ใหม่) |

## Session 6 (claude, 2026-03-01) — Unified Project Page Redesign & Naming Audit

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| สร้าง `ProjectContent.tsx` — unified Phase 1 + Phase 2 ในหน้าเดียว | `project/phase1/view/ProjectContent.tsx` (ใหม่) |
| `PhaseStepsGrid`: section dividers + phase2 redirect | `ProjectPhase1Sections.tsx`, `phase1.module.css`, `phase1/page.tsx`, `phase2/page.tsx` |
| Naming audit: `"โครงงานพิเศษ 2"` → `"ปริญญานิพนธ์"` (10 ไฟล์) | หลายไฟล์ |
| แก้ `InternshipSummaryView`: text wrapping + tone-aware status tags | `InternshipSummaryView.tsx`, `summary.module.css` |

## Session 7 (claude, 2026-03-01) — Admin Documents UI + Teacher Position Flow

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม custom select dropdown styles ทุก admin page | 7 CSS modules |
| เพิ่ม `teacherPosition` ใน token + frontend auth | `authService.js`, `authRoutes.js`, `authService.ts`, `menuConfig.ts`, `RoleGuard.tsx` |
| ปรับ admin documents (internship, certificates, project) + approve-documents | 4 pages + services |
| ปรับ admin system-test staff-queue + topic-exam results + students | 3 pages |

## Session 8 (claude, 2026-03-02) — UX/UI Audit: ConfirmDialog + Skeleton Loading

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| สร้าง `ConfirmDialog` + `Skeleton` components | `src/components/common/ConfirmDialog.tsx`, `Skeleton.tsx`, `Skeleton.module.css` (ใหม่) |
| แทนที่ `window.confirm` ใน admin students/teachers + meeting logbook | 3 pages |
| เพิ่ม skeleton loading ใน AdminStudentsPage, AdminTeachersPage, ProjectPairsPage | 3 pages + CSS |

## Session 11 (claude, 2026-03-03) — Cross-Layer System Audit & Critical Fixes

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| SECURITY: เพิ่ม RBAC บน admin workflow statistics endpoint | `backend/routes/projectWorkflowStateRoutes.js` |
| Extract hardcoded `passScore = 70` เป็น `config/scoring.js` กลาง | `backend/config/scoring.js` (ใหม่), 3 services |
| ลบ orphaned route files + unused backend code | 6 ไฟล์ที่ลบ |

## Session 12 (claude, 2026-03-03) — Multi-Layer Audit + Bug Fixes

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Fix query key mismatch — `useTeacherOverview` cache key ไม่ตรง mutations | `src/hooks/useTeacherOverview.ts` |
| Fix React key warning ใน AdvisorQueueTable `.map()` | `AdvisorQueueTable.tsx` |
| Revert incorrect field rename (`note` ไม่ใช่ `comments`) | `teacherService.ts` |
| Security/Integration/Approval audits (audit only) | — |

## Session 13 (user, 2026-03-03) — CI/CD Pipeline & Infrastructure

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| CI/CD pipeline with GitHub Actions for zero-downtime deployment | `.github/workflows/production-deploy.yml` |
| เพิ่ม `ALLOWED_ORIGINS` env var + CORS dynamic origins | `backend/app.js`, `backend/config/corsOrigins.js` (ใหม่), `backend/server.js` |
| เปลี่ยน "แดชบอร์ด" → "หน้าหลัก" ทั้ง frontend + docs | หลายไฟล์ (12 ไฟล์) |
| Enhance admin settings UI and validation (academic semester) | backend + frontend admin settings |

## Session 14 (user + claude, 2026-03-04) — Features, UI Polish & Internship

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม CSLogbook logo + branding | `src/components/layout/` |
| Enhance exam submission + meeting logbook + DefenseRequestStepper | `project/phase1/`, `project/phase2/`, `DefenseRequestStepper.tsx` (ใหม่) |
| Refactor CreateWizard + design tokens (`globals.css`) | `topic-submit/`, `globals.css` |
| เพิ่ม SurveyBanner, NotFound page, referral letter hooks | ใหม่ 3 ไฟล์ |
| เพิ่ม approval request button + modal ใน internship logbook | `InternshipLogbookView.tsx`, `logbook.module.css` |

## Session 15 (user, 2026-03-05) — Survey & Timesheet

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Fix SURVEY_URL + enable card display | `SurveyBanner.tsx`, `ProjectContent.tsx` |
| เพิ่ม delete functionality for timesheet entries | backend + frontend timesheet |

## Session 16 (claude, 2026-03-06) — Teacher Queue Status Filters & Endpoint Verification

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| ยืนยัน 7 Unverified Endpoints — ทุก route มีอยู่จริง | (audit only) |
| เพิ่ม status filter dropdown ใน meeting-approvals + AdvisorQueueTable | 4 pages + hooks + services |

## Session 17 (claude, 2026-03-06) — Teacher Queue Always-Show Table + Summary Stats

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม `QueueSummary` types — service คืน `{ items, summary }` | `teacherService.ts`, `useTeacherModule.ts` |
| เพิ่ม summary badges + always-show table ใน AdvisorQueueTable + meeting-approvals | `AdvisorQueueTable.tsx`, `meeting-approvals/page.tsx` + CSS |

## Session 18 (claude, 2026-03-06) — Advisor Queue Summary Stats (Backend + Frontend)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Backend: เพิ่ม summary aggregation ใน defense request + system-test services | `projectDefenseRequestService.js`, `projectSystemTestService.js` |
| Frontend: อัปเดต 3 advisor queue pages ให้ใช้ `{ items, summary }` | 3 pages + `teacherService.ts` |

## Session 19 (claude, 2026-03-06) — Teacher Queue UI Redesign + Meeting Approvals Bug Fix

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Fix meeting-approvals React key warning (`logId` vs `id`) | `teacherService.ts` |
| Redesign AdvisorQueue + MeetingApprovals CSS | `AdvisorQueue.module.css`, `MeetingApprovals.module.css` |
| Refactor toolbar layout + accessibility improvements | `AdvisorQueueTable.tsx`, `meeting-approvals/page.tsx` |

## Session 20 (claude, 2026-03-06) — Staging / Regression Test Plan Update

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| อัปเดต `STAGING_TEST_PLAN.md` ครอบคลุม Sessions 1-19 + priority categories | `docs/STAGING_TEST_PLAN.md` |

## Session 21 (claude, 2026-03-06) — Dead Routes Cleanup & Report RBAC

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| ลบ 9 dead routes + 6 dead controllers จาก teacher module | `teacherRoutes.js`, `teacherController.js` |
| SECURITY: เพิ่ม RBAC บน report routes ทั้ง 17 เส้น | `reportRoutes.js` |
| **False positive:** ลบ `getAcademicDashboard` ผิด → แก้ใน Session 22 | — |

## Session 22 (claude, 2026-03-06) — Hotfix: Restore Teacher Dashboard Endpoint

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Hotfix: เพิ่ม `getAcademicDashboard` controller + route กลับ | `teacherController.js`, `teacherRoutes.js` |

## Session 23 (claude, 2026-03-06) — Academic/Curriculum Bug Fixes & Admin Settings Redesign

**Bug Fixes (8 items):**

| Bug | งาน | ไฟล์ที่เปลี่ยน |
|---|---|---|
| B1 | `loadDynamicConstants()` ดึง Academic record ล่าสุดแทน active — cascading fallback | `backend/utils/studentUtils.js` |
| B2 | In-memory CONSTANTS ไม่ refresh — export `reloadDynamicConstants` + wire | `studentUtils.js`, `academicService.js`, `curriculumService.js` |
| B5 | `deleteCurriculum()` ไม่มี transaction — wrap ด้วย transaction | `curriculumService.js` |
| B6 | ลบ dead code `updateActiveStatus()` | `curriculumService.js` |
| F1 | ตาราง schedule แสดง raw `activeCurriculumId` — lookup name | `academic/page.tsx` |
| F2 | `currentBuddhistYear()` ซ้ำ 3 ไฟล์ — deduplicate | `thaiDateUtils.ts`, 3 report pages |
| F3 | Curriculum form ไม่ validate startYear > endYear | `curriculum/page.tsx` |
| F5 | AppShell ไม่แสดง "(อัตโนมัติ)" indicator | `AppShell.tsx` |

**Frontend Redesign — Clean & Elevated:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม 8 design tokens (shadow, surface colors, transition) | `globals.css` |
| สร้าง shared settings layout + tab navigation 6 pages | `settings/layout.tsx` (NEW) |
| Rewrite settings.module.css (~500 lines) | `settings.module.css` |
| Academic page: sub-tabs, collapsible forms, section icons, empty states | `academic/page.tsx` |
| Curriculum page: section icons, sectionAccent, empty state | `curriculum/page.tsx` |
| Button refinements: transition, active scale, focus ring | `buttons.module.css` |

## Session 24 (claude, 2026-03-07) — PDF System Audit & Fix

ตรวจสอบระบบ PDF ทั้งหมด (generate, export, display) แก้ไข Critical+High+Medium issues

**Critical Fixes:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| C1: แก้ชื่อมหาวิทยาลัยผิดในหนังสือส่งตัว ("ม.ธนบุรี" → มจพ.) | `referralLetter.service.js` |
| C2: เพิ่ม Thai font (Loma) ในหนังสือส่งตัว (เดิมใช้ Helvetica → tofu) | `referralLetter.service.js` |
| C3: เพิ่ม Thai font ใน Logbook Summary PDF | `internshipLogbookService.js` |

**High — Data Correctness:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| H1: Certificate ใช้ approvedHours แทน totalHours (ป้องกันชั่วโมงเกินจริง) | `certificate.service.js` |
| H2: Certificate evaluation query เพิ่ม internshipId filter (ป้องกันดึงผิดรอบ) | `certificate.service.js` |
| H3: CS05 status filter ใช้ CS05_POST_APPROVAL_STATUSES ใน generatePDF (เดิม filter เฉพาะ "approved") | `referralLetter.service.js` |
| H4: แก้ชื่อผู้อนุมัติจาก "ผศ.ดร.อภิชาต บุญมา" → "รศ.ดร.ธนภัทร์ อนุศาสน์อมรกุล" (3 จุด) | `certificate.service.js`, `referralLetter.service.js` |

**Medium — Architecture:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| สร้าง config/departmentInfo.js — constant กลางสำหรับชื่อผู้ลงนาม/คณะ/มหาวิทยาลัย | `config/departmentInfo.js` (NEW) |
| M1: Logbook Summary เพิ่ม page break แทน 35-row limit | `internshipLogbookService.js` |
| M2: แก้ buffer concat pattern ให้มีประสิทธิภาพ | `referralLetter.service.js` |
| M3: ลบ dead code createReferralLetterPDF() + deprecated proxy | `referralLetter.service.js`, `internshipManagementService.js` |
| M4: เพิ่ม formatThaiDate ใน dateUtils.js, ลบ duplicate ใน certificate.service | `utils/dateUtils.js`, `certificate.service.js`, `internshipManagementService.js` |

## Session 25 (claude, 2026-03-07) — Admin Report Pages Improvement

ปรับปรุงหน้ารายงานฝึกงานและโครงงานครบ 4 ด้าน: bug fixes, backend data, UI/UX, new features

**Bug Fixes:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Fix React key warning: backend ส่ง `{ key, label, avg }` เปลี่ยนเป็น `{ criteriaName, average }` ตาม frontend type | `backend/services/reportService.js`, `internship/page.tsx` |
| Fix project page ใช้ `styles.button` ที่ไม่มี → import shared `buttons.module.css` | `project/page.tsx` |
| เพิ่ม CSS classes ที่ขาด: `.pagination`, `.paginationInfo`, `.tagStatus*` color variants | `page.module.css` |

**Backend Data:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| Rewrite `getProjectStatusSummary` — query จริงจาก ProjectDocument + ProjectExamResult แทน placeholder | `backend/services/reportService.js` |
| เพิ่ม semester param ใน getProjectStatusSummary | `reportController.js`, `reportService.ts` |

**UI/UX:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม loading skeleton (StatSkeleton + TableSkeleton) ทั้ง 2 หน้า | `internship/page.tsx`, `project/page.tsx` |
| สร้าง reports layout พร้อม tab navigation (ย้าย RoleGuard จาก 5 หน้ามารวมที่ layout) | `reports/layout.tsx` (NEW), 5 report pages |
| เพิ่ม `.statItemClickable`, `.statItemActive` CSS สำหรับ KPI drill-down | `page.module.css` |
| เพิ่ม `aria-label` ให้ select elements | `internship/page.tsx`, `project/page.tsx` |

**New Features:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| สร้าง CSV export utility พร้อม BOM สำหรับภาษาไทย + ปุ่มส่งออก CSV ทั้ง 2 หน้า | `csvExport.ts` (NEW), `internship/page.tsx`, `project/page.tsx` |
| เพิ่ม semester filter ใน project report page | `project/page.tsx` |
| เพิ่ม KPI card drill-down (คลิก KPI card เพื่อ filter ตาราง) | `internship/page.tsx`, `project/page.tsx` |
| ปิด tabs: ภาระงานอาจารย์, ความคืบหน้า, กำหนดส่ง (ยังไม่พร้อม) | `reports/layout.tsx` |

## Session 26 (claude, 2026-03-07) — Notification Settings UI & Audit

**สำรวจ & ตรวจสอบ:**
- ตรวจสอบระบบ notification ทั้ง backend + frontend อย่างละเอียด
- จำแนกการทำงานจริงของแต่ละ notification type (LOGIN, DOCUMENT, LOGBOOK, EVALUATION, APPROVAL, MEETING)
- ตรวจสอบ email infrastructure: providers (Gmail API, SMTP, Ethereal, Console), templates (10 ไฟล์), env vars

**UI ปรับปรุง:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เพิ่ม `NOTIFICATION_META` mapping — ชื่อไทย + description + bullet details ของแต่ละ type | `notification-settings/page.tsx` |
| ปรับ render จาก key ภาษาอังกฤษ (LOGIN) → ชื่อไทย (เข้าสู่ระบบ) + badge + bullet list | `notification-settings/page.tsx` |
| เพิ่ม CSS: `.notifHeader`, `.notifLabel`, `.notifBadge`, `.notifDetails`, `.notifDetailItem` | `notification-settings/notification.module.css` |

**Backend:**

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| สร้าง migration อัปเดต description ทุก notification type ให้ตรงกับการใช้งานจริง | `migrations/20260307120000-update-notification-settings-descriptions.js` (NEW) |

**สรุป Email Notification System:**

| Type | ชื่อไทย | ครอบคลุม |
|------|---------|---------|
| LOGIN | เข้าสู่ระบบ | ส่ง email เมื่อเข้าสู่ระบบสำเร็จ |
| DOCUMENT | เอกสาร | ผลอนุมัติ/ปฏิเสธเอกสาร, ผล Timesheet, เตือน deadline, เอกสารค้างตรวจ |
| LOGBOOK | บันทึกประจำวัน | แจ้งส่ง logbook, คำแนะนำคุณภาพ (auto) |
| EVALUATION | การประเมินฝึกงาน | ส่งแบบประเมินให้ supervisor, แจ้งผลประเมินให้นักศึกษา/อาจารย์ |
| APPROVAL | การขออนุมัติ | คำขออนุมัติ Timesheet ไปยัง supervisor, แจ้งคุณสมบัติครบ |
| MEETING | การนัดพบอาจารย์ | แจ้งนัดหมายพบอาจารย์โครงงาน |

**Email Infrastructure:**
- Providers: Gmail API (OAuth2), Ethereal (testing), Console (debug)
- Templates: 10 HTML files ใน `backend/templates/` — Thai localization, KMUTNB branding
- Feature flags: ใช้ `NotificationSetting` table (database-driven) ไม่ใช้ .env

## Session 27 (claude, 2026-03-07) — Gmail REST API Migration + SSO Email Fix

**ปัญหา:** Email ส่งไม่ได้ใน production — VPS block outbound SMTP port 465/587

**การวินิจฉัย:**
1. สร้าง `scripts/test-gmail.js` — standalone debug script สำหรับรันใน Docker
2. พบ `unauthorized_client` → refresh token สร้างด้วย credentials คนละชุด → สร้างใหม่
3. พบ `.env.production` ไม่ถูก mount เข้า container → แก้ env ให้ตรง
4. พบ `ETIMEDOUT` ที่ smtp.gmail.com:465 → VPS block SMTP port
5. ยืนยันด้วย `nc -zv smtp.gmail.com 465` → Operation timed out

**แก้ไข:** เปลี่ยนจาก nodemailer SMTP เป็น Gmail REST API (HTTPS 443)

| งาน | ไฟล์ที่เปลี่ยน |
|---|---|
| เปลี่ยน Gmail transport จาก SMTP เป็น REST API (`gmail.users.messages.send`) | `backend/utils/gmailTransport.js` |
| สร้าง Gmail debug/test script (non-interactive, Docker-friendly) | `backend/scripts/test-gmail.js` (NEW) |
| เพิ่ม sendLoginNotification ใน SSO login flow | `backend/controllers/ssoController.js` |
| แก้ SSO email mapping — อ่าน `ssoData.email` (OIDC field) + fallback chain | `backend/services/ssoService.js` |
| ป้องกัน email overwrite ด้วยค่าไม่ valid จาก SSO | `backend/services/authService.js` |

**Architecture เปลี่ยน:**
```
ก่อน: Node.js → nodemailer → SMTP smtp.gmail.com:465 ❌
หลัง: Node.js → googleapis → Gmail REST API (HTTPS 443) ✅
```

**Interface ไม่เปลี่ยน:** `gmailTransport.initialize()`, `.sendMail()`, `.verify()`, `.close()` — caller ทุกตัวไม่ต้องแก้

**SSO Email Bug:**
- SSO ส่ง email ใน `ssoData.email` (OIDC standard) แต่ code เดิมดูแค่ `profile.email` ซึ่งเป็น `{}`
- `updateUserFromSso` overwrite email ทุกครั้ง รวมถึงค่าไม่ valid → แก้ให้ validate ก่อน overwrite
- SSO login ไม่ได้เรียก `sendLoginNotification` → เพิ่มใน ssoController callback

## Session 29 (claude, 2026-03-08) — Status/Workflow Audit & Dead Column Cleanup

**Scope:** Full-stack audit ทุกจุดที่กำหนด status, state, workflow step ทั้ง 3 layers

### Audit Results

สำรวจ 50+ DB columns, 10+ backend constants, 15+ frontend mappings — ผลอยู่ใน `plans/whimsical-exploring-dolphin.md`

**6 Observations พบ:**

| # | Issue | สถานะ |
|---|---|---|
| C1 | Case inconsistency ผลสอบ (PASS vs passed) | ✅ NOT A BUG — service layer normalize ที่ `projectExamResultService.js:464` |
| C2 | STRING(50) columns ไม่มี constraint ใน ProjectWorkflowState | ✅ **แก้แล้ว** — ลบ 4 columns |
| C3 | Frontend label duplication (11 files สร้าง local statusLabel() ซ้ำ) | ✅ **แก้แล้ว** (Session 30) |
| C4 | `documentService.js` STATUS_LABELS มีค่าไม่ตรง Document ENUM | ✅ **แก้แล้ว** (Session 30) |
| C5 | DefenseRequestStepper handle `staff_returned`, `advisor_rejected` ไม่มีใน DB ENUM | ✅ **แก้แล้ว** (Session 30) |
| C6 | `InternshipEvaluation.status` เป็น STRING ไม่มี constraint | ✅ **แก้แล้ว** (Session 30) |

### C2 Fix: ลบ 4 unused columns จาก project_workflow_states

| ไฟล์ | Action |
|---|---|
| `backend/migrations/20260308100000-remove-unused-workflow-state-columns.js` | **สร้างใหม่** — migration ลบ 4 columns |
| `backend/models/ProjectWorkflowState.js` | ลบ 4 field definitions + ลบ write code ใน `updateFromDefenseRequest()` |
| `backend/scripts/backfillProjectWorkflowStates.js` | ลบ 2 lines ที่ populate topic/thesis defense status |

**Columns ที่ลบ:**
- `topic_defense_status` — snapshot only, ไม่มีใครอ่าน
- `thesis_defense_status` — snapshot only, ไม่มีใครอ่าน
- `system_test_status` — NULL ทั้งหมด, ไม่เคยถูกเขียน
- `final_document_status` — NULL ทั้งหมด, ไม่เคยถูกเขียน

**Note:** `permissions.js` มี `finalDocumentStatus` เป็น RBAC permission name — ไม่เกี่ยวกับ DB column, ไม่ต้องแก้

## Session 30 (claude, 2026-03-08) — C3-C6 Tech Debt Fixes

**Scope:** แก้ 4 tech debt items ที่พบจาก Session 29 audit

### C5: DefenseRequestStepper phantom statuses

| ไฟล์ | Action |
|---|---|
| `frontend-next/src/components/common/DefenseRequestStepper.tsx` | ลบ 2 phantom cases: `advisor_rejected`, `staff_returned` |

### C4: documentService STATUS_LABELS mismatch

| ไฟล์ | Action |
|---|---|
| `backend/services/documentService.js` | ลบ dead labels 5 ตัว, เพิ่ม labels ที่ขาด 4 ตัวให้ตรงกับ Document ENUM |

### C6: InternshipEvaluation.status ENUM constraint

| ไฟล์ | Action |
|---|---|
| `backend/models/InternshipEvaluation.js` | เปลี่ยน STRING(50) → ENUM('submitted_by_supervisor', 'completed') |
| `backend/migrations/20260308110000-change-internship-evaluation-status-to-enum.js` | **สร้างใหม่** — migration พร้อม safety check |

### C3: Frontend status label/tone centralization

| ไฟล์ | Action |
|---|---|
| `frontend-next/src/lib/utils/statusLabels.ts` | เพิ่ม `StatusTone` type, `STATUS_TONES` map, `statusTone()`, `labelStatusWithTone()`, `approvalStatusLabel()` + labels ที่ขาด 7 ตัว |
| `frontend-next/src/app/(app)/project-pairs/page.tsx` | ลบ local statusLabels, ใช้ `labelStatus()` |
| `frontend-next/src/app/(app)/student-deadlines/calendar/view/StudentDeadlineCalendar.tsx` | ลบ local statusLabel(), ใช้ `labelStatus()` with fallback |
| `frontend-next/src/app/(app)/project/phase2/thesis-defense/ThesisDefenseRequestContent.tsx` | ลบ phantom labels + local statusTones, ใช้ shared `statusTone()` |
| `frontend-next/src/app/(app)/project/phase2/system-test/SystemTestRequestContent.tsx` | ลบ local statusTones, ใช้ shared `statusTone()` |
| `frontend-next/src/app/(app)/internship/logbook/InternshipLogbookView.tsx` | ลบ local approvalStatusLabel(), import จาก shared |
| `frontend-next/src/app/(app)/internship/certificate/InternshipCertificateView.tsx` | ลบ local approvalStatusLabel(), import จาก shared |

**Note:** Files ที่มี context-specific labels (reports, student-profile, ProjectDraftDetailView) เก็บ local maps ไว้ — เป็น intentional ไม่ใช่ duplication

## Session 31 (claude, 2026-03-08) — Workflow State Audit & evidence_submitted Fix

### Part 1: Complete Workflow State Audit (Prompt 1-5)

สร้าง [WORKFLOW_STATES.md](../WORKFLOW_STATES.md) — Complete State Map ของทั้งระบบ:

- 12 Mermaid state diagrams ครอบคลุม Internship, Project 1, Thesis
- Master State Tables 10 ตาราง (70+ states)
- Inconsistency Report 5 categories
- Unlock Conditions Matrix 30+ conditions
- Architecture Notes (3-layer status system, convention differences)

### Part 2: evidence_submitted — Virtual → Real Status

**ปัญหา:** `evidence_submitted` เป็น computed/virtual status ที่ frontend สร้างจาก `staff_approved + evidenceSubmittedAt != null` — logic ซ้ำกัน 3 ที่ + backend ไม่เคย set ค่านี้จริง

**แก้ไข:** ย้าย logic ไป backend ให้เป็น real DB status

| ไฟล์ | Action |
|---|---|
| `backend/migrations/20260308120000-add-evidence-submitted-to-test-request-status.js` | **ใหม่** — เพิ่ม `evidence_submitted` เข้า ENUM |
| `backend/models/ProjectTestRequest.js` | เพิ่ม `evidence_submitted` ใน ENUM definition |
| `backend/services/projectSystemTestService.js` | `uploadEvidence()`: set `status: 'evidence_submitted'` + แก้ summary count + default staff queue filter |
| `backend/services/projectDefenseRequestService.js` | แก้ guard ให้ accept `evidence_submitted` ด้วย (ไม่ใช่แค่ `staff_approved`) |
| `frontend-next/src/lib/utils/statusLabels.ts` | เพิ่ม `evidence_submitted: "success"` ใน STATUS_TONES |
| `frontend-next/src/app/(app)/project/phase1/view/ProjectContent.tsx` | ลบ compound check `staff_approved && evidenceSubmittedAt` → ใช้ mapping ตรง |
| `frontend-next/src/app/(app)/project/phase2/view/ProjectPhase2Content.tsx` | เช่นเดียวกัน + แก้ step tone ให้เช็ค `evidence_submitted` แทน compound |
| `frontend-next/src/app/(app)/project/phase2/system-test/SystemTestRequestContent.tsx` | เพิ่ม `evidence_submitted` ใน local statusLabels map |
| `WORKFLOW_STATES.md` | อัปเดต diagram, state table, inconsistency report |

---

## Session 32 (claude, 2026-03-08) — Workflow Constants TypeScript Generation

สร้าง `workflowStates.ts` — TypeScript constants จาก WORKFLOW_STATES.md พร้อม 5 rounds verification

### สร้างไฟล์ใหม่

| ไฟล์ | เนื้อหา |
|---|---|
| `frontend-next/src/constants/workflowStates.ts` | **ใหม่** — 10 enums, 9 transition maps, STATUS_UI_CONFIG, ALL_TRANSITIONS, canTransition() |

### Verification Rounds

| Round | ตรวจอะไร | ผลลัพธ์ |
|---|---|---|
| V1: Enum ↔ DB Model | 10 enums เทียบ DataTypes.ENUM() | ✅ 10/10 match |
| V2: Transition ↔ Code | 9 maps เทียบ service/controller code | ⚠️ พบ phantom transitions → เพิ่ม `@phantom` comments |
| V3: Roles + Type | 20 rules จาก ALL_TRANSITIONS เทียบ middleware/guard | ⚠️ แก้ 3 rules (R1,R2 roles/type, R5 roles) |
| V4: UI Config ↔ statusLabels | Labels + tones เทียบ statusLabels.ts | ⚠️ เพิ่ม `passed`/`failed` + แก้ tones |
| V5: Re-verify Enums | ตรวจซ้ำหลังแก้ไขทั้งหมด | ✅ 10/10 match |

### แก้ไขที่ workflowStates.ts

| Action | รายละเอียด |
|---|---|
| `@phantom` comments | 12 phantom transitions ใน 5 maps (PROJECT_WORKFLOW, PROJECT_DOCUMENT, INTERNSHIP_DOCUMENT, DEFENSE_REQUEST, APPROVAL_TOKEN) |
| R1-R2 fix | not_started → pending_approval/in_progress: roles `['system']`→`['teacher']`, type `'system'`→`'manual'` |
| R5 fix | draft → pending: roles `['student','admin']`→`['admin']` |
| เพิ่ม `passed`/`failed` | lowercase exam result entries ใน STATUS_UI_CONFIG |

### แก้ไขที่ statusLabels.ts

| Action | รายละเอียด |
|---|---|
| `pending_advisor` tone | `info` → `warning` (สถานะ "รอ" = warning) |
| `pending_staff` tone | `info` → `warning` |
| เพิ่ม `advisor_assigned` tone | `info` (ไม่มีมาก่อน) |

---

## Session 33 (claude, 2026-03-08) — Playwright E2E Testing Setup

### สิ่งที่ทำ

สร้าง E2E testing framework ด้วย Playwright ตั้งแต่ศูนย์ — ครบ 5 phases

### โครงสร้างที่สร้าง

```
playwright-e2e/                    # Standalone package ที่ repo root
├── package.json                   # @playwright/test, dotenv, tsx
├── tsconfig.json
├── playwright.config.ts           # 4 projects: setup, officer, advisor, student
├── .env                           # credentials ทั้ง 3 roles
├── global-setup.ts                # Backend health check
├── fixtures/auth.ts               # Multi-role fixtures (advisorPage, officerPage, studentPage)
├── helpers/login.ts               # loginViaUI() — browser login ทุก role
├── helpers/selectors.ts           # Thai text selectors
├── seed/                          # API seed script (skeleton)
├── tests/auth.setup.ts            # Login & save storageState per role
├── tests/01-smoke/                # health, auth-flow, role-guard (3 specs)
├── tests/02-admin/                # settings-academic, notification, user-mgmt (3 specs)
├── tests/03-teacher/              # advisor-queue, meeting-approvals (2 specs)
├── tests/04-workflows/            # meeting-logbook-flow, kp02-defense (2 specs)
└── tests/05-security/             # route-access parameterized (1 spec)
```

### ผลลัพธ์

| Metric | Value |
|--------|-------|
| Total tests | 156 |
| Passed | 153 |
| Skipped | 3 (kp02-defense-flow — ต้อง seed data) |
| Failed | 0 |

### Bugs ที่พบระหว่าง test และแก้ไข

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Logout test timeout (SurveyBanner บังปุ่ม) | SurveyBanner overlay intercepts click | เพิ่ม dismiss "ทำภายหลัง" ก่อน logout |
| Unauthenticated tests ไม่ redirect | `browser.newContext()` inherit project storageState | ใช้ `{ storageState: { cookies: [], origins: [] } }` override |

### Config

| Setting | Value |
|---------|-------|
| screenshot | `on` (ทุก test) |
| trace | `on` (ทุก test — ดูได้ใน UI mode) |
| video | `retain-on-failure` |
| timeout | 60s (navigation), 10s (expect) |

### Commands

```bash
cd playwright-e2e
npm test              # รันทั้งหมด
npm run test:smoke    # smoke tests เท่านั้น
npm run test:ui       # Playwright UI mode
npm run test:report   # ดู HTML report
```

### ไฟล์ที่แก้ไข

| ไฟล์ | Action |
|------|--------|
| `playwright-e2e/*` (19 ไฟล์) | CREATE |
| `package.json` (root) | EDIT — เพิ่ม test:e2e scripts |

## Session 34 (claude, 2026-03-08) — E2E Tests: Admin Settings & Teacher Advisor

### สิ่งที่ทำ

เขียน E2E tests เพิ่มเติมจาก Session 33 — ปรับปรุง test cases ให้ครอบคลุม UAT ทั้ง admin settings และ teacher advisor pages

### Tests ที่สร้าง/ปรับปรุง

| File | Test Cases | Status |
|------|-----------|--------|
| `02-admin/settings-academic.spec.ts` | 4 TCs: page load, tab bar 3 tabs, tab navigation, data display | 4 pass |
| `02-admin/settings-notification.spec.ts` | 4 TCs: page load, form elements (toggles/buttons), notification items, console errors | 4 pass |
| `02-admin/user-management.spec.ts` | 5 TCs: student list + stats + search, teacher list + stats | 5 pass |
| `03-teacher/advisor-queue.spec.ts` | 4 TCs: page load, queue/empty state, summary/empty, filter | 4 pass |
| `03-teacher/meeting-approvals.spec.ts` | 5 TCs: page load, list/empty, summary/empty, filter, approve (skipped) | 4 pass, 1 skipped |

### Selectors เพิ่มใหม่ใน helpers/selectors.ts

- Settings: `SETTINGS_TITLE`, `SETTINGS_TAB_BAR`, `SETTINGS_TAB`, `TAB_CURRICULUM`, `TAB_ACADEMIC`, `TAB_NOTIFICATION`
- Notification: `NOTIF_LIST`, `NOTIF_TOGGLE`, `BTN_REFRESH`, `BTN_ENABLE_ALL`, `BTN_DISABLE_ALL`
- Teacher: `SUMMARY_BAR`, `SUMMARY_BADGE`, `ADVISOR_FILTER`, `BTN_APPROVE`, `BTN_REJECT`, `DECISION_MODAL`, `MODAL_CONFIRM`, `MODAL_CANCEL`, `EMPTY_STATE`
- User management: `USER_SEARCH`, `USER_TABLE`, `STAT_CARD`, `BTN_CLEAR_FILTER`

### Bugs/Fixes ระหว่าง test

| Issue | Fix |
|-------|-----|
| strict mode: `nav` matched 2 elements (AppShell + settings) | ใช้ `SEL.SETTINGS_TAB_BAR` แทน `.or(page.locator('nav'))` |
| strict mode: `ปิดทั้งหมด` matched 2 buttons | เพิ่ม `.first()` |
| strict mode: title matched h1 + subtitle p | ใช้ `getByRole('heading', { name: '...' })` |
| summaryBar ไม่แสดงเมื่อไม่มีข้อมูล | เปลี่ยนเป็น assert summaryBar OR empty state |

### ผลรวม

| Metric | Value |
|--------|-------|
| Total new/updated tests | 22 |
| Passed | 21 |
| Skipped | 1 (approve — ต้อง seed data) |
| Failed | 0 |

## Session 35 (claude, 2026-03-08) — E2E Tests: Multi-Role Workflow Specs

### สิ่งที่ทำ

เขียน/rewrite E2E workflow tests 3 ไฟล์ ใน `tests/04-workflows/` — multi-role serial tests ครบ UAT Part C3, C4, D

### Tests ที่สร้าง/ปรับปรุง

| File | Tests | Roles | Flow |
|------|-------|-------|------|
| `meeting-logbook-flow.spec.ts` | 5 serial | student + advisor | Student สร้าง meeting → Advisor approve → verify status + unlock |
| `kp02-defense-flow.spec.ts` | 4 serial | student + advisor + officer | Student ยื่น KP.02 → Advisor approve → เจ้าหน้าที่ตรวจสอบ |
| `thesis-flow.spec.ts` | 10 serial (4 blocks) | student + advisor + officer | พบอาจารย์ → ทดสอบระบบ → ขอสอบ คพ.03 → ผลสอบ |

### Selectors เพิ่มใหม่ใน helpers/selectors.ts

- **Meeting Logbook:** `MEETING_CARD`, `MEETING_TITLE_INPUT`, `MEETING_DATE_INPUT`, `MEETING_METHOD_SELECT`, `BTN_ADD_LOG`, `LOG_DISCUSSION_INPUT`, `LOG_PROGRESS_INPUT`, `LOG_NEXT_ITEMS_INPUT`, `BTN_SAVE_LOG`, `BTN_SAVE_MEETING`, `BADGE_PENDING`, `BADGE_APPROVED`, `PROGRESS_BAR`, `APPROVAL_NOTE_INPUT`, `BTN_CONFIRM_APPROVE`
- **Defense Request:** `DEFENSE_STEPPER`, `DEFENSE_STATUS_TAG`, `DEFENSE_FORM`, `BTN_SUBMIT_DEFENSE`
- **Admin Queue:** `ADMIN_QUEUE_TABLE`, `ADMIN_STATUS_FILTER`, `BTN_VERIFY`, `BTN_DETAILS`, `DRAWER`, `DRAWER_CLOSE`, `VERIFY_MODAL`, `VERIFY_NOTE`, `BTN_VERIFY_CONFIRM`
- **System Test:** `BTN_SUBMIT_SYSTEM_TEST`, `BTN_UPLOAD_EVIDENCE`, `SYSTEM_TEST_START`, `SYSTEM_TEST_END`, `SYSTEM_TEST_NOTE`, `SYSTEM_TEST_STATUS_TAG`
- **Thesis:** `THESIS_STEPPER`, `BTN_RECORD_RESULT`

### Pattern สำคัญ

- `test.describe.serial()` — tests ต่อเนื่องกัน (step 2 ขึ้นกับ step 1)
- Shared state flag (`hasProject`, `canProceed`, `thesisUnlocked`) — skip ทั้ง chain ถ้า prerequisite ไม่ครบ
- Skip detection: ตรวจ "ยังไม่มีโครงงานในระบบ", "ปริญญานิพนธ์ยังไม่ปลดล็อก", button disabled, tab disabled
- Multi-role fixtures จาก `fixtures/auth.ts` (studentPage, advisorPage, officerPage)

### ผลรวม

| Metric | Value |
|--------|-------|
| Total tests (3 files) | 19 |
| Passed | 0 (auth setup only) |
| Skipped | 19 (ทุกตัว — ไม่มี seed data / thesis ยัง locked) |
| Failed | 0 |

### Note

ทุก test skip gracefully เพราะ student ไม่มี project assigned — ต้อง seed data ก่อนจึงจะรัน flow จริงได้

## Session 36 (claude, 2026-03-08) — E2E Tests: Security & Internship Workflow

### สิ่งที่ทำ

เขียน E2E tests 2 ไฟล์ใหม่ — Security/access control + Internship workflow (UAT Part B)

### Tests ที่สร้าง

| File | Tests | Passed | Skipped | Description |
|------|-------|--------|---------|-------------|
| `tests/05-security/route-access.spec.ts` | 40 | 40 | 0 | Route access matrix (9 routes × 3 roles + unauth), API file upload validation, token expiry |
| `tests/04-workflows/internship-flow.spec.ts` | 66 | 16 | 50 | B1-B5 internship workflow: คพ.05, หนังสือตอบรับ, ข้อมูลสถานประกอบการ, Logbook, ประเมิน |

### Security Tests (route-access.spec.ts)

- **Route access matrix**: 9 routes × parameterized (student/teacher/admin/unauthenticated) — verify redirect หรือ 200
- **File upload validation**: API-level tests hitting `POST /api/documents/submit` with oversized file, non-PDF, no file
- **Token expiry**: Expired/malformed/missing token → 401
- Project filter (`test.beforeEach`) ป้องกันรัน 3x ข้าม Playwright projects

### Internship Tests (internship-flow.spec.ts)

| Block | Tests | Status | Flow |
|-------|-------|--------|------|
| B1 — คพ.05 | 7 | 7 passed | Navigate → validation → submit → officer queue → forward → download check → verify status |
| B2 — หนังสือตอบรับ | 5 | 4 passed, 1 skipped | Flow page → invalid upload → PDF upload → officer approve → verify |
| B3 — ข้อมูลสถานประกอบการ | 3 | 3 passed | Company info page → fill+save → phone validation |
| B4 — Logbook | 3 | 1 passed, 2 skipped | Page visible → add entry (skipped: no empty slots) → edit (skipped: buttons disabled) |
| B5 — ประเมิน | 3 | 3 skipped | By design — supervisor eval via email link |

### Selectors เพิ่มใหม่ (helpers/selectors.ts)

- **CS05 Registration:** `CS05_COMPANY_NAME`, `CS05_COMPANY_ADDRESS`, `CS05_POSITION`, `CS05_CONTACT_NAME`, `CS05_CONTACT_POSITION`, `CS05_START_DATE`, `CS05_END_DATE`, `CS05_TRANSCRIPT_INPUT`, `BTN_SUBMIT_CS05`
- **Flow Page:** `BTN_DOWNLOAD_REFERRAL`, `BTN_DOWNLOAD_ACCEPTANCE_FORM`, `ACCEPTANCE_FILE_INPUT`, `BTN_UPLOAD_ACCEPTANCE`, `ACCEPTANCE_STATUS_APPROVED`, `ACCEPTANCE_STATUS_PENDING`
- **Company Info:** `SUPERVISOR_NAME`, `SUPERVISOR_POSITION`, `SUPERVISOR_PHONE`, `SUPERVISOR_EMAIL`, `BTN_SAVE_COMPANY`, `BTN_EDIT_COMPANY`
- **Logbook:** `LOGBOOK_MODAL`, `LOGBOOK_TIME_IN`, `LOGBOOK_TIME_OUT`, `LOGBOOK_TITLE`, `LOGBOOK_DESCRIPTION`, `LOGBOOK_LEARNING`, `BTN_LOGBOOK_FILL`, `BTN_LOGBOOK_EDIT`, `BTN_LOGBOOK_SAVE`
- **Admin Docs:** `BTN_FORWARD_DOC`, `BTN_BULK_REVIEW`, `REJECT_REASON_INPUT`, `BTN_CONFIRM_REJECT`, `ADMIN_FEEDBACK_ALERT`

### ไฟล์ใหม่

| File | Purpose |
|------|---------|
| `playwright-e2e/tests/05-security/route-access.spec.ts` | Security/access control E2E tests |
| `playwright-e2e/tests/04-workflows/internship-flow.spec.ts` | Internship workflow E2E tests |
| `playwright-e2e/fixtures/files/test.txt` | Dummy invalid file for upload validation |

### Bugs แก้ระหว่าง iteration

| Issue | Fix |
|-------|-----|
| File upload tests timeout (ต้องมี active project) | เปลี่ยนเป็น API-level tests hitting `/api/documents/submit` |
| Tests รัน 3x ข้าม Playwright projects | เพิ่ม `test.beforeEach` project filter |
| `ADMIN_QUEUE_TABLE` strict mode matched 2 elements | ใช้ `.first()` |
| `BTN_FORWARD_DOC` matched bulk button "ตรวจและส่งต่อ (0)" | เปลี่ยนเป็น `table tbody tr button:has-text("ส่งต่อ")` |
| Company info save ยัง "กำลังบันทึก..." at timeout | เพิ่ม view-mode switch detection (`BTN_EDIT_COMPANY`) |
| Logbook page ใช้ div-based layout ไม่ใช่ `<table>` | ตรวจ `:text("ตารางวันทำงาน")` แทน |
| Edit button disabled (supervisor-approved entries) | ใช้ `:not([disabled])` + graceful skip |

### ผลรวม

| Metric | Value |
|--------|-------|
| Total new tests | 106 (40 security + 66 internship) |
| Passed | 56 |
| Skipped | 50 |
| Failed | 0 |

---

## Session 37 (claude, 2026-03-09) — E2E Seed Script & Test Fix

### สรุป

Implement E2E seed script pipeline + แก้ test skip conditions ที่ทำให้ workflow tests ถูก skip ทั้งที่มี data พร้อมแล้ว

### Seed Script (`playwright-e2e/seed/seed-test-data.ts`)

7-step pipeline ทำงานครบ:

| Step | Action | Result |
|------|--------|--------|
| 1 | Login 3 roles (student, advisor, officer) | ✓ |
| 2 | Ensure project exists + advisor assigned | ✓ Project #184 |
| 3 | Create 5 meetings + logs | ✓ (5 records) |
| 4 | Approve 4 logs, เว้น 1 pending | ✓ (4 approved, 1 pending) |
| 5 | KP02 submit → advisor approve → officer verify | ✓ |
| 6 | Record exam result PASS (topic-exam-result) | ✓ |
| 7 | Check internship eligibility | ✓ (status: approved) |

### Backend Fixes

| Fix | File |
|-----|------|
| Joi validator: เพิ่ม `requestDate`, `students`, `advisorName` ฯลฯ ใน KP02 schema | `backend/validators/projectValidators.js` |
| Admin create project: เพิ่ม `ProjectWorkflowState.createForProject` | `backend/services/projectManagementService.js` |

### Seed Script Fixes

| Fix | Detail |
|-----|--------|
| Login token path | `data.token \|\| data.data?.token` (response มี token ที่ top level) |
| Internship endpoint | `/internship/mine` → `/internship/summary` (endpoint ไม่มี) |

### Test Skip Condition Fixes

| Problem | File | Fix |
|---------|------|-----|
| `button:has-text("บันทึกการประชุม")` disabled เพราะ title ว่าง ไม่ใช่เพราะไม่มี project | `meeting-logbook-flow.spec.ts` | เปลี่ยนเป็นตรวจ `text=หัวข้อการประชุม` visibility |
| KP02 existing status check อยู่หลัง button check → skip ก่อนเช็ค status | `kp02-defense-flow.spec.ts` | ย้าย existing status check ขึ้นก่อน button check |
| Advisor/officer steps skip เพราะ seed ทำไปแล้ว (ไม่มี pending) | `kp02-defense-flow.spec.ts` | เพิ่ม fallback check: ถ้า approved/verified tag มี → pass |
| Thesis form section ใช้ `saveBtn.isDisabled()` เหมือน meeting | `thesis-flow.spec.ts` | เปลี่ยนเป็นตรวจ form section visibility |
| `saveBtn` variable ถูกลบแต่ยังถูกอ้างใน meeting creation | `thesis-flow.spec.ts` | สร้าง `saveMeetingBtn` locator ใหม่ |
| Workflow tests run 3x ใน officer/advisor/student projects | 3 files | เพิ่ม `test.beforeEach` project filter (เหมือน internship pattern) |

### ผลรวม

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total tests | 339 | 339 | — |
| Passed | 149 | 160 | +11 |
| Skipped | 190 | 172 | -18 |
| Failed | 0 | 2 | +2 (WIP) |

### Remaining Failures (WIP)

| Test | Issue |
|------|-------|
| `meeting-logbook-flow` › Student สร้าง meeting logbook entry | ต้อง debug — อาจเป็น selector mismatch |
| `thesis-flow` › เจ้าหน้าที่ตรวจสอบคำร้อง คพ.03 | ต้อง debug — อาจเป็น empty queue after seed |

### ไฟล์ที่เปลี่ยน

| File | Action |
|------|--------|
| `playwright-e2e/seed/seed-test-data.ts` | Fix login token, internship endpoint |
| `playwright-e2e/seed/seed-config.ts` | ไม่แก้ (ครบแล้ว) |
| `playwright-e2e/tests/04-workflows/meeting-logbook-flow.spec.ts` | Fix skip condition + add beforeEach |
| `playwright-e2e/tests/04-workflows/kp02-defense-flow.spec.ts` | Fix skip order + seed-aware fallbacks + beforeEach |
| `playwright-e2e/tests/04-workflows/thesis-flow.spec.ts` | Fix skip condition + saveBtn ref + beforeEach |
| `cslogbook/backend/validators/projectValidators.js` | Allow KP02 extra fields |
| `cslogbook/backend/services/projectManagementService.js` | Add WorkflowState on admin create |

## Session 38 (claude, 2026-03-09) — PDF System Audit + หนังสือขอความอนุเคราะห์

### สิ่งที่ทำ

1. **PDF System Survey** — สำรวจ codebase ทั้ง frontend/backend หาทุกจุดที่เกี่ยวกับ PDF
   - พบ PDF ที่ generate ด้วย pdfkit 3 เอกสาร: หนังสือส่งตัว, หนังสือรับรองฝึกงาน, สรุปบันทึกฝึกงาน
   - พบ uploaded PDF 4 ประเภท: คพ.05, หนังสือตอบรับ, เอกสารโครงงาน, เอกสาร internship
2. **BUG พบ**: ปุ่ม "ดาวน์โหลดหนังสือขอความอนุเคราะห์" ใน InternshipFlowContent.tsx จริงๆ เรียก endpoint หนังสือส่งตัว + เงื่อนไขผิด (ต้องรอ acceptance approved)
3. **สร้าง "หนังสือขอความอนุเคราะห์" PDF** — เอกสารใหม่ที่ download ได้ทันทีหลัง CS05 approved
4. **แก้ Frontend** — แยกปุ่มเป็น 3 ปุ่ม: หนังสือขอความอนุเคราะห์ (NEW), แบบฟอร์มตอบรับ (เดิม), หนังสือส่งตัว (FIXED label)

### ไฟล์ที่เปลี่ยน

| ไฟล์ | รายละเอียด |
|------|-----------|
| `backend/services/internship/cooperationLetter.service.js` | **NEW** — PDF generation หนังสือขอความอนุเคราะห์ (pdfkit + Loma font) |
| `backend/services/internshipManagementService.js` | เพิ่ม `generateCooperationLetterPDF` delegate |
| `backend/controllers/documents/internshipController.js` | เพิ่ม `downloadCooperationLetter` handler |
| `backend/routes/documents/internshipRoutes.js` | เพิ่ม route `GET /download-cooperation-letter/:documentId` |
| `frontend-next/src/lib/services/internshipService.ts` | เพิ่ม `downloadCooperationLetter()` |
| `frontend-next/src/hooks/useInternshipCooperationLetter.ts` | **NEW** — useMutation hook |
| `frontend-next/src/app/(app)/internship-registration/flow/view/InternshipFlowContent.tsx` | แยก 3 ปุ่ม + แก้ label |

---

## Session 39 (claude, 2026-03-09) — PDF Data Flow Audit + Critical/High Bug Fixes

### บริบท

Deep dive data flow ของ PDF ทั้ง 4 เอกสาร (ต่อจาก Session 38) แล้วตรวจ layout/content quality พบ issues 12 รายการ แก้ Critical + High 3 ข้อ

### Issues ที่พบจาก Audit

| # | Issue | Severity | สถานะ |
|---|-------|----------|-------|
| 1 | studentId ใช้ PK แทน studentCode ใน logbook summary PDF | **Critical** | ✅ แก้แล้ว |
| 2 | Date format ใช้ toLocaleDateString แทน formatThaiDate ใน referralLetter | **High** | ✅ แก้แล้ว |
| 3 | เลขที่เอกสาร ใช้ปี ค.ศ. แทน พ.ศ. ใน referralLetter | **High** | ✅ แก้แล้ว |
| 4 | Hardcoded department strings ใน certificate (6 จุด) | Medium | ❌ ยังไม่แก้ |
| 5 | PDF Author hardcoded ใน referralLetter + certificate | Medium | ❌ ยังไม่แก้ |
| 6 | Title fontSize inconsistent — certificate ใช้ 20 (อื่นใช้ 18) | Medium | ❌ ยังไม่แก้ |
| 7 | Logbook summary margin=40 ต่างจาก 50 ที่เหลือ | Low | ❌ ยังไม่แก้ |
| 8 | Logbook summary ไม่มี PDF metadata | Low | ❌ ยังไม่แก้ |
| 9 | Logbook entry.workDate ไม่ผ่าน formatThaiDate | Medium | ❌ ยังไม่แก้ |

### ไฟล์ที่เปลี่ยน

| ไฟล์ | รายละเอียด |
|------|-----------|
| `backend/services/internshipLogbookService.js` | Fix #1: `studentId: student.studentId` → `student.studentCode` ใน `getInternshipSummaryForPDF` |
| `backend/services/internship/referralLetter.service.js` | Fix #2: เพิ่ม `formatThaiDate` import, เปลี่ยน 3 จุดจาก `toLocaleDateString("th-TH")` → `formatThaiDate()` |
| `backend/services/internship/referralLetter.service.js` | Fix #3: `getFullYear()` → `getFullYear() + 543` ในเลขที่เอกสาร |

---

## Session 40 (claude, 2026-03-09) — PDF Preview & Download Audit + Bug Fixes

### บริบท

ตรวจสอบระบบ preview/download PDF ทั้งหมด — PDFPreviewModal component, download pattern ทุกเอกสาร, admin document pages, upload config แล้วแก้ bugs ที่พบ

### Audit Summary

| Pattern | Status |
|---------|--------|
| PDFPreviewModal (iframe + fallback + loading) | ✅ ทำงานดี |
| Download blob pattern (fetch→blob→anchor→click) | ✅ consistent ทุกเอกสาร |
| Error handling (Thai messages) | ✅ ครบทุก endpoint |
| Filename encoding (encodeURIComponent) | ✅ ครบ |
| Cleanup (revokeObjectURL) | ✅ immediate หรือ 30-60s timeout |
| Content-Type + Content-Disposition ทุก endpoint | ✅ ครบหลังแก้ |

### Issues ที่พบและแก้

| # | Issue | Severity | สถานะ |
|---|-------|----------|-------|
| 4 | Admin Project Document filename ขาด `.pdf` extension | Medium | ✅ แก้แล้ว |
| 5 | Certificate download ไม่มี Content-Disposition header | Medium | ✅ แก้แล้ว |

### ไฟล์ที่เปลี่ยน

| ไฟล์ | รายละเอียด |
|------|-----------|
| `frontend-next/src/lib/services/adminProjectDocumentsService.ts` | Fix #4: `project-document-${id}` → `project-document-${id}.pdf` |
| `backend/controllers/documents/internshipController.js` | Fix #5: เพิ่ม `Content-Disposition: attachment` + `Content-Length` ใน `downloadCertificate` |
| `.gitignore` | เพิ่ม `playwright-e2e/` (1,690 ไฟล์ untracked) |

---

## Session 41 (claude, 2026-03-09) — PDF Security Audit + IDOR Fixes + Audit Report

### บริบท

ตรวจสอบ security ของทุก PDF/document endpoint — authentication, authorization, ownership check (IDOR), input validation, PDF generation security แล้วแก้ช่องโหว่ที่พบ + สร้าง audit report สรุปทั้งหมด

### ช่องโหว่ที่พบและแก้

| # | Vulnerability | Severity | สถานะ |
|---|-------------|----------|-------|
| 1 | IDOR — Student A download เอกสาร Student B ได้ (`validateDocumentFile` ไม่เช็ค ownership) | CRITICAL | ✅ แก้แล้ว |
| 2 | `GET /api/documents/:id` เปิด public ไม่มี auth | HIGH | ✅ แก้แล้ว |
| 3 | `GET /api/documents/` student เห็นเอกสารทุกคน | HIGH | ✅ แก้แล้ว |
| 4 | Filename ไม่ sanitize (ชื่อนักศึกษาใน filename ตรงๆ) | MEDIUM | ✅ แก้แล้ว |
| 5 | Content-Disposition filename ไม่ encode (general routes) | MEDIUM | ✅ แก้แล้ว |
| 6 | Upload multer ไม่ check file type (general routes) | LOW | ✅ แก้แล้ว |

### สิ่งที่ปลอดภัยอยู่แล้ว (ไม่ต้องแก้)

- Internship PDF endpoints: ownership check ผ่าน `userId` ใน WHERE clause
- Token-based auth (supervisor eval, email approval): crypto token + expiry
- PDFKit v0.17.1: ไม่มี injection risk
- File serving: `path.resolve()` ป้องกัน path traversal

### ไฟล์ที่เปลี่ยน

| ไฟล์ | รายละเอียด |
|------|-----------|
| `backend/services/documentService.js` | Fix #1: `validateDocumentFile(docId, userId, role)` เพิ่ม ownership check; Fix #3: `getDocuments()` เพิ่ม role-based filter |
| `backend/controllers/documents/documentController.js` | Fix #1: viewDocument/downloadDocument ส่ง userId+role + 403 handling; Fix #2: getDocumentById เพิ่ม ownership check; Fix #5: `encodeURIComponent(fileName)` |
| `backend/routes/documents/documentsRoutes.js` | Fix #2: เพิ่ม `authenticateToken` ให้ `GET /:id`; Fix #6: เพิ่ม `fileFilter` ใน multer |
| `backend/utils/sanitizeFilename.js` | **ไฟล์ใหม่** — Fix #4: utility สำหรับ sanitize filename |
| `backend/services/internship/referralLetter.service.js` | Fix #4: ใช้ `sanitizeFilename()` กับชื่อนักศึกษาใน filename |
| `PDF_AUDIT_REPORT.md` | **ไฟล์ใหม่** — สรุป audit ทั้งหมด (P1-P5): inventory, architecture, data matrix, security matrix, recommendations, UAT test cases |

### หมายเหตุ

- cooperationLetter.service.js ไม่พบในโปรเจค — อ้างอิงใน Session 38 แต่ไม่มี file จริง ต้องตรวจสอบ

---

## Session 42 (claude, 2026-03-09) — Data Integrity Audit (P6) + Cooperation Letter Recovery

### บริบท

วิเคราะห์ PDF_AUDIT_REPORT.md พบว่า cooperationLetter.service.js หายจาก branch — ตรวจสอบพบว่าอยู่ใน git stash จึง cherry-pick กลับมา + รัน Data Integrity audit (P6) ครอบคลุม 4 PDF services แล้วแก้ 3 issues ที่ fix ได้เร็ว

### Cooperation Letter Recovery

- Commit 87a0065f (cooperation letter) ติดอยู่ใน stash@{0} ไม่ได้ commit เข้า branch
- Cherry-pick กลับมา resolve conflicts ใน CLAUDE.md + SESSION_HISTORY.md
- ไฟล์ที่กลับมาครบ: cooperationLetter.service.js, internshipController.js, internshipRoutes.js, InternshipFlowContent.tsx, useInternshipCooperationLetter.ts, internshipService.ts

### Data Integrity Audit (P6) — ผลลัพธ์

| ID | Severity | ไฟล์ | ปัญหา | สถานะ |
|----|----------|------|-------|-------|
| C1 | CRITICAL | `dateUtils.js` | `formatThaiDate()` ไม่มี null guard — NaN ใน PDF | ✅ แก้แล้ว |
| C2 | CRITICAL | `referralLetter.service.js` | Duplicate `const formatThaiDate` — module load ไม่ได้ | ✅ แก้แล้ว |
| C3 | CRITICAL | `documentService.js` | `generateCertificatePDF()` return plain text ไม่ใช่ PDF | ✅ แก้แล้ว (Session 43) |
| H2 | HIGH | `cooperationLetter.service.js` | Filename ไม่ผ่าน `sanitizeFilename()` | ✅ แก้แล้ว |
| H3 | HIGH | `internshipLogbookService.js` | `ACTIVE_CS05_STATUSES` รวม "pending" | ⬜ ต้องตัดสินใจ business logic |
| H4 | HIGH | `certificate.service.js` | query ไม่ filter `internshipId` | ✅ แก้แล้ว (Session 43) |
| M1 | MEDIUM | หลายไฟล์ | Buddhist year formula ซ้ำไม่มี shared utility | ⬜ refactor |
| M2 | MEDIUM | `certificate.service.js` | Hard-code "นาย/นาง/นางสาว" prefix | ⬜ ต้องเพิ่ม field |
| M3 | MEDIUM | `certificate.service.js` | `certificateNumber` random ไม่มี uniqueness check | ⬜ ออกแบบ running number |

### ไฟล์ที่เปลี่ยน

| ไฟล์ | รายละเอียด |
|------|-----------|
| `backend/utils/dateUtils.js` | Fix C1: เพิ่ม null/invalid guard ใน `formatThaiDate()` — return '-' แทน NaN |
| `backend/services/internship/referralLetter.service.js` | Fix C2: ลบ duplicate `const { formatThaiDate }` declaration (line 15) |
| `backend/services/internship/cooperationLetter.service.js` | Fix H2: เพิ่ม `require sanitizeFilename` + ใช้กับ fileName |

---

## Session 43 (claude, 2026-03-09) — Fix C3 Certificate PDF + H4 internshipId Filter

### บริบท

แก้ 2 issues จาก Data Integrity Audit (Session 42): C3 admin certificate endpoint return plain text แทน PDF จริง, H4 certificate queries ไม่ filter internshipId อาจดึงข้อมูลผิดรอบ

### Fix C3 — Admin Certificate PDF (ทาง C: rewire ใช้ certificate.service.js)

**ปัญหา:** `documentService.generateCertificatePDF()` ใช้ placeholder — สร้าง plain text string แล้ว `Buffer.from()` → browser เปิดไม่ได้

**วิเคราะห์:** มี 2 function ที่สร้าง certificate PDF:
- `certificate.service.js → createCertificatePDF()` — pdfkit จริง + Thai font (Student endpoint)
- `documentService.js → generateCertificatePDF()` — plain text placeholder (Admin endpoint)

**แก้ไข:** Rewire admin path ให้ใช้ `certificate.service.js` ของจริง
- `generateCertificatePDF(requestId)` → query request หา `userId` → เรียก `getCertificateData(userId)` + `createCertificatePDF(data)`
- ลบ `generatePDFFromTemplate()` + `createCertificatePDFContent()` (placeholder ไม่มี caller อื่น)
- Controller (`downloadCertificateForAdmin`) ไม่ต้องแก้ — return type ยังเป็น Buffer เหมือนเดิม

### Fix H4 — Certificate Query internshipId Filter

**ปัญหา:** `getCertificateData()` + `markCertificateDownloaded()` query `InternshipCertificateRequest` ใช้แค่ `studentId` ไม่ filter `internshipId` → ถ้าฝึกงาน 2 รอบอาจดึง/update ข้อมูลผิดรอบ

**แก้ไข 3 จุด:**
1. `getCertificateStatus()` — เพิ่ม `internshipId` ใน return object
2. `getCertificateData()` L267 — เพิ่ม `internshipId: status.internshipId` ใน WHERE
3. `markCertificateDownloaded()` L652-678 — query CS05 หา `internshipId` ก่อน update

**Query audit ครบ 7/7:**

| Function | Model | internshipId |
|----------|-------|:---:|
| `getCertificateStatus` | InternshipLogbook | ✅ มีอยู่แล้ว |
| `getCertificateStatus` | InternshipEvaluation | ✅ มีอยู่แล้ว |
| `getCertificateStatus` | InternshipLogbookReflection | ✅ มีอยู่แล้ว |
| `getCertificateStatus` | InternshipCertificateRequest | ✅ มีอยู่แล้ว |
| `getCertificateData` | InternshipCertificateRequest | ✅ **เพิ่มแล้ว** |
| `getCertificateData` | InternshipEvaluation | ✅ มีอยู่แล้ว |
| `markCertificateDownloaded` | InternshipCertificateRequest | ✅ **เพิ่มแล้ว** |

### ไฟล์ที่เปลี่ยน

| ไฟล์ | รายละเอียด |
|------|-----------|
| `backend/services/documentService.js` | Fix C3: rewire `generateCertificatePDF()` ใช้ `certificate.service.js` + ลบ placeholder functions 2 ตัว |
| `backend/services/internship/certificate.service.js` | Fix H4: เพิ่ม `internshipId` ใน return ของ `getCertificateStatus()`, filter ใน `getCertificateData()` + `markCertificateDownloaded()` |
