const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mockStudentData = require('./mockStudentData');
const { sendLoginNotification } = require('./utils/mailer');
const { authenticateUser, checkEligibility } = require('./authSystem'); 
const { getUniversityData } = require('./universityAPI'); 

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


console.log('Loaded mock student data:', mockStudentData);


app.get('/students', (req, res) => {
  console.log('Fetching all student data');
  res.json(mockStudentData);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Received login request:', username);

  const user = authenticateUser(username, password);
  if (user) {
    const universityData = getUniversityData(user.studentID);
    
    if (universityData) {
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
        studentID: universityData.studentID,
        firstName: universityData.firstName,
        lastName: universityData.lastName,
        email: universityData.email,
        role: universityData.role,
      });
    } else {
      res.status(404).json({ error: "Student data not found in university API" });
    }
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

app.get('/check-eligibility/:studentID', (req, res) => {
  const { studentID } = req.params;
  const eligibility = checkEligibility(studentID);

  if (eligibility) {
    res.json({
      studentID,
      ...eligibility
    });
  } else {
    res.status(404).json({ error: 'Student not found' });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
