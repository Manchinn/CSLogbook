// แยก Express app ออกจาก server.js เพื่อให้ง่ายต่อการทดสอบ (supertest)
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long-for-jest';
}
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = 'http://localhost:3000';
if (!process.env.UPLOAD_DIR) process.env.UPLOAD_DIR = 'uploads/';
if (!process.env.MAX_FILE_SIZE) process.env.MAX_FILE_SIZE = '5242880';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Routes & middleware
const { authenticateToken } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const academicRoutes = require('./routes/academicRoutes');
const uploadRoutes = require('./routes/upload');
const internshipRoutes = require('./routes/documents/internshipRoutes');
const internshipCompanyStatsRoutes = require('./routes/internshipCompanyStatsRoutes');
const logbookRoutes = require('./routes/documents/logbookRoutes');
const timelineRoutes = require('./routes/timelineRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const reportRoutes = require('./routes/reportRoutes');
const documentsRoutes = require('./routes/documents/documentsRoutes');
const emailApprovalRoutes = require('./routes/emailApprovalRoutes');
const projectRoutes = require('./routes/projectRoutes'); // 🆕 Project lifecycle routes
const topicExamRoutes = require('./routes/topicExamRoutes'); // 🆕 Topic Exam Overview

const app = express();

// Basic CORS & JSON middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (ใช้ใน test ได้ทันที)
app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// Swagger (ย่อ config สำหรับ test)
const swaggerOptions = {
  swaggerDefinition: { openapi: '3.0.0', info: { title: 'CS Logbook API', version: '1.0.0' } },
  apis: [ path.join(__dirname, './routes/**/*.js') ]
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Upload config (minimal for test)
const upload = multer({ dest: process.env.UPLOAD_DIR });
if (!fs.existsSync(process.env.UPLOAD_DIR)) fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public & protected routes (ส่วนสำคัญเท่านั้น; บาง route อาจพึ่งพา DB จริง ให้ mock ใน test กรณีจำเป็น)
app.use('/api/auth', authRoutes);
app.use('/api/email-approval', emailApprovalRoutes);
app.use('/api/internship', internshipRoutes);
app.use('/api/internship', internshipCompanyStatsRoutes);
app.use('/api/internship/logbook', logbookRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/timeline', authenticateToken, timelineRoutes);
app.use('/api/workflow', authenticateToken, workflowRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/teachers', authenticateToken, teacherRoutes);
app.use('/api/academic', authenticateToken, academicRoutes);
app.use('/api/projects', authenticateToken, projectRoutes); // 🆕 mount project routes (auth inside route file)
app.use('/api/projects/topic-exam', authenticateToken, topicExamRoutes); // mount overview (มี auth ใน route เองแล้ว)
app.use('/api', uploadRoutes);

// เส้นทางดาวน์โหลดไฟล์เทมเพลต CSV สำหรับอัปโหลดรายชื่อนักศึกษา
app.get('/template/download-template', (req, res) => {
  const filePath = path.join(__dirname, 'templates/student_template.csv');

  res.download(filePath, 'student_template.csv', (err) => {
    if (err) {
      console.error('Error downloading template:', err);
      res.status(500).send('Error downloading template');
    }
  });
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

module.exports = app;
