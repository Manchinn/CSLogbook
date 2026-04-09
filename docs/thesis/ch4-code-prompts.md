# Prompts สำหรับ Claude Code — ดึง Logic สำคัญ บทที่ 4

> **วิธีใช้:** copy prompt แต่ละข้อไปวางใน Claude Code (terminal) ทีละอัน
> Claude Code จะอ่านไฟล์จริงแล้วสรุป logic ให้ในรูปแบบที่ใส่ในเล่มปริญญานิพนธ์ได้เลย
>
> **Output ที่ได้:** pseudocode + อธิบายภาษาไทย พร้อมใส่เล่มแทนตาราง source code เดิม

---

## Source Code Mapping (อ้างอิง)

| ตารางเดิม | ฟังก์ชัน | ไฟล์ | บรรทัด |
|-----------|---------|------|--------|
| 4-1 | processStudentCsvUpload | backend/services/studentUploadService.js | 304-543 |
| 4-5a | checkInternshipEligibility | backend/models/Student.js | 57-174 |
| 4-5b | checkProjectEligibility | backend/models/Student.js | 176-298 |
| 4-6 | submitCS05 | backend/services/internship/document.service.js | 101-192 |
| 4-9 | createCertificatePDF | backend/services/internship/certificate.service.js | 387-484 |
| 4-12 | createMeeting | backend/services/meeting/meetingCoreService.js | 137-256 |
| 4-14 | createMeetingLog (approval) | backend/services/meeting/meetingLogService.js | 14-103 |
| 4-15 | submitProject1Request | backend/services/projectDefenseRequestService.js | 465-594 |
| 4-18 | submitAdvisorDecision | backend/services/projectDefenseRequestService.js | 1043-1158 |
| 4-25 | submitThesisRequest | backend/services/projectDefenseRequestService.js | 596-755 |
| 4-27 | verifyDefenseRequest | backend/services/projectDefenseRequestService.js | 864-915 |

---

## Prompt 1 — ตรวจสอบข้อมูลนำเข้านักศึกษา (ตาราง 4-1)

```
อ่านไฟล์ cslogbook/backend/services/studentUploadService.js บรรทัด 304-543 (ฟังก์ชัน processStudentCsvUpload)

สรุปเป็น:
1. Pseudocode ภาษาอังกฤษ (ไม่เกิน 30 บรรทัด) แสดง logic หลัก: validation → parsing → create/update → result
2. อธิบายภาษาไทย 3-5 บรรทัด ว่า business logic สำคัญคืออะไร
3. ระบุ edge cases ที่ handle (เช่น duplicate, invalid format, missing field)

Format output เหมือนตารางในเล่มปริญญานิพนธ์ — ใช้ใส่แทนตาราง source code เดิมได้เลย
```

## Prompt 2 — ตรวจสอบสิทธิ์การฝึกงาน/โครงงาน (ตาราง 4-5)

```
อ่านไฟล์ cslogbook/backend/models/Student.js บรรทัด 57-298 (ฟังก์ชัน checkInternshipEligibility + checkProjectEligibility)

สรุปเป็น:
1. Pseudocode แสดง decision logic: ตรวจ year level → credits → major credits → eligible?
2. อธิบายภาษาไทย: เงื่อนไข unlock แต่ละ track (internship vs project) ต่างกันยังไง
3. แสดงตัวอย่าง scenario: "นักศึกษาชั้นปี 3 มี 75 หน่วยกิต → ผลลัพธ์?"

Output สำหรับใส่เล่มปริญญานิพนธ์ บทที่ 4 แทนตาราง source code
```

## Prompt 3 — ลงทะเบียนคำร้องขอฝึกงาน คพ.05 (ตาราง 4-6)

```
อ่านไฟล์ cslogbook/backend/services/internship/document.service.js บรรทัด 101-260 (ฟังก์ชัน submitCS05 + submitCS05WithTranscript)

สรุปเป็น:
1. Flowchart-style pseudocode: validate → check existing → create Document → create InternshipDocument → update status → notify
2. อธิบายภาษาไทย: workflow ทั้งหมดตั้งแต่นักศึกษากดยื่น จนถึงสร้าง record สำเร็จ
3. ระบุ state transitions: student status เปลี่ยนจาก X → Y เมื่อไหร่

Output สำหรับใส่เล่มปริญญานิพนธ์
```

## Prompt 4 — สร้างเอกสาร PDF หนังสือรับรอง (ตาราง 4-9)

```
อ่านไฟล์ cslogbook/backend/services/internship/certificate.service.js (ฟังก์ชัน createCertificatePDF และฟังก์ชัน helper ที่เกี่ยวข้อง)

สรุปเป็น:
1. Pseudocode แสดง logic: load data → setup PDF → register Thai font → layout sections → output buffer
2. อธิบายภาษาไทย: เอกสารมีส่วนประกอบอะไรบ้าง (หัวเอกสาร, เนื้อหา, ลายเซ็น)
3. ระบุ technical challenges ที่แก้ไข: Thai font rendering, date formatting, layout positioning

นี่เป็น unique feature ของระบบ — อธิบายละเอียดหน่อย
```

## Prompt 5 — สร้างการนัดพบอาจารย์ (ตาราง 4-12)

```
อ่านไฟล์ cslogbook/backend/services/meeting/meetingCoreService.js บรรทัด 137-256 (ฟังก์ชัน createMeeting)

สรุปเป็น:
1. Pseudocode: validate → create meeting → add participants → notify → return
2. อธิบายภาษาไทย: logic ที่แตกต่างระหว่าง phase1 (โครงงานพิเศษ 1) กับ phase2 (ปริญญานิพนธ์)
3. แสดง data model ที่เกี่ยวข้อง (Meeting, MeetingParticipant)

Output สำหรับใส่เล่มปริญญานิพนธ์
```

## Prompt 6 — อนุมัติ/ปฏิเสธบันทึกการพบ (ตาราง 4-14)

```
อ่านไฟล์ cslogbook/backend/services/meeting/meetingLogService.js (ดูทั้งไฟล์ — หา function ที่เกี่ยวกับ approval/rejection ของ meeting log)

สรุปเป็น:
1. Pseudocode แสดง approval workflow: advisor review → approve/reject → update status → notify student
2. อธิบายภาษาไทย: pattern นี้ใช้ซ้ำที่ไหนบ้างในระบบ (approval pattern)
3. แสดง state diagram: pending → approved / rejected

Output สำหรับใส่เล่มปริญญานิพนธ์
```

## Prompt 7 — ยื่นคำขอสอบโครงงานพิเศษ 1 (ตาราง 4-15)

```
อ่านไฟล์ cslogbook/backend/services/projectDefenseRequestService.js บรรทัด 465-594 (ฟังก์ชัน submitProject1Request)

สรุปเป็น:
1. Pseudocode แสดง multi-layer validation: check member status → check project status → check meeting logs ≥ 4 → create request → assign advisor approvals → update workflow
2. อธิบายภาษาไทย: prerequisite checks ทั้งหมดก่อนยื่นสอบได้
3. แสดง approval chain: student submit → advisor_in_review → advisor_approved → staff_verified → scheduled

นี่เป็น core workflow ของระบบ — อธิบายละเอียด
```

## Prompt 8 — การตัดสินใจของอาจารย์ (ตาราง 4-18)

```
อ่านไฟล์ cslogbook/backend/services/projectDefenseRequestService.js บรรทัด 1043-1158 (ฟังก์ชัน submitAdvisorDecision)

สรุปเป็น:
1. Pseudocode: validate decision → update approval record → aggregate all advisors → check if all approved → transition status → send notifications
2. อธิบายภาษาไทย: logic การ aggregate ถ้ามีอาจารย์ที่ปรึกษาหลายคน (main + co-advisor)
3. ระบุ rejection flow: เมื่อ reject เกิดอะไรขึ้น (notify student + reason required)

Output สำหรับใส่เล่มปริญญานิพนธ์
```

## Prompt 9 — ยื่นคำขอสอบปริญญานิพนธ์ (ตาราง 4-25)

```
อ่านไฟล์ cslogbook/backend/services/projectDefenseRequestService.js บรรทัด 596-755 (ฟังก์ชัน submitThesisRequest)

สรุปเป็น:
1. Pseudocode แสดง prerequisite chain: Project1 passed? → 4 meeting logs? → system test completed (30 days)? → evidence uploaded? → create request
2. เปรียบเทียบกับ submitProject1Request (Prompt 7): อะไรเพิ่มขึ้นมา
3. อธิบายภาษาไทย: ทำไม flow นี้ซับซ้อนที่สุดในระบบ

นี่เป็นฟังก์ชันที่ซับซ้อนที่สุด — อธิบายให้ครบทุก prerequisite
```

## Prompt 10 — เจ้าหน้าที่ตรวจสอบและอนุมัติ (ตาราง 4-27)

```
อ่านไฟล์ cslogbook/backend/services/projectDefenseRequestService.js บรรทัด 864-915 (ฟังก์ชัน verifyDefenseRequest)

สรุปเป็น:
1. Pseudocode: validate request → update status to staff_verified → update workflow → trigger sync
2. อธิบายภาษาไทย: ขั้นตอนสุดท้ายของ approval chain ก่อนนัดสอบ
3. แสดง complete approval chain diagram ตั้งแต่ student submit จนถึง scheduled

Output สำหรับใส่เล่มปริญญานิพนธ์
```

---

## Prompt พิเศษ — สรุปภาพรวม Approval Pattern

```
อ่านไฟล์ cslogbook/backend/services/projectDefenseRequestService.js ทั้งหมด

สรุป design pattern "Approval Chain" ที่ใช้ซ้ำในระบบ:
1. วาด state diagram รวม: pending → advisor_in_review → advisor_approved → staff_verified → scheduled (+ rejection branches)
2. อธิบายว่า pattern นี้ apply กับ use case ไหนบ้าง (Project1, SystemTest, Thesis)
3. แสดงเป็น Mermaid diagram

สำหรับใส่เล่มปริญญานิพนธ์ บทที่ 4 ส่วน "สรุปรูปแบบการทำงานของระบบ"
```

---

## Tips การใช้

1. **รัน prompt ทีละอัน** — Claude Code จะอ่านไฟล์จริงและสรุปให้
2. **Copy output ไป Google Docs** — แทนที่ตาราง source code เดิม
3. **ปรับ format** — อาจต้องจัด font/indent ให้เข้ากับเล่ม
4. **Pseudocode ดีกว่า source code** — กรรมการอ่านง่ายกว่า ไม่ต้อง copy โค้ดจริงทั้งหมด
5. **เพิ่มย่อหน้าสรุป** หลังตาราง 10 ตัว:

> *"นอกจากฟังก์ชันหลักที่แสดงข้างต้น ระบบยังประกอบด้วยฟังก์ชันสนับสนุน ได้แก่ การตั้งค่าหลักสูตรและปีการศึกษา การบันทึกรายละเอียดการฝึกงานรายวัน การดึงข้อมูลคำขอ การอัปโหลดหลักฐาน ซึ่งใช้ design pattern เดียวกันกับฟังก์ชันหลักที่นำเสนอ"*
