// Load environment variables first
require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

// ตรวจสอบ NODE_ENV ก่อน
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'; // set default
}

// Validate JWT environment variables early
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

// Import dependencies
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const validateEnv = require('./utils/validateEnv');

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

  Object.entries(serverVars).forEach(([key, validator]) => {
    const value = process.env[key];
    if (!value || !validator(value)) {
      throw new Error(`Invalid or missing ${key}`);
    }
  });
};

// Validate all configurations
try {
  validateServerEnv();
  validateEnv('all');
  console.log('Environment validation successful');
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}

// Initialize validated environment variables
const ENV = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT, 10),
  FRONTEND_URL: process.env.FRONTEND_URL,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10)
};

const { authenticateToken, checkRole } = require('./middleware/authMiddleware');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teacherRoutes');
const projectProposalsRoutes = require('./routes/projectProposals'); // นำเข้า route
const studentPairsRoutes = require('./routes/studentpairsRoutes'); // นำเข้า route
const documentsRoutes = require('./routes/documents'); // นำเข้า route
const internshipDocumentsRoutes = require('./routes/internshipDocuments'); // นำเข้า route
const uploadRoutes = require('./routes/upload'); // เพิ่มการนำเข้า route
const logbookRoutes = require('./routes/logbookRoutes'); // นำเข้า route

const app = express();
const server = http.createServer(app);
const pool = require('./config/database');

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

// Error handling database
app.use((err, req, res, next) => {
  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({ error: 'Database connection failed' });
  }
  next(err);
});

// Socket.IO setup with validated FRONTEND_URL
const io = new Server(server, {
  cors: {
    origin: ENV.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration with validated FRONTEND_URL
app.use(cors({
  origin: ENV.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // เพิ่ม methods ที่จำเป็น
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

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

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/teachers', authenticateToken, teacherRoutes);
app.use('/api/project-pairs', authenticateToken, studentPairsRoutes); // ใช้ route
app.use('/api/project-proposals', authenticateToken, projectProposalsRoutes); // ใช้ route
app.use('/api/documents', authenticateToken, documentsRoutes); // ใช้ route
app.use('/api/internship-documents', authenticateToken, internshipDocumentsRoutes);
app.use('/api/logbooks', authenticateToken, logbookRoutes); // ใช้ route

// Protected upload route - เฉพาะ admin เท่านั้น
app.use('/api', uploadRoutes); // ใช้ route

// Route to download CSV template
app.get('/template/download-template', (req, res) => {
  const filePath = path.join(__dirname, 'templates/student_template.csv');
  res.download(filePath, 'student_template.csv', (err) => {
    if (err) {
      console.error('Error downloading template:', err);
      res.status(500).send('Error downloading template');
    }
  });
});

// API สำหรับอัปโหลดไฟล์พร้อมข้อมูล companyInfo
app.post('/upload-with-info', upload.single('file'), (req, res) => {
  const { companyInfo } = req.body;
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  if (!companyInfo) {
    return res.status(400).send('No company info provided');
  }

  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ fileUrl, companyInfo: JSON.parse(companyInfo) });
});

// API สำหรับดึง URL ของไฟล์ PDF
app.get('/get-pdf-url', (req, res) => {
  // ตัวอย่างการดึง URL ของไฟล์ PDF จากฐานข้อมูล
  const fileUrl = 'http://localhost:5000/uploads/11f0792f49b68ca6e50194c134637904';
  res.json({ fileUrl });
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  // Handle specific errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      details: ENV.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: ENV.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    details: ENV.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Server startup with validated PORT
server.listen(ENV.PORT, () => {
  console.log(`Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
  console.log(`Frontend URL: ${ENV.FRONTEND_URL}`);
  console.log(`Upload directory: ${ENV.UPLOAD_DIR}`);
  console.log(`Max file size: ${ENV.MAX_FILE_SIZE / (1024 * 1024)}MB`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Unhandled rejection handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});