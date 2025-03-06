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
