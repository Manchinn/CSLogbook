# CS Logbook Frontend

ระบบจัดการเอกสารฝึกงานและโครงงานสำหรับภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ  
มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB)

## 📋 ภาพรวม

Frontend ของระบบ CSLogbook สร้างด้วย React 18 และ Ant Design 5 ใช้ Custom Webpack Configuration สำหรับการ build และ development

## 🚀 การติดตั้ง

### Prerequisites
- Node.js >= 18.x
- npm หรือ yarn

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ environment variables:
- `.env.development` สำหรับ development
- `.env.production` สำหรับ production

ตัวอย่างการตั้งค่า:
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
```

## 💻 การพัฒนา

### Development Mode
```bash
npm start
```
แอปพลิเคชันจะรันที่ `http://localhost:3000`

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Verify Cleanup
```bash
npm run verify-cleanup
```

## 📦 การ Build สำหรับ Production

1. ตรวจสอบไฟล์ `.env.production`:
```bash
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_UPLOAD_URL=https://your-api-domain.com/uploads
```

2. สร้าง production build:
```bash
npm run build
```

ไฟล์ที่ build จะอยู่ใน folder `build/`

## 📁 โครงสร้างโปรเจค

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # ส่วนผู้ดูแลระบบ
│   │   ├── student/        # ส่วนนักศึกษา
│   │   ├── teacher/        # ส่วนอาจารย์
│   │   ├── common/         # Components ร่วมกัน
│   │   │   ├── Layout/     # Layout components
│   │   │   ├── PDFViewer/  # PDF viewer components
│   │   │   └── DeadlineAlert/  # Deadline alert components
│   │   └── ui/             # UI components
│   │
│   ├── features/           # Feature modules
│   │   ├── auth/           # Authentication
│   │   │   ├── components/ # Login, SSO Callback
│   │   │   └── services/   # Auth services
│   │   │
│   │   ├── internship/     # Internship management
│   │   │   ├── components/
│   │   │   │   ├── admin-view/      # Admin views
│   │   │   │   ├── student-view/    # Student views
│   │   │   │   ├── teacher-view/    # Teacher views
│   │   │   │   └── shared/          # Shared components
│   │   │   ├── hooks/       # Custom hooks
│   │   │   └── services/   # API services
│   │   │
│   │   ├── project/        # Project management
│   │   │   ├── components/
│   │   │   │   ├── admin-view/      # Admin views
│   │   │   │   ├── student-view/    # Student views (Phase1, Phase2)
│   │   │   │   ├── teacher-view/    # Teacher views
│   │   │   │   └── shared/          # Shared components
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── pages/      # Page components
│   │   │   ├── services/   # API services
│   │   │   └── styles/     # Project-specific styles
│   │   │
│   │   ├── reports/        # Reports & Analytics
│   │   │   ├── components/ # Report components & charts
│   │   │   ├── hooks/      # Report hooks
│   │   │   └── services/  # Report services
│   │   │
│   │   ├── settings/       # System settings
│   │   │   └── components/ # Settings components
│   │   │
│   │   ├── user-management/  # User management
│   │   │   ├── components/   # User management components
│   │   │   └── services/     # User services
│   │   │
│   │   └── admin-dashboard/  # Admin dashboard
│   │
│   ├── contexts/          # React Contexts
│   │   ├── AuthContext.js
│   │   ├── InternshipContext.js
│   │   ├── InternshipStatusContext.js
│   │   ├── StudentEligibilityContext.js
│   │   └── adminContext/  # Admin contexts
│   │
│   ├── hooks/             # Custom React Hooks
│   │   ├── admin/         # Admin hooks
│   │   ├── useAllDeadlines.js
│   │   ├── useStudentPermissions.js
│   │   ├── useTopicExamOverview.js
│   │   └── useUpcomingDeadlines.js
│   │
│   ├── services/          # API Services
│   │   ├── admin/         # Admin services
│   │   ├── student/      # Student services
│   │   ├── PDFServices/  # PDF generation services
│   │   ├── apiClient.js  # Axios client configuration
│   │   └── ...
│   │
│   ├── routes/            # Route definitions
│   │   └── index.js       # Lazy-loaded routes
│   │
│   ├── utils/             # Utility functions
│   │   ├── dateUtils.js
│   │   ├── deadlineHelpers.js
│   │   ├── studentUtils.js
│   │   └── ...
│   │
│   ├── constants/         # Constants
│   │   └── projectTracks.js
│   │
│   ├── styles/           # Global styles
│   │   └── variables.css
│   │
│   ├── App.js            # Main App component
│   └── index.js          # Entry point
│
├── public/               # Static assets
│   ├── assets/           # Images, fonts
│   └── ...
│
├── scripts/              # Build scripts
│   ├── start.js          # Development server
│   ├── build.js          # Production build
│   ├── lint.js           # Linting
│   └── verify-cleanup.js # Cleanup verification
│
├── config/               # Configuration files
│   └── docker/           # Docker nginx config
│
├── Dockerfile            # Docker configuration
└── package.json
```

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Base URL ของ API | `http://localhost:5000/api` |
| `REACT_APP_UPLOAD_URL` | URL สำหรับไฟล์ที่อัปโหลด | `http://localhost:5000/uploads` |

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d frontend
```

### Production
```bash
# Build image
docker-compose -f docker-compose.production.yml build frontend

# Start container
docker-compose -f docker-compose.production.yml up -d frontend
```

**หมายเหตุ**: ต้องระบุ `REACT_APP_API_URL` และ `REACT_APP_UPLOAD_URL` เป็น build args ใน Dockerfile

## 📦 Tech Stack

### Core
- **React**: 18.3.1
- **React Router**: 6.27.0
- **Ant Design**: 5.25.1

### State Management
- **Context API**: สำหรับ global state
- **Custom Hooks**: สำหรับ feature-specific state

### HTTP Client
- **Axios**: 1.7.7
- **@tanstack/react-query**: 5.72.0 (สำหรับ data fetching)

### UI Libraries
- **Ant Design**: UI components
- **@ant-design/plots**: Charts and visualizations
- **Recharts**: 3.3.0 (Charts)

### PDF
- **@react-pdf/renderer**: 4.3.0 (PDF generation)
- **react-pdf**: 10.1.0 (PDF viewing)

### Build Tools
- **Webpack**: 5.64.4 (Custom configuration)
- **Babel**: สำหรับ transpilation
- **PostCSS**: สำหรับ CSS processing

### Other
- **dayjs**: 1.11.13 (Date manipulation)
- **socket.io-client**: 4.8.0 (Real-time communication)
- **@dnd-kit**: Drag and drop functionality

## 🎯 Features

### Authentication
- Email/Password login
- SSO (Single Sign-On) integration
- Token-based authentication

### Internship Management
- Eligibility check
- Registration flow (CS05)
- Document management
- Logbook management
- Time sheet tracking
- Certificate request
- Company dashboard

### Project Management
- **Phase 1 (Project 1)**:
  - Topic submission
  - Topic exam
  - Proposal submission
  - Defense request
  - Exam results
- **Phase 2 (Thesis)**:
  - Thesis development
  - Thesis defense request
  - Final document submission
- Meeting & logbook tracking
- Project member management

### Reports & Analytics
- Internship reports
- Project reports
- Workflow progress
- Deadline compliance
- Advisor workload
- Charts and visualizations

### Settings
- Curriculum settings
- Academic settings
- Workflow steps
- Notification settings
- Timeline settings

## 🛠️ Development Guidelines

### Adding New Routes
1. สร้าง component ใน `features/` หรือ `components/`
2. เพิ่ม route ใน `src/routes/index.js` (lazy loading)
3. เพิ่ม route ใน `src/App.js`
4. เพิ่ม navigation ใน `components/common/Layout/`

### Adding New API Service
1. สร้าง service file ใน `src/services/` หรือ `features/[feature]/services/`
2. ใช้ `apiClient.js` สำหรับ Axios configuration
3. Export service functions

### Adding New Hook
1. สร้าง hook file ใน `src/hooks/` หรือ `features/[feature]/hooks/`
2. ใช้ naming convention: `use[FeatureName].js`
3. Export hook

### Component Structure
- ใช้ Ant Design components เป็นหลัก
- ใช้ CSS Modules สำหรับ component-specific styles
- ใช้ Context API สำหรับ shared state

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Static File Serving
ไฟล์ที่ build จะอยู่ใน folder `build/` ต้องตั้งค่า web server ให้:
- Serve static files จาก `build/`
- Redirect ทุก route ไปที่ `index.html` (สำหรับ React Router)

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔍 Troubleshooting

### CORS Errors
- ตรวจสอบ `REACT_APP_API_URL` ใน environment variables
- ตรวจสอบการตั้งค่า CORS ใน backend
- ตรวจสอบว่า backend อนุญาต origin ของ frontend

### Build Errors
- ตรวจสอบ Node.js version (ต้อง >= 18.x)
- ลบ `node_modules` และ `package-lock.json` แล้วรัน `npm install` ใหม่
- ตรวจสอบ console errors

### File Upload Issues
- ตรวจสอบ `REACT_APP_UPLOAD_URL`
- ตรวจสอบ file size limits
- ตรวจสอบ network requests ใน browser DevTools

### Routing Issues
- ตรวจสอบว่า web server ตั้งค่า redirect ไปที่ `index.html` แล้ว
- ตรวจสอบ React Router configuration

## 📝 Important Notes

- ⚠️ **ห้าม commit ไฟล์ `.env` หรือ `.env.local`**
- ✅ ใช้ `.env.example` เป็น template
- ✅ ตรวจสอบ console errors ก่อน deploy
- ✅ ทดสอบการ build ก่อน deploy ทุกครั้ง
- ✅ ใช้ lazy loading สำหรับ routes เพื่อลด bundle size
- ✅ ใช้ React.memo และ useMemo สำหรับ performance optimization

## 📚 Related Documentation

- [Backend README](../backend/README.md)
- [Project Summary](../PROJECT_SUMMARY.md)
- [Ant Design Documentation](https://ant.design/)
- [React Router Documentation](https://reactrouter.com/)
