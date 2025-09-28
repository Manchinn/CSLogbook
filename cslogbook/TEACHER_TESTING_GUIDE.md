# คู่มือการทดสอบบทบาทอาจารย์ (Teacher Testing Guide)

## 1. เป้าหมายและขอบเขต
- ยืนยันว่า RBAC ระหว่าง `teacherType: 'academic'` และ `teacherType: 'support'` ทำงานถูกต้องทั้งฝั่ง API และ UI
- ตรวจสอบ regression จากการแปลง role `admin` เป็น `teacher` และการแก้ไข service/controller

## 2. ภาพรวมผลลัพธ์ที่คาดหวัง
| หัวข้อ | Academic | Support | เกณฑ์ผ่าน |
| --- | --- | --- | --- |
| Login & Token | ✅ รับ token ที่มี `teacherType` | ✅ รับ token ที่มี `teacherType` | Token payload มี `teacherType` และ `isSystemAdmin` (เฉพาะ support) |
| เมนูและ Badge | ✅ แสดงเมนู "อาจารย์สายวิชาการ" | ✅ แสดงเมนู "ผู้ดูแลระบบ" | เมนูไม่ปนกันและ badge แสดงชื่อบทบาทถูกต้อง |
| การเข้าถึงหน้า | ✅ `/teacher/*` | ✅ `/admin/*` | หน้าอีกฝ่ายต้องถูกปฏิเสธ (403/redirect) |
| API | ✅ Academic APIs, ❌ Support APIs | ✅ Support APIs, ❌ Academic APIs | ทดสอบด้วย `scripts/testTeacherAPIs.js` |
| Data Lookup | ✅ `GET /api/teachers/user/:userId` | ✅ `GET /api/teachers/user/:userId` | คืนข้อมูล teacher ครบถ้วน |

## 3. การเตรียมระบบ
```bash
cd backend
npm install # หากยังไม่เคยติดตั้ง
npm run migrate
node scripts/createTestTeachers.js
node scripts/checkTeacherTypes.js
```

รันเซิร์ฟเวอร์
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2 (optional สำหรับ frontend)
cd ../frontend
npm install
npm start
```

## 4. การทดสอบอัตโนมัติ (Backend)
```bash
cd backend
node scripts/testTeacherAPIs.js
```
- สคริปต์จะแสดงผลสรุปการเข้าถึงของทั้งสองบทบาท ต้องไม่มีสถานะ ❌
- หากต้องการตรวจเพียง token/ข้อมูล สามารถเรียกใช้ `node scripts/testSupportStaffFix.js` เพื่อดูเมนู/role ที่จำลอง

## 5. การทดสอบแบบ Manual – ฝั่ง UI

### 5.1 Academic Teacher (`academic_teacher` / `password123`)
1. **เข้าสู่ระบบ** และยืนยัน localStorage:
  ```javascript
  localStorage.getItem('role') === 'teacher'
  localStorage.getItem('teacherType') === 'academic'
  ```
2. **ตรวจเมนู Sidebar** ต้องเห็นกลุ่ม "อาจารย์สายวิชาการ" เท่านั้น
  - ตรวจสอบเมนูย่อย: ตรวจสอบเอกสาร, นักศึกษาในที่ปรึกษา, อนุมัติหัวข้อโครงงาน, ประเมินผลการฝึกงาน
3. **ทดสอบการเข้าถึงหน้า**
  - เข้า `/teacher/review-documents`, `/teacher/advising`, `/teacher/project-approval`, `/teacher/evaluation` → ต้องเข้าถึงได้
  - ลองเข้า `/admin/users` หรือ `/admin/settings` → ต้องถูกปฏิเสธ (403 หรือ redirect หน้าแรก)
4. **ตรวจ Network (DevTools > Network)**
  - คำขอที่ควรสำเร็จ: `GET /api/teachers/academic/dashboard`, `POST /api/teachers/academic/evaluation`
  - คำขอที่ควรถูกปฏิเสธ: `GET /api/teachers/support/dashboard`

### 5.2 Support Teacher (`support_staff` / `password123`)
1. ออกจากระบบ แล้วเข้าสู่ระบบใหม่ → localStorage ควรเก็บ `teacherType = 'support'`
2. Sidebar ต้องแสดงเมนู "ผู้ดูแลระบบ" พร้อมเมนูย่อย
  - จัดการผู้ใช้ (นักศึกษา/อาจารย์), จัดการเอกสาร, ตั้งค่าระบบ, รายงานสถิติ, ประกาศและแจ้งเตือน
3. ทดสอบการเข้าถึงหน้า
  - เข้า `/admin/users/students`, `/admin/documents`, `/admin/settings`, `/admin/reports`, `/admin/announcements` → ต้องเข้าถึงได้
  - ลองเข้า `/teacher/review-documents` → ต้องถูกปฏิเสธ
4. ตรวจ API บน Network tab
  - สำเร็จ: `GET /api/teachers/support/dashboard`, `POST /api/teachers/support/announcement`
  - ถูกปฏิเสธ: `GET /api/teachers/academic/dashboard`

## 6. เช็กพิเศษและ Regression
- **แปลง admin เป็น support**: `node scripts/checkTeacherTypes.js` ต้องรายงานว่าไม่เหลือ role `admin`
- **สร้าง/แก้ teacher type**
  - ใช้หน้า `/admin/users/teachers` เพื่อเพิ่ม/แก้ไข แล้วตรวจผลในฐานข้อมูล
- **Batch Upload**: ทดสอบ `support` เมื่อต้องอัปโหลดรายชื่อ เพื่อเช็กสิทธิ์ไฟล์

## 7. Troubleshooting
| อาการ | สาเหตุที่พบบ่อย | วิธีแก้ |
| --- | --- | --- |
| ล็อกอินไม่ได้ | ข้อมูล seed ยังไม่ถูกสร้าง | รัน `node scripts/createTestTeachers.js` |
| เมนูไม่ตรง | LocalStorage ค้างค่าเก่า หรือ Context ไม่อัปเดต | ล้าง cache, logout/login ใหม่, ตรวจ `AuthContext` | 
| API ได้ 403 ผิดบทบาท | token ไม่ได้แนบ หรือ `checkTeacherType` ทำงานผิด | ตรวจ header Authorization, ดู log ใน `backend/logs/` |
| หน้า 404 | Route frontend ยังไม่ผูก | ตรวจ `frontend/src/App.js` และไฟล์ route เฉพาะบทบาท |

## 8. Template บันทึกผล
```markdown
# ผลการทดสอบ Teacher RBAC
- วันที่ทดสอบ: _______
- เวอร์ชัน commit: _______

## ผลลัพธ์
- [ ] Migration + seed ผ่าน
- [ ] สคริปต์ `testTeacherAPIs.js` ผ่าน
- [ ] Academic UI ผ่าน
- [ ] Support UI ผ่าน
- [ ] Regression อื่น ๆ ผ่าน

## ประเด็นที่พบ
- Issue: _______
- สาเหตุ: _______
- แนวทางแก้: _______

## หมายเหตุเพิ่มเติม
- _______
```

## 9. ความเชื่อมโยงกับเอกสารอื่น
- ภาพรวมบทบาทและไทม์ไลน์การปรับระบบ: `TEACHER_ROLE_EXTENSION_SUMMARY.md`
- แนะนำให้อัปเดตผลการทดสอบใน `knowledge/` หรือบันทึก sprint ตามมาตรฐานทีม