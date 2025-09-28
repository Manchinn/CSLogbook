# CS Logbook Backend

ระบบ Backend สำหรับแอพพลิเคชัน CS Logbook

## การติดตั้ง

1. Clone repository
```bash
git clone <repository-url>
cd cslogbook/backend
```

2. ติดตั้ง dependencies
```bash
npm install
```

3. ตั้งค่า environment variables
```bash
npm run setup  # จะทำการ copy .env.example ไปเป็น .env.development
```

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

### Upload Configuration
- `UPLOAD_DIR`: directory สำหรับเก็บไฟล์ที่อัพโหลด (default: uploads/)
- `MAX_FILE_SIZE`: ขนาดไฟล์สูงสุดที่อัพโหลดได้ในหน่วย bytes (default: 5MB)

## การรัน

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
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
