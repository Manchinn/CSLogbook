# สรุป Deadline Mapping และชื่อ Deadline

## ✅ การแก้ไขที่ทำไปแล้ว

### 1. แก้ไข Error: `documentSubtype` ไม่มีในตาราง `ImportantDeadline`

**ปัญหา:** หลายไฟล์พยายามใช้ฟิลด์ `documentSubtype` จากตาราง `ImportantDeadline` แต่ฟิลด์นี้มีอยู่ในตาราง `DeadlineWorkflowMapping` เท่านั้น

**ไฟล์ที่แก้ไข:**
- `backend/utils/requestDeadlineChecker.js` - ลบ `documentSubtype` ออกจาก deadlineInfo
- `backend/utils/deadlineChecker.js` - ลบ `documentSubtype` ออกจาก applicableDeadline และแก้ `buildDeadlineOrderClause()`
- `backend/middleware/deadlineEnforcementMiddleware.js` - ลบการกรอง `documentSubtype` จาก where clause

### 2. เพิ่มการกรองด้วยชื่อ Deadline เพื่อความเฉพาะเจาะจง

**เพิ่มฟิลด์ `deadlineName` ใน Workflow Mapping:**
- `backend/constants/workflowDeadlineMapping.js` - เพิ่ม `deadlineName` ในทุก mapping

**ปรับปรุง Middleware:**
- `backend/middleware/deadlineEnforcementMiddleware.js` - เพิ่มการกรองด้วย `name` field

## 📋 Deadline Names Mapping

### Project 1 (Capstone)

| Phase | Template ID | Deadline Name | Related To |
|-------|------------|---------------|------------|
| TOPIC_SUBMISSION | PROJECT1_PROPOSAL_SUBMISSION | ส่งหัวข้อโครงงานพิเศษ 1 | project1 |
| TOPIC_EXAM_PENDING | PROJECT1_DEFENSE_REQUEST_SUBMISSION | ส่งคำร้องขอสอบ (คพ.02) | project1 |

### Project 2 (Thesis)

| Phase | Template ID | Deadline Name | Related To |
|-------|------------|---------------|------------|
| IN_PROGRESS | PROJECT_SYSTEM_TEST_REQUEST | ยื่นคำขอทดสอบระบบ | project2 |
| THESIS_SUBMISSION | THESIS_DEFENSE_REQUEST_SUBMISSION | ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03) | project2 |
| THESIS_EXAM_PASSED | THESIS_FINAL_SUBMISSION | ส่งปริญญานิพนธ์ฉบับสมบูรณ์ | project2 |

### Internship

| Phase | Template ID | Deadline Name | Related To |
|-------|------------|---------------|------------|
| PENDING_CS05_SUBMISSION | INTERNSHIP_CS05_SUBMISSION | ยื่นคำร้องขอฝึกงาน (คพ.05) | internship |
| IN_PROGRESS | INTERNSHIP_REPORT_SUBMISSION | ส่งรายงานผลการฝึกงาน | internship |

## ⚠️ หมายเหตุสำคัญ

### ชื่อ Deadline ต้องตรงกันระหว่าง:
1. **Seeder** (`backend/seeders/20251104000000-seed-test-deadlines.js`)
2. **Workflow Mapping** (`backend/constants/workflowDeadlineMapping.js`)

### ตัวอย่างสำหรับคำขอทดสอบระบบ:

**Seeder:**
```javascript
{
  name: 'ยื่นคำขอทดสอบระบบ',
  related_to: 'project2',
  deadline_type: 'SUBMISSION',
  // ...
}
```

**Workflow Mapping:**
```javascript
IN_PROGRESS: {
  templateId: 'PROJECT_SYSTEM_TEST_REQUEST',
  deadlineName: 'ยื่นคำขอทดสอบระบบ',
  relatedTo: 'project2',
  deadlineType: 'SUBMISSION',
  // ...
}
```

**Middleware จะค้นหา:**
```javascript
WHERE name = 'ยื่นคำขอทดสอบระบบ'
  AND relatedTo = 'project2'
  AND deadlineType = 'SUBMISSION'
  AND academicYear = '2568'
  AND semester = 1
  AND isPublished = true
```

## 🎯 ข้อดีของการใช้ชื่อ Deadline

1. **ความเฉพาะเจาะจง:** ค้นหา deadline ที่ตรงกับงานเฉพาะมากขึ้น
2. **หลีกเลี่ยงความซ้ำซ้อน:** ถ้ามีหลาย deadline ในปีเดียวกัน ชื่อจะช่วยแยกแยะ
3. **อ่านง่าย:** ชื่อที่ชัดเจนทำให้เข้าใจได้ทันที
4. **ไม่ต้องพึ่ง `documentSubtype`:** ซึ่งไม่มีในตาราง `ImportantDeadline`

## 🔧 การทดสอบ

### สิ่งที่ต้องตรวจสอบ:
1. ✅ Run seeder เพื่อสร้าง deadline ทดสอบ
2. ✅ ส่งคำขอทดสอบระบบ → ควรตรวจสอบ deadline ได้
3. ✅ ส่งคำร้องขอสอบ (คพ.02, คพ.03) → ควรตรวจสอบ deadline ได้
4. ✅ ส่งเอกสารอื่นๆ → ควรตรวจสอบ deadline ได้

### คำสั่งทดสอบ:
```bash
# 1. Run seeder
npm run db:seed:specific 20251104000000-seed-test-deadlines.js

# 2. ตรวจสอบข้อมูลใน database
# SELECT * FROM important_deadlines WHERE academic_year = '2568' AND semester = 1;

# 3. ทดสอบส่งคำขอทดสอบระบบผ่าน API
```

## 📝 สิ่งที่ควรทำต่อไป

### สำหรับ Internship (ถ้าจำเป็น):
ถ้าต้องการ deadline สำหรับฝึกงาน ให้สร้าง seeder เพิ่มเติม:

```javascript
{
  name: 'ยื่นคำร้องขอฝึกงาน (คพ.05)',
  related_to: 'internship',
  deadline_type: 'SUBMISSION',
  // ...
}
```

---

**วันที่อัปเดต:** 4 พฤศจิกายน 2568  
**ผู้จัดทำ:** AI Assistant

