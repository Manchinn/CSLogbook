const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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
    firstName: "John",
    lastName: "Doe"
  },
  {
    username: "jane_smith",
    password: "password456",
    studentID: "87654321",
    firstName: "Jane",
    lastName: "Smith"
  },{
    username: "jane_smith02",
    password: "12345678",
    studentID: "87654321",
    firstName: "ja",
    lastName: "Smthttttt"
  },
];

// API สำหรับการล็อกอิน
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const student = students.find(
    (stu) => stu.username === username && stu.password === password
  );
  res.json({ message: 'Login successful' });

  if (student) {
    res.json(student);
    // แจ้งข้อมูลใหม่แบบ realtime ผ่าน WebSocket
    io.emit('studentUpdate', student);
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
