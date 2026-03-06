# Session History — CSLogbook

Detailed session logs moved from CLAUDE.md to reduce token usage.
Branch: `claude/claude-md-mm56ik11ksjo6flh-JgWXL`

---

## Session 1 (claude, 2026-02-27) — Bug Fixes & Quality

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
