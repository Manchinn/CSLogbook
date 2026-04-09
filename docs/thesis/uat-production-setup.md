# UAT Production Setup — สำหรับ Screenshot บทที่ 5

> รันทุก command บน VPS (SSH เข้า deploy@cslogbook.me) ยกเว้นมีระบุเป็นอย่างอื่น

---

## ขั้นตอนที่ 1 — ตรวจสอบ UAT accounts

```bash
docker exec cslogbook-mysql mysql --default-character-set=utf8mb4 \
  -u deploy_cslogbook -p'DB_PASSWORD' cslogbook_prod \
  -e "SELECT username, role FROM users WHERE username IN ('uat_admin','uat_advisor','uat_committee','uat_intern','uat_proj','uat_thesis');"
```

- ได้ **6 rows** → ข้ามไป ขั้นตอนที่ 2 ได้เลย
- ได้ **0 rows** → ต้องรัน seed ใน ขั้นตอนที่ 1b

### ขั้นตอนที่ 1b — รัน UAT seed (ถ้ายังไม่มี)

```bash
docker exec cslogbook-backend sh -c \
  "cd /app && NODE_ENV=production npx sequelize-cli db:seed --seed seeders/dev/20260310120000-uat-happy-path.js"
```

ควรเห็น: `[UAT seed] สร้างข้อมูล happy-path สำเร็จ (3 tracks)`

ถ้า error เรื่อง curriculum ไม่มี:
```bash
# รัน curriculum seed ก่อน แล้วค่อยรัน UAT seed
docker exec cslogbook-backend sh -c \
  "cd /app && NODE_ENV=production npx sequelize-cli db:seed --seed seeders/20250428080912-create-default-curriculum.js"
```

---

## ขั้นตอนที่ 2 — สร้าง ApprovalTokens สำหรับ Token-based Pages

Token-based pages ที่ต้องการ:
- **ภาพ 5-19**: `/approval/timesheet/uat-timesheet-approval-2026`
- **ภาพ 5-21/5-22**: `/evaluate/supervisor/uat-evaluation-form-2026`

รัน SQL ต่อไปนี้:

```sql
-- ดึง IDs ที่จำเป็นก่อน
SET @intern_user_id = (SELECT user_id FROM users WHERE username = 'uat_intern');
SET @intern_doc_id = (SELECT document_id FROM documents
  WHERE user_id = @intern_user_id AND document_name = 'CS05'
  ORDER BY document_id DESC LIMIT 1);
SET @internship_id = (SELECT internship_id FROM internship_documents
  WHERE document_id = @intern_doc_id);
SET @intern_student_id = (SELECT student_id FROM students WHERE user_id = @intern_user_id);
SET @logbook_ids = (
  SELECT GROUP_CONCAT(log_id ORDER BY log_id SEPARATOR ',')
  FROM internship_logbooks WHERE internship_id = @internship_id LIMIT 1
);

-- Token 1: Timesheet Approval (ภาพ 5-19)
INSERT INTO approval_tokens
  (token, email, document_id, log_id, supervisor_id, student_id, type, status, expires_at, created_at, updated_at)
VALUES (
  'uat-timesheet-approval-2026',
  'supervisor@example.com',
  @intern_doc_id,
  @logbook_ids,
  'supervisor-uat-001',
  '9900062610100',
  'full',
  'pending',
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  NOW(),
  NOW()
);

-- Token 2: Supervisor Evaluation Form (ภาพ 5-21/5-22)
INSERT INTO approval_tokens
  (token, email, document_id, log_id, supervisor_id, student_id, type, status, expires_at, created_at, updated_at)
VALUES (
  'uat-evaluation-form-2026',
  'supervisor@example.com',
  @intern_doc_id,
  NULL,
  'supervisor-uat-001',
  '9900062610100',
  'supervisor_evaluation',
  'pending',
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  NOW(),
  NOW()
);

-- ยืนยัน
SELECT token_id, token, type, status, expires_at FROM approval_tokens
WHERE token LIKE 'uat-%';
```

วิธีรัน SQL บน production:

```bash
docker exec cslogbook-mysql mysql --default-character-set=utf8mb4 \
  -u deploy_cslogbook -p'DB_PASSWORD' cslogbook_prod << 'SQL'
SET @intern_user_id = (SELECT user_id FROM users WHERE username = 'uat_intern');
SET @intern_doc_id = (SELECT document_id FROM documents
  WHERE user_id = @intern_user_id AND document_name = 'CS05'
  ORDER BY document_id DESC LIMIT 1);
SET @internship_id = (SELECT internship_id FROM internship_documents
  WHERE document_id = @intern_doc_id);
SET @logbook_ids = (
  SELECT GROUP_CONCAT(log_id ORDER BY log_id SEPARATOR ',')
  FROM internship_logbooks WHERE internship_id = @internship_id
);

INSERT INTO approval_tokens
  (token, email, document_id, log_id, supervisor_id, student_id, type, status, expires_at, created_at, updated_at)
VALUES (
  'uat-timesheet-approval-2026', 'supervisor@example.com',
  @intern_doc_id, @logbook_ids, 'supervisor-uat-001', '9900062610100',
  'full', 'pending', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW()
);

INSERT INTO approval_tokens
  (token, email, document_id, log_id, supervisor_id, student_id, type, status, expires_at, created_at, updated_at)
VALUES (
  'uat-evaluation-form-2026', 'supervisor@example.com',
  @intern_doc_id, NULL, 'supervisor-uat-001', '9900062610100',
  'supervisor_evaluation', 'pending', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW()
);

SELECT token_id, token, type, status, expires_at FROM approval_tokens WHERE token LIKE 'uat-%';
SQL
```

---

## ขั้นตอนที่ 3 — URLs พร้อมใช้สำหรับ Screenshot

| ภาพ | URL |
|-----|-----|
| 5-19 | `https://cslogbook.me/approval/timesheet/uat-timesheet-approval-2026` |
| 5-21 | `https://cslogbook.me/evaluate/supervisor/uat-evaluation-form-2026` |
| 5-22 | (scroll down จากหน้าเดิม) |

---

## ขั้นตอนที่ 4 — ตรวจสอบ State ข้อมูลสำหรับแต่ละ Screenshot

```bash
docker exec cslogbook-mysql mysql --default-character-set=utf8mb4 \
  -u deploy_cslogbook -p'DB_PASSWORD' cslogbook_prod \
  -e "
SELECT 'USERS' as section, username, role FROM users WHERE username LIKE 'uat_%'
UNION ALL
SELECT 'INTERNSHIP_STATUS', u.username, d.status
  FROM documents d JOIN users u ON d.user_id = u.user_id
  WHERE u.username = 'uat_intern' AND d.document_type = 'INTERNSHIP'
UNION ALL
SELECT 'LOGBOOKS', u.username, CONCAT(COUNT(*), ' entries')
  FROM internship_logbooks il
  JOIN students s ON il.student_id = s.student_id
  JOIN users u ON s.user_id = u.user_id
  WHERE u.username = 'uat_intern'
  GROUP BY u.username
UNION ALL
SELECT 'EVALUATION', u.username, ie.status
  FROM internship_evaluations ie
  JOIN students s ON ie.student_id = s.student_id
  JOIN users u ON s.user_id = u.user_id
  WHERE u.username = 'uat_intern'
UNION ALL
SELECT 'TOKENS', token, type FROM approval_tokens WHERE token LIKE 'uat-%';
"
```

ผลลัพธ์ที่คาดหวัง:
```
USERS          | uat_admin    | admin
USERS          | uat_advisor  | teacher
...
INTERNSHIP     | uat_intern   | approved
LOGBOOKS       | uat_intern   | 3 entries
EVALUATION     | uat_intern   | completed
TOKENS         | uat-timesheet-approval-2026 | full
TOKENS         | uat-evaluation-form-2026    | supervisor_evaluation
```

---

## Cleanup — ลบ UAT data หลังถ่าย Screenshot เสร็จ

```bash
# ลบ ApprovalTokens ที่สร้าง
docker exec cslogbook-mysql mysql --default-character-set=utf8mb4 \
  -u deploy_cslogbook -p'DB_PASSWORD' cslogbook_prod \
  -e "DELETE FROM approval_tokens WHERE token LIKE 'uat-%';"

# ลบ UAT accounts ทั้งหมด (ผ่าน seed rollback)
docker exec cslogbook-backend sh -c \
  "cd /app && NODE_ENV=production npx sequelize-cli db:seed:undo --seed seeders/dev/20260310120000-uat-happy-path.js"
```

---

## หมายเหตุ

- `DB_PASSWORD` = password ของ MySQL user `deploy_cslogbook` (ดูจาก `.env.production` ใน `/home/deploy/app/cslogbook/backend/`)
- ถ้า token pages แสดง error "token ไม่พบ" → ตรวจว่า column names ใน `approval_tokens` ตรงกับที่ insert
- ถ้า evaluation form ภาพ 5-21 แสดง "ประเมินแล้ว" แทนที่จะเป็น form → อาจต้องลบ `internship_evaluations` ที่มีอยู่แล้วออกก่อน แล้ว screenshot ใหม่
