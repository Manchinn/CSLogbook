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
  - [Internship Management API](#internship-management-api)
  - [Backend Components](#backend-components)
    - [Controllers ที่มีอยู่จริงในโค้ดเบส:](#controllers-ที่มีอยู่จริงในโค้ดเบส)
    - [Backend Services ที่มีอยู่จริง:](#backend-services-ที่มีอยู่จริง)
    - [Frontend Services ที่มีอยู่จริง:](#frontend-services-ที่มีอยู่จริง)
  - [Key Backend Service Functions](#key-backend-service-functions)
    - [Clean Architecture ในระบบ](#clean-architecture-ในระบบ)
    - [WorkflowService Functions:](#workflowservice-functions)
    - [InternshipService Functions:](#internshipservice-functions)
    - [DocumentService Functions:](#documentservice-functions)
    - [InternshipLogbookService Functions:](#internshiplogbookservice-functions)
    - [InternshipManagementService Functions:](#internshipmanagementservice-functions)
    - [AuthService Functions:](#authservice-functions)
    - [EmailApprovalService Functions:](#emailapprovalservice-functions)

---

## ภาพรวมระบบ

ระบบ CSLogbook แบ่งการเรียกข้อมูลระหว่าง Frontend และ Backend ออกเป็น 6 หมวดหมู่หลัก โดยอิงจากโครงสร้างโค้ดเบสจริงที่มีอยู่ รวมถึงการใช้งาน Backend Services สำหรับ business logic

---

## Authentication API

API สำหรับการยืนยันตัวตนและการจัดการผู้ใช้งาน

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/auth/login` | POST | `authController.login` | `authService.findUserByUsername()`, `authService.validateUserPassword()` | `authService.js` | User credentials | เข้าสู่ระบบแบบปกติ |
| `/api/auth/sso/kmutnb` | GET | `authController.redirectToKmutnbSso` | `authService.generateSsoRedirectUrl()` | `authService.js` | Redirect URL | เข้าสู่ระบบผ่าน SSO KMUTNB |
| `/api/auth/sso/kmutnb/callback` | GET | `authController.handleKmutnbSsoCallback` | `authService.processSsoCallback()` | `authService.js` | Auth token + user data | จัดการ callback จาก SSO |
| `/api/auth/profile` | GET | `authController.getProfile` | `authService.getUserProfile()` | `authService.js` | User profile | ดึงข้อมูลโปรไฟล์ผู้ใช้ |
| `/api/auth/refresh` | POST | `authController.refreshToken` | `authService.refreshUserToken()` | `authService.js` | Access token | รีเฟรช token |
| `/api/auth/logout` | POST | `authController.logout` | `authService.logoutUser()` | `authService.js` | Status message | ออกจากระบบ |

---

## Progress Tracking API

API สำหรับติดตามความคืบหน้าและบันทึกการปฏิบัติงาน

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/logbooks/internship/timesheet` | GET | `internshipLogbookController.getTimeSheetEntries` | `internshipLogbookService.getTimeSheetEntries()` | `internshipService.js` | TimeSheet entries | ดึงข้อมูลบันทึกเวลาฝึกงาน |
| `/api/logbooks/internship/timesheet` | POST | `internshipLogbookController.saveTimeSheetEntry` | `internshipLogbookService.saveTimeSheetEntry()` | `internshipService.js` | TimeSheet data | สร้างบันทึกเวลาฝึกงาน |
| `/api/logbooks/internship/timesheet/:id` | PUT | `internshipLogbookController.updateTimeSheetEntry` | `internshipLogbookService.updateTimeSheetEntry()` | `internshipService.js` | TimeSheet data | อัปเดตบันทึกเวลาฝึกงาน |
| `/api/logbooks/internship/stats` | GET | `internshipLogbookController.getTimeSheetStats` | `internshipLogbookService.getTimeSheetStats()` | `internshipService.js` | Statistics data | ดึงข้อมูลสถิติการฝึกงาน |
| `/api/logbooks/internship/reflection` | GET | `internshipLogbookController.getReflectionRecords` | `internshipLogbookService.getReflectionRecords()` | `internshipService.js` | Reflection entries | ดึงข้อมูลสะท้อนการฝึกงาน |
| `/api/logbooks/internship/reflection` | POST | `internshipLogbookController.saveReflectionRecord` | `internshipLogbookService.saveReflectionRecord()` | `internshipService.js` | Reflection data | สร้างบันทึกสะท้อนการฝึกงาน |
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
| `/api/admin/stats/students` | GET | `adminController.getStudentStats` | `adminService.getStudentStats()` | `adminService.js` | Student statistics | สถิตินักศึกษา |
| `/api/admin/stats/internships` | GET | `adminController.getInternshipStats` | `adminService.getInternshipStats()` | `adminService.js` | Internship statistics | สถิติการฝึกงาน |
| `/api/admin/stats/projects` | GET | `adminController.getProjectStats` | `adminService.getProjectStats()` | `adminService.js` | Project statistics | สถิติโครงงาน |
| `/api/admin/reports/timeline` | GET | `adminController.getTimelineReport` | `adminService.getTimelineReport()` | `adminService.js` | Timeline report | รายงานแท็ปไลน์ |
| `/api/admin/reports/progress` | GET | `adminController.getProgressReport` | `adminService.getProgressReport()` | `adminService.js` | Progress report | รายงานความคืบหน้า |

---

## Data Management API

API สำหรับจัดการข้อมูลหลักของระบบ

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/students` | GET | `userController.getAllStudents` | `studentService.getAllStudents()` | `studentService.js` | Student list | รายการนักศึกษาทั้งหมด |
| `/api/students/:id` | GET | `userController.getStudentById` | `studentService.getStudentById()` | `studentService.js` | Student details | ข้อมูลนักศึกษารายบุคคล |
| `/api/companies` | GET | `companyController.getAllCompanies` | `companyService.getAllCompanies()` | `adminService.js` | Company list | รายการบริษัท/หน่วยงาน |
| `/api/companies/:id/approve` | PUT | `companyController.approveCompany` | `companyService.approveCompany()` | `adminService.js` | Approval status | อนุมัติบริษัท |
| `/api/curriculum` | GET | `curriculumController.getCurriculumData` | `curriculumService.getCurriculumData()` | `curriculumService.js` | Curriculum data | ข้อมูลหลักสูตร |
| `/api/users/teachers` | GET | `userController.getAllTeachers` | `teacherService.getAllTeachers()` | `teacherService.js` | Teacher list | รายการอาจารย์ |

---

## Internship Management API

API สำหรับการจัดการการฝึกงาน (Clean Architecture)

| Endpoint | Method | Controller Function | Backend Service | Frontend Service | Data Type | Description |
|----------|---------|---------------------|-----------------|------------------|-----------|-------------|
| `/api/internship/cs05/current` | GET | `internshipController.getCurrentCS05` | `internshipManagementService.getCurrentCS05()` | `internshipService.js` | CS05 form data | ดึงข้อมูล CS05 ล่าสุด |
| `/api/internship/cs05/submit` | POST | `internshipController.submitCS05` | `internshipManagementService.submitCS05()` | `internshipService.js` | Submission status | ส่งแบบฟอร์ม CS05 พร้อมข้อมูล |
| `/api/internship/cs05/transcript` | POST | `internshipController.submitCS05WithTranscript` | `internshipManagementService.submitCS05WithTranscript()` | `internshipService.js` | Submission status | ส่ง CS05 พร้อม transcript |
| `/api/internship/cs05/:id` | GET | `internshipController.getCS05ById` | `internshipManagementService.getCS05ById()` | `internshipService.js` | CS05 details | ดึงข้อมูล CS05 ตาม ID |
| `/api/internship/company/:id` | POST | `internshipController.submitCompanyInfo` | `internshipManagementService.submitCompanyInfo()` | `internshipService.js` | Company data | ส่งข้อมูลบริษัทฝึกงาน |
| `/api/internship/company/:id` | GET | `internshipController.getCompanyInfo` | `internshipManagementService.getCompanyInfo()` | `internshipService.js` | Company details | ดึงข้อมูลบริษัทฝึกงาน |
| `/api/internship/summary` | GET | `internshipController.getInternshipSummary` | `internshipManagementService.getInternshipSummary()` | `internshipService.js` | Summary data | สรุปข้อมูลการฝึกงาน |
| `/api/internship/cs05/list` | GET | `internshipController.getCS05List` | `internshipManagementService.getCS05List()` | `internshipService.js` | CS05 list | ดึงรายการเอกสาร CS05 |
| `/api/internship/evaluation/status` | GET | `internshipController.getEvaluationStatus` | `internshipManagementService.getEvaluationStatus()` | `internshipService.js` | Status data | สถานะการประเมินผล |
| `/api/internship/evaluation/send/:id` | POST | `internshipController.sendEvaluationForm` | `internshipManagementService.sendEvaluationForm()` | `internshipService.js` | Send status | ส่งแบบฟอร์มประเมินให้พี่เลี้ยง |
| `/api/internship/evaluation/details/:token` | GET | `internshipController.getSupervisorEvaluationFormDetails` | `internshipManagementService.getSupervisorEvaluationFormDetails()` | `internshipService.js` | Form details | ดึงข้อมูลแบบฟอร์มประเมิน |
| `/api/internship/evaluation/submit/:token` | POST | `internshipController.submitSupervisorEvaluation` | `internshipManagementService.submitSupervisorEvaluation()` | `internshipService.js` | Submission status | บันทึกผลการประเมินจากพี่เลี้ยง |

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
- `internshipController.js` - การจัดการการฝึกงานผ่าน service layer
- **Logbook Controllers:**
  - `internshipLogbookController.js` - บันทึกการฝึกงาน
  - `projectLogbookController.js` - บันทึกโครงงาน

### Backend Services ที่มีอยู่จริง:
- **`authService.js`** - จัดการการยืนยันตัวตนและการเข้าสู่ระบบ
  - `findUserByUsername()` - ค้นหาผู้ใช้ด้วย username
  - `validateUserCredentials()` - ตรวจสอบข้อมูลเข้าสู่ระบบ
  - `generateTokens()` - สร้าง JWT tokens
  - `refreshAccessToken()` - รีเฟรช access token
  - `logout()` - ออกจากระบบและยกเลิก token

- **`adminService.js`** - จัดการข้อมูลและสถิติของระบบ
  - `getStudentStats()` - ดึงสถิตินักศึกษา
  - `getInternshipStats()` - ดึงสถิติการฝึกงาน
  - `getProjectStats()` - ดึงสถิติโครงงาน
  - `getAllStats()` - ดึงสถิติทั้งหมด

- **`timelineService.js`** - จัดการข้อมูลแท็ปไลน์
  - `getStudentTimeline()` - ดึงข้อมูลแท็ปไลน์นักศึกษา
  - `updateTimelineStep()` - อัปเดตขั้นตอนในแท็ปไลน์
  - `getTimelineEventsByStudent()` - ดึงกิจกรรมในแท็ปไลน์ของนักศึกษา

- **`workflowService.js`** - จัดการ workflow และ timeline
  - `getWorkflowStepDefinitions()` - ดึงขั้นตอน workflow ตาม workflowType
  - `updateStudentWorkflowActivity()` - อัปเดต/สร้าง StudentWorkflowActivity
  - `generateStudentTimeline()` - สร้าง timeline สำหรับแสดงผลใน frontend

- **`academicService.js`** - จัดการข้อมูลวิชาการ
  - `getCurrentAcademicSettings()` - ดึงการตั้งค่าปีการศึกษาปัจจุบัน
  - `updateAcademicSettings()` - อัปเดตการตั้งค่าปีการศึกษา
  - `getAcademicYears()` - ดึงรายการปีการศึกษา

- **`studentService.js`** - จัดการข้อมูลนักศึกษา
  - `calculateEligibility()` - คำนวณสิทธิ์ของนักศึกษา
  - `getAllStudents()` - ดึงข้อมูลนักศึกษาทั้งหมด
  - `getStudentById()` - ดึงข้อมูลนักศึกษาตาม ID
  - `updateStudent()` - อัปเดตข้อมูลนักศึกษา

- **`internshipLogbookService.js`** - จัดการบันทึกการฝึกงาน
  - `getTimeSheetEntries()` - ดึงข้อมูลบันทึกเวลาการฝึกงาน
  - `saveTimeSheetEntry()` - บันทึกข้อมูลการฝึกงานประจำวัน
  - `updateTimeSheetEntry()` - อัปเดตข้อมูลการฝึกงาน
  - `getTimeSheetStats()` - ดึงข้อมูลสถิติการฝึกงาน
  - `getReflectionRecords()` - ดึงข้อมูลสะท้อนการฝึกงาน
  - `saveReflectionRecord()` - บันทึกข้อมูลสะท้อนการฝึกงาน

- **`internshipManagementService.js`** - จัดการ business logic ของการฝึกงาน (Clean Architecture)
  - `getStudentInfo()` - ดึงข้อมูลนักศึกษาสำหรับการฝึกงาน
  - `getCurrentCS05()` - ดึงข้อมูลแบบฟอร์ม CS05 ปัจจุบัน
  - `submitCS05()` - ส่งแบบฟอร์ม CS05 พร้อมข้อมูลบริษัท
  - `submitCS05WithTranscript()` - ส่งแบบฟอร์ม CS05 พร้อม transcript
  - `getCS05ById()` - ดึงข้อมูล CS05 ตาม ID
  - `submitCompanyInfo()` - บันทึกข้อมูลบริษัทฝึกงาน
  - `getCompanyInfo()` - ดึงข้อมูลบริษัทฝึกงาน
  - `getCS05List()` - ดึงรายการเอกสาร CS05
  - `getInternshipSummary()` - ดึงข้อมูลสรุปการฝึกงาน
  - `getEvaluationStatus()` - ตรวจสอบสถานะการประเมิน
  - `sendEvaluationForm()` - ส่งแบบฟอร์มประเมินให้พี่เลี้ยง
  - `getSupervisorEvaluationFormDetails()` - ดึงข้อมูลแบบฟอร์มประเมิน
  - `submitSupervisorEvaluation()` - บันทึกผลการประเมินจากพี่เลี้ยง

- **`internshipService.js`** - จัดการการฝึกงาน
  - `approveCS05()` - อนุมัติเอกสาร คพ.05 พร้อมจัดการ workflow
  - `handleCS05Approval()` - จัดการขั้นตอน workflow หลังอนุมัติ คพ.05
  - `updateWorkflowActivity()` - อัปเดต workflow activity สำหรับนักศึกษา

- **`projectMembersService.js`** - จัดการข้อมูลสมาชิกโครงงาน
  - `getAllApprovedProjectMembers()` - ดึงข้อมูลโครงงานและสมาชิกที่ได้รับการอนุมัติ
  - `updateProjectMembersInternshipStatus()` - อัปเดตสถานะการฝึกงานของสมาชิกโครงงาน
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

### Clean Architecture ในระบบ
ระบบ CSLogbook ใช้หลักการ Clean Architecture โดยแบ่งชั้นการทำงานออกจากกันอย่างชัดเจน โดยเฉพาะการแยก business logic ออกจาก controller ไปไว้ใน service layer เพื่อให้เกิดความยืดหยุ่น, ทดสอบได้ง่าย และบำรุงรักษาได้ดี

**แนวทางการใช้ Clean Architecture ในระบบ:**
1. **Controller Layer** - ทำหน้าที่รับคำขอ HTTP และส่งคืน HTTP response เท่านั้น
2. **Service Layer** - เก็บ business logic ทั้งหมดและการจัดการข้อมูล
3. **Model Layer** - จัดการโครงสร้างข้อมูลและความสัมพันธ์
4. **Error Handling** - ใช้รูปแบบมาตรฐานในการส่งกลับ error code และข้อความ

การปรับโครงสร้างโค้ดตามหลัก Clean Architecture มีจุดประสงค์ดังนี้:

1. **แยก Business Logic จาก Controller**:
   - Controller ทำหน้าที่เพียงรับ HTTP Request และส่งคืน HTTP Response
   - Service ทำหน้าที่จัดการ business logic ทั้งหมด

2. **การจัดการ Error ที่เป็นมาตรฐาน**:
   - Service กำหนด status code และ error message
   - Controller เพียงใช้ข้อมูล error จาก service โดยไม่ปรับแต่ง

3. **ความสามารถในการทดสอบ (Testability)**:
   - สามารถทดสอบ business logic ได้โดยไม่ต้องจำลอง HTTP Request/Response
   - เพิ่มความง่ายในการเขียน unit test

4. **การบำรุงรักษาที่ง่ายขึ้น**:
   - แยกความรับผิดชอบอย่างชัดเจน
   - ลดความซับซ้อนของ code ในแต่ละส่วน

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

### InternshipLogbookService Functions:
1. **`getTimeSheetEntries(userId)`**
   - ดึงข้อมูลบันทึกเวลาการฝึกงานของนักศึกษา
   - รวมข้อมูลการอนุมัติจากพี่เลี้ยงและอาจารย์
   - เรียงลำดับตามวันที่ล่าสุด

2. **`saveTimeSheetEntry(userId, entryData)`**
   - สร้างบันทึกเวลาการฝึกงานใหม่
   - ตรวจสอบการมี CS05 ที่อนุมัติแล้ว
   - ตรวจสอบข้อมูลซ้ำซ้อนและจัดการ transaction

3. **`updateTimeSheetEntry(userId, logId, updateData)`**
   - อัปเดตบันทึกเวลาการฝึกงานที่มีอยู่
   - ตรวจสอบว่าบันทึกได้รับการอนุมัติหรือยัง
   - ป้องกันการแก้ไขบันทึกที่อนุมัติแล้ว

4. **`getTimeSheetStats(userId)`**
   - คำนวณสถิติการฝึกงาน เช่น จำนวนวัน, ชั่วโมงทั้งหมด
   - สรุปสถานะการบันทึกและการอนุมัติ
   - ระบุความสำเร็จตามเป้าหมายการฝึกงาน

5. **`getReflectionRecords(userId)`**
   - ดึงบันทึกสะท้อนการฝึกงาน
   - จัดกลุ่มตามช่วงเวลา (รายสัปดาห์/เดือน)
   - รวมข้อมูลคำติชมจากอาจารย์
1. **`getTimeSheetEntries(userId)`**
   - ดึงข้อมูลบันทึกการฝึกงานทั้งหมดของนักศึกษา
   - ค้นหาตาม userId และคืนรายการบันทึกการฝึกงาน
   - จัดการข้อมูลบันทึกเวลาการฝึกงานจากฐานข้อมูล

2. **`saveTimeSheetEntry(userId, entryData)`**
   - บันทึกข้อมูลการฝึกงานประจำวัน
   - ตรวจสอบความถูกต้องของข้อมูลและการซ้ำซ้อน
   - จัดการ transaction สำหรับการบันทึกข้อมูล

3. **`updateTimeSheetEntry(userId, logId, updateData)`**
   - อัปเดตข้อมูลการฝึกงานประจำวัน
   - ตรวจสอบว่าบันทึกได้รับการอนุมัติแล้วหรือไม่
   - จัดการ transaction สำหรับการอัปเดตข้อมูล

4. **`getTimeSheetStats(userId)`**
   - ดึงข้อมูลสถิติการฝึกงาน
   - คำนวณจำนวนวัน จำนวนชั่วโมง และสถานะต่างๆ
   - รวบรวมข้อมูลสถิติการฝึกงานสำหรับการแสดงผล

### InternshipManagementService Functions:
1. **`getCurrentCS05(userId)`**
   - ดึงข้อมูล CS05 ล่าสุดของนักศึกษา
   - ตรวจสอบสถานะและประวัติการส่งเอกสาร
   - จัดการข้อมูล internship document

2. **`submitCS05(userId, { companyName, companyAddress, startDate, endDate })`**
   - สร้างเอกสาร CS05 และบันทึกข้อมูลบริษัทฝึกงาน
   - ตรวจสอบเงื่อนไขการส่งแบบฟอร์ม
   - อัปเดตสถานะเอกสารและรายละเอียดการฝึกงาน

3. **`getInternshipSummary(userId)`**
   - สรุปข้อมูลการฝึกงานของนักศึกษา
   - แสดงสถานะปัจจุบันและความคืบหน้า
   - รวบรวมข้อมูลจาก documents และ evaluation data

4. **`sendEvaluationForm(internshipId, userId)`**
   - สร้างแบบฟอร์มการประเมินและ token สำหรับพี่เลี้ยง
   - ส่งอีเมลไปยังพี่เลี้ยงพร้อมลิงก์แบบฟอร์ม
   - บันทึกประวัติการส่งอีเมลและตั้งค่า expiration

5. **`getSupervisorEvaluationFormDetails(token)`**
   - ดึงข้อมูลสำหรับแสดงในแบบฟอร์มประเมิน
   - ตรวจสอบความถูกต้องของ token และเงื่อนไขต่างๆ
   - จัดเตรียมข้อมูลนักศึกษาและการฝึกงานสำหรับแบบฟอร์ม

6. **`submitSupervisorEvaluation(token, evaluationData)`**
   - บันทึกผลการประเมินจากพี่เลี้ยง
   - ตรวจสอบความถูกต้องของ token และการหมดอายุ
   - อัปเดตสถานะเอกสารและบันทึกการประเมิน
   - ส่งอีเมลแจ้งอาจารย์ที่ปรึกษาเมื่อประเมินเสร็จสิ้น
   - จัดการ error handling และ status code ที่เหมาะสม

### AuthService Functions:
1. **`findUserByUsername(username)`**
   - ค้นหาผู้ใช้จากฐานข้อมูลด้วย username
   - ตรวจสอบสถานะการเปิดใช้งานบัญชี
   - คืนค่าข้อมูลผู้ใช้หรือ null ถ้าไม่พบ

2. **`validateUserPassword(user, password)`**
   - ตรวจสอบรหัสผ่านด้วย bcrypt
   - สร้าง JWT token เมื่อรหัสผ่านถูกต้อง
   - บันทึกประวัติการเข้าสู่ระบบและส่งการแจ้งเตือน

3. **`getUserProfile(userId)`**
   - ดึงข้อมูลโปรไฟล์ผู้ใช้พร้อมข้อมูลที่เกี่ยวข้อง
   - แยกข้อมูลตามบทบาท (นักศึกษา, อาจารย์, ผู้ดูแลระบบ)
   - จัดโครงสร้างข้อมูลให้เหมาะสมสำหรับ frontend

4. **`processSsoCallback(code)`**
   - ประมวลผล callback จากระบบ SSO
   - แลกเปลี่ยน authorization code เพื่อรับข้อมูลผู้ใช้
   - สร้างหรืออัปเดตผู้ใช้ในระบบและออก JWT token

5. **`logoutUser(refreshToken)`**
   - เพิกถอน refresh token
   - บันทึกเวลาออกจากระบบ
   - ทำความสะอาดข้อมูล session

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

**การปรับปรุงโครงสร้างตามหลัก Clean Architecture:** ระบบได้มีการปรับปรุงโครงสร้างโค้ด โดยย้าย business logic ออกจาก controller ไปอยู่ใน service layer ตามหลัก Clean Architecture เกือบทั้งหมดแล้ว โดยมีบริการหลักที่ได้รับการปรับปรุงดังนี้:

1. **internshipManagementService.js** - แยก business logic จาก internshipController.js ทั้งหมด
2. **authService.js** - จัดการการยืนยันตัวตนและการเข้าสู่ระบบ
3. **adminService.js** - จัดการข้อมูลและสถิติของระบบ
4. **documentService.js** - จัดการเกี่ยวกับเอกสาร
5. **timelineService.js** - จัดการข้อมูลแท็ปไลน์
6. **emailApprovalService.js** - จัดการการอนุมัติผ่านอีเมล
7. **internshipLogbookService.js** - จัดการบันทึกการฝึกงาน
8. **projectMembersService.js** - จัดการข้อมูลสมาชิกโครงงาน

ส่วน controller จะทำหน้าที่เป็นเพียงตัวรับ request และส่งคืน response เท่านั้น ส่วน service ทำหน้าที่จัดการ business logic, error handling และการกำหนด status code ที่เหมาะสม ยังมีส่วนที่ต้องปรับปรุงเล็กน้อย เช่น documentStatusController.js และการสร้าง projectLogbookService.js

**การอัปเดตล่าสุด:**
- ตรวจสอบและปรับปรุงเอกสารสำหรับบริการทั้งหมดตามหลัก Clean Architecture
- เพิ่มข้อมูล InternshipLogbookService สำหรับบันทึกการฝึกงาน
- เพิ่มข้อมูล ProjectMembersService สำหรับจัดการข้อมูลสมาชิกโครงงาน
- อัปเดตข้อมูล API endpoints ในส่วน Progress Tracking API
- เพิ่มข้อมูลเกี่ยวกับบริการที่ปรับปรุงตามหลัก Clean Architecture แล้ว
- ระบุส่วนที่ยังคงต้องปรับปรุง (documentStatusController, projectLogbookService)
- เพิ่มรายละเอียดฟังก์ชันของแต่ละบริการ (AuthService, AdminService, TimelineService)
- เพิ่ม InternshipManagementService สำหรับการจัดการฝึกงานตามหลัก Clean Architecture
- เพิ่มฟังก์ชันในการจัดการแบบฟอร์มประเมินผล CS05 และการประเมินผลโดยพี่เลี้ยง
- แก้ไข internshipController ให้เรียกใช้ service layer แทนที่จะมี business logic
- เพิ่ม error handling ที่เหมาะสมใน service layer
- เพิ่ม DocumentService สำหรับการจัดการเอกสารแบบ service layer architecture
- เพิ่ม EmailApprovalService สำหรับการอนุมัติผ่านอีเมล
- ปรับปรุง API endpoints ให้สอดคล้องกับ service layer pattern
- เพิ่มรายละเอียด backend service functions ที่สำคัญ
