const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendLoginNotification } = require('../utils/mailer');


exports.login = async (req, res, next) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });
    try {
        const [users] = await pool.execute(`
SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject 
FROM users u 
LEFT JOIN student_data sd ON u.studentID = sd.studentID 
WHERE u.username = ?
`, [username]);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: "ชื่อผู้ใช้ไม่ถูกต้อง"
            });
        }

        const user = users[0];

        // เปรียบเทียบรหัสผ่านโดยใช้ bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password match:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: "รหัสผ่านผู้ใช้ไม่ถูกต้อง"
            });
        }

        // สร้าง JWT token
        const token = jwt.sign({
            userId: user.id,
            role: user.role,
            studentID: user.studentID,
            firstName: user.firstName,
            lastName: user.lastName,
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

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
}