const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const { uploadCSV } = require('./routes/upload');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  methods: ['GET', 'POST'],
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

// Routes
app.use('/auth', authRoutes); // Login จะอยู่ที่ /auth/login
app.use('/api/students', studentRoutes);

// CSV upload route
app.post('/upload-csv', upload.single('file'), uploadCSV);

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