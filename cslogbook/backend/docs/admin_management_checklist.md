# Admin Management System Checklist

เอกสารนี้รวบรวม Checklist สำหรับการทดสอบระบบในส่วนของ Admin/Management โดยเน้นที่การจัดการข้อมูลนักศึกษาและความปลอดภัยของข้อมูล

## หมวดที่ 1: ระบบจัดการข้อมูลนักศึกษา (Student Management System)

### 1. Data Import (การนำเข้าข้อมูล)
*Target: `POST /api/upload/csv` (UploadController)*

- [ ] **TC-IMP-01: Import Success**
  - **Scenario:** นำเข้าไฟล์ CSV ที่มีข้อมูลถูกต้องครบถ้วน (Student Code, First Name, Last Name, Credits)
  - **Expected Result:** ระบบตอบกลับ `success: true`, สร้าง User และ Student record ใหม่ครบทุกรายการ
- [ ] **TC-IMP-02: Duplicate Data Handling**
  - **Scenario:** นำเข้าไฟล์ CSV ที่มีรหัสนักศึกษาซ้ำกับที่มีในระบบแล้ว
  - **Expected Result:** ระบบควรข้ามรายการที่ซ้ำ หรือแจ้งเตือน `SequelizeUniqueConstraintError` (ข้อมูลซ้ำ) ใน Summary ผลลัพธ์ ไม่ควรทำให้ระบบ Crash
- [ ] **TC-IMP-03: Invalid Format**
  - **Scenario:** นำเข้าไฟล์ที่มี Column ไม่ครบ หรือชนิดข้อมูลผิด (เช่น Credits เป็นตัวหนังสือ)
  - **Expected Result:** ระบบแจ้ง Error ว่าข้อมูลไม่ถูกต้อง หรือ `Validation Error`

### 2. Edit Student Info (การแก้ไขข้อมูล)
*Target: `PUT /api/students/:id` (StudentController)*

- [ ] **TC-EDIT-01: Update Credits & Immediate Eligibility**
  - **Scenario:** แก้ไข `totalCredits` และ `majorCredits` ของนักศึกษาให้ **ผ่านเกณฑ์** (เช่น > 100 หน่วยกิต)
  - **Expected Result:**
    - บันทึกข้อมูลลง DB สำเร็จ
    - ค่า `isEligibleInternship` และ `isEligibleProject` ใน DB เปลี่ยนเป็น `true` **ทันที**
- [ ] **TC-EDIT-02: Revert Eligibility**
  - **Scenario:** แก้ไขหน่วยกิตกลับมาให้ **ไม่ผ่านเกณฑ์**
  - **Expected Result:** ค่า `isEligible...` เปลี่ยนกลับเป็น `false` ทันที
- [ ] **TC-EDIT-03: Data Consistency**
  - **Scenario:** แก้ไขชื่อ-นามสกุล
  - **Expected Result:** ข้อมูลในตาราง `Users` และ `Students` อัปเดตตรงกัน

### 3. Search & Filter (ค้นหาและกรอง)
*Target: `GET /api/students` (StudentController)*

- [ ] **TC-SRCH-01: Partial Search**
  - **Scenario:** ค้นหาด้วยรหัสนักศึกษาบางส่วน (เช่น "640") หรือชื่อบางส่วน
  - **Expected Result:** แสดงรายการนักศึกษาที่ Match ทั้งหมด
- [ ] **TC-FILT-01: Filter by Status**
  - **Scenario:** เลือก Filter Status = 'Internship Eligible'
  - **Expected Result:** แสดงเฉพาะนักศึกษาที่มี `isEligibleInternship = true`

### 4. Reset Data (การรีเซ็ตสถานะ)
*Target: `POST /api/admin/internships/:id/cancel` (InternshipAdminController)*

- [ ] **TC-RST-01: Cancel Internship**
  - **Scenario:** Admin กด "ยกเลิกการฝึกงาน" ให้นักศึกษาที่กำลังดำเนินการ
  - **Expected Result:** สถานะการฝึกงานเปลี่ยนเป็น `cancelled` (หรือสถานะที่กำหนด) และนักศึกษาสามารถเริ่มกระบวนการใหม่ได้
- [ ] **TC-RST-02: Manual Status Reset (Hard Reset)**
  - **Scenario:** ลบข้อมูลนักศึกษาเพื่อเริ่มใหม่ (`DELETE /api/students/:id`)
  - **Expected Result:** ลบทั้งข้อมูลในตาราง `Students` และ `Users` ได้สำเร็จ (เฉพาะกรณีไม่มีข้อมูล Related ที่สำคัญ)

---

## หมวดที่ 2: ความสมบูรณ์และความปลอดภัยของข้อมูล (Integrity & Security)

### 1. Deletion Constraints (ข้อจำกัดการลบข้อมูล)
*Target: `DELETE /api/students/:id`*

- [ ] **TC-INT-01: Prevent Deletion with Active Data**
  - **Scenario:** พยายามลบนักศึกษาที่มีข้อมูลการฝึกงาน (Internship), โครงงาน (Project), หรือ Logbook อยู่ในระบบ
  - **Expected Result:**
    - **กรณี Ideal:** ระบบควร **ปฏิเสธ** การลบ (`400 Bad Request` หรือ `409 Conflict`) เพื่อป้องกันข้อมูล Orphan หรือข้อมูลหายโดยไม่ตั้งใจ
    - **กรณีปัจจุบัน:** หากระบบอนุญาตให้ลบ ต้องตรวจสอบว่าข้อมูลที่เกี่ยวข้อง (Projects, Internships) ถูกลบไปด้วย (Cascade) หรือไม่ (ควรระวัง Orphan Records)
- [ ] **TC-INT-02: Cascade Deletion Verification**
  - **Scenario:** หากการลบสำเร็จ ตรวจสอบตารางที่เกี่ยวข้อง (`project_members`, `internship_documents`)
  - **Expected Result:** ข้อมูลในตารางลูกควรถูกลบไปด้วย หรือ `user_id`/`student_id` ถูก set null (ขึ้นอยู่กับ Design)

### 2. Duplicate Entry Prevention (การป้องกันข้อมูลซ้ำ)
*Target: `POST /api/students` (Add Student)*

- [ ] **TC-SEC-01: Duplicate Student ID (Database Level)**
  - **Scenario:** พยายามสร้างนักศึกษาใหม่ด้วย `studentCode` ที่มีอยู่แล้วผ่าน API โดยตรง
  - **Expected Result:** Database throw error (`UniqueConstraintError`) และ API ตอบกลับ `409 Conflict`
- [ ] **TC-SEC-02: Duplicate Email**
  - **Scenario:** พยายามสร้างนักศึกษาใหม่ด้วย `email` ที่มีอยู่แล้ว
  - **Expected Result:** API ตอบกลับ `409 Conflict`

### 3. Role Management Security (ความปลอดภัยในการจัดการสิทธิ์)
*Target: `PUT /api/users/:id` or similar*

- [ ] **TC-SEC-03: Unauthorized Role Elevation**
  - **Scenario:** ยิง API Update User โดยพยายามส่ง field `role: 'admin'` ไปยัง user ที่เป็น student
  - **Expected Result:** ระบบต้อง **ไม่** อัปเดต field `role` (Ignore หรือ Error) หาก API นั้นไม่ได้ออกแบบมาสำหรับ Super Admin โดยเฉพาะ
- [ ] **TC-SEC-04: Self-Demotion Prevention**
  - **Scenario:** Admin พยายามแก้ไข Role ของตัวเองให้เป็น Student หรือลบ Account ตัวเอง
  - **Expected Result:** ระบบควรป้องกันไม่ให้ Admin คนสุดท้ายลบตัวเอง หรือลดสิทธิ์ตัวเองจนเข้าระบบไม่ได้

---

## หมวดที่ 3: การตั้งค่าปีการศึกษาและกำหนดการ (Academic Year & Configuration)

### 1. Year/Term Switching (การเปลี่ยนปีการศึกษา)
*Target: `PUT /api/academic-settings/:id` (AcademicController)*

- [ ] **TC-CFG-01: Active Year Switch Impact**
  - **Scenario:** Admin เปลี่ยนปีการศึกษาปัจจุบัน (Active Year) จาก 2567 เป็น 2568
  - **Expected Result:**
    - ข้อมูลบน Dashboard ของนักศึกษาควรเปลี่ยนไปแสดงข้อมูลของปีการศึกษาใหม่ (หรือว่างเปล่าถ้ายังไม่มีข้อมูล)
    - ข้อมูลเก่า (2567) ต้องไม่หายไป และสามารถดูย้อนหลังได้ (หากมีฟีเจอร์เลือกปี)
- [ ] **TC-CFG-02: Semester Transition**
  - **Scenario:** เปลี่ยนภาคเรียนจาก 1 เป็น 2
  - **Expected Result:** รายวิชาหรือกำหนดการที่ผูกกับภาคเรียนที่ 1 ควรถูกซ่อนหรือย้ายไปอยู่ใน History; กำหนดการของภาคเรียนที่ 2 ควรปรากฏขึ้น

### 2. Date Configuration & Deadlines (การตั้งค่าวันกำหนดส่ง)
*Target: `POST/PUT /api/important-deadlines` (ImportantDeadlineController)*

- [ ] **TC-CFG-03: Past Date Configuration (Overdue)**
  - **Scenario:** ตั้งค่า `deadlineAt` เป็น "เมื่อวาน"
  - **Expected Result:**
    - หน้าจอนักศึกษาแสดงสถานะ **'Overdue'** หรือ **'Late'** ทันที
    - หาก `lockAfterDeadline = true`: ปุ่มส่งงานควรถูกปิด (Disabled) หรือซ่อน
    - หาก `allowLate = true`: ปุ่มส่งงานยังกดได้ แต่ระบบต้องบันทึกว่าส่งช้า (Late Submission)
- [ ] **TC-CFG-04: Future Date Configuration**
  - **Scenario:** ตั้งค่า `deadlineAt` เป็น "พรุ่งนี้"
  - **Expected Result:** สถานะเป็นปกติ (Pending/Open), ปุ่มส่งงานใช้งานได้
- [ ] **TC-CFG-05: Window Date Configuration**
  - **Scenario:** ตั้งค่า `windowStartAt` เป็น "พรุ่งนี้" (ยังไม่ถึงเวลาเปิดรับ)
  - **Expected Result:** ปุ่มส่งงานควรถูกปิด (Disabled) หรือแสดงข้อความว่า "ระบบยังไม่เปิดรับ"

### 3. Validation (การตรวจสอบความถูกต้อง)
*Target: `POST/PUT /api/academic-settings` or `important-deadlines`*

- [ ] **TC-CFG-06: Invalid Date Range**
  - **Scenario:** ตั้งค่า `startDate` (หรือ `windowStartAt`) ให้ **มากกว่า** `endDate` (หรือ `windowEndAt`)
  - **Expected Result:** ระบบต้องปฏิเสธการบันทึก (`400 Bad Request`) และแจ้งเตือนว่าช่วงเวลาไม่ถูกต้อง

---

## หมวดที่ 4: การทดสอบแบบ Integration (Admin vs Student View)

### 1. E2E Scenario: Special Case Deadline Extension (การขยายเวลาส่งงานกรณีพิเศษ)
*Context: นักศึกษา (Student A) ส่งงานไม่ทัน (Status: Late/Overdue) และ Admin ต้องการขยายเวลาให้*

- [ ] **TC-E2E-01: Global Deadline Extension Impact**
  - **Setup:**
    1. สร้าง Deadline A ที่ `deadlineAt` เป็น "เมื่อวาน" (Past)
    2. Login เป็น Student A -> ตรวจสอบว่าเห็นสถานะ **'Overdue'** หรือ **'Late'**
  - **Action (Admin):**
    1. Login เป็น Admin
    2. แก้ไข Deadline A เปลี่ยน `deadlineAt` เป็น "พรุ่งนี้" (Future)
  - **Verify (Student View):**
    1. Login เป็น Student A อีกครั้ง (หรือ Refresh)
    2. **Expected:** สถานะเปลี่ยนกลับเป็น **'Pending'** หรือ **'Open'** และปุ่ม Submit กลับมาใช้งานได้ (ถ้าเคยถูก Lock)
  - **Verify (Side Effect):**
    1. Login เป็น Student B (คนอื่น)
    2. **Expected:** Student B ก็ควรเห็นว่า Deadline ขยายออกไปเช่นกัน (เนื่องจากเป็น Global Setting) *หมายเหตุ: หากระบบมีฟีเจอร์ Override รายบุคคล ให้ทดสอบแยก*

- [ ] **TC-E2E-02: Unlock Submission (Manual Status Reset)**
  - **Setup:** Student A ส่งงานแล้วแต่ผิด (Status: Submitted/Pending Review)
  - **Action (Admin/Teacher):**
    1. Admin/Teacher เข้าไปที่หน้าตรวจสอบเอกสาร
    2. กด **'Reject'** หรือ **'Request Changes'** (ส่งคืนแก้ไข)
  - **Verify (Student View):**
    1. Student A เห็นสถานะเอกสารเปลี่ยนเป็น **'Rejected'** หรือ **'Needs Revision'**
    2. ปุ่ม **'Re-submit'** หรือ **'Edit'** ปรากฏขึ้นเพื่อให้ส่งงานใหม่ได้


