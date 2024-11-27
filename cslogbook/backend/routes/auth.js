const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { sendLoginNotification } = require('../utils/mailer');

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    // ใช้ JOIN เพื่อดึงข้อมูลสิทธิ์พร้อมกับข้อมูลผู้ใช้
    const [users] = await pool.execute(`
      SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject 
      FROM users u 
      LEFT JOIN student_data sd ON u.studentID = sd.studentID 
      WHERE u.username = ? AND u.password = ?
    `, [username, password]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password"
      });
    }

    const user = users[0];

    // ส่งอีเมลแจ้งเตือนการล็อกอิน
    const today = new Date().toDateString();
    if (user.lastLoginNotification !== today) {
      try {
        await sendLoginNotification(user.email, user.username);
        await pool.execute(
          'UPDATE users SET lastLoginNotification = CURRENT_TIMESTAMP WHERE username = ?',
          [user.username]
        );
      } catch (error) {
        console.error('Email notification error:', error);
      }
    }

    // ส่งข้อมูลกลับไปยัง client
    res.json({
      success: true,
      message: 'Login successful',
      studentID: user.studentID,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEligibleForInternship: user.isEligibleForInternship || false,
      isEligibleForProject: user.isEligibleForProject || false
    });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

module.exports = router;