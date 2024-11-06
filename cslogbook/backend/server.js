const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mockStudentData = require('./mockStudentData'); // นำเข้าข้อมูล mock
const { sendLoginNotification } = require('./utils/mailer'); // นำเข้าฟังก์ชันจาก mailer.js

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

// API สำหรับการเรียกดูข้อมูลนักศึกษาทั้งหมด
app.get('/students', (req, res) => {
  // ส่งข้อมูล mock ไปยัง client
  res.json(mockStudentData);
});

// API สำหรับการล็อกอิน
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // ค้นหานักศึกษาจาก mock data
  const student = mockStudentData.find(
    (stu) => stu.username === username && stu.password === password
  );

  if (student) {
    const today = new Date().toDateString();

    // ตรวจสอบว่าเคยส่งอีเมลแจ้งเตือนแล้วในวันนี้หรือไม่
    if (student.lastLoginNotification !== today) {
      try {
        await sendLoginNotification(student.email, student.username); // ส่งอีเมลแจ้งเตือน
        student.lastLoginNotification = today; // อัปเดตวันที่ล่าสุดที่ส่งอีเมล
      } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Login successful, but failed to send notification email' });
        return;
      }
    }

    // ส่งข้อมูลการเข้าสู่ระบบกลับไปยัง client
    res.json({
      message: 'Login successful',
      studentID: student.studentID,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email
    });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

// API สำหรับตรวจสอบสิทธิ์ในการฝึกงานและทำโปรเจกต์
app.get('/check-eligibility/:studentID', (req, res) => {
  const { studentID } = req.params;
  const student = mockStudentData.find((stu) => stu.studentID === studentID);

  if (student) {
    res.json({
      studentID: student.studentID,
      isEligibleForInternship: student.isEligibleForInternship,
      isEligibleForProject: student.isEligibleForProject
    });
  } else {
    res.status(404).json({ error: 'Student not found' });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
