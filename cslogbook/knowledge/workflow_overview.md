# ภาพรวม Workflow กิจกรรมของ CSLogbook

> เอกสารนี้สรุปขั้นตอน (workflow) ที่ระบบใช้ติดตามความคืบหน้าของนักศึกษา ทั้งฝึกงาน (internship) และโครงงานพิเศษ 1 (project1) พร้อมทั้งระบุบริการที่เกี่ยวข้องและเงื่อนไขหลักในการอัปเดตสถานะ

## โครงสร้างข้อมูลหลัก

- ตาราง `workflow_step_definitions`
  - เก็บ master data ของแต่ละขั้น (step) แยกตาม `workflow_type`
  - ข้อมูลถูก seed ผ่านไฟล์ `20250513000001-initial-internship-steps.js`, `20250513000002-initial-project-steps.js` และอัปเดตล่าสุดด้วย `20250930121000-update-project1-workflow-steps.js`
- ตาราง `student_workflow_activities`
  - เก็บสถานะล่าสุดของแต่ละนักศึกษาต่อ workflow ประเภทต่าง ๆ
  - ฟิลด์สำคัญ: `current_step_key`, `current_step_status`, `overall_workflow_status`, `data_payload`
- บริการที่เกี่ยวข้อง
  - `workflowService` — ฟังก์ชันกลาง เช่น `updateStudentWorkflowActivity`, `generateStudentTimeline`
  - `timelineService` — สร้างข้อมูล timeline สำหรับ UI และ initial activity
  - `projectDocumentService` + `projectWorkflowService` — คำนวน readiness และปลดล็อกขั้นโครงงาน
  - `internshipManagementService` / `internshipService` / `documentService` — จัดการ CS05, หนังสือตอบรับ, และอัปเดต workflow ฝึกงาน

## Workflow ฝึกงาน (`workflow_type = internship`)

| ลำดับ | Step Key | ชื่อ (title) | เงื่อนไข / ฟังก์ชันที่ตั้งค่า | สถานะที่ตั้งโดยปกติ |
| --- | --- | --- | --- | --- |
| 1 | `INTERNSHIP_ELIGIBILITY_MET` *(โค้ดบางส่วนยังอ้าง `INTERNSHIP_ELIGIBILITY_CHECK`)* | มีสิทธิ์ลงทะเบียนฝึกงาน | `workflowService.generateStudentTimeline` จะ mark เป็น `completed` เมื่อ `student.isEligibleInternship` เป็นจริง และมีการเริ่ม timeline ผ่าน `timelineService.initializeStudentTimeline` | `completed` เมื่อมีสิทธิ์, `awaiting_student_action` ขณะยังไม่ผ่าน | 
| 2 | `INTERNSHIP_CS05_SUBMITTED` | ยื่นคำร้องฝึกงาน (คพ.05) | กำหนดผ่านการ submit CS05 (`internshipManagementService.submitCS05` / `submitCS05WithTranscript`) แล้วเรียก `workflowService.updateStudentWorkflowActivity` | `awaiting_admin_action` หรือ `pending` ตามฟังก์ชันที่เรียก | 
| 3 | `INTERNSHIP_CS05_APPROVAL_PENDING` | รอการอนุมัติ คพ.05 | ตั้งอัตโนมัติหลังส่งเอกสาร (ดู `handleCS05Approval` ใน `internshipService`) | `pending` | 
| 4 | `INTERNSHIP_CS05_APPROVED` | คพ.05 ได้รับการอนุมัติ | `internshipService.handleCS05Approval` + `documentService.processCS05Approval` เรียก `workflowService.updateStudentWorkflowActivity` ให้ `completed` และอัปเดตสถานะนักศึกษาเป็น `in_progress` | `completed` |
| 5 | `INTERNSHIP_COMPANY_RESPONSE_PENDING` | รอหนังสือตอบรับ | ถูกตั้งเป็น `awaiting_student_action` ใน `handleCS05Approval` หลังอนุมัติ คพ.05 | `awaiting_student_action` |
| 6 | `INTERNSHIP_COMPANY_RESPONSE_RECEIVED` | ได้รับหนังสือตอบรับแล้ว | เมื่อเอกสารประเภท `ACCEPTANCE_LETTER` ได้รับการอนุมัติ (`internshipManagementService.checkAcceptanceLetterStatus` + อัปเดตส่วนที่เกี่ยวข้อง) | `completed` |
| 7 | `INTERNSHIP_AWAITING_START` | รอเริ่มการฝึกงาน | ตั้งตามข้อมูลวันที่ฝึกงานจาก CS05/Acceptance letter หรือปรับจาก dashboard admin | `pending` |
| 8 | `INTERNSHIP_IN_PROGRESS` | อยู่ระหว่างการฝึกงาน | ถูกอัปเดตเมื่อระบบตรวจว่าเริ่มทำ log (เช็คผ่าน `internship_logbooks`) หรือ admin ปรับสถานะนักศึกษา (`student.internshipStatus`) แล้ว sync workflow | `in_progress` |
| 9 | `INTERNSHIP_SUMMARY_PENDING` | รอส่งสรุปผล | เรียกผ่าน scheduler / admin เมื่อตรวจว่าวันสิ้นสุดฝึกงานผ่านแล้วแต่ยังไม่อัปโหลดไฟล์สรุป | `awaiting_student_action` |
| 10 | `INTERNSHIP_COMPLETED` | ฝึกงานเสร็จสมบูรณ์ | เมื่อ logbook + รายงานผ่านการอนุมัติ และ `student.internshipStatus === 'completed'` | `completed` |

> หมายเหตุ: หากมีการลบ / เพิ่ม step ผ่านหน้า Admin (`WorkflowSteps`), ระบบจะ refresh cache ผ่าน `workflowService.refreshStepDefinitionsCache`

## Workflow โครงงานพิเศษ 1 (`workflow_type = project1`)

| ลำดับ | Step Key | ชื่อ (title) | แหล่งข้อมูลที่ใช้ตัดสิน | สถานะทั่วไป |
| --- | --- | --- | --- | --- |
| 1 | `PROJECT1_TEAM_READY` | ส่งหัวข้อโครงงานพิเศษ | `projectDocumentService.computeProjectWorkflowState` ตรวจว่า **สมาชิก ≥ 2**, นักศึกษามีสิทธิ์ (`student.isEligibleProject`), และกรอกชื่อหัวข้อ TH/EN ครบ | `awaiting_student_action` ➜ `completed` เมื่อครบ | 
| 2 | `PROJECT1_IN_PROGRESS` | เปิดดำเนินโครงงาน | สถานะโครงงาน `project.status` เป็น `in_progress` / `completed` | `in_progress` หรือ `completed` |
| 3 | `PROJECT1_PROGRESS_CHECKINS` | บันทึกความคืบหน้ากับอาจารย์ | ใช้ metrics จาก `meetingService`/`project_meetings_logbook_api` ตรวจว่ามี log ได้รับอนุมัติ | `in_progress` / `completed` |
| 4 | `PROJECT1_READINESS_REVIEW` | ตรวจความพร้อมยื่นสอบ | ต้องมีบันทึกอนุมัติครบตามเกณฑ์ (`REQUIRED_APPROVED_MEETING_LOGS`) | `pending` / `completed` |
| 5 | `PROJECT1_DEFENSE_REQUEST` | ยื่นคำขอสอบโครงงาน 1 | มี `ProjectDefenseRequest` (defenseType `PROJECT1`) ที่ไม่ถูกยกเลิกระบบ | `awaiting_student_action` / `completed` |
| 6 | `PROJECT1_DEFENSE_SCHEDULED` | นัดสอบโครงงาน 1 | ค่า `defenseScheduledAt` ถูกตั้ง และสถานะคำขออยู่ใน `staff_verified`, `scheduled`, หรือ `completed` | `pending` / `completed` |
| 7 | `PROJECT1_DEFENSE_RESULT` | ผลการสอบหัวข้อโครงงาน | `ProjectExamResult` บันทึกผล `PASS` หรือ `FAIL` + นักศึกษากดรับทราบ | `completed` หรือ `blocked` หาก `FAIL` แต่ยังไม่ acknowledge |

### การซิงก์และปลดล็อกขั้นต่อไป

1. `projectExamResultService.recordExamResult`
   - บันทึกผลสอบ + เรียก `projectDocumentService.syncProjectWorkflowState`
   - เมื่อบันทึก PASS จะเรียก `_canUnlockNextPhase`
2. `_canUnlockNextPhase`
   - ตรวจ `project.semester` เพื่อหา `nextSemester`
   - ดึงข้อมูล `Academic` ทั้งตามปี (`academicYear`) และ flag `isCurrent`
   - ใช้ `semester{n}Range.start` เทียบกับวันปัจจุบัน (ผ่าน `dayjs()`)
   - ถ้าถึงเวลาแล้วจะเรียก `projectWorkflowService.unlockNextPhase` สำหรับสมาชิกแต่ละคน
3. `projectWorkflowService.unlockNextPhase`
   - ใช้ `workflowService.updateStudentWorkflowActivity(studentId, 'project1', currentStep, 'completed', ...)`
   - Log ตัวอย่างในคำถามมาจากบรรทัดนี้

## แนวทางทดสอบ / Override ในช่วงพัฒนา

กรณีต้องการทดสอบการปลดล็อก Phase 2 แต่วันเริ่มภาคเรียนถัดไป (`semester2Range.start`) ยังไม่ถึง สามารถเลือกแนวทางต่อไปนี้:

1. **ปรับข้อมูลปีการศึกษาในฐานข้อมูล dev**
   - ผ่านหน้า Admin > Academic Settings หรือสั่ง SQL: `UPDATE academics SET semester2_range_start = CURDATE() - INTERVAL 1 DAY WHERE academic_year = 2567;`
   - จากนั้น trigger การบันทึกผลสอบอีกครั้งเพื่อทดสอบปลดล็อก
2. **ตั้งเวลาเครื่องจำลอง (เฉพาะ dev machine / container)**
   - ใช้ `date -s` บน Linux container หรือปรับ `TZ` ให้เวลาเดินหน้า (ไม่แนะนำบนเครื่องจริง)
3. **เขียนสคริปต์ชั่วคราวสำหรับ dev**
   - เรียก `workflowService.updateStudentWorkflowActivity(studentId, 'project1', 'PROJECT1_DEFENSE_RESULT', 'completed', 'in_progress')` ผ่าน REPL เพื่อจำลองผล แต่ควรทำใน transaction แยกและตั้งค่า `autoUnlockedFrom` ใน payload เอง
4. **หน่วยทดสอบ (Jest)**
   - ใช้ `jest.setSystemTime()` เหมือนตัวอย่างใน `tests/unit/projectExamResultService.unit.test.js` เพื่อควบคุมเวลาและทดสอบ logic `_canUnlockNextPhase`

> โปรดคืนค่าข้อมูลปีการศึกษาให้กลับสู่ค่าจริงหลังทดสอบ เพื่อไม่ให้กระทบการรันงาน background และ dashboard
