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

---

### ❌ งานที่ยังต้องทำต่อ

#### 1. Admin Settings Endpoints (Deferred — Backlog)
- `GET/PUT /api/admin/settings/eligibility` — ไม่มี frontend consumer ที่ active
- `GET/POST/PUT/DELETE /api/admin/settings/student-statuses` — backend ยังไม่มี route
- ยังไม่ implement จนกว่าจะมีความต้องการชัดเจน

#### 2. Staging / Regression Testing
- ทดสอบ end-to-end ใน staging ตาม `docs/STAGING_TEST_PLAN.md`
- เน้น: Phase 2 flow (system-test → thesis-defense → admin queues)
- ยืนยันว่า `defenseType` fix ทำงานถูกต้องใน environment จริง
- ยืนยัน Phase 2 parity fixes: labels, tones, gating, loading state

#### 3. Feature Flags ที่ยังปิดอยู่ (ถ้าต้องการเปิด)
- `NEXT_PUBLIC_ENABLE_INTERNSHIP_LOGBOOK_PAGE` — ทำเสร็จแล้ว รอเปิด production
- `NEXT_PUBLIC_ENABLE_INTERNSHIP_CERTIFICATE_PAGE` — ทำเสร็จแล้ว รอเปิด production
- `NEXT_PUBLIC_ENABLE_PROJECT_PHASE2_PAGE` — เปิดแล้ว (default true)

---

### 📁 ไฟล์สำคัญที่ต้องรู้

| ไฟล์ | หมายเหตุ |
|---|---|
| `src/lib/utils/statusLabels.ts` | Shared status label utility — ใช้ `labelStatus()` แทน raw enum ทุกที่ |
| `src/lib/services/teacherService.ts` | Teacher API layer — `submitKP02AdvisorDecision` ต้องส่ง `defenseType` |
| `src/hooks/useTeacherModule.ts` | Teacher hooks — `useSubmitKP02AdvisorDecision` รองรับ defenseType แล้ว |
| `ProjectPhase2Content.tsx` | Phase 2 overview — มี `PHASE_LABELS`, `labelPhase()`, tone-aware `stepStatuses`, loading/empty guards |
| `ProjectPhase2Sections.tsx` | Phase 2 presentational — `StepStatus` type, `canSubmitThesisDefense` gating, meeting nav button |
| `docs/STUDENT_PAGES_PARITY_REPORT.md` | Parity tracking — Phase 2 overview ควรอัปเดตเป็น ✅ Done (เหลือ advisor name) |
| `docs/STAGING_TEST_PLAN.md` | Test checklist สำหรับ staging |
| `docs/compatibility/` | Route usage, deprecation lists — อย่าลบ API ที่อยู่ใน DO_NOT_REMOVE |
