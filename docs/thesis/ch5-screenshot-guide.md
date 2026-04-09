# Ch5 Screenshot Guide — ใช้กับ Claude in Chrome

> **วิธีใช้:** เปิดแชทใหม่ → copy prompt ด้านล่างไปวาง → Claude จะ screenshot ตาม plan

---

## Demo Accounts (UAT seed data)

| Role | Username | Password | Track |
|------|----------|----------|-------|
| เจ้าหน้าที่ | uat_admin | password123 | — |
| อาจารย์ | uat_advisor | password123 | — |
| นักศึกษา (ฝึกงาน) | uat_intern | password123 | Internship |
| นักศึกษา (โครงงาน) | uat_proj | password123 | Special Project |
| นักศึกษา (ปริญญานิพนธ์) | uat_thesis | password123 | Thesis |

> **หมายเหตุ:** accounts เหล่านี้เป็น dev seed — ต้องตรวจว่า production มี accounts เหล่านี้หรือไม่ ถ้าไม่มีให้ใช้ accounts จริงที่มีข้อมูลอยู่แล้ว

---

## Screenshot Plan — 57 ภาพ แบ่ง 5 กลุ่ม

### กลุ่ม A: Login + Dashboard (ภาพ 5-1 ถึง 5-6) — ใช้ทุก role

| ภาพที่ | Caption | Role | URL/Path |
|--------|---------|------|----------|
| 5-1 | หน้าเข้าสู่ระบบ | — | /login |
| 5-2 | หน้าแรก นักศึกษา | student | /dashboard |
| 5-3 | หน้าแรก เจ้าหน้าที่ | admin | /dashboard |
| 5-4 | หน้าแรก อาจารย์ | teacher | /dashboard |
| 5-5 | แก้ไขข้อมูลหน่วยกิต | student | /settings หรือ profile |
| 5-6 | ปฏิทินกำหนดการ | student | /dashboard (calendar section) |

### กลุ่ม B: ฝึกงาน Internship (ภาพ 5-7 ถึง 5-29) — login: uat_intern

| ภาพที่ | Caption | หน้า |
|--------|---------|------|
| 5-7 | สถานประกอบการฝึกงาน | /internship/companies |
| 5-8 | คพ.05 ส่วนข้อมูลสถานประกอบการ | /internship/request (step 1) |
| 5-9 | คพ.05 ส่วนข้อมูลนักศึกษา | /internship/request (step 2) |
| 5-10 | คพ.05 ส่วนกำหนดช่วงเวลา | /internship/request (step 3) |
| 5-11 | คพ.05 ส่วนอัปโหลด Transcript | /internship/request (step 4) |
| 5-12 | ขั้นตอนการดำเนินเอกสารฝึกงาน | /internship (stepper/overview) |
| 5-13 | ข้อมูลสถานประกอบการ | /internship/company-info |
| 5-14 | คำชี้แจงการบันทึกการฝึกงาน | /internship/logbook (instructions) |
| 5-15 | บันทึกการฝึกงาน (list) | /internship/logbook |
| 5-16 | แบบฟอร์มบันทึกฝึกงานประจำวัน | /internship/logbook (form modal) |
| 5-17 | ส่งคำขออนุมัติผ่านอีเมล ส่วน 1 | /internship/timesheet-approval |
| 5-18 | ส่งคำขออนุมัติผ่านอีเมล ส่วน 2 | (scroll down) |
| 5-19 | อนุมัติผ่านเมล์ผู้ควบคุมงาน | /approval/... (token-based page) |
| 5-20 | ส่งการประเมินผ่านอีเมล | /internship/evaluation |
| 5-21 | แบบประเมิน ข้อ 1-3 | /evaluate/... (token page) |
| 5-22 | แบบประเมิน ข้อ 4-5 + สรุปคะแนน | (scroll down) |
| 5-23 | หลังประเมินเสร็จสิ้น | (success page) |
| 5-24 | ก่อนส่งคำขอหนังสือรับรอง | /internship/certificate (pre) |
| 5-25 | หลังส่งคำขอหนังสือรับรอง | (post-submit state) |
| 5-26 | **admin**: อนุมัติรายละเอียดการประเมิน | /admin/internship/evaluations |
| 5-27 | **admin**: ส่วนการอนุมัติ (detail) | (drawer/modal) |
| 5-28 | ดาวน์โหลดหนังสือรับรอง | /internship/certificate (ready) |
| 5-29 | เอกสารรับรองการฝึกงาน (PDF preview) | (PDF viewer) |

### กลุ่ม C: โครงงานพิเศษ Special Project (ภาพ 5-30 ถึง 5-47) — login: uat_proj

| ภาพที่ | Caption | หน้า |
|--------|---------|------|
| 5-30 | หน้าโครงงานพิเศษหลัก | /project |
| 5-31 | เสนอหัวข้อ — ข้อมูลพื้นฐาน | /project/topic (step 1) |
| 5-32 | เสนอหัวข้อ — หมวด + อาจารย์ | (step 2) |
| 5-33 | เสนอหัวข้อ — เพิ่มสมาชิก | (step 3) |
| 5-34 | เสนอหัวข้อ — รายละเอียด | (step 4) |
| 5-35 | เสนอหัวข้อ — สรุป | (step 5) |
| 5-36 | **admin**: จัดการเอกสาร | /admin/documents |
| 5-37 | **admin (หัวหน้า)**: จัดการเอกสาร | (same page, different role view) |
| 5-38 | **admin**: อนุมัติผลสอบหัวข้อ | /admin/project/topic-results |
| 5-39 | **admin**: เลือกอาจารย์ที่ปรึกษา | (assign advisor modal) |
| 5-40 | บันทึกการพบอาจารย์ | /project/meetings |
| 5-41 | รายละเอียดการเข้าพบ | (meeting detail) |
| 5-42 | **teacher**: อนุมัติการเข้าพบ | /teacher/meetings (approval) |
| 5-43 | คำขอสอบโครงงานพิเศษ 1 (คพ.02) | /project/defense-request |
| 5-44 | **teacher**: อนุมัติคพ.02 (view) | /teacher/defense-requests |
| 5-45 | **teacher**: อนุมัติคพ.02 (approved) | (after approve) |
| 5-46 | **admin**: อนุมัติคำร้องคพ.02 | /admin/defense-requests |
| 5-47 | **admin**: บันทึกผลสอบโครงงาน 1 | /admin/exam-results |

### กลุ่ม D: ปริญญานิพนธ์ Thesis (ภาพ 5-48 ถึง 5-57) — login: uat_thesis

| ภาพที่ | Caption | หน้า |
|--------|---------|------|
| 5-48 | คำขอทดสอบระบบ + หลักฐาน | /project/system-test |
| 5-49 | **teacher**: อนุมัติคำขอทดสอบระบบ | /teacher/system-test |
| 5-50 | **admin**: ตรวจสอบคำขอทดสอบระบบ | /admin/system-test |
| 5-51 | คำขอสอบโครงงานพิเศษ 2 (คพ.03) | /project/thesis-defense |
| 5-52 | รอคำขอสอบ คพ.03 | (pending state) |
| 5-53 | **teacher**: อนุมัติคำขอ คพ.03 | /teacher/thesis-defense |
| 5-54 | **admin**: อนุมัติคพ.03 | /admin/thesis-defense |
| 5-55 | **admin**: บันทึกผลสอบ + สถานะเล่ม | /admin/thesis-results |
| 5-56 | **admin**: อนุมัติบันทึกผลสอบ | (detail) |
| 5-57 | **admin**: อัปเดตสถานะเล่ม | (book status update) |

---

## Prompt สำหรับแชทใหม่ (Copy ทั้ง block)

```
ช่วย screenshot หน้าเว็บ cslogbook.me สำหรับใส่ในเล่มปริญญานิพนธ์ บทที่ 5

ข้อมูลเข้าสู่ระบบ:
- URL: https://cslogbook.me
- เจ้าหน้าที่: uat_admin / password123
- อาจารย์: uat_advisor / password123
- นักศึกษา ฝึกงาน: uat_intern / password123
- นักศึกษา โครงงาน: uat_proj / password123
- นักศึกษา ปริญญานิพนธ์: uat_thesis / password123

⚠️ ถ้า uat accounts ใช้ไม่ได้ แจ้งมาเพื่อเปลี่ยน account

ขั้นตอน:
1. เปิด cslogbook.me → screenshot หน้า login (ภาพ 5-1)
2. Login เป็น student (uat_intern) → screenshot dashboard + แต่ละหน้าตาม flow ฝึกงาน
3. Login เป็น admin → screenshot หน้า admin ที่เกี่ยวข้อง
4. Login เป็น teacher → screenshot หน้า approval
5. Login เป็น uat_proj → screenshot flow โครงงานพิเศษ
6. Login เป็น uat_thesis → screenshot flow ปริญญานิพนธ์

บันทึกแต่ละภาพเป็นไฟล์ PNG ตั้งชื่อ: fig-5-01.png, fig-5-02.png, ... fig-5-57.png
save ไว้ที่ outputs folder

รายละเอียดแต่ละภาพอยู่ในไฟล์:
docs/thesis/ch5-screenshot-guide.md (ในโฟลเดอร์ CSLog)

ก่อน screenshot ทุกหน้า resize browser เป็น 1920x1080
```

---

## หมายเหตุสำคัญ

1. **ตรวจก่อนว่า UAT accounts มีบน production หรือไม่** — ถ้าไม่มี ต้องใช้ accounts จริง
2. **บางหน้าต้อง scroll** — เช่น form ยาว (คพ.05 step 1-4), แบบประเมิน ข้อ 1-5
3. **Token-based pages** (5-19, 5-21, 5-22) — ต้องมี link จริงจาก email หรือ copy token จาก DB
4. **PDF preview** (5-29) — อาจต้อง capture หลัง download หรือ preview ใน browser
5. **State-dependent pages** — บางภาพต้อง data อยู่ใน state เฉพาะ (เช่น "รอตรวจสอบ", "อนุมัติแล้ว") — ต้อง seed ข้อมูลให้ครบ
