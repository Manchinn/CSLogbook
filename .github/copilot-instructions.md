
# คำแนะนำสำหรับ Copilot AI Coding Agent ในโปรเจกต์ CSLogbook

## ภาพรวมระบบ
CSLogbook คือระบบติดตามความก้าวหน้าของนักศึกษา โดยใช้ React (frontend) และ Node.js/Express (backend) พร้อมฐานข้อมูล MySQL ระบบนี้ออกแบบมาเพื่อให้นักศึกษา อาจารย์ที่ปรึกษา และแอดมิน สามารถบันทึกกิจกรรม ติดตามความคืบหน้า และจัดการเวิร์กโฟลว์ทางวิชาการ

## สถาปัตยกรรมและรูปแบบสำคัญ
- **Frontend** (`cslogbook/frontend/`):
  - ใช้ React แบบ functional component และ hooks (ห้ามใช้ class component)
  - ใช้ Ant Design v5.25.1 สำหรับ UI, React Router สำหรับการนำทาง, Axios สำหรับเรียก API, และ Context API สำหรับ state management
  - แยก component ตามโดเมน เช่น `components/admin/`, `components/student/`
  - custom hook และ utility function อยู่ใน `hooks/` และ `utils/`
  - การเชื่อมต่อ API อยู่ใน `services/`
  - ต้องออกแบบให้ responsive และรองรับ accessibility
- **Backend** (`cslogbook/backend/`):
  - Node.js + Express, ใช้ Sequelize ORM กับ MySQL
  - แยก controller, model, route, middleware, service ตามหน้าที่
  - background agent (เช่น eligibility check) อยู่ใน `agents/`
  - logging ใช้ Winston, log file อยู่ใน `logs/`
  - ส่งอีเมลผ่าน SendGrid, อัปโหลดไฟล์ด้วย Multer

## เวิร์กโฟลว์สำหรับนักพัฒนา
- **Setup**: ดูรายละเอียดไฟล์ `README.md` ของแต่ละส่วนสำหรับ environment variable และขั้นตอนติดตั้ง
- **Backend**:
  - ติดตั้ง: `cd cslogbook/backend && npm install`
  - รัน (dev): `npm run dev`
  - ตั้งค่า environment: copy `.env.example` ไป `.env.development` แล้วแก้ไข
- **Frontend**:
  - ติดตั้ง: `cd cslogbook/frontend && npm install`
  - รัน (dev): `npm start`
  - ทดสอบ: `npm test`
  - build: `npm run build`
- **Database**:
  - ต้องตั้งค่า MySQL ตาม `README.md` ที่ root
  - migration ของ Sequelize อยู่ที่ `backend/migrations/`

## รูปแบบเฉพาะของโปรเจกต์
- **React**: ใช้เฉพาะ functional component และ hook เท่านั้น, logic เฉพาะโดเมนให้อยู่ใน context หรือ custom hook, คอมเมนต์และอธิบายเป็นภาษาไทย
- **Backend**: ใช้ async/await, แยก logic หลักไว้ใน service, controller ให้บาง, ใช้ middleware สำหรับ auth/validation
- **API**: RESTful endpoint, version ภายใต้ `/api/`
- **Logging**: ใช้ Winston, log file อยู่ใน `logs/`
- **PDF/Report Generation**: ดูตัวอย่างที่ `frontend/src/components/internship/` และไฟล์ `.github/instructions/react-pdf-generation.instructions.md`

## จุดเชื่อมต่อสำคัญ
- **Frontend/Backend**: สื่อสารผ่าน REST API, URL กำหนดในไฟล์ `.env`
- **Email**: ใช้ SendGrid, เปิด/ปิดฟีเจอร์ผ่าน environment variable
- **File Uploads**: จัดการด้วย Multer, ไฟล์เก็บใน `uploads/`
- **Background Agents**: งานเบื้องหลังหรือ scheduler อยู่ใน `backend/agents/`

## ตัวอย่างการขยายระบบ
- หากต้องการเพิ่มประเภทกิจกรรมนักศึกษาใหม่ ให้แก้ไข model/controller ฝั่ง backend, เพิ่ม API route, และอัปเดตฟอร์มหรือ component ฝั่ง frontend
- การ export PDF ให้ดูตัวอย่างที่ `frontend/src/components/internship/` และ `.github/instructions/react-pdf-generation.instructions.md`

## แหล่งอ้างอิง
- ดู `README.md` ที่ root, backend, frontend สำหรับโครงสร้างและขั้นตอน
- ดู `.github/instructions/` สำหรับกฎการเขียนโค้ดเฉพาะโดเมน

---
หากมีข้อกำหนดหรือเอกสารที่ไม่ชัดเจน ให้ตรวจสอบไฟล์ `README.md` หรือ `.github/instructions/` ที่เกี่ยวข้อง หรือสอบถามผู้ดูแลโปรเจกต์
