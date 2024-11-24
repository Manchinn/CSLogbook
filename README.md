# คู่มือการติดตั้ง CSLogbook

## ความต้องการของระบบ
- Node.js เวอร์ชัน 14.0 ขึ้นไป
- npm เวอร์ชัน 6.0 ขึ้นไป
- เว็บเบราว์เซอร์ที่รองรับ JavaScript ทันสมัย

## ขั้นตอนการติดตั้ง

### 1. Clone Repository
```bash
git clone [repository-url]
cd cslogbook
```

### 2. ติดตั้ง Dependencies

#### Frontend
```bash
cd frontend
npm install

# รายการ dependencies หลักที่จะถูกติดตั้ง:
# - react
# - react-router-dom
# - antd (Ant Design)
# - axios
# - lucide-react
# - recharts
# - lodash
# - papaparse
```

#### Backend
```bash
cd backend
npm install

# รายการ dependencies หลักที่จะถูกติดตั้ง:
# - express
# - cors
# - nodemailer
# - socket.io
# - multer
# - csv-parser
```

### 3. ตั้งค่าไฟล์ Environment

#### Backend (.env)
```env
PORT=5000
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### 4. เตรียมข้อมูลเริ่มต้น
1. ตรวจสอบไฟล์ `mockStudentData.js` สำหรับข้อมูลนักศึกษาตัวอย่าง
2. ตรวจสอบไฟล์ `universityAPI.js` สำหรับข้อมูล authentication
3. สร้างโฟลเดอร์ `uploads` ในโฟลเดอร์ backend สำหรับการอัพโหลดไฟล์ CSV
```bash
mkdir backend/uploads
```

### 5. เริ่มต้นใช้งานระบบ

#### เริ่ม Backend Server
```bash
cd backend
npm start
# Server จะทำงานที่ http://localhost:5000
```

#### เริ่ม Frontend Development Server
```bash
cd frontend
npm start
# Frontend จะทำงานที่ http://localhost:3000
```

### 6. การทดสอบระบบ
1. เปิดเบราว์เซอร์และไปที่ `http://localhost:3000`
2. ทดลองเข้าสู่ระบบด้วยบัญชีตัวอย่าง:
   - นักศึกษา: username: student1, password: student1
   - อาจารย์: username: teacher1, password: teacher1
   - ผู้ดูแลระบบ: username: admin1, password: admin1

## โครงสร้างโฟลเดอร์หลัก
```
cslogbook/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminUpload.js     # หน้าอัพโหลด CSV สำหรับผู้ดูแลระบบ
│   │   │   ├── Dashboard.js       # หน้าแดชบอร์ดหลัก
│   │   │   ├── HeaderComponent.js # ส่วนหัวของเว็บไซต์
│   │   │   ├── LoginForm.js      # หน้าเข้าสู่ระบบ
│   │   │   ├── MainLayout.js     # เลย์เอาต์หลักของแอป
│   │   │   ├── Sidebar.js        # เมนูด้านข้าง
│   │   │   └── StudentList.js    # หน้าแสดงรายชื่อนักศึกษา
│   │   └── App.js                # ไฟล์หลักของ React App
│   └── public/
├── backend/
│   ├── server.js                # เซิร์ฟเวอร์หลัก
│   ├── authSystem.js           # ระบบยืนยันตัวตน
│   ├── mailer.js              # ระบบส่งอีเมล
│   ├── mockStudentData.js     # ข้อมูลนักศึกษาจำลอง
│   ├── universityAPI.js       # API จำลองของมหาวิทยาลัย
│   └── utils/
│       └── csvParser.js       # ตัวประมวลผลไฟล์ CSV
└── README.md
```

## ข้อควรระวังและปัญหาที่พบบ่อย

### การอัพโหลดไฟล์ CSV
- ไฟล์ CSV ต้องมีคอลัมน์ที่จำเป็นครบถ้วน: Student ID, Name, Surname, Role, Internship, Project
- รหัสนักศึกษาต้องมีความยาว 10-13 หลัก
- Role ต้องเป็น "student", "teacher" หรือ "admin" เท่านั้น

### การส่งอีเมล
- ต้องตั้งค่า SendGrid API Key ใน .env ให้ถูกต้อง
- ตรวจสอบการตั้งค่า SMTP ในไฟล์ mailer.js

### ปัญหาที่พบบ่อย
1. หากพบปัญหา CORS ให้ตรวจสอบการตั้งค่า cors ใน server.js
2. หากการอัพโหลด CSV ไม่ทำงาน ให้ตรวจสอบว่าได้สร้างโฟลเดอร์ uploads แล้ว
3. หากการเข้าสู่ระบบไม่ทำงาน ให้ตรวจสอบข้อมูลใน universityAPI.js

## การอัพเดทและการบำรุงรักษา

### การอัพเดทข้อมูลนักศึกษา
1. เตรียมไฟล์ CSV ตามรูปแบบที่กำหนด
2. เข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ
3. ไปที่เมนู "Upload Student CSV"
4. อัพโหลดไฟล์และตรวจสอบผลลัพธ์

### การแก้ไขสิทธิ์นักศึกษา
1. เข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ
2. ไปที่เมนู "รายชื่อนักศึกษา"
3. ค้นหานักศึกษาที่ต้องการแก้ไขสิทธิ์
4. อัพเดทสถานะผ่านการอัพโหลด CSV ใหม่
