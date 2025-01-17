const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // เพิ่มบรรทัดนี้
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { sendLoginNotification } = require('../utils/mailer');

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    // ดึงข้อมูลผู้ใช้และสิทธิ์
    const [users] = await pool.execute(`
      SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject 
      FROM users u 
      LEFT JOIN student_data sd ON u.studentID = sd.studentID 
      WHERE u.username = ? AND u.password = ?
    `, [username, password]); // เปลี่ยนเป็นเช็ค password ตรงๆ
    console.log('Found users:', users.length); // เพิ่ม log


    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password"
      });
    }

    const user = users[0];
    console.log('User found:', { id: user.id, username: user.username });

    // เปรียบเทียบรหัสผ่านตรงๆ (เนื่องจากในฐานข้อมูลไม่ได้ hash)
    const isPasswordValid = user.password === password;
    console.log('Password match:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
      });
    }

        // สร้าง JWT token
        const token = jwt.sign(
          {
            userId: user.id,
            studentID: user.studentID,
            role: user.role,
            firstName: user.firstName, // เพิ่มข้อมูลที่จำเป็น
            lastName: user.lastName,
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

    // เพิ่ม log ก่อนส่ง response
    console.log('Token created for user:', {
      userId: user.id,
      role: user.role,
      studentID: user.studentID
    });

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
      token,
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
