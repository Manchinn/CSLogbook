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
NEXT_PUBLIC_ENABLE_ADMIN_PROJECT_WORKFLOW_WIDGET=false

# Page rollouts (false = redirect to /app)
NEXT_PUBLIC_ENABLE_PROJECT_PHASE1_PAGE=true
NEXT_PUBLIC_ENABLE_PROJECT_PHASE2_PAGE=false
NEXT_PUBLIC_ENABLE_INTERNSHIP_FLOW_PAGE=true
NEXT_PUBLIC_ENABLE_INTERNSHIP_LOGBOOK_PAGE=false
NEXT_PUBLIC_ENABLE_INTERNSHIP_CERTIFICATE_PAGE=false
NEXT_PUBLIC_ENABLE_DEADLINES_PAGE=false
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
