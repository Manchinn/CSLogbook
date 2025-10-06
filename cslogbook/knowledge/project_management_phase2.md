# Project Management (Phase 2) – โครงงานพิเศษ (ProjectDocument Lifecycle)

> เอกสารนี้สรุปสถาปัตยกรรม, โมเดลข้อมูล, business rules, endpoint contracts, frontend integration และ test coverage ของ Phase 2 (ระบบจัดการโครงงานพิเศษ) ณ วันที่จัดทำ (Sep 2025)

## 1. วัตถุประสงค์ (Objective)
Phase 2 เพิ่มความสามารถให้นักศึกษาที่ผ่านเกณฑ์ (eligible) สามารถ:

## 1.1 ลำดับขั้นตอนโครงงานพิเศษ (Focus: Phase 2 → เตรียม Project1)
> ใช้สำหรับทีมพัฒนาและผู้ใช้งานเพื่อเห็นภาพรวม flow ที่ระบบ Phase 2 รองรับจริง ณ ปัจจุบัน (Sep 2025)

| ลำดับ | สถานะ / Action | ผู้ปฏิบัติ | รายละเอียด | เงื่อนไข/ผลลัพธ์ |
|-------|----------------|------------|-------------|------------------|
| 0 | ตรวจสิทธิ์โครงงาน (`Student.isEligibleProject`) | ระบบ | นักศึกษาต้องผ่านเกณฑ์หน่วยกิต/ชั้นปี ก่อนระบบเปิดให้สร้างโครงงาน | ถ้าไม่ผ่าน → จะไม่สามารถเริ่ม Step ต่อไปได้ |
| 1 | สร้าง Draft (`createProject`) | นักศึกษา (leader) | กรอกชื่อ TH/EN, ประเภท,รายละเอียดเบื้องต้น (optional), ระบบสร้าง `ProjectDocument` + สมาชิก leader | สถานะเริ่มต้น `draft` หรือ `advisor_assigned` เมื่อเลือกอาจารย์ทันที |
| 2 | เพิ่มสมาชิกคนที่สอง (`addMember`) | Leader | เชิญนักศึกษา (ต้อง eligible เช่นกัน) เข้าร่วมทีม | จำกัดสูงสุด 2 คน, ใช้ transaction ป้องกันซ้ำ |
| 3 | อัปเดต Metadata (`updateMetadata`) | Leader | ปรับข้อมูลรายละเอียด, ตั้ง advisor/co-advisor, ระบุ track | หลังสถานะ ≥ `in_progress` จะ lock ชื่อ/อาจารย์ |
| 4 | ตรวจ readiness (checklist) | ระบบ + Leader | เช็กเงื่อนไข: สมาชิกครบ 2, advisor ตั้งแล้ว, ชื่อ TH/EN, ประเภท, track ครบ | ใช้ใน UI Project Dashboard เพื่อแจ้งสถานะความพร้อม |
| 5 | Activate Project (`activateProject`) | Leader | เมื่อ checklist ครบ → Promote จาก `draft/ advisor_assigned` → `in_progress` | เป็นสัญญาณเข้าสู่การพัฒนา Phase 1 (เตรียมสอบหัวข้อ) |
| 6 | (อนาคต – Phase3+) Proposal/Artifact Workflow | – | placeholder สำหรับฟีเจอร์ต่อไป (upload KP01, approvals ฯลฯ) | ยังไม่ implement ใน Phase 2 |
| 7 | บันทึกผลสอบหัวข้อ (`setExamResult`) | เจ้าหน้าที่/ผู้มีสิทธิ์ | หลังสอบหัวข้อ บันทึกผล `passed/failed` + เหตุผลถ้าล้มเหลว | หาก `failed` → ต้องให้นักศึกษากด acknowledge ก่อนระบบ archive |
| 8 | นักศึกษารับทราบผลสอบ (`acknowledgeExamResult`) | สมาชิกโครงงาน | กดรับทราบเมื่อไม่ผ่าน เพื่อให้ระบบ archive โครงงานและเปิดทางยื่นรอบใหม่ | ระบบเปลี่ยน status → `archived` + timestamp |
| 9 | Archive โครงงาน (`archiveProject`) | Admin/Staff | ใช้กรณียุติโครงการหรือทำความสะอาดข้อมูล | เปลี่ยน status → `archived`, เก็บ `archivedAt` |
| 10 | Sync Timeline (`syncProjectWorkflowState`) | ระบบ | หลังข้อ 1–9 ระบบจะอัปเดต `StudentWorkflowActivity` และ field `Student.projectStatus` เพื่อให้หน้า timeline แสดงผล | ใช้ในบริการ `timelineService` และ frontend Student Timeline |

> หมายเหตุ: ขั้นตอนข้อ 7–8 เป็นส่วนขยายจาก Section 15.2 (Post-Topic Exam Result Flow) ซึ่งมีการเพิ่มฟิลด์ `examResult`, `examFailReason`, `studentAcknowledgedAt` ใน `ProjectDocument` และเชื่อมกับ workflow timeline แล้วในเดือน Sep 2025.


## 2. ขอบเขต (Scope ใน Phase 2)
รวม:
- Data lifecycle: `draft` → `advisor_assigned` → `in_progress` (→ future: `completed` → `archived`)
- Eligibility gating (reuse flag `Student.isEligibleProject` จาก Phase 1)
- สร้าง/เพิ่มสมาชิก/แก้ metadata/activate/archive (API skeleton สำหรับ archive พร้อมใช้ใน admin)
- Enriched serialization (members พร้อม studentCode + ชื่อเต็มจาก `User`)

ไม่รวม (Future):
- Milestones / Deliverables / Documents upload เฉพาะด้านโครงงาน
- Advisor approval workflow
- Completion criteria & grading
- Versioning / Audit trail

## 3. โมเดลข้อมูล (Data Model Changes)
ตารางที่ใช้: `project_documents`, `project_members` (ตารางเดิม + fields ใหม่)

เพิ่มใน `ProjectDocument`:
| Field | Type | Purpose |
|-------|------|---------|
| status | ENUM-like (string) | ติดตาม lifecycle (`draft`, `advisor_assigned`, `in_progress`, `completed`, `archived`) |
| academic_year | INT | ปีการศึกษา (ดึงจาก `Academic.is_current=true` หรือ fallback ปีปัจจุบัน พ.ศ.) |
| semester | TINYINT | ภาคเรียน (fallback 1 ถ้าไม่พบ record) |
| created_by_student_id | FK(Student) | ใครเป็นผู้สร้าง (leader แรก) |
| project_code | STRING | รหัสโครงงาน (hook กำหนด — pattern ระยะยาว PRJ{BUDDHIST_YEAR}-####) |
| archived_at | DATETIME (nullable) | เวลาที่ archive |

`ProjectMember`:
- บทบาทจำกัด: `leader` หรือ `member`
- Composite key (project_id, student_id) (ป้องกันซ้ำ)

ข้อสังเกต: ใน Phase 2 ยังไม่บังคับ unique index สำหรับ project_code ในเทส (ของจริงควร unique)

### 3.1 ฟิลด์รายละเอียด (Draft Detail Fields – Implemented)
ใน Phase 2 ปัจจุบันรองรับการเก็บและแก้ไขฟิลด์รายละเอียดต่อไปนี้ (ส่วนหนึ่ง optional ระหว่าง draft):
| Field | ใช้ใน Backend | สถานะการแก้ไขหลัง in_progress | หมายเหตุ |
|-------|---------------|----------------------------------|----------|
| objective | ✔ (`objective`) | แก้ได้ | วัตถุประสงค์หลัก |
| background | ✔ (`background`) | แก้ได้ | ที่มา/เหตุผล/ปัญหา |
| scope | ✔ (`scope`) | แก้ได้ | ขอบเขตงาน |
| expectedOutcome | ✔ (`expected_outcome`) | แก้ได้ | ผลลัพธ์ที่คาดหวัง |
| benefit | ✔ (`benefit`) | แก้ได้ | ประโยชน์ที่จะได้รับ |
| methodology | ✔ (`methodology`) | แก้ได้ | กระบวนการ / วิธีดำเนินการ |
| tools | ✔ (`tools`) | แก้ได้ | เทคโนโลยี / เครื่องมือ |
| timelineNote | ✔ (`timeline_note`) | แก้ได้ | กำหนดการย่อ / หมายเหตุเวลา |
| risk | ✔ (`risk`) | แก้ได้ | ความเสี่ยงสำคัญ |
| constraints | ✔ (`constraints`) | แก้ได้ | ข้อจำกัด / เงื่อนไข |
| problem (frontend only) | ✖ (local state) | แก้ได้ | ใช้ช่วยกรอก background (ยังไม่ persist) |

หมายเหตุ: เดิม logic ล็อกฟิลด์รายละเอียดหลัง in_progress ถูกผ่อนคลายแล้ว เพื่อให้นักศึกษาสามารถ refine scope/methodology ต่อได้ก่อนเข้าสู่ Phase proposal/final.

## 4. Lifecycle & Allowed Transitions
```
 draft --(set advisorId)--> advisor_assigned --(activate + readiness OK)--> in_progress --(future)--> completed --(future)--> archived
        \---------------------------------------------------------------(activate + readiness OK)--> in_progress
 in_progress --(admin archive)--> archived
 draft/advisor_assigned --(admin archive)--> archived (ปกติหลีกเลี่ยง แต่เผื่อ case ยุติโครงงาน)
```
Transition Rules:
- ตั้งค่า advisor ครั้งแรกบน draft → status = advisor_assigned
- activate เฉพาะ draft หรือ advisor_assigned ที่ผ่าน readiness checklist → in_progress
- in_progress ไม่สามารถย้อนกลับ draft/advisor_assigned
- อัปเดตชื่อ/ประเภท/track/advisor ถูกล็อคเมื่อ status ∈ {in_progress, completed, archived} (ยกเว้นในอนาคตบางฟิลด์อาจผ่อนปรน)
- archive: เปลี่ยน status เป็น archived + timestamp

## 5. Business Rules (Core Constraints)
1. Eligibility: ผู้สร้าง (leader) ต้อง `isEligibleProject = true`
2. Single Active Project (Leader): นักศึกษาที่เป็น leader จะสร้างใหม่ไม่ได้ถ้ามี project ที่ status != archived
3. Team Size: จำกัดสมาชิกสูงสุด 2 คน (leader + member)
4. Add Member: ทำได้เฉพาะ leader และต้องเป็นนักศึกษาที่ `isEligibleProject = true` และยังไม่อยู่ในทีม
5. Activate Readiness ต้องครบ:
   - สมาชิก = 2
   - advisorId != null
   - projectNameTh & projectNameEn ไม่ว่าง
   - projectType & track ไม่ว่าง
6. Idempotent Activate: ถ้า status = in_progress เรียกซ้ำจะคืนข้อมูลเดิม ไม่ error
7. Metadata Lock (อัปเดต Sep 2025): หลัง status ≥ in_progress (in_progress, completed, archived) "ล็อกเฉพาะ" ชื่อ (TH/EN) และ advisor/co-advisor เท่านั้น; ประเภท (projectType) และ tracks ยังแก้ไขได้ + รายละเอียด (objective/background/… tools ฯลฯ) ยังแก้ได้เพื่อให้ปรับ scope ต่อเนื่อง
8. Archive ไม่สร้างผลข้างเคียง (ไม่ลบสมาชิก) แค่ mark status + archived_at

## 6. Service Functions (Implemented)
ไฟล์: `services/projectDocumentService.js`
- createProject(studentId, payload)
- addMember(projectId, actorStudentId, newStudentCode)
- updateMetadata(projectId, actorStudentId, payload)
- activateProject(projectId, actorStudentId)
- archiveProject(projectId, actorUser)
- getMyProjects(studentId)
- getProjectById(projectId)
- serialize(modelInstance)

จุดสำคัญ:
- ใช้ transaction + row lock (LOCK.UPDATE) ตอน addMember เพื่อลด race condition เพิ่มสมาชิกพร้อมกัน
- ตรวจ leader role ทุก action ที่แก้ state
- ใช้ Academic ปัจจุบันถ้ามี (fallback ปี/เทอม)
- serialize รวม members พร้อม studentCode + ชื่อ (จาก Student.user)

## 7. Endpoint Contracts (API Layer)
Base: `/api/projects`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | student | สร้าง draft (หรือ advisor_assigned ถ้ามี advisorId ส่งมา) |
| GET | /mine | student | รายการโครงงานที่ตนเป็นสมาชิก (leader/member) |
| GET | /:id | student | รายละเอียดโครงงาน (ถ้าเป็นสมาชิก) / (อนาคต: role-based guard) |
| PATCH | /:id | student (leader) | แก้ metadata (lock หลัง in_progress) |
| POST | /:id/members | student (leader) | เพิ่มสมาชิกคนที่สอง |
| POST | /:id/activate | student (leader) | Promote → in_progress เมื่อ readiness ครบ |
| POST | /:id/archive | admin/staff | Archive โครงงาน |

ตัวอย่าง Request/Response (ย่อ):
```
POST /api/projects
{ "projectNameTh": "ระบบจัดการ", "projectNameEn": "Management System" }
→ 201
{
  "projectId": 12,
  "status": "draft",
  "members": [ { "studentId": 5, "role":"leader", "studentCode":"6404..." } ]
}
```

Activate Error Example:
```
POST /api/projects/12/activate
→ 400 { "error": "ต้องมีสมาชิกครบ 2 คนก่อนเริ่มดำเนินโครงงาน" }
```

## 8. Readiness Checklist (Frontend Mapping)
บน `ProjectDashboard` (React):
- ดึง project detail แล้วประมวลผล checklist:
  - hasTwoMembers → members.length === 2
  - hasAdvisor → advisorId != null
  - hasNames → projectNameTh && projectNameEn
  - hasTypeTrack → projectType && track
- ปุ่ม Activate ถูก disable ถ้าข้อใดไม่ครบ พร้อม tooltip แสดงรายการที่ยังขาด

## 9. Serialization Structure (Response Shape)
```
{
  projectId,
  projectCode,
  status,
  projectNameTh,
  projectNameEn,
  projectType,
  track,
  advisorId,
  coAdvisorId,
  academicYear,
  semester,
  members: [
    {
      studentId,
      role,
      studentCode,
      name // firstName + lastName (nullable ถ้า user ไม่พบ)
    }, ...
  ],
  archivedAt
}
```

## 10. Standard Error Messages (Key)
| Scenario | Message (th) |
|----------|--------------|
| Student not eligible | `นักศึกษายังไม่มีสิทธิ์สร้างโครงงาน (ไม่ผ่านเกณฑ์โครงงานพิเศษ)` |
| Duplicate active project | `คุณมีโครงงานที่ยังไม่ถูกเก็บถาวรอยู่แล้ว` |
| Add member not leader | `เฉพาะหัวหน้าโครงงานเท่านั้นที่เพิ่มสมาชิกได้` |
| Team already full | `โครงงานมีสมาชิกครบ 2 คนแล้ว` |
| New member ineligible | `นักศึกษาคนนี้ยังไม่ผ่านเกณฑ์โครงงานพิเศษ` |
| Activate lacking members | `ต้องมีสมาชิกครบ 2 คนก่อนเริ่มดำเนินโครงงาน` |
| Activate lacking advisor | `ต้องเลือกอาจารย์ที่ปรึกษาก่อน` |
| Activate lacking names | `กรุณากรอกชื่อโครงงาน (TH/EN) ให้ครบ` |
| Activate lacking type/track | `กรุณากรอกประเภทและ track ให้ครบ` |
| Unauthorized metadata update | `ไม่มีสิทธิ์แก้ไขข้อมูลโครงงาน` |
| Project not found | `ไม่พบโครงงาน` |

## 11. Testing Summary (Unit Tests Phase 2)
ไฟล์: `tests/unit/projectDocumentService.unit.test.js`
ใช้ in-memory SQLite พร้อม simplified models

ครอบคลุม 9 กรณี:
1. Create draft success
2. Prevent duplicate active leader project
3. Reject create if not eligible
4. Add second member success
5. Prevent add > 2
6. Prevent add by non-leader
7. Activate fail when readiness not met (members)
8. Activate success when readiness complete
9. Lock names after in_progress

สถานะ: PASS ทั้งหมด

## 12. ความเสี่ยง & ข้อจำกัด (Known Limitations)
| หมวด | รายละเอียด |
|-------|------------|
| Concurrency | ใช้ row lock เฉพาะ addMember; createProject ยังไม่ป้องกัน race ถ้า user เปิดหลายแท็บ (โอกาส duplicated intent น้อย) |
| Advisor Flow | ยังไม่รองรับการยืนยันจากอาจารย์ (manual assign เท่านั้น) |
| Authorization | Controller ชั้นปัจจุบันอาจยังไม่ได้เพิ่ม guard ตรวจว่า viewer เป็นสมาชิกเสมอ (ควรเพิ่มก่อน production) |
| Project Code | Hook ปัจจุบันในเทสง่ายกว่าของจริง (ควรใช้ pattern deterministic + unique index ใน DB) |
| Archival Semantics | ยังไม่บังคับเหตุผลหรือ cascade cleanup |

## 13. แนวทางขยาย (Future Roadmap)
1. Milestones & Deliverables entity (timeline, due dates)
2. Advisor approval workflow + notifications
3. Completed criteria & grading rubric mapping
4. Activity log / audit trail (Sequelize hooks + dedicated table)
5. Soft delete / restoration window ก่อน archived สุดท้าย
6. Integration กับ PDF export (proposal / progress report) ใน Phase ถัดไป
7. GraphQL หรือ aggregation endpoint สำหรับ dashboard admin

## 14. ตัวอย่างการใช้งานเต็ม (End-to-End Mini Flow)
```
1) Leader เรียก POST /api/projects { projectNameTh, projectNameEn }
→ ได้ draft + leader member
2) Leader เพิ่มสมาชิก POST /api/projects/:id/members { studentCode }
3) Leader PATCH /api/projects/:id { advisorId, projectType, track }
4) Leader POST /api/projects/:id/activate → in_progress
5) Admin POST /api/projects/:id/archive → archived (ถ้าต้องการปิด)
```

## 15. Checklist สำหรับ Dev ใหม่
- ดู service: `projectDocumentService.js` เข้าใจ transaction pattern
- ตรวจ routes: `routes/projectRoutes.js` (ensure auth middleware)
- Frontend: `project/ProjectDashboard.js` ดู readiness logic
- เขียนฟีเจอร์เพิ่ม → รักษา constraint team size + status lock
- เพิ่ม test ใหม่ → pattern ตามไฟล์ unit ปัจจุบัน (simplified models)

## 15.1 Topic Exam Overview (Phase A Scheduling Prep) – สรุปเสริม
ฟีเจอร์เสริม Phase 2 สำหรับเตรียมข้อมูลจัดตารางสอบนำเสนอหัวข้อ (ยังไม่เริ่ม scheduling algorithm)

Endpoint: `GET /api/projects/topic-exam/overview`
Access: teacher / admin / staff (JWT + role guard)

Query Params:
- status (all|draft|advisor_assigned|in_progress|completed|archived)
- advisorId (filter by advisor)
- search (LIKE: code / title TH / title EN)
- readyOnly (boolean) – ใช้ readiness baseline
- sortBy (updatedAt|createdAt|projectCode|memberCount), order (asc|desc)

Readiness Baseline (ปัจจุบัน – Phase: Topic Collection):
1. มีชื่อ TH & EN ครบ (advisor optional)

หมายเหตุ: advisorId ไม่บังคับในขั้นรวบรวมหัวข้อเพื่อจัดกลุ่มสอบ หากกรอกแล้วจะแสดงในข้อมูลเสริม และในอนาคตอาจเพิ่มโหมดเข้ม (เช่น require advisor หรือสมาชิกครบ) ผ่าน query flag แยกโดยไม่เปลี่ยน baseline นี้.

Response Fields (หลัก): projectId, projectCode, titleTh, titleEn, status, advisor { teacherId, name }, coAdvisor, members[{ studentId, studentCode, name, role }], memberCount, readiness{...}, updatedAt, createdAt

Service: `services/topicExamService.js` (map + readiness heuristic)
Controller: `controllers/topicExamController.js`
Route: `routes/topicExamRoutes.js` (mount: `/api/projects/topic-exam`)
Frontend: `/teacher/topic-exam/overview` (AntD Table + filters)
Sidebar Integration: เพิ่มเมนู `Topic Exam Overview` สำหรับ role teacher

Export (XLSX เท่านั้น – อัปเดต):
- ปุ่ม Export XLSX ที่หน้า Overview (มุมขวาบน)
- Endpoint: `GET /api/projects/topic-exam/export` (param format ถ้ามีจะถูกละเว้น ส่งคืน XLSX เสมอ)
- XLSX: sheet `Overview` คอลัมน์: หัวข้อ, รหัสนักศึกษา, ชื่อ-นามสกุล, หมายเหตุ (หัวข้อซ้ำในแต่ละสมาชิกเพื่อให้ง่ายต่อการ sort)
- Remark logic: track มีคำว่า bilingual หรือ csb ⇒ "โครงการสองภาษา (CSB)" มิฉะนั้น ⇒ "โครงงานภาคปกติ"
- Security: ใช้ role guard เดียวกับ overview (teacher/admin/staff)

Tests เพิ่ม:
- Unit: `tests/unit/topicExamService.unit.test.js` (ตรวจ mapping & readyOnly)
- Integration: `tests/integration/topicExamOverview.integration.test.js` (ครอบ 403 student / 200 teacher – ปัจจุบันยอมรับ 500 ชั่วคราวถ้า DB ไม่มี seed)
- Integration Export: `tests/integration/topicExamExport.integration.test.js` (ตรวจ Content-Type เป็น XLSX (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet) + role guard; พารามิเตอร์ format ถ้ามีจะถูกละเว้น)

Logging (Winston):
- `[TopicExam] overview request start|success|error` (route)
- `[TopicExamService] findAll error:` + message
- `[TopicExamService] overview result size=<n>`

Roadmap ถัดไป (สั้น): เพิ่ม pagination, ปี/ภาคเรียน filter, auto grouping session.

### 15.2 Post-Topic Exam Result Flow (Pass/Fail + Acknowledge & Auto Purge)
หลังการสอบนำเสนอหัวข้อ (จัดนอกระบบ) ต้องบันทึกผลในระบบและจัดการกรณี “ไม่ผ่าน” ให้โปร่งใสและเป็นระเบียบ

Flow (ระดับใช้งาน):
1. สอบหัวข้อ (offline)
2. เจ้าหน้าที่บันทึกผล: ผ่าน หรือ ไม่ผ่าน (ถ้าไม่ผ่านต้องกรอกเหตุผล)
3. ถ้า “ผ่าน” → แสดง/ยืนยันอาจารย์ที่ปรึกษา/ร่วม และโครงงานเข้าสู่ช่วงพัฒนา (Phase โครงงานพิเศษ 1)
4. ถ้า “ไม่ผ่าน” → นักศึกษาเห็นสถานะ + เหตุผล + ปุ่ม “รับทราบผล”
5. นักศึกษากด “รับทราบผล” → ลบหัวข้อ (ต้องสร้างใหม่รอบถัดไป)
6. หาก 7 วันไม่กด → ระบบลบให้อัตโนมัติ (auto purge)

Fields ที่เสนอเพิ่มใน ProjectDocument:
| Field | ความหมาย |
|-------|----------|
| examResult | null / passed / failed |
| examFailReason | เหตุผลเมื่อ failed |
| examResultAt | เวลาบันทึกผลสอบ |
| studentAcknowledgedAt | เวลาที่นักศึกษากดยืนยันผลไม่ผ่าน |

Endpoint ร่าง:
| Method | Path | Role | ใช้ทำอะไร |
|--------|------|------|-----------|
| POST | /api/projects/:id/exam-result | staff/admin | บันทึกผล { result:"passed" } หรือ { result:"failed", reason } |
| POST | /api/projects/:id/acknowledge-fail | student (member) | กดยืนยันรับทราบ (จะลบหัวข้อทันที) |

Auto Purge Job:
- รันรายวัน คัด: examResult=failed AND studentAcknowledgedAt IS NULL AND NOW() > examResultAt + 7 วัน → ลบ project + members

พฤติกรรมการลบ (initial): Hard delete เพื่อล้างสนามให้นักศึกษายื่นใหม่ (เก็บประวัติผ่าน event log ในอนาคต)

UI สรุป:
- Staff: ตารางหัวข้อหลังสอบ → ปุ่ม “ผ่าน” / “ไม่ผ่าน” + modal กรอกเหตุผล
- Student: Banner “ผลสอบ: ไม่ผ่าน” + เหตุผล + ปุ่ม “รับทราบ (หัวข้อจะถูกลบ)” + modal ยืนยัน

Event Log (แนะนำภายหลัง): PROJECT_EXAM_PASSED, PROJECT_EXAM_FAILED, PROJECT_FAIL_ACK, PROJECT_PURGED_AUTO, PROJECT_PURGED_ACK

แผนย่อยแนะนำ (ลำดับพัฒนา):
1) Migration ฟิลด์ผลสอบ 2) Endpoint staff 3) UI student + acknowledge 4) Scheduled job 5) Tests (fail+ack+auto purge) 6) Event log

หมายเหตุ: เลือก hard delete ตอนนี้ง่ายต่อการรีเซ็ตรอบ; หากอนาคตต้องการสถิติเชิงลึก → ใช้ event log หรือ snapshot export.

### 15.3 Support Staff Project1 Defense Scheduling UI (Oct 2025)
- Route: `/admin/project1/defense-schedule` (AntD Table + Drawer Form)
- Data flow: เรียก `projectDefenseRequestService` → โหลดคำขอ KP02 ที่ผ่านเกณฑ์ → ให้เจ้าหน้าที่ตั้ง `scheduledAt`, `room`, `committeeChair`
- Validation: ตรวจสอบว่ามีวันที่/เวลา/ห้องสอบก่อนส่ง, ปิดปุ่มซ้ำเมื่อ `status === 'SCHEDULED'`
- Navigation: ย้ายเมนูไปอยู่ใต้ `จัดการเอกสาร > เอกสารโครงงานพิเศษ > นัดสอบโครงงานพิเศษ 1` เพื่อจัดกลุ่มกับ `บันทึกผลสอบหัวข้อโครงงานพิเศษ`
- Logging: เพิ่ม log `[ProjectDefense] schedule` ใน service layer (reuse Winston)
- Next step: เพิ่มการแจ้งเตือนอีเมล + ปุ่ม export ตารางสอบสำหรับคณะกรรมการ

### 15.4 Project1 Defense Request Flow Snapshot (Sep 2025)
> ย้ำขั้นตอนที่ต้องครอบคลุมใน Phase 2 เพื่อรองรับคำขอสอบโครงงานพิเศษ 1 ตั้งแต่ฝั่งนักศึกษาจนถึงปลดล็อก Phase 2

1. **นักศึกษากรอกคำขอ (คพ.02)** – หน้า `ExamSubmitPage` เรียก `POST /api/projects/:id/kp02` → `projectDefenseRequestService.submitProject1Request` ตรวจเกณฑ์ logbook + เก็บ snapshot สมาชิก/ที่ปรึกษา
2. **อาจารย์ลงนาม / เจ้าหน้าที่ตรวจความพร้อม** – ปัจจุบันเป็นขั้น Manual (แนบไฟล์คพ.02 ที่ลงนามจริง) โดยระบบช่วยแสดง metric จาก `projectDocumentService.buildProjectMeetingMetrics` เพื่อดูจำนวนบันทึกการพบอาจารย์ที่อนุมัติครบตามเกณฑ์
3. **เจ้าหน้าที่นัดสอบ** – UI `Project1DefenseSchedulePage` ส่ง `POST /api/projects/:id/kp02/schedule` → บันทึกวันเวลา/สถานที่ และเปลี่ยนสถานะคำขอเป็น `scheduled` (timeline step `PROJECT1_DEFENSE_SCHEDULED`)
4. **บันทึกผลสอบ** – ใช้ endpoint `POST /api/projects/:id/exam-result` (controller `topicExamResultController.recordResult`) เพื่ออัปเดตผล `passed/failed` และหมายเหตุ (พร้อมเตรียม modal UI ให้สอดคล้องกับเอกสารคพ.02)
5. **ปลดล็อก Phase 2 / โครงงานพิเศษ 2** – `projectDocumentService.syncProjectWorkflowState` ดึงผลสอบไปอัปเดต `StudentWorkflowActivity`; หากผลสอบผ่านจะเปิดการ์ด Phase 2 ให้ดำเนินการต่อ, หากไม่ผ่านนักศึกษาต้องกด `PATCH /api/projects/:id/exam-result/ack` เพื่อ archive และยื่นใหม่

> Backlog: เพิ่ม endpoint/ปุ่ม Export Excel รายชื่อทีมที่สถานะ `scheduled` เพื่อให้ผู้จัดตารางสอบดาวน์โหลดได้รวดเร็ว (reuse logic จาก Topic Exam Export) และฝัง upload ฟอร์มคพ.02 ที่ลงนามแล้วให้ตรวจสอบย้อนหลังได้ในระบบ.


---
Revision: Phase2 v1.0 (Initial Documentation)

---

## 16. สถานะการพัฒนา (Implementation Status – Sep 2025)
| ด้าน | รายละเอียดที่ทำแล้ว | เหลือ / Planned | หมายเหตุ |
|------|---------------------|------------------|----------|
| Backend Core | createProject, addMember, updateMetadata (ปรับ lock เฉพาะชื่อ+advisor), activateProject, archiveProject, getMyProjects, getProjectById, TopicExam overview service | Proposal upload, milestones, artifacts, events | Service แยกตามไฟล์ พร้อม Winston logging พื้นฐาน |
| Data Model | ตาราง project_documents, project_members, project_tracks + รายละเอียดฟิลด์ (objective…constraints) | milestone/artifact/event tables | Detail fields edit-after-in_progress enabled |
| Student Frontend | Draft Wizard (5 steps: basic, classification, members, details, review), hydration/edit mode, lock indicator, readiness tags, second member sync, Phase1 dashboard cards: เสนอหัวข้อ, สอบหัวข้อ, บันทึกการพบอาจารย์, ส่งเอกสารสอบ, วันสอบ, ปรับ Scope (ยกเลิกการ์ด "แก้ไขข้อเสนอ" เพราะรวมการปรับขอบเขต/วัตถุประสงค์ผ่านบันทึกการพบอาจารย์แล้ว) | Portal dashboard enrichment, Activate button UI | ใช้ AntD + Context provider |
| Teacher Frontend | Topic Exam Overview table (flattened member rows, merged cells, filters, readyOnly toggle) | Extra filters (ปี/เทอม), pagination | ใช้ service topicExamService + rowSpan rendering |
| Support Staff Frontend | หน้านัดสอบโครงงานพิเศษ 1 (ตารางคำขอ + Drawer กำหนดวัน/เวลา/สถานที่) พร้อมย้ายเมนูไปที่ `จัดการเอกสาร > เอกสารโครงงานพิเศษ` | Dashboard รวมสถานะ, archive UI, แจ้งเตือน | ใช้บริการ `projectDefenseRequestService.scheduleProject1Defense` + แชร์ component กับ AntD Table |
| Admin | Archive endpoint (usable via API tools) | Admin panel UI | Minimal now |
| Locking Policy | Names + advisor/coAdvisor locked at in_progress+ | (อาจเพิ่ม soft unlock admin) | Project type & tracks + details remain editable |
| Validation | Single active project per student (leader + member), second member eligibility, readiness for activate | Cross-project uniqueness checks (future) | Script scan duplicates มีแล้ว |
| Testing | Unit tests for projectDocumentService + topicExamService, integration for overview endpoint | Add tests for edit-after-in_progress, duplicate membership guard | Jest + SQLite in-memory |
| Documentation | Phase2 core doc + extended design + status section | Keep synced with future phases | Version bump v1.2 |

อัปเดตสั้น: ฝั่งนักศึกษา “เสนอหัวข้อโครงงานพิเศษ” ใช้งานได้ (สร้าง/แก้ไข draft + เติมรายละเอียดหลายฟิลด์ + เพิ่มสมาชิกคนที่สอง) แต่ยังไม่มีปุ่ม Activate ใน UI (เรียก API ได้). ฝั่งอาจารย์ดูภาพรวมหัวข้อทั้งหมดได้ผ่าน Topic Exam Overview. ฝั่งเจ้าหน้าที่ (support staff) และส่วนงาน proposal/milestone อื่น ๆ ยังไม่เริ่ม.

---
Revision: Phase2 v1.4 (เพิ่ม Section 15.2 Post-Topic Exam Result Flow: pass/fail + acknowledge 7-day auto purge)
Revision: Phase2 v1.3 (TopicExam XLSX-only Export + Readiness Baseline Update – advisor ไม่บังคับใน readiness สำหรับ overview, ลบ mention CSV ที่เกี่ยวกับ TopicExam, อัปเดต test export ให้ตรวจ XLSX เท่านั้น)
Revision: Phase2 v1.2 (Status Section + Detail Fields Lock Policy Update)

## 17. ส่วนขยายการออกแบบ (Extended Design – Draft สำหรับ Phase 3+)
เอกสารช่วงแรก (ข้อ 1–15) ครอบคลุม Phase 2 ปัจจุบัน ส่วนนี้เป็นบันทึกการออกแบบเชิงลึกเพื่อรองรับการขยาย (ไม่ lock scope แต่ช่วยกำหนดทิศทาง)

### 16.1 Extended Lifecycle (Proposed)
```
draft → advisor_assigned → proposal_submitted → proposal_review → proposal_approved → in_progress → final_ready → presentation_scheduled → evaluated → completed → archived
```
Trigger ตัวอย่าง:
- เลือก advisor ครั้งแรก: draft → advisor_assigned
- อัปโหลด proposal: advisor_assigned → proposal_submitted → proposal_review
- Advisor อนุมัติ: proposal_review → proposal_approved → in_progress
- ส่ง Final (ครบ checklist): in_progress → final_ready
- เจ้าหน้าที่ตั้งวันสอบ: final_ready → presentation_scheduled
- กรอกคะแนน / rubric: presentation_scheduled → evaluated → completed

### 16.2 Role Perspective ขยาย
| Role | Focus | จุดตัดสินใจ |
|------|-------|--------------|
| Student | สร้าง/อัปเดตข้อมูล + ส่ง artifacts | สร้าง draft, เลือก advisor, ส่ง proposal, อัปโหลด final |
| Advisor | ประเมินคุณภาพ / feedback | อนุมัติ proposal, ตรวจ milestone, ให้คะแนน |
| Co-Advisor | สนับสนุนทางเทคนิค | Comment, meeting notes |
| Support Staff | Orchestrate กระบวนการ | เปิด/ปิดรอบ, จัดตารางนำเสนอ, monitor backlog |
| Admin | กำกับภาพรวม / override | Force transition, audit, export |

### 16.3 Page Mapping (Incremental)
| กลุ่ม | หน้า (Route) | Purpose | Phase Suggest |
|-------|--------------|---------|---------------|
| Portal | /project | Dashboard ศูนย์รวม | 2 (มีแล้วพื้นฐาน) |
| Eligibility | /project-eligibility | ตรวจคุณสมบัติ | 2 |
| Requirements | /project-requirements | เอกสาร/เงื่อนไข | 2 |
| Proposal | /project/:id/proposal | Upload + Review state | 3 |
| Milestones | /project/:id/milestones | Progress control | 3 |
| Artifacts | /project/:id/artifacts | จัดการไฟล์เวอร์ชัน | 3–4 |
| Meetings | /project/:id/meetings | นัด/โน้ต | 4 |
| Final | /project/:id/final | ส่งรายงาน + ภาคผนวก | 5 |
| Presentation | /project/:id/presentation | ตารางสอบ | 6 |
| Evaluation | /project/:id/evaluation | คะแนน/ผลประเมิน | 6 |
| Timeline | /project/:id/history | Audit events | 6–7 |

### 16.4 Component Architecture (Proposed Structure)
```
components/project/
  portal/
    ProjectPortal.js
    ProjectStatusStepper.js
    ProjectNextActions.js
    ProjectAdvisorCard.js
    ProjectMilestoneSummary.js
  proposal/
    ProposalUploadPanel.js
    ProposalReviewComments.js
  milestones/
    MilestoneList.js
    MilestoneFormModal.js
    MilestoneProgressBar.js
  artifacts/
    ArtifactList.js
    ArtifactUpload.js
    ArtifactVersionTag.js
  meetings/
    MeetingScheduler.js
    MeetingList.js
    MeetingNoteDrawer.js
  final/
    FinalSubmissionPanel.js
    FinalChecklist.js
  evaluation/
    EvaluationResultPanel.js
    RubricBreakdown.js
  common/
    ProjectStatusTag.js
    MemberAvatarList.js
    AdvisorSelect.js
    TimelineEvents.js
```

### 16.5 Service/API Shape (ขยาย)
```
projectService {
  // core
  create, listMine, get, update, activate, archive
  // proposal
  uploadProposal(id, file) / getProposal(id) / reviewProposal(id, {decision, comment})
  // milestones
  listMilestones(id) / createMilestone / updateMilestone / approveMilestone
  // artifacts (generic files)
  listArtifacts(id, type?) / uploadArtifact / getArtifactVersions
  // meetings
  listMeetings(id) / scheduleMeeting / updateMeeting / addMeetingNote
  // final & evaluation
  uploadFinalReport(id, file) / submitFinal(id)
  getEvaluation(id) / submitEvaluation(id, rubricPayload)
  // advisor directory
  listAdvisors(filters)
}
```

### 16.6 Additional Data Models (Draft)
| Table | Fields (ย่อ) | หมายเหตุ |
|-------|--------------|-----------|
| project_milestones | milestone_id, project_id, title, due_date, progress, status, feedback, submitted_at, reviewed_at | status: pending/submitted/accepted/rejected |
| project_artifacts | artifact_id, project_id, type, file_path, version, uploaded_by, checksum, uploaded_at | type: proposal/final/slide/appendix/source/other |
| project_meetings | meeting_id, project_id, scheduled_at, channel, location_or_link, created_by, status | channel: onsite/online |
| project_meeting_notes | note_id, meeting_id, author_type, author_id, content, created_at | author_type: student/teacher |
| project_evaluations | evaluation_id, project_id, evaluator_type, rubric_json, total_score, comments, created_at | evaluator_type: advisor/committee |
| project_events | event_id, project_id, event_type, actor_role, actor_id, meta_json, created_at | สำหรับ timeline/audit |

### 16.7 Permission Matrix (เพิ่มเติม)
| Action | Student | Advisor | Co-Advisor | Support | Admin |
|--------|--------|--------|-----------|---------|-------|
| Upload proposal | ✔ | ดู/คอมเมนต์ | ดู | ดู | ดู/override |
| Approve proposal | ✖ | ✔ | ✖ | เสนอ flag | ✔ |
| Create milestone | ✔ | ✔ (เสนอแก้) | คอมเมนต์ | ดู | ✔ |
| Accept milestone | ✖ | ✔ | ✖ | แนะนำ | ✔ |
| Schedule meeting | ขอ (draft) | ✔ (confirm) | ดู | ดู | ✔ |
| Upload final | ✔ | ดู | ดู | ตรวจ completeness | ✔ |
| Submit evaluation | ✖ | ✔ | อาจ (partial) | รวม/ตรวจ | ✔ |
| Archive | ✖ | ✖ | ✖ | เสนอ | ✔ |

### 16.8 UX Patterns
| Feature | Pattern |
|---------|--------|
| Portal | Status Stepper + Quick Actions + Milestone bar |
| Proposal Review | Split viewer (PDF + Comment panel) |
| Milestones | Accordion list + inline progress badge |
| Meetings | Calendar (weekly) + Drawer detail |
| Artifacts | Version chip + Download + Replace |
| Evaluation | Card per evaluator + rubric table |
| Timeline | Vertical steps (event icon + meta) |

### 16.9 Phase Roadmap (แนะนำ)
| Phase | เนื้อหา |
|-------|---------|
| 3 | Proposal + Advisor review + Basic artifacts table |
| 4 | Milestones + Meetings scheduling |
| 5 | Final submission + Checklist validation |
| 6 | Evaluation (rubric) + Presentation scheduling |
| 7 | Timeline/Audit + Reports (advisor workload) |
| 8 | Optimization, PDF enhancements, Export bundle |

### 16.9.1 คำอธิบายภาษาไทยแบบขยาย
| Phase | รายละเอียดเชิงลึก | คุณค่าที่ได้ (Value) | จุดเสี่ยง/สิ่งที่ต้องจับตา |
|-------|--------------------|----------------------|-----------------------------|
| 3 | เพิ่มวงจร "เสนอหัวข้ออย่างเป็นทางการ" ผ่านการอัปโหลด Proposal (ไฟล์ PDF) → Advisor เห็น/ให้ความเห็น/อนุมัติ (หรือขอแก้) พร้อมตาราง artifacts พื้นฐานเก็บไฟล์ proposal เวอร์ชันล่าสุด | ทำให้โครงงานจาก "ไอเดีย" กลายเป็นเอกสารกึ่งเป็นทางการ ลดความคลุมเครือ scope ตั้งแต่ต้น | ขนาดไฟล์, เวอร์ชันซ้ำ, Advisor backlog หากไม่มี notification / filter ที่ดี |
| 4 | แนะนำ Milestones (จุดตรวจความคืบหน้า) + Scheduling เบื้องต้นของ Meetings (ระบบจองเวลาหรือ log การนัด) | เพิ่มการควบคุมจังหวะงาน ลดโอกาสเรื้อรัง / เงียบหาย และสร้าง trace ของการติดตาม | การสแปม milestones เล็กมาก, ซ้ำซ้อนกับช่องทางนัดภายนอก (Line/Email) หาก UX ไม่ลื่น |
| 5 | ช่องทางส่ง Final Report, Slide, ภาคผนวก + Checklist คุณภาพ (เช่น มีส่วนประกอบครบ บรรณานุกรม ฯลฯ) ก่อนอนุญาตให้เข้าสู่ขั้นตารางสอบ | ยกระดับคุณภาพ deliverable ขั้นสุดท้าย ลดงานตรวจพื้นฐานให้ Advisor/กรรมการ | ความหลากหลายรูปแบบไฟล์, การตรวจ checklist อาจต้อง rule engine ที่ยืดหยุ่น |
| 6 | ระบบกรอก/คำนวนคะแนนผ่าน Rubric + จัดตาราง Presentation (assign slot, ห้อง, คณะกรรมการ) | ลดงานเอกสาร manual (Excel) - ได้ข้อมูลโครงสร้างพร้อมวิเคราะห์รวดเร็ว | Overbooking slot, ความซับซ้อน time zone / ห้อง, ต้องมี guard ป้อนคะแนนซ้ำ |
| 7 | Timeline/Audit เก็บ Event ทุกการกระทำ + รายงาน (เช่น ภาระงาน Advisor, สถานะรวมของ batch, distribution ของคะแนน/ประเภทโครงงาน) | โปร่งใส ตรวจสอบย้อนหลังได้, สนับสนุน QA / Accreditation | ปริมาณ log มาก → ต้องออกแบบ index / retention, ความเป็นส่วนตัวข้อมูล (PII) |
| 8 | ปรับประสิทธิภาพ (query / index), เพิ่มชุด PDF (Proposal Bundle, Final Bundle), Export ZIP รวม artifacts และรายงานสรุป | พร้อมขยาย scale และออกรายงานครบวงจร / ส่งภายนอก | ขนาดไฟล์รวมใหญ่, ต้องจัดการ streaming / chunk, ต้นทุนเวลา generate PDF จำนวนมากพร้อมกัน |

สรุปย่อ (Flow Value Progression):
Phase 3 สร้างความชัดเจน → Phase 4 สร้างจังหวะควบคุม → Phase 5 ยกระดับคุณภาพส่งมอบ → Phase 6 สร้างผลการประเมินที่เป็นระบบ → Phase 7 เพิ่มการสืบค้นและการวิเคราะห์ภาพรวม → Phase 8 ทำให้ระบบเสถียรและรองรับการใช้งานเชิงบริหาร/รายงานภายนอก.

แนวคิดการนำไปใช้ทีละขั้น (Incremental Release Strategy):
1) เปิด Proposal (Phase 3) ให้ใช้งานจริงก่อน แม้ยังไม่มี Milestones เพื่อรวบรวมหัวข้ออย่างเป็นระบบ
2) เก็บ feedback จาก Advisor เรื่องฟอร์ม/องค์ประกอบ proposal แล้วค่อยสรุป schema milestone (Phase 4) เพื่อลด refactor
3) ระหว่าง Phase 4 → 5 อาจเริ่มเก็บ event พื้นฐาน (PROJECT_CREATED, PROPOSAL_UPLOADED) ก่อนพัฒนาเต็มใน Phase 7 เพื่อลด migration ซ้ำ
4) ทำ Rubric (Phase 6) แบบ metadata-driven (เก็บ rubric_json) เพื่อให้อนาคตปรับ rubric ต่อเทอมโดยไม่แก้โค้ด
5) ออกแบบ artifact storage path ตั้งแต่ Phase 3 ให้ครอบคลุม file type ของ Phase 5/8 เพื่อหลีกเลี่ยงย้ายไฟล์

เกณฑ์พร้อมเลื่อน Phase (Readiness Gates):
- Go Phase 4: ≥ 70% โครงงานมี proposal อนุมัติ + Advisor feedback latency เฉลี่ย < 7 วัน
- Go Phase 5: ≥ 60% โครงงาน active มี ≥ 1 milestone ผ่าน (accepted) → แสดงว่าการติดตามเริ่มมีวินัย
- Go Phase 6: ระบบ Final submission ใช้งานได้และไม่มี blocking bug ในการอ่านไฟล์ใหญ่ (≥10MB)
- Go Phase 7: Events baseline มีอย่างน้อย 8 ประเภทหลักและขนาด log/วัน อยู่ในเกณฑ์ที่ query ได้ < 300ms (index พร้อม)
- Go Phase 8: คะแนนทุก rubric export CSV/PDF ได้ครบ และผู้ใช้หลัก (Advisor/Staff) ไม่มี pain point ด้าน performance ระบุซ้ำ

หมายเหตุการจัดลำดับความสำคัญ (Prioritization Rationale): เน้น "ลดงาน manual + เพิ่มคุณภาพ" ก่อน "การวิเคราะห์เชิงลึก" เพราะต้นทุน context switching ของ Advisor สูง หากเอกสาร/การติดตามไม่เป็นระบบตั้งแต่ Phase ต้น จะได้ข้อมูลดิบที่สกปรก ใช้สร้างรายงานเชื่อถือไม่ได้ใน Phase หลัง.

คำแนะนำสั้นสำหรับทีม Dev: เก็บ Feature Flags (เช่น proposalEnabled, milestonesEnabled) ตั้งแต่ต้น จะช่วยเปิดทดลองย่อยกับกลุ่มเล็กโดยไม่ต้อง branch โค้ดซับซ้อน และบันทึกการเปลี่ยน config ลง event log เพื่อ audit.

### 16.10 Hook Naming (ต่อยอด)
```
useProject(projectId)
useProjectMilestones(projectId)
useProjectArtifacts(projectId, type)
useProjectMeetings(projectId)
useProjectEvaluation(projectId)
useProjectTimeline(projectId)
```

### 16.11 Event Types (Draft)
```
PROJECT_CREATED, MEMBER_ADDED, ADVISOR_ASSIGNED,
PROPOSAL_UPLOADED, PROPOSAL_APPROVED, PROPOSAL_REJECTED,
MILESTONE_SUBMITTED, MILESTONE_ACCEPTED, MILESTONE_REJECTED,
FINAL_UPLOADED, PRESENTATION_SCHEDULED, EVALUATION_SUBMITTED,
PROJECT_COMPLETED, PROJECT_ARCHIVED
```

### 16.12 Validation Highlights
| จุด | เงื่อนไข |
|-----|----------|
| Milestone progress | 0 ≤ progress ≤ 100 |
| Proposal upload | PDF only, size ≤ config |
| Final readiness | มี proposal_approved + milestones accepted ≥ threshold |
| Evaluation | คะแนนรวม ≤ max, rubric_json schema valid |
| Meeting schedule | scheduled_at ≥ now |

### 16.13 ความเสี่ยง (ใหม่)
| ประเภท | รายละเอียด | แนวทางลด |
|--------|-----------|-----------|
| File version drift | นักศึกษาอัปโหลดหลายครั้ง advisor ดูผิดเวอร์ชัน | force latest tag + version label ชัด |
| Milestone spam | เพิ่ม milestone เล็กมากหลายรายการ | impose min interval / advisor approve creation |
| Meeting overload | นัดถี่เกิน | rate limit / weekly cap config |
| Rubric divergence | เปลี่ยน rubric ระหว่างเทอม | version rubric + store snapshot ใน evaluation |

### 16.14 Next Immediate Technical Tasks (Candidate)
1. Migration: project_milestones, project_artifacts (เบื้องต้น)
2. Service skeleton: milestone CRUD + artifact upload
3. Portal UI ปรับเพิ่ม MilestoneSummary (ถ้าไม่มีข้อมูล -> CTA “สร้าง Milestone แรก”)
4. Proposal placeholder endpoint (อัปโหลดเก็บใน artifacts type=proposal)
5. Event logging helper (emit + store in project_events)

### 16.15 Implementation Guidelines
- รักษา pattern controller บาง → service หนัก
- ใช้ transaction เมื่อมี write หลายตาราง (เช่น propose → artifact + event)
- ตั้ง unique composite (project_id, version, type) ใน artifacts (optional)
- ใช้ ENUM ผ่าน validate (ถ้าไม่ปรับ migration) ลด lock schema เวลาพัฒนาเร็ว
- แยกไฟล์อัปโหลดในโฟลเดอร์ `/uploads/projects/<projectCode>/<type>/`

### 16.16 สรุป
ส่วนขยายนี้ช่วยปูทางสู่ Phase ถัด ๆ ไป โดยไม่บีบให้ refactor ใหญ่ในอนาคต (additive strategy) — สามารถเลือก implement ย่อยตาม phase roadmap ได้ทันทีโดยไม่ชนกับ Phase 2 ปัจจุบัน

---
Revision: Phase2 v1.1 (Extended Design Appendix Added)
