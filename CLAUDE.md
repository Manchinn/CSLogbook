# CLAUDE.md — CSLogbook

## Working Branch

**Always work on branch `claude/claude-md-mm56ik11ksjo6flh-JgWXL`**

ทุก session ให้เริ่มทำงานบน branch นี้โดยตรง ห้าม commit ลง `master` โดยตรง

---

## Project Overview

**CSLogbook** is a full-stack Student Activity Management System for the Computer Science and Information department. It manages internship and project workflows, document submissions, logbooks, meetings, deadlines, and student progress tracking.

**Stack:**
- **Backend:** Node.js 18+ / Express.js + Sequelize ORM + MySQL 8.0
- **Frontend:** Next.js 16 (App Router) + TypeScript + React 19 + TanStack React Query v5
- **Real-time:** Socket.io
- **Infrastructure:** Docker Compose, Nginx reverse proxy, GitHub Actions CI/CD

---

## Repository Structure

```
CSLogbook/
├── .github/
│   ├── workflows/deploy.yml          # CI/CD: push to master → SSH deploy to VPS
│   └── instructions/                 # Domain guides (internship, curriculum, PDF gen, etc.)
├── cslogbook/
│   ├── backend/                      # Node.js + Express API
│   ├── frontend-next/                # Next.js 16 App Router frontend
│   ├── nginx/                        # Nginx config for production
│   ├── database/                     # MySQL init scripts
│   └── docker-compose.production.yml # Production orchestration
├── package.json                      # Root monorepo (minimal; holds antd)
└── README.md                         # Installation guide (Thai)
```

---

## Backend (`cslogbook/backend/`)

### Entry Points
- `server.js` — Full server with Socket.io, CORS, Swagger, agent manager, graceful shutdown
- `app.js` — Express app decoupled from `server.js` (used directly in testing via supertest)

### Directory Layout
```
backend/
├── agents/              # Background schedulers & monitors (node-cron / node-schedule)
├── config/              # database.js, jwt.js, email.js, uploadConfig.js, server.js
├── constants/           # Shared application constants
├── controllers/         # Thin HTTP handlers — delegate to services
├── middleware/          # authMiddleware.js, authorize.js, errorHandler.js, rateLimiter.js, eligibility/deadline middleware
├── migrations/          # Sequelize migrations (93 files; timestamped YYYYMMDDHHMMSS)
├── models/              # Sequelize models (30+ including User, Student, Teacher, Project*, Internship*)
├── policies/            # permissions.js — RBAC policy definitions
├── routes/              # Route files; documents/ and swagger/ subdirectories
├── scripts/             # checkDb.js, checkModels.js, build.js
├── seeders/             # dev/ and production/ seeder files
├── services/            # Business logic layer (30+ service files)
├── templates/           # File generation templates
├── uploads/             # Runtime file storage (created automatically)
├── utils/               # logger.js, validateEnv.js, studentUtils.js, helpers
└── validators/          # Input validation rules (Joi + express-validator)
```

### Key Patterns

**Controller → Service → Model** — Controllers are thin. All business logic lives in `services/`.

**Authentication:**
- `middleware/authMiddleware.js` validates JWT, attaches `req.user`
- `middleware/authorize.js` enforces RBAC via role/type/position keys
- Roles: `student`, `teacher`, `admin`, `teacher_support`, `teacher_advisor`
- Teacher sub-permissions: `teacher:type`, `teacher:position:*`, `teacher:topic_exam_access`, `teacher:can_export_project1`

**Error handling:**
- Controllers use `try/catch` and pass errors to `next(err)`
- Centralized handler in `middleware/errorHandler.js`
- Logging via Winston (`utils/logger.js`) — files: `logs/error.log`, `logs/app.log`, `logs/sql.log`

**Database:**
- Sequelize 6 with MySQL dialect; UTF-8mb4; `Asia/Bangkok` timezone
- In test environment: SQLite in-memory (Jest-compatible)
- All models use snake_case fields and `timestamps: true` (`created_at`, `updated_at`)
- Association setup in `models/index.js`

**File uploads:**
- Multer handles uploads; files stored in `uploads/`
- Upload config: `config/uploadConfig.js`
- Only PDF allowed by default (`application/pdf`)

**API Prefix:** All REST endpoints live under `/api`

**Swagger docs:** `/api-docs` (UI) and `/api-docs.json` (raw spec for MCP tools)

**Real-time:** Socket.io rooms keyed as `user_{userId}` — join via JWT auth or `joinUserRoom` event

**Background Agents (toggled via env):**
- `ENABLE_AGENTS=true` starts all agents
- `ACADEMIC_AUTO_UPDATE_ENABLED=true` starts only `academicSemesterScheduler`
- Agents: deadlineReminder, eligibilityChecker, documentStatusMonitor, securityMonitor, logbookQualityMonitor, projectPurgeScheduler, academicSemesterScheduler, projectDeadlineMonitor, internshipStatusMonitor, internshipWorkflowMonitor

### Backend Environment Variables

Copy `.env.example` to `.env.development`:

```env
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
CORS_EXTRA_ORIGINS=          # Comma-separated extra CORS origins

DB_HOST=localhost
DB_PORT=3306
DB_USER=cslogbook
DB_PASSWORD=your_password
DB_NAME=cslogbook

JWT_SECRET=your-secret-at-least-32-chars
JWT_EXPIRES_IN=1d

EMAIL_PROVIDER=console        # gmail | smtp | ethereal | console
SENDGRID_API_KEY=             # (legacy)
EMAIL_LOGIN_ENABLED=false
EMAIL_DOCUMENT_ENABLED=false
EMAIL_LOGBOOK_ENABLED=false
EMAIL_MEETING_ENABLED=false

UPLOAD_DIR=uploads/
MAX_FILE_SIZE=5242880         # 5 MB

ENABLE_AGENTS=false
ACADEMIC_AUTO_UPDATE_ENABLED=false
```

### Backend Commands

```bash
cd cslogbook/backend
npm install
npm run dev              # Start dev server (nodemon, NODE_ENV=development)
npm start                # Start production server

# Database
npm run migrate          # Run pending migrations (dev)
npm run migrate:prod     # Run migrations (production)
npm run migrate:undo     # Undo last migration
npm run migrate:status   # Show migration status
npm run migrate:create -- <name>  # Generate new migration

npm run seed             # Seed all (dev)
npm run seed:dev         # Seed dev data only
npm run seed:prod        # Seed production data

npm run db:check:all     # Validate DB connection + model sync
```

---

## Frontend (`cslogbook/frontend-next/`)

### Framework & Routing

Next.js 16 App Router. All routes live under `src/app/`:

```
src/app/
├── (auth)/              # Unauthenticated layout
│   ├── login/
│   └── auth/sso/        # KMUTNB SSO callback
├── (app)/               # Authenticated layout (AuthGuard + AppShell)
│   ├── dashboard/student|teacher|admin
│   ├── internship/               # Student internship logbook & certificate
│   ├── internship-registration/  # CS-05 form flow & view
│   ├── internship-logbook/       # Timesheet & company info
│   ├── project/phase1|phase2     # Project lifecycle pages
│   ├── meetings/
│   ├── student-profile/[studentCode]
│   ├── teacher/                  # Teacher module pages
│   ├── admin/                    # Admin management pages
│   ├── reports/
│   ├── deadlines/ & student-deadlines/calendar
│   └── settings/
├── approval/timesheet/[token]    # Public timesheet approval
└── evaluate/supervisor/[token]   # Public supervisor evaluation
```

The `(app)` layout wraps all authenticated pages with:
- `AuthGuard` — redirects unauthenticated users to `/login`
- `AppShell` — main navigation shell

### Library Structure (`src/lib/`)

```
lib/
├── api/
│   ├── client.ts          # apiFetch / apiFetchData — base fetch wrapper with JWT injection
│   └── authService.ts     # login, logout, verifyToken
├── auth/
│   ├── storageKeys.ts     # localStorage key constants
│   └── mockSession.ts     # Dev-only role mocking
├── config/
│   └── env.ts             # Reads NEXT_PUBLIC_API_URL (required)
├── constants/             # App-wide constants (internship, projectTracks)
├── navigation/            # Route helpers
├── project/               # Project utilities
├── query/
│   └── queryClient.ts     # React Query client (staleTime: 60s, no refetchOnFocus)
└── services/              # Per-domain API service modules (30+)
```

### API Client Pattern

All API calls go through `apiFetch` in `lib/api/client.ts`:
- Automatically injects `Authorization: Bearer <token>` from `localStorage`
- Content-Type defaults to `application/json` for non-FormData bodies
- Throws on non-OK responses with parsed error messages
- `apiFetchData<T>` unwraps the standard `{ success, data }` envelope

### Authentication

`AuthContext.tsx` manages session:
- Token stored in `localStorage` under key `cslogbook:auth-token`
- On mount: validates token expiry from JWT payload; clears expired sessions
- Exposes: `user`, `token`, `isAuthenticated`, `isLoading`, `signIn`, `signOut`, `completeSsoLogin`
- Access via `useContext(AuthContext)` or the exported `useAuth` hook

### State Management

- **Server state:** TanStack React Query v5 (per-feature hooks in `src/hooks/`)
- **Auth state:** React Context (`AuthContext`)
- No Redux or Zustand — keep it that way

### Frontend Environment Variables

Copy `env.example` to `.env.local` (development) or `.env.production` (production):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

`NEXT_PUBLIC_API_URL` is **required** at build time (validated at startup). It is baked into the Docker image via `--build-arg`.

### Frontend Commands

```bash
cd cslogbook/frontend-next
npm install
npm run dev      # Next.js dev server on http://localhost:3000
npm run build    # Production build (standalone output)
npm run start    # Serve production build
npm run lint     # ESLint with next/core-web-vitals + TypeScript rules
```

---

## Adding Features — Conventions to Follow

### New Backend API Endpoint

1. Create/update **model** in `backend/models/` (if schema change needed → add migration)
2. Create **service** in `backend/services/` containing business logic
3. Create **controller** in `backend/controllers/` (thin — call service, return JSON)
4. Create/update **route** in `backend/routes/` and mount it in `app.js`
5. Protect with `authenticateToken` and `authorize.fromAllowed([...roles])` as appropriate
6. Add Swagger JSDoc annotations to the route file

### New Frontend Page

1. Create folder under `src/app/(app)/your-feature/page.tsx` (authenticated) or `src/app/your-feature/page.tsx` (public)
2. If data fetching needed: add a service in `src/lib/services/yourFeatureService.ts` using `apiFetch`
3. Create a custom hook in `src/hooks/useYourFeature.ts` using `useQuery` / `useMutation`
4. Build components under `src/components/` organized by domain

### Database Migrations

```bash
cd cslogbook/backend
npm run migrate:create -- descriptive-name   # Creates timestamped migration file
npm run migrate                              # Apply
npm run migrate:undo                         # Rollback one
```

Always run migrations before starting the backend after a pull.

---

## Code Conventions

| Aspect | Convention |
|---|---|
| Backend models | PascalCase (`ProjectDocument`, `InternshipLogbook`) |
| Backend files | camelCase (`projectService.js`, `authMiddleware.js`) |
| DB columns | snake_case (`created_at`, `student_id`) |
| Frontend components | PascalCase with `.tsx` (`StudentProfile.tsx`) |
| Frontend hooks | `use` prefix (`useStudentProfile.ts`) |
| Frontend services | camelCase with `Service` suffix (`projectService.ts`) |
| Comments | Mix of Thai and English; Thai for business/domain logic |
| Responses | `{ success: boolean, data?: T, message?: string }` envelope |
| Error responses | `{ success: false, code: 'ERROR_CODE', message: '...' }` |
| Thai language | Used in UI text, error messages, and inline comments |

---

## Testing

No automated test suite is currently configured. Validation is done via:

```bash
cd cslogbook/backend
npm run db:check:all    # DB connection + model sync check
```

The database layer is Jest-compatible (`config/database.js` uses SQLite in-memory when `JEST_WORKER_ID` is set or `NODE_ENV=test`).

---

## Production Deployment

### Architecture

```
Internet (port 80)
      ↓
Nginx (host) ← nginx/cslogbook.conf
      ├── /           → Frontend  (127.0.0.1:3000)
      ├── /api/       → Backend   (127.0.0.1:5000)
      ├── /api-docs/  → Swagger
      └── /uploads/   → Backend static files
```

Backend and Frontend bind only to `127.0.0.1`; Nginx is the sole public entry point.

### Deploy Process

```bash
# On VPS: /home/deploy-cslogbook/app/cslogbook
git pull
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

**CI/CD:** GitHub Actions (`deploy.yml`) triggers on push to `master`, SSHes into VPS and runs the above.

### Production Environment File

Location on VPS: `/home/deploy-cslogbook/app/cslogbook/.env.production`

Required variables in addition to dev ones:
```env
NODE_ENV=production
BASE_URL=https://your-domain.com
FRONTEND_URL=https://your-frontend-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api   # Baked into frontend Docker image at build
MYSQL_ROOT_PASSWORD=...
```

---

## Debugging Checklist

| Symptom | Where to look |
|---|---|
| CORS errors | `FRONTEND_URL` in backend `.env`, allowed origins in `app.js` |
| 401 Unauthorized | `JWT_SECRET` must be ≥ 32 chars; check token expiry |
| DB connection failure | DB env vars, MySQL running, `npm run db:check` |
| Upload failures | `uploads/` directory exists and is writable; `MAX_FILE_SIZE` |
| Missing columns | Run `npm run migrate` (preflight check in `server.js` warns on startup) |
| Email not sending | `EMAIL_*_ENABLED` flags; `EMAIL_PROVIDER` setting |
| Agents not running | `ENABLE_AGENTS=true` or `ACADEMIC_AUTO_UPDATE_ENABLED=true` |
| Socket.io not connecting | `FRONTEND_URL` in Socket.io CORS config in `server.js` |
| Backend logs | `cslogbook/backend/logs/error.log`, `app.log`, `sql.log` |
| Server boot log | `server.log` in repo root |

---

## Reference Documentation

Located in `.github/instructions/`:

| File | Topic |
|---|---|
| `frontend_structure_guide.instructions.md` | Frontend component organization |
| `overview_components_explanation.md` | Component inventory and purpose |
| `internship-registration-system.md` | CS-05 form and internship workflow |
| `logbook_approval.md` | Logbook approval flow |
| `curriculum.md` | Curriculum management |
| `evaluation_status_summary.md` | Evaluation status logic |
| `react-pdf-generation.md` | PDF generation in internship components |
| `password_change.md` | Password change flow |
| `copilot.instructions.md` | AI coding guidelines |

Also see `.github/copilot-instructions.md` for a concise AI assistant cheat-sheet (Thai).

---

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

#### Spacing Inconsistency Evidence

| Scale | Used Values | Problem |
|-------|-------------|---------|
| Base unit | 0.5rem, 0.55rem, 0.65rem, 0.75rem, 1rem | No systematic scale |
| Cards | 1rem, 20px | Mixed px/rem |
| Buttons | 0.5rem 0.85rem | Not standardized |

#### Recommended Roadmap

**Immediate (1-2 days):**
- Add form label accessibility
- Replace window.confirm with custom dialog
- Add basic error boundary

**Medium-term (1-2 weeks):**
- Extract admin CRUD to shared component
- Create Button, Tag, Alert UI components
- Add skeleton loading states
- Fix focus management

**Long-term (1+ month):**
- Migrate to antd (already in package.json)
- Create design tokens in dedicated theme config
- Comprehensive responsive design
- WCAG 2.1 AA compliance audit

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

---

### ❌ งานที่ยังต้องทำต่อ

#### 2. Staging / Regression Testing
- ทดสอบ end-to-end ใน staging ตาม `docs/STAGING_TEST_PLAN.md`
- เน้น: Phase 2 flow (system-test → thesis-defense → admin queues)
- ยืนยัน Phase 2 parity fixes: labels, tones, gating, loading state

#### 3. Dead Routes ใน teacherRoutes.js (Security Backlog)
- `GET /api/teachers/advisors`, `GET /api/teachers/me/profile`, `GET /api/teachers/user/:userId` — ไม่มี frontend consumer
- `PUT /api/teachers/:id`, `DELETE /api/teachers/:id` — duplicate กับ admin routes + IDOR risk
- พิจารณาลบหรือ consolidate เมื่อมีเวลา

#### 4. Report Endpoints ไม่มี Role Check (Security Backlog)
- `GET /api/reports/advisors/workload` และ `GET /api/reports/advisors/:teacherId/detail` — authenticated แต่ไม่มี authorize middleware
- พิจารณาเพิ่ม role check ถ้าข้อมูลมี sensitivity

#### 5. Student Result Pages (Out of Scope — ไม่ได้อยู่ในขอบเขตงาน)
- `/project/phase1/exam-day` — ยังเป็น stub ("กำลังเตรียมฟีเจอร์") — **ตั้งใจ ไม่ใช่ bug**
- Thesis exam result detail page — นักศึกษาเห็นแค่ hero badge — **ตั้งใจ ไม่ใช่ bug**

---

### 📁 ไฟล์สำคัญที่ต้องรู้

| ไฟล์ | หมายเหตุ |
|---|---|
| `backend/config/scoring.js` | เกณฑ์คะแนนกลาง: `PASS_SCORE`, `SCORE_BUCKETS`, `scoreToBucket()` — ใช้แทน hardcoded values |
| `src/lib/utils/statusLabels.ts` | Shared status label utility — ใช้ `labelStatus()` แทน raw enum ทุกที่ |
| `src/lib/services/teacherService.ts` | Teacher API layer — `submitKP02AdvisorDecision` ต้องส่ง `defenseType` |
| `src/hooks/useTeacherModule.ts` | Teacher hooks — `useSubmitKP02AdvisorDecision` รองรับ defenseType แล้ว |
| `project/phase1/view/ProjectContent.tsx` | **Main project page component** — unified Phase 1 + Phase 2 flow |
| `ProjectPhase1Sections.tsx` | `PhaseStepsGrid` — `showSectionDividers` prop, section dividers, renamed tabs |
| `ProjectPhase1Content.tsx` | Legacy (unused) — ไม่ mount แล้ว แต่เก็บไว้ |
| `ProjectPhase2Content.tsx` | Legacy (unused) — ไม่ mount แล้ว แต่เก็บไว้ |
| `ProjectPhase2Sections.tsx` | Active — `SummaryCards`, `Phase2GateNotice`, `MeetingLogbookSection` ใช้ใน ProjectContent |
| `src/lib/project/phase2Gate.ts` | Phase 2 gate reasons — ชื่อภาษาไทยอ้างอิง "ปริญญานิพนธ์" ทั้งหมด |
| `docs/STAGING_TEST_PLAN.md` | Test checklist สำหรับ staging |
| `docs/compatibility/` | Route usage, deprecation lists — อย่าลบ API ที่อยู่ใน DO_NOT_REMOVE |
| `docs/claudefix/admin-ui-pattern-refactor.md` | Admin UI pattern refactor log (Session 5) |
| `docs/claudefix/project-unified-redesign.md` | Project page unified redesign log (Session 6) |
| `backend/config/corsOrigins.js` | CORS dynamic allowed origins — ใช้ `ALLOWED_ORIGINS` env var |
| `src/app/globals.css` | Design tokens (CSS custom properties) — เพิ่มใน Session 14 |
| `src/components/common/DefenseRequestStepper.tsx` | Shared defense request stepper component |
| `src/components/dashboard/SurveyBanner.tsx` | Survey banner component — แสดงใน admin/student/teacher dashboards |
| `src/hooks/useInternshipReferralLetter.ts` | Hooks สำหรับ referral letter status + download |
| `src/app/not-found.tsx` | Custom 404 Not Found page |
| `.github/workflows/production-deploy.yml` | CI/CD pipeline — zero-downtime deployment via GitHub Actions |
