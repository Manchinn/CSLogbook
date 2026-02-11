# CSLogbook Frontend (Next.js + TypeScript)

โปรเจกต์นี้คือ frontend ตัวใหม่ของ CSLogbook ที่สร้างด้วย **Next.js (App Router)** และ **TypeScript**
เพื่อใช้เป็นจุดเริ่มต้นในการพัฒนาฟีเจอร์ใหม่แบบค่อย ๆ ย้ายจากระบบเดิม

---

## 1) เริ่มใช้งานอย่างเร็ว (Quick Start)

### สิ่งที่ต้องมี
- Node.js 18+ (แนะนำ 20+)
- npm 9+

### ติดตั้งและรัน
```bash
cd cslogbook/frontend-next
npm install
cp env.example .env.local
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000`

---

## 2) คำสั่งที่ใช้บ่อย

```bash
npm run dev     # Development server
npm run lint    # ตรวจโค้ดตามกฎ ESLint
npm run build   # Build production
npm run start   # รัน production server (หลัง build)
```

---

## 3) โครงสร้างโปรเจกต์

```text
frontend-next/
├─ public/                # static assets
├─ src/
│  └─ app/                # App Router (Next.js)
│     ├─ layout.tsx       # root layout + metadata
│     ├─ page.tsx         # หน้าแรก
│     ├─ globals.css      # global styles
│     └─ page.module.css  # styles ของหน้าแรก
├─ next.config.ts
├─ tsconfig.json
└─ eslint.config.mjs
```

---

## 4) การตั้งค่า Environment

ไฟล์ตัวอย่าง: `env.example`

```bash
# URL ของ backend API (ฝั่ง browser ใช้ NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Auth
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_SSO=false

# Dashboard widget rollouts
NEXT_PUBLIC_ENABLE_TEACHER_WIDGET_MIGRATION=true
NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION=true
NEXT_PUBLIC_ENABLE_STUDENT_INTERNSHIP_WIDGET=true
NEXT_PUBLIC_ENABLE_STUDENT_PROJECT_WIDGET=true
NEXT_PUBLIC_ENABLE_ADMIN_WIDGET_MIGRATION=false

# Page rollouts (false = redirect to /app)
NEXT_PUBLIC_ENABLE_STUDENT_PROFILE_PAGE=true
NEXT_PUBLIC_ENABLE_PROJECT_PHASE1_PAGE=true
NEXT_PUBLIC_ENABLE_PROJECT_PHASE2_PAGE=false
NEXT_PUBLIC_ENABLE_INTERNSHIP_FLOW_PAGE=true
NEXT_PUBLIC_ENABLE_INTERNSHIP_LOGBOOK_PAGE=false
NEXT_PUBLIC_ENABLE_INTERNSHIP_CERTIFICATE_PAGE=false
NEXT_PUBLIC_ENABLE_DEADLINES_PAGE=true
NEXT_PUBLIC_ENABLE_MEETINGS_PAGE=false
NEXT_PUBLIC_ENABLE_REPORTS_PAGE=false
NEXT_PUBLIC_ENABLE_SETTINGS_PAGE=false
```

> ถ้าจะใช้งานตัวแปรใน client component ให้ขึ้นต้นด้วย `NEXT_PUBLIC_` เท่านั้น

ตัวอย่างการใช้งาน:
```ts
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
```

---

## 5) วิธีเพิ่มหน้าใหม่

ตัวอย่าง: เพิ่มหน้า `/dashboard`

1. สร้างไฟล์ `src/app/dashboard/page.tsx`
2. ใส่ component หน้า dashboard

ตัวอย่าง:
```tsx
export default function DashboardPage() {
  return <h1>Dashboard</h1>;
}
```

จากนั้นเปิด `http://localhost:3000/dashboard`

---

## 6) แนวทางพัฒนาต่อจากจุดนี้

- แยก UI components ไว้ใน `src/components/`
- แยก API services ไว้ใน `src/services/`
- กำหนด route ตามโมดูล เช่น `src/app/(student)/...`, `src/app/(admin)/...`
- ใช้ React Query ผ่าน `AppProviders` สำหรับ state/data fetching จาก API จริง

---

## 7) Troubleshooting

### Build เจอ warning เรื่อง workspace root
เกิดจาก repo นี้มีหลาย `package-lock.json` (monorepo-like structure)
- ตอนนี้ยัง build ได้ปกติ
- ถ้าต้องการลด warning ให้กำหนด root ใน `next.config.ts` ตามโครงสร้างที่ทีมต้องการ

### เปลี่ยนพอร์ต
```bash
npm run dev -- --port 3001
```

---

## 8) Tech Stack

- Next.js 16
- React 19
- TypeScript
- ESLint (eslint-config-next)

---


## 9) Refactor Progress (Frontend Base)

สถานะปัจจุบันของการ refactor รอบแรก:
- Setup App Shell กลาง (Sidebar + Header + Main Content)
- วาง UX/UI base ด้วย design tokens ใน `globals.css`
- ปรับโฮมเพจเป็นตัวอย่างการ์ดเนื้อหาเพื่อใช้ต่อยอดเป็น dashboard

ไฟล์หลักที่เกี่ยวข้อง:
- `src/components/layout/AppShell.tsx`
- `src/components/layout/AppShell.module.css`
- `src/app/globals.css`
- `src/app/page.tsx`

---


## 10) Refactor Sprint: Login + Dashboard

สิ่งที่เพิ่มในรอบนี้:
- หน้า `\`/login\`` สำหรับเริ่ม flow authentication (UI prototype)
- หน้า `\`/dashboard\`` สำหรับ UX/UI โครงหลักของระบบหลัง login
- แยก route group เป็น `(auth)` และ `(app)` เพื่อควบคุม layout ตาม best practices

โครงสร้างใหม่ที่สำคัญ:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/login/LoginForm.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/dashboard/page.tsx`

หมายเหตุ: ตอนนี้ยังเป็น mock login (กด Sign in แล้วไป dashboard) เพื่อเตรียมต่อ API จริงในขั้นถัดไป

---


## 11) Migration Plan (React เก่า -> frontend-next)

ตอบคำถาม: **ย้ายทั้งหมดมา frontend-next ได้** แต่ควรทำแบบเป็นเฟสเพื่อลดความเสี่ยง

เฟสที่เริ่มแล้วในรอบนี้:
- สร้าง `AppRedirect` component สำหรับ redirect เข้า dashboard ตาม role
- route `/app` ทำหน้าที่เป็นจุดเข้าแอปหลัง login แล้ว redirect ต่ออัตโนมัติ
- login form รองรับ role แบบ mock เพื่อทดสอบ flow ระหว่าง `(auth)` และ `(app)`

เฟสถัดไปที่แนะนำ:
1. ย้าย `AuthContext` และ API login จริง (JWT/SSO)
2. ย้าย Dashboard ของแต่ละ role แบบทีละหน้า
3. ย้าย shared components และ services ตามลำดับการใช้งานจริง
4. เปิดใช้งาน feature flags แล้วค่อยปิด frontend เดิม

---

## 12) Phase 2 Progress (AuthContext + Role Dashboards + Feature Flags)

สิ่งที่เพิ่มแล้ว:
- `AuthProvider` + `useAuth` สำหรับจัดการ session ฝั่ง frontend-next
- `authService` + `apiFetch` เพื่อรองรับ API login จริง และ mock auth ผ่าน feature flag
- แยก dashboard ตาม role: `/dashboard/student`, `/dashboard/teacher`, `/dashboard/admin`
- เพิ่มจุด redirect กลาง `/app` เพื่อส่งต่อไป dashboard ตาม role จาก session
- เพิ่ม feature flags สำหรับเปิด/ปิด mock auth

ตัวอย่าง env (ดู `env.example`):
```bash
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_SSO=false
```

แผนถัดไป:
1. ผูก endpoint จริง `/auth/login` และ SSO callback
2. ย้าย dashboard widgets จาก frontend เดิมเข้ามาทีละ role
3. ย้าย shared services/hooks ที่ใช้งานจริงก่อน
4. ค่อย ๆ ปิดหน้าเดิมด้วย feature flags

---

## 13) Phase 3 Progress (Real Auth endpoint + SSO callback + React Query)

สิ่งที่เพิ่มแล้ว:
- Login ฝั่งจริงเรียก `/auth/login` ด้วย payload `username/password` (mock auth ยังเปิดได้ด้วย flag)
- เพิ่ม flow SSO callback ที่ route `/auth/sso/callback` เพื่อรับ `token` จาก backend แล้วสร้าง session ฝั่ง Next.js
- ติดตั้งและตั้งค่า `@tanstack/react-query` ใน `AppProviders`
- ย้าย widget สถิติ admin จาก frontend เดิมบางส่วน: สร้าง `adminService` + `useAdminStats` และ render ในหน้า `/dashboard/admin`
- เพิ่มการย้าย teacher overview widget ชุดแรกจาก endpoint `/teachers/academic/dashboard` ผ่าน `teacherService` + `useTeacherOverview`

ค่า env ที่เกี่ยวข้อง:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
NEXT_PUBLIC_ENABLE_SSO=true
NEXT_PUBLIC_ENABLE_TEACHER_WIDGET_MIGRATION=true
NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION=true
```

---

## 14) Phase 4 Progress (Student Eligibility Widget Migration)

สิ่งที่เพิ่มแล้ว:
- ย้าย student eligibility widget ชุดแรกจาก endpoint `/students/check-eligibility` ผ่าน `studentService` + `useStudentEligibility`
- เพิ่ม `StudentEligibilityWidget` (hydration-safe + loading/error state) แสดงสิทธิ์ฝึกงาน/โครงงาน และเครดิตรวม/วิชาเอกจากข้อมูลจริง
- ผูก widget เข้า `/dashboard/student` และควบคุม rollout ด้วย feature flag `NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION`

ค่า env ที่เกี่ยวข้อง:
```bash
NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION=true
```

---

## 15) Phase 5 Progress (Student Deadlines Widget)

สิ่งที่เพิ่มแล้ว:
- ย้าย widget กำหนดส่งนักศึกษาจาก endpoint `/students/important-deadlines/upcoming` (Hydration-safe + loading/error/empty)
- เพิ่ม service/hook (`getStudentUpcomingDeadlines` + `useStudentDeadlines`) และ render บน `/dashboard/student`
- ใช้ feature flag `NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION` ในการเปิดใช้งาน

ค่า env ที่เกี่ยวข้อง:
```bash
NEXT_PUBLIC_ENABLE_STUDENT_WIDGET_MIGRATION=true
```

## 16) Phase 6 Progress (Student Internship/Project Status Widgets)

สิ่งที่เพิ่มแล้ว:
- StudentInternshipStatusWidget แสดงบริษัท/ช่วงฝึกงาน/ชั่วโมงที่อนุมัติ ดึงจาก `/internship/summary`, `/logbooks/internship/timesheet/stats`, `/internship/certificate-status`
- StudentProjectStatusWidget แสดง phase ปัจจุบัน + สิทธิ์ยื่นสอบ ดึงจาก `/projects/mine` และ `/projects/:id/workflow-state`
- เพิ่ม service/hook (`getStudentInternshipStatus`, `useStudentInternshipStatus`, `getStudentProjectStatus`, `useStudentProjectStatus`) พร้อม per-widget feature flags

ค่า env ที่เกี่ยวข้อง:
```bash
NEXT_PUBLIC_ENABLE_STUDENT_INTERNSHIP_WIDGET=true
NEXT_PUBLIC_ENABLE_STUDENT_PROJECT_WIDGET=true
```

---

## 17) Phase 7 Progress (Auth Hardening + Routes Stubs)

สิ่งที่เพิ่มแล้ว:
- ตรวจสอบ token expiry ใน `AuthProvider` + auto logout + verify token on mount
- `AuthGuard`/`RoleGuard` รอ auth loading และ redirect ไป `/login` เมื่อไม่ผ่าน
- เพิ่ม feature flags ครอบ widget/admin/report/settings/page-level
- Stub หน้าตามเมนูใหม่ (มี guard + redirect ไป `/app` เมื่อปิด flag) พร้อมเติมเนื้อหาจริงให้:
  - `/project/phase1` (สถานะโครงงาน, member, deadlines, workflow timeline)
  - `/internship-registration/flow` (eligibility, status, deadlines, workflow timeline)
  - `/project/phase2`, `/internship/logbook`, `/internship/certificate`, `/deadlines`, `/reports`, `/settings`, `/meetings` (ยังเป็น stub + redirect ไป `/app` เมื่อปิด flag)
- เมนูปรับให้รู้จัก flag/page ใหม่ และซ่อนหรือ redirect ไปหน้าใหม่ตาม flag
- ย้าย widget admin/teacher เพิ่มเติม: Teacher overview widget ฉบับเต็ม, Admin project workflow widget (flag แยก) ที่ดึงสถิติ phase/ผลสอบ/blocked/overdue

ค่า env ที่เกี่ยวข้อง (ตัวอย่าง):
```bash
NEXT_PUBLIC_ENABLE_PROJECT_PHASE1_PAGE=true
NEXT_PUBLIC_ENABLE_INTERNSHIP_FLOW_PAGE=true
NEXT_PUBLIC_ENABLE_ADMIN_WIDGET_MIGRATION=false
NEXT_PUBLIC_ENABLE_ADMIN_PROJECT_WORKFLOW_WIDGET=false
```

แผนถัดไป:
1) Rollout widget ใหม่ตาม flag บน dashboard จริง และเสริมรายงาน/ตั้งค่าอื่น ๆ
2) เติมเนื้อหาหน้า stub ที่เหลือ (/project/phase2, /internship/logbook, /internship/certificate, รายงาน/ตั้งค่า)

## 18) Phase 8 Progress (Student Deadlines Calendar)

สิ่งที่เพิ่มแล้ว:
- หน้า `/student-deadlines/calendar` แสดงปฏิทินกำหนดการนักศึกษาพร้อมสถานะ submission และตัวกรองปีการศึกษา
- `/deadlines` เปลี่ยนเป็น redirect ไปหน้าใหม่เมื่อเปิด flag เพื่อให้ลิงก์เมนูใช้ UI เดียวกัน
- เพิ่ม service/hook สำหรับดึงทุกกำหนดการ (important deadlines) ให้ React Query ใช้งาน

ค่า env ที่เกี่ยวข้อง:
```bash
NEXT_PUBLIC_ENABLE_DEADLINES_PAGE=true
```

---

## 19) Phase 9 Progress (Internship Companies Stats)

สิ่งที่เพิ่มแล้ว:
- หน้า `/internship-companies` (student/teacher/admin) ย้าย UI สถิติสถานประกอบการจาก frontend เดิม โดยใช้ endpoint เดิม `/internship/company-stats` และ `/internship/company-stats/:companyName/detail`
- ตัวกรองปีการศึกษา + limit (student ค่าเริ่มต้น 10, staff 50 พร้อม hard cap 20/200 ตาม backend) พร้อมปุ่มรีเฟรช
- Drawer รายละเอียดบริษัทแสดงรายชื่อนักศึกษา/ช่วงฝึกงานจาก CS05 ที่ได้รับอนุมัติ และ capacity rule 2 คน/บริษัท (legacy)

ค่า env ที่เกี่ยวข้อง:
- ใช้ `NEXT_PUBLIC_API_URL` + token เดิม ไม่มี flag เพิ่มเติม

---

## 20) Phase 10 Progress (Supervisor Evaluation Public Form)

สิ่งที่เพิ่มแล้ว:
- หน้า public `/evaluate/supervisor/[token]` สำหรับผู้ควบคุมงานกรอกประเมินด้วย token จากอีเมล
- Service/hook ใหม่เรียก backend `GET/POST /internship/supervisor/evaluation/:token` พร้อม validation/expired/used handling
- UI ให้คะแนน 5 หมวด (4 รายการ/หมวด), รวมคะแนนอัตโนมัติ และสรุป pass/fail

ค่า env ที่เกี่ยวข้อง:
- ใช้ `NEXT_PUBLIC_API_URL` สำหรับ backend URL (ไม่ต้องใช้ auth token บนหน้านี้)

---

## 21) Phase 11 Progress (Teacher/Admin Parity: Upload + Settings)

สิ่งที่เพิ่มแล้ว:
- ย้ายหน้า `/admin/upload` พร้อม prerequisite checks ก่อนอัปโหลด (หลักสูตร + ปีการศึกษา), รองรับไฟล์ `.csv/.xlsx`, สรุปผลนำเข้า และ filter รายการผลลัพธ์
- ย้ายชุดหน้า `/admin/settings/*` เป็นหน้าใช้งานจริงสำหรับ support/admin:
  - `curriculum`: CRUD หลักสูตร + เกณฑ์หน่วยกิต
  - `academic`: จัดการปีการศึกษา/ภาคเรียน + important deadlines + policy
  - `status`: CRUD สถานะนักศึกษา
  - `notification-settings`: toggle การแจ้งเตือน + ตารางสถานะ agent
  - `workflow-steps`: CRUD/reorder ขั้นตอน workflow + ดูสถิติ
- ปรับเมนูให้ใช้งาน route ใหม่ของ admin settings โดยไม่พึ่งหน้า overview เดิม

ไฟล์หลักที่เกี่ยวข้อง:
- `src/app/(app)/admin/upload/page.tsx`
- `src/app/(app)/admin/settings/curriculum/page.tsx`
- `src/app/(app)/admin/settings/academic/page.tsx`
- `src/app/(app)/admin/settings/status/page.tsx`
- `src/app/(app)/admin/settings/notification-settings/page.tsx`
- `src/app/(app)/admin/settings/workflow-steps/page.tsx`

---

## 22) Phase 12 Progress (Student/App Flows + Public Approval Links)

สิ่งที่เพิ่มแล้ว:
- เพิ่ม public approval link สำหรับอนุมัติ timesheet: `/approval/timesheet/[token]` (approve/reject + ตรวจสถานะลิงก์)
- ขยาย flow ฝั่ง student:
  - `/internship-registration` มีฟอร์มยื่น CS05 + แนบ transcript
  - `/internship/logbook` และ `/internship/certificate` มี view จริง (เปิด/ปิดด้วย feature flags)
  - `/project/phase1` และ `/project/phase2` มี content จริง และแตกย่อยบางขั้นตอนแล้ว
- Dashboard migration ยังคงใช้งานได้ต่อเนื่อง (student/teacher/admin widgets)

ไฟล์หลักที่เกี่ยวข้อง:
- `src/app/approval/timesheet/[token]/page.tsx`
- `src/app/(app)/internship-registration/view/RegistrationForm.tsx`
- `src/app/(app)/internship/logbook/InternshipLogbookView.tsx`
- `src/app/(app)/internship/certificate/InternshipCertificateView.tsx`
- `src/app/(app)/project/phase1/view/ProjectPhase1Content.tsx`
- `src/app/(app)/project/phase2/view/ProjectPhase2Content.tsx`

---

## 23) Current Refactor Snapshot

สถานะปัจจุบันโดยรวม:
- หน้าหลักของ role student/teacher/admin และ admin settings สำคัญ ถูกย้ายมา Next.js แล้วในระดับใช้งานจริง
- บางหน้าในเมนูหลักยังเป็น placeholder ภายใต้ feature flags (`/meetings`, `/reports`, `/settings`) เพื่อ rollout แบบค่อยเป็นค่อยไป
- แนวทาง migration ปัจจุบันยังยึด parity-first: ย้ายตามโมดูล, คุมความเสี่ยงด้วย flags, และเชื่อม backend เดิมให้ครบก่อนปิดหน้า legacy

---

## 24) Next Focus: Admin User Management Refactor (Students / Teachers / Project Pairs)

เป้าหมายเฟสถัดไป:
- ย้ายหน้า admin จัดการข้อมูล `นักศึกษา`, `อาจารย์`, `นักศึกษาโครงงานพิเศษ` จาก legacy มา Next.js แบบ parity-first
- คง flow API เดิมและ behavior เดิมให้ครบก่อน แล้วค่อย optimize UX/โค้ดในรอบถัดไป
- วางโครงสร้าง service + hook + page ที่ reusable และทดสอบง่ายตาม best practices

### 24.1 Scope (Legacy -> Next)

1. นักศึกษา (legacy: `features/user-management/components/StudentList`)
- รายการ + search/filter (search, status, academicYear)
- สรุปสถิติย่อ (total / eligible internship / eligible project / no eligibility)
- Drawer ดูรายละเอียด, เพิ่ม, แก้ไข, ลบ

2. อาจารย์ (legacy: `features/user-management/components/TeacherList`)
- รายการ + search/filter (position, teacherType)
- Drawer ดูรายละเอียด, เพิ่ม, แก้ไข, ลบ
- รองรับ field สิทธิ์เฉพาะอาจารย์ (`canAccessTopicExam`, `canExportProject1`)

3. นักศึกษาโครงงานพิเศษ (legacy: `features/user-management/components/ProjectPairs`)
- รายการโครงงาน + summary ตามสถานะ
- filter หลายมิติ (projectStatus, documentStatus, trackCodes, projectType, academicYear, semester)
- Drawer รายละเอียดโครงงาน
- Modal เพิ่มโครงงาน (ค้นหานักศึกษา, ตรวจสิทธิ์, เลือกอาจารย์ที่ปรึกษา/track)

### 24.2 API Flow ที่ต้องยึดตาม Legacy

นักศึกษา:
- `GET /students` (รองรับ `search`, `status`, `academicYear`, `semester`)
- `GET /students/filter-options`
- `POST /students`
- `PUT /students/:id` (legacy ส่ง `studentCode` เป็น id)
- `DELETE /students/:id`

อาจารย์:
- `GET /admin/teachers`
- `POST /admin/teachers`
- `PUT /admin/teachers/:id`
- `DELETE /admin/teachers/:id`

นักศึกษาโครงงานพิเศษ:
- `GET /project-members` (project pair list + filters)
- `GET /admin/projects/student/:studentCode` (lookup นักศึกษาใน modal เพิ่มโครงงาน)
- `GET /admin/advisors`
- `GET /admin/projects/tracks`
- `POST /admin/projects/create-manually` (หรือ `/admin/projects/manual` ตาม backend route ที่เปิดใช้งาน)
- `PUT /admin/projects/:projectId` และ `POST /admin/projects/:projectId/cancel` (สำหรับรอบแก้ไข/ยกเลิก)

### 24.3 Recommended Next.js Structure

routes:
- `src/app/(app)/admin/users/students/page.tsx`
- `src/app/(app)/admin/users/teachers/page.tsx`
- `src/app/(app)/project-pairs/page.tsx`

services:
- `src/lib/services/adminStudentService.ts`
- `src/lib/services/adminTeacherService.ts`
- `src/lib/services/projectPairsService.ts`

hooks:
- `src/hooks/useAdminStudents.ts`
- `src/hooks/useAdminTeachers.ts`
- `src/hooks/useProjectPairs.ts`

shared UI:
- `src/components/admin/users/*`
- `src/components/admin/project-pairs/*`

### 24.4 Best Practices (ต้องคงไว้ระหว่างย้าย)

- ใช้ React Query แยก `queryKey` ต่อโมดูล/ตัวกรอง และ invalidate เฉพาะ scope ที่เกี่ยวข้อง
- แยก `DTO/normalizer` สำหรับข้อมูลจาก API เพื่อกันผลกระทบจาก payload ที่ไม่สม่ำเสมอ
- ใช้ client/server component ให้เหมาะสม (table/filter/form เป็น client component)
- ใส่ loading/error/empty state ให้ครบทุก list และทุก drawer/modal
- รักษา role guard เดิม (admin + teacher support) ผ่าน `RoleGuard`
- ลด optimistic update ที่เสี่ยง และ refresh จาก server หลัง mutation สำคัญ (add/update/delete)
- เก็บข้อความ error จาก backend ให้ใกล้เคียง legacy เพื่อไม่เปลี่ยนพฤติกรรมผู้ใช้ปลายทาง

### 24.5 Migration Sequence (แนะนำ)

1. Students page (พื้นฐาน CRUD + filters + statistics)
2. Teachers page (CRUD + position/teacherType + permission flags)
3. Project pairs page (list/filter/drawer) แล้วปิดท้ายด้วย add-project modal
4. เก็บ parity pass รอบสุดท้ายเทียบ legacy และเช็คเมนูนำทางครบ

### 24.6 Definition of Done (เฟสนี้)

- เส้นทางในเมนู admin เปิดใช้งานได้จริง:
  - `/admin/users/students`
  - `/admin/users/teachers`
  - `/project-pairs`
- API flow ตาม legacy ทำงานครบ CRUD/read flow
- ผ่าน lint และไม่มี regression ที่หน้า admin settings / upload / dashboard เดิม
- มี migration notes สั้น ๆ ใน README ทุกครั้งที่ปิดงานย่อยของ 3 หน้านี้

### 24.7 Implementation Progress (Current)

เสร็จแล้ว:
- `/admin/users/students`
  - ต่อ API จริงผ่าน `GET /students`, `GET /students/filter-options`, `POST/PUT/DELETE /students`
  - มี list + filters + statistics + drawer view/edit/create + delete flow
- `/admin/users/teachers`
  - ต่อ API จริงผ่าน `GET/POST/PUT/DELETE /admin/teachers`
  - มี list + filters + drawer view/edit/create + teacher permission fields (`canAccessTopicExam`, `canExportProject1`)
- `/project-pairs`
  - ต่อ API จริงผ่าน `GET /project-members`
  - มี list + filters + summary + drawer รายละเอียดโครงงาน
  - เพิ่ม Add Project Modal (student lookup + advisor + tracks + create manually)
  - เพิ่ม update/cancel flow จากหน้า detail และใช้ข้อความ validation ชุดเดียวกับ legacy

รอบถัดไป (parity deepen):
1. ปรับ UX modal/drawer ให้ใกล้เคียง legacy มากขึ้น (layout, badge, helper text) ✅
2. เพิ่ม field parity เชิงลึกสำหรับรายละเอียดโครงงาน (objective/background/scope/expectedOutcome/benefit/methodology/timeline/risk) และส่ง payload update ครบชุด ✅
3. งานถัดไป: เก็บ parity workflow flags/policy message เฉพาะทางเพิ่มตามข้อมูลจริงจาก backend ใน production scenarios

---

## 25) Next Focus: Admin Document Management Refactor (Internship Requests / Internship Certificates)

เป้าหมายเฟสถัดไป:
- ย้ายหน้า admin จัดการ `เอกสารฝึกงาน` จาก legacy มา Next.js แบบ parity-first โดยเน้น 2 หน้า:
  - `/admin/documents/internship` (คำร้องขอฝึกงาน)
  - `/admin/documents/certificates` (หนังสือรับรองการฝึกงาน)
- คง flow API เดิม, สถานะเอกสารเดิม, และข้อความ error หลักเดิมให้ครบก่อน แล้วค่อย optimize UX ในรอบถัดไป
- วางโครง service + hook + page component ให้ reusable, testable, และสอดคล้องกับแนวทาง React Query ปัจจุบันของโปรเจกต์

### 25.1 Scope (Legacy -> Next)

1. คำร้องขอฝึกงาน (legacy: `src/components/admin/documents/index.js`)
- ตารางเอกสาร + search/filter (status, academicYear, semester)
- summary chips (pending/reviewing/approved/rejected/cancelled + late indicators)
- bulk action สำหรับ pending:
  - ตรวจและส่งต่อ (staff review)
  - ปฏิเสธพร้อมเหตุผล
- modal รายละเอียดเอกสาร (`DocumentDetails`) และ preview ฟอร์ม CS05
- รองรับดู/ดาวน์โหลดไฟล์เอกสาร

2. หนังสือรับรองการฝึกงาน (legacy: `features/internship/components/admin-view/CertificateManagement.js`)
- ตารางคำขอ + search/filter + pagination
- summary chips (pending/approved/rejected/total)
- drawer review รายละเอียดคำขอ (`CertificateRequestReview`)
- approve/reject flow พร้อม certificate number / remarks
- logbook summary preview (ใช้ endpoint admin logbook summary)

### 25.2 API Flow ที่ต้องยึดตาม Legacy

คำร้องขอฝึกงาน:
- `GET /admin/documents` (params: `type=internship`, `status`, `search`, `academicYear`, `semester`, `limit`, `offset`)
- `GET /admin/documents/:documentId` (detail สำหรับ modal)
- `POST /internship/cs-05/:documentId/review` (staff review เอกสาร CS05)
- `POST /internship/acceptance/:documentId/review` (staff review เอกสาร acceptance letter)
- `POST /admin/documents/:documentId/reject` (reject พร้อม `reason`)
- `POST /admin/documents/:documentId/approve` (fallback สำหรับเอกสารประเภทอื่น)
- `GET /admin/documents/:documentId/view` และ `GET /admin/documents/:documentId/download` (preview/download)
- `GET /reports/deadlines/late-submissions` (params: `relatedTo=internship`, `academicYear`, `semester`) สำหรับ badge ส่งช้า
- `GET /reports/internships/academic-years` สำหรับ filter ปีการศึกษา

หนังสือรับรองการฝึกงาน:
- `GET /admin/certificate-requests` (params: `page`, `limit`, `status`, `academicYear`, `semester`)
- `GET /admin/certificate-requests/:requestId/detail`
- `POST /admin/certificate-requests/:requestId/approve` (payload: `certificateNumber`)
- `POST /admin/certificate-requests/:requestId/reject` (payload: `remarks`)
- `GET /admin/certificate-requests/:requestId/download`
- `GET /admin/internships/:internshipId/logbook-summary`
- `GET /reports/internships/academic-years` (shared filter source)

### 25.3 Recommended Next.js Structure

routes:
- `src/app/(app)/admin/documents/internship/page.tsx`
- `src/app/(app)/admin/documents/certificates/page.tsx`

services:
- `src/lib/services/adminInternshipDocumentsService.ts`
- `src/lib/services/adminInternshipCertificatesService.ts`

hooks:
- `src/hooks/useAdminInternshipDocuments.ts`
- `src/hooks/useAdminInternshipCertificates.ts`

shared UI:
- `src/components/admin/documents/internship/*`
- `src/components/admin/documents/certificates/*`

### 25.4 Best Practices (ต้องคงไว้ระหว่างย้าย)

- ใช้ React Query แยก `queryKey` ตามโมดูล + filter + pagination และ invalidate แบบเจาะจง
- แยก mapper/normalizer สำหรับ payload document/certificate เพื่อรองรับ response shape ที่ไม่สม่ำเสมอจาก legacy endpoints
- แยก action mutation ตามชนิดเอกสาร (CS05, acceptance letter, certificate request) เพื่อลด conditional ซ้อนใน component
- คง loading/error/empty state ครบใน table, modal, drawer, และ action buttons
- จำกัด optimistic update เฉพาะเคสปลอดภัย และ refetch server หลัง approve/reject/review ทุกครั้ง
- รักษา role guard เดิม (admin/teacher-support ตาม policy เดิม) และไม่เปิด route ตรงให้ role ที่ไม่เกี่ยวข้อง
- คงข้อความ validation/error ที่ผู้ใช้คุ้นเคยจาก legacy เป็นลำดับแรก ก่อนปรับ copywriting

### 25.5 Migration Sequence (แนะนำ)

1. Internship documents list/filter/pagination + summary chips
2. Internship document detail modal + CS05 preview + file view/download
3. Bulk review/reject flows + late submission badges
4. Certificate requests list/filter + detail drawer + approve/reject
5. Logbook summary preview + parity pass เทียบ legacy + regression check เมนู admin เดิม

### 25.6 Definition of Done (เฟสนี้)

- เมนู admin ใช้งาน route จริงได้ครบ:
  - `/admin/documents/internship`
  - `/admin/documents/certificates`
- API flow ตาม legacy ทำงานครบทั้ง read + review + approve/reject + download
- parity สำคัญครบ:
  - filters/pagination
  - summary chips
  - detail modal/drawer
  - action feedback (success/error/loading)
- ผ่าน lint และไม่กระทบ regression หน้าที่ refactor เสร็จแล้ว (`/admin/users/*`, `/project-pairs`, `/admin/settings/*`, `/admin/upload`)
- มี migration notes เพิ่มใน README ทุกครั้งที่ปิดงานย่อยของ 2 หน้านี้

### 25.7 Implementation Progress (Current)

เสร็จแล้ว:
- สร้าง route ใหม่ใน Next.js:
  - `/admin/documents/internship`
  - `/admin/documents/certificates`
- ต่อ API จริงผ่าน service + hooks แยกโมดูล:
  - documents: list/detail/review/reject/preview/download + late submissions + academic years
  - certificates: list/detail/approve/reject/download
- หน้า internship documents:
  - list/filter/pagination + summary + late badge
  - bulk action (review/reject) และ single action จากตาราง/drawer
  - reject modal แยกเหตุผล (แทน prompt)
- หน้า certificates:
  - list/filter/pagination + drawer detail
  - approve/reject modal (กำหนด certificate number / remarks) + download flow
- ปรับ preview เอกสารให้เปิดแท็บใหม่ (ไม่บังคับดาวน์โหลดทันที)
- ผ่าน lint ล่าสุดใน `frontend-next`

งานถัดไป (parity deepen):
1. เติม detail parity ให้ใกล้ legacy เพิ่ม (CS05 preview block, evaluation breakdown แบบละเอียด) ✅
2. เพิ่มการเชื่อม logbook summary preview สำหรับ certificate review flow ✅
3. เก็บ regression pass เทียบ behavior เดิมทุกสถานะเอกสาร (pending/reviewing/approved/rejected/cancelled)
