const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
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
        url: 'http://localhost:5000',
      },
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/swagger/*.js','./server/*js'], // Path to the API docs
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

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",  // เปลี่ยนเป็นใช้จาก env
    methods: ["GET", "POST"]
  }
});

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // เพิ่ม methods ที่จำเป็น
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

// Upload configuration
const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
const upload = multer({ 
  dest: uploadDir,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024
  }
});

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/teachers', authenticateToken, teacherRoutes);
app.use('/api/project-pairs', authenticateToken, studentPairsRoutes); // ใช้ route
app.use('/api/project-proposals', authenticateToken, projectProposalsRoutes); // ใช้ route
app.use('/api/documents', authenticateToken, documentsRoutes); // ใช้ route
app.use('/api/internship-documents',authenticateToken, internshipDocumentsRoutes);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Server startup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});