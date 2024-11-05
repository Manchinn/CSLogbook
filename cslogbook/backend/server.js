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
    email: "s6404062630295@gmail.com"   // อีเมลผู้รับ
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
    // หากล็อกอินสำเร็จ ให้ส่งอีเมลแจ้งเตือน
    sendLoginNotification(student.email, student.username);

    // ส่ง response กลับไปยัง client
    res.json({
      message: 'Login successful',
      studentID: student.studentID,
      firstName: student.firstName,
      lastName: student.lastName
    });

    // แจ้งข้อมูลใหม่แบบ realtime ผ่าน WebSocket
    io.emit('studentUpdate', student);
  } else {
    // หาก username หรือ password ไม่ถูกต้อง ส่ง status 401
    res.status(401).json({ error: "Invalid username or password" });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
