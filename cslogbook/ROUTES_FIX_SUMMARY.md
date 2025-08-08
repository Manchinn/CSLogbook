# แก้ไข Routes สำหรับ Support Staff

## 🐛 ปัญหาที่พบ

### ปัญหาหลัก:
หลาย routes ใช้ `checkRole(['admin'])` แบบเก่า ทำให้ `support_staff` (teacherType: 'support') ไม่สามารถเข้าถึง admin routes ได้

### สาเหตุ:
Routes ต่างๆ ยังใช้เงื่อนไขเก่า:
```javascript
checkRole(['admin'])
```
ไม่ได้รองรับ `teacher` ที่มี `teacherType: 'support'`

---

## ✅ การแก้ไขที่ทำ

### 1. แก้ไข `adminRoutes.js`

#### ก่อนแก้ไข:
```javascript
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Middleware for admin routes
const adminAuth = [authenticateToken, checkRole(['admin'])];
```

#### หลังแก้ไข:
```javascript
const { authenticateToken, checkRole, checkTeacherType } = require('../middleware/authMiddleware');

// Middleware for admin routes - รองรับทั้ง admin และ teacher support
const adminAuth = [authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support'])];
```

### 2. แก้ไข `upload.js`

#### ก่อนแก้ไข:
```javascript
router.post('/upload-csv', authenticateToken, checkRole(['admin']), upload.single('file'), uploadCSV);
```

#### หลังแก้ไข:
```javascript
router.post('/upload-csv', authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support']), upload.single('file'), uploadCSV);
```

### 3. แก้ไข `workflowStepDefinitionRoutes.js`

#### ก่อนแก้ไข:
```javascript
// ดึงรายการขั้นตอนทั้งหมด (admin only)
router.get('/', 
  authenticateToken, 
  checkRole(['admin']), 
  workflowStepDefinitionController.getAllSteps
);
```

#### หลังแก้ไข:
```javascript
// ดึงรายการขั้นตอนทั้งหมด (admin และ teacher support)
router.get('/', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  checkTeacherType(['support']),
  workflowStepDefinitionController.getAllSteps
);
```

### 4. แก้ไข `notificationSettingsRoutes.js`

#### ก่อนแก้ไข:
```javascript
// ดึงการตั้งค่าการแจ้งเตือนทั้งหมด (เฉพาะ admin)
router.get('/', 
    authenticateToken, 
    checkRole(['admin']), 
    notificationSettingsController.getAllNotificationSettings
);
```

#### หลังแก้ไข:
```javascript
// ดึงการตั้งค่าการแจ้งเตือนทั้งหมด (admin และ teacher support)
router.get('/', 
    authenticateToken, 
    checkRole(['admin', 'teacher']), 
    checkTeacherType(['support']),
    notificationSettingsController.getAllNotificationSettings
);
```

### 5. แก้ไข `studentpairsRoutes.js`

#### ก่อนแก้ไข:
```javascript
router.get('/', authenticateToken, checkRole(['admin']), getStudentPairs);
router.put('/update', authenticateToken, checkRole(['admin']), updateProjectPairs);
```

#### หลังแก้ไข:
```javascript
router.get('/', authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support']), getStudentPairs);
router.put('/update', authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support']), updateProjectPairs);
```

### 6. แก้ไข `projectMembersRoutes.js`

#### ก่อนแก้ไข:
```javascript
router.get('/', authenticateToken, checkRole(['admin']), getProjectMembers);
router.put('/update', authenticateToken, checkRole(['admin']), updateProjectMembers);
```

#### หลังแก้ไข:
```javascript
router.get('/', authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support']), getProjectMembers);
router.put('/update', authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support']), updateProjectMembers);
```

---

## 🎯 ผลลัพธ์ที่คาดหวัง

### ✅ หลังแก้ไข:

#### Routes ที่ `support_staff` สามารถเข้าถึงได้:
1. **Admin Routes** (`/admin/*`)
   - `/admin/stats` - สถิติระบบ
   - `/admin/students` - จัดการนักศึกษา
   - `/admin/teachers` - จัดการอาจารย์
   - `/admin/documents` - จัดการเอกสาร
   - `/admin/curriculums` - จัดการหลักสูตร
   - `/admin/academic` - จัดการปีการศึกษา
   - `/admin/workflow-steps` - จัดการขั้นตอน workflow
   - `/admin/notification-settings` - จัดการการแจ้งเตือน
   - `/admin/important-deadlines` - จัดการกำหนดเวลา

2. **Upload Routes**
   - `/upload/upload-csv` - อัปโหลดไฟล์ CSV

3. **Student Pairs Routes**
   - `/student-pairs` - จัดการคู่โปรเจค

4. **Project Members Routes**
   - `/project-members` - จัดการสมาชิกโปรเจค

5. **Workflow Step Definition Routes**
   - `/workflow-step-definitions` - จัดการขั้นตอน workflow

6. **Notification Settings Routes**
   - `/notification-settings` - จัดการการตั้งค่าการแจ้งเตือน

#### Routes ที่ `support_staff` ไม่สามารถเข้าถึงได้:
- Routes ที่ใช้ `checkRole(['admin'])` แบบเก่า
- Routes ที่ใช้ `checkTeacherType(['academic'])` สำหรับ academic teachers

---

## 🧪 การทดสอบ

### 1. รันสคริปต์ทดสอบ:
```bash
cd backend
node scripts/testSupportStaffRoutes.js
```

### 2. ทดสอบ Frontend:
1. รีสตาร์ท backend server
2. เข้าสู่ระบบด้วย `support_staff` / `password123`
3. ตรวจสอบการเข้าถึงหน้า admin ต่างๆ
4. ตรวจสอบการทำงานของฟีเจอร์ต่างๆ

### 3. ตรวจสอบ Network Requests:
```javascript
// เปิด Developer Tools → Network tab
// ตรวจสอบว่า requests ไปยัง admin routes สำเร็จหรือไม่
```

---

## 📋 ไฟล์ที่แก้ไข

### Backend Routes:
1. `backend/routes/adminRoutes.js` - แก้ไข adminAuth middleware
2. `backend/routes/upload.js` - แก้ไข upload route
3. `backend/routes/workflowStepDefinitionRoutes.js` - แก้ไข workflow routes
4. `backend/routes/notificationSettingsRoutes.js` - แก้ไข notification routes
5. `backend/routes/studentpairsRoutes.js` - แก้ไข student pairs routes
6. `backend/routes/projectMembersRoutes.js` - แก้ไข project members routes

### Backend Scripts:
1. `backend/scripts/testSupportStaffRoutes.js` - สคริปต์ทดสอบ routes

---

## 🚀 ขั้นตอนการแก้ไข

### 1. แก้ไขข้อมูลในฐานข้อมูล:
```bash
cd backend
node scripts/testSupportStaffFix.js
```

### 2. รีสตาร์ท backend server:
```bash
npm run dev
```

### 3. ทดสอบ Routes:
```bash
cd backend
node scripts/testSupportStaffRoutes.js
```

### 4. ทดสอบ Frontend:
- เข้าสู่ระบบด้วย `support_staff`
- ตรวจสอบการเข้าถึงหน้า admin ต่างๆ
- ตรวจสอบการทำงานของฟีเจอร์ต่างๆ

---

## 🎉 สรุป

**ปัญหาได้รับการแก้ไขเรียบร้อยแล้ว!**

การแก้ไขหลัก:
1. ✅ แก้ไข middleware ใน routes ต่างๆ ให้รองรับ `teacherType: 'support'`
2. ✅ เพิ่ม `checkTeacherType(['support'])` ใน routes ที่ต้องการ
3. ✅ สร้างสคริปต์ทดสอบการเข้าถึง routes

ตอนนี้ `support_staff` สามารถเข้าถึง admin routes ได้แล้วครับ! 🚀
