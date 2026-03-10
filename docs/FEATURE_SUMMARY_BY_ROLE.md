# สรุป Feature ตาม Role — CSLogbook

## ภาพรวม Roles

| Role | คำอธิบาย |
|---|---|
| **student** | นักศึกษา |
| **teacher:academic** | อาจารย์ (ที่ปรึกษา/ผู้สอน) |
| **teacher:support** | เจ้าหน้าที่ภาควิชา |
| **teacher:position:หัวหน้าภาควิชา** | หัวหน้าภาค (อนุมัติเอกสาร) |
| **admin** | ผู้ดูแลระบบ |

> teacher มี sub-type (`academic`, `support`) และ capability flags (`canAccessTopicExam`, `canExportProject1`)

---

## 1. Student (นักศึกษา)

### Dashboard & ทั่วไป
- Dashboard นักศึกษา (สถานะ, deadline, แบบสำรวจ)
- ปฏิทิน deadline
- ตรวจสอบคุณสมบัติ (internship/project eligibility)

### ระบบฝึกงาน (Internship)
- ลงทะเบียนฝึกงาน (CS05 flow)
- กรอกข้อมูลบริษัท
- บันทึก Logbook/Timesheet รายวัน
- ดูสรุปการฝึกงาน
- ขอหนังสือรับรอง (Certificate)
- ดูสถิติบริษัท

### ระบบปริญญานิพนธ์ (Project)
- **Phase 1**: ส่งหัวข้อ, ร่าง Proposal, สอบหัวข้อ, แก้ไข Proposal
- **Phase 2**: System Test, สอบปากเปล่า (Thesis Defense)
- จัดการ Milestone / Artifact / Track
- บันทึกการประชุม (Meeting Logbook)
- ส่งคำขอสอบ KP02

### อื่นๆ
- ดู/แก้ไขข้อมูลติดต่อตนเอง
- ดู Timeline การดำเนินงาน
- ดูรายชื่ออาจารย์ที่ปรึกษา

---

## 2. Teacher — Academic (อาจารย์)

### Dashboard & ทั่วไป
- Dashboard อาจารย์ (สรุปคิว, สถิติ)
- ปฏิทิน deadline

### คิวอนุมัติ (Queue Management)
- คิวคำขอสอบ Project 1 (KP02) — Advisor Queue
- คิวคำขอสอบ Thesis (KP03) — Advisor Queue
- คิว System Test — Advisor Queue
- อนุมัติ/ปฏิเสธคำขอสอบ (Advisor Decision)

### การประชุม & Logbook
- อนุมัติบันทึกการประชุม (Meeting Approvals)
- อนุมัติ Timesheet ฝึกงาน (Logbook Approve)

### รายงาน
- ดูรายงานทั้งหมด (Overview, Internship, Project, Advisor Load, Workflow, Deadline)

### Feature เพิ่มเติม (ตาม capability)

| Flag | Feature ที่เปิด |
|---|---|
| `canAccessTopicExam` | ดูภาพรวมสอบหัวข้อ (Topic Exam Overview) |
| `canExportProject1` | เข้าคิว Staff Queue ของ Project 1, Export Excel |

---

## 3. Teacher — Position: หัวหน้าภาควิชา

มี feature ทั้งหมดของ teacher:academic **บวก**:

### อนุมัติเอกสาร (Document Approval)
- อนุมัติหนังสือขอฝึกงาน CS05 (Head Queue)
- อนุมัติหนังสือตอบรับ Acceptance Letter (Head Queue)

---

## 4. Teacher — Support / เจ้าหน้าที่ภาค

### Dashboard
- Dashboard Admin (สถิติภาพรวม, workflow overview)

### จัดการผู้ใช้
- จัดการรายชื่อนักศึกษา (CRUD)
- จัดการรายชื่ออาจารย์ (CRUD)
- จัดการคู่โปรเจค (Project Pairs)

### จัดการเอกสาร
- **ฝึกงาน**: ตรวจ CS05, Acceptance Letter (Staff Review), จัดการ Certificate
- **ปริญญานิพนธ์**:
  - บันทึกผลสอบหัวข้อ (Topic Exam Results)
  - คิว KP02 Staff Queue + Verify + กำหนดตารางสอบ
  - บันทึกผลสอบ Project Exam
  - คิว System Test Staff Queue + Decision
  - คิว Thesis Staff Queue + Exam Results

### อัปโหลด & Export
- อัปโหลดรายชื่อนักศึกษา (CSV/Excel bulk import)
- Export ตารางสอบเป็น Excel (KP02 Export)

### รายงาน
- รายงานฝึกงาน (Internship Report)
- รายงานปริญญานิพนธ์ (Project Report)
- (วางแผน) Advisor Workload, Workflow Progress, Deadline Compliance

### ตั้งค่าระบบ
- จัดการหลักสูตร (Curriculum)
- ตั้งค่าปีการศึกษา/ภาคเรียน (Academic Settings)
- ตั้งค่าการแจ้งเตือน (Notification Settings)
- จัดการ Workflow Step Definitions
- จัดการ Important Deadlines
- ดูสถานะ Background Agents

---

## 5. Admin (ผู้ดูแลระบบ)

มี **ทุก feature ของ teacher:support** บวก:

### สิทธิ์เพิ่มเติม
- จัดการ Academic Settings (CRUD เต็มรูปแบบ)
- จัดการ Curriculum (CRUD เต็มรูปแบบ)
- Archive โปรเจค
- ดู Timeline ของนักศึกษาทุกคน (readAll)
- จัดการ Project Transition
- สร้างโปรเจคแบบ Manual
- ยกเลิกฝึกงาน/โปรเจค

---

## 6. Public / Token-based (ไม่ต้อง Login)

| Feature | วิธีเข้าถึง |
|---|---|
| อนุมัติ/ปฏิเสธผ่าน Email | `/approval/email/approve/:token` |
| ประเมินจากผู้ดูแลฝึกงาน (Supervisor) | `/evaluate/:token` |
| ดู Template หนังสือตอบรับ | Acceptance Letter Template endpoint |

---

## สรุปตาราง Feature x Role

| ระบบ/Feature | Student | Teacher (Academic) | หัวหน้าภาค | เจ้าหน้าที่ภาค | Admin |
|---|---|---|---|---|---|
| Dashboard ตาม role | student | teacher | teacher | admin | admin |
| ลงทะเบียนฝึกงาน | Y | - | - | - | - |
| บันทึก Logbook ฝึกงาน | Y | - | - | - | - |
| อนุมัติ Logbook | - | Y | Y | - | - |
| อนุมัติ CS05 (Head) | - | - | Y | - | Y |
| ตรวจ CS05 (Staff) | - | - | - | Y | Y |
| จัดการ Certificate | - | - | - | Y | Y |
| สร้าง/จัดการโปรเจค | Y | - | - | - | - |
| คิวอนุมัติสอบ (Advisor) | - | Y | Y | - | - |
| คิวอนุมัติสอบ (Staff) | - | * | - | Y | Y |
| บันทึกผลสอบ | - | - | - | Y | Y |
| Export Excel ตารางสอบ | - | * | - | Y | Y |
| อนุมัติการประชุม | - | Y | Y | - | - |
| Topic Exam Overview | - | ** | ** | Y | Y |
| อัปโหลด CSV นักศึกษา | - | - | - | Y | Y |
| จัดการผู้ใช้ (CRUD) | - | - | - | Y | Y |
| รายงาน (Reports) | - | Y | Y | Y | Y |
| ตั้งค่าระบบ | - | - | - | Y | Y |
| Notification Settings | - | - | - | Y | Y |
| จัดการ Curriculum | - | - | - | Y | Y |
| ดู Timeline ทุกคน | - | - | - | - | Y |
| Archive โปรเจค | - | - | - | - | Y |

> `*` = ต้องมี flag `canExportProject1`
> `**` = ต้องมี flag `canAccessTopicExam`

---

## Background Agents (ทำงานอัตโนมัติ)

| Agent | หน้าที่ |
|---|---|
| Deadline Reminder | แจ้งเตือน deadline ใกล้ถึง |
| Eligibility Checker/Scheduler | ตรวจคุณสมบัตินักศึกษาอัตโนมัติ |
| Academic Semester Scheduler | อัปเดตปีการศึกษา |
| Project Purge Scheduler | ลบโปรเจคเก่า |
| Document Status Monitor | ติดตามสถานะเอกสาร |
| Logbook Quality Monitor | ตรวจคุณภาพ Logbook |
| Security Monitor | ตรวจ Security audit |
| Project/Internship Monitors | ติดตามสถานะ workflow |

ควบคุมด้วย `ENABLE_AGENTS=true` และ flag แต่ละตัว
