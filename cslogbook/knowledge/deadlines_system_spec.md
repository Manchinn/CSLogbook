# ระบบกำหนดการ / เดดไลน์ (Important Deadlines) – สเปกฉบับรวม

เวอร์ชัน: 0.1 (Draft)
ปรับปรุงล่าสุด: 2025-08-29

## 1. เป้าหมาย (Goals)
รองรับการประกาศและควบคุม “กำหนดการ / เดดไลน์” ที่เกี่ยวข้องกับนักศึกษาในทุกกระบวนการ (ฝึกงาน / โครงงาน / เอกสารวิชาการ) โดย:
- แยกประเภทเดดไลน์: ส่งเอกสาร, ยื่นคำร้อง, กิจกรรม, การประกาศ (Announcement Only)
- รองรับช่วงเวลา (window) / วันเดียว / all-day
- รองรับ late submission (มี grace period) และการล็อกหลังพ้นกำหนด
- ผูกกับเอกสาร (documents) หรือขั้นตอน workflow ได้อัตโนมัติ
- รองรับรายการที่ไม่ต้องส่งเอกสาร (manual completion / info only)
- ให้สถานะชัดเจนกับนักศึกษา (pending / in_window / submitted / submitted_late / overdue / locked / announcement)
- สเกลได้ (เพิ่มประเภทใหม่, เพิ่มนโยบาย) และ audit การเปลี่ยนแปลง

## 2. ขอบเขต (Scope)
ในสโคป: รูปแบบข้อมูล deadline, นโยบาย submission, การผูกกับ workflow/documents, API enrichment สำหรับนักศึกษา, manual completion, audit logging.
นอกสโคประยะแรก: ระบบ recurring deadlines, การซิงค์ external calendar (Google), การแจ้งเตือน Push ขั้นสูง (ใช้กลไก reminder agent ที่มีอยู่รองรับช่วงแรก).

## 3. ภาพรวมโมเดลปัจจุบัน (Current State)
ตาราง `important_deadlines` (มีแล้ว) ฟิลด์ใหม่ที่ใช้อยู่:
- deadline_at (อาจ null ถ้าเป็น window)
- window_start_at / window_end_at
- all_day (bool)
- accepting_submissions (bool)
- allow_late (bool)
- lock_after_deadline (bool)
- grace_period_minutes (int)

ตาราง `documents` (มีแล้ว):
- important_deadline_id (เพิ่งเริ่มใช้, บางแถวยัง null)
- submitted_at / status / is_late (บางตรรกะยังไม่สมบูรณ์)

ตาราง workflow ที่เกี่ยวข้อง: `student_workflow_activities`, `workflow_step_definitions` (ใช้กำหนด step_key / workflow_type)

## 4. ช่องว่าง (Gaps)
| หมวด | สิ่งที่ต้องการ | มีแล้ว? | ช่องว่าง |
|-------|-----------------|---------|----------|
ประเภท deadline | ยังไม่มี field แยกประเภท (submission / announcement / manual) | ไม่ | ต้องเพิ่ม ENUM deadline_type |
Mapping workflow/doc | ไม่มีตาราง mapping ทางการ | ไม่ | สร้าง `deadline_workflow_mappings` |
Manual completion | ไม่มีที่เก็บ status นักศึกษาสำหรับ deadline ที่ไม่ใช่ document | ไม่ | สร้าง `student_deadline_statuses` |
Late logic UI | ค่าฟิลด์ allowLate/gracePeriod มี แต่ UI admin ยังไม่เต็ม | บางส่วน | สร้างแบบฟอร์มแก้ไข นโยบาย |
Grace/Late compute | Backend enrich บาง endpoint ยังไม่คำนวณ late/submitted_late สม่ำเสมอ | Partial | รวม logic กลาง service |
Lock enforcement | ยังไม่มี middleware บล็อกการส่งเมื่อ locked | ไม่ | เพิ่ม check ใน document upload service |
Announcement | ใช้ deadline row เหมือนกัน แต่ยังไม่ตีความเฉพาะ | Partial | เพิ่ม deadline_type=ANNOUNCEMENT + flag visibility |
Visibility / publish | ยังไม่มี publish_at / is_published | ไม่ | เพิ่ม field เพื่อรอประกาศทีหลัง |
Audit | ไม่มีบันทึกการแก้ไข deadline | ไม่ | สร้าง `important_deadline_audit_logs` |
Frontend timeline integrate | Timeline ยังไม่แสดง deadline per step | ไม่ | Enrich steps + render badge |
Backfill script | Mapping เอกสารเก่าที่ยัง null | ไม่ | เขียนสคริปต์ / migration เพิ่ม |
API student unified | นักศึกษาต้องเรียกหลาย endpoint | Partial | รวม GET /students/important-deadlines (enriched) |

## 5. คุณสมบัติที่ต้องเพิ่ม (Required Features)
### 5.1 Deadline Types (ENUM)
```
deadline_type ENUM('SUBMISSION','ANNOUNCEMENT','MANUAL','MILESTONE')
```
ความหมาย:
- SUBMISSION: ผูก document หรือ workflow step และคาดหวัง submitted_at
- ANNOUNCEMENT: แจ้งเฉพาะวัน/ช่วง ไม่มี submission
- MANUAL: ต้องให้เจ้าหน้าที่ mark complete ต่อ student (เช่น เข้าร่วมปฐมนิเทศ)
- MILESTONE: ใช้เป็นเหตุการณ์กลาง (อาจกระทบ logic eligibility แต่ไม่ต้องส่งไฟล์)

### 5.2 Mapping Workflow/Documents
ตารางใหม่ `deadline_workflow_mappings`:
| คอลัมน์ | ชนิด | หมายเหตุ |
|---------|------|----------|
id | PK | |
important_deadline_id | FK | ไปที่ important_deadlines |
workflow_type | ENUM('internship','project1','project2') | |
step_key | VARCHAR(255) | nullable ถ้า match ด้วย document_subtype |
document_subtype | VARCHAR(100) | nullable |
auto_assign | ENUM('on_create','on_submit','on_approve') | default 'on_submit' |
active | BOOLEAN | default true |
UNIQUE (workflow_type, step_key, document_subtype)

การทำงาน: เมื่อมีการสร้าง/อัปเดต document หรือ workflow step เปลี่ยนสถานะ → service ตรวจ mapping ถ้า document.importance_deadline_id ว่าง ให้ assign

### 5.3 Manual Completion
ตาราง `student_deadline_statuses`:
| คอลัมน์ | ชนิด |
| student_deadline_status_id | PK |
| student_id | FK(Student) |
| important_deadline_id | FK |
| status | ENUM('pending','completed','exempt','late') |
| completed_at | DATETIME NULL |
| completed_by | INT NULL (admin staff) |
| note | TEXT NULL |
| created_at/updated_at | DATETIME |
UNIQUE(student_id, important_deadline_id)

### 5.4 Audit Log
ตาราง `important_deadline_audit_logs`:
| id | PK |
| important_deadline_id | FK |
| action | ENUM('CREATE','UPDATE','DELETE','PUBLISH','UNPUBLISH') |
| changed_by | INT (admin user) |
| diff | JSON (before/after) |
| created_at | DATETIME |

### 5.5 การคำนวณสถานะ (Status Model)
นิยามเวลา:
- effectiveDeadlineAt = window_end_at || deadline_at
- windowStart = window_start_at (ถ้า null ถือว่าไม่มี window)
- graceEnd = allow_late ? effectiveDeadlineAt + grace_period_minutes : effectiveDeadlineAt

สถานะ (priority สูง→ต่ำ):
1. submitted (ในเวลา / ก่อน locked)
2. submitted_late (submitted_at > effectiveDeadlineAt && submitted_at <= graceEnd)
3. locked (lock_after_deadline && now > graceEnd && ยังไม่ส่ง)
4. overdue (now > effectiveDeadlineAt && now <= graceEnd และยังไม่ส่ง)
5. in_window (now >= windowStart && now <= effectiveDeadlineAt)
6. upcoming (now < windowStart หรือ (ไม่มี window และ now < effectiveDeadlineAt))
7. announcement (deadline_type=ANNOUNCEMENT)

### 5.6 API (Proposed / รวมกับที่มี)
Admin:
- POST /api/important-deadlines
- PUT /api/important-deadlines/:id
- PATCH /api/important-deadlines/:id/publish (body:{published:true/false})
- GET /api/important-deadlines (filter: academicYear, type, published)
- GET /api/important-deadlines/:id/audit

Student:
- GET /api/students/important-deadlines (คืน array enriched + mapping submission)
- POST /api/students/deadlines/:id/manual/complete (เฉพาะ MANUAL) 
- GET /api/students/deadlines/calendar (แยกตามเดือน + windows expansion)

Internal Service Hooks:
- documentService.assignDeadlineIfMapped(document)
- workflowService.onStepStatusChange(studentId, stepKey, newStatus) → deadline auto-assign

### 5.7 Enrichment Response (ตัวอย่าง JSON)
```
{
  "id": 15,
  "name": "ส่งคำร้อง คพ.05",
  "deadlineType": "SUBMISSION",
  "windowStartAt": "2025-08-20T00:00:00Z",
  "windowEndAt": "2025-08-27T16:00:00Z",
  "effectiveDeadlineAt": "2025-08-27T16:00:00Z",
  "allDay": false,
  "policies": {
    "allowLate": true,
    "gracePeriodMinutes": 1440,
    "lockAfterDeadline": true
  },
  "submission": {
    "linked": true,
    "documentId": 123,
    "submittedAt": "2025-08-26T10:15:00Z",
    "status": "submitted"
  },
  "status": "submitted",
  "daysLeft": 0,
  "related": "internship",
  "mapping": {
    "workflowType": "internship",
    "stepKey": "INTERNSHIP_CS05_APPROVED",
    "documentSubtype": "CS05_FORM"
  }
}
```

### 5.8 การบังคับใช้ Lock
ใน document upload/update service:
1. โหลด deadline (สำคัญ: include policy)
2. now > (allowLate ? effectiveDeadlineAt+grace : effectiveDeadlineAt) && lockAfterDeadline → throw 423 Locked
3. ถ้า now > effectiveDeadlineAt และ <= graceEnd → mark isLate tentative (หรือรอ review)

### 5.9 Manual Completion Flow
1. นักศึกษาเข้าหน้า deadline (MANUAL) → กด “ยืนยันเข้าร่วม” (optional) หรือเจ้าหน้าที่ใน backend panel mark complete
2. สร้าง/อัปเดต row ใน student_deadline_statuses (status=completed, completed_at=NOW, completed_by=admin หรือ null ถ้า self)
3. Enrichment endpoint รวมสถานะนี้

### 5.10 Announcement Deadlines
เงื่อนไข: deadline_type=ANNOUNCEMENT, ไม่เปิด accepting_submissions.
สถานะแสดง: announcement (ไม่เข้าสูตร overdue/locked)
แสดงเฉพาะเวลาที่สำคัญ (window ถ้ามี)

## 6. Roadmap (Incremental)
| ระยะ | รายการ | รายละเอียดหลัก |
|------|--------|-----------------|
Phase 1 | Mapping + Enrichment | ตาราง mapping, enrich student deadlines (เอกสาร already) |
Phase 2 | Manual + Announcement | เพิ่มตาราง manual status + deadline_type + UI admin fields |
Phase 3 | Lock & Late Enforcement | Middleware/upload guard + late status calc กลาง |
Phase 4 | Timeline Integration | Enrich workflow steps ด้วย deadline + badge ใน TimelineItems |
Phase 5 | Audit & Publish Control | Audit log + publish/unpublish + visibility ฟิลด์ |
Phase 6 | UX Enhancements | Calendar view หน้ารวม + filter + legend |

## 7. ฟิลด์ใหม่ที่ต้องเพิ่มใน important_deadlines
| Field | Type | หมายเหตุ |
| deadline_type | ENUM | ดู 5.1 |
| is_published | BOOLEAN | default false |
| publish_at | DATETIME NULL | เวลาเผยแพร่ (ใช้ schedule) |
| visibility_scope | ENUM('ALL','INTERNSHIP_ONLY','PROJECT_ONLY','CUSTOM') | ขอบเขตการเห็น |
| related_to (ปรับปรุง) | ENUM('internship','project','project1','project2','general') | รวม related_workflow เดิม + เพิ่ม project1/project2 (project legacy) |

## 8. การคำนวณ daysLeft (มาตรฐาน)
```
if now <= effectiveDeadlineAt:
  daysLeft = ceil((effectiveDeadlineAt - now)/86400)
else:
  daysLeft = 0 (หรือค่าลบถ้าต้องแยก overdue)
```

## 9. จุด Integration กับ Agents (Reminder)
ปรับ `deadlineReminderAgent` ให้รองรับ:
- Announcement: ส่งแจ้งเตือนครั้งเดียวก่อนวันจริง X วัน
- Submission: ส่งก่อนเปิด window, ตอนเปิด, 3 วันก่อนปิด, วันสุดท้าย, เข้าสู่ late window (ถ้ามี)

## 10. Risk & Mitigation
| ความเสี่ยง | ผลกระทบ | บรรเทา |
|-------------|----------|--------|
Mapping ผิด step | นักศึกษาไม่ได้ผูก submission → overdue ปลอม | เพิ่ม health check script ตรวจ deadlines ที่ควรมี submission แต่ไม่มี |
Late policy สับสน | ผู้ใช้ไม่เข้าใจ “late vs locked” | เพิ่ม legend + tooltip + คู่มือ |
Migration ผิดพลาด | ข้อมูลเดิมหาย | Backup ตารางก่อน ALTER / CREATE |
Performance join | Enrichment ช้าเมื่อหลาย deadline | เพิ่ม composite index (important_deadline_id, student_id) ใน documents, student_deadline_statuses |

## 11. ขั้นตอน Migration (สรุป)
1. ALTER TABLE important_deadlines ADD COLUMN deadline_type ... พร้อม default 'SUBMISSION'
2. สร้างตาราง deadline_workflow_mappings
3. สร้างตาราง student_deadline_statuses
4. สร้างตาราง important_deadline_audit_logs
5. เติมค่า deadline_type สำหรับแถวประกาศ (กรณีที่มี) → 'ANNOUNCEMENT'
6. Backfill mapping เริ่มต้น (CS05, ACCEPTANCE_LETTER ฯลฯ)
7. Backfill documents ตั้ง important_deadline_id ที่ยัง null ตาม mapping
8. ทดสอบ enrichment endpoint

## 12. ตัวอย่าง Mapping เริ่มต้น (Draft)
| important_deadline_id | workflow_type | step_key                         | document_subtype       | auto_assign |
|-----------------------|---------------|----------------------------------|------------------------|------------|
14 | internship | INTERNSHIP_CS05_APPROVED | CS05_FORM | on_submit |
15 | internship | INTERNSHIP_COMPANY_RESPONSE_PENDING | ACCEPTANCE_LETTER | on_approve |
16 | internship | (ภายหลัง: REFERRAL_LETTER_READY) | REFERRAL_LETTER | on_generate |

หมายเหตุ: ค่า 16 ต้องสร้าง deadlineใหม่ + stepKey จริงหลังนิยามใน workflow.

## 13. Glossary
- Effective Deadline: เวลาตัดสินหลัก (window_end หรือ deadline_at)
- Grace Period: ช่วงอนุโลมการส่งหลัง deadline หลัก
- Locked: สถานะที่ไม่ยอมรับ submission ใหม่ (ยกเว้น staff override)
- Manual Completion: เดดไลน์ที่ต้องติ๊กสำเร็จ ไม่ได้แนบไฟล์

## 14. NEXT ACTION (เพื่อเริ่ม Phase 1)
1. ยืนยันตารางและ ENUM deadline_type
2. ส่งรายการ mapping ที่สมบูรณ์ (จากคุณ) → เติมในไฟล์ seed/migration
3. เขียน migration + service assign logic
4. ปรับ importantDeadlineController.getAllForStudent → รวม manual + announcement + submission status
5. เพิ่ม health check script ตรวจ anomalies

---
รอรายการ mapping ที่สมบูรณ์และการยืนยัน ENUM/ตารางก่อนเริ่มลงมือพัฒนา.

---

## ภาคผนวก A: Migration Progress Log
อัปเดต 2025-08-29

เสร็จแล้ว (Applied):
- เพิ่มคอลัมน์ deadline_type, is_published, publish_at, visibility_scope, related_workflow ใน important_deadlines (เดิม)
- รวม related_workflow -> related_to และลบคอลัมน์ related_workflow (migration 20250829120000)
- สร้างตาราง deadline_workflow_mappings
- สร้างตาราง student_deadline_statuses
- สร้างตาราง important_deadline_audit_logs
- สำรองและลบตาราง legacy timeline_steps → ย้ายข้อมูลไป timeline_steps_backup

ตรวจสอบ Schema (describe) ผ่าน: OK – ไม่มีคอลัมน์ตกหล่น

ยังไม่ทำ (Pending):
- เติม seed สำหรับ deadline_workflow_mappings (mapping จริง)
- Backfill documents ที่ยัง important_deadline_id IS NULL (รอ mapping)
- Logic assignDeadlineIfMapped ใน document/workflow service
- Enrichment รวม manual + announcement + submission ใน endpoint นักศึกษา
- Health check script / audit log write logic

บล็อกเกอร์ (ถ้ามี): รอรายการ mapping ที่สมบูรณ์จากผู้ใช้

## ภาคผนวก B: Checklist สถานะล่าสุด
| รายการ | สถานะ | หมายเหตุ |
|--------|-------|-----------|
เพิ่มคอลัมน์ deadline_type ฯลฯ | Done | Migration 20250829100000 |
ตาราง mapping | Done | ว่างรอ seed |
รวม related_workflow -> related_to | Done | Merge migration 20250829120000 |
ตาราง manual status | Done | พร้อมใช้งาน |
ตาราง audit logs | Done | ยังไม่มี logic บันทึก |
ลบ timeline_steps | Done | สำรองไว้เป็น *_backup |
Seed mapping เริ่มต้น | Pending | รอข้อมูล mapping จริง |
Backfill documents | Pending | ต้องการ mapping |
Assign service hook | Pending | จะเพิ่มหลัง seed |
Enrichment รวมสถานะ | Pending | Phase 1 ต่อ |
Health check script | Pending | หลัง backfill |
Audit write logic | Pending | หลัง controller/service ปรับ |

