const express = require('express');
const router = express.Router();

// แก้ไขการ import ให้ถูกต้อง
const { authenticateUser } = require('../universityAPI');
const { getUniversityData } = require('../universityAPI');
const { sendLoginNotification } = require('../utils/mailer');
const { checkEligibility } = require('../authSystem');

// Login route
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    const user = authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid username or password" 
      });
    }

    const eligibility = getUniversityData(user.studentID);
    if (!eligibility) {
      return res.status(404).json({ 
        success: false,
        error: "Student data not found" 
      });
    }

    // เพิ่มการตรวจสอบสิทธิ์
    const eligibilityStatus = await checkEligibility(user.studentID);
    
    const today = new Date().toDateString();
    if (user.lastLoginNotification !== today) {
      try {
        await sendLoginNotification(user.email, user.username, user.firstName, user.lastName);
        user.lastLoginNotification = today;
      } catch (error) {
        console.error('Email notification error:', error);
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      studentID: user.studentID,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEligibleForInternship: eligibilityStatus?.isEligibleForInternship,
      isEligibleForProject: eligibilityStatus?.isEligibleForProject
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;