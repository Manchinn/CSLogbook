# INITIAL_DATA_REFERENCE – เอกสารข้อมูลตั้งต้นของระบบ CSLogbook

> วัตถุประสงค์: รวมรายการ "ข้อมูลตั้งต้น (Initial / Seed / Reference Data)" ทั้งหมดที่ระบบต้องมีหรือคาดหวังตั้งแต่เริ่ม deploy เพื่อให้ทีม Dev / Ops / QA / Analyst ทบทวนความครบถ้วน, reproduce ได้, และวางแผนอัปเดตในอนาคตได้ง่าย
>
> สถานะไฟล์: Draft (กรุณาเติม TODO ให้ครบ)  
> ผู้ดูแลหลัก: TODO: ใส่ชื่อ/ทีมรับผิดชอบ

---
## 1. Scope & Boundary
อธิบายสิ่งที่นับเป็นข้อมูลตั้งต้นในระบบนี้ (ไม่ใช่ข้อมูล runtime ของผู้ใช้) เช่น lookup, template, role, deadline เส้นฐาน, workflow status, email template, evaluation form, ฯลฯ

- รวม Environment Variables ที่กำหนด behavior ระบบ? (ระบุว่าเฉพาะตัวที่จำเป็นต่อ logic)
- ไม่รวมข้อมูลที่ผู้ใช้สร้างระหว่างการใช้งาน (ยกเว้นกรณีต้อง seed ตัวอย่าง)
- รวมสิ่งที่ migrate/seeder จัดการ + สิ่งที่ต้อง manual import แรกเริ่ม

TODO: สรุปขอบเขต

---
## 2. ระบบย่อย (Domain Overview)
| Domain | คำอธิบาย | ตาราง/ไฟล์หลัก | ความสำคัญ (Critical/High/Med/Low) | Owner |
|--------|-----------|-----------------|----------------------------------|-------|
| Auth & Roles | จัดการผู้ใช้และสิทธิ์ | users, teachers, admins, approval_tokens | Critical | TODO |
| Academic Structure | ปีการศึกษา/หลักสูตร/รายวิชา | curriculums, academics, student_academic_histories | High | TODO |
| Deadlines | กำหนดการทางวิชาการ/โครงงานพิเศษ/ฝึกงาน | important_deadlines (และ fields เพิ่มจาก migrations ล่าสุด) | High | TODO |
| Internship | แบบประเมิน/บริษัท/สถานะฝึกงาน | internship_logbooks, internship_evaluations, internship_documents, internship_certificate_requests | High | TODO |
| Project/Capstone | Milestones/ประเภทโครงงาน | timeline_steps, project_documents, project_members | Medium | TODO |
| Workflow Status | ค่าคงที่ของขั้นตอน/สถานะ | workflow_step_definitions, student_workflow_activities | Critical | TODO |
| Notification & Email | Template & ช่องทาง | notification_settings, (email_templates - ถ้ามีในอนาคต) | High | TODO |
| Documents/Templates | ไฟล์แม่แบบ PDF/ฟอร์ม | documents, document_logs, backend/templates/* | Medium | TODO |
| Background Agents | Schedule / Policy | agents/* (eligibilityUpdater), system_logs | Medium | TODO |
| Security Policies | Password/JWT/RateLimit | password_reset_tokens, config/jwt.js, middleware/rateLimiter.js | Critical | TODO |

---
## 3. Inventory Table (Master List)
รายการรวบรวมทั้งหมดในรูปแบบแถวต่อหน่วยข้อมูลตั้งต้น (อาจขยายตารางเพิ่มได้)  
ให้คง idempotent: seed ซ้ำได้โดยไม่ duplication

| Code/Slug | ชื่อ | คำอธิบาย | แหล่งที่มา (manual/script) | ที่จัดเก็บ (DB Table/File Path) | วิธี seed (migration/seeder/manual) | เปลี่ยนบ่อย? (Y/N/Per Term) | Owner | Risk หากหาย | หมายเหตุ |
|-----------|------|-----------|-----------------------------|---------------------------------|------------------------------------|-------------------------------|-------|--------------|---------|
| ROLE_ADMIN | บทบาทผู้ดูแล | สิทธิ์เต็มระบบ | manual / migration (ตรวจ) | users/roles | seeder/manual | N | TODO | Access Control สูญเสีย | ต้องยืนยันกลไกสร้าง |
| CURR_CS63 | หลักสูตร CS 63 | หลักสูตรปี 2563 | seeder `create-default-curriculum` | curriculums | seeder | Low | TODO | Mapping credit ผิด | active=true |
| CURR_CS68 | หลักสูตร CS 68 | หลักสูตรปี 2568 | seeder `create-default-curriculum` | curriculums | seeder | Low | TODO | Mapping credit ผิด | require internship before project |
| ACADEMIC_DEFAULT | Academic baseline | academic year/semester เริ่มต้น | seeder `create-default-curriculum` | academics | seeder | Per Term | TODO | Term logic ผิด | active_curriculum_id set |
| WF_INT_ELIGIBLE | Internship step 1 | INTERNSHIP_ELIGIBILITY_MET | seeder `initial-internship-steps` | workflow_step_definitions | seeder | Rare | TODO | Workflow UI ล่ม | step_order=1 |
| WF_INT_CS05_SUBMITTED | Internship step 2 | INTERNSHIP_CS05_SUBMITTED | seeder | workflow_step_definitions | seeder | Rare | TODO | Tracking ผิด |  |
| WF_INT_CS05_APPROVAL_PENDING | Internship step 3 | INTERNSHIP_CS05_APPROVAL_PENDING | seeder | workflow_step_definitions | seeder | Rare | TODO | Tracking ผิด |  |
| WF_INT_CS05_APPROVED | Internship step 4 | INTERNSHIP_CS05_APPROVED | seeder | workflow_step_definitions | seeder | Rare | TODO | ขั้นถัดไปไม่เริ่ม |  |
| WF_INT_COMPANY_RESPONSE_PENDING | Internship step 5 | INTERNSHIP_COMPANY_RESPONSE_PENDING | seeder | workflow_step_definitions | seeder | Rare | TODO | ติดค้าง |  |
| WF_INT_COMPANY_RESPONSE_RECEIVED | Internship step 6 | INTERNSHIP_COMPANY_RESPONSE_RECEIVED | seeder | workflow_step_definitions | seeder | Rare | TODO | ตีความผิด |  |
| WF_INT_AWAITING_START | Internship step 7 | INTERNSHIP_AWAITING_START | seeder | workflow_step_definitions | seeder | Rare | TODO |  |  |
| WF_INT_IN_PROGRESS | Internship step 8 | INTERNSHIP_IN_PROGRESS | seeder | workflow_step_definitions | seeder | Rare | TODO | สถานะไม่อัปเดต |  |
| WF_INT_SUMMARY_PENDING | Internship step 9 | INTERNSHIP_SUMMARY_PENDING | seeder | workflow_step_definitions | seeder | Rare | TODO | ปิดงานช้า |  |
| WF_INT_COMPLETED | Internship step 10 | INTERNSHIP_COMPLETED | seeder | workflow_step_definitions | seeder | Rare | TODO | ไม่รู้ว่าจบ |  |
| NOTIF_LOGIN | แจ้งเตือนเข้าสู่ระบบ | ประเภท LOGIN disabled default | seeder `seed-notification-settings-default` | notification_settings | seeder | Config | TODO | ไม่รู้กิจกรรม login | default is_enabled=false |
| NOTIF_DOCUMENT | แจ้งเตือนเอกสาร | ประเภท DOCUMENT | seeder | notification_settings | seeder | Config | TODO | พลาดอัปเดต | default disabled |
| NOTIF_LOGBOOK | แจ้งเตือน logbook | ประเภท LOGBOOK | seeder | notification_settings | seeder | Config | TODO | พลาดการติดตาม | default disabled |
| NOTIF_EVALUATION | แจ้งเตือนการประเมิน | ประเภท EVALUATION | seeder | notification_settings | seeder | Config | TODO | ไม่ทราบผลประเมิน | default disabled |
| NOTIF_APPROVAL | แจ้งเตือนอนุมัติ | ประเภท APPROVAL | seeder | notification_settings | seeder | Config | TODO | ล่าช้า approval | default disabled |
| INT_EVAL_STUDENT32 | ตัวอย่าง evaluation | Internship evaluation (demo) | seeder `seed-internship-evaluation-student32` | internship_evaluations | seeder | N | TODO | data ตัวอย่างหาย | เฉพาะ dev/testing |
| TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO | TODO |

(เพิ่มแถวต่อเนื่อง)

---
## 4. รายละเอียดเชิงลึกตามหมวด
จัดทำ subsections ต่อไปนี้ (ตัวอย่าง skeleton ให้คงไว้แล้วค่อยเติมเนื้อหา)

### 4.1 Auth & Roles
- ตารางเกี่ยวข้อง: `users`, `roles`, `user_roles`, `permissions` (หากมี)
- รายการ role เริ่มต้น + คำอธิบายหน้าที่
- Permission Matrix (อาจแนบภาคผนวก)
- วิธีสร้าง admin เริ่มต้น
- Validation พิเศษ: password policy, unique email

TODO: เติมรายละเอียด

### 4.2 Academic Structure
- ปีการศึกษา/เทอม (format เช่น 2025/1)
- หลักสูตร (curriculum) + mapping รายวิชา
- Deadlines เชิงวิชาการเริ่มต้น (เช่น ลงทะเบียน, เพิ่ม/ถอน)

รายละเอียด seeders เกี่ยวข้อง:
- `create-default-curriculum` (2 ไฟล์ timestamp 20250428080912 / 20250428081219) -> เพิ่ม 2 หลักสูตร (CS2563, CS2568) และตั้งค่า academics แรกเริ่ม (current_semester=1, academic_year=2567) + active_curriculum_id
- Migration เสริม credits / short_name / max_credits (ดู migrations หลายไฟล์ add_*_to_curriculums)

ประเด็นสำคัญ:
1. ต้องมีอย่างน้อย 1 curriculum active สำหรับ mapping นักศึกษาใหม่
2. ตาราง `academics` เก็บ active_curriculum_id + term flags (internship_semesters, project_semesters)
3. การเปลี่ยนเทอมใหม่: update academics.is_current / academic_year / current_semester

TODO:
- ใส่ตัวอย่าง record academics ปัจจุบัน
- ระบุ process เปลี่ยนเทอม (manual script หรือ UI?)

### 4.3 Deadlines & Important Dates
- ใช้ตารางอะไร (เช่น `important_deadlines`?)
- รูปแบบ field: name, type, start_at, end_at, term, academic_year
- นโยบายอัปเดต: per term / manual admin UI / script

ตารางหลัก: `important_deadlines`

สรุป schema (อ้างอิง model + migrations ล่าสุด):
| Column | Type | Null? | Default | หมายเหตุ |
|--------|------|-------|---------|----------|
| id | INT PK AI | NO | - | primary key เดี่ยว (ไม่ใช้ important_deadline_id) |
| name | STRING(255) | NO | - | ชื่อ deadline |
| date | DATEONLY | NO | - | วันที่หลัก (กรณี allDay) |
| related_to | ENUM(internship,project,project1,project2,general) | NO | - | รวม relatedWorkflow เดิม |
| academic_year | STRING(10) | NO | - | พ.ศ. หรือ format string |
| semester | INT | NO | - | 1/2/3 |
| is_global | BOOLEAN | YES | true | ใช้ข้ามสCOPE ย่อย |
| deadline_at | DATETIME | YES | null | ใช้เมื่อมีเวลาชัด (precision) |
| timezone | STRING(64) | NO | 'Asia/Bangkok' | สำหรับ interpret deadline_at |
| description | TEXT | YES | null | คำอธิบาย |
| is_critical | BOOLEAN | NO | false | ถ้า true ต้องการแจ้งเตือนพิเศษ |
| notified | BOOLEAN | NO | false | Flag ส่งแจ้งเตือนทั่วไปแล้ว |
| critical_notified | BOOLEAN | NO | false | Flag ส่งแจ้งเตือน critical แล้ว |
| accepting_submissions | BOOLEAN | NO | true | ยังรับส่งงานอยู่ |
| allow_late | BOOLEAN | NO | true | รับงานล่าช้า (ใช้ gracePeriod) |
| lock_after_deadline | BOOLEAN | NO | false | ถ้า true ปิดหลังหมดเวลา+grace |
| grace_period_minutes | INT | YES | null | นาทีอนุโลม |
| window_start_at | DATETIME | YES | null | ใช้สำหรับช่วงกิจกรรมหลายวัน |
| window_end_at | DATETIME | YES | null | ใช้สำหรับช่วงกิจกรรมหลายวัน |
| all_day | BOOLEAN | NO | false | ใช้ date เดียว/ไม่ระบุเวลา |
| deadline_type | ENUM(SUBMISSION,ANNOUNCEMENT,MANUAL,MILESTONE) | NO | SUBMISSION | จำแนกชนิด |
| is_published | BOOLEAN | NO | false | student เห็นเมื่อ true |
| publish_at | DATETIME | YES | null | กำหนด auto publish (optional) |
| visibility_scope | ENUM(ALL,INTERNSHIP_ONLY,PROJECT_ONLY,CUSTOM) | NO | ALL | จำกัดกลุ่มผู้เห็น |
| created_at/updated_at | TIMESTAMP | NO | now | Sequelize timestamps |

แนวทางออกแบบ / กฎ:
1. (academic_year, semester, related_to, name) ไม่ unique แต่ควรหลีกเลี่ยงซ้ำ semantics
2. ใช้ is_published + publish_at เพื่อรองรับ staged release ของ deadline
3. ถ้าต้องการ extended period: set accepting_submissions=false หลังปิด เพื่อ UI แสดงสถานะ
4. grace_period_minutes ทำงานเมื่อ allow_late=true และ lock_after_deadline=true
5. window_start_at/window_end_at > ใช้คู่กับ all_day=false สำหรับ event multi-day

TODO:
- เพิ่ม event lifecycle diagram
- ระบุ cron/agent ที่จะ flip notified/critical_notified
- Mapping ไปยังหน้า UI ที่เกี่ยวข้อง

### 4.4 Internship Master Data
- แบบประเมิน (evaluation form structure) เก็บ JSON หรือแยกตาราง? Path?
- สถานะขั้นตอนฝึกงาน (application -> approval -> reporting -> evaluation)
- รายการบริษัทตั้งต้น (จำเป็นหรือไม่?)

ตารางหลักเกี่ยวข้อง:
- `internship_documents` (บันทึกเอกสาร+สถานประกอบการ)
- `internship_logbooks` (บันทึกประจำวัน)
- `internship_logbook_attachments`, `internship_logbook_revisions`
- `internship_evaluations` (การประเมิน)
- `workflow_step_definitions` (อธิบายขั้นตอน process ฝึกงาน)

สรุป schema ย่อ (สำคัญที่ใช้ใน initial data context):

`internship_documents`
| Column | Type | Null? | Note |
|--------|------|-------|------|
| internship_id | INT PK | NO | ใช้เชื่อมทุกส่วน |
| document_id | INT FK documents | NO | เอกสารอ้างอิง (CS05 ฯลฯ) |
| company_name | STRING(255) | NO | ชื่อสถานประกอบการ |
| company_address | TEXT | NO |  |
| internship_position | STRING(100) | YES | ตำแหน่งฝึกงาน |
| contact_person_name/position | STRING(100) | YES | ผู้ประสานงาน |
| supervisor_name/position/phone/email | STRING | YES | ข้อมูลพี่เลี้ยง |
| start_date / end_date | DATEONLY | NO | ช่วงฝึกงาน |
| academic_year / semester | INT/TINYINT | YES | snapshot เวลา submit |
| created_at/updated_at | TIMESTAMP | NO |  |

`internship_logbooks`
| Column | Type | Null? | Note |
|--------|------|-------|------|
| log_id | INT PK | NO |  |
| internship_id | INT FK | NO |  |
| student_id | INT FK | NO |  |
| academic_year / semester | INT | NO | snapshot เทอมของ log |
| work_date | DATEONLY | NO | วันที่ทำงาน |
| log_title | STRING | NO | หัวข้อ |
| work_description / learning_outcome | TEXT | NO | เนื้อหา |
| problems / solutions | TEXT | YES |  |
| work_hours | DECIMAL(4,2) | NO | ชั่วโมงทำงาน |
| time_in / time_out | STRING(5) | YES | HH:MM |
| supervisor_comment | TEXT | YES |  |
| supervisor_approved (int) | INT (0/1/2) | YES | 0 pending, 1 approve, 2 reject (ตีความ) |
| supervisor_approved_at / supervisor_rejected_at | DATETIME | YES | timestamp action |
| advisor_comment | TEXT | YES |  |
| advisor_approved | BOOLEAN | YES | default false |

`internship_evaluations`
| Column | Type | Null? | Note |
|--------|------|-------|------|
| evaluation_id | INT PK | NO |  |
| approval_token_id | INT FK | YES | เชื่อม token สำหรับ external supervisor |
| internship_id | INT FK | NO |  |
| student_id | INT FK | NO |  |
| evaluator_name | STRING | YES | ชื่อผู้ประเมิน |
| evaluation_date | DATETIME | NO | default now |
| overall_score | DECIMAL(5,2) | YES | คะแนนรวม |
| strengths / weaknesses_to_improve / additional_comments | TEXT | YES | คำอธิบาย |
| status | STRING(50) | NO | เช่น submitted_by_supervisor |
| evaluated_by_supervisor_at | DATETIME | YES | เวลา submit |
| evaluation_items | TEXT(JSON) | YES | รายละเอียดแต่ละหัวข้อ |
| discipline_score / behavior_score / performance_score / method_score / relation_score | INT | YES | หมวดคะแนน (5 หมวด) |
| supervisor_pass_decision | BOOLEAN | YES | ผ่าน/ไม่ผ่าน |
| pass_fail | STRING(10) | YES | ใช้ค่า PASS/FAIL |
| pass_evaluated_at | DATETIME | YES | เวลาตัดสินผล |

Workflow internship (จาก seeder): 10 ขั้น (ดู Inventory) -> ใช้แสดง progress ของนักศึกษา

แนวทางควบคุมข้อมูลตั้งต้น:
1. ไม่ seed internship_documents / logbooks ใน production (มีเฉพาะ dev/demo) -> เอกสารตัวอย่างควรแยกหมวด
2. Seed เฉพาะ workflow_step_definitions (คงที่) + notification_settings
3. Evaluation structure versioning: ใช้ evaluation_items (JSON) เพื่อรองรับ dynamic rubric โดยไม่ต้อง alter schema ทุกครั้ง

TODO:
- ใส่ state machine diagram (INTERNSHIP_ELIGIBILITY_MET -> ... -> INTERNSHIP_COMPLETED)
- อธิบาย mapping supervisor_approved (int) เป็นสถานะ UI
- กำหนด policy retention logbooks

### 4.5 Project / Capstone
- Milestone เริ่มต้น (proposal, mid, final)
- Workflow timeline mapping
- ประเภทโครงงาน (ถ้ามี)

TODO: เติมรายละเอียด

### 4.6 Workflow & Status Dictionaries
- รายการ status code ทุกโดเมน (table/enum)
- หลักการตั้งชื่อ (prefix, snake_case/pascal)
- การทำ version เมื่อเพิ่ม/เลิกใช้

จาก seeder `initial-internship-steps` มี 10 ขั้นสำหรับ workflow_type='internship' step_key prefix `INTERNSHIP_...`
หลักการ naming เสนอ:
1. ใช้ UPPER_SNAKE_CASE
2. prefix ด้วยโดเมนหลัก (INTERNSHIP_, PROJECT1_, PROJECT2_, DOCUMENT_, ...)
3. หลีกเลี่ยงการแก้ไขค่าเดิม (breaking) -> เพิ่ม step ใหม่แล้ว mark ของเดิม deprecated (เก็บไว้เพื่อไม่พัง historical data)
4. step_order ต้องเป็นลำดับเพิ่มเท่านั้นเพื่อให้ UI ทำ progress bar ง่าย (ห้าม reorder retrospective)

State Machine (Internship) – high level (ไม่รวม branch ย่อย):
```
ELIGIBILITY_MET (1)
  -> CS05_SUBMITTED (2)
  -> CS05_APPROVAL_PENDING (3)
  -> CS05_APPROVED (4)
  -> COMPANY_RESPONSE_PENDING (5)
  -> COMPANY_RESPONSE_RECEIVED (6)
  -> AWAITING_START (7)
  -> IN_PROGRESS (8)
  -> SUMMARY_PENDING (9)
  -> COMPLETED (10)
```
กติกาเปลี่ยนสถานะ (ตัวอย่าง):
- SUBMITTED -> APPROVAL_PENDING: เมื่อ staff เปลี่ยน flag/ส่งเข้า review queue
- APPROVAL_PENDING -> APPROVED: ครบเงื่อนไขตรวจสอบ + อนุมัติ
- COMPANY_RESPONSE_PENDING -> COMPANY_RESPONSE_RECEIVED: นักศึกษาอัปโหลดหนังสือตอบรับผ่าน Document flow
- IN_PROGRESS -> SUMMARY_PENDING: วันสิ้นสุดฝึกงานผ่าน (end_date) หรือ staff trigger
- SUMMARY_PENDING -> COMPLETED: ประเมิน/รายงานครบ + evaluation ผ่าน

ตาราง `workflow_step_definitions` (จาก model):
| Column | Type | Null? | Note |
|--------|------|-------|------|
| step_id | INT PK | NO | primary key |
| workflow_type | ENUM(internship, project1, project2) | NO | ประเภท workflow |
| step_key | STRING | NO | unique ภายใน workflow_type |
| step_order | INT | NO | เรียงขั้น |
| title | STRING | NO | แสดงใน UI |
| description_template | TEXT | YES | รองรับ placeholder |
| created_at / updated_at | TIMESTAMP | NO | timestamps |

ตาราง `student_workflow_activities`:
| Column | Type | Null? | Default | Note |
|--------|------|-------|---------|------|
| activity_id | INT PK | NO | - |  |
| student_id | INT FK | NO | - | unique คู่ workflow_type |
| workflow_type | ENUM(internship, project1, project2) | NO | - |  |
| current_step_key | STRING | NO | - | ชี้ step ปัจจุบัน |
| current_step_status | ENUM(pending,in_progress,awaiting_student_action,awaiting_admin_action,completed,rejected,skipped) | NO | pending | สถานะย่อยของ step ปัจจุบัน |
| overall_workflow_status | ENUM(not_started,eligible,enrolled,in_progress,completed,blocked) | NO | not_started | ภาพรวม |
| data_payload | JSON | YES | null | เก็บ metadata เพิ่ม |
| started_at | DATETIME | YES | null | เวลาเริ่ม workflow |
| completed_at | DATETIME | YES | null | เวลาเสร็จ |
| created_at/updated_at | TIMESTAMP | NO | now |  |

Transition Control (เพื่อ implement ภายหลัง):
- ตรวจสอบว่า step_order(next) = step_order(current)+1 เว้นกรณีข้าม (ต้องมี flag allowSkip)
- หาก current_step_status != 'completed' ป้องกันการ advance (ยกเว้น override admin)
- ควรเพิ่มตาราง `workflow_transitions` (optional future) เพื่อกำหนดเงื่อนไขชัดเจน (TODO)

TODO:
- เพิ่ม column proposal: defaultStatusOnReach (กำลัง comment ใน model)
- เกณฑ์ revert step (rollback) + audit log
- หน้าจอ admin ตรวจ flow และ force advance

### 4.7 Notification & Email Templates
- ตาราง: เช่น `email_templates` / `notification_settings`
- Placeholder variables ตัวอย่าง: {{student_name}}, {{deadline_date}}
- Flag เปิดปิด (EMAIL_*_ENABLED)

Seeder `seed-notification-settings-default` เพิ่ม 5 ประเภท notification_type: LOGIN, DOCUMENT, LOGBOOK, EVALUATION, APPROVAL (ทั้งหมด default is_enabled=false)
นโยบายเสนอ:
- เปิดเฉพาะจำเป็นใน production หลังทดสอบ load
- ให้ UI support toggle is_enabled
- ขยายชนิดใหม่ให้เก็บใน enum config ส่วนกลาง (TODO: central config)

TODO:
- อธิบาย event trigger แต่ละประเภท
- ระบุว่าจะมี email mapping หรือเฉพาะ in-app

### 4.8 Documents / Templates
- Path เก็บไฟล์: `backend/templates`, `frontend/assets` หรืออื่น
- ประเภท: PDF Form, Evaluation Form, Instruction Manual
- วิธีอัปเดต (PR + review?)

TODO: เติมรายละเอียด

### 4.9 Background Agents & Schedulers
- ตัวอย่าง: `eligibilityUpdater` (ทำอะไร, รันเมื่อไร)
- Config ไฟล์: `backend/agents/config.js`
- ความถี่ปรับเปลี่ยน?

TODO: เติมรายละเอียด

### 4.10 Security & Policy Baseline
- JWT_EXPIRES_IN, PASSWORD_MIN_LENGTH, RATE_LIMIT
- เกณฑ์ rotate secret
- ตำแหน่ง config: `config/jwt.js`, `middleware/rateLimiter.js`

TODO: เติมรายละเอียด

---
## 5. ขั้นตอน Reproduce ฐานข้อมูลเริ่มต้น (Bootstrap Procedure)
1. Clone repository
2. ตั้งค่า `.env.development` จาก `.env.example`
3. รัน migration: `npx sequelize-cli db:migrate`
4. รัน seeder: `npx sequelize-cli db:seed:all`
5. ตรวจบัญชี admin สร้างหรือไม่ (ถ้าไม่ให้รันสคริปต์/manual insert)
6. ตรวจไฟล์ template จำเป็น (รายการภาคผนวก B)
7. Smoke test endpoint (auth login, list deadlines)
8. บันทึก hash เวอร์ชัน (git commit id)

TODO: ระบุสคริปต์หรือคำสั่งเฉพาะโปรเจกต์เพิ่มเติม

---
## 6. กลไกการอัปเดตหลังเริ่มใช้งาน (Update Mechanisms)
| หมวด | ช่องทางปรับปรุง (UI/Script/Migration) | ความถี่ | Audit Log ที่ไหน | ผู้อนุมัติ |
|-------|----------------------------------------|---------|------------------|-----------|
| Deadlines | Admin UI | Per Term | TODO | Academic Admin |
| Email Templates | PR + Deploy | Ad-hoc | Git History | Dev Lead |
| Roles/Permissions | Migration/Script | Rare | Git + DB audit | System Owner |
| TODO | TODO | TODO | TODO | TODO |

TODO: เติมตาราง

---
## 7. Versioning & Audit Strategy
- ใช้ Git history สำหรับไฟล์ template/config
- ใช้ timestamp + migration id สำหรับ schema/data version
- เสนอเพิ่มตาราง `data_changelog`? (ถ้าจำเป็น)
- รูปแบบ commit message ที่แนะนำ: `seed: add internship evaluation v2`

TODO: ยืนยันแนวทางจริง

---
## 8. ความเสี่ยง (Risks) & จุดต้องตรวจ (Validation Points)
| ความเสี่ยง | ผลกระทบ | วิธีป้องกัน | วิธีตรวจเร็ว |
|------------|----------|-------------|---------------|
| ลืมสร้าง admin | เข้า backend ไม่ได้ | Seeder + test script | ลอง login | 
| Deadline term ผิด | นักศึกษาพลาดงาน | Review คู่ | ตรวจ UI list | 
| Role permission ขาด | Feature ใช้ไม่ได้ | Matrix review | API 403 test | 
| Template slug เปลี่ยนเงียบ | อีเมลส่งไม่ได้ | Lock slug | ส่ง test email | 
| TODO | TODO | TODO | TODO |

TODO: เพิ่มรายการ

---
## 9. เช็คลิสต์ก่อนประกาศ "พร้อมใช้งาน" (Go-Live Checklist)
- [ ] Migration ผ่านครบ ไม่มี error
- [ ] Seeder รันซ้ำได้ ไม่ duplicate
- [ ] Admin login ใช้งานได้
- [ ] Role/Permission Matrix ถูกต้องตามเอกสาร
- [ ] Deadlines เทอมปัจจุบันครบ
- [ ] Internship evaluation form อย่างน้อย 1 เวอร์ชัน
- [ ] Email templates ทดสอบส่งสำเร็จ
- [ ] Agents/Schedulers ทำงาน (log ปรากฏ)
- [ ] JWT / Security policy ตามมาตรฐานองค์กร
- [ ] เอกสารไฟล์นี้อัปเดต commit ล่าสุด

TODO: เพิ่มตามบริบทอื่น

---
## ภาคผนวก A: Mapping Environment Variables → Config
| ENV VAR | ไฟล์/โมดูลใช้ | ผลกระทบหลัก | ค่า default (ห้ามใส่ secret จริง) |
|---------|----------------|--------------|------------------------------------|
| DB_HOST | config/database.js | Database connection | localhost |
| FRONTEND_URL | server.js | CORS | http://localhost:3000 |
| JWT_SECRET | config/jwt.js | Auth token | (placeholder) |
| EMAIL_API_KEY | config/email.js | ส่งอีเมล | (placeholder) |
| UPLOAD_DIR | config/uploadConfig.js | ที่เก็บไฟล์ | uploads/ |
| TODO | TODO | TODO | TODO |

TODO: เติมเต็ม

## ภาคผนวก B: รายการไฟล์ Template / Reference
| Path | ประเภท | ใช้เพื่อ | Owner | หมายเหตุ |
|------|--------|----------|-------|----------|
| backend/templates/??? | Email/Eval? | TODO | TODO | TODO |
| frontend/assets/??? | PDF | TODO | TODO | TODO |
| knowledge/??? | คู่มือ | TODO | TODO | TODO |
| TODO | TODO | TODO | TODO | TODO |

## ภาคผนวก C: Permission Matrix (ย่อ)
> อาจย้ายไปไฟล์แยกถ้ายาว

| Role \ Action | Manage Users | View Deadlines | Edit Deadlines | Approve Internship | View Reports | ... |
|---------------|--------------|----------------|----------------|-------------------|-------------|-----|
| Admin | Y | Y | Y | Y | Y | ... |
| Teacher | N | Y | N | Y? | Partial | ... |
| Student | N | Limited | N | N | Self Only | ... |
| Support | N | Y | N | N | Y | ... |
| TODO | TODO | TODO | TODO | TODO | TODO | ... |

## ภาคผนวก D: ตัวอย่างโครงสร้าง JSON (Evaluation Form) (Placeholder)
```json
{
  "version": 1,
  "sections": [
    {"title": "Professionalism", "items": [ {"code": "PUNCTUAL", "label": "มาตรงเวลา", "scale": 5} ]},
    {"title": "Communication", "items": [ {"code": "TEAM_COMM", "label": "สื่อสารกับทีม", "scale": 5} ]}
  ]
}
```
TODO: อัปเดตตามจริง

---
## แนวทางการใช้งานไฟล์นี้
1. เติมข้อมูล TODO ให้ครบภายในสปรินท์เริ่มต้น
2. ใช้เป็นแหล่งอ้างอิงเวลา Code Review ที่แตะ seed/config
3. อัปเดตทุกครั้งเมื่อเพิ่ม/ลบข้อมูลตั้งต้น (PR ต้องแก้ไฟล์นี้)
4. ทำ automation ตรวจ diff (optional future)

---
ปรับปรุงล่าสุด: TODO: วันที่
ปรับปรุงล่าสุด: 2025-09-09 (เพิ่มรายละเอียด deadlines + internship schemas)
ปรับปรุงล่าสุด: 2025-09-09 (เพิ่มเติม workflow state machine + document/student schema สรุป)
ปรับปรุงล่าสุด: 2025-09-10 (เพิ่ม Section 10 การจำแนกข้อมูลตั้งต้นตามระบบ + legend ประเภทข้อมูล)

---
## 10. Domain-Based Initial Data Classification
การจัดหมวดข้อมูลตั้งต้นแยกตามระบบหลัก เพื่อให้ทีมเข้าใจว่าอะไรต้องพร้อมเมื่อเปิดใช้ฟีเจอร์แต่ละโดเมน

Legend ประเภทข้อมูล:
- Reference: ค่าคงที่เชิงธุรกิจ เปลี่ยนยาก (version เมื่อเปลี่ยน)
- Config: ค่าปรับได้ผ่านการตั้งค่า/ผู้ดูแล (อาจเปลี่ยนตามเทอม/นโยบาย)
- Operational Baseline: เรกคอร์ดตั้งต้นที่ต้องมีอย่างน้อย 1 เพื่อระบบทำงาน (bootstrap)
- Sample: ข้อมูลตัวอย่าง/dev/demo ไม่ขึ้น production

| ระบบ | หมวด | รายการ (Table/Entity) | ประเภท | แหล่ง seed/migration | Prod จำเป็น? | ความเสี่ยงถ้าขาด |
|------|------|-----------------------|---------|----------------------|--------------|------------------|
| Core | Roles | Admin account + roles | Reference | seeder/manual | Yes | เข้าไม่ได้ / config อื่นแก้ไม่ได้ |
| Core | Curriculum | CS2563, CS2568 (curriculums) | Reference | seeder | Yes | Eligibility / mapping คำนวณผิด |
| Core | Academic Term | academics baseline | Operational Baseline | seeder | Yes | ระบบไม่รู้เทอมปัจจุบัน |
| Core | Workflow Catalog | internship steps (workflow_step_definitions) | Reference | seeder | Yes | Progress/logic ล่ม |
| Core | Notifications | notification_settings defaults | Config | seeder | Yes | การ toggle เริ่มต้นไม่กำหนด |
| Core | Documents Enum | documents.status, documents.category | Reference | migration | Yes | Insert/update error (ENUM mismatch) |
| Internship | Workflow | (same 10 steps) | Reference | seeder | Yes | Tracking การฝึกงานค้าง |
| Internship | Evaluation Structure | evaluation rubric (evaluation_items spec) | Config | code/JSON (future seeder) | Yes | คะแนนสรุป/รายงานผิด |
| Internship | Certificate Req | internship_certificate_requests (empty) | Operational Baseline | migration | Yes (empty ok) | ฟอร์มร้องขอ certificate ใช้ไม่ได้ถ้า schema ผิด |
| Internship | Notification Types | LOGBOOK/EVALUATION/APPROVAL | Config | seeder | Yes | ไม่เกิดแจ้งเตือน |
| Internship | Sample Logbooks | internship_logbooks demo | Sample | seeder(dev) | No | ปนข้อมูลจริงถ้าไม่ลบ |
| Internship | Sample Evaluation | internship_evaluations demo | Sample | seeder(dev) | No | สถิติผลิตผิด |
| Project | Milestones | timeline_steps (proposal/mid/final) | Reference | migration/seeder (TBD) | Yes | UI milestone ว่าง |
| Project | Workflow (future) | project1/project2 steps | Reference | seeder (TODO) | Future | ไม่สามารถเปิด feature project workflow |
| Project | Sample Docs | project_documents demo | Sample | seeder(dev) | No | ปนเอกสารจริง |
| Shared | Deadlines Schema | important_deadlines | Reference/Config | migration | Yes | การประกาศ/lock เอกสารขัดข้อง |
| Shared | Approval Tokens | approval_tokens | Operational Baseline | migration | Yes | external approval ล้มเหลว |
| Shared | Student Workflow Activity | student_workflow_activities | Operational Baseline | migration | Yes | เก็บสถานะภาพรวมไม่ได้ |

หมายเหตุ:
- ตาราง Operational Baseline อาจเริ่มว่าง (0 record) แต่ schema ต้องมีให้พร้อม → ควรมี smoke test ตรวจ
- Sample data: ควรติด tag หรือชื่อ slug ชัดเจนเพื่อ pipeline ล้างก่อน deploy (เช่น student_code ที่ขึ้นต้น DEV_ หรือใช้ตาราง mapping)

### 10.1 สิ่งที่ต้องตรวจอัตโนมัติ (Proposed Checks)
| Check | วิธีตรวจ | เกณฑ์ผ่าน |
|-------|----------|-----------|
| มีอย่างน้อย 1 curriculum active | SELECT count(*) FROM curriculums WHERE active=1 | >=1 |
| academics ปัจจุบัน | SELECT count(*) FROM academics WHERE active=1 | =1 |
| workflow internship 10 steps ครบ | SELECT count(*) FROM workflow_step_definitions WHERE workflow_type='internship' | =10 |
| notification types 5 ค่า | SELECT count(*) FROM notification_settings | >=5 |
| ไม่มี sample evaluation บน prod | SELECT count(*) FROM internship_evaluations WHERE student_id=32 | =0 (prod) |

### 10.2 ขั้นตอนดึง schema จริง (Manual / Script)
หากต้องการ sync เอกสารกับ DB production จริง ให้รัน (pseudo):
1. `SHOW TABLES` → กรองรายการตามตารางในตารางด้านบน
2. สำหรับแต่ละตาราง `DESCRIBE <table>` → เก็บ column, type, null, default
3. Diff กับส่วนที่บันทึกในไฟล์ (ภาคผนวก/Section 4)
4. หากต่าง → อัปเดตไฟล์ + เพิ่มบรรทัด "ปรับปรุงล่าสุด: YYYY-MM-DD (schema sync)"

### 10.3 กลยุทธ์ Versioning ต่อหมวด
| หมวด | วิธี version | ตัวอย่าง tag |
|------|--------------|---------------|
| Workflow Steps | เพิ่ม field deprecated_at (อนาคต) + commit tag | workflow-v1, workflow-v2 |
| Evaluation Rubric | rubric_version ใน JSON root | eval-rubric-v1 |
| Curriculum | code + active range (start_year/end_year) | CS2563 |
| Notifications | เพิ่ม column version ถ้าปรับโครงสร้าง | notif-v1 |
| Deadlines Policy | migration id + change log | deadline-schema-20250829 |

### 10.4 ช่องว่าง (Gaps / TODO)
- ยังไม่มี seeder สำหรับ project workflow → ต้องออกแบบ
- ยังไม่มี rubric seeder แยก (evaluation_items) → อาจสร้างไฟล์ JSON ต้นทาง
- ไม่มี automation ล้าง sample data บน prod → เสนอเพิ่ม script ตรวจ
- ยังไม่ได้กำหนด standard prefix สำหรับ sample records (เช่น DEMO_, SAMPLE_)

### 10.5 Actions แนะนำ (Next Improvements)
1. สร้าง seed/script ตรวจ missing critical reference แล้ว throw (pre-start check)
2. เพิ่ม label ใน seeders sample: `const SAMPLE_DATA = true;` เพื่อ filter deploy
3. เพิ่ม CI job: run SELECT checks (Section 10.1) บน staging ก่อน promote prod
4. เพิ่ม rubric_version column (หรือ meta JSON) ใน `internship_evaluations` ถ้าใช้คะแนนหลาย generation ในอนาคต
5. เพิ่มตาราง workflow_transitions (optional) เพื่อ formalize allowed moves


## ภาคผนวก E: Core Schema – Document
ใช้เพื่อจัดการไฟล์เอกสารและเชื่อมประเภท (INTERNSHIP/PROJECT) + deadline + สถานะการ review

| Column | Type | Note |
|--------|------|------|
| document_id | INT PK |  |
| user_id | INT | เจ้าของ (owner) |
| reviewer_id | INT nullable | ผู้ตรวจล่าสุด |
| document_type | ENUM(INTERNSHIP,PROJECT) | แยกโดเมน |
| document_name | STRING | ชื่อที่แสดง |
| file_path | STRING | path ในระบบไฟล์ |
| status | ENUM(draft,pending,approved,rejected,supervisor_evaluated,acceptance_approved,referral_ready,referral_downloaded,completed) | วงจรชีวิต |
| category | ENUM(proposal,progress,final,acceptance) | หมวดเอกสาร |
| due_date | DATETIME | ใช้ sync กับ deadline |
| important_deadline_id | INT nullable | ลิงก์ deadline ถ้ามี |
| submitted_at | DATETIME | เวลา submit จริง |
| is_late / late_minutes / late_reason | BOOLEAN / INT / TEXT | ประมวลผลจาก deadline |
| download_status / downloaded_at / download_count | ENUM / DATETIME / INT | ติดตามการดาวน์โหลด |
| created_at / updated_at | TIMESTAMP |  |

หมายเหตุ design:
1. การเพิ่มสถานะใหม่ควรแก้ ENUM ทั้ง migration + model + เอกสารนี้
2. is_late ควรคำนวณครั้งเดียวเมื่อ submit หรือปรับเมื่อ deadline ปรับ (พิจารณา batch job)
3. หากต้องรองรับหลายไฟล์ต่อ document -> สร้างตาราง document_assets (future)

## ภาคผนวก F: Core Schema – Student (เฉพาะฟิลด์ด้าน eligibility)
| Column | Type | Note |
|--------|------|------|
| student_id | INT PK |  |
| user_id | INT | เชื่อมบัญชีผู้ใช้ |
| curriculum_id | INT nullable | ใช้ fallback active curriculum ถ้า null |
| student_code | STRING(13) unique | ตัวระบุตัวนักศึกษา |
| total_credits / major_credits | INT | ใช้คำนวณสิทธิ์ฝึกงาน/โครงงาน |
| gpa | DECIMAL(3,2) | อาจใช้เป็น policy ภายหลัง |
| study_type | ENUM(regular,special) |  |
| is_eligible_internship / is_eligible_project | BOOLEAN | cache ผลการคำนวณล่าสุด |
| internship_status | ENUM(not_started,pending_approval,in_progress,completed) | สถานะ high-level |
| project_status | ENUM(not_started,in_progress,completed) |  |
| is_enrolled_internship / is_enrolled_project | BOOLEAN | ลงทะเบียนเข้ากระบวนการหรือยัง |
| classroom / phone_number | STRING | metadata |
| created_at / updated_at | TIMESTAMP |  |

Eligibility Logic Summary:
- ใช้ curriculum (ของนักศึกษาหรือ fallback active) เพื่อดึง threshold: internshipBaseCredits, internshipMajorBaseCredits, projectBaseCredits, projectMajorBaseCredits, requireInternshipBeforeProject
- หากไม่มี curriculum ใดเลย => ไม่สามารถสรุป eligibility (flag false)
- แนะนำให้มี nightly job sync recalculation (TODO)

TODO (Student domain):
- เพิ่มตาราง cache ประวัติ eligibility เพื่อ audit
- เพิ่ม index เพิ่มเติมถ้ามี query ตาม internship_status + curriculum_id
