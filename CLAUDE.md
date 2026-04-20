# CLAUDE.md — CSLogbook

## 🚨 Claude Workspace Rules (อ่านก่อนทุก session)

**ไฟล์ที่ Claude สร้างใหม่ต้องแยกประเภทให้ชัด — ห้าม pollute git repo**

### ✅ สร้างใน repo ได้ (track เข้า git)
- Source code: `cslogbook/backend/**`, `cslogbook/frontend-next/**`
- Project docs ที่ user ขอชัดเจน: `README.md`, `DEPLOY.md`, `CLAUDE.md`
- Migrations, seeders, tests
- Config files (ที่ไม่มี secret)

### ❌ ต้องสร้างนอก repo ที่ `C:/Users/chinn/CSLog-Workspace/` (หรือ `~/CSLog-Workspace/`)

| ประเภท | Path | ตัวอย่าง |
|---|---|---|
| Handover / setup guides | `~/CSLog-Workspace/handover/` | `KhaNiwat-Setup-Guide.md`, `Department-Handover-Checklist.md` |
| Drafts / brainstorm | `~/CSLog-Workspace/drafts/` | architecture ideas, option comparisons |
| Learning / postmortem | `~/CSLog-Workspace/learnings/` | bug analysis, lessons learned |
| Rehearsal / presentation | `~/CSLog-Workspace/rehearsal/` | demo scripts, speaker notes |
| Personal / thesis | `~/CSLog-Personal/` | ส่วนตัว ห้ามแม้แต่ user อื่นในทีมเห็น |

### กฎเพิ่มเติม
- **ก่อนสร้างไฟล์ใหม่ใน repo** — ถาม user ก่อนเสมอ เว้นแต่เป็น code change ที่ scope ชัด
- **ห้าม write ใน paths:** `cslogbook-architecture.*`, `rehearsal/`, `docs/thesis/`, `docs/learnings/`, `Canva_*`, `*-Setup-Guide.md`, `*-Checklist.md`
- ถ้า `~/CSLog-Workspace/` ไม่มี — สร้างได้เลย ไม่ต้องถาม

---

## Project Overview

**CSLogbook** — ระบบจัดการ workflow ทางวิชาการของภาควิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB) ครอบคลุม 3 tracks: ฝึกงาน (Internship), โครงงานพิเศษ (Special Project), ปริญญานิพนธ์ (Thesis)

**Stack:** Node.js 18+ / Express / Sequelize / MySQL 8.0 | Next.js 16 (App Router) / TypeScript / React 19 / TanStack Query v5 | Socket.io | Docker Compose / Nginx / GitHub Actions CI/CD

**Deployed URL:** `https://cslogbook.me`

---

## User Roles

| Role | คำอธิบาย | Login |
|------|----------|-------|
| **เจ้าหน้าที่ (Officer/admin)** | จัดการรายชื่อนักศึกษา, อนุมัติคำร้อง, บันทึกผลสอบ, ออกเอกสาร | username/password |
| **นักศึกษา (Student)** | ยื่นคำร้อง, กรอกข้อมูล, บันทึก logbook, ยื่นสอบ | SSO KMUTNB |
| **อาจารย์ที่ปรึกษา (Advisor/teacher)** | อนุมัติบันทึกพบอาจารย์, อนุมัติคำร้องยื่นสอบก่อนส่งต่อเจ้าหน้าที่ | username/password |
| **ผู้ควบคุมงาน (Supervisor)** | ประเมินนักศึกษาฝึกงาน (เฉพาะ track Internship) | link ประเมิน / login |

---

## Domain Glossary (คำศัพท์เฉพาะ)

| คำศัพท์ | ความหมาย |
|---------|----------|
| **คพ.05** | แบบฟอร์มคำร้องขอฝึกงาน — กรอกข้อมูลบริษัท/ตำแหน่ง → เจ้าหน้าที่อนุมัติ |
| **หนังสือขอความอนุเคราะห์** | เอกสารภาควิชาออกให้ขอบริษัทรับนักศึกษาฝึกงาน (generate หลัง approve คพ.05) |
| **หนังสือตอบรับ** | เอกสารที่บริษัทกรอกแล้ว — นักศึกษา scan + upload เข้าระบบ |
| **หนังสือส่งตัว** | เอกสารส่งตัวนักศึกษาฝึกงาน (generate หลัง approve หนังสือตอบรับ) |
| **Logbook** | บันทึกกิจกรรมรายวันระหว่างฝึกงาน |
| **แบบประเมิน** | Supervisor กรอกหลังนักศึกษาฝึกครบตามจำนวนวัน |
| **หนังสือรับรองการฝึกงาน** | เอกสารรับรองผ่านฝึกงาน — ใช้ยื่นจบ |
| **บันทึกพบอาจารย์** | ต้องครบ ≥4 ครั้ง จึงยื่นสอบได้ (ใช้ทั้ง โครงงานพิเศษ และ ปริญญานิพนธ์) |
| **สถานะเล่ม** | สถานะเล่มปริญญานิพนธ์ฉบับสมบูรณ์ (เจ้าหน้าที่บันทึก) |

---

## System Flows

### Approval Chain Pattern
```
นักศึกษา submit → [Advisor approve (ถ้ามี)] → เจ้าหน้าที่ approve/บันทึกผล
```
- **Internship:** นักศึกษา → เจ้าหน้าที่ (ไม่ผ่าน Advisor)
- **Special Project & Thesis:** นักศึกษา → Advisor → เจ้าหน้าที่

### Flow B: ฝึกงาน (Internship)
B1 คพ.05 → B2 หนังสือตอบรับ → B3 ข้อมูลสถานประกอบการ → B4 Logbook → B5 ประเมิน + หนังสือรับรอง

### Flow C: โครงงานพิเศษ (Special Project)
C1 เสนอหัวข้อ → C2 ผลสอบหัวข้อ (assign advisor) → C3 พบอาจารย์ ≥4 ครั้ง → C4 ยื่นสอบโครงงาน 1

### Flow D: ปริญญานิพนธ์ (Thesis)
D1 พบอาจารย์ ≥4 ครั้ง → D2 ขอทดสอบระบบ → D3 ขอสอบปริญญานิพนธ์ → D4 ผลสอบ + สถานะเล่ม

### Unlock Conditions

| เงื่อนไข | ผลลัพธ์ |
|----------|---------|
| กรอกหน่วยกิตแล้ว | unlock เมนูฝึกงาน / โครงงานพิเศษ |
| คพ.05 approved | unlock download หนังสือขอความอนุเคราะห์ + แบบฟอร์มตอบรับ |
| หนังสือตอบรับ approved | unlock download หนังสือส่งตัว |
| ฝึกครบตามจำนวนวัน | unlock ปุ่มส่งแบบประเมินให้ Supervisor |
| ผลสอบหัวข้อ = ผ่าน | unlock โครงงานพิเศษ 1 |
| บันทึกพบอาจารย์ ≥4 ครั้ง (approved) | unlock ปุ่มยื่นคำร้องขอสอบ |
| ผลสอบโครงงาน 1 = ผ่าน | unlock ปริญญานิพนธ์ |

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
├── package.json          # Root monorepo
└── CLAUDE.md
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
├── migrations/   # Sequelize migrations (103 files)
├── models/       # 46 Sequelize models
├── policies/     # permissions.js — RBAC definitions
├── routes/       # Route files + documents/ + swagger/
├── services/     # Business logic (56 files incl. subdirs)
├── utils/        # 19 utility files — logger, studentUtils, excelExportBuilder, etc.
└── validators/   # Joi + express-validator (4 files)
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
- `(app)/` — authenticated (AuthGuard + AppShell): admin, dashboard, internship, project, student, teacher, meetings, reports, settings, deadlines + 14 feature-specific routes (internship-*, project-*, student-*, approve-documents)
- `approval/`, `evaluate/` — public token-based pages

### Key Structure

```
src/
├── app/(app)/admin/settings/layout.tsx  # Shared settings tab navigation
├── lib/api/client.ts      # apiFetch with JWT injection
├── lib/services/           # Per-domain API modules (31 files)
├── hooks/                  # React Query hooks per feature (35 files)
├── components/common/      # ConfirmDialog, Skeleton, DefenseRequestStepper
├── components/layout/      # AppShell, Logo
├── components/dashboard/   # Dashboard widgets
└── components/teacher/     # Teacher-specific components
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

Instruction docs: `.github/instructions/`

---

## Key Files

| File | Notes |
|---|---|
| `backend/utils/excelExportBuilder.js` | `ExcelExportBuilder` class + `formatThaiDate()` — ใช้ทุก Excel export |
| `src/lib/utils/excelDownload.ts` | `downloadExcelFile()` — shared frontend Excel download utility |
| `backend/config/scoring.js` | `PASS_SCORE`, `FULL_SCORE`, `SCORE_BUCKETS`, `scoreToBucket()` |
| `backend/utils/studentUtils.js` | CONSTANTS cache, `reloadDynamicConstants` |
| `backend/config/departmentInfo.js` | ชื่อหัวหน้าภาค — ใช้ใน PDF ทุกประเภท |
| `src/constants/workflowStates.ts` | Enums, transitions, UI config, `canTransition()` |
| `src/lib/utils/statusLabels.ts` | `labelStatus()` — use instead of raw enums |
| `src/lib/utils/thaiDateUtils.ts` | `currentBuddhistYear()` |
| `src/app/globals.css` | Design tokens |

