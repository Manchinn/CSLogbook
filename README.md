# คู่มือการติดตั้ง CSLogbook

## ภาพรวมโปรเจค
CSLogbook เป็นระบบติดตามความก้าวหน้าของนักศึกษา สำหรับการจัดการเอกสารฝึกงานและโครงงาน ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ พัฒนาด้วย React + Node.js และใช้ MySQL เป็นฐานข้อมูล

## ความต้องการของระบบ
- Node.js เวอร์ชัน 16.0 ขึ้นไป
- npm เวอร์ชัน 8.0 ขึ้นไป  
- MySQL เวอร์ชัน 8.0 ขึ้นไป
- เว็บเบราว์เซอร์ที่รองรับ JavaScript ES6+

## เทคโนโลยีที่ใช้

### Frontend
- **React 18+**: UI framework พร้อม functional components และ hooks
- **React Router**: สำหรับการจัดการ routing และ navigation
- **Ant Design v5.25.1**: UI component library 
- **Axios**: สำหรับการเรียก API
- **React Context API**: สำหรับจัดการ global state

### Backend  
- **Node.js + Express**: Web server framework
- **Sequelize ORM**: สำหรับจัดการฐานข้อมูล MySQL
- **JWT**: สำหรับ authentication และ authorization
- **Multer**: สำหรับจัดการการอัพโหลดไฟล์
- **SendGrid**: สำหรับการส่งอีเมล
- **Background Agents**: สำหรับงานแบ่งเวลา

## ขั้นตอนการติดตั้ง

### 1. Clone Repository
```bash
git clone [repository-url]
cd CSLog
```

### 2. ติดตั้งฐานข้อมูล MySQL
```bash
# สร้างฐานข้อมูล
mysql -u root -p
CREATE DATABASE cslogbook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cslogbook'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON cslogbook.* TO 'cslogbook'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. ติดตั้ง Dependencies

#### Backend
```bash
cd cslogbook/backend
npm install

# Dependencies หลักที่จะถูกติดตั้ง:
# - express, cors, helmet
# - sequelize, mysql2  
# - jsonwebtoken
# - multer, sendgrid/mail
# - winston (logging)
```

#### Frontend
```bash
cd cslogbook/frontend  
npm install

# Dependencies หลักที่จะถูกติดตั้ง:
# - react, react-dom, react-router-dom
# - antd, @ant-design/icons
# - axios, lodash
# - recharts (สำหรับกราฟ)
```

### 4. ตั้งค่า Environment Variables

#### Backend (.env.development)
```bash
# สำเนาไฟล์ template
cp .env.example .env.development
```

```env
# Server Configuration  
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000
API_PREFIX=/api
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_USER=cslogbook
DB_PASSWORD=your_password
DB_NAME=cslogbook

# JWT Configuration
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=1d

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_SENDER=noreply@yoursite.com

# Email Feature Flags  
EMAIL_LOGIN_ENABLED=false
EMAIL_DOCUMENT_ENABLED=false
EMAIL_LOGBOOK_ENABLED=false

# File Upload Configuration
UPLOAD_DIR=uploads/
MAX_FILE_SIZE=5242880

# Background Agents
ENABLE_AGENTS=false
```

#### Frontend (.env.development)
```bash
# สำเนาไฟล์ template
cp .env.example .env.development
```

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
```

### 5. เตรียมฐานข้อมูล

```bash
cd cslogbook/backend

# รัน migrations เพื่อสร้างตาราง
npx sequelize-cli db:migrate

# รัน seeders เพื่อใส่ข้อมูลเริ่มต้น
npx sequelize-cli db:seed:all
```

### 6. เริ่มต้นใช้งานระบบ

#### เริ่ม Backend Server
```bash
cd cslogbook/backend
npm run dev
# Server จะทำงานที่ http://localhost:5000
# API docs จะอยู่ที่ http://localhost:5000/api-docs
```

#### เริ่ม Frontend Development Server  
```bash
cd cslogbook/frontend
npm start  
# Frontend จะทำงานที่ http://localhost:3000
```

### 7. การทดสอบระบบ
1. เปิดเบราว์เซอร์และไปที่ `http://localhost:3000`
2. ทดลองเข้าสู่ระบบด้วยบัญชีตัวอย่าง (จาก seeders):
   - **นักศึกษา**: username: `student1`, password: `student1`
   - **อาจารย์**: username: `teacher1`, password: `teacher1`  
   - **ผู้ดูแลระบบ**: username: `admin1`, password: `admin1`

## โครงสร้างโปรเจค

```
CSLog/
├── .github/
│   └── instructions/          # คู่มือและเอกสารสำหรับ development
├── cslogbook/
│   ├── backend/              # ระบบ Backend (Node.js + Express)
│   │   ├── agents/           # Background processes และ scheduled tasks
│   │   ├── config/           # การตั้งค่าฐานข้อมูลและ server
│   │   ├── controllers/      # API endpoint handlers
│   │   ├── middleware/       # Custom middleware (auth, rate limiting)
│   │   ├── models/           # Sequelize database models
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic และ external integrations
│   │   ├── utils/            # Utility functions และ helpers
│   │   ├── migrations/       # Database schema changes
│   │   ├── seeders/          # ข้อมูลเริ่มต้นสำหรับฐานข้อมูล
│   │   ├── templates/        # เทมเพลตสำหรับสร้างเอกสาร
│   │   ├── uploads/          # ไฟล์ที่อัพโหลด
│   │   └── server.js         # Entry point ของ server
│   │
│   ├── frontend/             # ระบบ Frontend (React)
│   │   ├── public/           # Static assets
│   │   └── src/
│   │       ├── components/   # React components
│   │       │   ├── admin/    # ส่วนผู้ดูแลระบบ
│   │       │   ├── student/  # ส่วนนักศึกษา
│   │       │   ├── teacher/  # ส่วนอาจารย์
│   │       │   └── common/   # Components ที่ใช้ร่วมกัน
│   │       ├── contexts/     # React contexts สำหรับ state management
│   │       ├── hooks/        # Custom React hooks
│   │       ├── services/     # API service integrations
│   │       ├── utils/        # Utility functions
│   │       └── assets/       # รูปภาพ, ไอคอน, styles
│   │
│   ├── docs/                 # เอกสารโปรเจค
│   └── knowledge/            # ฐานความรู้และเอกสารอ้างอิง
│
├── package.json              # Root package.json
└── README.md                # ไฟล์นี้
```

## ฟีเจอร์หลักของระบบ

### 1. ระบบจัดการผู้ใช้และสิทธิ์
- **ระบบเข้าสู่ระบบ**: Authentication ที่ปลอดภัยสำหรับนักศึกษาและอาจารย์
- **การควบคุมสิทธิ์**: สิทธิ์และมุมมองที่แตกต่างตามบทบาท (student, teacher, admin)
- **จัดการโปรไฟล์**: อนุญาตให้ผู้ใช้อัพเดตข้อมูลและค่าตั้งค่า

### 2. ระบบติดตามความก้าวหน้าของนักศึกษา
- **บันทึกกิจกรรม**: นักศึกษาสามารถสร้างรายการเกี่ยวกับงานที่เสร็จสิ้น
- **จัดการ Milestone**: กำหนด ติดตาม และอัพเดต milestone ทางการศึกษา
- **จัดการงาน**: สร้างและจัดการงานทางการศึกษาพร้อมกำหนดเวลา

### 3. ระบบลงทะเบียนฝึกงาน  
- **แบบฟอร์ม คพ.05**: กรอกข้อมูลฝึกงานและสถานประกอบการ
- **ระบบ Workflow**: ติดตามสถานะการอนุมัติเอกสาร
- **จัดการเอกสาร**: อัพโหลด ดาวน์โหลด และจัดการเอกสารฝึกงาน

### 4. ระบบ Feedback และการประเมิน
- **ความคิดเห็นอาจารย์**: อาจารย์สามารถให้ feedback กับรายการของนักศึกษา
- **ระบบการให้คะแนน**: ประเมินความก้าวหน้าด้วย metrics ที่กำหนด
- **Workflow การอนุมัติ**: อาจารย์สามารถตรวจสอบและอนุมัติงานที่ส่ง

### 5. ระบบรายงานและการแสดงผลข้อมูล
- **Dashboard ความก้าวหน้า**: สรุปภาพรวมความก้าวหน้าของนักศึกษา
- **การวิเคราะห์เปรียบเทียบ**: เปรียบเทียบความก้าวหน้าปัจจุบันกับเป้าหมาย
- **รายงานที่ส่งออกได้**: สร้างรายงาน PDF หรือ spreadsheet

## การ Deploy สำหรับ Production

### 1. Backend Production Setup
```bash
cd cslogbook/backend

# สร้างไฟล์ .env.production
cp .env.example .env.production

# แก้ไขค่าใน .env.production
NODE_ENV=production
BASE_URL=https://your-domain.com
FRONTEND_URL=https://your-frontend-domain.com
# ... อื่นๆ

# Build และรัน  
npm run build
npm start
```

### 2. Frontend Production Build
```bash
cd cslogbook/frontend

# สร้างไฟล์ .env.production
cp .env.example .env.production

# แก้ไขค่าใน .env.production
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_UPLOAD_URL=https://your-api-domain.com/uploads

# สร้าง production build
npm run build

# ไฟล์ build จะอยู่ในโฟลเดอร์ build/
```

## การแก้ไขปัญหาที่พบบ่อย

### ปัญหาการเชื่อมต่อฐานข้อมูล
```bash
# ตรวจสอบการเชื่อมต่อ MySQL
mysql -u cslogbook -p cslogbook

# ตรวจสอบการตั้งค่าใน .env.development
DB_HOST=localhost
DB_USER=cslogbook  
DB_PASSWORD=your_password
DB_NAME=cslogbook
```

### ปัญหา CORS
- ตรวจสอบ `FRONTEND_URL` ใน backend environment variables
- ตรวจสอบการตั้งค่า CORS ใน [server.js](cslogbook/backend/server.js)

### ปัญหาการอัพโหลดไฟล์
- ตรวจสอบว่าโฟลเดอร์ `uploads/` มีอยู่และมีสิทธิ์เขียน
- ตรวจสอบ `MAX_FILE_SIZE` ใน environment variables

### ปัญหาการส่งอีเมล
- ตรวจสอบ `SENDGRID_API_KEY`
- ตรวจสอบการตั้งค่า feature flags: `EMAIL_*_ENABLED`

## การอัพเดทและบำรุงรักษา

### การอัพเดทโครงสร้างฐานข้อมูล
```bash
cd cslogbook/backend

# สร้าง migration ใหม่
npx sequelize-cli migration:generate --name add-new-feature

# รัน migrations
npx sequelize-cli db:migrate

# Rollback (หากจำเป็น)
npx sequelize-cli db:migrate:undo
```

### การ Backup ฐานข้อมูล
```bash
# Backup
mysqldump -u cslogbook -p cslogbook > backup_$(date +%Y%m%d).sql

# Restore  
mysql -u cslogbook -p cslogbook < backup_20240101.sql
```

## การพัฒนาเพิ่มเติม

### การเพิ่ม API Endpoint ใหม่
1. สร้าง model ใน `backend/models/`
2. สร้าง controller ใน `backend/controllers/`  
3. สร้าง route ใน `backend/routes/`
4. เพิ่ม service ใน `backend/services/` (หากจำเป็น)

### การเพิ่ม React Component ใหม่
1. สร้าง component ใน `frontend/src/components/`
2. เพิ่ม API service ใน `frontend/src/services/`
3. อัพเดต routing ใน `frontend/src/App.js`

## การสนับสนุนและเอกสาร

- **API Documentation**: `http://localhost:5000/api-docs` (เมื่อรัน development server)
- **โครงสร้างฐานข้อมูล**: ดูที่ `backend/models/`
- **เอกสารเพิ่มเติม**: ดูใน `docs/` และ `.github/instructions/`

## License
โปรเจคนี้พัฒนาสำหรับใช้ภายในภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
