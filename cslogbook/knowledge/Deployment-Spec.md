CSLogbook – สเปคระบบและข้อกำหนดการดีพลอย (สำหรับภาควิชา)

ภาพรวมระบบ
- สถาปัตยกรรมแบบ 3 คอนเทนเนอร์: `frontend (Nginx)`, `backend (Node.js/Express)`, `mysql` (ใช้ภายในหรือเชื่อมต่อ DB ภายนอกได้)
- ใช้ Docker และ Docker Compose เพื่อจัดการบริการและเครือข่ายภายใน
- การเข้าถึงจากภายนอกผ่านโดเมน/Reverse Proxy พร้อม SSL/TLS

แพลตฟอร์ม/โครงสร้างพื้นฐาน
- Docker Engine แนะนำ: 24+ และ Docker Compose v2
- ระบบปฏิบัติการแนะนำ: Ubuntu Server 22.04 LTS (รองรับ Windows Server ได้แต่ Linux นิยมกว่า)
- การแมปพอร์ตตามค่าเริ่มต้นใน `docker-compose.yml`:
  - `frontend`: โฮสต์ `3000` → คอนเทนเนอร์ `80`
  - `backend`: โฮสต์ `5000` → คอนเทนเนอร์ `5000`
  - `mysql`: โฮสต์ `3307` → คอนเทนเนอร์ `3306`

Backend (API Server)
- Image: `node:18-alpine`
- Framework: Express 4.21.1
- ORM/DB: Sequelize 6.37.6 + mysql2 3.13.0
- Auth: jsonwebtoken 9.0.2 (JWT)
- Uploads: multer 1.4.5-lts.1
- Utilities: bcrypt 5.1.1, cors 2.8.5, winston 3.17.0, socket.io 4.8.0, nodemailer 6.9.16
- Port ภายใน: `5000`
- โฟลเดอร์สำคัญ: `/app/uploads` (แมปเป็น volume `backend-uploads`), `/app/logs` (volume `backend-logs`)

Frontend (Web UI)
- Build ด้วย Node.js 18-alpine และ Serve ด้วย Nginx 1.27-alpine
- React 18.3.1, react-router-dom 6.27.0, Ant Design 5.25.1, @tanstack/react-query 5.72.0
- Build tools: Webpack 5.64.4, Babel
- Port ภายใน: `80`
- Nginx config: proxy เส้นทาง `/api/` และ `/uploads/` ไป `backend:5000`

ฐานข้อมูล (RDBMS)
- Image: `mysql:8.0`
- ค่าตั้งต้นใน compose: charset `utf8mb4`, collation `utf8mb4_unicode_ci`
- หากใช้ DB ภายนอก: ตั้ง `DB_HOST` เป็น IP/โดเมนจริงของฐานข้อมูล ไม่ใช่ชื่อบริการ `mysql`

โดเมน/Reverse Proxy/HTTPS
- `<api-domain>` คือโดเมนสาธารณะ HTTPS ที่ frontend ใช้เรียก API และไฟล์อัปโหลด เช่น `https://api.example.edu`
- แนะนำวาง Reverse Proxy (เช่น Nginx บนโฮสต์) ทำ SSL/TLS แล้วชี้มายัง `frontend` container
- ภายใน Docker network: `frontend` จะ proxy ไป `backend:5000` ตาม `config/docker/nginx.conf`

ไฟล์คอนฟิกที่ต้องเตรียม (Production)
- `cslogbook/backend/.env.production`
  - `NODE_ENV=production`
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `JWT_SECRET` (ต้องเป็นค่าเซ็นลับจริง)
  - `FRONTEND_URL` (เช่น `https://<web-domain>`)
  - `UPLOAD_DIR=uploads/`
- `cslogbook/frontend/.env.production`
  - `REACT_APP_API_URL=https://<api-domain>/api`
  - `REACT_APP_UPLOAD_URL=https://<api-domain>/uploads`
- หากใช้ docker-compose ในโปรดักชัน: `.env.docker` สำหรับ `BACKEND_PORT`, `FRONTEND_PORT`, `DB_*`, และ build args ของ frontend

ข้อกำหนดทรัพยากรเครื่อง (แนะนำ)
- CPU: 2 vCPU ขึ้นไป
- RAM: 4–8 GB (รองรับผู้ใช้พร้อมกันมากขึ้นแนะนำ 8 GB)
- Storage: 50–100 GB ขึ้นไป (รวมพื้นที่ฐานข้อมูลและโฟลเดอร์ uploads)
- Network: เปิดพอร์ตตามที่กำหนด และเตรียม SSL certificates

ขั้นตอนดีพลอย (Build บนเซิร์ฟเวอร์)
1) ติดตั้ง Docker + Docker Compose
2) ตั้งค่า DNS ให้โดเมนชี้มายังเซิร์ฟเวอร์
3) เติมค่าจริงลงใน `backend/.env.production` และ `frontend/.env.production`, (ถ้าใช้ compose) `.env.docker`
4) หากใช้ DB ภายนอก: ปรับ `DB_HOST` เป็น IP/โดเมนจริง และแก้ `docker-compose.yml` เพื่อลบ service `mysql` และ `depends_on: mysql`
5) รัน `docker compose up -d --build`
6) ตั้ง Reverse Proxy + SSL ให้โดเมนใช้งานแบบ HTTPS

ขั้นตอนดีพลอยทางเลือก (Build โลคัล + Push Registry)
1) สร้าง images ในเครื่อง: `docker build` สำหรับ `backend` และ `frontend`
2) Tag และ `docker push` ไปยัง Docker Hub หรือ GitHub Container Registry
3) บนเซิร์ฟเวอร์: แก้ `docker-compose.yml` ให้ใช้ `image:` แทน `build:` แล้วรัน `docker compose pull && docker compose up -d`

เช็กรายการหลังดีพลอย
- `http(s)://<web-domain>` โหลดหน้าเว็บสำเร็จ
- `GET https://<api-domain>/api/health` ตอบ 200 (ถ้ามี health endpoint)
- ทดสอบอัปโหลด/ดาวน์โหลดไฟล์ผ่านเส้นทาง `/uploads`
- ตรวจสอบสิทธิ์เขียนโฟลเดอร์ `backend/uploads` และขนาดไฟล์ตาม `MAX_FILE_SIZE`
- ตรวจสอบ CORS และ Cookie/SameSite (ถ้าใช้)

หมายเหตุสำคัญ
- ห้าม commit ไฟล์ `.env*`
- แทนที่ค่าทุกตัวที่เป็น placeholder (`<api-domain>`, JWT, รหัส DB)
- รีสตาร์ทบริการหลังแก้ `.env.production`

เวอร์ชันซอฟต์แวร์อ้างอิง
- Backend: `node:18-alpine`
- Frontend: `nginx:1.27-alpine` (build ด้วย `node:18-alpine`)
- Database: `mysql:8.0`