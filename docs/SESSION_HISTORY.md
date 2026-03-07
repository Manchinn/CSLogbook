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
