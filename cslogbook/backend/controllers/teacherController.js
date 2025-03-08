const pool = require('../config/database');
const bcrypt = require('bcrypt');

function generateUsernameFromEmail(email) {
    const [name, domain] = email.split('@');
    const [firstName, lastNameInitial] = name.split('.');
    return `${firstName}.${lastNameInitial.charAt(0)}`.toLowerCase();
  }

exports.getAllTeachers = async (req, res) => {
  try {
    const [teachers] = await pool.execute(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        t.teacher_code,
        t.contact_extension,
        DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(u.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
      FROM users u
      JOIN teachers t ON u.user_id = t.user_id
      WHERE u.role = 'teacher' AND u.active_status = true
    `);
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอาจารย์' });
  }
};

exports.addTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { 
      teacher_code,
      first_name,
      last_name,
      email,
      contact_extension 
    } = req.body;

    await connection.beginTransaction();

    // สร้าง username จาก email
    const username = generateUsernameFromEmail(email);
    const password = username;
    const hashedPassword = await bcrypt.hash(password, 10);

    // เพิ่มข้อมูลในตาราง users พร้อม timestamp
    const [userResult] = await connection.execute(`
      INSERT INTO users (
        username,
        password,
        email,
        first_name,
        last_name,
        role,
        active_status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 'teacher', true, NOW(), NOW())`,
      [username, hashedPassword, email, first_name, last_name]
    );

    // เพิ่มข้อมูลในตาราง teachers พร้อม timestamp
    await connection.execute(`
      INSERT INTO teachers (
        user_id,
        teacher_code,
        contact_extension,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, NOW(), NOW())`,
      [userResult.insertId, teacher_code, contact_extension]
    );

    await connection.commit();
    res.json({
      success: true,
      message: 'เพิ่มอาจารย์เรียบร้อย',
      data: {
        username,
        password // ส่งรหัสผ่านก่อนการ hash กลับไปแสดงผล
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding teacher:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลอาจารย์' });
  } finally {
    connection.release();
  }
};

exports.updateTeacher = async (req, res) => {
  const { userId } = req.params;
  const {
    teacher_code,
    first_name,
    last_name,
    email,
    contact_extension
  } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!teacher_code || !first_name || !last_name || !email || !contact_extension) {
    return res.status(400).json({
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // อัพเดทข้อมูลในตาราง users พร้อม timestamp
    await connection.execute(`
      UPDATE users 
      SET first_name = ?,
          last_name = ?,
          email = ?,
          updated_at = NOW()
      WHERE user_id = ? AND role = 'teacher'`,
      [first_name, last_name, email, userId]
    );

    // อัพเดทข้อมูลในตาราง teachers พร้อม timestamp
    await connection.execute(`
      UPDATE teachers 
      SET teacher_code = ?,
          contact_extension = ?,
          updated_at = NOW()
      WHERE user_id = ?`,
      [teacher_code, contact_extension, userId]
    );

    await connection.commit();
    res.json({ success: true, message: 'แก้ไขข้อมูลอาจารย์เรียบร้อย' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating teacher:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลอาจารย์' });
  } finally {
    connection.release();
  }
};

exports.deleteTeacher = async (req, res) => {
  const { userId } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // ลบข้อมูลจากตาราง teachers ก่อน (foreign key constraint)
    await connection.execute(
      'DELETE FROM teachers WHERE user_id = ?',
      [userId]
    );

    // ลบข้อมูลจากตาราง users
    await connection.execute(
      'DELETE FROM users WHERE user_id = ? AND role = "teacher"',
      [userId]
    );

    await connection.commit();
    res.json({ success: true, message: 'ลบข้อมูลอาจารย์เรียบร้อย' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting teacher:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลอาจารย์' });
  } finally {
    connection.release();
  }
};