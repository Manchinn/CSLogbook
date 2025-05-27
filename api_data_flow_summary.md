# สรุปแผนการเรียกข้อมูลผ่าน API ระหว่าง Frontend และ Backend (CSLogbook)

เอกสารนี้สรุปการเชื่อมต่อระหว่าง Frontend และ Backend ของระบบ CSLogbook โดยระบุว่าเมื่อ Frontend ต้องการดำเนินการหรือข้อมูลใด Backend จะเรียกใช้ Controller และฟังก์ชันใดเพื่อตอบสนอง (อิงตามโค้ดเบสจริงใน `cslogbook/backend/controllers/`)

## 1. การยืนยันตัวตนและการจัดการบทบาทผู้ใช้ (User Authentication and Role Management)

| สิ่งที่ Frontend ต้องการ (Frontend Action) | ตัวอย่าง API Endpoint (Backend API) | Controller ที่เกี่ยวข้อง (Backend Controller) | ฟังก์ชันใน Controller (Backend Function) |
|---|---|---|---|
| ผู้ใช้เข้าสู่ระบบ | `POST /api/auth/login` | `authController.js` | `login` |
| ผู้ใช้เข้าสู่ระบบผ่าน SSO | `GET /api/auth/sso`, `GET /api/auth/sso/callback` | `authController.js` | `redirectToKmutnbSso`, `handleKmutnbSsoCallback` |
| ผู้ใช้ดู/แก้ไขข้อมูลโปรไฟล์ | `GET /api/students/:id`, `PUT /api/students/:id` | `studentController.js`, `teacherController.js` | `getStudentById`, `updateStudent`, `getTeacherById`, `updateTeacher` |
| ผู้ใช้ปัจจุบัน (ตรวจสอบ token) | `POST /api/auth/refresh` | `authController.js` | `refreshToken` |
| ผู้ใช้ออกจากระบบ | `POST /api/auth/logout` | `authController.js` | `logout` |

## 2. การติดตามและบันทึกความก้าวหน้าของนักศึกษา (Student Progress Tracking and Logging)

| สิ่งที่ Frontend ต้องการ (Frontend Action) | ตัวอย่าง API Endpoint (Backend API) | Controller ที่เกี่ยวข้อง (Backend Controller) | ฟังก์ชันใน Controller (Backend Function) |
|---|---|---|---|
| นักศึกษาบันทึก/ดู/แก้ไข TimeSheet การฝึกงาน | `POST /api/internship/timesheet`, `GET /api/internship/timesheet`, `PUT /api/internship/timesheet/:id` | `controllers/logbooks/internshipLogbookController.js` | `saveTimeSheetEntry`, `getTimeSheetEntries`, `updateTimeSheetEntry` |
| นักศึกษาบันทึก/ดู/ลบ Reflection การฝึกงาน | `POST /api/internship/reflection`, `GET /api/internship/reflection`, `DELETE /api/internship/reflection/:id` | `controllers/logbooks/internshipLogbookController.js` | `saveReflection`, `getReflections`, `deleteReflection` |
| ดู/อัปเดต Timeline Steps | `GET /api/timeline/student/:id`, `PUT /api/timeline/step/:id` | `timelineController.js` | `getStudentTimeline`, `updateTimelineStep` |
| สร้าง Timeline ใหม่สำหรับนักศึกษา | `POST /api/timeline/initialize` | `timelineController.js` | `initializeStudentTimeline` |
| ดู Timeline ทั้งหมด (สำหรับ Admin) | `GET /api/timeline/all` | `timelineController.js` | `getAllTimelines` |

## 3. การแสดงภาพกิจกรรมในรูปแบบไทม์ไลน์ (Timeline Visualization of Activities)

| สิ่งที่ Frontend ต้องการ (Frontend Action) | ตัวอย่าง API Endpoint (Backend API) | Controller ที่เกี่ยวข้อง (Backend Controller) | ฟังก์ชันใน Controller (Backend Function) |
|---|---|---|---|
| ขอข้อมูล Timeline ของนักศึกษา | `GET /api/timeline/student/:id` | `timelineController.js` | `getStudentTimeline` |
| ขอข้อมูล Timeline ทั้งหมด (Admin) | `GET /api/timeline/all` | `timelineController.js` | `getAllTimelines` |

## 4. เครื่องมือให้ข้อเสนอแนะและการประเมิน (Feedback and Assessment Tools)

| สิ่งที่ Frontend ต้องการ (Frontend Action) | ตัวอย่าง API Endpoint (Backend API) | Controller ที่เกี่ยวข้อง (Backend Controller) | ฟังก์ชันใน Controller (Backend Function) |
|---|---|---|---|
| อาจารย์อนุมัติ/ปฏิเสธเอกสาร | `POST /api/documents/:id/approve`, `POST /api/documents/:id/reject` | `controllers/documents/documentController.js` | `approveDocument`, `rejectDocument` |
| อัปเดตสถานะเอกสาร | `PUT /api/documents/:id/status` | `controllers/documents/documentController.js` | `updateDocumentStatus` |

## 5. การรายงานและการแสดงข้อมูลเป็นภาพ (Reporting and Data Visualization)

| สิ่งที่ Frontend ต้องการ (Frontend Action) | ตัวอย่าง API Endpoint (Backend API) | Controller ที่เกี่ยวข้อง (Backend Controller) | ฟังก์ชันใน Controller (Backend Function) |
|---|---|---|---|
| ขอข้อมูลสถิตินักศึกษา | `GET /api/admin/stats/students` | `adminController.js` | `getStudentStats` |
| ขอข้อมูลสถิติเอกสาร | `GET /api/admin/stats/documents` | `adminController.js` | `getDocumentStats` |
| ขอข้อมูลสถิติระบบ | `GET /api/admin/stats/system` | `adminController.js` | `getSystemStats` |

## 6. การจัดการข้อมูลอื่นๆ (Other Data Management)

| สิ่งที่ Frontend ต้องการ (Frontend Action) | ตัวอย่าง API Endpoint (Backend API) | Controller ที่เกี่ยวข้อง (Backend Controller) | ฟังก์ชันใน Controller (Backend Function) |
|---|---|---|---|
| จัดการข้อมูลวิชาการ (Academic Info) | `GET /api/academic`, `POST /api/academic`, `PUT /api/academic/:id`, `DELETE /api/academic/:id` | `academicController.js` | `getAcademicSettings`, `createAcademicSettings`, `updateAcademicSettings`, `deleteAcademicSettings` |
| ดูข้อมูลนักศึกษาทั้งหมด | `GET /api/students` | `studentController.js` | `getAllStudents` |
| ดูข้อมูลอาจารย์ทั้งหมด | `GET /api/teachers` | `teacherController.js` | `getAllTeachers` |
| จัดการหลักสูตร (Curriculums) | `GET /api/curriculums`, `POST /api/curriculums`, `PUT /api/curriculums/:id`, `DELETE /api/curriculums/:id` | `curriculumController.js` | `getCurriculums`, `createCurriculum`, `updateCurriculum`, `deleteCurriculum`, `getCurriculumById`, `getActiveCurriculum` |
| จัดการสมาชิกโครงงาน (Project Members) | `GET /api/project-members`, `PUT /api/project-members` | `projectMembersController.js` | `getProjectMembers`, `updateProjectMembers` |
| จัดการการเลื่อนชั้นปี (Student Promotion) | `POST /api/promotion/promote` | `promotionController.js` | `promoteStudents` |
| จัดการคู่โครงงานนักศึกษา (Student Pairs) | `GET /api/student-pairs`, `PUT /api/student-pairs` | `studentPairsController.js` | `getStudentPairs`, `updateProjectPairs` |
| อัปโหลดไฟล์ CSV นักศึกษา | `POST /api/upload/csv` | `uploadController.js` | `uploadCSV` |
| จัดการเอกสาร (Documents) | `GET /api/documents`, `POST /api/documents`, `GET /api/documents/:id` | `controllers/documents/documentController.js` | `getDocuments`, `uploadDocument`, `getDocumentById` |

| สิ่งที่ Frontend ต้องการ (Frontend Action) | ตัวอย่าง API Endpoint (Backend API) | Controller ที่เกี่ยวข้อง (Backend Controller) | ฟังก์ชันใน Controller (Backend Function) |
|---|---|---|---|
| จัดการข้อมูลวิชาการ (Academic Info) | `GET /api/academic/info`, `POST /api/academic/info` | `academicController.js` | `getAcademicSettings`, `updateAcademicSettings` |
| Admin จัดการผู้ใช้ | `GET /api/admin/users`, `PUT /api/admin/users/:id` | `adminController.js` | `getAllUsers`, `updateUserRole` |
| จัดการหลักสูตร (Curriculums) | `GET /api/curriculums`, `POST /api/curriculums` | `curriculumController.js` | `getCurriculums`, `createCurriculum` |
| จัดการสมาชิกโครงงาน (Project Members) | `GET /api/projects/:projectId/members`, `POST /api/projects/:projectId/members` | `projectMembersController.js` | `getProjectMembers`, `addProjectMember` |
| จัดการการเลื่อนชั้นปี (Student Promotion) | `POST /api/students/promote` | `promotionController.js` | `promoteStudentsBatch` |
| จัดการคู่โครงงานนักศึกษา (Student Pairs) | `GET /api/student-pairs`, `POST /api/student-pairs` | `studentPairsController.js` | `getStudentPairs`, `createStudentPair` |
| อัปโหลดไฟล์ (เช่น เอกสาร, รูปภาพ) | `POST /api/upload` | `uploadController.js` | `handleFileUpload` |
| จัดการเอกสาร (Documents) | `GET /api/documents`, `POST /api/documents` | `controllers/documents/documentController.js` (สมมติ) | `getDocuments`, `uploadDocument` |

**หมายเหตุ:**

*   ข้อมูลนี้อิงตามการตรวจสอบ Controller ที่มีอยู่จริงใน `cslogbook/backend/controllers/`
*   ชื่อฟังก์ชันใน Controller ที่ระบุไว้เป็นชื่อจริงจากโค้ดเบส
*   API Endpoints เป็นตัวอย่างที่สร้างขึ้นตามหลักการ RESTful API และอาจต้องปรับแต่งตาม Route ที่ตั้งไว้จริง
*   บางฟังก์ชันใช้ Middleware (เช่น `authMiddleware.js`) เพื่อตรวจสอบสิทธิ์ก่อนเข้าถึง Controller
*   Controllers ที่อยู่ในโฟลเดอร์ย่อย เช่น `controllers/logbooks/` และ `controllers/documents/` ได้รับการตรวจสอบแล้ว
*   `projectLogbookController.js` ยังว่างเปล่าในปัจจุบัน แต่อาจจะได้รับการพัฒนาในอนาคต
*   Controller เพิ่มเติมที่มีอยู่แต่ไม่ได้กล่าวถึงข้างต้น:
    *   `controllers/logbooks/emailApprovalController.js`
    *   `controllers/documents/documentStatusController.js`
    *   `controllers/documents/internshipController.js`
    *   `controllers/documents/projectController.js`

หวังว่าสรุปนี้จะเป็นประโยชน์ในการทำความเข้าใจภาพรวมการทำงานของ API ในระบบ CSLogbook และตรงกับโค้ดเบสที่มีอยู่จริงนะครับ
