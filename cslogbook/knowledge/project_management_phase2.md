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

Readiness Baseline v1:
1. มีชื่อ TH & EN
2. มี advisorId

Response Fields (หลัก): projectId, projectCode, titleTh, titleEn, status, advisor { teacherId, name }, coAdvisor, members[{ studentId, studentCode, name, role }], memberCount, readiness{...}, updatedAt, createdAt

Service: `services/topicExamService.js` (map + readiness heuristic)
Controller: `controllers/topicExamController.js`
Route: `routes/topicExamRoutes.js` (mount: `/api/projects/topic-exam`)
Frontend: `/teacher/topic-exam/overview` (AntD Table + filters)
Sidebar Integration: เพิ่มเมนู `Topic Exam Overview` สำหรับ role teacher

Tests เพิ่ม:
- Unit: `tests/unit/topicExamService.unit.test.js` (ตรวจ mapping & readyOnly)
- Integration: `tests/integration/topicExamOverview.integration.test.js` (ครอบ 403 student / 200 teacher – ปัจจุบันยอมรับ 500 ชั่วคราวถ้า DB ไม่มี seed)

Logging (Winston):
- `[TopicExam] overview request start|success|error` (route)
- `[TopicExamService] findAll error:` + message
- `[TopicExamService] overview result size=<n>`

Roadmap ถัดไป (สั้น): เพิ่ม pagination, ปี/ภาคเรียน filter, export CSV, auto grouping session.

---
Revision: Phase2 v1.0 (Initial Documentation)

---

## 16. ส่วนขยายการออกแบบ (Extended Design – Draft สำหรับ Phase 3+)
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
