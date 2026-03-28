# CSLogbook — Vocabulary & Terminology Guide

> ไฟล์นี้เป็น **single source of truth** สำหรับคำศัพท์ที่ใช้ใน CSLogbook
> Claude จะอ่านไฟล์นี้ก่อนสร้าง visual explainer, presentation, หรือเอกสารใดๆ
>
> **🔲 = ยังไม่แน่ใจ / รอยืนยัน** — กรุณาแก้ไขให้ถูกต้อง

---

## 1. ชื่อระบบ

| รหัสภายใน | ชื่อที่ใช้แสดง (TH) | ชื่อที่ใช้แสดง (EN) | หมายเหตุ |
|---|---|---|---|
| CSLogbook | CSLogbook | CSLogbook | ชื่อระบบ — ใช้ตามนี้เสมอ ไม่มีช่องว่าง |
| — | ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ | Computer Science Department | ชื่อเต็มของภาควิชา |

---

## 2. Roles (บทบาทผู้ใช้งาน)

| code | ชื่อที่ใช้แสดง (TH) | ชื่อที่ใช้แสดง (EN) | หมายเหตุ |
|---|---|---|---|
| `student` | นักศึกษา | Student | |
| `teacher` | อาจารย์ที่ปรึกษา | Advisor | เหมือนกับ Advisor — ใช้ "อาจารย์ที่ปรึกษา" เสมอ |
| `admin` | เจ้าหน้าที่ภาค | Staff / Admin | |

### Teacher Sub-permissions
| code | ความหมาย |
|---|---|
| `teacher:type` = `support` | เจ้าหน้าที่ภาควิชา |
| `teacher:type` = `academic` | อาจารย์ปกติ |
| `teacher:position:*` | ตำแหน่งพิเศษของอาจารย์ เช่น หัวหน้าภาควิชา |
| `teacher:topic_exam_access` | สิทธิ์เข้าถึงการสอบหัวข้อโครงงานพิเศษ |

---

## 3. Features / Modules หลัก

| code / key | ชื่อที่ใช้แสดง (TH) | ชื่อที่ใช้แสดง (EN) | หมายเหตุ |
|---|---|---|---|
| internship | ฝึกงาน | Internship | |
| project | โครงงานพิเศษ | Senior Project | 🔲 ใช้ "โครงงานพิเศษ" และ "ปริญญานิพนธ์" |
| logbook | สมุดบันทึกการฝึกงาน | Logbook | |
| meeting_log | บันทึกการประชุม | Meeting Log | |
| defense_request | คำขอสอบ | Defense Request | 🔲 "คำร้องขอสอบ" |
| system_test_request | คำขอทดสอบระบบ | System Test Request | เฉพาะ project track และปริญญานิพนธ์ที่ใช้ขอสอบปริญญานิพนธ์ |
| certificate_request | คำขอใบรับรอง | Certificate Request | ใบรับรองการฝึกงาน |
| approval_token | โทเค็นอนุมัติ | Approval Token | ใช้สำหรับ email-based approval |

---

## 4. เอกสาร (Documents)

| ชื่อ (TH) | ชื่อ (EN) | หมายเหตุ |
|---|---|---|
| 🔲 แบบฟอร์ม คพ.(1-5) | CP Form | เอกสาร CP ย่อมาจากอะไร คพ. คำร้องขอสอบ |
| ใบส่งตัว | Referral Letter | เอกสารส่งตัวนักศึกษาไปฝึกงาน |
| 🔲 ใบตอบรับ | Acceptance Letter | 🔲 ใบตอบรับการฝึกงานจากสถานประกอบการ |
| ปริญญานิพนธ์ | Thesis | เอกสารสำหรับ project track |
| หัวข้อโครงงาน | Project Topic | 🔲 "หัวข้อโครงงานพิเศษ" |

---

## 5. Workflow Status Labels

> คำแปลเหล่านี้มาจาก `workflowStates.ts` — แก้ไขหากต้องการใช้คำอื่น

### สถานะทั่วไป (ใช้ร่วมกันหลาย module)

| status (EN) | คำแปล (TH) | หมายเหตุ |
|---|---|---|
| Draft | ร่าง | |
| Pending | รอดำเนินการ | |
| Approved | อนุมัติแล้ว | |
| Rejected | ไม่อนุมัติ | |
| Cancelled | ยกเลิก | |
| Completed | เสร็จสิ้น | |
| Archived | เก็บถาวร | |
| In Progress | กำลังดำเนินการ | |

### สถานะ Internship Document

| status | คำแปล (TH) | หมายเหตุ |
|---|---|---|
| supervisor_evaluated | หัวหน้าภาคตรวจแล้ว | 🔲 "supervisor" หัวหน้าภาค |
| acceptance_approved | อนุมัติหนังสือตอบรับเข้าฝึกงานจากสถานประกอบการ | 🔲 อนุมัติหนังสือตอบรับเข้าฝึกงานจากสถานประกอบการ |
| referral_ready | พร้อมส่งต่อ | |
| referral_downloaded | ดาวน์โหลดแล้ว | |

### สถานะ Project Workflow Phase

| status | คำแปล (TH) | หมายเหตุ |
|---|---|---|
| PENDING_ADVISOR | รอที่ปรึกษา | |
| ADVISOR_ASSIGNED | มีที่ปรึกษาแล้ว | |
| TOPIC_SUBMISSION | ยื่นหัวข้อ | |
| TOPIC_EXAM_PENDING | รอสอบหัวข้อ | |
| TOPIC_FAILED | สอบหัวข้อไม่ผ่าน | |
| THESIS_SUBMISSION | ยื่นปริญญานิพนธ์ | 🔲 ใช้ "ยื่น" |
| THESIS_EXAM_PENDING | รอสอบปริญญานิพนธ์ | |
| THESIS_EXAM_SCHEDULED | นัดสอบปริญญานิพนธ์แล้ว | |
| THESIS_FAILED | สอบปริญญานิพนธ์ไม่ผ่าน | |

### สถานะ Defense Request

| status | คำแปล (TH) | หมายเหตุ |
|---|---|---|
| advisor_in_review | รออาจารย์อนุมัติครบ | 🔲 "อนุมัติครบ" คือต้องอนุมัติกี่คน? ถ้ามีอาจารย์ที่ปรึกษา 2 คนต้องอนุมัติทั้ง2คน |
| advisor_approved | อาจารย์อนุมัติ | |
| staff_verified | เจ้าหน้าที่ตรวจแล้ว | |
| scheduled | นัดสอบแล้ว | |

### สถานะ System Test Request

| status | คำแปล (TH) | หมายเหตุ |
|---|---|---|
| pending_advisor | รออาจารย์อนุมัติ | |
| advisor_rejected | อาจารย์ส่งกลับ | 🔲 "ส่งกลับ" |
| pending_staff | รอเจ้าหน้าที่ตรวจสอบ | |
| staff_rejected | เจ้าหน้าที่ส่งกลับ | |
| staff_approved | อนุมัติ (รอหลักฐาน) | |
| evidence_submitted | ส่งหลักฐานแล้ว | |

---

## 6. คำศัพท์ทั่วไปในระบบ

| คำในระบบ (EN) | คำแปล (TH) | หมายเหตุ |
|---|---|---|
| Logbook Entry | รายการบันทึก | หนึ่ง entry ใน logbook รายวัน |
| Working Hours | ชั่วโมงทำงาน | |
| Approved Hours | ชั่วโมงที่ได้รับการอนุมัติ | |
| Academic Year | ปีการศึกษา | ใช้ปีพุทธศักราช (พ.ศ.) |
| Curriculum | หลักสูตร | |
| Credits | หน่วยกิต | |
| Eligibility | คุณสมบัติ / สิทธิ์ลงทะเบียน | ใช้ทั้ง2คำ|
| Advisor | อาจารย์ที่ปรึกษา | เหมือนกับ `teacher` — ใช้คำนี้ในหน้า UI |
| Supervisor | หัวหน้าภาค | ใช้ใน context internship |
| Head of Department | หัวหน้าภาควิชา | ใช้ใน PDF templates |
| Defense | การสอบ | การสอบปกป้องโครงงาน |
| Exam Committee | คณะกรรมการสอบ | |
| Score Bucket | ระดับคะแนน | มาจาก `scoring.js` |
| Pass Score | คะแนนขั้นผ่าน | มาจาก `scoring.js` |

---

## 7. คำที่ควรหลีกเลี่ยง (Do Not Use)

| อย่าใช้ | ใช้แทนด้วย | เหตุผล |
|---|---|---|
| 🔲 | 🔲 | กรุณาเพิ่มคำที่ไม่ควรใช้ |

---

## 8. หมายเหตุการใช้งาน

- ภาษาที่ใช้ใน **UI / ข้อความผู้ใช้**: ภาษาไทย
- ภาษาที่ใช้ใน **code / commits / API**: ภาษาอังกฤษ
- วันที่ในระบบใช้ **พ.ศ.** (Buddha)