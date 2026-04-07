# Database Audit — CSLogbook

**วันที่ตรวจ:** 2026-04-07
**ตรวจโดย:** Claude Code (parallel agents × 4)
**Models ทั้งหมด:** 45

---

## สรุป

| Status | จำนวน | % |
|--------|-------|---|
| ACTIVE | 36 | 80% |
| ASSOCIATION-ONLY | 4 | 9% |
| UNUSED | 5 | 11% |

---

## UNUSED Models — ยังไม่ตัดสินใจลบ

| Model | Table Name | สาเหตุที่คิดว่า unused | หมายเหตุ |
|-------|-----------|----------------------|----------|
| `ProjectEvent` | `project_events` | ไม่มี service/controller ใช้ | อาจเป็น feature ที่วางแผนไว้ (event tracking) |
| `TeacherProjectManagement` | `teacher_project_managements` | ไม่มี service/controller ใช้ | อาจเป็น advisor assignment UI ที่ยังไม่ implement |
| `StudentProgress` | `student_progresses` | ไม่มี service/controller ใช้ | อาจเป็น progress tracking feature |
| `studentWorkflowActivity` | `student_workflow_activities` | Model มี แต่ไม่ถูก query จาก business logic | ส่วนหนึ่งของ workflow engine ที่ยังไม่เสร็จ |
| `workflowStepDefinition` | `workflow_step_definitions` | เฉพาะ internal method ไม่มี external usage | คู่กับ studentWorkflowActivity |

### ถ้าจะลบในอนาคต

1. ตรวจสอบว่า production DB มีข้อมูลใน tables เหล่านี้หรือไม่
2. ลบ model files
3. สร้าง migration DROP TABLE
4. ลบ associations ใน models ที่ reference ถึง
5. ลบจาก `models/index.js` (ถ้ามี explicit import)

---

## ASSOCIATION-ONLY Models — มี model แต่ไม่ query ตรง

| Model | Table Name | Association จาก | หมายเหตุ |
|-------|-----------|-----------------|----------|
| `InternshipLogbookAttachment` | `internship_logbook_attachments` | InternshipLogbook.hasMany | อาจถูก eager-load ผ่าน `include` |
| `InternshipLogbookRevision` | `internship_logbook_revisions` | InternshipLogbook.hasMany | อาจถูก eager-load ผ่าน `include` |
| `SystemLog` | `system_logs` | User association | ไม่มี CRUD ใน services |
| `TimelineStep` | `timeline_steps` | — | ใช้แค่ใน seed script |

### หมายเหตุ
- **อย่าลบ association-only models** โดยไม่ตรวจสอบ `include` ใน queries — อาจถูก eager-load โดย parent model
- `SystemLog` อาจใช้ใน production logging ที่ไม่ผ่าน Sequelize service layer

---

## ACTIVE Models (36 ตัว)

### Core (10)
User, Student, Teacher, Admin, Academic, Curriculum, Document, DocumentLog, Notification, NotificationSetting

### Internship (7)
InternshipDocument, InternshipLogbook, InternshipLogbookReflection, InternshipEvaluation, InternshipCertificateRequest, ApprovalToken, UploadHistory

### Project (10)
ProjectDocument, ProjectMember, ProjectTrack, ProjectWorkflowState, ProjectExamResult, ProjectDefenseRequest, ProjectDefenseRequestAdvisorApproval, ProjectTestRequest, ProjectArtifact, ProjectMilestone

### Meeting + Other (9)
Meeting, MeetingLog, MeetingParticipant, MeetingAttachment, MeetingActionItem, ImportantDeadline, DeadlineWorkflowMapping, StudentAcademicHistory, PasswordResetToken

---

## FK Cascade Analysis

**สถานะ:** ไม่มี association ไหนระบุ `onDelete` → MySQL default = **RESTRICT**

**RESTRICT = ปลอดภัย** — ป้องกันลบ parent ที่มี child อ้างอิง ไม่เกิด orphaned records

**ไม่แนะนำให้เพิ่ม CASCADE** เพราะ:
- ระบบมี audit trail (DocumentLog, SystemLog)
- `projectPurgeScheduler` จัดการ manual cascade สำหรับ archived projects อยู่แล้ว
- CASCADE อาจทำให้ลบข้อมูลโดยไม่ตั้งใจ (ลบ project → meetings/logs หายหมด)
