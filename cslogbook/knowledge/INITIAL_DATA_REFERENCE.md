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

> คำสั่ง seed หลัก (รันจากโฟลเดอร์ `cslogbook/backend`)
> ```powershell
> npm run seed:prod   # ข้อมูลอ้างอิงที่ต้องมีใน production (seeders/production/index.js)
> npm run seed:dev    # ข้อมูลตัวอย่างสำหรับ dev/staging (seeders/dev/index.js)
> ```

| Code/Slug | ชื่อ | คำอธิบาย | แหล่งที่มา (manual/script) | ที่จัดเก็บ (DB Table/File Path) | วิธี seed (migration/seeder/manual) | เปลี่ยนบ่อย? (Y/N/Per Term) | Owner | Risk หากหาย | หมายเหตุ |
|-----------|------|-----------|-----------------------------|---------------------------------|------------------------------------|-------------------------------|-------|--------------|---------|
| ROLE_ADMIN | บทบาทผู้ดูแล | สิทธิ์เต็มระบบ | manual / migration (ตรวจ) | users/roles | seeder/manual | N | TODO | Access Control สูญเสีย | ต้องยืนยันกลไกสร้าง |
| CURR_CS63 | หลักสูตร CS 63 | หลักสูตรปี 2563 | seeder `create-default-curriculum` | curriculums | `npm run seed:prod` (20250428081219) | Low | TODO | Mapping credit ผิด | active=true |
| CURR_CS68 | หลักสูตร CS 68 | หลักสูตรปี 2568 | seeder `create-default-curriculum` | curriculums | `npm run seed:prod` (20250428081219) | Low | TODO | Mapping credit ผิด | require internship before project |
| ACADEMIC_DEFAULT | Academic baseline | academic year/semester เริ่มต้น | seeder `create-default-curriculum` | academics | `npm run seed:prod` (20250428081219) | Per Term | TODO | Term logic ผิด | active_curriculum_id set |
| WF_INT_ELIGIBLE | Internship step 1 | INTERNSHIP_ELIGIBILITY_MET | seeder `initial-internship-steps` | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO | Workflow UI ล่ม | step_order=1 |
| WF_INT_CS05_SUBMITTED | Internship step 2 | INTERNSHIP_CS05_SUBMITTED | seeder | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO | Tracking ผิด |  |
| WF_INT_CS05_APPROVAL_PENDING | Internship step 3 | INTERNSHIP_CS05_APPROVAL_PENDING | seeder | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO | Tracking ผิด |  |
| WF_INT_CS05_APPROVED | Internship step 4 | INTERNSHIP_CS05_APPROVED | seeder | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO | ขั้นถัดไปไม่เริ่ม |  |
| WF_INT_COMPANY_RESPONSE_PENDING | Internship step 5 | INTERNSHIP_COMPANY_RESPONSE_PENDING | seeder | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO | ติดค้าง |  |
| WF_INT_COMPANY_RESPONSE_RECEIVED | Internship step 6 | INTERNSHIP_COMPANY_RESPONSE_RECEIVED | seeder | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO | ตีความผิด |  |
| WF_INT_AWAITING_START | Internship step 7 | INTERNSHIP_AWAITING_START | seeder | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO |  |  |
| WF_INT_IN_PROGRESS | Internship step 8 | INTERNSHIP_IN_PROGRESS | seeder | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO | สถานะไม่อัปเดต |  |
| WF_INT_SUMMARY_PENDING | Internship step 9 | INTERNSHIP_SUMMARY_PENDING | seeder | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO | ปิดงานช้า |  |
| WF_INT_COMPLETED | Internship step 10 | INTERNSHIP_COMPLETED | seeder | workflow_step_definitions | `npm run seed:prod` (20250513000001) | Rare | TODO | ไม่รู้ว่าจบ |  |
| NOTIF_LOGIN | แจ้งเตือนเข้าสู่ระบบ | ประเภท LOGIN disabled default | seeder `seed-notification-settings-default` | notification_settings | `npm run seed:prod` (20250528101244) | Config | TODO | ไม่รู้กิจกรรม login | default is_enabled=false |
| NOTIF_DOCUMENT | แจ้งเตือนเอกสาร | ประเภท DOCUMENT | seeder | notification_settings | `npm run seed:prod` (20250528101244) | Config | TODO | พลาดอัปเดต | default disabled |
| NOTIF_LOGBOOK | แจ้งเตือน logbook | ประเภท LOGBOOK | seeder | notification_settings | `npm run seed:prod` (20250528101244) | Config | TODO | พลาดการติดตาม | default disabled |
| NOTIF_EVALUATION | แจ้งเตือนการประเมิน | ประเภท EVALUATION | seeder | notification_settings | `npm run seed:prod` (20250528101244) | Config | TODO | ไม่ทราบผลประเมิน | default disabled |
| NOTIF_APPROVAL | แจ้งเตือนอนุมัติ | ประเภท APPROVAL | seeder | notification_settings | `npm run seed:prod` (20250528101244) | Config | TODO | ล่าช้า approval | default disabled |
| INT_EVAL_STUDENT32 | ตัวอย่าง evaluation | Internship evaluation (demo) | seeder `seed-internship-evaluation-student32` | internship_evaluations | `npm run seed:dev` | N | TODO | data ตัวอย่างหาย | เฉพาะ dev/testing |
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

สรุป schema (อิงจาก models/migrations ที่มีในโปรเจกต์):
- users: user_id PK, email (unique), password_hash, first_name/last_name (ถ้ามี), role-like ถูกใช้งานผ่านตาราง/โมเดลโดเมน (admin/teacher/student)
- teachers: teacher_id PK, user_id FK→users, teacher_type ENUM(support,advisor,coordinator,reviewer ฯลฯ จาก migration add-teacher-sub-roles), position STRING (migration 20250809000000-add-teacher-position)
- admins: โปรเจกต์นี้มีการ “convert admin เป็น teacher support” (20250101000001) จึงใช้งานผ่านตาราง teachers แทน admin แยก

ตัวอย่างข้อมูล (3 แถว) – ตาราง teachers
| teacher_id | user_id | teacher_type | position | หมายเหตุ |
|------------|---------|--------------|----------|----------|
| 101 | 501 | support | Academic Support | ถูกสร้างจากสคริปต์แปลง admin → support |
| 102 | 502 | advisor | Lecturer | อาจารย์ที่ปรึกษา |
| 103 | 503 | reviewer | Assistant Prof. | ผู้ตรวจเอกสาร |

ตัวอย่างข้อมูล (3 แถว) – ตาราง users (คัดคอลัมน์สำคัญเท่าที่จำเป็น)
| user_id | email | first_name | last_name |
|---------|-------|------------|-----------|
| 501 | support@csu.ac.th | Support | Staff |
| 502 | advisor1@csu.ac.th | Narin | Wong |
| 503 | reviewer1@csu.ac.th | Sirinya | J. |

### 4.2 Academic Structure
- ปีการศึกษา/เทอม (format เช่น 2025/1)
- หลักสูตร (curriculum) + mapping รายวิชา
- Deadlines เชิงวิชาการเริ่มต้น (เช่น ลงทะเบียน, เพิ่ม/ถอน)

-รายละเอียด seeders เกี่ยวข้อง:
- Production: `20250428081219-create-default-curriculum` (รันผ่าน `npm run seed:prod`) -> เพิ่มหลักสูตร CS2563/CS2568 และตั้งค่า academics แรกเริ่ม (current_semester=1, academic_year=2567) + active_curriculum_id
- Dev/demo: `20250428080912-create-default-curriculum` (รันผ่าน `npm run seed:dev`) -> เติมหลักสูตร CS2566 สำหรับสถานการณ์ทดสอบเพิ่มเติม
- Migration เสริม credits / short_name / max_credits (ดู migrations หลายไฟล์ add_*_to_curriculums)

ประเด็นสำคัญ:
1. ต้องมีอย่างน้อย 1 curriculum active สำหรับ mapping นักศึกษาใหม่
2. ตาราง `academics` เก็บ active_curriculum_id + term flags (internship_semesters, project_semesters)
3. การเปลี่ยนเทอมใหม่: update academics.is_current / academic_year / current_semester

TODO:
- ใส่ตัวอย่าง record academics ปัจจุบัน
- ระบุ process เปลี่ยนเทอม (manual script หรือ UI?)

สรุป schema (หลัก) ตาม migrations:
- curriculums: id PK, name, short_name, total_credits, major_credits, internship_base_credits, project_base_credits, project_major_base_credits, max_credits, active (BOOLEAN)
  หมายเหตุ: ในฐานข้อมูลปัจจุบันใช้ชื่อคอลัมน์คีย์ว่า "curriculum_id" แทน "id"
- academics: id PK, academic_year (STRING/INT), current_semester (INT), active_curriculum_id FK→curriculums, is_current (BOOLEAN)
- student_academic_histories: id PK, student_id FK, academic_year, semester, curriculum_id, total_credits, major_credits, gpa, note

ตัวอย่างข้อมูล (3 แถว) – ตาราง curriculums (ดึงจากฐานจริง)
| curriculum_id | name | short_name | internship_base_credits | project_base_credits | project_major_base_credits | max_credits | active |
|---------------|------|------------|--------------------------|----------------------|----------------------------|-------------|--------|
| 41 | หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ (หลักสูตรปรับปรุง พ.ศ. 2564) | CS64 | 81 | 95 | 57 | 128 | 1 |
| 42 | หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ (หลักสูตรปรับปรุง พ.ศ. 2559) | cs59 | 95 | 101 | 62 | 135 | 0 |
| 43 | หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ ฉบับปรับปรุง พ.ศ. 2566 | cs66 | 87 | 100 | 61 | 128 | 0 |

ตัวอย่างข้อมูล (3 แถว) – ตาราง academics
| id | academic_year | current_semester | active_curriculum_id | is_current |
|----|---------------|------------------|----------------------|-----------|
| 1 | 2568 | 1 | 41 | 1 |
|  |  |  |  |  |
|  |  |  |  |  |
หมายเหตุ: ฐานข้อมูลปัจจุบันมี 1 เรกคอร์ดที่ใช้งานอยู่ (is_current=1) จึงแสดงแถวเดียวเป็นข้อมูลจริง

ตัวอย่างข้อมูล (3 แถว) – ตาราง student_academic_histories
| id | student_id | academic_year | semester | curriculum_id | total_credits | major_credits | gpa |
|----|------------|---------------|----------|---------------|---------------|---------------|-----|
| 1001 | 32 | 2568 | 1 | 2 | 84 | 66 | 3.21 |
| 1002 | 51 | 2568 | 1 | 2 | 92 | 72 | 2.98 |
| 1003 | 179 | 2567 | 2 | 1 | 78 | 60 | 3.45 |

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

ตัวอย่างข้อมูล (3 แถว) – ตาราง important_deadlines (ดึงจากฐานจริง)
| id | name | related_to | academic_year | semester | deadline_type | date | deadline_at | is_published | allow_late | grace_period_minutes |
|----|------|-----------|---------------|----------|---------------|------|-------------|--------------|------------|----------------------|
| 7 | วันสอบหัวข้อโครงงานพิเศษ | project1 | 2568 | 1 | ANNOUNCEMENT | 2025-07-17 | 2025-07-17 23:59:59 | 1 | 0 |  |
| 8 | ประกาศรายชื่อหัวข้อโครงงานพิเศษที่ได้รับอนุมัติจากภาควิชา | project1 | 2568 | 1 | ANNOUNCEMENT | 2025-07-18 | 2025-07-18 23:59:59 | 1 | 0 |  |
| 9 | วันสุดท้ายของการยื่นเอกสารขอทดสอบโครงงานพิเศษ 30 วัน (เชพอการยื่นขอสอบปริญญานิพนธ์) | project1 | 2568 | 1 | SUBMISSION | 2025-10-03 | 2025-10-03 15:59:00 | 1 | 1 |  |

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

สรุป schema ย่อ (สำคัญที่ใช้ใน initial data context) — อ้างอิงจากฐานจริง

`documents`
| Column | Type | Null? | Note |
|--------|------|-------|------|
| document_id | INT | NO (PK) | ไอดีเอกสาร |
| user_id | INT | NO | เจ้าของเอกสาร |
| document_type | ENUM('INTERNSHIP','PROJECT') | NO | ประเภทโดเมน |
| category | ENUM('proposal','progress','final','acceptance') | NO | หมวดเอกสาร |
| status | ENUM('draft','pending','approved','rejected','supervisor_evaluated') | NO | สถานะเอกสาร |
| important_deadline_id | INT | YES | ลิงก์เดดไลน์ |
| submitted_at | DATETIME | YES | เวลาส่งจริง |
| is_late | TINYINT(1) | NO | ธงส่งช้า (0/1) |
| download_status | ENUM('not_downloaded','downloaded') | YES | สถานะดาวน์โหลด |
| downloaded_at | DATETIME | YES | เวลาดาวน์โหลดล่าสุด |
| download_count | INT | YES | จำนวนดาวน์โหลด |
| ... | ... | ... | document_name, file_path, reviewer_id, review_date, review_comment, due_date, file_size, mime_type, created_at, updated_at |

ตัวอย่าง 3 คอลัมน์ (ข้อมูลจริง)

| document_id | status   | category   |
|-------------|----------|------------|
| 76          | approved | proposal   |
| 77          | approved | acceptance |
| 87          | approved | proposal   |

`internship_documents`
| Column | Type | Null? | Note |
|--------|------|-------|------|
| internship_id | INT | NO (PK AI) | ใช้เชื่อมทุกส่วน |
| document_id | INT | NO (UNIQUE) | เอกสารอ้างอิง (คำร้อง/ตอบรับ) |
| company_name | VARCHAR(255) | NO | ชื่อสถานประกอบการ |
| company_address | TEXT | NO | ที่อยู่ |
| internship_position | VARCHAR(100) | YES | ตำแหน่งฝึกงาน |
| contact_person_name/position | VARCHAR(100) | YES | ผู้ประสานงาน |
| supervisor_name/position/phone/email | VARCHAR | YES | ข้อมูลพี่เลี้ยง |
| start_date / end_date | DATE | NO | ช่วงฝึกงาน |
| academic_year / semester | INT / TINYINT | YES | snapshot เวลา submit |
| created_at/updated_at | TIMESTAMP | YES | timestamps |

ตัวอย่าง 3 คอลัมน์ (ข้อมูลจริง)

| internship_id | company_name          | internship_position                          |
|---------------|-----------------------|----------------------------------------------|
| 44            | deverhoodHT           | Front end Developer                           |
| 48            | บริษัท วิชั่นเน็ต จำกัด | Database Programmer / Application Developer |
| 49            | บริษัท วิชั่นเน็ต จำกัด | Database Programmer / Application Developer |

`internship_logbooks`
| Column | Type | Null? | Note |
|--------|------|-------|------|
| log_id | INT | NO (PK AI) |  |
| internship_id | INT | NO |  |
| student_id | INT | NO |  |
| work_date | DATE | NO | วันที่ทำงาน |
| log_title | VARCHAR(255) | NO | หัวข้อ |
| work_description / learning_outcome | TEXT | NO | เนื้อหา |
| problems / solutions | TEXT | YES |  |
| work_hours | DECIMAL(4,2) | NO | ชั่วโมงทำงาน |
| supervisor_comment | TEXT | YES |  |
| supervisor_approved | INT | NO (default 0) | 0 pending, 1 approve, 2 reject |
| advisor_comment | TEXT | YES |  |
| advisor_approved | TINYINT(1) | YES (default 0) |  |
| time_in / time_out | VARCHAR(5) | YES | HH:MM |
| supervisor_approved_at / supervisor_rejected_at | DATETIME | YES | timestamp action |
| academic_year | INT | NO (default 2568) | snapshot เทอม |
| semester | INT | NO (default 1) | snapshot เทอม |
| created_at/updated_at | TIMESTAMP | YES |  |

ตัวอย่าง 3 คอลัมน์ (ข้อมูลจริง)

| log_id | work_date  | supervisor_approved |
|--------|------------|---------------------|
| 282    | 2025-07-07 | 0                   |
| 283    | 2025-07-08 | 0                   |
| 284    | 2025-07-09 | 0                   |

`internship_evaluations`
| Column | Type | Null? | Note |
|--------|------|-------|------|
| evaluation_id | INT | NO (PK AI) |  |
| approval_token_id | INT | YES | external supervisor token |
| internship_id | INT | NO |  |
| student_id | INT | NO |  |
| evaluator_name | VARCHAR(255) | YES | ผู้ประเมิน |
| evaluation_date | DATETIME | NO | เวลา/วันที่ประเมิน |
| overall_score | DECIMAL(5,2) | YES | คะแนนรวม |
| strengths / weaknesses_to_improve / additional_comments | TEXT | YES | รายละเอียดเชิงคุณภาพ |
| status | VARCHAR(50) | NO (default 'submitted_by_supervisor') | สถานะ |
| evaluated_by_supervisor_at | DATETIME | YES | เวลา submit |
| evaluation_items | TEXT(JSON) | YES | รายการ rubric แบบยืดหยุ่น |
| discipline_score / behavior_score / performance_score / method_score / relation_score | INT | YES | หมวดคะแนน |
| supervisor_pass_decision | TINYINT(1) | YES | ผ่าน/ไม่ผ่าน |
| pass_fail | VARCHAR(10) | YES | pass/fail |
| pass_evaluated_at | DATETIME | YES | เวลาตัดสินผล |
| created_at/updated_at | DATETIME | NO | timestamps |

ตัวอย่าง 3 คอลัมน์ (ข้อมูลจริง)

| evaluation_id | status    | pass_fail |
|---------------|-----------|-----------|
| 26            | completed | pass      |
| 25            | completed | pass      |
หมายเหตุ: ขณะดึงพบ 2 แถวล่าสุด

`internship_certificate_requests`
| Column | Type | Null? | Note |
|--------|------|-------|------|
| id | INT | NO (PK AI) |  |
| student_id | VARCHAR(20) | NO |  |
| internship_id | INT | NO |  |
| document_id | INT | NO |  |
| request_date | DATETIME | NO |  |
| status | ENUM('pending','approved','rejected') | YES (default 'pending') | สถานะคำขอ |
| total_hours | DECIMAL(5,2) | NO |  |
| evaluation_status | VARCHAR(50) | NO |  |
| summary_status | VARCHAR(50) | NO |  |
| requested_by | INT | NO |  |
| processed_at | DATETIME | YES |  |
| processed_by | INT | YES |  |
| certificate_number | VARCHAR(50) | YES |  |
| downloaded_at | DATETIME | YES |  |
| download_count | INT | YES (default 0) |  |
| remarks | TEXT | YES |  |
| created_at/updated_at | TIMESTAMP | NO | timestamps |

ตัวอย่าง 3 คอลัมน์ (ข้อมูลจริง)

| id | internship_id | status   |
|----|---------------|----------|
| 20 | 51            | approved |
| 21 | 58            | approved |

`workflow_step_definitions` (internship)
| Column | Type | Null? | Note |
|--------|------|-------|------|
| step_id | INT | NO (PK AI) |  |
| workflow_type | ENUM('internship','project1','project2') | NO | ประเภท workflow |
| step_key | VARCHAR(255) | NO | ชื่อโค้ดสถานะ (Reference) |
| step_order | INT | NO | ลำดับขั้น |
| title | VARCHAR(255) | NO | แสดงบน UI |
| description_template | TEXT | YES |  |
| created_at/updated_at | DATETIME | NO | timestamps |

ตัวอย่าง 3 คอลัมน์ (ข้อมูลจริง)

| step_key                   | step_order | title                         |
|---------------------------|------------|-------------------------------|
| INTERNSHIP_CS05_APPROVED  | 3          | คพ.05 ได้รับการอนุมัติแล้ว |
| INTERNSHIP_AWAITING_START | 5          | รอเริ่มการฝึกงาน            |
| INTERNSHIP_IN_PROGRESS    | 6          | อยู่ระหว่างการฝึกงาน        |

Workflow internship (จาก seeder): 10 ขั้น (ดู Inventory) -> ใช้แสดง progress ของนักศึกษา

แนวทางควบคุมข้อมูลตั้งต้น:
1. ไม่ seed internship_documents / logbooks ใน production (มีเฉพาะ dev/demo) -> เอกสารตัวอย่างควรแยกหมวด
2. Seed เฉพาะ workflow_step_definitions (คงที่) + notification_settings
3. Evaluation structure versioning: ใช้ evaluation_items (JSON) เพื่อรองรับ dynamic rubric โดยไม่ต้อง alter schema ทุกครั้ง

TODO:
- ใส่ state machine diagram (INTERNSHIP_ELIGIBILITY_MET -> ... -> INTERNSHIP_COMPLETED)
- อธิบาย mapping supervisor_approved (int) เป็นสถานะ UI
- กำหนด policy retention logbooks

ตัวอย่างข้อมูล (3 แถว) – ตาราง internship_documents
| internship_id | document_id | company_name | internship_position | start_date | end_date | academic_year | semester |
|---------------|-------------|--------------|---------------------|------------|----------|---------------|----------|
| 5001 | 3001 | ABC Tech Co., Ltd. | Frontend Intern | 2025-06-01 | 2025-08-31 | 2568 | 1 |
| 5002 | 3002 | XYZ Soft Co., Ltd. | QA Intern | 2025-06-10 | 2025-09-10 | 2568 | 1 |
| 5003 | 3003 | DataWorks Ltd. | Data Intern | 2025-07-01 | 2025-09-30 | 2568 | 1 |

ตัวอย่างข้อมูล (3 แถว) – ตาราง internship_logbooks (ดึงจากฐานจริง)
| log_id | internship_id | student_id | work_date | log_title | work_hours | supervisor_approved | academic_year | semester |
|--------|----------------|-----------|-----------|-----------|------------|---------------------|---------------|----------|
| 282 | 49 | 51 | 2025-07-07 | บันทึกการฝึกงานวันที่ 07/07/2025 | 8.00 | 0 | 2568 | 1 |
| 283 | 49 | 51 | 2025-07-08 | บันทึกการฝึกงานวันที่ 08/07/2025 | 8.00 | 0 | 2568 | 1 |
| 284 | 49 | 51 | 2025-07-09 | บันทึกการฝึกงานวันที่ 09/07/2025 | 8.00 | 0 | 2568 | 1 |

ตัวอย่างข้อมูล (จากฐานจริง) – ตาราง internship_evaluations
| evaluation_id | internship_id | student_id | evaluator_name | status | overall_score | pass_fail | evaluated_by_supervisor_at |
|---------------|---------------|------------|----------------|--------|---------------|-----------|----------------------------|
| 26 | 58 | 31 | กิตติพบบบลบ | completed | 75.00 | pass | 2025-08-25 21:44:41 |
| 25 | 51 | 32 | กิตติพบลบ | completed | 78.00 | pass | 2025-08-24 04:25:56 |
หมายเหตุ: ณ ขณะดึงข้อมูล พบ 2 เรกคอร์ดล่าสุดในฐานจริง

### 4.5 Project / Capstone
- Milestone เริ่มต้น (proposal, mid, final)
- Workflow timeline mapping
- ประเภทโครงงาน (ถ้ามี)

สรุป schema (อิง migrations):
- timeline_steps: id PK, code (STRING), title, description, step_order, active
- project_documents: id PK, student_id, title, advisor_id, status (draft/pending/approved/rejected/...), exam_result (PASS/FAIL/NULL), exam_fail_reason, exam_result_at, student_acknowledged_at, metadata(JSON)
- project_milestones (v2), project_artifacts (v2), project_events (v2), project_tracks (v2): ใช้เก็บ lifecycle รายละเอียด (ดู migrations ชุด 20250919*)

ตัวอย่างข้อมูล (3 แถว) – ตาราง timeline_steps
| id | code | title | step_order | active |
|----|------|-------|------------|--------|
| 1 | PROPOSAL | ส่งข้อเสนอโครงงาน | 1 | 1 |
| 2 | MID | ตรวจความก้าวหน้า | 2 | 1 |
| 3 | FINAL | ส่งเล่มฉบับสมบูรณ์ | 3 | 1 |

ตัวอย่างข้อมูล (3 แถว) – ตาราง project_documents
| id | student_id | title | status | exam_result | exam_result_at |
|----|------------|-------|--------|-------------|-----------------|
| 8001 | 32 | ระบบติดตามฝึกงานและโครงงาน | pending | NULL | NULL |
| 8002 | 51 | ระบบจัดการสอบหัวข้อ | approved | PASS | 2025-09-22 14:00:00 |
| 8003 | 179 | ระบบวิเคราะห์ข้อมูล | rejected | FAIL | 2025-09-23 10:30:00 |

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

ตัวอย่างข้อมูล (3 แถว) – ตาราง workflow_step_definitions (workflow_type='internship') (ดึงจากฐานจริง)
| step_id | step_order | step_key | title |
|---------|------------|----------|-------|
| 3 | 3 | INTERNSHIP_CS05_APPROVED | คพ.05 ได้รับการอนุมัติแล้ว |
| 5 | 5 | INTERNSHIP_AWAITING_START | รอเริ่มการฝึกงาน |
| 6 | 6 | INTERNSHIP_IN_PROGRESS | อยู่ระหว่างการฝึกงาน |

ตัวอย่างข้อมูล (3 แถว) – ตาราง student_workflow_activities (ดึงจากฐานจริง)
| activity_id | student_id | workflow_type | current_step_key | overall_workflow_status |
|-------------|------------|---------------|------------------|-------------------------|
| 2 | 32 | internship | INTERNSHIP_CS05_APPROVED | in_progress |
| 3 | 43 | internship | INTERNSHIP_CS05_APPROVED | in_progress |
| 4 | 155 | internship | INTERNSHIP_CS05_APPROVED | in_progress |

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

สรุป schema:
- notification_settings: id PK, notification_type ENUM(LOGIN,DOCUMENT,LOGBOOK,EVALUATION,APPROVAL), is_enabled BOOLEAN, channels(JSON/OPTIONAL ในอนาคต), created_at/updated_at

ตัวอย่างข้อมูล (3 แถว) – ตาราง notification_settings
| id | notification_type | is_enabled |
|----|-------------------|------------|
| 1 | LOGIN | 0 |
| 2 | DOCUMENT | 0 |
| 3 | LOGBOOK | 0 |

### 4.8 Documents / Templates
- Path เก็บไฟล์: `backend/templates`, `frontend/assets` หรืออื่น
- ประเภท: PDF Form, Evaluation Form, Instruction Manual
- วิธีอัปเดต (PR + review?)

สรุป schema (ดูภาคผนวก E ประกอบ):
- documents: document_id PK, user_id, reviewer_id, document_type ENUM(INTERNSHIP,PROJECT), status ENUM(...), category, important_deadline_id, submitted_at, is_late, late_minutes, late_reason, download_status, downloaded_at, download_count
- document_logs: id PK, document_id, action, actor_id, message, created_at

ตัวอย่างข้อมูล (3 แถว) – ตาราง documents (ดึงจากฐานจริง)
| document_id | user_id | document_type | status | category | important_deadline_id | submitted_at | is_late |
|-------------|---------|---------------|--------|----------|-----------------------|--------------|---------|
| 76 | 47 | INTERNSHIP | approved | proposal | 15 | 2025-08-29 18:27:10 | 0 |
| 77 | 47 | INTERNSHIP | approved | acceptance | 14 | 2025-08-29 18:27:14 | 0 |
| 87 | 48 | INTERNSHIP | approved | proposal | 15 | 2025-08-29 18:27:10 | 0 |

### 4.9 Background Agents & Schedulers
- ตัวอย่าง: `eligibilityUpdater` (ทำอะไร, รันเมื่อไร)
- Config ไฟล์: `backend/agents/config.js`
- ความถี่ปรับเปลี่ยน?

องค์ประกอบ:
- Agent: `agents/monitors/documentStatusMonitor.js` ตรวจเอกสารค้าง review นานเกิน config.documentsStuckInReviewDays แล้วแจ้งเตือนอาจารย์ผู้ตรวจ
- Config: `agents/config.js` มี key เช่น documentsStuckInReviewDays
- Logs: แนะนำใช้ `system_logs` (มี `models/SystemLog.js`) หรือใช้ Winston logs (backend/logs)

ตัวอย่างข้อมูล (3 แถว) – ตาราง system_logs (ตัวอย่างรูปแบบ)
| id | level | message | context | created_at |
|----|-------|---------|---------|------------|
| 4001 | info | DocumentStatusMonitor: Starting document status monitoring | {"agent":"doc-monitor"} | 2025-06-20 08:00:00 |
| 4002 | warn | DocumentStatusMonitor: Agent is already running | {"agent":"doc-monitor"} | 2025-06-20 08:05:00 |
| 4003 | info | Notified teacher #102 about 3 stuck documents | {"teacherId":102} | 2025-06-20 09:00:05 |

### 4.10 Security & Policy Baseline
- JWT_EXPIRES_IN, PASSWORD_MIN_LENGTH, RATE_LIMIT
- เกณฑ์ rotate secret
- ตำแหน่ง config: `config/jwt.js`, `middleware/rateLimiter.js`

สรุป schema/คอนฟิกเกี่ยวข้อง:
- JWT (config/jwt.js): JWT_SECRET, EXPIRES_IN → ใช้กับ auth
- RateLimiter (middleware/rateLimiter.js): policy การจำกัดคำขอ
- password_reset_tokens: id PK, user_id, token, expires_at, used BOOLEAN, temp_new_password_hash (20250825110000)

ตัวอย่างข้อมูล (3 แถว) – ตาราง password_reset_tokens
| id | user_id | token | expires_at | used |
|----|---------|-------|------------|------|
| 9101 | 501 | 3f8a...a1 | 2025-09-30 23:59:59 | 0 |
| 9102 | 10032 | 9b2c...77 | 2025-09-26 12:00:00 | 1 |
| 9103 | 10051 | e1cd...5f | 2025-10-01 08:00:00 | 0 |

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

ปรับปรุงล่าสุด: 2025-09-24 (อัปเดตตัวอย่าง Section 4 หลายตารางด้วยข้อมูลจริงจากฐาน: curriculums, academics, important_deadlines, internship_logbooks, internship_evaluations, workflow_step_definitions, student_workflow_activities, documents)

---
## 10. Domain-Based Initial Data Classification
การจัดหมวดข้อมูลตั้งต้นแยกตามระบบหลัก เพื่อให้ทีมเข้าใจว่าอะไรต้องพร้อมเมื่อเปิดใช้ฟีเจอร์แต่ละโดเมน

Legend ประเภทข้อมูล:
- Reference: ค่าคงที่เชิงธุรกิจ เปลี่ยนยาก (version เมื่อเปลี่ยน)
- Config: ค่าปรับได้ผ่านการตั้งค่า/ผู้ดูแล (อาจเปลี่ยนตามเทอม/นโยบาย)
- Operational Baseline: เรกคอร์ดตั้งต้นที่ต้องมีอย่างน้อย 1 เพื่อระบบทำงาน (bootstrap)
- Sample: ข้อมูลตัวอย่าง/dev/demo ไม่ขึ้น production

| ระบบ | หมวด | รายการ (Table/Entity) | ประเภท | แหล่ง seed/migration (ไฟล์อ้างอิงใน repo) | Prod จำเป็น? | ความเสี่ยงถ้าขาด | ตัวอย่างการใช้งานจริง |
|------|------|-----------------------|---------|---------------------------------------|--------------|------------------|---------------------|
| Core | Admin/Support baseline | บัญชีผู้ดูแล/อาจารย์สนับสนุน (แนวทาง role ในระบบนี้อิง teacher-sub-roles) | Reference | migrations: 20250101000000-add-teacher-sub-roles.js, legacy script: scripts/legacy/convert-admin-to-teacher-support.js, manual: scripts/manual/createInitialSupportStaff.js | Yes | เข้า backend/เมนูจัดการไม่ได้ | ใช้งานใน authController + middleware/authMiddleware เพื่อตรวจสิทธิ์เมนูครู/ซัพพอร์ต |
| Core | Curriculum | หลักสูตร CS2563, CS2568 ใน `curriculums` | Reference | seeders/production/index.js → 20250428081219, seeders/dev/index.js → 20250428080912; migrations: 20250422045919-create-curriculums.js (+ add_*_to_curriculums) | Yes | Eligibility/การลงทะเบียน mapping ผิด | เรียกผ่าน curriculumService + curriculumController (GET /api/curriculums, GET /api/curriculums/active) ใช้ใน Student model เป็น fallback ด้วย activeCurriculumId |
| Core | Academic Term | baseline ใน `academics` ตั้งค่า is_current, active_curriculum_id | Operational Baseline | migrations: 20250424213208-create_academics_table.js, 20250428080602-add_active_curriculum_id_to_academics.js, 20250518090949-add-is-current-to-academics.js | Yes | ระบบไม่ทราบเทอม/หลักสูตรปัจจุบัน ส่งผลหลายจุด | academicService ใช้ดึง current term; Student model fallback หา Academic ล่าสุดเพื่อ set curriculum อัตโนมัติ |
| Core | Workflow Catalog | 10 ขั้นตอนฝึกงาน + Project1 workflow v2 ใน `workflow_step_definitions` | Reference | migration: 20250513000001-create-workflow-step-definitions.js; seeders/production/index.js → 20250513000001-initial-internship-steps.js, 20250513000002-initial-project-steps.js, 20250930121000-update-project1-workflow-steps.js | Yes | Progress/logic ฝึกงานล่ม | ใช้คู่กับ `student_workflow_activities` แสดงสถานะรวมใน UI และ service ฝั่งเอกสาร/ฝึกงาน |
| Core | Notifications | `notification_settings` ค่า default (LOGIN, DOCUMENT, LOGBOOK, EVALUATION, APPROVAL) | Config | migrations: 20250528120518-create-notification-settings-fixed.js; seeder: 20250528101244-seed-notification-settings-default.js | Yes | แจ้งเตือนเปิด/ปิดไม่ชัดเจน | ใช้โดย agents (เช่น DocumentStatusMonitor) เพื่อควบคุมการแจ้งเตือนอาจารย์เมื่อเอกสารค้าง |
| Core | Documents Enum/Flags | ค่าประเภท/สถานะใน `documents` เช่น category, acceptance, download_status, late flags | Reference | migrations: 20250615142055-add-category-acceptance-in-documents.js, 20250615214418-add-download_status-in-documents.js, 20250828094500-alter-documents-add-late-and-deadline-link.js | Yes | บันทึก/อนุมัติเอกสารผิดพลาด | documentService/documentController ใช้อ่าน/อัปเดตสถานะ, ผูก important_deadline |
| Internship | Evaluation Structure (schema) | ตาราง `internship_evaluations` + ช่องรายการคะแนน/JSON items | Config/Reference | migration: 20250522062110-create-internship-evaluations.js (+ 20250824* advanced fields); seeder(dev): 20250101000000-seed-internship-evaluation-student32.js | Yes | ไม่สามารถบันทึก/สรุปผลประเมินได้ | ใช้ใน workflow submission โดย supervisor ผ่าน approval token; มี controller/flow อ้างอิงใน documentService |
| Internship | Certificate Requests | `internship_certificate_requests` | Operational Baseline | migration: 20250706074957-create-internship-certificate-requests.js | Yes (ว่างได้) | ฟีเจอร์ขอหนังสือรับรองใช้งานไม่ได้ | documentController exposes endpoints สำหรับ list/approve/reject/generate PDF |
| Internship | Logbook snapshots | ช่อง academic_year/semester ใน `internship_logbooks` | Reference (schema) | migrations: 20250518121000-add-academicYear-semester-to-internship-logbooks.js, 20250518155741-add-supervisor-approval-timestamps-to-internship-logbooks.js, 20250518160605-change-supervisor-approved-to-integer.js | Yes | รายงานสรุป ชั่วโมง/เทอมผิด | documentService.getInternshipLogbookSummary ใช้ข้อมูลนี้ทำสรุป/ออก PDF |
| Internship | Approval Tokens | `approval_tokens` (รองรับ external supervisor) | Operational Baseline | migration: 20250508000000-create-approval-tokens.js (+ add-email/document-id/format) | Yes | ลิงก์อนุมัติภายนอกใช้งานไม่ได้ | ใช้ใน cp05/acceptance approvals และบันทึกการประเมินโดย supervisor ภายนอก |
| Internship | Sample Logbooks/Evals (dev) | ตัวอย่างใน `internship_logbooks`, `internship_evaluations` | Sample | seeders/dev/index.js (bundle: seed-studentXX-logbook.js, seed-internship-reflections.js ฯลฯ) | No | ปนข้อมูลจริง | ใช้เฉพาะ dev/testing เพื่อเดโมหน้า summary/logbook |
| Project | Timeline Steps (v1) | `timeline_steps` (proposal/mid/final) | Reference | migration: 20250429000000-create-timeline-steps.js | Yes | หน้า milestone ว่าง/ไทม์ไลน์ทำงานไม่ได้ | ใช้ใน projectDocumentService เพื่อกำหนดขั้นเริ่มต้นของโครงงาน |
| Project | Project Lifecycle (v2) | ตาราง v2 (project_milestones, project_artifacts, project_events, project_tracks) | Reference | migrations: 20250919* create-project-* + 20250923093000-add-exam-result-fields-to-project-documents.js | Future/Gradual | ฟีเจอร์ project ขั้นสูงใช้งานไม่ได้ | controllers: projectDocumentController, projectMilestoneController, topicExamResultController อ้างอิง service เดียวกัน |
| Shared | Important Deadlines | `important_deadlines` (+ extended fields: deadline_at, window, flags, related_to) | Reference/Config | migrations: 20250828* และ 20250829120000-merge-relatedWorkflow-into-relatedTo.js | Yes | การประกาศ/บังคับใช้นโยบายรับงานผิด | importantDeadlineController ใช้ดึง + enrich เอกสารที่เชื่อม deadline เพื่อแสดงบน UI นักศึกษา |
| Shared | Student Workflow Activity | `student_workflow_activities` (สถานะภาพรวม per student) | Operational Baseline | migration: 20250513084144-create-student-workflow-activities.js (+ 20250516201713 add overall pending_approval) | Yes | ไม่สามารถเก็บสถานะรวมและแสดง progress bar | ใช้เชื่อมกับ workflow_step_definitions เพื่อแสดงสถานะปัจจุบัน/overall_workflow_status |
| Shared | Password Reset | `password_reset_tokens` (+ temp_new_password_hash ใน users) | Operational Baseline | migrations: 20250825094500-create-password-reset-tokens.js, 20250825110000-add-temp-new-password-hash.js | Yes | ลืมรหัสผ่านกู้คืนไม่ได้ / ความปลอดภัย | ใช้ใน passwordController/flows เปลี่ยนรหัสผ่านสองจังหวะ |

หมายเหตุ:
- รายการด้านบนอ้างอิงจากไฟล์ migrations/seeders ภายใน `cslogbook/backend/` ที่พบในรีโปนี้ และจาก controller/service ที่ถูกเรียกใช้จริง (documentController, curriculumController, importantDeadlineController, projectDocumentController เป็นต้น)
- บางระบบยังเป็นรุ่น v2 (Project Lifecycle) ที่อยู่ในช่วงพัฒนา/เปิดใช้แบบค่อยเป็นค่อยไป ให้จัดเป็น Reference แต่ “Prod จำเป็น?” อาจเป็น Gradual/Future

ตัวอย่างการใช้งานจริง (เชื่อมกับ API/โค้ดในโปรเจกต์):

1) Curriculum/Academic Term
   - API: GET /api/curriculums, GET /api/curriculums/active (ดู `controllers/curriculumController.js`)
   - Service: `services/curriculumService.js`, `services/academicService.js`
   - Model hook: `models/Student.js` ใช้ `Academic.activeCurriculumId` เป็น fallback กำหนด `curriculumId` ให้ student ใหม่ ถ้าไม่มีในข้อมูลนำเข้า

2) Workflow Catalog + Student Workflow Activity (Internship)
   - Migration + Seeder: สร้าง `workflow_step_definitions` 10 ขั้น (ไฟล์ 20250513000001-*) และใช้งานร่วมกับ `student_workflow_activities` โดยรัน `npm run seed:prod` เพื่อเติม internship/project1 steps + เวอร์ชันอัปเดต (20250930121000)
   - UI: ใช้แสดง progress ของนักศึกษาตาม `current_step_key` และ `overall_workflow_status` (เช่น eligible/in_progress/completed)

3) Important Deadlines ↔ Documents
   - API: importantDeadlineController มีการ enrich เอกสารของนักศึกษาที่ผูก deadline เพื่อแสดงว่ามี submission ใดเกี่ยวข้อง
   - Migrations 20250828* เพิ่มฟีเจอร์ deadline window, grace period, lock policy, publish flags
   - Document flags (late/linked deadline) ใช้ใน `documentService` เพื่อบังคับนโยบายส่งช้า/ล็อกหลังหมดเวลา

4) Internship Evaluation + Approval Tokens
   - Schema: `internship_evaluations` รองรับทั้งคะแนนรวมและรายละเอียดหัวข้อใน `evaluation_items` (JSON)
   - Flow: ส่งลิงก์ให้พี่เลี้ยงภายนอกผ่าน `approval_tokens` เพื่อกรอกและส่งผลประเมิน กลับเข้าระบบ (ดู controllers เอกสาร และ service ที่เกี่ยวข้อง)

5) Notifications/Agents
   - `notification_settings` ตั้งค่าเปิด/ปิดชนิดแจ้งเตือน
   - Agent: `backend/agents/monitors/documentStatusMonitor.js` ตรวจเอกสารสถานะค้าง review ตาม config (`agents/config.js`) แล้วสรุปแจ้งเตือนอาจารย์ผู้ตรวจ

6) Project Lifecycle
   - Controllers: `projectDocumentController.js`, `projectMilestoneController.js`, `topicExamResultController.js`
   - ตาราง v2 (project_milestones/events/artifacts/tracks) ใช้เก็บรายละเอียดรอบสอบหัวข้อ/ผลงานแนบ และผลสอบ (migration 20250923093000-*)

Quick SQL checks (สำหรับตรวจบนฐาน Prod/Test ก่อน Go-Live ของแต่ละโดเมน):
- Curriculums ควรมีอย่างน้อย 1 และมี active=true อย่างน้อย 1
  SELECT curriculum_id, name, short_name, active FROM curriculums;
- Academics ควรมีเรกคอร์ดล่าสุด is_current=1 และ active_curriculum_id ไม่ว่าง
  SELECT id, academic_year, current_semester, active_curriculum_id, is_current FROM academics ORDER BY created_at DESC LIMIT 1;
- Workflow steps (internship) ต้องครบ 10 ลำดับ step_order 1..10
  SELECT workflow_type, COUNT(*) FROM workflow_step_definitions GROUP BY workflow_type;
- Notification settings มี 5 ประเภทและ status ตามค่า default
  SELECT notification_type, is_enabled FROM notification_settings;
- Important deadlines มี schema columns ครบ (เช่น deadline_at, window_start_at)
  DESCRIBE important_deadlines;  -- หรือเทียบ schema ตามเอกสารในหัวข้อ 4.3
- Approval tokens ตารางมีอยู่ และ constraints เชื่อมกับเอกสาร/อีเมลตาม migrations ล่าสุด
  DESCRIBE approval_tokens;

คำแนะนำการ seed/ลำดับ Migration-Seed สำคัญ (ย่อ):
1) สร้างตารางแกนกลาง: curriculums → academics → workflow_step_definitions → student_workflow_activities
2) เอกสาร/เดดไลน์/ท็อกเคน: documents (+flags), important_deadlines, approval_tokens, notification_settings
3) โดเมนเฉพาะ: internship_evaluations, internship_certificate_requests, timeline_steps หรือ project_* (ถ้าเปิดใช้)
4) Seed ข้อมูลตัวอย่างเฉพาะ dev/test เท่านั้น (seed-studentXX-logbook.js, seed-internship-reflections.js ฯลฯ)

การตรวจความพร้อมแบบยกตัวอย่างจากการใช้งานจริง:
- เปิดหน้า “เอกสารของฉัน” (นักศึกษา): เอกสารที่ผูกกับ important_deadlines จะแสดงสถานะตรงกับ policy late/lock; บันทึกส่งช้าแล้วถูกปักธง late
- หน้า “หลักสูตร/เทอมปัจจุบัน” (ผู้ดูแล): GET /api/curriculums/active ให้ค่า activeCurriculum ตรงกับ academics ล่าสุด
- ฝั่งอาจารย์ตรวจเอกสาร: Agent แจ้งเตือนเอกสารค้าง > 5 วัน ปรากฏใน log และสรุปจำนวนรายการที่ต้องตรวจ

อัปเดต: 2025-09-24 (เติมตารางและตัวอย่างการใช้งานจริงของ Section 10 จาก migrations/seeders/controllers ในรีโป)
- ตาราง Operational Baseline อาจเริ่มว่าง (0 record) แต่ schema ต้องมีให้พร้อม → ควรมี smoke test ตรวจ
- Sample data: ควรติด tag หรือชื่อ slug ชัดเจนเพื่อ pipeline ล้างก่อน deploy (เช่น student_code ที่ขึ้นต้น DEV_ หรือใช้ตาราง mapping)

**คู่มือย่อ: สร้างบัญชีเจ้าหน้าที่ภาควิชาคนแรก (production)**
1. ตั้งค่าตัวแปรสิ่งแวดล้อมเชื่อมต่อฐานข้อมูล production (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, ฯลฯ) และถ้าต้องการป้อนรหัสผ่านแบบไม่แสดง ให้ตั้ง `INITIAL_STAFF_PASSWORD` ไว้ล่วงหน้า
2. รันคำสั่งภายใต้โฟลเดอร์ `backend`
   ```powershell
   node scripts/manual/createInitialSupportStaff.js
   ```
3. กรอกข้อมูลตามที่สคริปต์ถาม (อีเมล, username, teacher_code, ตำแหน่ง ฯลฯ) → ระบบจะสร้าง `users` + `teachers` (teacher_type=support) ภายใต้ธุรกรรมเดียว
4. ส่งมอบ username/password ให้เจ้าหน้าที่ และสั่งให้เปลี่ยนรหัสผ่านทันทีหลังเข้าสู่ระบบ
5. ลบค่าตัวแปร `INITIAL_STAFF_PASSWORD` ออกจาก shell/secret store หลังใช้งาน เพื่อความปลอดภัย

### 10.1 สิ่งที่ต้องตรวจอัตโนมัติ (Proposed Checks)
| Check | วิธีตรวจ | เกณฑ์ผ่าน |
|-------|----------|-----------|
| มีอย่างน้อย 1 curriculum active | SELECT count(*) FROM curriculums WHERE active=1 | >=1 |
| academics ปัจจุบัน | SELECT count(*) FROM academics WHERE is_current=1 | =1 |
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
