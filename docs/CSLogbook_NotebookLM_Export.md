# CSLogbook — Comprehensive Project Documentation
## Full-Stack Student Activity Management System

**Department:** Computer Science & Information Technology (CS&IT), KMUTNB
**Domain:** cslogbook.me
**Stack:** Node.js 18+ / Express / Sequelize / MySQL 8.0 | Next.js 16 (App Router) / TypeScript / React 19 / TanStack Query v5 | Socket.io | Docker Compose / Nginx / GitHub Actions CI/CD
**Development:** 45 sessions, ~3,000+ commits, started 2024

---

# PART 1: PROJECT OVERVIEW

## What is CSLogbook?

CSLogbook เป็นระบบจัดการกิจกรรมนักศึกษา (Student Activity Management System) สำหรับภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (CS&IT) มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB) ระบบจัดการ workflow การฝึกงาน (internship) และปริญญานิพนธ์ (project/thesis) ตั้งแต่ต้นจนจบ ครอบคลุม:

- **การลงทะเบียนฝึกงาน** — ยื่นเอกสาร CS05, หนังสือขอความอนุเคราะห์, หนังสือตอบรับ
- **สมุดบันทึกฝึกงาน (Logbook)** — บันทึกรายวัน, supervisor approve, advisor review
- **ปริญญานิพนธ์ Phase 1** — ยื่นหัวข้อ, สอบหัวข้อ, ส่ง proposal
- **ปริญญานิพนธ์ Phase 2** — ทดสอบระบบ, สอบป้องกัน, ส่งเล่มสมบูรณ์
- **การประชุม (Meeting Logbook)** — บันทึกการประชุมอาจารย์ที่ปรึกษา
- **Deadline Management** — กำหนดส่ง, late tracking, grace period
- **Reports & Analytics** — สถิติภาพรวม, CSV export, document pipeline

## User Roles

| Role | Thai Name | Description |
|------|-----------|-------------|
| **student** | นักศึกษา | ลงทะเบียน, ยื่นเอกสาร, บันทึก logbook, ส่งงาน |
| **teacher:academic** | อาจารย์ (ที่ปรึกษา) | approve งานนักศึกษา, ดู advisor queue, approve meeting log |
| **teacher:support** | เจ้าหน้าที่ภาค | จัดการเอกสาร, กำหนด deadline, ดูแลระบบ, CSV import |
| **teacher:position:หัวหน้าภาควิชา** | หัวหน้าภาค | อนุมัติเอกสาร CS05, ลงนามหนังสือ |
| **admin** | ผู้ดูแลระบบ | จัดการทุกอย่าง, settings, curriculum, academic year |

## Architecture Overview

```
Internet → Nginx (port 80/443, SSL via Certbot)
  ├── /         → Frontend Next.js (127.0.0.1:3000)
  ├── /api/     → Backend Express (127.0.0.1:5000)
  ├── /api-docs → Swagger Documentation
  ├── /socket.io/ → Real-time WebSocket
  └── /uploads/ → Static file serving (PDFs)
```

---

# PART 2: DATABASE SCHEMA (43 Models)

## Authentication & User Management

### User (users)
- **PK:** user_id (INT, auto-increment)
- **Fields:** username (unique), password (nullable for SSO), email (unique), role (ENUM: student/teacher/admin), first_name, last_name, active_status (default=true), last_login, sso_provider, sso_id
- **Relations:** hasOne Student, Teacher, Admin; hasMany Document, NotificationSetting, PasswordResetToken
- **Methods:** isAdmin(), getAdmins()

### Student (students)
- **PK:** student_id (INT, auto-increment)
- **Fields:** user_id (FK→User), curriculum_id (FK→Curriculum), student_code (unique), classroom, phone_number, total_credits, major_credits, gpa, study_type (regular/special), is_eligible_internship, is_eligible_project, advisor_id (FK→Teacher), internship_status, project_status, is_enrolled_internship, is_enrolled_project
- **Relations:** belongsTo User, Teacher(advisor), Curriculum; hasMany ProjectMember, ProjectDocument, Document, TimelineStep, StudentProgress, StudentWorkflowActivity, StudentAcademicHistory
- **Methods:** checkInternshipEligibility(), checkProjectEligibility()

### Teacher (teachers)
- **PK:** teacher_id (INT, auto-increment)
- **Fields:** teacher_code (unique), user_id (FK→User), contact_extension, teacher_type (ENUM: academic/support), position, can_access_topic_exam, can_export_project1
- **Relations:** belongsTo User; hasMany Student(advisees), ProjectDocument(advisor/coAdvisor)

### Admin (admins)
- **PK:** admin_id (INT, auto-increment)
- **Fields:** admin_code (unique), user_id (FK→User), responsibilities, contact_extension

## Academic & Curriculum

### Academic (academics)
- **Fields:** academic_year, current_semester, active_curriculum_id (FK→Curriculum), is_current, status, semester1_range (JSON), semester2_range (JSON), semester3_range (JSON), internship_registration (JSON), project_registration (JSON), internship_semesters (JSON), project_semesters (JSON)
- **Purpose:** ตั้งค่าปีการศึกษา/ภาคเรียนปัจจุบัน, ช่วงเวลาลงทะเบียน

### Curriculum (curriculums)
- **PK:** curriculum_id (INT, auto-increment)
- **Fields:** code (unique), name, short_name, start_year, end_year, active, max_credits, total_credits, major_credits, internship_base_credits, project_base_credits, project_major_base_credits
- **Purpose:** กำหนดเกณฑ์หน่วยกิตสำหรับ eligibility check

## Document Management

### Document (documents)
- **PK:** document_id (INT, auto-increment)
- **Fields:** user_id (FK), reviewer_id (FK), document_type (INTERNSHIP/PROJECT), document_name, file_path, status (ENUM: draft/pending/approved/rejected/supervisor_evaluated/acceptance_approved/referral_ready/referral_downloaded/completed/cancelled), review_date, review_comment, category (proposal/progress/final/acceptance), due_date, file_size, mime_type, submitted_at, is_late, late_minutes, late_reason, submitted_late, submission_delay_minutes, important_deadline_id (FK)
- **Relations:** belongsTo User(owner/reviewer), ImportantDeadline; hasOne ProjectDocument, InternshipDocument; hasMany DocumentLog

### DocumentLog (document_logs)
- **Fields:** log_id, document_id (FK), user_id (FK), action_type (create/update/delete/approve/reject), previous_status, new_status, comment

## Project Management

### ProjectDocument (project_documents)
- **PK:** project_id (INT, auto-increment)
- **Fields:** document_id (FK), project_name_th, project_name_en, project_type (govern/private/research), track, advisor_id (FK→Teacher), co_advisor_id (FK), status (draft/advisor_assigned/in_progress/completed/archived/cancelled), academic_year, semester, objective, background, scope, expected_outcome, benefit, methodology, tools, timeline_note, risk, constraints, project_code (unique, auto: PRJ{year}-{id}), exam_result (passed/failed), submitted_late, submission_delay_minutes, important_deadline_id (FK)
- **Relations:** belongsTo Teacher(advisor/coAdvisor), Document; hasMany ProjectMember, Meeting, ProjectTrack, ProjectDefenseRequest, ProjectExamResult, ProjectMilestone, ProjectArtifact, ProjectEvent

### ProjectMember (project_members)
- **Composite PK:** project_id + student_id
- **Fields:** role (leader/member), joined_at
- **Constraint:** Student can have only 1 active project (enforced via hook)

### ProjectTrack (project_tracks)
- **Fields:** project_track_id, project_id (FK), track_code (NETSEC/WEBMOBILE/SMART/AI/GAMEMEDIA)
- **Purpose:** Multi-track support per project

### ProjectWorkflowState (project_workflow_states) — Single Source of Truth
- **Fields:** project_id (unique FK), current_phase (ENUM: DRAFT/PENDING_ADVISOR/ADVISOR_ASSIGNED/TOPIC_SUBMISSION/TOPIC_EXAM_PENDING/TOPIC_EXAM_SCHEDULED/TOPIC_FAILED/IN_PROGRESS/THESIS_SUBMISSION/THESIS_EXAM_PENDING/THESIS_EXAM_SCHEDULED/THESIS_FAILED/COMPLETED/ARCHIVED/CANCELLED), current_step, workflow_step_id (FK), topic_exam_result, thesis_exam_result, topic_defense_request_id, thesis_defense_request_id, system_test_request_id, final_document_id, meeting_count, approved_meeting_count, is_blocked, block_reason, is_overdue, last_activity_at
- **Methods:** canSubmitTopicDefense(), canSubmitThesisDefense(), isComplete(), isBlocked()

### ProjectDefenseRequest (project_defense_requests)
- **Fields:** request_id, project_id (FK), defense_type (PROJECT1/THESIS), status (draft/submitted/advisor_in_review/advisor_approved/staff_verified/scheduled/completed/cancelled), form_payload (JSON), submitted_by_student_id, defense_scheduled_at, defense_location, important_deadline_id (FK)
- **Relations:** hasMany ProjectDefenseRequestAdvisorApproval

### ProjectExamResult (project_exam_results)
- **Fields:** exam_result_id, project_id (FK), exam_type (PROJECT1/THESIS), result (PASS/FAIL), score (DECIMAL), notes, require_scope_revision, recorded_by_user_id, student_acknowledged_at
- **Note:** PASS/FAIL convention (uppercase) ≠ ProjectDocument passed/failed (lowercase) — intentional, service layer normalizes

### ProjectTestRequest (project_test_requests)
- **Fields:** request_id, project_id (FK), status, request_file_path, student_note, test_start_date, test_due_date, advisor/co-advisor/staff decisions, evidence_file_path, submitted_late

### ProjectMilestone, ProjectArtifact, ProjectEvent
- Milestone: title, due_date, progress (0-100), status (pending/submitted/accepted/rejected)
- Artifact: type, file_path, version, checksum
- Event: event_type, actor_role, meta_json (immutable audit log)

## Internship Management

### InternshipDocument (internship_documents)
- **PK:** internship_id (INT, auto-increment)
- **Fields:** document_id (FK→Document), company_name, company_address, internship_position, contact_person_name, contact_person_position, supervisor_name, supervisor_position, supervisor_phone, supervisor_email, start_date, end_date, academic_year, semester
- **Relations:** belongsTo Document; hasMany InternshipLogbook

### InternshipLogbook (internship_logbooks)
- **Fields:** log_id, internship_id (FK), student_id (FK), academic_year, semester, work_date (DATEONLY), log_title, work_description, learning_outcome, problems, solutions, work_hours (DECIMAL), time_in, time_out, supervisor_comment, supervisor_approved (0/1), supervisor_approved_at, advisor_comment, advisor_approved
- **Relations:** hasMany InternshipLogbookAttachment, InternshipLogbookRevision

### InternshipEvaluation (internship_evaluations)
- **Fields:** evaluation_id, approval_token_id (FK), internship_id (FK), student_id (FK), evaluator_name, overall_score, strengths, weaknesses_to_improve, status (submitted_by_supervisor/completed), discipline_score, behavior_score, performance_score, method_score, relation_score, supervisor_pass_decision, pass_fail
- **Purpose:** แบบประเมินจาก supervisor ที่สถานประกอบการ (5 หมวด)

### InternshipCertificateRequest (internship_certificate_requests)
- **Fields:** id, student_id, internship_id (FK), status (pending/approved/rejected), total_hours, certificate_number, downloaded_at, download_count

## Meeting Management

### Meeting (meetings)
- **Fields:** meeting_id, meeting_title, meeting_date, meeting_method (onsite/online/hybrid), meeting_location, meeting_link, status (scheduled/in_progress/completed/cancelled), phase (phase1/phase2), project_id (FK), created_by (FK)
- **Relations:** hasMany MeetingParticipant, MeetingLog

### MeetingLog (meeting_logs)
- **Fields:** log_id, meeting_id (FK), discussion_topic, current_progress, problems_issues, next_action_items, advisor_comment, approval_status (pending/approved/rejected), approved_by (FK), recorded_by (FK)
- **Relations:** hasMany MeetingAttachment, MeetingActionItem

### MeetingParticipant, MeetingAttachment, MeetingActionItem
- Participant: meeting_id, user_id, role (advisor/co_advisor/student/guest), attendance_status
- Attachment: file_name, file_path, file_type, file_size
- ActionItem: action_description, assigned_to, due_date, status

## Deadlines & Timeline

### ImportantDeadline (important_deadlines)
- **Fields:** id, name, date, related_to (internship/project/project1/project2/general), academic_year, semester, is_global, deadline_at (UTC), timezone, description, is_critical, accepting_submissions, allow_late, lock_after_deadline, grace_period_minutes, window_start_at, window_end_at, deadline_type (SUBMISSION/ANNOUNCEMENT/MANUAL/MILESTONE), is_published, visibility_scope (ALL/INTERNSHIP_ONLY/PROJECT_ONLY/CUSTOM)
- **Purpose:** ระบบ deadline กลาง พร้อม late tracking

### DeadlineWorkflowMapping (deadline_workflow_mappings)
- **Fields:** important_deadline_id (FK), workflow_type, step_key, document_subtype, auto_assign (on_create/on_submit/on_approve/on_generate), active
- **Purpose:** Map deadline เข้ากับ workflow step อัตโนมัติ

### TimelineStep (timeline_steps)
- **Fields:** student_id (FK), type (internship/project), step_order, name, description, status (waiting/in_progress/completed/blocked), date, deadline, action_text, action_link

## Student Progress & Workflow

### StudentWorkflowActivity (student_workflow_activities)
- **Fields:** student_id (FK), workflow_type (internship/project1/project2), current_step_key, current_step_status (pending/in_progress/awaiting_student_action/awaiting_admin_action/completed/rejected/skipped/blocked/cancelled), overall_workflow_status (not_started/eligible/enrolled/in_progress/completed/blocked/failed/archived/cancelled), data_payload (JSON)
- **Purpose:** Track สถานะ workflow ของนักศึกษาแต่ละคน

### WorkflowStepDefinition (workflow_step_definitions)
- **Fields:** step_id, workflow_type (internship/project1/project2), step_key, step_order, title, description_template, phase_key, phase_variant (default/late/overdue)

### StudentProgress, StudentAcademicHistory
- Progress: progress_type (internship/project), current_step, total_steps, progress_percent, is_blocked
- AcademicHistory: academic_year, semester, status, note

## Tokens & Security

### ApprovalToken (approval_tokens)
- **Fields:** token (unique), email, document_id (FK), type (single/weekly/monthly/full/supervisor_evaluation), status (pending/approved/rejected/used), expires_at
- **Purpose:** Token-based approval สำหรับ supervisor ภายนอก (ไม่ต้อง login)

### PasswordResetToken, NotificationSetting, SystemLog, UploadHistory
- PasswordReset: OTP hash, temp password, attempt count, expiry
- NotificationSetting: notification_type (LOGIN/DOCUMENT/LOGBOOK/EVALUATION/APPROVAL/MEETING), is_enabled
- SystemLog: action_type, action_description, ip_address, user_agent (immutable)
- UploadHistory: uploaded_by, file_name, total_records, successful_updates, upload_type (students/grades)

---

# PART 3: BACKEND ARCHITECTURE

## Directory Structure

```
backend/
├── agents/          # 11 background schedulers (node-cron/node-schedule)
├── config/          # 12 config files (database, jwt, email, upload, scoring, cors, department)
├── controllers/     # 35 thin HTTP handlers → delegate to services
├── middleware/       # 8 files (auth, RBAC, deadline enforcement, eligibility, rate limit, error)
├── migrations/      # 98 Sequelize migrations
├── models/          # 43 Sequelize models
├── policies/        # permissions.js — RBAC definitions
├── routes/          # 20 route files + documents/ + swagger/
├── services/        # 42 business logic files
├── utils/           # logger, studentUtils, dateUtils, sanitizeFilename, retryUtil
└── validators/      # 4 files (Joi + express-validator)
```

## Key Design Patterns

### Controller → Service → Model
Controllers are thin HTTP handlers that validate input and delegate to services. Services contain all business logic and interact with models. Models define schema, associations, hooks, and helper methods.

### Authentication & Authorization
- **JWT Authentication:** authMiddleware.js verifies JWT token, extracts user context, enriches with studentId
- **RBAC:** authorize.js builds permission keys from role + teacher_type + position
- **Permission Keys:** student, teacher:academic, teacher:support, teacher:position:หัวหน้าภาค, teacher:topic_exam_access, admin

### Middleware Chain
```
Request → rateLimiter → authMiddleware (JWT) → authorize (RBAC) → eligibility/deadline checks → controller → service → model → response
```

## Services (42 files)

### Core Services
| Service | Purpose |
|---------|---------|
| authService.js | JWT generation, login/logout, SSO integration |
| ssoService.js | KMUTNB SSO authentication, user creation/linking |
| studentService.js | Student profile, eligibility checks, progress tracking |
| teacherService.js | Teacher profile, advisor list, project management |
| adminService.js | Admin operations, dashboard, user management |
| academicService.js | Academic year/semester management, curriculum activation |
| curriculumService.js | Curriculum CRUD, credit requirements |

### Internship Services
| Service | Purpose |
|---------|---------|
| internshipService.js | CS05 approval, workflow management |
| internshipManagementService.js | Core internship workflow operations |
| internshipLogbookService.js | Logbook CRUD, revisions, compliance |
| internshipAdminService.js | Admin: approve documents, manage workflows |
| internshipCompanyStatsService.js | Company statistics aggregation |
| certificateService.js | Certificate PDF generation |
| referralLetterService.js | Referral letter PDF generation |
| cooperationLetterService.js | หนังสือขอความอนุเคราะห์ PDF generation |
| evaluation.service.js | Supervisor evaluation processing |

### Project Services
| Service | Purpose |
|---------|---------|
| projectDocumentService.js | Project CRUD, lifecycle, data normalization |
| projectDefenseRequestService.js | KP02 defense requests, advisor approvals |
| projectSystemTestService.js | System test requests, advisor/staff decisions, evidence |
| projectExamResultService.js | Exam results recording, scoring |
| projectManagementService.js | Core project lifecycle operations |
| projectMembersService.js | Add/remove project members |
| projectWorkflowService.js | Project workflow state machine |
| projectWorkflowStateService.js | Single source of truth for workflow state |
| projectTransitionService.js | Phase transitions (Phase 1 → Phase 2) |
| projectArtifactService.js | Upload/manage project artifacts |
| projectMilestoneService.js | Milestone tracking |

### Workflow & Reports
| Service | Purpose |
|---------|---------|
| workflowService.js | Student workflow activity management |
| timelineService.js | Student timeline generation |
| reportService.js | Overview, compliance, advisor workload reports |
| projectReportService.js | Project statistics, CSV export |
| deadlineReportService.js | Deadline compliance reports |
| workflowReportService.js | Workflow activity reports |
| importantDeadlineService.js | Deadline CRUD, policies |
| deadlineAutoAssignService.js | Auto-assign deadlines to workflow steps |

### Utility Services
| Service | Purpose |
|---------|---------|
| documentService.js | Document CRUD, status transitions |
| emailApprovalService.js | Generate/send approval tokens |
| meetingService.js | Meeting CRUD, logs, action items |
| notificationSettingsService.js | Notification preferences |
| passwordService.js | Password reset/change with OTP |
| studentUploadService.js | Bulk CSV student import |
| agentStatusService.js | Monitor background agent health |

## Background Agents (11 schedulers)

| Agent | Purpose | Trigger |
|-------|---------|---------|
| deadlineReminderAgent | Send deadline reminders | Configurable interval |
| documentStatusMonitor | Monitor document status changes | Periodic |
| securityMonitor | Security event logging, IDOR detection | Periodic |
| logbookQualityMonitor | Monitor logbook quality metrics | Periodic |
| eligibilityChecker | Update student eligibility | Periodic |
| eligibilityScheduler | Auto-update eligibility via cron | Cron |
| projectPurgeScheduler | Archive old projects | Cron |
| academicSemesterScheduler | Auto-activate semester settings | Cron |
| projectDeadlineMonitor | Monitor project deadlines | Hourly |
| internshipWorkflowMonitor | Track internship workflow | Periodic |
| internshipStatusMonitor | Update internship completion | Periodic |

**Control:** ENABLE_AGENTS=true starts all. Individual: ACADEMIC_AUTO_UPDATE_ENABLED=true. API: /api/admin/agents for status/control.

## API Routes (20 files, all under /api)

### Authentication
- POST /api/auth/login — Login with username/password
- POST /api/auth/logout — Logout
- POST /api/auth/refresh-token — Refresh JWT
- GET /api/auth/verify — Verify current token
- POST /api/auth/sso/callback — KMUTNB SSO callback

### Student
- GET /api/students/profile — Student profile
- GET /api/students/eligibility — Check internship/project eligibility
- GET /api/students/progress — Progress tracking
- GET /api/students/internship-stats — Internship statistics

### Internship
- POST /api/internship/cs05 — Submit CS05 (company info)
- POST /api/internship/acceptance-letter — Upload acceptance letter
- GET /api/internship/logbook — Logbook entries
- POST /api/internship/logbook — Create logbook entry
- GET /api/internship/company-stats — Company statistics
- GET /api/internship/certificate — Certificate status
- POST /api/internship/certificate/request — Request certificate

### Project
- POST /api/projects — Create project
- GET /api/projects/:id — Project details
- PUT /api/projects/:id — Update project
- POST /api/projects/:id/members — Add member
- POST /api/projects/:id/defense-request — Submit KP02
- POST /api/projects/:id/system-test — Submit system test request
- GET /api/projects/topic-exam — Topic exam overview
- GET /api/projects/workflow-states — Workflow states

### Admin
- GET /api/admin/dashboard — Admin statistics
- GET /api/admin/users/students — Student list
- GET /api/admin/users/teachers — Teacher list
- GET /api/academic — Academic settings
- POST /api/academic — Update academic settings
- GET /api/curriculums — Curriculum list
- GET /api/admin/agents — Agent status

### Reports
- GET /api/reports/overview — Dashboard overview
- GET /api/reports/internship — Internship summary
- GET /api/reports/internship/supervisors — Supervisor statistics
- GET /api/reports/project — Project pipeline
- GET /api/reports/document-pipeline — Document approval flow
- GET /api/reports/workflow-progress — Workflow progression
- GET /api/reports/deadline-compliance — Deadline compliance

### Meetings
- POST /api/projects/:id/meetings — Create meeting
- GET /api/projects/:id/meetings — List meetings
- POST /api/meetings/:id/logs — Create meeting log
- PUT /api/meetings/logs/:id/approve — Approve meeting log

### Timeline & Workflow
- GET /api/timeline/:studentId — Student timeline
- GET /api/workflow/definitions — Workflow step definitions
- GET /api/workflow/activity — Student workflow activity

### Email Approval (Public)
- GET /api/email-approval/approve/:token — Approve via token
- POST /api/email-approval/evaluate/:token — Submit evaluation

## Scoring System

```javascript
PASS_SCORE = 70
SCORE_BUCKETS = [
  { range: '>=80', label: 'ดีมาก', min: 80, max: Infinity },
  { range: '70-79', label: 'ดี', min: 70, max: 79.999 },
  { range: '60-69', label: 'พอใช้', min: 60, max: 69.999 },
  { range: '50-59', label: 'ต้องปรับปรุง', min: 50, max: 59.999 },
  { range: '<50', label: 'ไม่ผ่าน', min: -Infinity, max: 49.999 }
]
```

## Eligibility Rules

### Internship Eligibility
- ชั้นปี >= 3 (คำนวณจาก studentCode + ปีการศึกษาปัจจุบัน)
- หน่วยกิตรวม >= Curriculum.internshipBaseCredits
- หน่วยกิตวิชาเอก >= Curriculum.internshipMajorBaseCredits (ถ้ากำหนด)
- Curriculum fallback: Student curriculum → Active system curriculum

### Project Eligibility
- ชั้นปี >= 4
- หน่วยกิตรวม >= Curriculum.projectBaseCredits
- หน่วยกิตวิชาเอก >= Curriculum.projectMajorBaseCredits (ถ้ากำหนด)
- Prerequisite: ต้องฝึกงานเสร็จก่อน ถ้า Curriculum.requireInternshipBeforeProject = true

## PDF Generation

| PDF Type | Service | Usage |
|----------|---------|-------|
| Certificate | certificateService.js | ใบรับรองการฝึกงาน |
| Referral Letter | referralLetterService.js | หนังสือส่งตัว |
| Cooperation Letter | cooperationLetterService.js | หนังสือขอความอนุเคราะห์ |
| Logbook Summary | internshipLogbookService.js | สรุปสมุดบันทึกฝึกงาน |

**Library:** pdfkit v0.17.1, Thai font: Loma (/backend/fonts/Loma.ttf)
**Security (Session 41):** Ownership checks, filename sanitization, proper Content-Disposition headers

---

# PART 4: FRONTEND ARCHITECTURE

## Directory Structure

```
frontend-next/src/
├── app/
│   ├── (auth)/          # Login, SSO callback
│   ├── (app)/           # Authenticated routes (AuthGuard + AppShell)
│   │   ├── dashboard/   # Student, Teacher, Admin dashboards
│   │   ├── internship*/ # 8+ internship pages
│   │   ├── project/     # Phase 1 & Phase 2 pages
│   │   ├── teacher/     # Advisor queues, meeting approvals
│   │   ├── admin/       # Settings, documents, reports, users
│   │   └── student*/    # Student profile, deadlines
│   ├── approval/        # Public token-based approval
│   └── evaluate/        # Public supervisor evaluation
├── components/
│   ├── auth/            # AuthGuard, RoleGuard, AppRedirect
│   ├── common/          # ConfirmDialog, Skeleton, DefenseRequestStepper, RequestTimeline, StudentTable
│   ├── dashboard/       # StatCard, AdminStatsWidget, StudentInternshipStatusWidget
│   ├── layout/          # AppShell (sidebar, nav, user menu)
│   ├── teacher/         # TeacherPageScaffold, PDFPreviewModal
│   └── workflow/        # WorkflowTimeline
├── constants/
│   └── workflowStates.ts  # Enums, transitions, UI config (generated)
├── hooks/               # 30+ React Query hooks per feature
├── lib/
│   ├── api/client.ts    # apiFetch with JWT injection
│   ├── services/        # 30+ domain API modules
│   └── utils/           # statusLabels, thaiDateUtils, csvExport, toneStyles
└── styles/              # CSS Modules (requestPage, etc.)
```

## Pages (60+ routes)

### Authentication
- `/login` — LoginForm (username/password + SSO button)
- `/auth/sso/callback` — KMUTNB SSO callback handler

### Student Dashboard & Profile
- `/dashboard/student` — Internship/project status widgets, deadlines
- `/student-profile/[studentCode]` — Detailed profile view
- `/student-deadlines/calendar` — Calendar view

### Internship Flow (8+ pages)
- `/internship-eligibility` — ตรวจสอบสิทธิ์ฝึกงาน
- `/internship-requirements` — เงื่อนไขการฝึกงาน
- `/internship-registration` — หน้าลงทะเบียน
- `/internship-registration/flow` — Multi-step registration wizard
- `/internship-companies` — สถิติสถานประกอบการ
- `/internship-logbook/companyinfo` — ข้อมูลบริษัท
- `/internship-logbook/timesheet` — บันทึกรายวัน
- `/internship-summary` — สรุป compliance
- `/internship/logbook` — จัดการ logbook
- `/internship/certificate` — ขอใบรับรอง

### Project Phase 1 (7+ pages)
- `/project/phase1` — Landing page
- `/project/phase1/topic-submit` — ยื่นหัวข้อ (CreateWizard: Basic → Details → Classification → Members → Review)
- `/project/phase1/draft/[id]` — ดู/แก้ draft
- `/project/phase1/topic-exam` — ผลสอบหัวข้อ
- `/project/phase1/exam-day` — ข้อมูลวันสอบ
- `/project/phase1/exam-submit` — ส่งผลสอบ
- `/project/phase1/proposal-revision` — แก้ไข proposal
- `/project/phase1/meeting-logbook` — บันทึกการประชุม

### Project Phase 2
- `/project/phase2` — Landing page
- `/project/phase2/system-test` — ส่งทดสอบระบบ + upload evidence
- `/project/phase2/thesis-defense` — ส่งขอสอบป้องกัน

### Teacher Routes
- `/teacher/topic-exam/overview` — ภาพรวมสอบหัวข้อ
- `/teacher/project1/advisor-queue` — คิวที่ปรึกษา Project 1
- `/teacher/system-test/advisor-queue` — คิวทดสอบระบบ
- `/teacher/thesis/advisor-queue` — คิวสอบป้องกัน
- `/teacher/meeting-approvals` — อนุมัติบันทึกประชุม
- `/teacher/deadlines/calendar` — ปฏิทิน deadline

### Admin Routes
- `/admin/settings/academic` — ตั้งค่าปีการศึกษา/ภาคเรียน
- `/admin/settings/curriculum` — จัดการหลักสูตร
- `/admin/settings/constants` — แก้ไข constants
- `/admin/settings/notification-settings` — ตั้งค่าแจ้งเตือน
- `/admin/users/students` — รายชื่อนักศึกษา
- `/admin/users/teachers` — รายชื่ออาจารย์
- `/admin/documents/internship` — อนุมัติเอกสารฝึกงาน
- `/admin/documents/project` — อนุมัติเอกสารโปรเจค
- `/admin/documents/certificates` — อนุมัติใบรับรอง
- `/admin/project-exam/results` — ผลสอบโปรเจค
- `/admin/project1/kp02-queue` — คิว KP02
- `/admin/topic-exam/results` — จัดตารางสอบหัวข้อ
- `/admin/thesis/staff-queue` — คิวสอบป้องกัน (staff)
- `/admin/thesis/exam-results` — ผลสอบป้องกัน
- `/admin/system-test/staff-queue` — คิวทดสอบระบบ (staff)
- `/admin/upload` — Import CSV

### Admin Reports (7 pages)
- `/admin/reports/internship` — สถิติฝึกงาน
- `/admin/reports/internship-supervisors` — สถิติสถานประกอบการ
- `/admin/reports/project` — Pipeline โปรเจค
- `/admin/reports/document-pipeline` — Document approval flow
- `/admin/reports/workflow-progress` — ความคืบหน้า workflow
- `/admin/reports/advisor-workload` — ภาระงานอาจารย์ที่ปรึกษา
- `/admin/reports/deadline-compliance` — การส่งงานตามกำหนด

### Public Pages (Token-based)
- `/approval/email/approve/:token` — อนุมัติผ่าน email
- `/evaluate/supervisor/:token` — แบบประเมินจาก supervisor

## Frontend Services (30+ files)

### API Client (src/lib/api/client.ts)
```typescript
apiFetch<T>(path, options) {
  // Auto-inject JWT from localStorage
  // Handle JSON + FormData
  // Parse error messages
  // Return typed response
}
```

### Service Pattern
```typescript
// All services follow:
async function apiCall(token: string, params?) {
  return apiFetch<ResponseType>('/api/endpoint', {
    headers: { Authorization: `Bearer ${token}` },
    method: 'GET/POST/PUT/DELETE',
    body: params ? JSON.stringify(params) : undefined
  });
}
```

### Service Categories
- **Academic:** academicService, settingsService
- **Project:** projectService (8+ APIs), projectPairsService
- **Student:** studentService (12+ APIs)
- **Internship:** internshipService (9+ APIs), internshipLogbookService (5), internshipCertificateService (4), internshipCompanyService (3)
- **Documents:** documentService, adminInternshipDocumentsService (6), adminProjectDocumentsService (3), adminInternshipCertificatesService (4)
- **Queues:** adminDefenseQueueService (6), adminSystemTestService (4), adminTopicExamService (5), adminProjectExamResultService (4)
- **Teacher:** teacherService (12+ APIs)
- **Reports:** reportService (16+ APIs with CSV export)
- **Admin:** adminService, adminStudentService, adminTeacherService

## Hooks (30+ React Query hooks)

All hooks use TanStack React Query v5:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["feature-key", token],
  queryFn: () => serviceFunction(token),
  enabled: Boolean(token),
  staleTime: 1000 * 60 * 2,  // 2 min
  refetchInterval: 1000 * 60 * 5,  // 5 min
});
```

### By Domain
- **Student:** useStudentEligibility, useStudentProjectStatus, useStudentProjectDetail, useStudentInternshipStatus, useStudentDeadlines, useStudentProfile, useStudentDocuments
- **Internship:** useCurrentCS05, useInternshipStudentInfo, useInternshipCertificate, useInternshipLogbook, useInternshipCompanyStats, useInternshipEvaluation, useInternshipCooperationLetter
- **Project:** useProjectPairs
- **Admin:** useAdminStats, useAdminStudents, useAdminTeachers, useAdminTopicExam, useAdminDefenseQueue, useAdminProjectExamResults, useAdminInternshipDocuments, useAdminInternshipCertificates, useAdminSystemTestQueue
- **Teacher:** useTeacherModule (KP02, thesis, system-test), useTeacherOverview
- **Workflow:** useWorkflowTimeline
- **Utility:** useHydrated, useFocusTrap

## Key Constants

### workflowStates.ts (Source of Truth)
**Enums:**
- InternshipStudentStatus: not_started, pending_approval, in_progress, completed
- InternshipDocumentStatus: draft → pending → approved → supervisor_evaluated → acceptance_approved → referral_ready → referral_downloaded → completed
- ProjectDocumentStatus: draft → advisor_assigned → in_progress → completed → archived
- ProjectWorkflowPhase: DRAFT → PENDING_ADVISOR → ADVISOR_ASSIGNED → TOPIC_SUBMISSION → TOPIC_EXAM_PENDING → TOPIC_EXAM_SCHEDULED → IN_PROGRESS → THESIS_SUBMISSION → THESIS_EXAM_PENDING → THESIS_EXAM_SCHEDULED → COMPLETED
- DefenseRequestStatus: draft → submitted → advisor_in_review → advisor_approved → staff_verified → scheduled → completed
- SystemTestRequestStatus: pending_advisor → pending_staff → staff_approved → evidence_submitted
- ExamResult: PASS, FAIL

**Transitions:** Each enum has a transition map defining valid state changes.
**UI Config:** STATUS_UI_CONFIG maps status → { label (Thai), labelEn, tone (success/warning/danger/info/muted) }
**canTransition(track, from, to):** Validates state transitions at runtime.

### statusLabels.ts
- labelStatus(value) → Thai label for any status enum
- statusTone(value) → Semantic color
- approvalStatusLabel() → Approval-specific labels
- formatRemainingDays() → "เหลือ X วัน" or "หมดระยะเวลาแล้ว"

### thaiDateUtils.ts
- currentBuddhistYear() → ปี พ.ศ. ปัจจุบัน (adjust before June)
- formatThaiDate(dateStr) → "DD/MM/YYYY (พ.ศ.)"
- formatThaiDateTime(dateStr) → "DD/MM/YYYY HH:mm (พ.ศ.)"
- isoToBangkokLocalInput() → datetime-local value
- bangkokLocalInputToISO() → ISO +07:00

## State Management

- **Server State:** TanStack React Query v5 (QueryClient with 60s staleTime)
- **Auth State:** React Context (AuthContext) with localStorage persistence
- **No Redux/Zustand** — Minimal client state, server-driven

## Auth Flow

### Login
1. User enters credentials → POST /api/auth/login
2. Backend returns JWT + user data
3. Token stored in localStorage (cslogbook:auth-token)
4. AuthContext updates, QueryClient enabled

### SSO (KMUTNB)
1. User clicks SSO button → redirected to KMUTNB SSO
2. Callback to /auth/sso/callback with code
3. Backend exchanges code → creates/links user → returns JWT
4. Same as regular login from step 3

### Token Refresh
- Auto-check expiry via setTimeout
- Redirect to /login on expiry
- Verify on page load

## Styling
- **CSS Modules** for layout (AppShell.module.css) and shared styles (requestPage.module.css)
- **Inline CSS** (React.CSSProperties) for components
- **Design Tokens** in globals.css (fonts, colors, spacing, shadows)
- **Fonts:** Inter (Latin) + Noto Sans Thai
- **No component library** — Custom CSS

---

# PART 5: INFRASTRUCTURE & DEPLOYMENT

## Docker Compose (Production)

```yaml
Services:
  mysql:
    image: mysql:8.0
    charset: utf8mb4
    healthcheck: mysqladmin ping
    memory: 512M
    volumes: mysql-data (persistent)

  backend:
    build: ./backend
    depends_on: mysql (healthy)
    healthcheck: wget /api/health
    volumes: backend-uploads, backend-logs (persistent)

  frontend:
    build: ./frontend-next
    depends_on: backend
    args: NEXT_PUBLIC_API_URL (baked at build)
```

All services bind to 127.0.0.1 only (Nginx reverse proxy on host).

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name cslogbook.me www.cslogbook.me 168.144.38.167;
    client_max_body_size 10M;

    location / { proxy_pass http://127.0.0.1:3000; }  # Frontend
    location /api/ { proxy_pass http://127.0.0.1:5000/api/; }  # Backend
    location /socket.io/ { proxy_pass http://127.0.0.1:5000/socket.io/; }  # WebSocket
    location /api-docs/ { proxy_pass http://127.0.0.1:5000/api-docs/; }  # Swagger
    location /uploads/ { proxy_pass http://127.0.0.1:5000/uploads/; }  # Static files
}
```

SSL: Certbot for Let's Encrypt (manual: `certbot --nginx -d cslogbook.me`)

## CI/CD Pipeline (GitHub Actions)

**Trigger:** Push to `master` branch

**Steps:**
1. Checkout code
2. Login to GitHub Container Registry (GHCR)
3. Build backend Docker image (tags: :latest + :sha for rollback)
4. Build frontend Docker image (bake NEXT_PUBLIC_API_URL from secrets)
5. Push both images to GHCR
6. SSH into VPS → pull images → docker compose up -d (zero-downtime)
7. Prune dangling layers

**Secrets:** VPS_HOST, VPS_USER, VPS_SSH_KEY, NEXT_PUBLIC_API_URL

## Environment Variables

### Backend (.env)
```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
JWT_SECRET (≥32 chars), JWT_EXPIRES_IN (1d)
EMAIL_PROVIDER (gmail/ethereal/console)
GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
PORT (5000), BASE_URL, NODE_ENV
FRONTEND_URL, ALLOWED_ORIGINS
ENABLE_AGENTS (true/false)
ACADEMIC_AUTO_UPDATE_ENABLED
UPLOAD_DIR (uploads/), MAX_FILE_SIZE (5MB)
```

### Frontend (env)
```
NEXT_PUBLIC_API_URL (required at build time)
NEXT_PUBLIC_ENABLE_* (30+ feature flags)
```

---

# PART 6: WORKFLOWS & BUSINESS LOGIC

## Internship Workflow

```
1. ตรวจสอบสิทธิ์ (Eligibility Check)
   ↓ Year >= 3, Credits >= threshold
2. ลงทะเบียนฝึกงาน (Registration)
   ↓ Submit CS05 (company info)
3. อนุมัติ CS05 (Staff Review)
   ↓ Staff approves → Head of Department signs
4. ออกหนังสือขอความอนุเคราะห์ (Cooperation Letter)
   ↓ PDF generation + download
5. ส่งหนังสือตอบรับ (Acceptance Letter)
   ↓ Upload company acceptance
6. ออกหนังสือส่งตัว (Referral Letter)
   ↓ PDF generation + download
7. ฝึกงาน + บันทึก Logbook (Daily Logging)
   ↓ Student writes daily → Supervisor approves
8. Supervisor ประเมิน (Evaluation)
   ↓ Token-based evaluation form (5 categories)
9. ขอใบรับรอง (Certificate Request)
   ↓ Staff approves → PDF generation
10. เสร็จสิ้น (Completed)
```

## Project Phase 1 Workflow

```
1. ตรวจสอบสิทธิ์ (Eligibility Check)
   ↓ Year >= 4, Credits >= threshold
2. ยื่นหัวข้อ (Topic Submission)
   ↓ CreateWizard: Basic → Details → Classification → Members → Review
3. อาจารย์ที่ปรึกษารับหัวข้อ (Advisor Assignment)
   ↓ Advisor accepts project
4. สอบหัวข้อ (Topic Exam)
   ↓ Staff schedules → Committee examines → Record PASS/FAIL
5. ส่ง Proposal (Proposal Submission)
   ↓ Upload revised proposal document
6. บันทึกประชุม (Meeting Logbook)
   ↓ Record meetings → Advisor approves logs
7. Phase 1 Complete
```

## Project Phase 2 Workflow

```
1. ทดสอบระบบ (System Test Request)
   ↓ Student submits → Advisor approves → Staff approves
   ↓ Upload evidence → Staff verifies
2. ขอสอบป้องกัน (Thesis Defense Request - KP02)
   ↓ Student submits → Advisor approves → Staff verifies → Schedule
3. สอบป้องกัน (Thesis Defense Exam)
   ↓ Committee examines → Record PASS/FAIL + score
4. ส่งเล่มสมบูรณ์ (Final Document)
   ↓ Upload final thesis
5. เสร็จสิ้น (Completed/Archived)
```

## Late Submission System

```
ImportantDeadline defines:
├── deadline_at (UTC timestamp)
├── accepting_submissions (Boolean)
├── allow_late (Boolean)
├── grace_period_minutes (after deadline)
├── lock_after_deadline (hard stop)
└── window_start_at / window_end_at

On submission:
├── Check if within window
├── Calculate delay: submission_delay_minutes = now - deadline_at
├── Set submitted_late = true if past deadline
├── Record in Document/ProjectDocument/DefenseRequest
└── Reports track late submissions per deadline
```

## Real-time Notifications (Socket.io)

```
Client connects with JWT → Server verifies → Join room: user_{userId}
Services/Agents emit to rooms for:
├── Document status changes
├── Approval notifications
├── Deadline reminders
└── System alerts
```

---

# PART 7: DEVELOPMENT HISTORY (45 Sessions)

## Phase 1: Foundation (Sessions 1-8, Feb 27 - Mar 2)
- S1: Login fixes, Thai font PDF, statusLabels utility
- S2: KP02 advisor decision defenseType fix
- S3: Phase 2 overview Thai labels, exam result cards, thesis gating
- S4: Phase 2 advisor name in hero cards
- S5: Admin UI refactor (detailSection, drawer footer)
- S6: Unified project page (Phase 1+2), "ปริญญานิพนธ์" naming
- S7: Admin documents UI, teacherPosition in JWT/RBAC
- S8: ConfirmDialog + Skeleton components, replaced window.confirm

## Phase 2: Cross-Layer Audits (Sessions 11-15, Mar 3-5)
- S11: RBAC audit, scoring.js extraction, dead route cleanup
- S12: Query key mismatch fix, security audits
- S13: CI/CD pipeline setup (GitHub Actions, GHCR, zero-downtime)
- S14: Logo, DefenseRequestStepper, design tokens
- S15: Survey URL fix, timesheet delete

## Phase 3: Teacher Features (Sessions 16-22, Mar 6)
- S16-19: Teacher queue redesign (filters, summary stats, gradient UI)
- S20: Staging test plan (P0-P3 categories)
- S21: Dead routes cleanup (9 routes removed)
- S22: Hotfix — restore incorrectly deleted getAcademicDashboard

## Phase 4: Settings & PDF (Sessions 23-27, Mar 6-7)
- S23: Academic/curriculum bug fixes, settings redesign
- S24: PDF system audit, pdfkit issues found
- S25: Admin report pages improvement
- S26: Notification settings UI
- S27: Gmail REST API migration (replace SMTP), SSO email fix

## Phase 5: Deep Audits (Sessions 29-36, Mar 8)
- S29-31: Status/workflow audit (3 layers), dead column cleanup, evidence_submitted
- S32: TypeScript workflow constants generation (workflowStates.ts)
- S33-36: Playwright E2E framework (4 user roles, 6 test folders)

## Phase 6: PDF & Request Pages (Sessions 37-44, Mar 9-11)
- S37: E2E seed script
- S38: หนังสือขอความอนุเคราะห์ PDF creation
- S39-42: PDF audit — 6 security fixes (IDOR), date format, null guards, filename sanitization
- S43: Certificate PDF rewire, internshipId filter
- S44: Unified request pages (shared CSS module, 4 reusable components)

## Phase 7: Reports (Session 45, Mar 16)
- S45: Document pipeline report, internship supervisors report, CSV export, optimize DB queries

## Key Lessons Learned
1. **Session 21/22:** ลบ route ผิด (false positive) — ต้อง verify frontend usage ก่อนลบ backend route ทุกครั้ง
2. **Session 12:** Query key mismatch ทำให้ dashboard ไม่ refresh — cache key ต้องตรงกันทั้ง hook และ mutation
3. **Session 29:** ExamResult PASS/FAIL vs ProjectDocument passed/failed เป็น intentional — service layer normalize
4. **Session 41:** IDOR vulnerability — Student A download เอกสาร Student B ได้ แก้ด้วย ownership check
5. **Session 39-42:** PDF ต้อง audit ละเอียด — date format, null guard, filename sanitization

---

# PART 8: TESTING

## Playwright E2E Testing

**Configuration:**
- Timeout: 60s (tests), 10s (expect)
- Sequential runs (not parallel)
- Screenshot/video on failure
- CI: 1 retry

**Test Projects (4 user roles):**
1. **setup** — auth.setup.ts (login all roles)
2. **officer** — Tests using support staff auth
3. **advisor** — Tests using academic teacher auth
4. **student** — Tests using student auth

**Test Folders:**
- `tests/01-smoke/` — Basic connectivity
- `tests/02-auth/` — Login/logout/SSO
- `tests/03-admin/` — Admin settings, user management
- `tests/04-workflows/` — Multi-role workflow scenarios
- `tests/05-security/` — RBAC, IDOR, token validation
- `tests/06-internship/` — Internship workflow tests

**Seed:** seed-test-data.ts creates test users and data

**Commands:**
```bash
npm run test:e2e           # Run all
npm run test:e2e:ui        # Playwright UI mode
npm run test:e2e:smoke     # Smoke only
```

## Staging Test Plan (docs/STAGING_TEST_PLAN.md)
- **P0 (Critical):** Login, SSO, eligibility check
- **P1 (High):** Document submission, approval flows
- **P2 (Medium):** Reports, CSV export, PDF generation
- **P3 (Low):** UI polish, edge cases

---

# PART 9: KEY TECHNICAL DECISIONS

## Why Sequelize (not Prisma/TypeORM)?
- Started with Sequelize 6 early in project, 98 migrations built up
- Migration-based schema evolution, mature ecosystem

## Why Next.js App Router?
- Server-side rendering for SEO (public pages)
- File-based routing scales well (60+ pages)
- React Server Components (future optimization)

## Why TanStack Query (not Redux)?
- Server-state focused (API data caching)
- Automatic refetch, stale management
- No boilerplate vs Redux for API state

## Why Socket.io?
- Real-time notifications (document approvals, deadline alerts)
- Room-based targeting (user_{userId})
- Fallback to long-polling if WebSocket fails

## Why Gmail API (not SMTP)?
- Session 27 migrated from SMTP to Gmail REST API
- More reliable than direct SMTP (fewer connection issues)
- OAuth2 refresh tokens for long-lived access

## Why pdfkit (not React-PDF)?
- Server-side generation (no browser needed)
- Thai font support via Loma.ttf
- Direct control over layout for official documents

---

# PART 10: CONVENTIONS & STANDARDS

## Naming Conventions
| Aspect | Convention | Example |
|--------|-----------|---------|
| Backend model files | PascalCase | ProjectDocument.js |
| Backend service files | camelCase | projectDocumentService.js |
| DB columns | snake_case | created_at, student_id |
| Frontend components | PascalCase .tsx | DefenseRequestStepper.tsx |
| Frontend hooks | use prefix | useStudentEligibility |
| Frontend services | camelCase | internshipService.ts |

## API Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

## Language Convention
- **UI text / comments:** Thai (ภาษาไทย)
- **Code / variables / commits:** English
- **Date display:** Buddhist Era (พ.ศ.) — add 543 to Gregorian year

## Database
- Timezone: Asia/Bangkok (+07:00)
- Charset: utf8mb4 / utf8mb4_unicode_ci
- Timestamps: created_at, updated_at (UTC stored, Bangkok displayed)
- Enums: Uppercase (PASS/FAIL, INTERNSHIP/PROJECT)

## Git Workflow
- Branch: claude/* (never commit to master directly)
- CI/CD: push to master triggers deploy
- Commits: English, conventional format (feat:, fix:, refactor:, docs:)

---

# APPENDIX A: Complete Model List

1. User
2. Student
3. Teacher
4. Admin
5. Academic
6. Curriculum
7. Document
8. DocumentLog
9. ProjectDocument
10. ProjectMember
11. ProjectTrack
12. ProjectMilestone
13. ProjectArtifact
14. ProjectEvent
15. ProjectExamResult
16. ProjectDefenseRequest
17. ProjectDefenseRequestAdvisorApproval
18. ProjectTestRequest
19. ProjectWorkflowState
20. WorkflowStepDefinition
21. InternshipDocument
22. InternshipLogbook
23. InternshipLogbookAttachment
24. InternshipLogbookRevision
25. InternshipLogbookReflection
26. InternshipEvaluation
27. InternshipCertificateRequest
28. Meeting
29. MeetingParticipant
30. MeetingLog
31. MeetingAttachment
32. MeetingActionItem
33. ImportantDeadline
34. DeadlineWorkflowMapping
35. TimelineStep
36. StudentProgress
37. StudentAcademicHistory
38. StudentWorkflowActivity
39. ApprovalToken
40. PasswordResetToken
41. NotificationSetting
42. TeacherProjectManagement
43. UploadHistory
44. SystemLog

# APPENDIX B: Complete Service List (42 files)

1. academicService.js
2. adminService.js
3. agentStatusService.js
4. authService.js
5. certificateService.js
6. cooperationLetterService.js
7. curriculumService.js
8. deadlineAutoAssignService.js
9. deadlineReportService.js
10. documentService.js
11. emailApprovalService.js
12. evaluation.service.js
13. importantDeadlineService.js
14. internshipAdminService.js
15. internshipCompanyStatsService.js
16. internshipLogbookService.js
17. internshipManagementService.js
18. internshipService.js
19. meetingService.js
20. meetingSummaryHelper.js
21. notificationSettingsService.js
22. passwordService.js
23. projectArtifactService.js
24. projectDefenseRequestService.js
25. projectDocumentService.js
26. projectExamResultService.js
27. projectManagementService.js
28. projectMembersService.js
29. projectMilestoneService.js
30. projectReportService.js
31. projectSystemTestService.js
32. projectTransitionService.js
33. projectWorkflowService.js
34. projectWorkflowStateService.js
35. referralLetterService.js
36. reportService.js
37. ssoService.js
38. studentService.js
39. studentUploadService.js
40. teacherService.js
41. timelineService.js
42. workflowService.js

# APPENDIX C: Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 18+ |
| Backend Framework | Express | 4.x |
| ORM | Sequelize | 6.x |
| Database | MySQL | 8.0 |
| Frontend Framework | Next.js | 16 (App Router) |
| UI Library | React | 19 |
| Language | TypeScript | 5.x |
| State Management | TanStack React Query | v5 |
| Real-time | Socket.io | 4.x |
| PDF Generation | pdfkit | 0.17.1 |
| Email | Gmail REST API + nodemailer | OAuth2 |
| Auth | JWT + KMUTNB SSO | - |
| Testing | Playwright | E2E (4 roles) |
| Containerization | Docker Compose | Production |
| Reverse Proxy | Nginx | + Certbot SSL |
| CI/CD | GitHub Actions | GHCR + SSH deploy |
| Validation | Joi + express-validator | - |
| Logging | Winston | error.log, app.log, sql.log |
