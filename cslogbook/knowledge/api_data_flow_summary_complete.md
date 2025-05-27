# API Data Flow Summary - CSLogbook ระบบฝึกงานและโครงงาน

## สารบัญ
- [API Data Flow Summary - CSLogbook ระบบฝึกงานและโครงงาน](#api-data-flow-summary---cslogbook-ระบบฝึกงานและโครงงาน)
  - [สารบัญ](#สารบัญ)
  - [ภาพรวมระบบ](#ภาพรวมระบบ)
  - [Authentication API](#authentication-api)
  - [Progress Tracking API](#progress-tracking-api)
  - [Timeline Visualization API](#timeline-visualization-api)
  - [Feedback Tools API](#feedback-tools-api)
  - [Email Approval API](#email-approval-api)
  - [Reporting API](#reporting-api)
  - [Data Management API](#data-management-api)
  - [Backend Components](#backend-components)
    - [Controllers ที่มีอยู่จริงในโค้ดเบส:](#controllers-ที่มีอยู่จริงในโค้ดเบส)
    - [Backend Services ที่มีอยู่จริง:](#backend-services-ที่มีอยู่จริง)
    - [Frontend Services ที่มีอยู่จริง:](#frontend-services-ที่มีอยู่จริง)
  - [Key Backend Service Functions](#key-backend-service-functions)
    - [WorkflowService Functions:](#workflowservice-functions)
    - [InternshipService Functions:](#internshipservice-functions)
    - [DocumentService Functions:](#documentservice-functions)
    - [EmailApprovalService Functions:](#emailapprovalservice-functions)

---

## ภาพรวมระบบ

ระบบ CSLogbook แบ่งการเรียกข้อมูลระหว่าง Frontend และ Backend ออกเป็น 6 หมวดหมู่หลัก โดยอิงจากโครงสร้างโค้ดเบสจริงที่มีอยู่ รวมถึงการใช้งาน Backend Services สำหรับ business logic

---

## Authentication API

API สำหรับการยืนยันตัวตนและการจัดการผู้ใช้งาน

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/auth/login` | POST | `authController.login` | - | `authService.js` | User credentials | เข้าสู่ระบบแบบปกติ |
| `/api/auth/sso/kmutnb` | GET | `authController.redirectToKmutnbSso` | - | `authService.js` | Redirect URL | เข้าสู่ระบบผ่าน SSO KMUTNB |
| `/api/auth/sso/kmutnb/callback` | GET | `authController.handleKmutnbSsoCallback` | - | `authService.js` | Auth token + user data | จัดการ callback จาก SSO |
| `/api/auth/profile` | GET | `authController.getProfile` | - | `authService.js` | User profile | ดึงข้อมูลโปรไฟล์ผู้ใช้ |
| `/api/auth/refresh` | POST | `authController.refreshToken` | - | `authService.js` | Access token | รีเฟรช token |
| `/api/auth/logout` | POST | `authController.logout` | - | `authService.js` | Status message | ออกจากระบบ |

---

## Progress Tracking API

API สำหรับติดตามความคืบหน้าและบันทึกการปฏิบัติงาน

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/logbooks/internship/timesheet` | GET | `internshipLogbookController.getTimeSheetRecord` | - | `internshipService.js` | TimeSheet entries | ดึงข้อมูลบันทึกเวลาฝึกงาน |
| `/api/logbooks/internship/timesheet` | POST | `internshipLogbookController.createTimeSheetRecord` | - | `internshipService.js` | TimeSheet data | สร้างบันทึกเวลาฝึกงาน |
| `/api/logbooks/internship/reflection` | GET | `internshipLogbookController.getReflectionRecord` | - | `internshipService.js` | Reflection entries | ดึงข้อมูลสะท้อนการฝึกงาน |
| `/api/logbooks/internship/reflection` | POST | `internshipLogbookController.createReflectionRecord` | - | `internshipService.js` | Reflection data | สร้างบันทึกสะท้อนการฝึกงาน |
| `/api/logbooks/project/progress` | GET | `projectLogbookController.getProgressRecord` | - | `studentService.js` | Progress data | ดึงข้อมูลความคืบหน้าโครงงาน |
| `/api/logbooks/project/milestone` | POST | `projectLogbookController.createMilestone` | - | `studentService.js` | Milestone data | สร้าง milestone โครงงาน |

---

## Timeline Visualization API

API สำหรับแสดงแท็ปไลน์และขั้นตอนการดำเนินงาน

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/timeline/student/:studentId` | GET | `timelineController.getStudentTimeline` | `workflowService.generateStudentTimeline()` | `timelineService.js` | Timeline steps | ดึงข้อมูลแท็ปไลน์นักศึกษา |
| `/api/timeline/student/:studentId/update` | PUT | `timelineController.updateTimelineStep` | `workflowService.updateStudentWorkflowActivity()` | `timelineService.js` | Step status | อัปเดตสถานะขั้นตอน |
| `/api/timeline/workflow/:workflowType` | GET | `timelineController.getWorkflowSteps` | `workflowService.getWorkflowStepDefinitions()` | `timelineService.js` | Workflow definition | ดึงข้อมูลขั้นตอน workflow |

---

## Feedback Tools API

API สำหรับเครื่องมือการให้คำติชมและการอนุมัติเอกสาร

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/documents` | GET | `documentController.getDocuments` | `documentService.getDocuments()` | `adminService.js` | Document list | ดึงรายการเอกสารทั้งหมด |
| `/api/documents/:id` | GET | `documentController.getDocumentById` | `documentService.getDocumentById()` | `adminService.js` | Document details | ดึงข้อมูลเอกสารรายการ |
| `/api/documents/upload` | POST | `documentController.uploadDocument` | `documentService.uploadDocument()` | `adminService.js` | Document data | อัพโหลดเอกสาร |
| `/api/documents/:id/approve` | PUT | `documentController.approveDocument` | `documentService.approveDocument()` | `adminService.js` | Approval status | อนุมัติเอกสาร (รวม CS05 workflow) |
| `/api/documents/:id/reject` | PUT | `documentController.rejectDocument` | `documentService.rejectDocument()` | `adminService.js` | Rejection reason | ปฏิเสธเอกสาร |
| `/api/documents/:id/status` | PUT | `documentController.updateDocumentStatus` | `documentService.updateDocumentStatus()` | `adminService.js` | Status update | อัปเดตสถานะเอกสาร |
| `/api/documents/search` | GET | `documentController.searchDocuments` | `documentService.searchDocuments()` | `adminService.js` | Search results | ค้นหาเอกสาร |
| `/api/documents/recent` | GET | `documentController.getRecentDocuments` | `documentService.getRecentDocuments()` | `adminService.js` | Recent documents | ดึงเอกสารล่าสุด |
| `/api/documents/:id/view` | GET | `documentController.viewDocument` | `documentService.validateDocumentFile()` | `adminService.js` | File stream | แสดงไฟล์เอกสาร |
| `/api/documents/:id/download` | GET | `documentController.downloadDocument` | `documentService.validateDocumentFile()` | `adminService.js` | File stream | ดาวน์โหลดไฟล์เอกสาร |
| `/api/evaluations` | GET | `evaluationController.getEvaluations` | - | `evaluationService.js` | Evaluation list | ดึงข้อมูลการประเมิน |
| `/api/evaluations/:id/feedback` | POST | `evaluationController.submitFeedback` | - | `evaluationService.js` | Feedback data | ส่งคำติชมการประเมิน |

---

## Email Approval API

API สำหรับการอนุมัติผ่านอีเมล

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/email-approval/approve/:token` | GET | `emailApprovalController.approveByEmail` | `emailApprovalService.processApproval()` | - | Approval response | อนุมัติผ่านลิงก์อีเมล |
| `/api/email-approval/reject/:token` | GET | `emailApprovalController.rejectByEmail` | `emailApprovalService.processRejection()` | - | Rejection response | ปฏิเสธผ่านลิงก์อีเมล |
| `/api/email-approval/status/:token` | GET | `emailApprovalController.getApprovalStatus` | `emailApprovalService.getTokenStatus()` | - | Token status | ตรวจสอบสถานะ token |
| `/api/email-approval/send` | POST | `emailApprovalController.sendApprovalEmail` | `emailApprovalService.createApprovalRequest()` | `adminService.js` | Email sent status | ส่งอีเมลขออนุมัติ |
| `/api/email-approval/resend/:token` | POST | `emailApprovalController.resendApprovalEmail` | `emailApprovalService.resendApprovalEmail()` | `adminService.js` | Resend status | ส่งอีเมลซ้ำ |
| `/api/email-approval/cancel/:token` | POST | `emailApprovalController.cancelApprovalRequest` | `emailApprovalService.cancelApprovalRequest()` | `adminService.js` | Cancel status | ยกเลิกการขออนุมัติ |
| `/api/email-approval/cleanup-expired` | POST | `emailApprovalController.cleanupExpiredTokens` | `emailApprovalService.cleanupExpiredTokens()` | - | Cleanup result | ล้าง token ที่หมดอายุ |

---

## Reporting API

API สำหรับรายงานและสถิติของระบบ

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/admin/stats/students` | GET | `adminController.getStudentStats` | - | `adminService.js` | Student statistics | สถิตินักศึกษา |
| `/api/admin/stats/internships` | GET | `adminController.getInternshipStats` | - | `adminService.js` | Internship statistics | สถิติการฝึกงาน |
| `/api/admin/stats/projects` | GET | `adminController.getProjectStats` | - | `adminService.js` | Project statistics | สถิติโครงงาน |
| `/api/admin/reports/timeline` | GET | `adminController.getTimelineReport` | - | `adminService.js` | Timeline report | รายงานแท็ปไลน์ |
| `/api/admin/reports/progress` | GET | `adminController.getProgressReport` | - | `adminService.js` | Progress report | รายงานความคืบหน้า |

---

## Data Management API

API สำหรับจัดการข้อมูลหลักของระบบ

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/students` | GET | `userController.getAllStudents` | - | `studentService.js` | Student list | รายการนักศึกษาทั้งหมด |
| `/api/students/:id` | GET | `userController.getStudentById` | - | `studentService.js` | Student details | ข้อมูลนักศึกษารายบุคคล |
| `/api/companies` | GET | `companyController.getAllCompanies` | - | `adminService.js` | Company list | รายการบริษัท/หน่วยงาน |
| `/api/companies/:id/approve` | PUT | `companyController.approveCompany` | - | `adminService.js` | Approval status | อนุมัติบริษัท |
| `/api/curriculum` | GET | `curriculumController.getCurriculumData` | - | `curriculumService.js` | Curriculum data | ข้อมูลหลักสูตร |
| `/api/users/teachers` | GET | `userController.getAllTeachers` | - | `teacherService.js` | Teacher list | รายการอาจารย์ |

---

## Backend Components

### Controllers ที่มีอยู่จริงในโค้ดเบส:
- `authController.js` - การยืนยันตัวตน และ SSO
- `adminController.js` - การจัดการข้อมูลและสถิติ
- `timelineController.js` - การจัดการแท็ปไลน์
- `documentController.js` - การจัดการเอกสาร
- `evaluationController.js` - การประเมินผล
- `companyController.js` - การจัดการบริษัท
- `curriculumController.js` - การจัดการหลักสูตร
- `userController.js` - การจัดการผู้ใช้งาน
- **Logbook Controllers:**
  - `internshipLogbookController.js` - บันทึกการฝึกงาน
  - `projectLogbookController.js` - บันทึกโครงงาน

### Backend Services ที่มีอยู่จริง:
- **`workflowService.js`** - จัดการ workflow และ timeline
  - `getWorkflowStepDefinitions()` - ดึงขั้นตอน workflow ตาม workflowType
  - `updateStudentWorkflowActivity()` - อัปเดต/สร้าง StudentWorkflowActivity
  - `generateStudentTimeline()` - สร้าง timeline สำหรับแสดงผลใน frontend
- **`internshipService.js`** - จัดการการฝึกงาน
  - `approveCS05()` - อนุมัติเอกสาร คพ.05 พร้อมจัดการ workflow
  - `handleCS05Approval()` - จัดการขั้นตอน workflow หลังอนุมัติ คพ.05
  - `updateWorkflowActivity()` - อัปเดต workflow activity สำหรับนักศึกษา
- **`documentService.js`** - จัดการเอกสารและไฟล์
  - `uploadDocument()` - อัพโหลดเอกสารและบันทึกลงฐานข้อมูล
  - `getDocumentById()` - ดึงข้อมูลเอกสารพร้อม relations
  - `getDocuments()` - ดึงรายการเอกสารพร้อม filter/pagination
  - `approveDocument()` - อนุมัติเอกสารและจัดการ CS05 workflow
  - `rejectDocument()` - ปฏิเสธเอกสาร
  - `updateDocumentStatus()` - อัปเดตสถานะเอกสาร
  - `searchDocuments()` - ค้นหาเอกสาร
  - `validateDocumentFile()` - ตรวจสอบไฟล์เอกสาร
  - `processCS05Approval()` - จัดการ workflow สำหรับ CS05
- **`emailApprovalService.js`** - จัดการการอนุมัติผ่านอีเมล
  - `createApprovalRequest()` - สร้างคำขออนุมัติและส่งอีเมล
  - `processApproval()` - ประมวลผลการอนุมัติผ่าน token
  - `processRejection()` - ประมวลผลการปฏิเสธผ่าน token
  - `getTokenStatus()` - ตรวจสอบสถานะ approval token
  - `resendApprovalEmail()` - ส่งอีเมลขออนุมัติซ้ำ
  - `cancelApprovalRequest()` - ยกเลิกการขออนุมัติ
  - `cleanupExpiredTokens()` - ล้าง token ที่หมดอายุ

### Frontend Services ที่มีอยู่จริง:
- `authService.js`, `adminService.js`, `timelineService.js`
- `studentService.js`, `teacherService.js`, `internshipService.js`
- `evaluationService.js`, `curriculumService.js`
- `documentService.js`, `emailApprovalService.js`, `apiClient.js`

---

## Key Backend Service Functions

### WorkflowService Functions:
1. **`getWorkflowStepDefinitions(workflowType)`**
   - ดึงข้อมูล WorkflowStepDefinitions ตาม workflowType
   - เรียงลำดับตาม stepOrder

2. **`updateStudentWorkflowActivity(studentId, workflowType, stepKey, status, overallStatus, dataPayload)`**
   - อัปเดตหรือสร้าง StudentWorkflowActivity ใหม่
   - จัดการ JSON payload และการ update metadata

3. **`generateStudentTimeline(studentId, workflowType)`**
   - สร้าง timeline สำหรับแสดงผลใน frontend
   - คำนวณความคืบหน้า (progress percentage)
   - จัดการสถานะ UI (completed, pending, in_progress, waiting)

### InternshipService Functions:
1. **`approveCS05(documentId, adminId)`**
   - อนุมัติเอกสาร คพ.05
   - เรียกใช้ `handleCS05Approval()` สำหรับจัดการ workflow

2. **`handleCS05Approval(document, adminId)`**
   - อัปเดตขั้นตอน workflow หลังอนุมัติ คพ.05
   - สร้างการแจ้งเตือนให้นักศึกษา
   - ตั้งค่าขั้นตอนถัดไป (รอหนังสือตอบรับ)

3. **`updateWorkflowActivity(studentId, workflowType, stepKey, status, workflowStatus, metadata)`**
   - อัปเดตหรือสร้าง WorkflowActivity
   - จัดการ metadata ในรูปแบบ JSON

### DocumentService Functions:
1. **`uploadDocument(userId, fileData, documentData)`**
   - ตรวจสอบประเภทเอกสารตาม UPLOAD_CONFIG
   - บันทึกข้อมูลเอกสารลงฐานข้อมูล
   - จัดการ file validation และ metadata

2. **`getDocumentById(documentId, includeRelations)`**
   - ดึงข้อมูลเอกสารพร้อม User และ Student relations
   - รวม InternshipDocument data ถ้ามี
   - Support optional relation loading

3. **`approveDocument(documentId, reviewerId)`**
   - อนุมัติเอกสารและอัปเดตสถานะ
   - จัดการ CS05 workflow automation
   - อัปเดตสถานะนักศึกษาและสร้างการแจ้งเตือน

4. **`getDocuments(filters, pagination)`**
   - ดึงรายการเอกสารพร้อม advanced filtering
   - Support search, type filter, status filter
   - รวมสถิติเอกสาร (pending, approved, rejected)

5. **`processCS05Approval(document, adminId)`**
   - จัดการ workflow สำหรับ CS05 เฉพาะ
   - อัปเดตสถานะนักศึกษาเป็น 'in_progress'
   - สร้าง/อัปเดต StudentWorkflowActivity
   - ส่งการแจ้งเตือนให้นักศึกษา

### EmailApprovalService Functions:
1. **`createApprovalRequest(requestType, requestData, approverEmail, metadata)`**
   - สร้าง ApprovalToken พร้อม expiration
   - ส่งอีเมลขออนุมัติพร้อมลิงก์ action
   - จัดการ email template และ security token

2. **`processApproval(token)`**
   - ตรวจสอบ token validity และ expiration
   - ประมวลผลการอนุมัติตาม requestType
   - อัปเดตสถานะ token และสร้าง audit log

3. **`processRejection(token, reason)`**
   - ประมวลผลการปฏิเสธพร้อมเหตุผล
   - อัปเดตสถานะและสร้าง notification
   - จัดการ workflow rollback ถ้าจำเป็น

4. **`getTokenStatus(token)`**
   - ตรวจสอบสถานะปัจจุบันของ approval token
   - ส่งข้อมูลสถานะและ metadata
   - รองรับการแสดงผล UI สำหรับสถานะต่างๆ

5. **`cleanupExpiredTokens()`**
   - ล้าง approval tokens ที่หมดอายุ
   - จัดการ database maintenance
   - ส่งรายงานการล้างข้อมูล

---

**หมายเหตุ:** เอกสารนี้อิงตามโครงสร้างโค้ดเบสจริงที่มีอยู่ใน `cslogbook/backend/controllers/`, `cslogbook/backend/services/` และ `cslogbook/frontend/src/services/` ณ วันที่ 27 พฤษภาคม 2025

**การอัปเดตล่าสุด:**
- เพิ่ม DocumentService สำหรับการจัดการเอกสารแบบ service layer architecture
- เพิ่ม EmailApprovalService สำหรับการอนุมัติผ่านอีเมล
- ปรับปรุง API endpoints ให้สอดคล้องกับ service layer pattern
- เพิ่มรายละเอียด backend service functions ที่สำคัญ
