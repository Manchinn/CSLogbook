const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sendLoginNotification } = require('./utils/mailer'); // เรียกใช้ฟังก์ชันจาก mailer.js

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",  // อนุญาตให้ frontend เชื่อมต่อ
    methods: ["GET", "POST"]
  }
});

const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mock ข้อมูลนักศึกษา
const students = [
  {
    username: "admin",
    password: "admin",
    studentID: "12345678",
    firstName: "Chinnakrit",
    lastName: "Sripan",
    email: "s6404062630295@email.kmutnb.ac.th"   // อีเมลผู้รับ
  },
  {
    username: "jane_smith",
    password: "password456",
    studentID: "87654321",
    firstName: "Jane",
    lastName: "Smith"
  }
];

// API สำหรับการล็อกอิน
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const student = students.find(
    (stu) => stu.username === username && stu.password === password
  );

  if (student) {
    try {
      sendLoginNotification(student.email, student.username); // ส่งอีเมลแจ้งเตือน
      res.json({
        message: 'Login successful',
        studentID: student.studentID,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email
      });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send notification email' });
    }
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
