---
applyTo: '**'
---

## CSLogbook – คำแนะนำย่อสำหรับ Copilot/AI Agent (โฟกัสของจริงในรีโปนี้)

- ภาพรวม: โมโนรีโป CSLogbook มี React Frontend และ Node.js/Express Backend ใช้ MySQL ผ่าน Sequelize. โครงหลักอยู่ที่ `cslogbook/` แยกเป็น `frontend/` และ `backend/` มีงานเบื้องหลังใน `backend/agents/` และบันทึกล็อกใน `backend/logs/`.

สถาปัตยกรรมและโครงสร้างที่ต้องรู้
- Backend (`cslogbook/backend/`)
  - Entry: `server.js` ตั้งค่า CORS, API prefix และ middleware พื้นฐาน
  - เลเยอร์: `controllers/` บาง, `services/` หนัก, `models/` (Sequelize), `routes/` ผูกเส้นทางกับ controller, `middleware/` มี `authMiddleware.js` และ `rateLimiter.js`
  - ฟีเจอร์สำคัญ: อัปโหลดไฟล์ผ่าน Multer (`config/uploadConfig.js`, `controllers/uploadController.js`), Auth ด้วย JWT (`config/jwt.js`, `controllers/authController.js`), อีเมล SendGrid (`config/email.js`), งานเบื้องหลังใน `agents/` (ดู `eligibilityUpdater.js`)
  - บันทึก: Winston เก็บไฟล์ใน `logs/` (เช่น `error.log`, `app.log`, `sql.log`)
- Frontend (`cslogbook/frontend/`)
  - React 18 (functional only), Ant Design v5.25.1, React Router, Axios, Context API
  - โครงหลัก: `src/components/` (โดเมนย่อย admin/student/teacher/internship), `src/services/` (เรียก API), `src/context/`, `src/utils/`
  - การทำ PDF ฝึกงาน: โฟลเดอร์ `src/components/internship/` อ้างอิงกติกาไฟล์ `.github/instructions/react-pdf-generation.instructions.md`

เวิร์กโฟลว์นักพัฒนาที่ใช้จริง (คำสั่งสำคัญ)
- Backend Dev
  - ตั้งค่า env: คัดลอก `.env.example` เป็น `.env.development` แล้วกรอก DB/JWT/EMAIL/UPLOAD/FRONTEND_URL
  - ติดตั้งและรัน: `npm install` แล้ว `npm run dev` ที่ `cslogbook/backend/`
  - ฐานข้อมูล: รัน `npx sequelize-cli db:migrate` และ (ถ้ามี) `db:seed:all` ก่อนใช้งาน
  - เอกสาร API: เข้า `http://localhost:5000/api-docs` (ถ้าถูกเปิดใช้)
- Frontend Dev
  - ตั้งค่า `.env.development` อย่างน้อย `REACT_APP_API_URL=http://localhost:5000/api` และ `REACT_APP_UPLOAD_URL=http://localhost:5000/uploads`
  - ติดตั้งและรัน: `npm install` แล้ว `npm start` ที่ `cslogbook/frontend/`
  - สคริปต์อื่น: `npm test`, `npm run build`

คอนเวนชันและแพทเทิร์นเฉพาะโปรเจกต์
- React ใช้เฉพาะ Functional + Hooks; แยก business logic ไป `services/` หรือ custom hooks; ใช้ Ant Design form และส่วนประกอบมาตรฐานของ Antd
- Backend ใช้ async/await; controller บางและเรียก service; ตรวจสิทธิ์ด้วย `authMiddleware`; log ทุกเหตุการณ์สำคัญผ่าน Winston
- เส้นทาง API เวอร์ชันใต้ `/api`; ตั้งค่า CORS ด้วย `FRONTEND_URL` ในไฟล์ env และใน `server.js`
- อัปโหลดไฟล์เก็บใน `uploads/`; ควบคุมขนาด/ประเภทที่ `config/uploadConfig.js`
- ฟีเจอร์อีเมลปิด/เปิดด้วย flag เช่น `EMAIL_*_ENABLED`; คีย์อยู่ใน `config/email.js`

จุดเชื่อมต่อและโฟลว์ข้อมูลตัวอย่าง
- Auth: ฝั่งเว็บเรียก POST `/api/auth/login` -> `controllers/authController.js` -> service/model -> ส่ง JWT กลับ; ฝั่งเว็บเก็บ token และแนบใน Axios interceptor
- เอกสาร/อัปโหลด: ฝั่งเว็บส่ง FormData -> `/api/upload/...` -> จัดการด้วย Multer -> ไฟล์ไปที่ `uploads/` และบันทึกข้อมูลลง DB
- ฝึกงาน/PDF: คอมโพเนนต์ใน `components/internship/**` ทำตามกติกาใน `.github/instructions/react-pdf-generation.instructions.md`

ที่ควรตรวจเมื่อดีบัก (เร็วๆ)
- CORS/URL ไม่ตรง: ตรวจ `FRONTEND_URL` (backend) และ `REACT_APP_API_URL` (frontend)
- DB ไม่เชื่อม: ตรวจค่าตัวแปร DB และรัน migration ก่อน
- JWT ผิดรูป: ตรวจ `JWT_SECRET` ต้องยาวพอ, เวลา `JWT_EXPIRES_IN`
- อัปโหลดล้มเหลว: ตรวจ `MAX_FILE_SIZE`, โฟลเดอร์ `uploads/`, และสิทธิ์ไฟล์
- ดูล็อก: `backend/logs/` (error/app/sql)

เอกสาร/ตัวอย่างอ้างอิงในรีโป
- Backend: `controllers/` (เช่น `authController.js`, `teacherController.js`), `middleware/authMiddleware.js`, `routes/`, `services/`
- Frontend: `src/components/**`, `src/services/**`, `src/context/**`
- คำแนะนำโดเมน: `.github/instructions/` (เช่น `react-pdf-generation.instructions.md`, `internship-registration-system.instructions.md`)

หมายเหตุสำหรับ Agent
- ตอบเป็นภาษาไทย และใส่คอมเมนต์ภาษาไทยเมื่อโค้ดมีตรรกะซับซ้อน
- เพิ่มฟีเจอร์ให้ครบทั้งสองฝั่งเมื่อเกี่ยวข้อง (API + UI); อัปเดต env/route/service ตามแพทเทิร์นที่กล่าวไว้

