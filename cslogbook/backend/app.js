// แยก Express app ออกจาก server.js เพื่อให้ง่ายต่อการทดสอบ (supertest)
require('dotenv').config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env.production'
});

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long-for-jest';
}
if (!process.env.UPLOAD_DIR) process.env.UPLOAD_DIR = 'uploads/';
if (!process.env.MAX_FILE_SIZE) process.env.MAX_FILE_SIZE = '5242880';

const express = require('express');
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
const curriculumRoutes = require('./routes/curriculumRoutes');
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
const projectMembersRoutes = require('./routes/projectMembersRoutes');
const projectWorkflowStateRoutes = require('./routes/projectWorkflowStateRoutes'); // 🆕 Workflow state tracking
const projectTransitionRoutes = require('./routes/projectTransitionRoutes'); // 🆕 Project 2 transition routes

const app = express();

// CORS จัดการที่ server.js เพียงที่เดียว (ไม่ซ้ำที่นี่)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (ใช้ใน test ได้ทันที)
app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// Swagger (ย่อ config สำหรับ test)
const swaggerOptions = {
  swaggerDefinition: { openapi: '3.0.0', info: { title: 'CS Logbook API', version: '1.0.0' } },
  apis: [path.join(__dirname, './routes/**/*.js')]
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Upload config (minimal for test)
const upload = multer({ dest: process.env.UPLOAD_DIR });
if (!fs.existsSync(process.env.UPLOAD_DIR)) fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });
// Static files middleware
// เพิ่มการตั้งค่า MIME type สำหรับไฟล์ .mjs
express.static.mime.define({ 'application/javascript': ['mjs'] });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public & protected routes (ส่วนสำคัญเท่านั้น; บาง route อาจพึ่งพา DB จริง ให้ mock ใน test กรณีจำเป็น)
// SSO Routes (KMUTNB SSO)
const ssoRoutes = require('./routes/ssoRoutes');
app.use('/api/auth/sso', ssoRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/curriculums', curriculumRoutes);
app.use('/api/email-approval', emailApprovalRoutes);
app.use('/api/internship', internshipRoutes);
app.use('/api/internship', internshipCompanyStatsRoutes);
app.use('/api/internship/logbook', logbookRoutes);
app.use('/api/documents', documentsRoutes);
// Public timeline endpoint (ไม่ต้อง auth) — ต้องมาก่อน authenticated timeline
app.use('/api/timeline/public', timelineRoutes);
app.use('/api/timeline', authenticateToken, timelineRoutes);
app.use('/api/workflow', authenticateToken, workflowRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/teachers', authenticateToken, teacherRoutes);
app.use('/api/academic', authenticateToken, academicRoutes);
app.use('/api/projects', authenticateToken, projectRoutes); // 🆕 mount project routes (auth inside route file)
app.use('/api/projects', authenticateToken, projectTransitionRoutes); // 🆕 mount project transition routes
app.use('/api/projects/topic-exam', authenticateToken, topicExamRoutes); // mount overview (มี auth ใน route เองแล้ว)
app.use('/api/projects/workflow-states', projectWorkflowStateRoutes); // 🆕 workflow state API
app.use('/api/project-members', projectMembersRoutes);
app.use('/api', uploadRoutes);

// Template routes
const templateRoutes = require('./routes/template');
app.use('/template', templateRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    code: 'NOT_FOUND',
    message: 'ไม่พบ endpoint ที่ต้องการ' 
  });
});

// Centralized error handler (must be last)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
