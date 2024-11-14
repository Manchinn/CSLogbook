const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mockStudentData = require('./mockStudentData');
const { sendLoginNotification } = require('./utils/mailer');
const { authenticateUser, checkEligibility } = require('./authSystem'); 
const { getUniversityData } = require('./universityAPI');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = 5000;

app.use(cors());
app.use(express.json());


// กำหนดตำแหน่งที่เก็บไฟล์ที่อัปโหลด
const upload = multer({ dest: 'uploads/' });

console.log('Loaded mock student data:', mockStudentData);


// API สำหรับการอัปโหลด CSV
/*
app.post('/upload-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      console.log('Received CSV data:', data);

      // ตรวจสอบข้อมูลที่อัปโหลดว่ามีฟิลด์ที่จำเป็นครบถ้วนหรือไม่
      if (
        !data['Student ID'] || 
        !data['Name'] || 
        !data['Surname'] || 
        !data['Role'] || 
        (data['Internship'].toUpperCase() !== 'TRUE' && data['Internship'].toUpperCase() !== 'FALSE') ||
        (data['Project'].toUpperCase() !== 'TRUE' && data['Project'].toUpperCase() !== 'FALSE')
      ) {
        console.error('Invalid data in CSV file:', data);
        results.push({ studentID: data['Student ID'], status: 'Invalid Data' });
        return;
      }

      // แปลง Student ID ให้เป็น string ปกติ (รองรับการนำเข้าที่เป็น Scientific Notation)
      let studentID = data['Student ID'];
      if (typeof studentID === 'string' && studentID.includes('E')) {
        studentID = parseFloat(studentID).toFixed(0);
      }
      studentID = studentID.toString();

      // ตรวจสอบว่ามีนักศึกษาที่มี studentID เดียวกันอยู่ในระบบหรือไม่
      const existingStudent = mockStudentData.find(
        (student) => student.studentID === studentID
      );

      // ถ้าไม่ซ้ำกัน ให้เพิ่มเข้าไปใน mockStudentData
      if (!existingStudent) {
        const newStudent = {
          studentID: studentID,
          firstName: data['Name'],
          lastName: data['Surname'],
          role: data['Role'],
          isEligibleForInternship: data['Internship'].toUpperCase() === 'TRUE',
          isEligibleForProject: data['Project'].toUpperCase() === 'TRUE',
          lastLoginNotification: null
        };
        mockStudentData.push(newStudent);
        results.push({ 
          studentID, 
          name: data['Name'], 
          surname: data['Surname'], 
          role: data['Role'], 
          isEligibleForInternship: data['Internship'].toUpperCase() === 'TRUE', 
          isEligibleForProject: data['Project'].toUpperCase() === 'TRUE', 
          status: 'Added' 
        });
      } else {
        console.log(`นักศึกษาที่มี studentID ${studentID} มีอยู่แล้ว`);
        results.push({ 
          studentID, 
          name: data['Name'], 
          surname: data['Surname'], 
          role: data['Role'], 
          status: 'Duplicate' 
        });
      }
    })
    .on('end', () => {
      console.log('Final processed data:', results);
      fs.unlinkSync(filePath); // ลบไฟล์หลังจากอ่านเสร็จ
      res.json(results); // ส่งข้อมูลในรูปแบบ array กลับไปยัง frontend
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err);
      res.status(500).json({ error: 'Error reading CSV file' });
    });
});
*/


app.get('/students', (req, res) => {
  console.log('Fetching all student data');
  res.json(mockStudentData);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Received login request:', username);

  const user = authenticateUser(username, password);
  if (user) {
    const eligibility = getUniversityData(user.studentID);

    if (eligibility) {
      const today = new Date().toDateString();

      if (user.lastLoginNotification !== today) {
        try {
          await sendLoginNotification(user.email, user.username);
          user.lastLoginNotification = today;
        } catch (error) {
          console.error('Error sending email:', error);
          res.status(500).json({ error: 'Login successful, but failed to send notification email' });
          return;
        }
      }

      res.json({
        message: 'Login successful',
        studentID: user.studentID,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEligibleForInternship: eligibility.isEligibleForInternship,
        isEligibleForProject: eligibility.isEligibleForProject
      });
    } else {
      res.status(404).json({ error: "Student data not found in university API" });
    }
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
