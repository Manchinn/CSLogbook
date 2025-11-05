# คู่มือทดสอบระบบอัพเดทสถานะการฝึกงาน

## 📋 สรุปการเปลี่ยนแปลง

### 1. การยกเลิกการฝึกงาน
- ✅ อัพเดท CS05 Document เป็น `'cancelled'`
- ✅ อัพเดท Acceptance Letter เป็น `'cancelled'`
- ✅ Reset Student.internshipStatus เป็น `'not_started'`
- ✅ อัพเดท Workflow เป็น `'cancelled'`

### 2. การอัพเดทสถานะเมื่ออนุมัติเอกสาร
- ✅ เมื่ออนุมัติ CS05 → `'pending_approval'` (รอหนังสือตอบรับ)
- ✅ เมื่ออนุมัติ Acceptance Letter → เช็ค startDate:
  - ยังไม่ถึง → `'pending_approval'` (รอฝึกงาน)
  - ถึงแล้ว → `'in_progress'` (อยู่ระหว่างฝึกงาน)

### 3. Agent สำหรับเช็คสถานะอัตโนมัติ
- ✅ ทำงานทุกวันเวลา 02:00 น. (Asia/Bangkok)
- ✅ เช็ค startDate → อัพเดทเป็น `'in_progress'`
- ✅ ไม่เปลี่ยนเป็น `'completed'` เมื่อถึง endDate (ต้องผ่านขั้นตอนทั้งหมดก่อน)

### 4. การอัพเดทสถานะเป็น completed
- ✅ เมื่ออนุมัติหนังสือรับรอง → `'completed'`
- ✅ อัพเดททั้ง Student.internshipStatus และ Workflow

---

## 🧪 วิธีทดสอบ

### ขั้นตอนที่ 1: ทดสอบการยกเลิกการฝึกงาน

#### 1.1 เตรียมข้อมูล
- ใช้บัญชี Admin/เจ้าหน้าที่ภาควิชา
- หานักศึกษาที่มีการฝึกงาน (มี CS05 และ Acceptance Letter ที่อนุมัติแล้ว)

#### 1.2 ทดสอบผ่าน API
```bash
# ใช้ Postman หรือ curl
POST /api/admin/internships/{internshipId}/cancel
Headers:
  Authorization: Bearer {admin_token}
Body:
  {
    "reason": "ทดสอบการยกเลิกการฝึกงาน"
  }
```

#### 1.3 ตรวจสอบผลลัพธ์
```sql
-- ตรวจสอบ CS05
SELECT document_id, status, rejection_reason 
FROM documents 
WHERE document_name = 'CS05' 
  AND document_id = {cs05DocumentId};

-- ควรได้: status = 'cancelled'

-- ตรวจสอบ Acceptance Letter
SELECT document_id, status, rejection_reason 
FROM documents 
WHERE document_name = 'ACCEPTANCE_LETTER' 
  AND user_id = {userId};

-- ควรได้: status = 'cancelled' (ทุกตัวที่เคยมี)

-- ตรวจสอบ Student
SELECT student_id, internship_status, is_enrolled_internship 
FROM students 
WHERE student_id = {studentId};

-- ควรได้: internship_status = 'not_started', is_enrolled_internship = false
```

---

### ขั้นตอนที่ 2: ทดสอบการอัพเดทสถานะเมื่ออนุมัติ CS05

#### 2.1 เตรียมข้อมูล
- หา CS05 ที่ยังไม่ได้รับการอนุมัติ (status = 'pending')

#### 2.2 ทดสอบผ่าน API
```bash
POST /api/internship/cs-05/{documentId}/approve
Headers:
  Authorization: Bearer {head_token}
Body:
  {
    "comment": "อนุมัติ CS05"
  }
```

#### 2.3 ตรวจสอบผลลัพธ์
```sql
SELECT student_id, internship_status 
FROM students 
WHERE student_id = {studentId};

-- ควรได้: internship_status = 'pending_approval'
```

---

### ขั้นตอนที่ 3: ทดสอบการอัพเดทสถานะเมื่ออนุมัติ Acceptance Letter

#### 3.1 เตรียมข้อมูล
- นักศึกษาต้องมี CS05 ที่อนุมัติแล้ว (status = 'approved')
- มี Acceptance Letter ที่รออนุมัติ (status = 'pending')
- ตั้งค่า startDate ใน InternshipDocument:
  - กรณีที่ 1: ตั้งเป็นวันในอนาคต (ทดสอบ pending_approval)
  - กรณีที่ 2: ตั้งเป็นวันในอดีตหรือวันนี้ (ทดสอบ in_progress)

#### 3.2 ทดสอบผ่าน API
```bash
POST /api/internship/acceptance/{documentId}/approve
Headers:
  Authorization: Bearer {head_token}
Body:
  {
    "comment": "อนุมัติหนังสือตอบรับ"
  }
```

#### 3.3 ตรวจสอบผลลัพธ์

**กรณีที่ 1: startDate ยังไม่ถึง**
```sql
SELECT student_id, internship_status 
FROM students 
WHERE student_id = {studentId};

-- ควรได้: internship_status = 'pending_approval'
```

**กรณีที่ 2: startDate ถึงแล้ว**
```sql
SELECT student_id, internship_status 
FROM students 
WHERE student_id = {studentId};

-- ควรได้: internship_status = 'in_progress'
```

---

### ขั้นตอนที่ 4: ทดสอบ Agent

#### 4.1 เรียก Agent ทันที (ไม่ต้องรอ 02:00 น.)
```bash
cd backend
node -e "require('./agents/internshipStatusMonitor').runNow().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })"
```

หรือใช้ script:
```bash
cd backend
node scripts/testInternshipStatusFlow.js
```

#### 4.2 ตรวจสอบ Logs
```bash
# ดู logs ล่าสุด
tail -f backend/logs/app.log | grep InternshipStatusMonitor
```

#### 4.3 ตรวจสอบผลลัพธ์
```sql
-- ตรวจสอบว่ามีการอัพเดทสถานะหรือไม่
SELECT student_id, internship_status, updated_at 
FROM students 
WHERE is_enrolled_internship = true 
  AND updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY updated_at DESC;
```

---

### ขั้นตอนที่ 5: ทดสอบการอัพเดทสถานะเป็น completed

#### 5.1 เตรียมข้อมูล
- นักศึกษาต้องมี:
  - CS05 ที่อนุมัติแล้ว
  - Acceptance Letter ที่อนุมัติแล้ว
  - ถึง startDate แล้ว (in_progress)
  - มีแบบประเมินการฝึกงาน
  - มีคำขอหนังสือรับรอง (status = 'pending')

#### 5.2 ทดสอบผ่าน API
```bash
POST /api/internship/certificate/{requestId}/approve
Headers:
  Authorization: Bearer {admin_token}
Body:
  {
    "certificateNumber": "ว 2567/01/0001"
  }
```

#### 5.3 ตรวจสอบผลลัพธ์
```sql
-- ตรวจสอบ Student
SELECT student_id, internship_status 
FROM students 
WHERE student_id = {studentId};

-- ควรได้: internship_status = 'completed'

-- ตรวจสอบ Workflow
SELECT current_step_key, current_step_status, overall_workflow_status 
FROM student_workflow_activities 
WHERE student_id = {studentId} 
  AND workflow_type = 'internship';

-- ควรได้: 
-- current_step_key = 'INTERNSHIP_COMPLETED'
-- current_step_status = 'completed'
-- overall_workflow_status = 'completed'
```

---

## 🔍 ตรวจสอบ Frontend

### 1. หน้า "รายชื่อนักศึกษาฝึกงานทั้งหมด"
- ตรวจสอบว่าสถานะแสดงถูกต้อง:
  - `pending_approval` → "รอการอนุมัติ"
  - `in_progress` → "อยู่ระหว่างฝึกงาน"
  - `completed` → "เสร็จสิ้น"
- ตรวจสอบว่าสามารถแก้ไขและยกเลิกได้

### 2. หน้า "อัปโหลดหนังสือตอบรับ"
- ตรวจสอบว่าสถานะ `cancelled` แสดงเป็น "หนังสือตอบรับเดิมถูกยกเลิก กรุณาอัปโหลดหนังสือตอบรับใหม่"
- ตรวจสอบว่าสามารถอัปโหลดใหม่ได้

---

## 📊 Checklist การทดสอบ

- [ ] 1. ทดสอบการยกเลิกการฝึกงาน
  - [ ] CS05 ถูกอัพเดทเป็น `cancelled`
  - [ ] Acceptance Letter ถูกอัพเดทเป็น `cancelled`
  - [ ] Student.internshipStatus ถูก reset เป็น `not_started`
  - [ ] Workflow ถูกอัพเดทเป็น `cancelled`

- [ ] 2. ทดสอบการอนุมัติ CS05
  - [ ] Student.internshipStatus เปลี่ยนเป็น `pending_approval`

- [ ] 3. ทดสอบการอนุมัติ Acceptance Letter
  - [ ] ถ้า startDate ยังไม่ถึง → `pending_approval`
  - [ ] ถ้า startDate ถึงแล้ว → `in_progress`

- [ ] 4. ทดสอบ Agent
  - [ ] เรียก `runNow()` ได้
  - [ ] อัพเดทสถานะตาม startDate
  - [ ] ไม่เปลี่ยนเป็น `completed` เมื่อถึง endDate

- [ ] 5. ทดสอบการอนุมัติหนังสือรับรอง
  - [ ] Student.internshipStatus เปลี่ยนเป็น `completed`
  - [ ] Workflow ถูกอัพเดทเป็น `INTERNSHIP_COMPLETED`

---

## 🐛 Debug Tips

### ตรวจสอบ Logs
```bash
# ดู logs ทั้งหมด
tail -f backend/logs/app.log

# กรองเฉพาะ internship status
tail -f backend/logs/app.log | grep -i "internship.*status"

# กรองเฉพาะ agent
tail -f backend/logs/app.log | grep -i "InternshipStatusMonitor"
```

### ตรวจสอบ Database
```sql
-- ดูสถานะทั้งหมดของนักศึกษาที่มีการฝึกงาน
SELECT 
  s.student_id,
  s.student_code,
  u.first_name,
  u.last_name,
  s.internship_status,
  s.is_enrolled_internship,
  id.start_date,
  id.end_date,
  d.status as cs05_status
FROM students s
JOIN users u ON s.user_id = u.user_id
LEFT JOIN documents d ON d.user_id = u.user_id AND d.document_name = 'CS05'
LEFT JOIN internship_documents id ON id.document_id = d.document_id
WHERE s.is_enrolled_internship = true
ORDER BY s.updated_at DESC;
```

### ตรวจสอบ Agent Status
```bash
# เรียก API เพื่อดูสถานะ agent
GET /api/admin/agents/status
```

---

## ✅ สรุป

หลังจากทดสอบครบทุกขั้นตอน ควรได้ผลลัพธ์:
1. ✅ ระบบยกเลิกการฝึกงานได้ถูกต้อง
2. ✅ สถานะอัพเดทตามการอนุมัติเอกสาร
3. ✅ Agent ทำงานอัตโนมัติตาม startDate
4. ✅ สถานะ `completed` ถูกอัพเดทเมื่ออนุมัติหนังสือรับรองเท่านั้น

