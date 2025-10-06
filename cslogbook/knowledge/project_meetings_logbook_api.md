# Project Meetings & Logbook API (Draft)

> เอกสารภายใน – ใช้อ้างอิงร่วมกับ [`project_capstone_system.md`](./project_capstone_system.md) และ [`project_management_phase2.md`](./project_management_phase2.md)
> เวอร์ชัน 0.1 – 28 ก.ย. 2025

เอกสารฉบับนี้สรุปสถาปัตยกรรมและสัญญาการสื่อสาร (API Contract) สำหรับชุดฟีเจอร์ “การพบอาจารย์ / Logbook หลังสอบหัวข้อ” ซึ่งพัฒนาต่อจาก Phase 2 ของระบบโครงงานพิเศษ เพื่อรองรับข้อกำหนดด้านการติดตามความคืบหน้าและการอนุมัติบันทึกการพบ (เช่น กรณีต้องมีการพบอย่างน้อย 4 ครั้งพร้อมการอนุมัติจากอาจารย์ทุกครั้ง)

---

## 1. วัตถุประสงค์และบริบท
- เชื่อมต่อจุดหมายในสเปกหลัก (`project_capstone_system.md` Section 1.1 และ 4) ที่ต้องการ workflow ติดตามหลังสอบหัวข้อ และข้อกำหนด “พบอาจารย์ ≥ 4 ครั้ง + อนุมัติทุกครั้ง”
- ต่อขยายสถาปัตยกรรม Phase 2 (`project_management_phase2.md`) ที่มี `ProjectDocument` เป็นแกนกลาง ให้สามารถกำกับกิจกรรมการพบและบันทึก log ได้ครบถ้วน
- เตรียมข้อมูลสำหรับรายงาน/แดชบอร์ด และให้ระบบตรวจสอบเงื่อนไขก่อนเปิดขั้นตอนถัดไป (เช่น ขอสอบโครงงานพิเศษ 1)

## 2. การเปลี่ยนแปลงโครงสร้างข้อมูล
### 2.1 ตารางที่เกี่ยวข้อง (Sequelize Models)
| Model | จุดใช้งาน | คำอธิบาย |
|-------|-----------|-----------|
| `Meeting` | เชื่อมกับ `ProjectDocument` ผ่าน `project_id` | ใช้เก็บ metadata ของการพบ (วัน เวลา รูปแบบ สถานะ) |
| `MeetingParticipant` | Mapping `meeting_id` ↔ `user_id` | ระบุบทบาท (`advisor`, `co_advisor`, `student`, `guest`) และสถานะการเข้าร่วม |
| `MeetingLog` | บันทึกการสนทนา / ความคืบหน้า | เพิ่มฟิลด์ใหม่ `approval_status`, `approved_by`, `approved_at`, `approval_note` เพื่อรองรับการอนุมัติ |
| `MeetingAttachment` | แนบไฟล์ประกอบบันทึก | Reuse จากเดิม |
| `MeetingActionItem` | งานติดตามหลังการพบ | เก็บ `due_date`, `status` ฯลฯ |

### 2.2 Migration ใหม่
ไฟล์: `backend/migrations/20250928090000-add-meeting-log-approvals.js`
- เพิ่มคอลัมน์ `approval_status (ENUM: pending/approved/rejected)`, `approved_by`, `approved_at`, `approval_note`
- เพิ่มดัชนี `idx_meeting_log_approval_status` และ `idx_meeting_log_approved_by`

### 2.3 การปรับ Model
- `MeetingLog` ผูก `belongsTo` กับ `User` ในชื่อ `approver`
- `MeetingLog` เพิ่ม `hasMany` → `MeetingActionItem`
- ค่าเริ่มต้นของ `approval_status` คือ `pending`

## 3. สรุป Endpoint (Backend)
Mount ภายใต้ `/api/projects` (ซิงก์กับ Phase 2)

| Method | Path | บทบาทที่อนุญาต | คำอธิบาย |
|--------|------|-----------------|-----------|
| GET | `/api/projects/:projectId/meetings` | Student (สมาชิก), Teacher (advisor/co), Admin | ดึงรายการ meetings พร้อม logs + สรุปจำนวนการอนุมัติ |
| POST | `/api/projects/:projectId/meetings` | Student (สมาชิก), Teacher, Admin | สร้าง meeting พร้อมตั้งผู้เข้าร่วมอัตโนมัติ |
| POST | `/api/projects/:projectId/meetings/:meetingId/logs` | ผู้เข้าร่วม meeting / Admin | เพิ่มบันทึกการพบ (log) |
| PATCH | `/api/projects/:projectId/meetings/:meetingId/logs/:logId/approval` | Advisor/Co-advisor/Admin | อัปเดตสถานะการอนุมัติของ log |
| POST | `/api/projects/:projectId/meetings/request-approval` | Student (สมาชิก), Advisor/Co-advisor, Admin | ส่งคำขออนุมัติ log ที่ยัง pending ผ่านอีเมล (เลือกช่วงข้อมูลได้) |

> หมายเหตุ: ทุก endpoint ผ่าน middleware `authenticateToken` และใช้ service-layer ตรวจสิทธิ์ซ้ำ (`ensureProjectAccess`, `ensureMeetingAccess`).

## 4. รายละเอียด Endpoint
### 4.1 GET `/projects/:id/meetings`
- **สิทธิ์**: สมาชิกทีม, อาจารย์ที่ปรึกษา/ร่วมที่ถูกผูกใน `ProjectDocument`, admin
- **Response**
```json
{
  "success": true,
  "data": [
    {
      "meetingId": 12,
      "meetingTitle": "Consult after proposal",
      "meetingDate": "2025-09-20T13:00:00+07:00",
      "meetingMethod": "hybrid",
      "participants": [
        { "userId": 101, "role": "advisor", "attendanceStatus": "present", "user": { "fullName": "รศ.ดร.ก" } },
        { "userId": 205, "role": "student", "attendanceStatus": "present", "user": { "fullName": "สมชาย ใจดี" } }
      ],
      "logs": [
        {
          "logId": 45,
          "discussionTopic": "สรุป requirement ชุดแรก",
          "approvalStatus": "approved",
          "approvedBy": 101,
          "approvedAt": "2025-09-21T09:15:00+07:00",
          "approver": { "userId": 101, "fullName": "รศ.ดร.ก" },
          "actionItems": [
            { "itemId": 7, "actionDescription": "เตรียม ER diagram", "dueDate": "2025-09-27", "status": "in_progress" }
          ]
        }
      ]
    }
  ],
  "stats": {
    "totalMeetings": 3,
    "totalLogs": 5,
    "approvedLogs": 4,
    "pendingLogs": 1,
    "approvalsByStudent": [
      {
        "studentId": 3001,
        "studentCode": "6404xxxxxx",
        "totalLogs": 4,
        "approvedLogs": 4,
        "fullName": "สมชาย ใจดี"
      }
    ]
  }
}
```
- **สรุปสถิติ** คำนวณโดย `meetingSummaryHelper.buildSummary` (ดู Section 5)

### 4.2 POST `/projects/:id/meetings`
- **Input หลัก**
```json
{
  "meetingTitle": "Post-proposal check-in",
  "meetingDate": "2025-10-01T10:00:00+07:00",
  "meetingMethod": "online",
  "meetingLocation": null,
  "meetingLink": "https://team.zoom.us/...",
  "status": "scheduled",        // optional (default: scheduled)
  "additionalParticipantIds": [310] // guest / ผู้เชิญเพิ่ม
}
```
- **Validation**: จำเป็นต้องมี `meetingTitle`, `meetingDate` รูปแบบวันที่ถูกต้อง, `meetingMethod ∈ {onsite, online, hybrid}`
- **ผู้เข้าร่วมดึงอัตโนมัติ**: สมาชิกโครงงาน (จาก `ProjectMember`), advisor/co-advisor (จาก `ProjectDocument`), และผู้สร้าง

### 4.3 POST `/projects/:id/meetings/:meetingId/logs`
- **Input หลัก**
```json
{
  "discussionTopic": "ความคืบหน้าการพัฒนา",
  "currentProgress": "งาน backend เสร็จ 80%",
  "problemsIssues": "CI ล่ม",
  "nextActionItems": "แก้ไข pipeline และเตรียม demo",
  "advisorComment": null,
  "actionItems": [
    {
      "actionDescription": "แก้ pipeline",
      "assignedTo": 205,
      "dueDate": "2025-10-05",
      "status": "pending"
    }
  ]
}
```
- **Validation**: `discussionTopic`, `currentProgress`, `nextActionItems` ต้องไม่ว่าง; `actionItems` (ถ้ามี) ต้องระบุ `actionDescription` และ `dueDate`
- **สิทธิ์**: ต้องเป็นผู้เข้าร่วมประชุม (ตรวจจาก `MeetingParticipant`) หรือ admin
- **ค่าเริ่มต้น**: `approval_status = pending`

### 4.4 PATCH `/projects/:id/meetings/:meetingId/logs/:logId/approval`
- **สิทธิ์**: advisor/co-advisor (ตรวจจาก assignment ใน `ProjectDocument`) หรือ admin
- **Input**
```json
{
  "status": "approved",             // allowed: pending | approved | rejected
  "approvalNote": "ผ่านพร้อมหมายเหตุ",
  "advisorComment": "ให้แก้รายงานบทที่ 2"
}
```
- หาก `status = pending` → รีเซ็ต `approved_by` / `approved_at`
- หาก `status ∈ {approved, rejected}` → บันทึกผู้อนุมัติและเวลาปัจจุบัน

## 5. Business Rules สำคัญ
1. **การตรวจสิทธิ์เข้าถึง**: ใช้ service-layer ตรวจซ้ำ (นักศึกษาที่ไม่ใช่สมาชิก, อาจารย์ที่ไม่ถูกมอบหมายจะถูกปฏิเสธ)
2. **การบังคับนับครั้ง**: `buildSummary` จะนับ log ที่ `approval_status = approved` แยกตามผู้เข้าร่วม (role = student, attendance ≠ absent) เพื่อสนับสนุน requirement “อย่างน้อย 4 ครั้ง”
3. **Action Items**: ปัจจุบันบังคับให้มี `dueDate` เพื่อเตรียมต่อยอดการเตือนในอนาคต
4. **Advisor Comment**: ปรับแก้พร้อม approval เพื่อเก็บบันทึก feedback ในที่เดียว
5. **การรีเซ็ตอนุมัติ**: advisor สามารถเปลี่ยนกลับเป็น `pending` เพื่อให้แก้ไข log ก่อนอนุมัติอีกครั้ง

## 6. การประมวลผลสรุป (Summary Pipeline)
โมดูล `meetingSummaryHelper.buildSummary` ทำงานดังนี้:
1. สร้าง mapping จาก `ProjectMember` → userId/studentId/studentCode
2. วน meetings → เลือกผู้เข้าร่วม role=student ที่มา (`attendanceStatus !== 'absent'`)
3. นับจำนวน log ทั้งหมดและจำนวนที่อนุมัติของแต่ละนักศึกษา
4. คืนค่า `stats` ใน response (ดูตัวอย่าง Section 4.1)

## 7. การทดสอบ
- Unit Test ใหม่: `backend/tests/unit/meetingService.summary.unit.test.js`
  - เคส “อนุมัติครบ” และ “ไม่ถือว่านักศึกษาที่ขาดหรือไม่มีข้อมูล”
- ต้องเพิ่ม integration test ในอนาคตหลังมี mock ข้อมูล meeting/participants

## 8. ขั้นตอนการใช้งาน
1. รัน migration: `npx sequelize-cli db:migrate`
2. Deploy โค้ด backend branch `create/pdf-generate` (หรือ merge เข้า develop → master เมื่อพร้อม)
3. เตรียม seed ข้อมูล meeting/participants หากต้องการทดสอบแบบอัตโนมัติ (ยังไม่มีใน iteration นี้)

## 9. Roadmap ต่อไป
| ลำดับ | งาน | หมายเหตุ |
|-------|-----|-----------|
| 1 | สร้างหน้า UI ฝั่งนักศึกษา/อาจารย์ (React) สำหรับสร้าง meeting, บันทึก log และอนุมัติ | ยึดตาม `frontend_structure_guide.instructions.md` |
| 2 | เพิ่มการเตือนอัตโนมัติ/สรุป dashboard ให้ advisor / staff | ใช้ `stats.approvalsByStudent` เป็นข้อมูลตั้งต้น |
| 3 | Integration กับระบบแจ้งเตือน (email/push) เมื่อมี log รออนุมัติ | อ้างอิง flag `EMAIL_MEETING_ENABLED` สำหรับอีเมล และ `notification_settings` ในระบบ |
| 4 | เพิ่ม integration test ครบชุด (mock user/token) เพื่อลด regression | ยึดโครงสร้าง integration ที่มีอยู่ใน backend/tests |
| 5 | เชื่อม requirement “พบ 4 ครั้ง” เข้ากับ workflow Phase ถัดไป (เช่น เปิด KP02) | ตรวจพร้อมกับ readiness checklist ใน `projectDocumentService` หรือ service ใหม่ |

## 10. อ้างอิงภายใน
- Phase 2 Lifecycle: [`project_management_phase2.md`](./project_management_phase2.md)
- Capstone State Machine & Required Meetings: [`project_capstone_system.md`](./project_capstone_system.md)
- โค้ด backend: `backend/services/meetingService.js`, `backend/controllers/meetingController.js`, `backend/routes/projectRoutes.js`
- Migration: `backend/migrations/20250928090000-add-meeting-log-approvals.js`

---
> หมายเหตุ: เอกสารนี้เป็นร่างแรกสำหรับการ iterate ต่อ ให้บันทึกการเปลี่ยนแปลงทุกครั้งที่แก้ API / data structure และอัปเดตรายการทดสอบควบคู่กันเสมอ
