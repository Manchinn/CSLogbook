# สรุประบบบทบาทอาจารย์ (Teacher RBAC Overview)

> เอกสารฉบับนี้เป็น snapshot ล่าสุดของทุกการเปลี่ยนแปลงที่เกี่ยวข้องกับบทบาทอาจารย์ในระบบ CSLogbook ตั้งแต่การขยาย RBAC การแก้ไขบั๊ก ไปจนถึงสถานะการทดสอบ ช่วยลดการกระจายข้อมูลจาก 4 ไฟล์เดิมเหลือแหล่งอ้างอิงเดียว

## 1. ภาพรวมล่าสุด
- ระบบแบ่งผู้ใช้ที่มี `role = 'teacher'` ออกเป็น 2 ประเภทผ่านฟิลด์ `teacherType`
  - `academic` → อาจารย์สายวิชาการ/ที่ปรึกษา
  - `support` → เจ้าหน้าที่ภาควิชา (สืบทอดหน้าที่ admin เดิม)
- ผู้ใช้ `admin` เดิมถูกแปลงสถานะให้เป็น `teacher` ที่มี `teacherType: 'support'`
- Token, middleware, เมนู และหน้า UI ใช้ `teacherType` เป็นตัวควบคุมสิทธิ์ร่วมกัน

## 2. โครงสร้างบทบาทและสิทธิ์
| ประเภท | หน้าที่หลัก | หน้าที่ในระบบ | เส้นทาง/เมนูสำคัญ |
| --- | --- | --- | --- |
| `academic` | ดูแลนักศึกษาในที่ปรึกษา | ตรวจ/อนุมัติเอกสาร, อนุมัติหัวข้อ, ประเมินผลฝึกงาน | `/teacher/review-documents`, `/teacher/advising`, `/teacher/project-approval`, `/teacher/evaluation`, `GET /api/teachers/academic/dashboard` |
| `support` | งานธุรการและดูแลระบบ | จัดการผู้ใช้/เอกสาร, ตั้งค่าระบบ, รายงาน, ประกาศ | `/admin/users/*`, `/admin/documents`, `/admin/settings`, `/admin/reports`, `/admin/announcements`, `GET /api/teachers/support/dashboard` |
| ทั้งสองประเภท | ใช้ข้อมูลร่วม | เข้าถึงเอกสารกลาง | `GET /api/teachers/documents` |

## 3. การเปลี่ยนแปลงโครงสร้างข้อมูล
- `backend/migrations/20250101000000-add-teacher-sub-roles.js`
  - เพิ่มคอลัมน์ `teacher_type` (ENUM: academic/support) และดัชนี `idx_teachers_teacher_type`
- `backend/migrations/20250101000001-convert-admin-to-teacher-support.js`
  - แปลงผู้ใช้ `admin` เป็น `teacherType: 'support'` โดยสร้างแถวใน `teachers`
- สคริปต์ตรวจสอบ `backend/scripts/checkTeacherTypes.js` ใช้ยืนยันผลลัพธ์หลัง migration

## 4. การปรับปรุง Backend
### 4.1 Middleware
- `backend/middleware/authMiddleware.js`
  - ฟังก์ชัน `checkTeacherType(allowedTypes)` ตรวจสอบ `req.user.role` และดึง `Teacher` จากฐานข้อมูลเพื่อยืนยันสิทธิ์

### 4.2 AuthService & Token
- `backend/services/authService.js`
  - `getRoleSpecificData` เพิ่มข้อมูล `teacherId`, `teacherCode`, `teacherType` และ flag `isSystemAdmin`
  - `generateToken` ฝัง `teacherType` ลงใน payload เพื่อให้ frontend ใช้ตัดสินใจแสดงผล

### 4.3 Teacher Service & Controller
- ปัญหาเดิม: API บางจุดหา teacher ด้วย `teacherCode` ทำให้เกิด error “ไม่พบข้อมูลอาจารย์”
- การแก้ไข (รวมจาก `TEACHER_PROBLEM_FIX_SUMMARY.md` เดิม)
  - `backend/services/teacherService.js`
    - ปรับ `getTeacherById` ให้ค้นหาทั้ง `teacherId`, `teacherCode`, `userId`
    - เพิ่ม `getTeacherByUserId(userId)` พร้อมข้อมูลผู้ใช้งานที่สัมพันธ์
  - `backend/controllers/teacherController.js`
    - เพิ่ม endpoint `getTeacherByUserId`
  - `backend/routes/teacherRoutes.js`
    - เพิ่ม `GET /api/teachers/user/:userId` (เปิดให้ทั้ง `admin` และ `teacher` ใช้)

### 4.4 Routes & Placeholder Controllers
- `backend/routes/teacherRoutes.js` แยก endpoint ตาม `teacherType`
  - Academic-only: `/academic/dashboard`, `/academic/evaluation`
  - Support-only: `/support/dashboard`, `/support/announcement`
  - Shared: `/documents`
- `backend/controllers/teacherController.js` มี placeholder (TODO) ให้เติมลอจิกจริงในอนาคต

### 4.5 สคริปต์อื่นที่เกี่ยวข้อง
- `backend/scripts/testTeacherAPIs.js` ทดสอบสิทธิ์ API ของทั้งสองประเภท
- `backend/scripts/createTestTeachers.js` ใช้สร้างข้อมูลตัวอย่าง

## 5. การปรับปรุง Frontend
- `frontend/src/contexts/AuthContext.js`
  - เก็บ `teacherType` ใน state และ localStorage, เคลียร์ค่าระหว่าง logout
- `frontend/src/components/layout/menuConfig.js` และ `Sidebar.js`
  - แยกเมนูตาม `teacherType` (Academic vs Support) พร้อม Badge แสดงชื่อบทบาทภาษาไทย
- `frontend/src/App.js`
  - อนุญาตให้ `teacher` (support) เข้าถึงเส้นทาง `/admin/*`, `/students`, `/teachers`
- `frontend/src/utils/testTeacherAccess.js`
  - รวมชุดทดสอบ UI สำหรับเช็ก RBAC ฝั่ง frontend

## 6. ฟีเจอร์ที่พร้อมใช้งานตามประเภท
### อาจารย์สายวิชาการ (`academic`)
- ตรวจ/อนุมัติเอกสารโครงงานในที่ปรึกษา
- ดูรายชื่อนักศึกษาในความดูแลและสถานะเอกสาร
- ตรวจสอบ/อนุมัติหัวข้อโครงงานและส่งผลประเมินฝึกงาน
- เข้าถึง endpoint/หน้าเฉพาะใน `/teacher/*` พร้อม middleware ป้องกันการลักลอบ

### เจ้าหน้าที่ภาควิชา (`support`)
- จัดการผู้ใช้ (นักศึกษา/อาจารย์) และไฟล์เอกสารหลักทั้งหมด
- ตั้งค่าระบบ, สร้างประกาศ, ตรวจรายงาน
- ใช้เมนูและหน้าเดียวกับ admin เดิมภายใต้ `/admin/*`
- ถูกตั้งค่า `isSystemAdmin` เพื่อให้สิทธิ์เทียบเท่า admin ใน service อื่นๆ

### สิทธิ์ร่วม
- เข้าถึง `GET /api/teachers/documents`
- รับ `teacherType` ใน token เพื่อใช้เช็กสิทธิ์ฝั่ง frontend

## 7. สถานะการทดสอบล่าสุด
| การทดสอบ | Academic | Support | หมายเหตุ |
| --- | --- | --- | --- |
| เข้าสู่ระบบและรับ token | ✅ | ✅ | token มี `teacherType` ถูกต้อง |
| Dashboard ตามบทบาท | ✅ (เข้าถึง `/academic/dashboard`) | ✅ (เข้าถึง `/support/dashboard`) | |
| ถูกปฏิเสธ endpoint ของอีกฝ่าย | ✅ (403 เมื่อเรียก support APIs) | ✅ (403 เมื่อเรียก academic APIs) | ตรวจด้วย `testTeacherAPIs.js` |
| ดึงข้อมูลอาจารย์ตาม `userId` | ✅ | ✅ | API `GET /api/teachers/user/:userId` ส่งข้อมูลครบ |
| เมนู/Badge ใน UI | ✅ | ✅ | ทดสอบ manual ตามคู่มือ `TEACHER_TESTING_GUIDE.md` |

## 8. ขั้นตอน Deploy และตรวจสอบหลังอัปเดต
1. รัน migration
   ```bash
   cd backend
   npm run migrate
   ```
2. ตรวจสอบการกระจาย `teacherType`
   ```bash
   node scripts/checkTeacherTypes.js
   ```
3. รีสตาร์ท backend (`npm run dev`) และ frontend หากจำเป็น
4. รัน `node scripts/testTeacherAPIs.js` เพื่อยืนยัน RBAC

## 9. งานที่ยังรอดำเนินการ (TODO)
- เติมลอจิกจริงให้กับ controller functions (dashboard, evaluation, announcement, documents)
- สร้าง UI Components สำหรับแต่ละเมนูที่เพิ่มขึ้น
- ทำ integration test ควบคู่กับ flow อื่น (เช่น project approval, document pipeline)
- ตรวจสอบและอัปเดตเอกสารใน `knowledge/` ที่อ้างอิง role เก่า

## 10. แหล่งอ้างอิงที่เกี่ยวข้อง
- เอกสารทดสอบ: `TEACHER_TESTING_GUIDE.md`
- ไฟล์โค้ดสำคัญ
  - `backend/middleware/authMiddleware.js`
  - `backend/services/authService.js`
  - `backend/services/teacherService.js`
  - `backend/controllers/teacherController.js`
  - `backend/routes/teacherRoutes.js`
  - `frontend/src/contexts/AuthContext.js`
  - `frontend/src/components/layout/Sidebar.js`
- สคริปต์ทดสอบและ seed: `backend/scripts/*Teacher*.js`