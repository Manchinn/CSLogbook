# CS Logbook Backend

ระบบ Backend API สำหรับแอพพลิเคชัน CS Logbook  
สร้างด้วย Node.js + Express.js และ Sequelize ORM

## 📋 ภาพรวม

Backend API server ที่ให้บริการ RESTful API สำหรับระบบจัดการเอกสารฝึกงานและโครงงานพิเศษ ใช้ MySQL 8.0 เป็นฐานข้อมูล และรองรับการทำงานแบบ real-time ผ่าน Socket.io

## 🚀 การติดตั้ง

### Prerequisites
- Node.js >= 18.x
- MySQL 8.0
- npm หรือ yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd cslogbook/backend
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
```bash
npm run setup  # จะทำการ copy .env.example ไปเป็น .env.development
```

แก้ไขไฟล์ `.env.development` ตามความเหมาะสม

## Environment Variables

### Required Variables
- `NODE_ENV`: development | production
- `PORT`: port ที่ใช้รัน server (default: 5000)
- `BASE_URL`: URL ของ backend server
- `FRONTEND_URL`: URL ของ frontend application

### Database Configuration
- `DB_HOST`: hostname ของ database
- `DB_USER`: username สำหรับเชื่อมต่อ database
- `DB_PASSWORD`: password สำหรับเชื่อมต่อ database
- `DB_NAME`: ชื่อ database

### JWT Configuration
- `JWT_SECRET`: secret key สำหรับ JWT (ต้องมีความยาวอย่างน้อย 32 ตัวอักษร)
- `JWT_EXPIRES_IN`: ระยะเวลาหมดอายุของ token (default: 1d)

### Email Configuration
- `SENDGRID_API_KEY`: API key ของ SendGrid
- `EMAIL_SENDER`: อีเมลที่ใช้ส่ง

### Feature Flags
- `EMAIL_LOGIN_ENABLED`: เปิด/ปิดการส่งอีเมลตอน login
- `EMAIL_DOCUMENT_ENABLED`: เปิด/ปิดการส่งอีเมลเกี่ยวกับเอกสาร
- `EMAIL_LOGBOOK_ENABLED`: เปิด/ปิดการส่งอีเมลเกี่ยวกับ logbook
- `EMAIL_MEETING_ENABLED`: เปิด/ปิดการส่งอีเมลขออนุมัติบันทึกการพบอาจารย์
- `LOG_ENABLE_CONSOLE`: ตั้งเป็น `false` เพื่อปิดการแสดง log ใน console (ค่าเริ่มต้นจะปิดอัตโนมัติเมื่อรันเทสต์ และเปิดเฉพาะในโหมด development)

### Upload Configuration
- `UPLOAD_DIR`: directory สำหรับเก็บไฟล์ที่อัพโหลด (default: uploads/)
- `MAX_FILE_SIZE`: ขนาดไฟล์สูงสุดที่อัพโหลดได้ในหน่วย bytes (default: 5MB)

## 💻 การรัน

### Development Mode
```bash
npm run dev
```
Server จะรันที่ `http://localhost:5000` (หรือตาม PORT ที่กำหนด)

### Production Mode
```bash
npm run build
npm start
```

### Database Setup
```bash
# รัน migrations
npm run migrate

# รัน seeders (ข้อมูลเริ่มต้น)
npm run seed

# ตรวจสอบการเชื่อมต่อและ models
npm run db:check:all
```

## 📁 โครงสร้างโปรเจค

```
backend/
├── controllers/          # Request handlers
│   ├── documents/        # Document controllers
│   └── logbooks/        # Logbook controllers
│
├── services/            # Business logic layer
│   ├── internshipService.js
│   ├── projectService.js
│   ├── workflowService.js
│   └── ...
│
├── models/              # Sequelize models
│   ├── User.js
│   ├── Student.js
│   ├── ProjectDocument.js
│   └── ...
│
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   ├── studentRoutes.js
│   ├── teacherRoutes.js
│   ├── projectRoutes.js
│   ├── documents/       # Document routes
│   └── ...
│
├── middleware/          # Express middleware
│   ├── authMiddleware.js
│   ├── rateLimiter.js
│   └── ...
│
├── agents/              # Background agents
│   ├── schedulers/      # Scheduled tasks
│   ├── monitors/        # System monitors
│   └── index.js
│
├── migrations/          # Database migrations
│   └── YYYYMMDDHHMMSS-description.js
│
├── seeders/             # Database seeders
│   ├── dev/             # Development seeders
│   └── production/       # Production seeders
│
├── scripts/             # Utility scripts
│   ├── setupDeadlineMappings.js
│   └── ...
│
├── utils/               # Utility functions
│   ├── validateEnv.js
│   └── ...
│
├── config/              # Configuration files
│   ├── database.js
│   ├── jwt.js
│   └── ...
│
├── templates/           # Email templates
│   └── *.html
│
├── uploads/             # Uploaded files
├── logs/                # Application logs
├── app.js               # Express app configuration
└── server.js            # Server entry point
```

## API Documentation

เข้าถึง Swagger UI ได้ที่:
```
http://localhost:5000/api-docs
```

### Topic Exam Overview (Summary)
Endpoint: `GET /api/projects/topic-exam/overview`

Readiness flags (response.readiness):
- `titleCompleted`: มีชื่อโครงงานทั้งภาษาไทย/อังกฤษ
- `advisorAssigned`: มีอาจารย์ที่ปรึกษา
- `proposalUploaded` / `abstractUploaded`: heuristic จาก field `objective` / `expectedOutcome`
- `memberCountOk`: (ใหม่) จำนวนสมาชิก >= 2
- `readyFlag`: baseline = (titleCompleted && advisorAssigned) หรือหากส่ง query `enforceMemberMin=1` จะบังคับรวม `memberCountOk`

Query Params เพิ่มเติม:
- `readyOnly=true` คืนเฉพาะที่ readyFlag = true
- `enforceMemberMin=1` ทำให้ readyFlag ต้องมีสมาชิก >=2

ตัวอย่างเรียก: `/api/projects/topic-exam/overview?readyOnly=true&enforceMemberMin=1`

### Scenario Seeding (ทดสอบหลายเคส)
ไฟล์ seeder:
1. `20250922120000-demo-topic-exam-projects.js` ตัวอย่างทั่วไป (1-2 สมาชิก, readiness ปกติ)
2. `20250922123000-scenario-topic-exam-projects.js` สร้างเคสหลากหลาย: draft/no advisor, missing EN title, single member, multi-member พร้อม track, in_progress, completed, archived

รันเฉพาะ scenario:
```bash
npx sequelize-cli db:seed --seed 20250922123000-scenario-topic-exam-projects.js
```
Rollback:
```bash
npx sequelize-cli db:seed:undo --seed 20250922123000-scenario-topic-exam-projects.js
```

ตรวจสอบอย่างรวดเร็ว:
```sql
SELECT project_id, project_name_th, status, advisor_id FROM project_documents 
WHERE project_name_th LIKE 'SCENARIO TOPIC%';
```

### Project Meetings & Logbook Approval
API ชุดใหม่สำหรับติดตามการพบอาจารย์หลังสอบหัวข้อและการอนุมัติ logbook

- `GET /api/projects/:projectId/meetings` — รายการ meeting พร้อม logs, ผู้เข้าร่วม และสรุปจำนวนครั้งที่อนุมัติแล้วของนักศึกษาแต่ละคน
- `POST /api/projects/:projectId/meetings` — สร้าง meeting ใหม่ (ระบบจะดึงสมาชิกและอาจารย์ที่ปรึกษามาเป็นผู้เข้าร่วมอัตโนมัติ สามารถระบุผู้เข้าร่วมเพิ่มเติมได้ผ่าน `additionalParticipantIds`)
- `POST /api/projects/:projectId/meetings/:meetingId/logs` — เพิ่มบันทึกการพบ (log) ระบุหัวข้อ, ความคืบหน้า, ปัญหา, งานถัดไป และ action items
- `PATCH /api/projects/:projectId/meetings/:meetingId/logs/:logId/approval` — ให้ครูที่ปรึกษา/ผู้ดูแลระบบอนุมัติ, ปฏิเสธ หรือรีเซ็ตสถานะบันทึก พร้อมบันทึก comment เพิ่มเติม
- `POST /api/projects/:projectId/meetings/request-approval` — นักศึกษาหรืออาจารย์ร้องขอให้ระบบส่งอีเมลแจ้งเตือนบันทึกที่ยังรออนุมัติ (เลือกได้ทั้งแบบรวมทั้งหมดหรือเฉพาะรอบสัปดาห์)

โครงสร้าง log ถูกออกแบบให้ครอบคลุมข้อกำหนด “นักศึกษาต้องพบอาจารย์อย่างน้อย 4 ครั้งและต้องได้รับการอนุมัติทุกครั้ง” โดย summary ใน response จะบอกจำนวนบันทึกที่ได้รับอนุมัติของแต่ละนักศึกษาอย่างชัดเจน


## การจัดการ Environment Variables

1. สร้างไฟล์ .env.development จาก template:
```bash
cp .env.example .env.development
```

2. แก้ไขค่าต่างๆ ใน .env.development ตามความเหมาะสม

3. ตรวจสอบการตั้งค่าทั้งหมดก่อนรัน server:
```bash
# ค่าที่จำเป็นต้องตั้ง
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000
API_PREFIX=/api
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cslogbook

# JWT
JWT_SECRET=your-secret-key-at-least-32-chars
JWT_EXPIRES_IN=1d

# Email
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_SENDER=your_email@example.com

# Feature Flags
EMAIL_LOGIN_ENABLED=false
EMAIL_DOCUMENT_ENABLED=false
EMAIL_LOGBOOK_ENABLED=false

# Upload
UPLOAD_DIR=uploads/
MAX_FILE_SIZE=5242880
```

## การ Validate Environment Variables

Server จะทำการตรวจสอบค่า environment variables ที่จำเป็นทั้งหมดก่อนเริ่มทำงาน:

1. ตรวจสอบการมีอยู่ของตัวแปรที่จำเป็น
2. ตรวจสอบ format ของค่าต่างๆ
3. ตรวจสอบความถูกต้องของ URLs
4. ตรวจสอบขนาดของ JWT_SECRET

หากพบข้อผิดพลาด server จะไม่เริ่มทำงานและแสดงข้อความแจ้งเตือนที่เหมาะสม

## 🛠️ Database Management

### Migrations
```bash
# รัน migrations ทั้งหมด
npm run migrate

# Rollback migration ล่าสุด
npm run migrate:undo

# สร้าง migration ใหม่
npm run migrate:create <migration-name>

# ตรวจสอบสถานะ migrations
npm run migrate:status
```

### Seeders
```bash
# รัน seeders ทั้งหมด
npm run seed

# รัน seeder เฉพาะ
npm run seed:one <seeder-name>

# Rollback seeder
npm run seed:undo:one <seeder-name>

# Development seeders
npm run seed:dev

# Production seeders
npm run seed:prod
```

### Database Checks
```bash
# ตรวจสอบการเชื่อมต่อ database
npm run db:check

# ตรวจสอบ models
npm run db:check:models

# ตรวจสอบทั้งหมด
npm run db:check:all
```

## 🤖 Background Agents

ระบบมี Background Agents สำหรับทำงานตามกำหนดเวลา:

### Schedulers
- **deadlineReminderAgent**: ส่งแจ้งเตือน deadlines
- **eligibilityScheduler**: อัพเดทคุณสมบัติของนักศึกษา
- **academicSemesterScheduler**: อัพเดทภาคเรียนปัจจุบันอัตโนมัติ
- **projectPurgeScheduler**: ลบข้อมูลโครงงานที่หมดอายุ

### Monitors
- **documentStatusMonitor**: ติดตามสถานะเอกสาร
- **logbookQualityMonitor**: ติดตามคุณภาพ logbook
- **securityMonitor**: ติดตามความปลอดภัย

### การเปิดใช้งาน Agents
ตั้งค่า environment variable:
```bash
ENABLE_AGENTS=true
# หรือเปิดเฉพาะ agent
ACADEMIC_AUTO_UPDATE_ENABLED=true
```

## 📜 Utility Scripts

### Important Deadlines Management
```bash
# ดูรายการ deadlines ทั้งหมด
node scripts/setupDeadlineMappings.js list-deadlines

# ดูรายการ mappings ที่มีอยู่
node scripts/setupDeadlineMappings.js list-mappings

# สร้าง mappings ใหม่ (ต้องแก้ไข config ในไฟล์ก่อน)
node scripts/setupDeadlineMappings.js setup

# Backfill เอกสารเก่า
node scripts/backfillDocumentDeadlines.js
```

**คู่มือการใช้งาน**:
- `../knowledge/DEADLINE_LINKING_SUMMARY.md` - สรุประบบและวิธีใช้งาน
- `../knowledge/DEADLINE_DOCUMENT_LINKING_GUIDE.md` - คู่มือโดยละเอียด
- `../knowledge/deadlines_system_spec.md` - สเปกระบบฉบับเต็ม

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d backend
```

### Production
```bash
# Build image
docker-compose -f docker-compose.production.yml build backend

# Start container
docker-compose -f docker-compose.production.yml up -d backend

# View logs
docker-compose -f docker-compose.production.yml logs -f backend
```

## 📦 Tech Stack

### Core
- **Node.js**: >= 18.x
- **Express.js**: 4.21.1
- **Sequelize**: 6.37.6 (ORM)

### Database
- **MySQL**: 8.0
- **mysql2**: 3.13.0

### Authentication & Security
- **jsonwebtoken**: 9.0.2 (JWT)
- **bcrypt**: 5.1.1 (Password hashing)
- **express-rate-limit**: 7.5.0 (Rate limiting)
- **express-validator**: 7.2.1 (Input validation)

### Email
- **nodemailer**: 6.9.16
- **SendGrid**: (via API)

### Real-time
- **socket.io**: 4.8.0

### File Processing
- **multer**: 1.4.5-lts.1 (File upload)
- **pdfkit**: 0.17.1 (PDF generation)
- **exceljs**: 4.4.0 (Excel processing)
- **xlsx**: 0.18.5 (Excel parsing)

### Scheduling
- **node-cron**: 3.0.3
- **node-schedule**: 2.1.1

### Documentation
- **swagger-jsdoc**: 6.2.8
- **swagger-ui-express**: 5.0.1

### Utilities
- **dayjs**: 1.11.13 (Date manipulation)
- **moment-timezone**: 0.5.47 (Timezone handling)
- **joi**: 17.13.3 (Schema validation)
- **winston**: 3.17.0 (Logging)

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:cov
```

## 🔍 Troubleshooting

### Database Connection Issues
- ตรวจสอบ database credentials ใน `.env.development`
- ตรวจสอบว่า MySQL service กำลังรันอยู่
- ตรวจสอบ port และ host

### JWT Errors
- ตรวจสอบว่า `JWT_SECRET` มีความยาว >= 32 ตัวอักษร
- ตรวจสอบ token expiration

### File Upload Issues
- ตรวจสอบ `UPLOAD_DIR` permissions
- ตรวจสอบ `MAX_FILE_SIZE` setting
- ตรวจสอบ disk space

### Agent Not Running
- ตรวจสอบ `ENABLE_AGENTS=true` ใน environment variables
- ตรวจสอบ logs ใน `logs/` directory
- ตรวจสอบว่า agents ถูก start ใน `server.js`

## 📝 Important Notes

- ⚠️ **ห้าม commit ไฟล์ `.env` หรือ `.env.development`**
- ✅ ใช้ `.env.example` เป็น template
- ✅ ตรวจสอบ environment variables ก่อนรัน server
- ✅ ใช้ migrations สำหรับการเปลี่ยนแปลง database schema
- ✅ ใช้ seeders สำหรับข้อมูลเริ่มต้น
- ✅ ตรวจสอบ logs เมื่อเกิดปัญหา
