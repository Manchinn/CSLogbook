# Demo Ordering Prompts — Template สำหรับใช้กับ AI

> Prompt templates สำหรับให้ AI ช่วยจัดลำดับ demo scenarios
> ใช้ได้กับทุกโปรเจค — ปรับ context ตามระบบของตัวเอง

---

## Prompt 1: จัดลำดับ Demo จาก System Flows

```
ฉันกำลังเตรียม demo ระบบ [ชื่อระบบ] สำหรับ [กรรมการสอบ/ลูกค้า/ทีม]
ระบบมี [จำนวน] tracks/modules หลัก:

1. [ชื่อ module 1] — [คำอธิบายสั้น]
2. [ชื่อ module 2] — [คำอธิบายสั้น]
3. [ชื่อ module 3] — [คำอธิบายสั้น]

ผู้ใช้งานมี [จำนวน] roles:
- [Role 1]: [ทำอะไรได้]
- [Role 2]: [ทำอะไรได้]
- [Role 3]: [ทำอะไรได้]

มีเวลา demo [จำนวน] นาที

ช่วยจัดลำดับ demo ให้:
1. เรียงจาก flow ที่เข้าใจง่ายไปซับซ้อน
2. ลด login สลับ account ให้น้อยที่สุด (จัดกลุ่มตาม role)
3. แต่ละ step ระบุ: role ที่ login, หน้าที่เปิด, จุดที่ต้องพูด
4. มี highlight สำหรับฟีเจอร์เด่นที่กรรมการจะสนใจ
5. เผื่อ fallback ถ้า demo ไม่ทัน — ระบุว่า step ไหน skip ได้
```

---

## Prompt 2: จัด Demo Data ให้ตรงกับลำดับ

```
ฉันมี demo flow ตามลำดับนี้:

[วาง demo flow ที่จัดแล้ว]

ระบบใช้ [DB type] มี [จำนวน] models หลัก
มี UAT accounts:
- [account 1]: [role], [สถานะปัจจุบัน]
- [account 2]: [role], [สถานะปัจจุบัน]

ช่วยตรวจสอบว่า:
1. ข้อมูลใน DB พร้อมสำหรับ demo แต่ละ step หรือไม่
2. Step ไหนต้อง seed data ก่อน demo
3. Step ไหนที่ demo แล้วจะเปลี่ยนสถานะ — กระทบ step ถัดไปไหม
4. ต้องเตรียม reset script สำหรับ step ไหนบ้าง (กรณี demo ซ้ำ)
5. สร้าง pre-demo checklist สำหรับเช็คก่อนขึ้น demo
```

---

## Prompt 3: เตรียม Rejection / Edge Case Demo

```
ระบบ [ชื่อระบบ] มี approval flow ดังนี้:

[วาง approval chain — ใคร submit → ใคร approve]

ช่วย list rejection cases ทั้งหมดที่เป็นไปได้:
1. แต่ละจุดที่สามารถถูก reject/deny — ระบุ role ที่ reject
2. Validation ที่จะ block การ submit (เช่น ข้อมูลไม่ครบ, สิทธิ์ไม่ถึง)
3. Boundary cases (เช่น ส่งซ้ำ, double approval, token expired)
4. สิ่งที่เกิดขึ้นหลัง reject (แจ้งเตือน, resubmit ได้ไหม, reset chain)

จัดเรียงตาม:
- จัดกลุ่มตาม module/track
- เรียงตาม flow จริง (ตามลำดับที่ user เจอ)
- ระบุว่า case ไหนควร demo ให้กรรมการดู (impact สูง, เข้าใจง่าย)
```

---

## Prompt 4: สร้าง Demo Script พร้อมคำพูด

```
ฉันจะ demo ระบบ [ชื่อระบบ] ให้ [กรรมการ/ลูกค้า]
ใช้เวลา [จำนวน] นาที

Demo flow:
[วาง flow]

ช่วยสร้าง demo script ที่มี:
1. คำพูดเปิดแต่ละ section (1-2 ประโยค ไม่เยิ่นเย้อ)
2. จุดที่ต้อง pause ให้กรรมการถาม
3. Transition phrases เชื่อมระหว่าง section
4. คำพูดเมื่อสลับ account ("ตอนนี้สลับมาเป็น role ... เพื่อ ...")
5. คำพูดปิดที่สรุป key takeaway

สไตล์: กระชับ เป็นธรรมชาติ ไม่เหมือนอ่าน script
ภาษา: ไทย (technical terms ใช้ English ได้)
```

---

## Prompt 5: วางแผน Demo สำหรับเวลาจำกัด

```
ฉันมี demo scenarios ทั้งหมด [จำนวน] steps ใช้เวลาเต็ม [จำนวน] นาที

[วาง full demo list + เวลาแต่ละ part]

ช่วยสร้าง 3 versions:
1. **Full demo** ([เวลาเต็ม] นาที) — ครบทุก step
2. **Highlight demo** ([ครึ่งหนึ่ง] นาที) — เฉพาะ step สำคัญ
3. **Quick demo** ([1/3] นาที) — เฉพาะ wow moments

เกณฑ์เลือก step:
- ฟีเจอร์ที่แสดง technical complexity (เช่น multi-role approval, PDF generation)
- ฟีเจอร์ที่ solve pain point ชัดเจน
- ฟีเจอร์ที่กรรมการน่าจะถามต่อ
```

---

## ตัวอย่างการใช้ — CSLogbook

```
ฉันกำลังเตรียม demo ระบบ CSLogbook สำหรับกรรมการสอบปริญญานิพนธ์
ระบบมี 3 tracks หลัก:

1. ฝึกงาน (Internship) — 13 ขั้นตอน: คพ.05 → หนังสือตอบรับ → Logbook → ประเมิน → ใบรับรอง
2. โครงงานพิเศษ 1 (Special Project) — 9 ขั้นตอน: เสนอหัวข้อ → สอบหัวข้อ → พบอาจารย์ → ยื่นสอบ คพ.02
3. ปริญญานิพนธ์ (Thesis) — 8 ขั้นตอน: พบอาจารย์ → ทดสอบระบบ → สอบ คพ.03 → ผลสอบ

ผู้ใช้งานมี 4 roles:
- นักศึกษา: ยื่นเอกสาร, บันทึก logbook, พบอาจารย์
- เจ้าหน้าที่: อนุมัติ, จัดการ, ออก PDF, export Excel
- อาจารย์ที่ปรึกษา: อนุมัติพบอาจารย์, อนุมัติคำขอสอบ
- ผู้ควบคุมงาน: อนุมัติ logbook + ประเมิน (ผ่าน email link ไม่ต้อง login)

มีเวลา demo 30 นาที

Rejection cases ที่ต้อง demo:
- ปฏิเสธ คพ.05 (เจ้าหน้าที่) → modal เหตุผล → ส่งใหม่
- ปฏิเสธ Logbook (ผู้ควบคุมงาน) → email link
- ปฏิเสธพบอาจารย์ (อาจารย์) → ส่งกลับ
- ปฏิเสธคำขอสอบ (อาจารย์/เจ้าหน้าที่) → reset chain
- Eligibility block (หน่วยกิตไม่ถึง)

ช่วยจัดลำดับ demo + demo script ให้
```
