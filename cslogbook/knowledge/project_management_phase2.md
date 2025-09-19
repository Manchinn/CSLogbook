# Project Management (Phase 2) – โครงงานพิเศษ (ProjectDocument Lifecycle)

> เอกสารนี้สรุปสถาปัตยกรรม, โมเดลข้อมูล, business rules, endpoint contracts, frontend integration และ test coverage ของ Phase 2 (ระบบจัดการโครงงานพิเศษ) ณ วันที่จัดทำ (Sep 2025)

## 1. วัตถุประสงค์ (Objective)
Phase 2 เพิ่มความสามารถให้นักศึกษาที่ผ่านเกณฑ์ (eligible) สามารถ:
- สร้างโครงงาน (draft) พร้อมสถานะ lifecycle
- จำกัดจำนวนสมาชิก 2 คน (leader + member)
- กำหนดข้อมูลเบื้องต้น (ชื่อ TH/EN, ประเภท, track, advisor, co-advisor)
- Promote โครงงานสู่สถานะ in_progress เมื่อครบเงื่อนไขพร้อมดำเนินการ
- (เตรียมทาง) สำหรับสถานะ completed / archived ใน Phase ถัดไป

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
7. Metadata Lock: หลัง status ≥ in_progress (in_progress, completed, archived) ฟิลด์ชื่อ / type / track / advisor ถูกล็อค
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

---
Revision: Phase2 v1.0 (Initial Documentation)
