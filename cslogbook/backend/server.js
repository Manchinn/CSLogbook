// Load environment variables first
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

// ตรวจสอบ NODE_ENV ก่อน
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'; // set default
}

// Set default values for required environment variables if not present
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-must-be-at-least-32-characters-long';
  console.warn('⚠️  JWT_SECRET not found, using default value. Please set JWT_SECRET in your .env file for production.');
}

if (!process.env.PORT) {
  process.env.PORT = '5000';
}

if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'http://localhost:3000';
}

if (!process.env.UPLOAD_DIR) {
  process.env.UPLOAD_DIR = 'uploads/';
}

if (!process.env.MAX_FILE_SIZE) {
  process.env.MAX_FILE_SIZE = '5242880';
}

// Import dependencies
const express = require('express'); // retained for potential legacy refs
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const validateEnv = require('./utils/validateEnv');

// นำเข้า Agent Manager
const agentManager = require('./agents');

// Validate server-specific environment variables
const validateServerEnv = () => {
  // Required server variables
  const serverVars = {
    NODE_ENV: (val) => ['development', 'production', 'test'].includes(val),
    PORT: (val) => !isNaN(val) && val > 0,
    FRONTEND_URL: (val) => {
      try {
        new URL(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    UPLOAD_DIR: (val) => typeof val === 'string' && val.length > 0,
    MAX_FILE_SIZE: (val) => !isNaN(val) && val > 0
  };

  // ตรวจ ALLOWED_ORIGINS (เพิ่มเตือน production ถ้าไม่ได้ตั้งค่า)
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
    console.warn('⚠️  ALLOWED_ORIGINS not set in production — CORS and Socket.io will only allow localhost');
  }

  const warnings = [];
  Object.entries(serverVars).forEach(([key, validator]) => {
    const value = process.env[key];
    if (!value || !validator(value)) {
      warnings.push(`Warning: Invalid or missing ${key}`);
    }
  });

  if (warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    warnings.forEach(warning => console.warn(warning));
  }
};

// Validate configurations with warnings instead of errors
try {
  validateServerEnv();
  // Only validate database in development mode
  if (process.env.NODE_ENV === 'development') {
    try {
      validateEnv('database');
    } catch (error) {
      console.warn('⚠️  Database configuration warning:', error.message);
    }
  }
  console.log('✅ Environment validation completed');
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  console.log('🔄 Continuing with default values...');
}

// Initialize validated environment variables
const ENV = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT, 10),
  FRONTEND_URL: process.env.FRONTEND_URL,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10),
  BASE_URL: process.env.BASE_URL // Optional: Set in .env for production
};

// --- Preflight Migration Check (สำคัญ: ตรวจ schema important_deadlines มี policy fields ก่อน start) ---
// ลดความเสี่ยง deploy โดยลืมรัน migration ลำดับใหม่
async function preflightCheck() {
  try {
    const { sequelize } = require('./config/database');
    // ใช้ describeTable ตรวจคอลัมน์จำเป็น
    const requiredCols = [
      'deadline_at', 'accepting_submissions', 'allow_late', 'lock_after_deadline',
      'grace_period_minutes', 'deadline_type', 'window_start_at', 'window_end_at'
    ];
    let missing = [];
    try {
      const desc = await sequelize.getQueryInterface().describeTable('important_deadlines');
      for (const c of requiredCols) {
        if (!desc[c]) missing.push(c);
      }
    } catch (e) {
      console.warn('⚠️  Preflight: describeTable important_deadlines ล้มเหลว:', e.message);
      return; // ไม่ block แต่เตือน
    }
    if (missing.length) {
      console.warn('⚠️  IMPORTANT: ตาราง important_deadlines ขาดคอลัมน์ใหม่ (อาจยังไม่รัน migration):', missing.join(', '));
      console.warn('➡️  โปรดรัน: npx sequelize-cli db:migrate (ตรวจลำดับ: important_deadlines ก่อน documents)');
    } else {
      console.log('✅ Preflight important_deadlines schema OK');
    }
  } catch (err) {
    console.warn('⚠️  Preflight check general error:', err.message);
  }
}

// fire & forget (ไม่ block server start)
preflightCheck();

const { authenticateToken, checkRole } = require('./middleware/authMiddleware');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import routes
const authRoutes = require('./routes/authRoutes');
const ssoRoutes = require('./routes/ssoRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const uploadRoutes = require('./routes/upload'); // 
const documentsRoutes = require('./routes/documents/documentsRoutes'); // ✅ เพิ่ม documents routes สำหรับ student ใช้งาน
const internshipRoutes = require('./routes/documents/internshipRoutes');
const internshipCompanyStatsRoutes = require('./routes/internshipCompanyStatsRoutes');
const logbookRoutes = require('./routes/documents/logbookRoutes');
const timelineRoutes = require('./routes/timelineRoutes'); // เพิ่มการนำเข้า timelineRoutes
const workflowRoutes = require('./routes/workflowRoutes');
const adminRoutes = require('./routes/adminRoutes');
const emailApprovalRoutes = require('./routes/emailApprovalRoutes');
const academicRoutes = require('./routes/academicRoutes'); // เพิ่ม academicRoutes
const curriculumRoutes = require('./routes/curriculumRoutes');
const reportRoutes = require('./routes/reportRoutes'); // รายงานใหม่
const topicExamRoutes = require('./routes/topicExamRoutes'); // NEW: topic exam overview
// ใช้ app ที่แยกใน app.js สำหรับ test-friendly (CORS mount ใน app.js แล้ว)
const app = require('./app');
const server = http.createServer(app);
const pool = require('./config/database');

// เพิ่มก่อน middleware อื่นๆ
app.set('trust proxy', 1);

// ดึง allowedOrigins จาก shared config — ใช้กับ Socket.io CORS ด้านล่าง
const { buildAllowedOrigins } = require('./config/corsOrigins');
const allowedOrigins = buildAllowedOrigins();

// express.json, urlencoded, routes ทั้งหมด mount ใน app.js แล้ว (single source of truth)

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'CS Logbook API',
      version: '1.0.0',
      description: 'API documentation for CS Logbook',
    },
    servers: [
      {
        url: ENV.BASE_URL || `http://localhost:${ENV.PORT}`,
        description: `${ENV.NODE_ENV} server`
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, './routes/swagger/*.js'),
    path.join(__dirname, './routes/**/*.js'),
    path.join(__dirname, 'server.js')
  ]
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
// ให้บริการสเปค OpenAPI ในรูปแบบ JSON สำหรับการเชื่อมต่อจากเครื่องมือภายนอก (เช่น MCP OpenAPI server)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});

// Socket.IO setup with validated FRONTEND_URL + auth room binding
const io = new Server(server, {
  cors: {
    // ใช้ allowedOrigins เดียวกันกับ Express CORS (ไม่ใช้ FRONTEND_URL single string)
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
// เก็บ io ใน app สำหรับ controller/service เรียกใช้
app.set('io', io);
// Initialize notification service with Socket.io
const notificationService = require('./services/notificationService');
notificationService.init(io);

// Middleware แบบง่ายสำหรับ map token -> userId แล้ว join room เฉพาะ (ต้องปรับถ้ามี auth ที่ซับซ้อน)
io.use((socket, next) => {
  // ตัวอย่าง: รับ token จาก query หรือ headers (frontend สามารถแนบ ?token= )
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(); // อนุญาตเชื่อมต่อแบบไม่ระบุตัวตน (จะไม่ได้ room ส่วนตัว)
  }
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = payload.userId || payload.id;
  } catch (e) {
    console.warn('Socket auth invalid token:', e.message);
  }
  next();
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  if (userId) {
    socket.join(`user_${userId}`);
    console.log(`Socket connected & joined room user_${userId}`);
  } else {
    console.log('Socket connected (guest)');
  }

  socket.on('joinUserRoom', (uid) => {
    if (uid && Number(uid) === userId) {
      socket.join(`user_${uid}`);
    }
  });

  socket.on('disconnect', () => {
    // log optional
  });
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

// Upload configuration with validated values
const upload = multer({
  dest: ENV.UPLOAD_DIR,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Add file type validation if needed
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    } else {
      cb(null, true);
    }
  }
});

// Validate upload directory exists
if (!fs.existsSync(ENV.UPLOAD_DIR)) {
  console.log(`Creating upload directory: ${ENV.UPLOAD_DIR}`);
  fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true });
}

// Routes และ static files (/uploads, /api/*, /template) mount ครบใน app.js แล้ว
// server.js จัดการเฉพาะ: Socket.io, swagger (ใช้ BASE_URL จริง), server.listen

// API สำหรับอัปโหลดไฟล์พร้อมข้อมูล companyInfo
app.post('/upload-with-info', upload.single('file'), (req, res) => {
  const { companyInfo } = req.body;
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  if (!companyInfo) {
    return res.status(400).send('No company info provided');
  }

  // Use BASE_URL from env or construct from request
  const baseUrl = ENV.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ fileUrl, companyInfo: JSON.parse(companyInfo) });
});

// API สำหรับดึง URL ของไฟล์ PDF
app.get('/get-pdf-url', (req, res) => {
  // ตัวอย่างการดึง URL ของไฟล์ PDF จากฐานข้อมูล
  const baseUrl = ENV.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/uploads/11f0792f49b68ca6e50194c134637904`;
  res.json({ fileUrl });
});

// Enhanced error handling (moved to middleware/errorHandler.js)
// Note: Error handler is now in app.js to ensure it's the last middleware

// Start server (แยกจาก app เพื่อให้ supertest ใช้ app โดยตรง)
server.listen(ENV.PORT, () => {
  console.log(`Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
  console.log(`Frontend URL: ${ENV.FRONTEND_URL}`);
  console.log(`Upload directory: ${ENV.UPLOAD_DIR}`);
  console.log(`Max file size: ${ENV.MAX_FILE_SIZE / (1024 * 1024)}MB`);

  // เริ่มการทำงานของ Agent หลังจาก server เริ่มทำงาน
  const enableAllAgents = process.env.ENABLE_AGENTS === 'true' || ENV.NODE_ENV === 'production';
  const enableAcademicSchedulerOnly = !enableAllAgents && (process.env.ACADEMIC_AUTO_UPDATE_ENABLED || '').toLowerCase() === 'true';

  if (enableAllAgents) {
    console.log('Starting CSLogbook Agents...');
    // เริ่ม Agent ทุกตัวพร้อมกัน
    agentManager.startAllAgents();

    // หรือจะเริ่มทีละ Agent ก็ได้
    // agentManager.startAgent('deadlineReminder');
    // agentManager.startAgent('documentMonitor');
    // agentManager.startAgent('securityMonitor');
    // agentManager.startAgent('logbookQualityMonitor');
    // agentManager.startAgent('eligibilityChecker');

    console.log('CSLogbook Agents started successfully');
  } else if (enableAcademicSchedulerOnly) {
    console.log('Starting Academic Semester Scheduler (auto-update only)...');
    try {
      agentManager.startAgent('academicSemesterScheduler');
      console.log('Academic Semester Scheduler started');
    } catch (error) {
      console.error('Failed to start Academic Semester Scheduler:', error.message);
    }
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');

  // หยุดการทำงานของ Agent ก่อนปิด server
  if (agentManager.isRunning) {
    console.log('Stopping CSLogbook Agents...');
    agentManager.stopAllAgents();
  }

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// SIGINT handler (Ctrl+C)
process.on('SIGINT', () => {
  console.info('SIGINT signal received.');

  // หยุดการทำงานของ Agent ก่อนปิด server
  if (agentManager.isRunning) {
    console.log('Stopping CSLogbook Agents...');
    agentManager.stopAllAgents();
  }

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Unhandled rejection handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// ส่งออก server และ app (ถ้าจำเป็นสำหรับ integration test ขั้นสูง)
module.exports = { app, server };
