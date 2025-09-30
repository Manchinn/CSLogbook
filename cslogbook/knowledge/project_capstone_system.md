# ระบบโครงงานพิเศษ / โปรเจคจบ (Draft Initial Spec)

> เวอร์ชัน: 0.1 (Draft)  
> วันที่จัดทำ: 26 Aug 2025  
> ขอบเขต: โครงสร้างแนวคิด เอกสาร ขั้นตอน Timeline และโครงสร้างข้อมูลที่จะพัฒนาต่อยอดจากระบบฝึกงาน (Internship) ภายใน CSLogbook

---
## 1. เป้าหมาย (Objectives)
- รองรับการบริหารกระบวนการ "โครงงานพิเศษ 1" และ "ปริญญานิพนธ์" (Thesis) ตั้งแต่การยื่นหัวข้อ → สอบหัวข้อ → ปรับปรุง → สอบโครงงานพิเศษ 1 → ขอสอบ 30 วัน → ยื่นสอบปริญญานิพนธ์ → สอบ → แก้ไขเนื้อหา → แก้ไขรูปเล่ม → ปิดงาน
- ใช้แนวคิด Workflow + State Machine คล้ายโมดูลฝึกงาน เพื่อลดการซ้ำซ้อนของโค้ด (reuse: timeline, approval, notification, pdf generation)
- มีระบบจัดเก็บ/เวอร์ชันเอกสารฟอร์ม (คพ.01, คพ.02, คพ.03, ใบตรวจต่างๆ) และหลักฐานการอนุมัติ (advisor approvals)
- Tracking สถานะชัดเจน + แจ้งเตือนผู้เกี่ยวข้อง (Advisor, Student, Staff)
- ป้องกันการข้ามขั้น (Validation ตาม State + Required Approvals + Deadline windows)

---

## 1.1 ลำดับขั้นตอนโครงงานพิเศษ (ภาพรวมตั้งแต่ Proposal ถึงปิดงาน)
> สรุปรวมจาก state machine ในเอกสารนี้ (Section 3) และรายละเอียดใน Section 4 เพื่อให้ง่ายต่อการอ้างอิงระหว่างทีมพัฒนา/ผู้ใช้งาน

| ลำดับ | เฟส / สถานะหลัก | คำอธิบายย่อ | เอกสาร / ผู้อนุมัติหลัก | เงื่อนไข/หมายเหตุ |
|-------|-------------------|-------------|---------------------------|-------------------|
| 0 | ตรวจคุณสมบัติ (Eligibility) | ระบบตรวจ snapshot หน่วยกิตและเงื่อนไขอื่นก่อนเปิดให้สร้างโครงงาน |  –  | ถ้าไม่ผ่านจะปิดปุ่มเริ่ม workflow (ดู Section 2) |
| 1 | ยื่นข้อเสนอ KP01 | นักศึกษาอัปโหลด KP01 + เมทาดาตา | Advisor ทั้งหมดต้องอนุมัติ | เปิดเฉพาะผู้ผ่านเกณฑ์ในช่วงเวลาที่กำหนด |
| 2 | Proposal Approved | ที่ปรึกษาอนุมัติครบ ระบบ lock KP01 | ระบบอัตโนมัติ | เป็นเงื่อนไขให้เจ้าหน้าที่นัดสอบ |
| 3 | นัดสอบหัวข้อ | เจ้าหน้าที่ตั้งวัน/เวลา/ห้องสอบข้อเสนอ | – | ต้องอยู่ใน window ตามปฏิทิน |
| 4 | สอบข้อเสนอ (Proposal Defended) | คณะกรรมการบันทึกผลสอบ | ประธานสอบ | หากมีเงื่อนไขต้องแก้ จะต้องทำขั้นถัดไป |
| 5 | ส่งปรับปรุง Scope | นักศึกษาส่งเอกสารปรับ scope | Advisor อนุมัติ | ข้ามได้ถ้าไม่มีเงื่อนไขจากข้อ 4 |
| 6 | Scope Approved | ที่ปรึกษาอนุมัติ scope ใหม่ ระบบ lock | ระบบอัตโนมัติ | เป็นสัญญาณว่าสามารถเดินหน้าพัฒนา |
| 7 | ส่งคำขอสอบโครงงานพิเศษ 1 (KP02 – Project1) | นักศึกษาแจ้งความพร้อมพร้อมยืนยัน readiness เช็ค | Advisor (และ staff หากกำหนด) | ต้องผ่าน checklist (สมาชิกครบ, advisor พร้อม ฯลฯ) |
| 8 | นัดสอบโครงงานพิเศษ 1 | เจ้าหน้าที่ตั้งตารางสอบ | – | – |
| 9 | สอบโครงงานพิเศษ 1 | คณะกรรมการบันทึกผล | ประธานสอบ | ถ้าต้องแก้ scope หลังสอบ ให้ไปขั้น 10 |
| 10 | ปรับปรุง Scope หลังสอบ (ถ้ามี) | ส่งเอกสารปรับ scope หลังสอบ Project1 | Advisor อนุมัติ | มีเฉพาะกรณีกรรมการกำหนด |
| 11 | ส่งคำขอล่วงหน้า 30 วัน (30-Day Request) | นักศึกษากำหนดวันสอบปริญญานิพนธ์ที่ตั้งใจ พร้อมขออนุมัติ | Advisor ยืนยัน (acknowledge) | ระบบต้องตรวจส่วนต่าง ≥ 30 วัน |
| 12 | ส่ง KP02 สำหรับสอบปริญญานิพนธ์ | ยื่นฟอร์ม KP02 รอบ Thesis พร้อมไฟล์ประกอบ | Advisor + Staff ตรวจความพร้อม | เปิดได้เมื่อครบ 30 วันจากข้อ 11 และผ่านทุกเงื่อนไข |
| 13 | นัดสอบปริญญานิพนธ์ | เจ้าหน้าที่ตั้งวันสอบ Thesis | – | – |
| 14 | สอบปริญญานิพนธ์ | คณะกรรมการบันทึกผล (Pass/Minor/Major/Fail) | ประธานสอบ | ถ้าต้องแก้ไข → ดำเนินข้อ 15, 16 |
| 15 | แก้ไขเนื้อหา (Content Corrections) | ส่งไฟล์เนื้อหาแก้ + ใบรับรองที่ปรึกษา | Advisor อนุมัติ | ต้องอยู่ในกำหนด N วันตาม config |
| 16 | แก้ไขรูปเล่ม (Formatting Corrections) | ส่งไฟล์รูปเล่มขั้นสุดท้าย + ใบรับรองเจ้าหน้าที่ | เจ้าหน้าที่/Staff อนุมัติ | ต้องอยู่ในกำหนด M วันต่อจากข้อ 15 |
| 17 | ปิดโครงงาน (Completed/Archived) | ระบบเปลี่ยนสถานะสุดท้าย เก็บ snapshot | ระบบอัตโนมัติ (หรือ Staff กด) | เงื่อนไขคือทุกขั้นผ่าน/อนุมัติครบ |

> หมายเหตุ (Sep 2025): หน้า Phase 1 Dashboard ของนักศึกษาไม่มีการ์ด "แก้ไขข้อเสนอ" อีกต่อไป การปรับขอบเขต/วัตถุประสงค์หลังสอบใช้ workflow บันทึกการพบอาจารย์แทน เพื่อให้บันทึกเหตุผลและมติที่ปรึกษาอยู่ในจุดเดียวกัน.

หมายเหตุ: ลำดับนี้สามารถ mapping กลับไปยัง state diagram (Section 3) ได้โดย 1→7 อยู่ใน Proposal/Project1 Phase, 11→17 อยู่ใน Thesis Phase. |

## 2. คุณสมบัติ/เกณฑ์ความพร้อม (Eligibility Rules)
สำหรับหลักสูตรปี 2564 (configurable):
- หน่วยกิตรวม (รวมทุกวิชา) >= 95
- หน่วยกิตภาควิชาฯ (รหัส 040613xxx / 0406xxxx ที่ระบุ) >= 57
- ชั้นปี >= 4 (หรือผ่านเกณฑ์ที่กำหนด)  
ระบบจะ snapshot หน่วยกิต ณ เวลายื่นข้อเสนอโครงงาน (เก็บเป็น `EligibilityRecord`)

หากไม่ผ่านเกณฑ์: ปิดปุ่ม/ไม่ให้เริ่ม workflow และแสดงข้อความเกณฑ์ที่ขาด

## 3. ภาพรวม State Machine (High-Level Workflow)
(Proposal Phase -> Project1 Phase -> Thesis Phase -> Completion)

```mermaid
graph TD
  A[Eligible] --> B[Submit KP01 (คพ.01) Draft]
  B -->|Advisor Approvals All| C[Proposal Approved]
  C --> D[Schedule Proposal Defense]
  D --> E[Proposal Defended]
  E --> F[Submit Revised Proposal Scope]
  F -->|Advisor Approvals| G[Scope Approved]
  G --> H[Submit KP02 (Project1 Defense Request)]
  H --> I[Project1 Defense Scheduled]
  I --> J[Project1 Defended]
  J --> K[Submit Scope Revision (If required)]
  K --> L[Scope Revision Approved]
  J --> L
  L --> M[Submit 30-Day Thesis Test Request]
  M -->|>=30 days wait| N[Submit Thesis Defense (KP02)]
  N --> O[Thesis Defense Scheduled]
  O --> P[Thesis Defended]
  P --> Q[Content Corrections Approved]
  Q --> R[Formatting Corrections Approved]
  R --> S[Completed / Archived]
```

หมายเหตุ: บางเส้นทาง (เช่น ไม่ต้องแก้ขอบเขต) สามารถข้าม `K`/`L`. การใช้ KP02 ซ้ำใน 2 จุด (สอบโครงงานพิเศษ 1 และ สอบปริญญานิพนธ์) แยกโดย field `defenseType`.

## 4. ขั้นตอนละเอียด (Detailed Steps)
ตารางสรุป (ย่อ) แต่ละขั้นประกอบด้วย: State/Action | Trigger/Input | Approvals | Outputs | Deadline/Rule

| # | State/Action | Trigger/Input | Approvals | Output/Artifact | Validation / Deadline |
|---|--------------|---------------|-----------|-----------------|----------------------|
| 1 | Submit KP01 | Upload KP01.pdf + meta | Advisors (all) | KP01 Version 1 | เปิดเฉพาะผู้ผ่านเกณฑ์ |
| 2 | Proposal Approved | All advisors approve | System auto | Lock KP01 | ภายใน window ภาคเรียน |
| 3 | Schedule Proposal Defense | Staff set date/time/room | - | Defense Event | ต้องหลัง Approved |
| 4 | Proposal Defended | Committee record result | Committee Chair | Result record | ถ้า Conditional → ต้องส่ง revision |
| 5 | Submit Revised Proposal Scope | Upload scope revision | Advisors (all) | Scope v2 | ก่อน deadline revision |
| 6 | Scope Approved | Advisors approve | System | Lock scope | - |
| 7 | KP02 (Project1 Defense Request) | Student fills form + confirm readiness | Advisors (auto require prior approvals) | KP02 record | ต้องห่างจาก start >= X weeks (config) |
| 8 | Project1 Defense Scheduled | Staff schedule | - | Event | - |
| 9 | Project1 Defended | Committee inputs result | Chair | Result record | - |
| 10 | Scope Revision (if required) | Upload revised scope | Advisors | Scope v3+ | Only if committee requested |
| 11 | 30-Day Thesis Request | Submit form; store intended defense date | Advisors (ack) | Countdown start | Defense date >= +30 days |
| 12 | Thesis Defense Request (KP02) | Student fills again (defenseType=THESIS) | Advisors + Staff pre-check | KP02(THESIS) | หลังครบ 30 วัน + all conditions |
| 13 | Thesis Defense Scheduled | Staff schedule | - | Event | - |
| 14 | Thesis Defended | Committee inputs result (Pass / Minor / Major) | Chair | DefenseResult | - |
| 15 | Content Corrections | Upload corrected full thesis + approval sheet | Advisors all | Correction Approval | ภายใน N วัน (config) |
| 16 | Formatting Corrections | Upload final PDF + form signed staff | Dept Staff | Formatting Approval | ภายใน M วัน ต่อจากข้อ 15 |
| 17 | Completed | System transition | - | Archive snapshot | ทั้งหมด Approved |

### 4.1 Project1 Defense Request Flow (อัปเดต Sep 2025)

ตารางนี้ไล่ขั้นตอนการ “ขอสอบโครงงานพิเศษ 1 (คพ.02)” ตาม flow ที่ใช้งานจริง พร้อม mapping ไปยังบริการในระบบ

| ลำดับ | ผู้ปฏิบัติ / ผู้เกี่ยวข้องหลัก | รายละเอียดธุรกรรม | การทำงานในระบบ / Endpoint | ผลลัพธ์ | หมายเหตุ |
|-------|-------------------------------|---------------------|-----------------------------|---------|---------|
| 1 | นักศึกษา (หัวหน้าโครงงาน) + สมาชิก | กรอกข้อมูล คพ.02, ช่องทางติดต่อ และ snapshot โครงงาน เพื่อเตรียมส่งให้อาจารย์ลงนาม | หน้าจอ `ExamSubmitPage` → `POST /api/projects/:id/kp02` (`projectService.submitProject1DefenseRequest`) เก็บ `formPayload` และตรวจเกณฑ์บันทึกการพบผ่าน `projectDefenseRequestService` | เกิด `ProjectDefenseRequest` สถานะ `submitted` พร้อม snapshot สมาชิก/ที่ปรึกษา | ยังต้องแนบแบบฟอร์มที่มีลายเซ็นอาจารย์จริง (อัปโหลด/แนบภายนอกอยู่ในแผน PDF automation) |
| 2 | อาจารย์ที่ปรึกษา/ร่วม และเจ้าหน้าที่ภาควิชา | ตรวจสอบลายเซ็นในเอกสารจริง + ตรวจ logbook ตามเกณฑ์ก่อนรับคำขอ | ระบบคำนวณ metric จาก `projectDocumentService.buildProjectMeetingMetrics` เพื่อช่วยให้เจ้าหน้าที่เห็นจำนวนบันทึกที่อนุมัติ; ขั้นอนุมัติตัวเอกสารยังเป็น Manual (เจ้าหน้าที่ตรวจจากไฟล์ที่นักศึกษาส่ง) | ยืนยันว่าเอกสารครบและทีมผ่านเกณฑ์ พร้อมให้เข้าสู่ขั้นนัดสอบ | จะเพิ่ม UI แชร์ไฟล์/ตราประทับอนุมัติใน Iteration ถัดไป |
| 3 | เจ้าหน้าที่ภาควิชา + อาจารย์ผู้จัดตารางสอบ | นัดวัน/เวลา/สถานที่สอบ และจัดสรรห้องสอบผ่านปฏิทินภาควิชา (ไม่บันทึกข้อมูลซ้ำใน CSLogbook) | หน้า `Project1DefenseSchedulePage` ใช้เพื่อตรวจสอบสถานะคำขอ/ข้อมูลติดต่อเท่านั้น; การนัดสอบจริงดำเนินผ่านปฏิทิน + ไฟล์ภายนอก (ปุ่มส่งออกยังใช้ service เดิม) | คำขออยู่สถานะ `staff_verified` (หรือ `scheduled` สำหรับข้อมูลเก่า), Timeline “PROJECT1_DEFENSE_SCHEDULED” ถือว่าเสร็จเมื่อเจ้าหน้าที่ตรวจสอบแล้ว | การซิงก์เวลาจากปฏิทินอยู่ใน Backlog; ผู้ใช้ต้องแจ้งทีมโครงงานจากปฏิทินเอง |
| 4 | คณะกรรมการสอบ + เจ้าหน้าที่ภาควิชา | จัดสอบและบันทึกผล (ผ่าน/ไม่ผ่าน + เหตุผล) | Endpoint `POST /api/projects/:id/exam-result` (controller `topicExamResultController.recordResult`) เรียก `projectDocumentService.setExamResult` เปลี่ยนสถานะโครงงาน และถ้า “ไม่ผ่าน” เตรียม workflow ให้กดรับทราบ | ผลสอบถูกบันทึก, ถ้าผ่าน → โครงงานยังอยู่สถานะ `in_progress` พร้อมเข้าสู่ Phase ต่อไป, ถ้าไม่ผ่าน → ระบบรอให้นักศึกษากด acknowledge ก่อน archive | UI สำหรับบันทึกผล Project1 จะ reuse modal จาก flow ผลสอบหัวข้อ (กำลังปรับปรุงให้สอดคล้องกับเอกสารคพ.02) |
| 5 | นักศึกษา + ระบบอัตโนมัติ | หลังผลสอบผ่าน → เดินหน้าสู่ Phase 2 (โครงงานพิเศษ 2 / ปริญญานิพนธ์). ถ้าไม่ผ่านต้องรับทราบและยื่นใหม่ | `projectDocumentService.syncProjectWorkflowState` อัปเดต `StudentWorkflowActivity` → unlock ขั้น “PROJECT1_DEFENSE_RESULT”; หากไม่ผ่านใช้ `PATCH /api/projects/:id/exam-result/ack` เพื่อ archive | สถานะ workflow ถูกอัปเดต และหน้า Dashboard นักศึกษาจะเปิดทางให้เริ่ม Phase 2 | ระบบจะรีเฟรช readiness cards อัตโนมัติ; ส่วน PDF KP02 เวอร์ชันปริญญานิพนธ์จะแยกด้วย `defenseType=THESIS` ใน flow ถัดไป |

> Note: ฟีเจอร์ Export รายชื่อโครงงานที่ผ่านเกณฑ์สอบ (Excel) วางไว้ใน Iteration ต่อไป โดย reuse service `useTopicExamOverview` และเสริม endpoint `/api/projects/project1/export` (อยู่ใน Backlog)

## 5. ประเภทเอกสาร (Document Types & Versioning)
Key:
- Scope Revision (**post** defense) - versioned separate category
- KP02 (defense request) - two logical instances: PROJECT1, THESIS
- ThesisCh1-3 set (ก่อน Project1 Defense) - optional upload to track progress
- ThesisFull (หลัง Project1, สำหรับ Thesis Defense)
- Correction Sheets: ContentApproval (signed advisors), FormattingApproval (signed staff)
- 30DayRequest (metadata: intendedDefenseDate, submitDate)
- DefenseResult (score, decision, notes, requiredRevisionsType)

Metadata Common Fields: `projectId, docType, version, filePath, uploadedBy, uploadedAt, status(PENDING/APPROVED/REJECTED/LOCKED), hash, remarks`

## 6. บทบาทและสิทธิ์ (Roles & Permissions Matrix - ย่อ)
| Role | Actions |
|------|---------|
| Student | Create/Update proposal before approval, submit KP02, upload revisions, view statuses, download templates |
| Advisor | Approve KP01, scope revisions, ack 30-day request, approve content corrections, view logs |
| Committee (Defense) | Record defense result (only assigned) |
| Staff (Dept) | Verify KP02, ประสานตารางสอบผ่านปฏิทินภาควิชา, verify formatting, close project, override deadlines (with log) |
| Admin | Configure deadlines windows, manage templates, force state change (with audit) |

Reuse จากระบบฝึกงาน: Auth roles + approval modal + timeline component + PDF generator (เทมเพลตใหม่)

## 7. Template Timeline (Semester Based)
> หมายเหตุ: ใช้เป็นค่า default ในตาราง deadline (config table: `project_semester_windows`)

### Semester 1 (ตัวอย่าง generic – ปรับตามประกาศจริง)
- Weeks 1-2: KP01 Submission Window
- Week 3: Proposal Defense Scheduling
- Week 4: Proposal Defenses
- Weeks 5-6: Scope Revision & Approval
- Weeks 7-12: Project Development (progress monitoring optional)
- Week 13: Project1 Defense Request (KP02) deadline
- Week 14: Project1 Defense
- Week 15: Scope Revision (if required)
- Between Week 15 -> Next Sem Week 4: 30-Day Thesis Request may start any time once ready

### Semester 2 Start (สำหรับ cohort ที่เริ่ม Sem1)
- Week 1: Earliest 30-Day Request submit (if not yet)
- >=30 days later: Thesis Defense Request (KP02)
- Thesis Defense (target Week 8-10)
- Content Corrections Deadline: +7..14 days (config N)
- Formatting Corrections Deadline: +M days หลัง content approved

### Students starting in Semester 2
- Use same pattern shifted; still maintain minimum intervals (e.g., require at least 12 teaching weeks before Project1 Defense). Provide compressed config if approved by admin.

### Summer Term
- Optional finishing period (accept corrections / scheduling overflow). No new proposals (config flag `allowSummerStart=false`).

## 8. โครงสร้างข้อมูลร่าง (Data Model Draft)
(ชื่อ Sequelize Models ที่คาดไว้)

- Project (id, studentId(s), titleTH, titleEN, status, startSemester, startAcademicYear, cohortYear, createdAt,...)
- ProjectAdvisor (id, projectId, advisorId, role[MAIN|CO], approveStatus, approveAt)
- ProjectDocument (id, projectId, docType, version, filePath, status, remarks, uploadedBy, uploadedAt, hash)
- EligibilityRecord (id, projectId, totalCredits, majorCredits, isEligible, checkedAt)
- Defense (id, projectId, type[PROPOSAL|PROJECT1|THESIS], scheduledAt, room, committeeChairId, status[SCHEDULED|DONE|CANCELLED])
- DefenseCommittee (id, defenseId, lecturerId, role[CHAIR|MEMBER|SECRETARY])
- DefenseResult (id, defenseId, decision[PASS|CONDITIONAL|MAJOR|MINOR|FAIL], score, notes, recordedBy, recordedAt)
- Correction (id, projectId, type[CONTENT|FORMAT], filePath, approvedByRole, status, submittedAt, approvedAt)
- ThirtyDayRequest (id, projectId, submitDate, intendedDefenseDate, advisorAckAll, status)
- TimelineEvent (reuse) + Notification (reuse)

Indices: (projectId + docType + version), (defenseId, type), (projectId, status)

## 9. API Draft (Prefix `/api/capstone`) – ตัวอย่าง
| Method | Path | Purpose |
|--------|------|---------|
| GET | /projects/my | รายการโปรเจคของผู้ใช้ |
| POST | /projects | สร้างโปรเจค (ตรวจ eligibility) |
| GET | /projects/:id | รายละเอียด |
| POST | /projects/:id/documents | อัปโหลดเอกสาร (type) |
| POST | /projects/:id/submit-kp01 | Shortcut wrap create KP01 + mark submit |
| POST | /projects/:id/advisors/:advisorId/approve | ที่ปรึกษาอนุมัติ |
| POST | /projects/:id/defenses | สร้างการสอบ (staff) |
| POST | /defenses/:id/result | บันทึกผล |
| POST | /projects/:id/kp02 | ยื่น KP02 (ป้อน defenseType) |
| POST | /projects/:id/scope-revision | อัปโหลด scope revision |
| POST | /projects/:id/30day-request | ส่งคำขอ 30 วัน |
| POST | /projects/:id/corrections | ส่งไฟล์แก้ไข (content/format) |
| GET | /projects/:id/timeline | ดู event/state |
| PATCH | /projects/:id/status | แอดมิน override |

(จะต้องเพิ่ม middleware ตรวจ role + state guard service)

## 10. Validation & Business Rules (สำคัญ)
- KP01 ต้องมี advisor ครบทุกคน approve ก่อน schedule proposal defense
- 30-Day Request: `intendedDefenseDate - submitDate >= 30 วัน`
- Thesis Defense Request: ต้องมี Project1 Defended + (ถ้ามี) scope revision approved + 30DayRequest.status=APPROVED
- Corrections deadlines: ขึ้นกับ config (เก็บในตาราง `capstone_config` เช่น `content_correction_days=14`, `format_correction_days=7`)
- ทุก approval / state change log ลง `ProjectAuditLog` (สามารถ reuse logging util)

## 11. Notification Hooks (Draft)
| Event | Recipients | Message |
|-------|------------|---------|
| KP01 Submitted | Advisors | รออนุมัติข้อเสนอ |
| KP01 Approved | Student | พร้อมนัดสอบหัวข้อ |
| Defense Scheduled | Student, Committee | แจ้งวันเวลา |
| Defense Result Recorded | Student, Advisors | ผลสอบ |
| Revision Required | Student | แนบเงื่อนไข |
| 30Day Request Acknowledged | Student | เริ่มนับถอยหลัง |
| Correction Deadlines Approaching | Student | เตือนก่อน 3 วัน |
| Project Completed | Student, Advisors | ปิดโปรเจคสำเร็จ |

## 12. การ Reuse จากระบบฝึกงาน
- Component: Timeline, Status Tag, PDF generator (สร้างเทมเพลตใหม่สำหรับ KP01, KP02, ใบตรวจ)
- Service patterns: controller -> service -> model เหมือนเดิม
- Middleware: auth, role, rate limiter
- Upload handling: reuse Multer config (เพิ่มหมวด `capstone/`)

## 13. Backlog (MVP -> Increment)
### MVP (Iteration 1)
- สร้าง models หลัก: Project, ProjectAdvisor, ProjectDocument, Defense, DefenseCommittee, DefenseResult, EligibilityRecord
- Endpoint: create project, submit KP01, advisor approve, schedule + record proposal defense, scope revision + approval
- Frontend: หน้ารายการโครงงาน, หน้ารายละเอียด + แท็บ Documents, Approvals, Timeline

### Iteration 2
- ✅ (Oct 2025) Project1 Defense scheduling flow: backend service + support staff UI ผ่านเมนู `จัดการเอกสาร > เอกสารโครงงานพิเศษ > นัดสอบโครงงานพิเศษ 1`
- Project1 Defense notifications + committee assignment wizard

### Iteration 3
- 30-Day Request, Thesis Defense, Corrections flows, Deadline config UI

### Iteration 4
- PDF generation (KP01/KP02 forms auto-fill), Export reports, Audit log viewer

### Iteration 5
- Dashboard metrics (progress charts), Role-based reminders, Permission fine-tune

## 14. ความเสี่ยง & แนวทางลดความเสี่ยง
| ความเสี่ยง | ผลกระทบ | Mitigation |
|------------|----------|------------|
| ซ้ำซ้อนโค้ด workflow | Maintain ยาก | ออกแบบ generic state helper/reuse timeline service |
| Deadline เปลี่ยนทุกปี | ต้อง deploy ใหม่ | เก็บใน DB + Admin UI สำหรับ config |
| เอกสารหลายเวอร์ชัน | สับสน | ใช้ naming pattern และ lock หลัง approved |
| Advisor ไม่ approve ทัน | ค้างงาน | Notification + escalation (staff view รายการค้าง) |
| ข้อมูลเครดิตไม่ sync | Eligibility ผิด | มีปุ่ม manual re-check + audit stamp |

## 15. Glossary (ย่อ)
- KP01: แบบฟอร์มข้อเสนอโครงงานพิเศษ
- KP02: แบบฟอร์มยื่นสอบ (ใช้ทั้ง Project1 & Thesis)
- 30-Day Request: คำขอแจ้งสอบปริญญานิพนธ์ล่วงหน้า 30 วัน
- Defense: กิจกรรมการสอบ (Proposal / Project1 / Thesis)

## 16. ภาคผนวก (Mapping กับขั้นตอนผู้ใช้เดิม)

| ขั้นตอนผู้ใช้ (ที่ให้มา) | Mapping State / Action ในระบบ |
|--------------------------|---------------------------------|
| ยื่นสอบหัวข้อโครงงานพิเศษ (แนบ คพ.01) | Submit KP01 |
| สอบหัวข้อ | Proposal Defense (Defense type=PROPOSAL) |
| ปรับปรุงเอกสารข้อเสนอโครงงานพิเศษ | Submit Revised Proposal Scope |
| ยื่นสอบโครงงานพิเศษ 1 (คพ.02 + ส่งบท 1-3) | KP02 defenseType=PROJECT1 + Upload ThesisCh1-3 docs |
| วันสอบโครงงานพิเศษ 1 | Project1 Defense |
| ส่งปรับปรุงขอบเขต (ถ้ามี) | Scope Revision (post Project1) |
| ยื่นเอกสารขอทดสอบโครงงาน 30 วัน | 30-Day Request |
| ยื่นสอบปริญญานิพนธ์ (คพ.02 + เล่มสมบูรณ์) | KP02 defenseType=THESIS + ThesisFull doc |
| วันสอบปริญญานิพนธ์ | Thesis Defense |
| แก้ไขเล่มเนื้อหา | Content Corrections |
| แก้ไขรูปเล่ม | Formatting Corrections |

---
## 17. Next Actions (ทันทีหลังอนุมัติสเปค)
1. Review & adjust state names + docType enum ให้ตายตัว
2. Generate Sequelize migration draft
3. Scaffold backend routes + empty controllers (`capstoneProjectController.js` etc.)
4. Frontend: สร้างเมนู Capstone + Page layout reuse Internship design
5. กำหนด template storage path `/uploads/capstone/` + PDF template placeholders

---
> Draft นี้เปิดเพื่อ feedback: โปรดเสนอแก้ไข naming, state เพิ่ม/ลด และกติกาเวลาที่แตกต่างในภาคเรียนจริง

---

## ภาคเอกสารรายงาน (Executive / Narrative Documentation)
ส่วนนี้เป็นคำอธิบายไม่ลงโค้ด เพื่อใช้ประกอบเสนออนุมัติ/ชี้แจงต่อผู้บริหารและผู้มีส่วนได้ส่วนเสีย

### 1. บทนำ
โครงงานพิเศษและปริญญานิพนธ์เป็น capstone ที่สะท้อนสมรรถนะสุดท้ายของนักศึกษา กระบวนการเดิมกระจัดกระจาย (ไฟล์อีเมล/ไลน์/เอกสารกระดาษ) ทำให้ติดตามยาก ข้อมูลซ้ำ และเกิดความเสี่ยงต่อ deadline ระบบใหม่นี้รวบศูนย์ทุกขั้นตอนและเพิ่มความโปร่งใส

### 2. ปัญหาปัจจุบัน (Pain Points)
1) สถานะการอนุมัติไม่ชัด ต้องสอบถามด้วยตนเอง  2) เวอร์ชันเอกสารสับสน  3) การนับระยะเวลา (เช่น 30 วัน) ทำแบบ manual  4) ไม่มีสถิติวิเคราะห์ภาระงานที่ปรึกษา/คณะกรรมการ  5) ความเสี่ยง deadline หลุดเพราะไม่มีระบบเตือน

### 3. เป้าหมายเชิงคุณค่า (Value Goals)
- ลดเวลาเฉลี่ยตั้งแต่ยื่นข้อเสนอถึงสอบหัวข้อ
- ลดจำนวนรอบการแก้ไขซ้ำโดยเน้น feedback ชัดเจน versioned
- เพิ่มความโปร่งใสและตรวจสอบย้อนหลังได้ (audit trail)
- รองรับการวิเคราะห์เชิงข้อมูลเพื่อปรับปรุงการจัดตารางสอบและภาระงาน

### 4. ขอบเขต (Scope)
ครอบคลุมตั้งแต่ตรวจ eligibility → ยื่น KP01 → อนุมัติ → สอบข้อเสนอ → แก้ scope → ยื่น/สอบ Project1 → คำขอล่วงหน้า 30 วัน → ยื่น/สอบ Thesis → แก้เนื้อหา → แก้รูปเล่ม → ปิดโครงการ (Archive + Metrics) ไม่ครอบคลุมการจัดเก็บโค้ดซอร์สหรือระบบประเมินผลวิชาอื่นโดยตรง

### 5. ผู้มีส่วนได้ส่วนเสีย (Stakeholders)
Student / Advisor / Committee / Dept Staff / Program Admin / Management (สำหรับรายงานรวม)

### 6. ภาพเล่า (Narrative Flow)
นักศึกษาที่ผ่านเกณฑ์กดสร้างโปรเจค อัปโหลด KP01 ระบบแจ้งที่ปรึกษาอนุมัติครบแล้วนัดสอบหัวข้อ หลังสอบถ้ามีเงื่อนไขต้องแก้ จะบังคับส่ง scope revision ก่อนขยับสเตตัสพัฒนา ต่อมาเมื่อพร้อมจะสอบ Project1 นักศึกษายื่น KP02 ครั้งแรก สอบและ (ถ้ามี) แก้ขอบเขต จากนั้นส่งคำขอ 30 วัน ระบบนับถอยหลังและปลดล็อกการยื่น KP02 (Thesis) เมื่อครบเงื่อนไข สุดท้ายหลังสอบ Thesis จะมีรอบแก้เนื้อหา และรอบแก้รูปเล่ม ก่อนปิดงาน

### 7. คุณสมบัติเด่น (Key Features)
- Unified Timeline และ State Tag
- Versioned Documents พร้อม lock หลังอนุมัติ
- Multi-Advisor unanimous approval (หรือ future config: majority)
- Auto deadline & countdown (30 วัน, corrections window)
- Notifications + Escalation (รายการค้างใน dashboard เจ้าหน้าที่)
- KPI Dashboard (เวลาจาก state-to-state, อัตราแก้ไข)

### 8. ข้อกำหนดหน้าที่ (Functional Highlights)
- แสดงสิ่งที่ต้องทำถัดไป (Next Required Action) บนหน้ารายละเอียดโครงการ
- ป้องกันการ upload ซ้ำประเภทเดิมเมื่อถูก lock
- รองรับหลายไฟล์ประกอบ (บทที่ 1–3 / เล่มเต็ม) โดยผูก docType
- กำหนด/ปรับ window ภาคเรียนได้จาก UI (ไม่ต้องแก้โค้ด)
- Export รายงาน (CSV/PDF) สำหรับฝ่ายวิชาการ (ระยะถัดไป)

### 9. ข้อกำหนดไม่ใช่หน้าที่ (Non-Functional Highlights)
ความถูกต้อง (integrity), Auditability, Usability (reuse pattern ของอินเทิร์น), Scalability (หลายหลักสูตร), Performance พื้นฐาน (<2s list load สำหรับ 200 โปรเจค) และ Fault tolerance ด้านเอกสาร (checksum + backup)

### 10. KPI เสนอวัดผล
Average Proposal Approval Time, Proposal Revision Rate, Project1 Defense Wait Time, Thesis 30-Day Compliance (สัดส่วนยื่น >=30 วันจริง), Content Correction On-Time %, Formatting Correction On-Time %, User Satisfaction Survey Score

### 11. Roadmap สรุป
เฟส 1 (MVP): Proposal & Scope  → เฟส 2: Project1 Defense + แจ้งเตือนพื้นฐาน → เฟส 3: Thesis & Corrections → เฟส 4: PDF Auto & Analytics เบื้องต้น → เฟส 5: Advanced Dashboard & Optimization

### 12. ความเสี่ยงและแผนบรรเทา (Narrative)
Adoption ต่ำ: ทำคู่มือ/อบรมสั้น + In-app hint  | Deadline เปลี่ยนบ่อย: เก็บ config ใน DB | Approvals ล่าช้า: ตั้งรายการค้างและอีเมลเตือน | เวอร์ชันสับสน: ใช้ naming + lock + badge เวอร์ชันล่าสุด

### 13. ผลลัพธ์ที่คาดหวัง
กระบวนการลดการสื่อสารซ้ำ เพิ่มความเร็วการตัดสินใจ เพิ่มคุณภาพข้อมูล และรองรับการวิเคราะห์เชิงกลยุทธ์สำหรับปรับปรุงหลักสูตร

### 14. สรุปย่อสำหรับผู้บริหาร
การลงทุนพัฒนาระบบนี้ใช้รากฐานโค้ดที่มี (ลดต้นทุน) แต่เพิ่มความสามารถในการจัดการ Capstone แบบครบวงจร ช่วยยกระดับมาตรฐานการประกันคุณภาพและสร้างข้อมูลเชิงลึกเพื่อการตัดสินใจในอนาคต

