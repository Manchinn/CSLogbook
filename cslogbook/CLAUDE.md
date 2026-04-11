# CSLogbook

ระบบจัดการฝึกงานและโปรเจคจบการศึกษา — ภาควิชาวิทยาการคอมพิวเตอร์ มจพ. (KMUTNB)

## Tech Stack

```
Frontend : Next.js 16.1.6 (App Router, standalone) + React 19 + TypeScript
Backend  : Express 4.21 + Sequelize 6.37 + MySQL 8.0
Real-time: Socket.io 4.8
Auth     : JWT (jsonwebtoken) + bcrypt
Testing  : Jest (backend), ไม่มี test framework ที่ frontend
DevOps   : Docker + Nginx reverse proxy
```

## Architecture

```
cslogbook/
├── frontend-next/          ← Next.js 16 App Router (port 3000)
├── backend/                ← Express API (port 5000)
├── database/               ← Init scripts, migration docs
├── nginx/                  ← Reverse proxy config
├── docker-compose.production.yml
└── CLAUDE.md               ← (this file)
```

ไม่ใช่ true monorepo — frontend กับ backend แยก runtime, ไม่มี shared packages

## Frontend (`frontend-next/`)

### Key Structure

```
src/
├── app/
│   ├── (app)/              ← Protected routes (ต้อง login)
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── internship/
│   │   ├── project/
│   │   ├── student/
│   │   └── teacher/
│   ├── (auth)/             ← Public auth routes
│   ├── layout.tsx          ← Root layout (fonts)
│   └── providers.tsx       ← React Query, Auth, Notifications
├── components/             ← แบ่งตาม domain (admin/, auth/, common/, layout/, workflow/)
├── contexts/
│   ├── AuthContext.tsx      ← JWT + user state
│   └── NotificationContext.tsx  ← Socket.io + React Query
├── hooks/                  ← 30+ data hooks (useAuth, useLogStream, useTeacherModule ฯลฯ)
├── lib/
│   ├── api/client.ts       ← apiFetch() + Bearer token injection
│   ├── config/env.ts       ← NEXT_PUBLIC_API_URL validation
│   ├── config/featureFlags.ts  ← 12+ feature toggles
│   ├── services/           ← 20+ API service files
│   └── query/queryClient.ts    ← React Query config (staleTime: 60s)
└── styles/                 ← CSS variables + module CSS (ไม่ใช้ Tailwind)
```

### Patterns & Conventions

- **Path alias:** `@/*` → `./src/*`
- **State management:** React Query (server state) + Context (auth/notifications) + useState (local)
- **API calls:** `apiFetch<T>(path, options)` — fetch-based, auto-inject Bearer token จาก localStorage
- **Styling:** CSS custom properties + CSS Modules — **ไม่มี Tailwind**
- **Fonts:** Inter + Noto Sans Thai + Noto Serif Thai (Google Fonts)
- **Route Groups:** `(app)` = protected, `(auth)` = public
- **Feature Flags:** 12+ flags อ่านจาก `NEXT_PUBLIC_ENABLE_*` env vars

### Auth Flow (Frontend)

1. `AuthContext` อ่าน `cslogbook:auth-token` จาก localStorage
2. Validate JWT expiry → call `/auth/verify-token`
3. Set auto-logout timeout ตาม `exp`
4. `apiFetch()` inject `Authorization: Bearer ${token}` ทุก request

### Next.js Config

```typescript
output: "standalone"              // Docker-optimized
turbopack: { root: __dirname }    // Turbopack enabled
rewrites: ["/uploads/:path*" → INTERNAL_BACKEND_URL]  // Docker-to-Docker
```

**สำคัญ:** `INTERNAL_BACKEND_URL` ใช้สำหรับ server-side rewrites (Docker network), `NEXT_PUBLIC_API_URL` ใช้สำหรับ client-side API calls

### Environment Variables (Frontend)

```
NEXT_PUBLIC_API_URL          ← Required: Backend API URL
INTERNAL_BACKEND_URL         ← Docker internal backend URL (default: computed from API_URL)
NEXT_PUBLIC_ENABLE_*         ← Feature flags (12+ toggles)
NEXT_PUBLIC_ENABLE_MOCK_AUTH ← Dev: mock login without backend
```

---

## Backend (`backend/`)

### Key Structure

```
backend/
├── server.js               ← HTTP server + Socket.io + agents
├── app.js                  ← Express app (testable, no server binding)
├── config/
│   ├── database.js         ← Sequelize instance (MySQL/PostgreSQL/SQLite)
│   ├── corsOrigins.js      ← Dynamic CORS whitelist
│   └── jwt.js              ← JWT config
├── controllers/            ← 40+ controllers (request handling)
├── services/               ← 40+ services (business logic)
├── models/                 ← 46 Sequelize models
├── routes/                 ← 20+ route files
├── middleware/
│   ├── authMiddleware.js   ← JWT verification + token blacklist
│   ├── authorize.js        ← RBAC middleware
│   ├── errorHandler.js     ← Centralized error handling
│   └── rateLimiter.js
├── migrations/             ← 40+ Sequelize migrations
├── seeders/                ← Dev + production seeds
├── agents/                 ← Background schedulers (cron jobs)
├── validators/             ← Joi schemas
├── utils/                  ← 19 utility files
├── templates/              ← Email templates
├── tests/                  ← 7 Jest test files
└── uploads/                ← File storage (csv/, internship/, projects/)
```

### Architecture Pattern

```
Route → Middleware (auth + authorize) → Controller → Service → Model/DB
                                                  ↘ NotificationService → Socket.io
```

- **Controller:** request handling, input extraction
- **Service:** business logic, data access, side effects
- **Model:** Sequelize definitions + associations
- **Middleware:** auth, RBAC, validation, error handling

### Database

- **Dialect:** MySQL 8.0 (production), SQLite in-memory (Jest)
- **Charset:** utf8mb4_unicode_ci (Thai language support)
- **Timezone:** +07:00 (Asia/Bangkok)
- **Pool:** Dev: max 10, Prod: max 25
- **46 models** — key ones:

| Model | Purpose |
|---|---|
| User → Student / Teacher / Admin | Base auth + role-specific profiles |
| Document + InternshipDocument / ProjectDocument | Document submission system |
| InternshipLogbook + Attachments + Reflections | Weekly internship logs |
| ProjectMember + ProjectDocument + ProjectExamResult | Project team management |
| Meeting + MeetingActionItem | Meeting records + action tracking |
| ImportantDeadline + DeadlineWorkflowMapping | Deadline enforcement |
| Notification + NotificationSetting | Real-time notification system |
| TimelineStep + StudentWorkflowActivity | Student progress tracking |
| Academic + Curriculum + StudentAcademicHistory | Academic calendar |

### Authentication (Backend)

**JWT Payload:**
```javascript
{
  userId, role, email, firstName, lastName,
  jti,              // JWT ID for revocation
  studentId?,       // ถ้าเป็น student
  teacherId?,       // ถ้าเป็น teacher
  teacherType?,     // 'academic' | 'advisor' | 'support'
  canAccessTopicExam?
}
```

**Roles:** `student | teacher | admin`
**Teacher subtypes:** `teacher:academic`, `teacher:advisor`, `teacher:support`, `teacher:position:หัวหน้าภาควิชา`

**Token lifecycle:**
- Login → JWT signed → stored in localStorage
- Refresh → new token, old token blacklisted
- Logout → token added to blacklist (node-cache)

### API Endpoints

| Prefix | Auth | Purpose |
|---|---|---|
| `/api/auth` | public/protected | Login, SSO, refresh, logout |
| `/api/students` | token | Student profile, progress, grades |
| `/api/teachers` | token | Advisors, supervision, meetings |
| `/api/admin` | admin/support | System admin, reports, migrations |
| `/api/documents` | mixed | Document CRUD |
| `/api/internship` | token | Internship management + logbooks |
| `/api/projects` | token | Project management + transitions |
| `/api/notifications` | token | Notification CRUD |
| `/api/workflow` | token | Workflow step definitions |
| `/api/timeline` | mixed | Student timeline (public + protected) |
| `/api/reports` | token | Reports + deadline reports |

### Socket.io

- **Main namespace (`/`):** Notifications via `user_{userId}` rooms
  - Server emits `notification:new` → invalidates React Query cache
- **Monitoring namespace (`/monitoring`):** Admin-only log streaming
  - Events: `tail(fileName)`, `stop_tail()`, `log_line`

### Background Agents

| Agent | Schedule | Purpose |
|---|---|---|
| deadlineReminderAgent | cron | แจ้งเตือน deadline ใกล้ถึง |
| academicSemesterScheduler | cron | อัพเดต academic year/semester |
| eligibilityScheduler | cron | ตรวจสอบ eligibility (ฝึกงาน/โปรเจค) |
| projectPurgeScheduler | cron | ลบ project data ที่หมดอายุ |
| tokenCleanupScheduler | cron | ลบ expired tokens |
| documentStatusMonitor | realtime | Monitor document status changes |
| projectDeadlineMonitor | cron | ตรวจ project deadline violations |

### Environment Variables (Backend)

```
# Required
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
JWT_SECRET, JWT_EXPIRES_IN
PORT (default: 5000)
FRONTEND_URL
ALLOWED_ORIGINS

# Email (provider: gmail | ethereal | console)
EMAIL_PROVIDER, EMAIL_SENDER
GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN

# Optional
UPLOAD_DIR (default: uploads/)
MAX_FILE_SIZE (default: 5MB)
ENABLE_AGENTS (default: false in dev)
```

---

## Docker Deployment

```yaml
# docker-compose.production.yml
services:
  mysql:     # MySQL 8.0 — 127.0.0.1:3306 (internal)
  backend:   # Express — 127.0.0.1:5000 (internal)
  frontend:  # Next.js — 127.0.0.1:3000 (internal)
# Nginx reverse proxy → public access
```

- ทุก service bind `127.0.0.1` — public access ผ่าน Nginx เท่านั้น
- Images: `ghcr.io/${GHCR_OWNER}/cslogbook-*:latest`
- Volumes: `mysql-data`, `backend-uploads`, `backend-logs`
- Memory limit: 512M per service

### Nginx Routing

| Path | Destination |
|---|---|
| `/` | Next.js frontend (3000) |
| `/api/` | Express backend (5000) |
| `/socket.io/` | Socket.io (5000) |
| `/api-docs/` | Swagger (5000) |
| `/uploads/` | Static files (5000) |

---

## Development

```bash
# Backend
cd backend
cp .env.example .env.development
npm install
npm run migrate          # Run migrations
npm run seed:dev         # Seed dev data
npm run dev              # → localhost:5000

# Frontend
cd frontend-next
cp .env.staging .env.local
npm install
npm run dev              # → localhost:3000
```

## Gotchas & Critical Notes

- **ไม่มี Tailwind** — frontend ใช้ CSS variables + CSS Modules
- **MySQL ไม่ใช่ PostgreSQL** — database-reviewer agent mention PostgreSQL แต่โปรเจคใช้ MySQL
- **Feature flags** ควบคุม UI ผ่าน env vars — ไม่ใช่ทุก feature จะเปิดในทุก environment
- **SSO** (KMUTNB) hardcoded enabled — มี compatibility layer สำหรับ legacy tokens
- **localStorage keys** prefix `cslogbook:` — `cslogbook:auth-token`, `cslogbook:auth-user`
- **No frontend tests** — ไม่มี Jest/Vitest/Playwright ที่ frontend
- **`app.js` vs `server.js`** — `app.js` export Express app สำหรับ testing (supertest), `server.js` สร้าง HTTP server + Socket.io
- **File uploads** proxy ผ่าน Next.js rewrites → backend container
- **Timezone** ตั้งเป็น +07:00 (Bangkok) ทั้ง DB และ backend
- **Commit format:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
