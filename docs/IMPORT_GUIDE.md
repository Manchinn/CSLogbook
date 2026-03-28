# Import Guide — CSLogbook Production

> คู่มือ import ข้อมูลจริงเข้าระบบ CSLogbook สำหรับ production server
> อัปเดตล่าสุด: 2026-03-28 (Session 59)

---

## สรุปข้อมูลที่ import ได้

| Seed Script | ข้อมูล | Excel Source |
|---|---|---|
| `20260328200000-import-project-exam-2568-s2.js` | โครงงานพิเศษ ภาค 2/2568 | รายชื่อยื่นขอทดลองโครงงาน ประจำภาค 2-2568.xlsx |
| `20260328210000-import-internship-2567-2568.js` | ฝึกงาน 2567 + 2568 | ใบรับรองฝึกงาน 2567.docx.xlsx, ฝึกงาน 2567.xlsx, ฝึกงาน 2568.xlsx |

---

## ขั้นตอนเตรียมการ (ทำก่อน import)

### 1. ตรวจสอบ prerequisites

```bash
cd cslogbook/backend

# ตรวจ exceljs
node -e "require('exceljs'); console.log('OK')"

# ถ้าไม่มี:
npm install exceljs
```

### 2. วาง Excel files บน server

Script อ่านจาก path ที่กำหนดใน CONFIG ของแต่ละ seeder:

| Script | ค่าปัจจุบัน (dev) |
|---|---|
| Project exam | `~/OneDrive/เอกสาร/รายชื่อยื่นขอทดลองโครงงาน ประจำภาค 2-2568.xlsx` |
| Internship | `~/OneDrive/เอกสาร/ใบรับรองฝึกงาน ประจำปี 2567.docx.xlsx` |
| Internship | `~/OneDrive/เอกสาร/ฝึกงาน 2567.xlsx` |
| Internship | `~/OneDrive/เอกสาร/ฝึกงาน 2568.xlsx` |

**สำหรับ production:** แก้ `EXCEL_PATH` / `BASE_UPLOAD_DIR` ใน seeder ให้ชี้ไปที่ path บน server

```javascript
// ตัวอย่าง: แก้ใน seeder ก่อนรัน
const EXCEL_PATH = '/home/deploy/imports/รายชื่อยื่นขอทดลองโครงงาน ประจำภาค 2-2568.xlsx';
```

### 3. ตรวจสอบข้อมูลพื้นฐานใน DB

#### 3.1 อาจารย์ (teacher_code)

Script ใช้ `teacher_code` match อาจารย์ที่ปรึกษา ตรวจสอบว่ามีครบ:

```sql
SELECT teacher_id, teacher_code FROM teachers WHERE teacher_code IS NOT NULL;
```

รหัสที่ใช้ใน Excel: `TSR`, `PRV`, `KSB`, `GDP`, `SWK`, `AWS`, `NKS`, `KAB`, `ART`, `ENS`, `YCK`, `CHR`, `SSP`, `ADP`, `NJR`, `SRS`

#### 3.2 นักศึกษา (student_code)

Script ใช้ `student_code` match นักศึกษา:

```sql
-- ตรวจว่ามีนักศึกษากี่คนจากทั้งหมดใน Excel
SELECT COUNT(*) FROM students
WHERE student_code IN ('6504062636136', '6504062636357', ...);
```

**หากนักศึกษาไม่มีใน DB:**
- Project seed จะสร้างโปรเจกต์ด้วยสมาชิกที่พบ (partial import) แล้ว WARN สมาชิกที่ขาด
- Internship seed จะ SKIP นักศึกษาที่ไม่พบ
- ต้องสร้าง user + student ก่อน import (ดูหัวข้อ "การเพิ่มนักศึกษาที่ขาด")

---

## วิธี Import

### Project Exam (โครงงานพิเศษ)

```bash
cd cslogbook/backend

# 1. Dry run — ตรวจ log ก่อน (optional: แก้ t.commit() เป็น t.rollback() ใน script)

# 2. Run seed
NODE_ENV=production npx sequelize-cli db:seed --seed 20260328200000-import-project-exam-2568-s2.js

# 3. ตรวจผลลัพธ์
# ดู log output: สร้างสำเร็จกี่รายการ, SKIP กี่รายการ, WARN อะไรบ้าง
```

**ผลลัพธ์ที่สร้าง:**
- `project_documents` — 1 record per project (`status: 'advisor_assigned'`)
- `project_members` — N records per project (leader + members)
- ชื่อโปรเจกต์มี prefix `[IMPORT_PROJECT_EXAM_2568_S2_v1]` สำหรับ tracking

**Rollback:**
```bash
NODE_ENV=production npx sequelize-cli db:seed:undo --seed 20260328200000-import-project-exam-2568-s2.js
```

### Internship (ฝึกงาน)

```bash
cd cslogbook/backend

# Run seed
NODE_ENV=production npx sequelize-cli db:seed --seed 20260328210000-import-internship-2567-2568.js

# ตรวจผลลัพธ์
```

**ผลลัพธ์ที่สร้าง:**
- `documents` — 1 record per student (`document_type: 'INTERNSHIP'`, `document_name: 'CS05'`, `status: 'approved'`)
- `internship_documents` — 1 record per student (company_name, start_date, end_date, contact)
- `file_path` มี prefix `internship/import-cert-2567/` สำหรับ tracking

**Rollback:**
```bash
NODE_ENV=production npx sequelize-cli db:seed:undo --seed 20260328210000-import-internship-2567-2568.js
```

---

## การเพิ่มนักศึกษาที่ขาด

หากนักศึกษาไม่มีใน DB ต้องสร้างก่อน import:

```sql
-- 1. สร้าง user
INSERT INTO users (username, password, email, role, first_name, last_name, active_status, created_at, updated_at)
VALUES (
  '6404062636412',                          -- username = student_code
  '$2b$10$...',                             -- bcrypt hash ของ password เริ่มต้น
  '6404062636412@kmitl.ac.th',              -- email
  'student',
  'พิชชากร',                                -- first_name
  'อัตตะเปโม',                              -- last_name
  1, NOW(), NOW()
);

-- 2. สร้าง student (ใช้ user_id จากข้อ 1)
INSERT INTO students (user_id, student_code, study_type, is_eligible_project, is_enrolled_project, project_status, created_at, updated_at)
VALUES (
  LAST_INSERT_ID(),                         -- user_id
  '6404062636412',                          -- student_code
  'regular',
  1,                                        -- eligible for project
  1,                                        -- enrolled in project
  'in_progress',
  NOW(), NOW()
);
```

**Generate password hash:**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('changeme123', 10).then(h => console.log(h))"
```

---

## Idempotency (การ import ซ้ำ)

ทั้ง 2 scripts มี guard ป้องกัน import ซ้ำ:

| Script | Guard |
|---|---|
| Project | ตรวจ `project_name_th LIKE '[IMPORT_PROJECT_EXAM_2568_S2_v1]%'` — ถ้าพบ skip ทั้งหมด |
| Internship | ตรวจ `file_path LIKE 'internship/import-cert-2567/%'` — ถ้าพบ skip ทั้งหมด |

หากต้องการ import ใหม่: undo ก่อนแล้ว seed ใหม่

---

## ตรวจสอบหลัง import

### Project

```sql
-- นับโปรเจกต์
SELECT COUNT(*) FROM project_documents
WHERE project_name_th LIKE '[IMPORT_PROJECT_EXAM_2568_S2_v1]%';
-- คาดหวัง: 26 (dev) หรือมากกว่าถ้า prod มีนักศึกษาครบ

-- ตรวจ members
SELECT pd.project_id,
       REPLACE(pd.project_name_th, '[IMPORT_PROJECT_EXAM_2568_S2_v1] ', '') as name,
       COUNT(pm.student_id) as members
FROM project_documents pd
JOIN project_members pm ON pd.project_id = pm.project_id
WHERE pd.project_name_th LIKE '[IMPORT_PROJECT_EXAM_2568_S2_v1]%'
GROUP BY pd.project_id, pd.project_name_th;

-- ตรวจ duplicates (ควรเป็น 0)
SELECT REPLACE(project_name_th, '[IMPORT_PROJECT_EXAM_2568_S2_v1] ', '') as name, COUNT(*) as cnt
FROM project_documents
WHERE project_name_th LIKE '[IMPORT_PROJECT_EXAM_2568_S2_v1]%'
GROUP BY name HAVING cnt > 1;
```

### Internship

```sql
-- นับ records
SELECT COUNT(*) FROM documents
WHERE file_path LIKE 'internship/import-cert-2567/%';
-- คาดหวัง: 61 (dev) หรือมากกว่าถ้า prod มีนักศึกษาครบ

-- ตรวจ data quality
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN id.company_name != '' THEN 1 ELSE 0 END) as has_company,
  SUM(CASE WHEN id.start_date IS NOT NULL THEN 1 ELSE 0 END) as has_dates,
  SUM(CASE WHEN id.contact_person_name != '' THEN 1 ELSE 0 END) as has_contact
FROM documents d
JOIN internship_documents id ON d.document_id = id.document_id
WHERE d.file_path LIKE 'internship/import-cert-2567/%';

-- ตรวจแสดงใน /internship-companies (status ต้องเป็น approved)
SELECT status, COUNT(*) FROM documents
WHERE file_path LIKE 'internship/import-cert-2567/%'
GROUP BY status;
-- ต้องเป็น: approved = ทั้งหมด
```

---

## Dev Import Results (2026-03-28)

| Data | สร้างสำเร็จ | Skip | หมายเหตุ |
|---|---|---|---|
| Project 2568/2 | 26 projects (53 members) | 16 projects | 16 projects ไม่พบนักศึกษาเลย (รหัสเก่า/สาขา 660/663) |
| Internship 2567/2568 | 61 records | 31 records | 31 คน ไม่พบใน DB |
| เพิ่มนักศึกษา | 11 คน | — | สร้าง user+student เพื่อเติมสมาชิกที่ขาด |

### สาเหตุที่ Skip

- **รหัส 60-63** (รุ่นเก่า) ส่วนใหญ่ไม่มีใน local dev DB
- **สาขา 660, 663** (IT) ไม่มีใน DB เลย
- Production DB อาจมีนักศึกษาครบกว่า → import ได้มากกว่า

### Bugs ที่แก้แล้วใน Seed Scripts

| Bug | Fix |
|---|---|
| `QueryTypes.SELECT` destructuring | `const [rows]` → `const rows` (ทั้ง up + down) |
| Project สร้าง 1 record per student | Group by topic → 1 project + N members |
| Internship status `completed` | เปลี่ยนเป็น `approved` (ตรงกับ query ของ /internship-companies) |
| Excel path hardcoded | ใช้ `process.env.USERPROFILE` / configurable |
| Skip ทั้ง project ถ้าขาดสมาชิก 1 คน | สร้าง project ด้วยสมาชิกที่พบ (partial import) |

---

## Checklist สำหรับ Production

```
[ ] 1. Push code ไป master (CI/CD จะ build + migrate อัตโนมัติ)
[ ] 2. SSH เข้า production server
[ ] 3. วาง Excel files ไว้บน server (เช่น /home/deploy/imports/)
[ ] 4. แก้ EXCEL_PATH ใน seeder ให้ตรงกับ path บน server
[ ] 5. ตรวจ teacher_code ใน production DB ว่ามีครบ
[ ] 6. ตรวจ student_code — ถ้าขาดให้สร้าง user+student ก่อน
[ ] 7. Run internship seed ก่อน:
      NODE_ENV=production npx sequelize-cli db:seed --seed 20260328210000-import-internship-2567-2568.js
[ ] 8. ตรวจผล: status = approved, แสดงใน /internship-companies
[ ] 9. Run project seed:
      NODE_ENV=production npx sequelize-cli db:seed --seed 20260328200000-import-project-exam-2568-s2.js
[ ] 10. ตรวจผล: ไม่มี duplicates, members ถูกต้อง
[ ] 11. ลบ Excel files ออกจาก server (ข้อมูลส่วนบุคคล)
```

---

## ลำดับการรัน (สำคัญ)

1. **Migration** ก่อน (ผ่าน CI/CD)
2. **Internship seed** ก่อน project (ไม่มี dependency แต่แนะนำลำดับนี้)
3. **Project seed** ทีหลัง
4. **ตรวจผล** ทั้ง 2 ชุด
5. **ลบ Excel** หลัง import เสร็จ
