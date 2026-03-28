# Issues จากการสาธิตระบบโครงงานพิเศษ — 26 มีนาคม 2026

> **ที่มา:** Meeting Notes การสาธิตระบบให้เจ้าหน้าที่ภาค
> **สถานะ:** รอแก้ไข — ใช้ไฟล์นี้เป็น task list สำหรับ Claude Code
> **Notion source:** https://www.notion.so/32f53200edeb80d39face382d449b662

---

## BUG-01 — ระบบแสดงข้อมูลปีการศึกษาเก่าปนกับปัจจุบัน

**Priority:** High
**Type:** Bug — Frontend + Backend

### อาการ
หน้า dashboard / ตารางรายชื่อโครงงาน แสดงข้อมูลจากปีการศึกษาเก่าปะปนกับปีปัจจุบัน ทำให้เจ้าหน้าที่ต้องกรองเองทุกครั้ง

### พฤติกรรมที่ต้องการ
- Default filter ควรแสดงเฉพาะปีการศึกษาปัจจุบัน (academic year ที่ active)
- ยังสามารถเลือกดูปีเก่าได้ผ่าน dropdown filter
- ปีที่ "active" ดึงจาก `academic_years` หรือ `curriculums` ที่มี `active = true`

### จุดที่ต้องตรวจสอบ
- Frontend: query default ของ TanStack Query ที่ใช้ดึงรายการโครงงาน (ไฟล์ใน `src/app/(app)/admin/` หรือ `src/app/(app)/project/`)
- Backend: endpoint GET `/api/projects` หรือ `/api/project-documents` — ตรวจสอบว่า filter `academic_year_id` เป็น optional หรือไม่
- ควรเพิ่ม default query param `academicYear=current` หรือกรองด้วย active academic year อัตโนมัติ

---

## BUG-02 — คำขอสอบที่ส่งล่าช้าไม่แสดงสถานะให้เจ้าหน้าที่เห็น

**Priority:** High
**Type:** Bug — Frontend (visibility)

### อาการ
เมื่อนักศึกษาส่ง defense request ล่าช้า (หลัง deadline) เจ้าหน้าที่ภาคไม่เห็นสถานะ "รออาจารย์อนุมัติ" ในหน้าจัดการคำขอสอบ ทำให้ไม่ทราบว่ามี request ค้างอยู่

### พฤติกรรมที่ต้องการ
- หน้าจัดการ defense request ของ admin ต้องแสดง **ทุก** request ที่มีสถานะ `advisor_in_review` โดยไม่ filter ตาม deadline
- อาจเพิ่ม badge/tag "ส่งล่าช้า" ให้ request ที่ส่งหลัง deadline เพื่อให้เจ้าหน้าที่ทราบ

### จุดที่ต้องตรวจสอบ
- Backend: `services/defenseRequestService.js` หรือ controller ที่ดึงรายการ defense requests สำหรับ admin
  - ตรวจสอบว่ามี WHERE clause ที่ filter วันที่ส่งหรือไม่
- Frontend: hook `useDefenseRequests` (หรือชื่อที่คล้ายกัน) ใน `src/hooks/`
  - ตรวจสอบ query params ที่ส่งไป
- เพิ่ม field computed `is_late` (boolean) ใน response หากยังไม่มี

---

## FEATURE-01 — เพิ่มฟิลด์อัปโหลดลิงก์ Google Drive สำหรับเอกสารขนาดใหญ่

**Priority:** Medium
**Type:** Feature Request — ยังไม่บังคับใช้

### Context
ปัจจุบันระบบรองรับไฟล์ ≤10 MB ต่อคน สำหรับไฟล์ขนาดใหญ่กว่านั้น นักศึกษาต้องใช้ Google Drive แต่ยังไม่มีฟิลด์ในระบบให้แปะลิงก์อย่างเป็นทางการ

### พฤติกรรมที่ต้องการ
- เพิ่ม optional field `drive_link` (text/URL) ในหน้าอัปโหลดหลักฐาน (evidence upload)
- validate ว่าเป็น URL ที่ถูกต้อง (ไม่บังคับต้องเป็น Google Drive)
- แสดงลิงก์ในหน้า review ของเจ้าหน้าที่

### จุดที่ต้องตรวจสอบ
- Model: `InternshipDocument` หรือ `ProjectDocument` — เพิ่ม column `drive_link VARCHAR(500) NULL`
- Backend: validator + controller สำหรับ upload endpoint
- Frontend: `src/app/(app)/internship/` หรือ `src/app/(app)/project/` — เพิ่ม input field

### Migration ที่ต้องสร้าง
```
npx sequelize-cli migration:create --name add-drive-link-to-documents
```

---

## UX-01 — ชี้แจงกระบวนการเกรด I / IP ให้นักศึกษาเข้าใจชัดเจน

**Priority:** Medium
**Type:** UX / Content

### Context
กระบวนการหลังสอบโครงงาน:
- **ผ่าน** → ส่งเล่มภายใน ~1 สัปดาห์ → เจ้าหน้าที่รับเล่ม → เสร็จสิ้น
- **ไม่ผ่าน → เกรด I** → แก้ไขและส่งเล่มก่อนวันกำหนด (เช่น วันที่ 7)
- **ส่งเล่มไม่ทัน → เกรด IP** → ต้องสอบใหม่เทอมถัดไป (ไม่ต้องลงทะเบียนซ้ำ)

### พฤติกรรมที่ต้องการ
เมื่อระบบอัปเดตผลสอบเป็น `THESIS_FAILED` ให้แสดง:
1. **Notice/Alert** บนหน้า dashboard ของนักศึกษา อธิบายขั้นตอนถัดไปให้ชัดเจน
2. แสดง deadline วันส่งเล่ม (ถ้ามีในระบบ)
3. ข้อความควรเป็นภาษาไทย เข้าใจง่าย ไม่ใช้ศัพท์เทคนิค

### จุดที่ต้องตรวจสอบ
- Frontend: หน้า project dashboard ของนักศึกษา (`src/app/(app)/project/`)
  - ตรวจสอบ component ที่แสดงสถานะ `THESIS_FAILED` / `TOPIC_FAILED`
  - เพิ่ม `Alert` component (Ant Design) พร้อมข้อความอธิบาย step-by-step
- `src/constants/workflowStates.ts` — อาจเพิ่ม helper message สำหรับแต่ละ failed state

---

## NON-CODE — Production Server SSL/Domain

**Priority:** High (แต่ไม่ใช่งาน code)
**Type:** Infrastructure — ดำเนินการโดยมนุษย์

### สิ่งที่ต้องทำ
- ประสานกับ **อาจารย์เชียร์** เรื่อง SSL certificate และ domain สำหรับ production server
- ระบบยังไม่สามารถขึ้น production ได้

> ⚠️ ไม่ใช่งานที่ Claude Code แก้ได้ — ต้องดำเนินการโดยตรง

---

## สรุป Task List

| ID | ประเภท | Priority | สถานะ |
|---|---|---|---|
| BUG-01 | Bug fix | High | ⬜ รอแก้ไข |
| BUG-02 | Bug fix | High | ⬜ รอแก้ไข |
| FEATURE-01 | Feature | Medium | ⬜ รอแก้ไข |
| UX-01 | UX/Content | Medium | ⬜ รอแก้ไข |
| NON-CODE | Infrastructure | High | ⬜ รอประสานงาน |
