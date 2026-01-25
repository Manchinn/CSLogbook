# CSLogbook

ระบบจัดการเอกสารฝึกงานและโครงงานพิเศษสำหรับภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ  
มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB)

## 📖 เกี่ยวกับโปรเจค

CSLogbook เป็นระบบจัดการ workflow การส่งเอกสาร การอนุมัติ logbook การติดตามความคืบหน้า และการประเมินผลสำหรับนักศึกษาคณะวิทยาศาสตร์ประยุกต์ ครอบคลุมทั้งระบบฝึกงาน (Internship) และระบบโครงงานพิเศษ (Project)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- MySQL 8.0
- Docker & Docker Compose (optional)

### การติดตั้งแบบ Development

```bash
# Clone repository
git clone <repository-url>
cd cslogbook

# Backend Setup
cd backend
npm install
npm run setup  # สร้าง .env.development
# แก้ไข .env.development ตามความเหมาะสม
npm run migrate  # รัน database migrations
npm run seed     # รัน seeders
npm run dev      # Start backend server (port 5000)

# Frontend Setup (เปิด terminal ใหม่)
cd frontend
npm install
# สร้าง .env.development
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
npm start        # Start frontend server (port 3000)
```

### การติดตั้งแบบ Docker

```bash
# Development
cp .env.docker.example .env.docker
# แก้ไข .env.docker
docker-compose up -d

# Production
# แก้ไข docker-compose.production.yml (เปลี่ยน IP addresses)
docker-compose -f docker-compose.production.yml up -d
```

## 📚 เอกสาร

- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - สรุปโปรเจคแบบละเอียด (แนะนำให้อ่าน!)
- **[Backend README](./backend/README.md)** - เอกสาร Backend
- **[Frontend README](./frontend/README.md)** - เอกสาร Frontend
- **[Database README](./database/README.md)** - เอกสาร Database
- **[CI/CD Documentation](./.github/workflows/README.md)** - เอกสาร CI/CD

## 🏗️ Tech Stack

### Backend
- Node.js + Express.js
- Sequelize ORM
- MySQL 8.0
- JWT Authentication
- SendGrid (Email)
- Socket.io (Real-time)

### Frontend
- React 18
- Ant Design 5
- React Router v6
- Axios
- Recharts

### Infrastructure
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## 🎯 ฟีเจอร์หลัก

- ✅ ระบบจัดการผู้ใช้ (Admin, Teacher, Student)
- ✅ ระบบฝึกงาน (Internship Management)
- ✅ ระบบโครงงานพิเศษ (Project Management)
- ✅ ระบบ Workflow และ Timeline
- ✅ ระบบเอกสารและอนุมัติ
- ✅ ระบบ Logbook
- ✅ ระบบรายงานและ Analytics
- ✅ ระบบแจ้งเตือนผ่านอีเมล
- ✅ ระบบ Deadline Management

## 📁 โครงสร้างโปรเจค

```
cslogbook/
├── backend/          # Backend API Server
├── frontend/         # React Frontend Application
├── database/         # Database initialization
├── .github/          # GitHub workflows & CI/CD
└── docker-compose.yml
```

## 🔧 Environment Variables

ดูรายละเอียดใน [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md#-environment-variables)

## 📖 API Documentation

เมื่อรัน backend server แล้ว สามารถเข้าถึง Swagger UI ได้ที่:
```
http://localhost:5000/api-docs
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:cov

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

ดูรายละเอียดใน [CI/CD Documentation](./.github/workflows/README.md)

## 📝 License

ISC

## 👥 Contributors

CSLogbook Development Team

---

สำหรับข้อมูลเพิ่มเติม กรุณาอ่าน [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
