# สรุปโปรเจค CSLogbook

## 📋 ภาพรวมโปรเจค

**CSLogbook** เป็นระบบจัดการเอกสารฝึกงานและโครงงานพิเศษสำหรับภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB) ระบบนี้ช่วยจัดการ workflow การส่งเอกสาร การอนุมัติ logbook การติดตามความคืบหน้า และการประเมินผลสำหรับนักศึกษาคณะวิทยาศาสตร์ประยุกต์

## 🏗️ สถาปัตยกรรมระบบ

### Tech Stack

#### Backend
- **Framework**: Node.js + Express.js
- **ORM**: Sequelize
- **Database**: MySQL 8.0 (UTF-8MB4 สำหรับภาษาไทย)
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: SendGrid
- **Real-time**: Socket.io
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Scheduling**: node-cron, node-schedule

#### Frontend
- **Framework**: React 18
- **UI Library**: Ant Design 5
- **Routing**: React Router v6
- **State Management**: Context API + Custom Hooks
- **HTTP Client**: Axios
- **PDF**: @react-pdf/renderer, react-pdf
- **Charts**: Recharts, @ant-design/plots
- **Build Tool**: Custom Webpack Configuration

#### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Version Control**: Git

## 📁 โครงสร้างโปรเจค

```
cslogbook/
├── backend/              # Backend API Server
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic layer
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── agents/          # Background agents (scheduled tasks)
│   ├── migrations/      # Database migrations
│   ├── seeders/         # Database seeders
│   ├── utils/           # Utility functions
│   ├── uploads/         # Uploaded files
│   └── server.js        # Server entry point
│
├── frontend/            # React Frontend Application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   │   ├── admin/   # Admin components
│   │   │   ├── student/ # Student components
│   │   │   ├── teacher/ # Teacher components
│   │   │   └── common/  # Shared components
│   │   ├── features/    # Feature modules
│   │   │   ├── auth/    # Authentication
│   │   │   ├── internship/  # Internship management
│   │   │   ├── project/     # Project management
│   │   │   ├── reports/     # Reports & analytics
│   │   │   ├── settings/   # System settings
│   │   │   └── user-management/  # User management
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API services
│   │   ├── utils/      # Utility functions
│   │   └── routes/     # Route definitions
│   ├── public/         # Static assets
│   └── scripts/        # Build scripts
│
├── database/           # Database initialization
│   └── init/          # SQL initialization scripts
│
├── .github/            # GitHub configuration
│   ├── workflows/      # CI/CD workflows
│   └── copilot-instructions.md  # AI coding instructions
│
├── .agent/             # Cursor AI agent rules
│   └── skills/         # Best practices & guidelines
│
├── docker-compose.yml           # Development Docker setup
└── docker-compose.production.yml  # Production Docker setup
```

## 🎯 ฟีเจอร์หลัก

### 1. การจัดการผู้ใช้ (User Management)
- **Roles**: Admin, Teacher, Student
- **Authentication**: 
  - Email/Password login
  - SSO (Single Sign-On) integration
  - JWT token-based authentication
- **Profile Management**: จัดการข้อมูลส่วนตัวของนักศึกษา อาจารย์ และผู้ดูแลระบบ

### 2. ระบบฝึกงาน (Internship System)
- **Eligibility Check**: ตรวจสอบคุณสมบัติการฝึกงาน
- **Registration Flow**: กระบวนการลงทะเบียนฝึกงาน (CS05)
- **Document Management**: 
  - จัดการเอกสารฝึกงาน
  - อัพโหลดและตรวจสอบเอกสาร
  - อนุมัติ/ปฏิเสธเอกสาร
- **Logbook Management**: 
  - บันทึก logbook การฝึกงาน
  - อนุมัติ logbook โดยอาจารย์ที่ปรึกษา
  - ติดตามความคืบหน้า
- **Time Sheet**: บันทึกชั่วโมงการฝึกงาน
- **Certificate Request**: ขอใบรับรองการฝึกงาน
- **Company Dashboard**: ดูสถิติบริษัทที่รับนักศึกษาฝึกงาน

### 3. ระบบโครงงานพิเศษ (Project System)
- **Phase 1 (Project 1)**:
  - Topic Submission: ส่งหัวข้อโครงงาน
  - Topic Exam: สอบหัวข้อโครงงาน
  - Advisor Assignment: กำหนดอาจารย์ที่ปรึกษา
  - Proposal Submission: ส่งข้อเสนอโครงงาน
  - Defense Request: ขอสอบป้องกันโครงงาน
  - Defense Schedule: จัดตารางสอบ
  - Exam Result: บันทึกผลการสอบ
  
- **Phase 2 (Thesis)**:
  - Thesis Development: พัฒนาวิทยานิพนธ์
  - Thesis Defense Request: ขอสอบป้องกันวิทยานิพนธ์
  - Final Document Submission: ส่งเอกสารฉบับสมบูรณ์

- **Project Management**:
  - สร้าง/แก้ไข/ลบโครงงาน
  - จัดการสมาชิกในโครงงาน
  - ติดตามสถานะโครงงาน
  - Project Tracks: แบ่งตามประเภทโครงงาน

- **Meeting & Logbook**:
  - บันทึกการพบอาจารย์ (Meeting Logs)
  - อนุมัติบันทึกการพบอาจารย์
  - ติดตามจำนวนครั้งที่พบอาจารย์
  - ระบบ logbook สำหรับโครงงาน

### 4. ระบบ Workflow
- **Workflow Step Definition**: กำหนดขั้นตอนการทำงาน
- **Student Workflow Activity**: ติดตามสถานะของนักศึกษาแต่ละคน
- **Status Tracking**: 
  - `not_started`, `pending`, `in_progress`, `completed`, `failed`
  - `awaiting_student_action`, `awaiting_admin_action`
- **Timeline Management**: จัดการ timeline และ deadlines

### 5. ระบบเอกสาร (Document System)
- **Document Upload**: อัพโหลดไฟล์เอกสาร
- **Document Review**: ตรวจสอบและอนุมัติเอกสาร
- **Document Types**:
  - Internship Documents (CS05, CS06, etc.)
  - Project Documents (Proposal, Thesis, etc.)
  - Supporting Documents
- **File Management**: จัดการไฟล์ที่อัพโหลด

### 6. ระบบรายงาน (Reports & Analytics)
- **Internship Reports**: รายงานการฝึกงาน
- **Project Reports**: รายงานโครงงาน
- **Workflow Progress**: ติดตามความคืบหน้า workflow
- **Deadline Compliance**: รายงานการปฏิบัติตาม deadline
- **Advisor Workload**: รายงานภาระงานอาจารย์ที่ปรึกษา
- **Charts & Visualizations**: กราฟและแผนภูมิต่างๆ

### 7. ระบบการตั้งค่า (Settings)
- **Curriculum Settings**: ตั้งค่าหลักสูตรการศึกษา
- **Academic Settings**: ตั้งค่าวิชาการ (ปีการศึกษา, ภาคเรียน)
- **Workflow Steps**: จัดการขั้นตอน workflow
- **Status Settings**: ตั้งค่าสถานะต่างๆ
- **Timeline Settings**: ตั้งค่า timeline
- **Notification Settings**: ตั้งค่าการแจ้งเตือน
- **Document Settings**: ตั้งค่าเอกสาร

### 8. ระบบแจ้งเตือน (Notifications)
- **Email Notifications**: 
  - แจ้งเตือนการ login
  - แจ้งเตือนเกี่ยวกับเอกสาร
  - แจ้งเตือนเกี่ยวกับ logbook
  - แจ้งเตือนการขออนุมัติ meeting
- **Feature Flags**: เปิด/ปิดการส่งอีเมลแต่ละประเภท
- **Approval Tokens**: ระบบอนุมัติผ่านอีเมล (one-click approval)

### 9. ระบบ Deadline
- **Important Deadlines**: จัดการ deadlines สำคัญ
- **Deadline Linking**: เชื่อมโยง deadlines กับเอกสาร
- **Deadline Calendar**: ปฏิทิน deadlines
- **Deadline Reminders**: แจ้งเตือน deadlines

### 10. Background Agents
- **Deadline Reminder Agent**: ส่งแจ้งเตือน deadlines
- **Eligibility Updater**: อัพเดทคุณสมบัติของนักศึกษา
- **Academic Semester Scheduler**: อัพเดทภาคเรียนปัจจุบันอัตโนมัติ

## 🗄️ โครงสร้างฐานข้อมูล

### ตารางหลัก

#### Users & Authentication
- `User`: ข้อมูลผู้ใช้ทั่วไป
- `Student`: ข้อมูลนักศึกษา
- `Teacher`: ข้อมูลอาจารย์
- `Admin`: ข้อมูลผู้ดูแลระบบ

#### Internship
- `InternshipDocument`: เอกสารฝึกงาน
- `InternshipLogbook`: Logbook การฝึกงาน
- `Document`: เอกสารทั่วไป

#### Project
- `ProjectDocument`: เอกสารโครงงาน
- `ProjectMember`: สมาชิกในโครงงาน
- `Meeting`: การพบอาจารย์
- `MeetingLog`: บันทึกการพบอาจารย์

#### Workflow
- `WorkflowStepDefinition`: กำหนดขั้นตอน workflow
- `StudentWorkflowActivity`: สถานะ workflow ของนักศึกษา
- `TimelineStep`: ขั้นตอนใน timeline

#### Academic
- `Academic`: ข้อมูลวิชาการ
- `Curriculum`: หลักสูตรการศึกษา
- `ImportantDeadline`: Deadlines สำคัญ

## 🔧 การติดตั้งและใช้งาน

### Prerequisites
- Node.js >= 18.x
- MySQL 8.0
- Docker & Docker Compose (สำหรับ containerized deployment)
- npm หรือ yarn

### Development Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd cslogbook
```

#### 2. Backend Setup
```bash
cd backend
npm install
npm run setup  # สร้าง .env.development จาก .env.example
# แก้ไข .env.development ตามความเหมาะสม
npm run dev    # รัน development server
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
# สร้าง .env.development
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
npm start      # รัน development server
```

#### 4. Database Setup
```bash
cd backend
npm run migrate  # รัน migrations
npm run seed     # รัน seeders (ข้อมูลเริ่มต้น)
npm run db:check:all  # ตรวจสอบการเชื่อมต่อและ models
```

### Docker Setup

#### Development
```bash
# สร้าง .env.docker จาก template
cp .env.docker.example .env.docker
# แก้ไขค่าต่างๆ ใน .env.docker

docker-compose up -d  # Start all services
docker-compose logs -f backend  # ดู logs
```

#### Production
```bash
# สร้าง .env.production
# แก้ไข docker-compose.production.yml (เปลี่ยน IP addresses)

docker-compose -f docker-compose.production.yml up -d
```

## 🔐 Environment Variables

### Backend (.env.development / .env.production)

#### Required
- `NODE_ENV`: development | production | test
- `PORT`: Port ของ backend server (default: 5000)
- `BASE_URL`: URL ของ backend server
- `FRONTEND_URL`: URL ของ frontend (รองรับหลาย URLs แยกด้วย comma)

#### Database
- `DB_HOST`: Database hostname
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

#### JWT
- `JWT_SECRET`: Secret key สำหรับ JWT (ต้อง >= 32 ตัวอักษร)
- `JWT_EXPIRES_IN`: ระยะเวลาหมดอายุ token (default: 1d)

#### Email (SendGrid)
- `SENDGRID_API_KEY`: SendGrid API key
- `EMAIL_SENDER`: อีเมลผู้ส่ง

#### Feature Flags
- `EMAIL_LOGIN_ENABLED`: เปิด/ปิดอีเมลตอน login
- `EMAIL_DOCUMENT_ENABLED`: เปิด/ปิดอีเมลเกี่ยวกับเอกสาร
- `EMAIL_LOGBOOK_ENABLED`: เปิด/ปิดอีเมลเกี่ยวกับ logbook
- `EMAIL_MEETING_ENABLED`: เปิด/ปิดอีเมลขออนุมัติ meeting

#### Upload
- `UPLOAD_DIR`: Directory สำหรับไฟล์ที่อัพโหลด (default: uploads/)
- `MAX_FILE_SIZE`: ขนาดไฟล์สูงสุด (bytes, default: 5MB)

### Frontend (.env.development / .env.production)
- `REACT_APP_API_URL`: Base URL ของ API (เช่น: http://localhost:5000/api)
- `REACT_APP_UPLOAD_URL`: URL สำหรับไฟล์ที่อัพโหลด (เช่น: http://localhost:5000/uploads)

## 🚀 API Documentation

### Swagger UI
เข้าถึง API documentation ได้ที่:
```
http://localhost:5000/api-docs
```

### API Endpoints หลัก

#### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - ข้อมูลผู้ใช้ปัจจุบัน

#### Internship
- `GET /api/internship/eligibility` - ตรวจสอบคุณสมบัติ
- `POST /api/internship/cs05` - ส่ง CS05
- `GET /api/internship/logbook` - ดู logbook
- `POST /api/internship/logbook` - สร้าง logbook

#### Project
- `GET /api/projects` - รายการโครงงาน
- `POST /api/projects` - สร้างโครงงาน
- `GET /api/projects/:id` - ข้อมูลโครงงาน
- `GET /api/projects/topic-exam/overview` - ภาพรวมการสอบหัวข้อ
- `POST /api/projects/:projectId/meetings` - สร้าง meeting
- `POST /api/projects/:projectId/meetings/:meetingId/logs` - เพิ่ม meeting log

#### Documents
- `POST /api/upload` - อัพโหลดไฟล์
- `GET /api/documents` - รายการเอกสาร
- `POST /api/documents` - สร้างเอกสาร

#### Workflow
- `GET /api/workflow/activities` - สถานะ workflow
- `PUT /api/workflow/activities/:id` - อัพเดท workflow

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test        # Run tests
npm run test:cov    # Run with coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Build & Deployment

### Backend Production Build
```bash
cd backend
npm run build
npm start
```

### Frontend Production Build
```bash
cd frontend
npm run build
# ไฟล์จะอยู่ใน folder build/
```

### Docker Deployment
```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

## 🔄 CI/CD

โปรเจคใช้ GitHub Actions สำหรับ CI/CD:

### Workflows
1. **CI (ci.yml)**: Continuous Integration
   - รัน tests
   - Linting
   - Build verification

2. **Docker Build (docker-build.yml)**: Build และ push Docker images
   - Multi-platform builds
   - Auto-tagging
   - Push to GitHub Container Registry

3. **Deploy (deploy.yml)**: Deploy ไปยัง production
   - SSH deployment
   - Database migrations
   - Health checks

4. **Database Migration (database-migration.yml)**: ตรวจสอบ migrations

## 📚 เอกสารเพิ่มเติม

- `backend/README.md` - Backend documentation
- `frontend/README.md` - Frontend documentation
- `database/README.md` - Database documentation
- `.github/workflows/README.md` - CI/CD documentation
- `.github/copilot-instructions.md` - AI coding instructions

## 🛠️ Development Guidelines

### Code Structure
- **Backend**: Service layer architecture
  - Controllers: Handle HTTP requests/responses
  - Services: Business logic
  - Models: Database models (Sequelize)

- **Frontend**: Feature-based structure
  - Components: Reusable UI components
  - Features: Feature modules (auth, internship, project, etc.)
  - Services: API services
  - Hooks: Custom React hooks
  - Contexts: React contexts

### Naming Conventions
- Files: camelCase สำหรับ JS files, PascalCase สำหรับ React components
- Database: underscored naming (snake_case)
- Models: PascalCase
- Routes: kebab-case URLs

### Database Patterns
- ใช้ Sequelize ORM
- Migrations: timestamp-prefixed (`YYYYMMDDHHMMSS-description.js`)
- Associations: กำหนดใน `models/index.js`
- Multiple associations: ใช้ unique `as` aliases

### API Response Format
```javascript
// Success
{ success: true, data: {...}, message: "..." }

// Error
{ success: false, error: "Error message", details: {...} }
```

## 🔍 Troubleshooting

### ปัญหาที่พบบ่อย

1. **CORS Errors**
   - ตรวจสอบ `FRONTEND_URL` ใน backend .env
   - ตรวจสอบ CORS configuration

2. **Database Connection Issues**
   - ตรวจสอบ database credentials
   - ตรวจสอบว่า MySQL service กำลังรันอยู่
   - ตรวจสอบ port และ host

3. **JWT Errors**
   - ตรวจสอบว่า `JWT_SECRET` มีความยาว >= 32 ตัวอักษร
   - ตรวจสอบ token expiration

4. **File Upload Issues**
   - ตรวจสอบ `UPLOAD_DIR` permissions
   - ตรวจสอบ `MAX_FILE_SIZE` setting

5. **UTF-8 Issues**
   - ตรวจสอบว่า database ใช้ `utf8mb4_unicode_ci`
   - ตรวจสอบ connection charset

## 📝 License

ISC

## 👥 Contributors

CSLogbook Development Team

---

**Last Updated**: January 2025
**Version**: 1.0.0
