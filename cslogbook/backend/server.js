const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mockStudentData = require('./mockStudentData');
const { sendLoginNotification } = require('./utils/mailer');
const { authenticateUser, checkEligibility } = require('./authSystem'); 
const { getUniversityData,getAllUniversityData } = require('./universityAPI');
const { updateUniversityData } = require('./universityAPI');
const { validateCSVRow } = require('./utils/csvParser');
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

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']

}));

app.use(express.json());


// กำหนดตำแหน่งที่เก็บไฟล์ที่อัปโหลด
const upload = multer({ dest: 'uploads/' });

console.log('Loaded mock student data:', mockStudentData);


// API สำหรับการอัปโหลด CSV
app.post('/upload-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath, { encoding: 'utf-8' })
    .pipe(csv({
      skipEmptyLines: true,
      trim: true,
    }))
    .on('data', (row) => {
      try{
          const validation = validateCSVRow(row);
          console.log('Processing CSV row:', row);
          console.log('Validation result:', validation);
          
          if (validation.isValid && validation.normalizedData) {
            const { normalizedData } = validation;
            
            // อัปเดต mockStudentData
            const existingStudent = mockStudentData.find(
              student => student.studentID === normalizedData.studentID
            );
            
            if (existingStudent) {
              // อัปเดตข้อมูลที่มีอยู่
              Object.assign(existingStudent, normalizedData);
              // อัปเดตข้อมูล login ด้วย
              const updated = updateUniversityData(normalizedData);
              results.push({
                  ...normalizedData,
                  status: updated ? 'Updated' : 'Update Failed'
              });
            } else {
              // เพิ่มข้อมูลใหม่
              mockStudentData.push(normalizedData);
              // เพิ่มข้อมูล login ใหม่
              const added = updateUniversityData(normalizedData);
              results.push({
                ...normalizedData,
                status: added ? 'Added' : 'Add Failed'
              });
              console.log('Added new student:', normalizedData);
            }
          } else {
            // กรณีข้อมูลไม่ถูกต้อง
            console.log('Invalid data:', row, 'Errors:', validation.errors);
            results.push({
              studentID: row['Student ID'] || '-',
              firstName: row['Name'] || '-',
              lastName: row['Surname'] || '-',
              role: row['Role'] || '-',
              status: 'Invalid',
              errors: validation.errors
            });
          }
        }catch(error){
          console.error('Error processing row:', error);
          results.push({
              ...row,
              status: 'Error',
              error: error.message
          });
        }
    })
    .on('end', () => {
      // เพิ่ม logging ตรงนี้
      console.log('=== CSV Processing Complete ===');
      console.log('Updated mockStudentData:', mockStudentData);
      console.log('Updated universityAPIData:', getAllUniversityData());
      console.log('Final processed results:', results);
      console.log('Updated mockStudentData:', mockStudentData);
      console.log('Summary:', {
        total: results.length,
        added: results.filter(r => r.status === 'Added').length,
        updated: results.filter(r => r.status === 'Updated').length,
        invalid: results.filter(r => r.status === 'Invalid').length
      });
      console.log('===============================');

      fs.unlinkSync(filePath);
      
      res.json({
        success: true,
        results,
        summary: {
          total: results.length,
          added: results.filter(r => r.status === 'Added').length,
          updated: results.filter(r => r.status === 'Updated').length,
          invalid: results.filter(r => r.status === 'Invalid').length
        }
      });
    })
    .on('error', (err) => {
      console.error('Error processing CSV file:', err);
      res.status(500).json({ error: 'Error processing CSV file' });
    });
});

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

// เพิ่ม endpoint สำหรับดึงข้อมูลนักศึกษา
app.get('/api/students', (req, res) => {
  try {
      console.log('Sending student data:', mockStudentData);
      res.json(mockStudentData);
  } catch (error) {
      console.error('Error getting students:', error);
      res.status(500).json({ error: 'Error fetching student data' });
  }
});

// เพิ่ม endpoint สำหรับดึงข้อมูลนักศึกษาตาม ID
app.get('/api/students/:id', (req, res) => {
  try {
      const student = mockStudentData.find(s => s.studentID === req.params.id);
      if (student) {
          res.json(student);
      } else {
          res.status(404).json({ error: 'Student not found' });
      }
  } catch (error) {
      console.error('Error getting student:', error);
      res.status(500).json({ error: 'Error fetching student data' });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
