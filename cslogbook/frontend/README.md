# CS Logbook Frontend

ระบบจัดการเอกสารฝึกงานและโครงงานสำหรับภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ

## การติดตั้ง

1. ติดตั้ง dependencies:
```bash
npm install
```

2. สร้างไฟล์ environment variables:
- สร้างไฟล์ `.env.development` สำหรับ development
- สร้างไฟล์ `.env.production` สำหรับ production

ตัวอย่างการตั้งค่า environment variables:
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
```

## การพัฒนา

รันโปรแกรมในโหมด development:
```bash
npm start
```

รันการทดสอบ:
```bash
npm test
```

## การ Build สำหรับ Production

1. ตรวจสอบไฟล์ `.env.production`:
```bash
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_UPLOAD_URL=https://your-api-domain.com/uploads
```

2. สร้าง production build:
```bash
npm run build
```

## โครงสร้างโปรเจค

```
src/
├── components/        # React components
│   ├── admin/        # ส่วนผู้ดูแลระบบ
│   ├── student/      # ส่วนนักศึกษา
│   └── teacher/      # ส่วนอาจารย์
├── contexts/         # React contexts
├── hooks/           # Custom hooks
├── services/        # API services
└── utils/           # Utility functions
```

## Environment Variables ที่จำเป็น

| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_API_URL | Base URL ของ API | http://localhost:5000/api |
| REACT_APP_UPLOAD_URL | URL สำหรับไฟล์ที่อัปโหลด | http://localhost:5000/uploads |

## การ Deploy

1. สร้าง production build:
```bash
npm run build
```

2. ไฟล์ที่ได้จะอยู่ใน folder `build/`

3. อัปโหลดไฟล์ใน `build/` ไปยัง web server

4. ตั้งค่า web server (Apache/Nginx) ให้ redirect ทุก route ไปที่ index.html

ตัวอย่าง Nginx configuration:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## การแก้ไขปัญหาเบื้องต้น

1. ปัญหา CORS:
- ตรวจสอบ API_URL ใน environment variables
- ตรวจสอบการตั้งค่า CORS ในฝั่ง backend

2. ปัญหาการอัปโหลดไฟล์:
- ตรวจสอบ UPLOAD_URL
- ตรวจสอบสิทธิ์การเขียนไฟล์ในฝั่ง server

## การพัฒนาเพิ่มเติม

1. การเพิ่ม route ใหม่:
- เพิ่ม component ใน folder ที่เหมาะสม
- เพิ่ม route ใน App.js
- เพิ่ม navigation ใน Sidebar/Navbar

2. การเพิ่ม API endpoint ใหม่:
- เพิ่ม service ใน services/
- ใช้ API_URL จาก environment variables

## หมายเหตุสำคัญ

- ห้าม commit ไฟล์ .env หรือ .env.local
- ใช้ .env.example เป็น template
- ตรวจสอบ console errors ก่อน deploy
- ทดสอบการ build ก่อน deploy ทุกครั้ง
