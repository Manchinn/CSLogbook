# CLAUDE.md — CSLogbook

## Working Branch

**Always work on branch `claude/claude-md-mm56ik11ksjo6flh-JgWXL`**

ห้าม commit ลง `master` โดยตรง

---

## Project Overview

**CSLogbook** — Full-stack Student Activity Management System (CS&IT department). Manages internship/project workflows, documents, logbooks, meetings, deadlines, student progress.

**Stack:** Node.js 18+ / Express / Sequelize / MySQL 8.0 | Next.js 16 (App Router) / TypeScript / React 19 / TanStack Query v5 | Socket.io | Docker Compose / Nginx / GitHub Actions CI/CD

---

## Repository Structure

```
CSLogbook/
├── .github/workflows/deploy.yml, instructions/
├── cslogbook/
│   ├── backend/          # Express API
│   ├── frontend-next/    # Next.js 16 App Router
│   ├── nginx/            # Production Nginx config
│   ├── database/         # MySQL init scripts
│   └── docker-compose.production.yml
├── package.json          # Root monorepo (holds antd)
└── docs/                 # Compatibility, session history, test plans
```

---

## Backend (`cslogbook/backend/`)

**Entry:** `server.js` (full server + Socket.io), `app.js` (Express app, used in testing)

```
backend/
├── agents/       # Background schedulers (node-cron/node-schedule)
├── config/       # database.js, jwt.js, email.js, uploadConfig.js, scoring.js, corsOrigins.js
├── controllers/  # Thin HTTP handlers → delegate to services
├── middleware/    # authMiddleware, authorize, errorHandler, rateLimiter
├── migrations/   # Sequelize migrations (93+ files)
├── models/       # 30+ Sequelize models
├── policies/     # permissions.js — RBAC definitions
├── routes/       # Route files + documents/ + swagger/
├── services/     # Business logic (30+ files)
├── utils/        # logger, studentUtils (CONSTANTS, reloadDynamicConstants)
└── validators/   # Joi + express-validator
```

### Key Patterns

- **Controller → Service → Model** — Controllers thin, logic in services
- **Auth:** `authMiddleware.js` (JWT), `authorize.js` (RBAC). Roles: `student`, `teacher`, `admin`. Teacher sub-perms: `teacher:type`, `teacher:position:*`, `teacher:topic_exam_access`
- **DB:** Sequelize 6 / MySQL / UTF-8mb4 / `Asia/Bangkok`. snake_case fields, `timestamps: true`. SQLite in-memory for tests
- **Uploads:** Multer → `uploads/`, PDF only. Config: `config/uploadConfig.js`
- **API:** All under `/api`. Swagger at `/api-docs`
- **Real-time:** Socket.io rooms `user_{userId}`
- **Agents:** `ENABLE_AGENTS=true` starts all. Individual: `ACADEMIC_AUTO_UPDATE_ENABLED=true`
- **Env vars:** Copy `backend/.env.example` → `.env.development`
- **Logging:** Winston → `logs/error.log`, `logs/app.log`, `logs/sql.log`

### Backend Commands

```bash
cd cslogbook/backend
npm run dev              # Dev server (nodemon)
npm run migrate          # Run pending migrations
npm run migrate:undo     # Undo last migration
npm run seed:dev         # Seed dev data
npm run db:check:all     # Validate DB + model sync
```

---

## Frontend (`cslogbook/frontend-next/`)

Next.js 16 App Router. Routes under `src/app/`:

- `(auth)/` — login, SSO callback
- `(app)/` — authenticated (AuthGuard + AppShell): dashboard, project, internship, teacher, admin, reports, settings
- `approval/`, `evaluate/` — public token-based pages

### Key Structure

```
src/
├── app/(app)/admin/settings/layout.tsx  # Shared settings tab navigation
├── lib/api/client.ts      # apiFetch with JWT injection
├── lib/services/           # Per-domain API modules (30+)
├── hooks/                  # React Query hooks per feature
├── components/common/      # ConfirmDialog, Skeleton, DefenseRequestStepper
└── components/layout/      # AppShell, Logo
```

- **State:** TanStack React Query (server) + React Context (auth). No Redux/Zustand
- **Auth:** `AuthContext.tsx` — token in localStorage `cslogbook:auth-token`
- **Env:** `NEXT_PUBLIC_API_URL` required at build time (see `env.example`)

### Frontend Commands

```bash
cd cslogbook/frontend-next
npm run dev      # Dev server :3000
npm run build    # Production build
npm run lint     # ESLint
```

---

## Conventions

| Aspect | Convention |
|---|---|
| Backend models/files | PascalCase models, camelCase files |
| DB columns | snake_case (`created_at`, `student_id`) |
| Frontend | PascalCase `.tsx` components, `use` prefix hooks, camelCase `*Service.ts` |
| Responses | `{ success, data?, message? }` envelope |
| Language | Thai in UI/comments, English in code/commits |

### Adding Features

- **Backend:** Model → Service → Controller → Route (mount in `app.js`) + `authenticateToken` + `authorize` + Swagger JSDoc
- **Frontend:** `src/app/(app)/feature/page.tsx` → `lib/services/` → `hooks/use*.ts` → `components/`
- **Migrations:** `npm run migrate:create -- name` → `npm run migrate`

---

## Production

```
Internet → Nginx (port 80)
  ├── /         → Frontend (127.0.0.1:3000)
  ├── /api/     → Backend (127.0.0.1:5000)
  ├── /api-docs → Swagger
  └── /uploads/ → Static files
```

CI/CD: push to `master` → GitHub Actions → SSH → `docker compose up -d --build`

---

## Debugging

| Symptom | Check |
|---|---|
| CORS errors | `FRONTEND_URL` + `ALLOWED_ORIGINS` in `.env`, `app.js` |
| 401 Unauthorized | `JWT_SECRET` ≥ 32 chars, token expiry |
| DB failure | DB env vars, MySQL running, `npm run db:check` |
| Missing columns | `npm run migrate` |
| Agents not running | `ENABLE_AGENTS=true` |
| Logs | `backend/logs/error.log`, `app.log` |

---

## Reference Docs

`.github/instructions/`: frontend_structure_guide, overview_components, internship-registration-system, logbook_approval, curriculum, evaluation_status_summary, react-pdf-generation, password_change, copilot

---

## Session History

Detailed logs: [`docs/SESSION_HISTORY.md`](docs/SESSION_HISTORY.md)

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

### Pending

- Staging regression testing — `docs/STAGING_TEST_PLAN.md`
- Student result pages (out of scope — intentional stubs)

---

## Key Files

| File | Notes |
|---|---|
| `backend/config/scoring.js` | `PASS_SCORE`, `SCORE_BUCKETS`, `scoreToBucket()` |
| `backend/utils/studentUtils.js` | CONSTANTS cache, `reloadDynamicConstants` — critical for academic/curriculum |
| `backend/config/corsOrigins.js` | Dynamic CORS via `ALLOWED_ORIGINS` env |
| `backend/config/departmentInfo.js` | ชื่อหัวหน้าภาค, คณะ, มหาวิทยาลัย — ใช้ใน PDF ทุกประเภท |
| `src/lib/utils/statusLabels.ts` | `labelStatus()` — use instead of raw enums |
| `src/lib/utils/thaiDateUtils.ts` | `currentBuddhistYear()` shared function |
| `src/lib/services/teacherService.ts` | Teacher API — `submitKP02AdvisorDecision` needs `defenseType` |
| `src/hooks/useTeacherModule.ts` | Teacher hooks — supports `defenseType` |
| `project/phase1/view/ProjectContent.tsx` | **Main project page** — unified Phase 1 + 2 |
| `ProjectPhase1Sections.tsx` | `PhaseStepsGrid` with section dividers |
| `ProjectPhase2Sections.tsx` | `SummaryCards`, `Phase2GateNotice`, `MeetingLogbookSection` |
| `src/lib/project/phase2Gate.ts` | Phase 2 gate reasons (Thai) |
| `src/app/globals.css` | Design tokens (spacing, shadows, surfaces) |
| `admin/settings/layout.tsx` | Shared settings tab navigation (6 pages) |
| `admin/settings/settings.module.css` | Shared CSS for all settings pages |
| `src/components/common/ConfirmDialog.tsx` | Replaces `window.confirm` |
| `src/components/common/Skeleton.tsx` | Table/card skeleton loading |
| `src/components/common/DefenseRequestStepper.tsx` | Defense request stepper |
| `src/components/dashboard/SurveyBanner.tsx` | Survey banner (3 dashboards) |
| `docs/compatibility/` | DO_NOT_REMOVE API usage lists |
| `docs/STAGING_TEST_PLAN.md` | Test checklist (P0-P3) |
| `.github/workflows/production-deploy.yml` | CI/CD pipeline |

### Legacy (kept, not mounted)

- `ProjectPhase1Content.tsx`, `ProjectPhase2Content.tsx` — replaced by `ProjectContent.tsx`

### Lessons Learned

- **Verify frontend usage before deleting routes** (Session 21 false positive)
- **Match cache keys** between queries and mutations (Session 12 mismatch)
- **Field names: follow backend** — don't rename without checking both sides
