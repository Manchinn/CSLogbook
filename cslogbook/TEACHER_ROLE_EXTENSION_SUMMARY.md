# สรุปการเปลี่ยนแปลงระบบ RBAC - การขยายบทบาท Teacher

## ภาพรวมการเปลี่ยนแปลง

ระบบได้ถูกปรับปรุงเพื่อขยายบทบาท `teacher` ให้รองรับสองประเภทย่อย:
- **`academic`** - อาจารย์สายวิชาการ (สอน)
- **`support`** - เจ้าหน้าที่ภาควิชา (ดูแลระบบ)

และแปลงผู้ใช้ `admin` ที่มีอยู่ให้เป็น `teacher` พร้อม `teacherType: 'support'`

---

## การเปลี่ยนแปลงในฐานข้อมูล

### 1. เพิ่มคอลัมน์ `teacher_type` ในตาราง `teachers`

**ไฟล์:** `backend/migrations/20250101000000-add-teacher-sub-roles.js`

```javascript
// เพิ่มคอลัมน์ teacher_type
await queryInterface.addColumn('teachers', 'teacher_type', {
  type: Sequelize.ENUM('academic', 'support'),
  allowNull: false,
  defaultValue: 'academic'
});

// เพิ่ม index สำหรับการค้นหา
await queryInterface.addIndex('teachers', ['teacher_type'], {
  name: 'idx_teachers_teacher_type'
});
```

### 2. แปลงผู้ใช้ `admin` เป็น `teacher` พร้อม `teacherType: 'support'`

**ไฟล์:** `backend/migrations/20250101000001-convert-admin-to-teacher-support.js`

```javascript
// ดึงข้อมูล admin ทั้งหมด
const admins = await queryInterface.sequelize.query(`
  SELECT u.user_id, u.username, u.password, u.email, u.first_name, u.last_name,
         u.active_status, u.last_login, a.admin_id, a.admin_code, a.responsibilities, a.contact_extension
  FROM users u
  INNER JOIN admins a ON u.user_id = a.user_id
  WHERE u.role = 'admin'
`);

// สร้าง teacher record ใหม่
await queryInterface.sequelize.query(`
  INSERT INTO teachers (teacher_code, user_id, teacher_type, contact_extension, created_at, updated_at)
  VALUES (?, ?, 'support', ?, NOW(), NOW())
`);

// อัปเดต role ในตาราง users
await queryInterface.sequelize.query(`
  UPDATE users
  SET role = 'teacher', updated_at = NOW()
  WHERE user_id = ?
`);
```

---

## การเปลี่ยนแปลงใน Backend

### 1. อัปเดต Model Teacher

**ไฟล์:** `backend/models/Teacher.js`

```javascript
teacherType: {
  type: DataTypes.ENUM('academic', 'support'),
  allowNull: false,
  defaultValue: 'academic',
  field: 'teacher_type'
}
```

### 2. เพิ่ม Middleware ใหม่

**ไฟล์:** `backend/middleware/authMiddleware.js`

```javascript
checkTeacherType: (allowedTypes) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'กรุณาเข้าสู่ระบบ',
        code: 'NO_USER'
      });
    }
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        status: 'error',
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้',
        code: 'NOT_TEACHER'
      });
    }
    
    const { Teacher } = require('../models');
    const teacher = await Teacher.findOne({
      where: { userId: req.user.userId }
    });
    
    if (!teacher) {
      return res.status(403).json({
        status: 'error',
        message: 'ไม่พบข้อมูลอาจารย์',
        code: 'TEACHER_NOT_FOUND'
      });
    }
    
    if (!allowedTypes.includes(teacher.teacherType)) {
      return res.status(403).json({
        status: 'error',
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้',
        code: 'INSUFFICIENT_TEACHER_TYPE'
      });
    }
    
    req.user.teacherType = teacher.teacherType;
    next();
  } catch (error) {
    console.error('Teacher type check error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
    });
  }
}
```

### 3. อัปเดต AuthService

**ไฟล์:** `backend/services/authService.js`

```javascript
// ในฟังก์ชัน getRoleSpecificData
case 'teacher':
  const teacherData = await Teacher.findOne({
    where: { userId: user.userId },
    attributes: ['teacherId', 'teacherCode', 'teacherType']
  });

  roleData = {
    teacherId: teacherData?.teacherId,
    teacherCode: teacherData?.teacherCode,
    teacherType: teacherData?.teacherType || 'academic',
    isSystemAdmin: teacherData?.teacherType === 'support'
  };
  break;

// ในฟังก์ชัน generateToken
const payload = {
  userId: user.userId,
  role: user.role,
  isSystemAdmin: user.role === 'admin' || (user.role === 'teacher' && roleData.teacherType === 'support'),
  ...(user.role === 'teacher' && {
    teacherId: roleData.teacherId,
    teacherType: roleData.teacherType
  })
};
```

### 4. อัปเดต AuthController

**ไฟล์:** `backend/controllers/authController.js`

```javascript
// ในฟังก์ชัน login
res.json({
  success: true,
  token: result.data.token,
  userId: result.data.userId,
  firstName: result.data.firstName,
  lastName: result.data.lastName,
  email: result.data.email,
  role: result.data.role,
  teacherType: result.data.teacherType, // เพิ่ม teacherType
  ...result.data
});
```

### 5. เพิ่ม Routes ใหม่

**ไฟล์:** `backend/routes/teacherRoutes.js`

```javascript
// Routes สำหรับอาจารย์สายวิชาการเท่านั้น
router.get('/academic/dashboard',
  checkRole(['teacher']),
  checkTeacherType(['academic']),
  teacherController.getAcademicDashboard
);

router.post('/academic/evaluation',
  checkRole(['teacher']),
  checkTeacherType(['academic']),
  teacherController.submitEvaluation
);

// Routes สำหรับเจ้าหน้าที่ภาควิชาเท่านั้น
router.get('/support/dashboard',
  checkRole(['teacher']),
  checkTeacherType(['support']),
  teacherController.getSupportDashboard
);

router.post('/support/announcement',
  checkRole(['teacher']),
  checkTeacherType(['support']),
  teacherController.createAnnouncement
);

// Routes ที่ทั้งสองประเภทเข้าถึงได้
router.get('/documents',
  checkRole(['teacher']),
  teacherController.getDocuments
);
```

### 6. เพิ่ม Controller Functions

**ไฟล์:** `backend/controllers/teacherController.js`

```javascript
// ฟังก์ชันสำหรับอาจารย์สายวิชาการ
exports.getAcademicDashboard = async (req, res) => {
  // TODO: เพิ่มลอจิกสำหรับ dashboard ของอาจารย์สายวิชาการ
};

exports.submitEvaluation = async (req, res) => {
  // TODO: เพิ่มลอจิกสำหรับการส่งการประเมินผล
};

// ฟังก์ชันสำหรับเจ้าหน้าที่ภาควิชา
exports.getSupportDashboard = async (req, res) => {
  // TODO: เพิ่มลอจิกสำหรับ dashboard ของเจ้าหน้าที่ภาควิชา
};

exports.createAnnouncement = async (req, res) => {
  // TODO: เพิ่มลอจิกสำหรับการสร้างประกาศ
};

// ฟังก์ชันที่ทั้งสองประเภทเข้าถึงได้
exports.getDocuments = async (req, res) => {
  // TODO: เพิ่มลอจิกสำหรับการดึงเอกสาร
};
```

---

## การเปลี่ยนแปลงใน Frontend

### 1. อัปเดต AuthContext

**ไฟล์:** `frontend/src/contexts/AuthContext.js`

```javascript
// เพิ่ม teacherType ใน state
const [userData, setUserData] = useState({
  // ... existing fields ...
  role: localStorage.getItem('role'),
  teacherType: localStorage.getItem('teacherType'), // เพิ่ม teacherType
  // ... other fields ...
});

// ในฟังก์ชัน handleLogout
const keysToRemove = [
  'token', 'refreshToken', 'studentCode', 'firstName',
  'lastName', 'email', 'role', 'teacherType', // เพิ่ม teacherType
  // ... other keys ...
];

// ในฟังก์ชัน handleLogin
const userDataToStore = {
  // ... existing fields ...
  role: userData.role,
  teacherType: userData.teacherType, // เพิ่ม teacherType
  // ... other fields ...
};
```

### 2. อัปเดต Menu Configuration

**ไฟล์:** `frontend/src/components/layout/menuConfig.js`

```javascript
// Teacher Menu Items - Academic
userData.role === 'teacher' && userData.teacherType === 'academic' && {
  key: '/teacher',
  icon: <TeamOutlined />,
  label: 'อาจารย์สายวิชาการ',
  children: [
    { key: '/teacher/review-documents', icon: <FileTextOutlined />, label: 'ตรวจสอบเอกสาร' },
    { key: '/teacher/advising', icon: <TeamOutlined />, label: 'นักศึกษาในที่ปรึกษา' },
    { key: '/teacher/project-approval', icon: <CheckCircleOutlined />, label: 'อนุมัติหัวข้อโครงงาน' },
    { key: '/teacher/evaluation', icon: <CheckCircleOutlined />, label: 'ประเมินผลการฝึกงาน' }
  ]
},

// Teacher Menu Items - Support (เจ้าหน้าที่ภาควิชา)
userData.role === 'teacher' && userData.teacherType === 'support' && {
  key: '/admin',
  icon: <SettingOutlined />,
  label: 'ผู้ดูแลระบบ',
  children: [
    {
      key: '/admin/users', icon: <TeamOutlined />, label: 'จัดการผู้ใช้',
      children: [
        { key: '/admin/users/students', label: 'นักศึกษา' },
        { key: '/admin/users/teachers', label: 'อาจารย์' }
      ]
    },
    { key: '/admin/documents', icon: <FileTextOutlined />, label: 'จัดการเอกสาร' },
    { key: '/admin/settings', icon: <SettingOutlined />, label: 'ตั้งค่าระบบ' },
    { key: '/admin/reports', icon: <FileTextOutlined />, label: 'รายงานสถิติ' },
    { key: '/admin/announcements', icon: <FileTextOutlined />, label: 'ประกาศและแจ้งเตือน' }
  ]
}
```

### 3. อัปเดต App.js Routes

**ไฟล์:** `frontend/src/App.js`

```javascript
// Admin Routes - สำหรับ admin และ teacher support
<Route path="/students" element={
  <ProtectedRoute roles={['admin', 'teacher']}> {/* เพิ่ม 'teacher' */}
    <StudentRoutes />
  </ProtectedRoute>
} />

<Route path="/teachers" element={
  <ProtectedRoute roles={['admin', 'teacher']}> {/* เพิ่ม 'teacher' */}
    <TeacherRoutes />
  </ProtectedRoute>
} />

<Route path="/admin/*" element={
  <ProtectedRoute roles={['admin', 'teacher']}> {/* เพิ่ม 'teacher' */}
    <AdminRoutes />
  </ProtectedRoute>
} />
```

---

## ไฟล์ที่สร้างใหม่

### 1. Migration Scripts

- `backend/migrations/20250101000000-add-teacher-sub-roles.js`
- `backend/migrations/20250101000001-convert-admin-to-teacher-support.js`

### 2. Utility Scripts

- `backend/scripts/checkTeacherTypes.js` - สำหรับตรวจสอบการกระจายของ teacher types

---

## ขั้นตอนการ Deploy

### 1. รัน Migration

```bash
cd backend
npm run migrate
```

### 2. ตรวจสอบผลลัพธ์

```bash
node scripts/checkTeacherTypes.js
```

### 3. รีสตาร์ท Backend Server

```bash
npm run dev
```

---

## สิทธิ์การเข้าถึงใหม่

### อาจารย์สายวิชาการ (`teacherType: 'academic'`)
- ตรวจสอบเอกสาร
- จัดการนักศึกษาในที่ปรึกษา
- อนุมัติหัวข้อโครงงาน
- ประเมินผลการฝึกงาน

### เจ้าหน้าที่ภาควิชา (`teacherType: 'support'`)
- จัดการผู้ใช้ (นักศึกษา/อาจารย์)
- จัดการเอกสาร
- ตั้งค่าระบบ
- รายงานสถิติ
- ประกาศและแจ้งเตือน

---

## หมายเหตุสำคัญ

1. **การแปลงข้อมูล**: ผู้ใช้ `admin` ที่มีอยู่จะถูกแปลงเป็น `teacher` พร้อม `teacherType: 'support'` โดยอัตโนมัติ

2. **Backward Compatibility**: ระบบยังคงรองรับผู้ใช้ `admin` ที่อาจมีอยู่ (หากไม่ถูกแปลง)

3. **TODO Items**: ฟังก์ชัน controller ใหม่ยังเป็น placeholder ต้องเพิ่มลอจิกจริงตามความต้องการ

4. **Testing**: ควรทดสอบการเข้าสู่ระบบและการเข้าถึงเมนูสำหรับทั้งสองประเภท teacher

---

## การแก้ไขปัญหา

### ปัญหาที่พบและแก้ไขแล้ว:
- ✅ **Error: Route.get() requires a callback function but got a [object Undefined]**
  - **สาเหตุ**: ฟังก์ชัน controller ที่เรียกใช้ใน routes ยังไม่ได้ถูกกำหนด
  - **การแก้ไข**: เพิ่มฟังก์ชัน placeholder ใน `teacherController.js`

### ปัญหาที่อาจเกิดขึ้น:
- การเข้าถึงเมนูที่ไม่ถูกต้อง
- การตรวจสอบสิทธิ์ที่ไม่ทำงาน
- การแปลงข้อมูลที่ไม่สมบูรณ์

---

## ขั้นตอนต่อไป

1. **ทดสอบระบบ**: ตรวจสอบการเข้าสู่ระบบและการเข้าถึงเมนู
2. **เพิ่มลอจิกจริง**: แทนที่ placeholder functions ด้วยลอจิกจริง
3. **เพิ่ม UI Components**: สร้างหน้า dashboard สำหรับแต่ละประเภท
4. **ทดสอบการแปลงข้อมูล**: ตรวจสอบว่าผู้ใช้ admin ถูกแปลงอย่างถูกต้อง 