# CLAUDE.md — CSLogbook

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

Debugging: [`docs/DEBUGGING_GUIDE.md`](docs/DEBUGGING_GUIDE.md) | Instruction docs: `.github/instructions/`

---

## Session History

Full log: [`docs/SESSION_HISTORY.md`](docs/SESSION_HISTORY.md) (43 sessions)

**Recent (last 5):**
| # | Date | Summary |
|---|---|---|
| 39-43 | 03-09 | PDF audit, IDOR fixes, data integrity, certificate PDF rewire |
| 38 | 03-09 | สร้างหนังสือขอความอนุเคราะห์ PDF + download flow |
| 37 | 03-09 | E2E seed script + fix skip conditions |
| 36 | 03-08 | E2E: security route-access + internship workflow |
| 35 | 03-08 | E2E: multi-role workflow specs |

---

## Key Files

| File | Notes |
|---|---|
| `backend/config/scoring.js` | `PASS_SCORE`, `SCORE_BUCKETS`, `scoreToBucket()` |
| `backend/utils/studentUtils.js` | CONSTANTS cache, `reloadDynamicConstants` |
| `backend/config/departmentInfo.js` | ชื่อหัวหน้าภาค — ใช้ใน PDF ทุกประเภท |
| `src/constants/workflowStates.ts` | Enums, transitions, UI config, `canTransition()` |
| `src/lib/utils/statusLabels.ts` | `labelStatus()` — use instead of raw enums |
| `src/lib/utils/thaiDateUtils.ts` | `currentBuddhistYear()` |
| `src/app/globals.css` | Design tokens |

Full list: [`docs/KEY_FILES_REFERENCE.md`](docs/KEY_FILES_REFERENCE.md)
