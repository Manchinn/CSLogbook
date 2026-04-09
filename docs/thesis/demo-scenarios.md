# Demo Scenarios สำหรับสอบปริญญานิพนธ์ — CSLogbook
> เตรียมข้อมูลและลำดับขั้นตอนสำหรับ demo ให้กรรมการ

---

## Demo Accounts

| Role | Username | Password | Track | สถานะ |
|------|----------|----------|-------|-------|
| นักศึกษา (ฝึกงาน) | `uat_intern` | `password123` | Internship | มี CS05 approved, logbook 3 สัปดาห์, ประเมิน 85/100 |
| นักศึกษา (โครงงาน) | `uat_proj` | `password123` | Special Project | สอบหัวข้อผ่าน (78.50), พบอาจารย์ 1 ครั้ง |
| นักศึกษา (ปริญญานิพนธ์) | `uat_thesis` | `password123` | Thesis | COMPLETED — สอบผ่านทั้ง 2 ครั้ง (82, 88), พบอาจารย์ 2 ครั้ง |
| อาจารย์ที่ปรึกษา | `uat_advisor` | `password123` | — | queue อนุมัติ, export |
| กรรมการ | `uat_committee` | `password123` | — | ดูข้อมูลโครงงาน |
| เจ้าหน้าที่ | `uat_admin` | `password123` | — | จัดการทุก flow, reports, export |
| **Production (ถ้า demo บน cslogbook.me)** | | | | |
| เจ้าหน้าที่จริง | `natee.p` | `natee.p` | — | ข้อมูล production จริง |
| อาจารย์จริง | `anusorn.w` | `anussorn.w` | — | advisor ของโครงงาน |
| นักศึกษาจริง | — | SSO KMUTNB | — | login ผ่าน SSO |

---

## Demo Flow แนะนำ (เรียงตามลำดับ)

### Part 1: ภาพรวมระบบ (5 นาที)

**Login เป็น `uat_admin`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 1.1 | Dashboard เจ้าหน้าที่ | `/dashboard` | แสดงสถิติรวม, จำนวนนักศึกษา, คำร้องรอดำเนินการ |
| 1.2 | ตั้งค่าหลักสูตร | `/admin/settings/academic` | แสดง tab หลักสูตร + tab กำหนดการ (DeadlineTimeline) |
| 1.3 | Import นักศึกษา | `/admin/settings/students` | Upload Excel, validation, ตรวจรหัสซ้ำ |
| 1.4 | กำหนดปีการศึกษา | `/admin/settings/academic` | dropdown จาก DB (ไม่ hardcode) — อ้างอิงหลักสูตร 2564 |

---

### Part 2: Flow ฝึกงาน — Internship (10 นาที)

**Login เป็น `uat_intern`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 2.1 | ปฏิทินกำหนดการ | `/dashboard` | Timeline + deadlines |
| 2.2 | ยื่นคำร้อง คพ.05 | `/internship/cs05` | กรอกข้อมูลสถานประกอบการ, upload transcript, multi-step form |
| 2.3 | สถานะเอกสาร (approved) | `/internship/documents` | Stepper แสดงสถานะ: คพ.05 ✅ → หนังสือตอบรับ → ส่งตัว |
| 2.4 | Download PDF หนังสือขอความอนุเคราะห์ | `/internship/documents` | **สำคัญ!** แสดง PDF ที่ generate อัตโนมัติ — ตราครุฑ, เลขที่ อว., TH Sarabun New |
| 2.5 | ข้อมูลสถานประกอบการ | `/internship/company-info` | แสดงข้อมูลที่กรอก |
| 2.6 | บันทึกการฝึกงาน (Logbook) | `/internship/logbook` | 3 สัปดาห์ logbook, บันทึกรายวัน, เวลาเข้า-ออก |
| 2.7 | สรุปการฝึกงาน | `/internship/summary` | แสดง % ชั่วโมง, จำนวนวัน, สถานะครบ/ไม่ครบ |

**สลับ Login เป็น `uat_admin`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 2.8 | อนุมัติเอกสารฝึกงาน | `/admin/documents/internship` | ดู queue, อนุมัติ/ปฏิเสธ, bulk actions |
| 2.9 | ออกเลขที่ อว. | `/admin/documents/internship` | กรอกเลขเอกสารราชการ |
| 2.10 | Download PDF หนังสือส่งตัว | — | PDF ที่ 2 — แสดงว่า generate จากข้อมูลเดียวกัน |

**โชว์ Supervisor flow (token-based, ไม่ต้อง login)**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 2.11 | อนุมัติ Logbook ผ่าน email | `/approval/timesheet/[token]` | **สำคัญ!** Supervisor ไม่ต้อง login — คลิก link จาก email, ดู logbook ทั้งหมด, approve/reject |
| 2.12 | ประเมินนักศึกษา | `/evaluate/supervisor/[token]` | **สำคัญ!** 5 หมวด × 4 ข้อ (20 คะแนน/หมวด = 100), คำนวณอัตโนมัติ, pass/fail |

**กลับ `uat_admin`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 2.13 | อนุมัติใบรับรอง | `/admin/documents/certificates` | Bulk approve, ออกเลขใบรับรอง |
| 2.14 | Download PDF ใบรับรองการฝึกงาน | — | PDF ที่ 3 — คะแนนรวม, PASS_SCORE 70, เกณฑ์ผ่าน |

---

### Part 3: Flow โครงงานพิเศษ — Special Project (8 นาที)

**Login เป็น `uat_proj`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 3.1 | เสนอหัวข้อโครงงาน | `/project/phase1/topic-proposal` | Multi-step: ข้อมูลพื้นฐาน → หมวด → สมาชิก → รายละเอียด → สรุป |
| 3.2 | ผลสอบหัวข้อ (PASS 78.50) | `/project/phase1/topic-exam` | แสดงคะแนน, เกณฑ์ผ่าน 70 |
| 3.3 | บันทึกพบอาจารย์ | `/project/phase1/meetings` | ดู record ที่ approved, timestamp, หัวข้อ, สถานะ |
| 3.4 | ยื่นคำร้องขอสอบ (คพ.02) | `/project/phase1/defense-request` | **สำคัญ!** ต้อง ≥4 ครั้งพบอาจารย์ถึง unlock — แสดงเงื่อนไข |

**สลับ `uat_advisor`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 3.5 | Queue อนุมัติอาจารย์ | `/teacher/approval-queue` | ดูคำร้องรออนุมัติ, approve/reject + เหตุผล |
| 3.6 | อนุมัติบันทึกพบอาจารย์ | `/teacher/meetings` | Timeline การพบ, อนุมัติรายครั้ง |

**สลับ `uat_admin`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 3.7 | บันทึกผลสอบหัวข้อ | `/admin/topic-exam/results` | Assign advisor, บันทึกคะแนน |
| 3.8 | ตรวจสอบคำร้อง คพ.02 | `/admin/project1/kp02-queue` | Drawer view, bulk verify, **XLSX export** |

---

### Part 4: Flow ปริญญานิพนธ์ — Thesis (5 นาที)

**Login เป็น `uat_thesis`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 4.1 | สถานะ COMPLETED | `/project/phase2` | แสดง workflow สำเร็จทั้งหมด |
| 4.2 | คำขอทดสอบระบบ | `/project/phase2/system-test` | Upload evidence, advisor → staff approval chain |
| 4.3 | คำขอสอบปริญญานิพนธ์ (คพ.03) | `/project/phase2/thesis-defense` | Multi-layer: student → advisor → staff |
| 4.4 | ผลสอบ + สถานะเล่ม | `/project/phase2/thesis-defense` | คะแนน 88.00, สถานะเล่มสมบูรณ์ |

**สลับ `uat_admin`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 4.5 | บันทึกผลสอบปริญญานิพนธ์ | `/admin/thesis/exam-results` | Drawer 4 sections, คะแนน, อัปเดตสถานะเล่ม |
| 4.6 | ตรวจสอบคำร้อง คพ.03 | `/admin/thesis/staff-queue` | Bulk verify/reject |

---

### Part 5: ฟีเจอร์เด่นเพิ่มเติม (5 นาที)

**ยังคง Login เป็น `uat_admin`**

| # | สิ่งที่โชว์ | หน้า | จุดที่ต้องพูด |
|---|-----------|-----|-------------|
| 5.1 | Reports — Document Pipeline | `/admin/reports/document-pipeline` | สถิติเอกสาร, donut chart, status distribution |
| 5.2 | Reports — รายงานฝึกงาน | `/admin/reports/internship` | KPIs, จำนวนนักศึกษา, คะแนนเฉลี่ย |
| 5.3 | Reports — ภาระงานอาจารย์ | `/admin/reports/advisor-workload` | กระจายงานกรรมการ |
| 5.4 | XLSX Export | (ทุกหน้า admin) | **สำคัญ!** กดปุ่ม export → download Excel, Thai dates พ.ศ. |
| 5.5 | Rejection flow | — | ปฏิเสธคำร้อง → นักศึกษาเห็น modal แจ้งเหตุผล → แก้ไข → ส่งใหม่ |
| 5.6 | Real-time notification | — | Socket.io แจ้งเตือนทันทีเมื่อมีการอนุมัติ/ปฏิเสธ |

---

## คำถามที่กรรมการอาจถาม + คำตอบเตรียมไว้

| คำถาม | คำตอบสั้น |
|-------|---------|
| ทำไมไม่ใช้ Zustand/Redux? | TanStack Query จัดการ server state ได้ดีกว่า — cache, refetch, optimistic update ในตัว ไม่ต้อง boilerplate |
| Security ทำอย่างไร? | JWT + RBAC middleware, IDOR fixed 6 จุด, rate limiter, Joi validation, CORS dynamic origins |
| Thai font ใน PDF ทำอย่างไร? | ใช้ pdfkit + Loma/Loma-Bold font embed ใน Docker image, absolute positioning ตราครุฑ |
| Supervisor ไม่มี account ทำไง? | Token-based — ส่ง link ผ่าน email, ไม่ต้อง login, token มี expiry |
| Deploy อย่างไร? | Docker Compose บน VPS, Nginx reverse proxy, GitHub Actions CI/CD auto-deploy เมื่อ push master |
| ทำไม Next.js 16? | App Router + React 19 (server components), TanStack Query v5, Ant Design — ใช้ stack ล่าสุด |
| รองรับสหกิจไหม? | ยังไม่รองรับ — ปัจจุบันรองรับเฉพาะฝึกงานปกติตามหลักสูตร พ.ศ. 2564 สำหรับปีการศึกษา 2567-2568 |
| Test ทำอย่างไร? | Playwright E2E 160+ tests, backend integration SQLite in-memory, security route-access 40 tests |
| Data migration ทำอย่างไร? | Sequelize migrations 103 ไฟล์, seed scripts สำหรับ dev/UAT, production import guide |
| Workflow state จัดการอย่างไร? | DB ENUM + workflowStates.ts constants + canTransition() — single source of truth ทุก layer |

---

## ลำดับ Demo ที่แนะนำ (ถ้ามีเวลาจำกัด)

### ถ้ามี 10 นาที (เลือก highlights)
1. Admin dashboard + settings (1 นาที)
2. ฝึกงาน: คพ.05 → PDF หนังสือราชการ → Supervisor ประเมิน (4 นาที)
3. โครงงาน: เสนอหัวข้อ → ผลสอบ → พบอาจารย์ → ยื่นสอบ (3 นาที)
4. Reports + XLSX export (2 นาที)

### ถ้ามี 20 นาที (ครบทุก flow)
1. Part 1: ภาพรวม (3 นาที)
2. Part 2: ฝึกงาน full flow (7 นาที)
3. Part 3: โครงงานพิเศษ (5 นาที)
4. Part 4: ปริญญานิพนธ์ (3 นาที)
5. Part 5: ฟีเจอร์เด่น (2 นาที)

### ถ้ามี 30 นาที (ครบ + deep dive)
- ทำทั้ง 5 parts ข้างบน + สาธิต rejection flow, real-time notification, multi-role switching

---

## Pre-demo Checklist

- [ ] ตรวจสอบว่า `cslogbook.me` เข้าถึงได้
- [ ] ตรวจสอบว่า UAT seed data ถูก seed แล้ว (หรือ production มีข้อมูลพร้อม)
- [ ] เตรียม browser 2-3 tabs พร้อม login ไว้ล่วงหน้า (admin, student, advisor)
- [ ] เตรียม incognito window สำหรับ token-based pages (supervisor eval, timesheet)
- [ ] ตรวจสอบ PDF download ทำงานได้ (test download 1 ไฟล์ก่อน)
- [ ] เตรียม XLSX export ทดสอบ 1 ครั้ง
- [ ] ปิด console errors / dev tools (ถ้า demo บน production)
- [ ] เตรียม fallback: ถ้า internet มีปัญหา มี localhost พร้อมรันไหม?
