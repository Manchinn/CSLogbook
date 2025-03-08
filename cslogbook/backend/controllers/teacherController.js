const pool = require('../config/database');
const bcrypt = require('bcrypt');

function generateRandomStudentID() {
    return Math.random().toString().slice(2, 15); // สุ่มเลข 13 ตัว
}

function generateUsernameFromEmail(email) {
    const [name, domain] = email.split('@');
    const [firstName, lastNameInitial] = name.split('.');
    return `${firstName}.${lastNameInitial.charAt(0)}`.toLowerCase();
  }

exports.getAllTeachers = async (req, res) => {
  try {
    const [teachers] = await pool.execute(`
      SELECT t.id, t.sName, t.firstName, t.lastName, t.email, u.role
      FROM teachers t
      JOIN users u ON t.id = u.id
      WHERE u.role = 'teacher'
    `);
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Error fetching teachers' });
  }
};

exports.addTeacher = async (req, res) => {
  const { sName, firstName, lastName, email } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const username = generateUsernameFromEmail(email);
    const password = username;
    const hashedPassword = await bcrypt.hash(password, 10); // เข้ารหัสรหัสผ่าน

    const studentID = generateRandomStudentID();

    const [result] = await connection.execute(
      'INSERT INTO users (username, password, studentID,firstName, lastName, email, role) VALUES (?, ?, ?, ?, ?, ?, "teacher")',
      [username, hashedPassword, studentID ,firstName, lastName, email]
    );

    const userId = result.insertId;

    // เพิ่มข้อมูลในตาราง teachers
    await connection.execute(
      'INSERT INTO teachers (id, sName, firstName, lastName, email, role) VALUES (?, ?, ?, ?, ?, "teacher")',
      [userId, sName, firstName, lastName, email]
    );

    await connection.commit();
    res.json({ success: true, message: 'เพิ่มอาจารย์เรียบร้อย' });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding teacher:', error.message, error.stack);
    res.status(500).json({ error: 'Error adding teacher' });
  } finally {
    connection.release();
  }
};

exports.updateTeacher = async (req, res) => {
  const { sName } = req.params;
  const { firstName, lastName, email } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // ดึง userId จากตาราง teachers
    const [teacher] = await connection.execute(
      'SELECT id FROM teachers WHERE sName = ?',
      [sName]
    );

    if (teacher.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลอาจารย์' });
    }

    const userId = teacher[0].id;

    // อัพเดทข้อมูลในตาราง users โดยไม่ต้องใส่ studentID
    await connection.execute(
      'UPDATE users SET firstName = ?, lastName = ?, studentID, email = ? WHERE id = ? AND role = "teacher"',
      [firstName, lastName, studentID, email, userId]
    );

    // อัพเดทข้อมูลในตาราง teachers
    await connection.execute(
      'UPDATE teachers SET firstName = ?, lastName = ?, email = ? WHERE id = ?',
      [firstName, lastName, email, userId]
    );

    await connection.commit();
    res.json({ success: true, message: 'แก้ไขข้อมูลอาจารย์เรียบร้อย' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating teacher:', error.message, error.stack);
    res.status(500).json({ error: 'Error updating teacher' });
  } finally {
    connection.release();
  }
};

exports.deleteTeacher = async (req, res) => {
  const { sName } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // ดึง userId จากตาราง teachers
    const [teacher] = await connection.execute(
      'SELECT id FROM teachers WHERE sName = ?',
      [sName]
    );

    if (teacher.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลอาจารย์' });
    }

    const userId = teacher[0].id;

    // ลบข้อมูลในตาราง users
    await connection.execute('DELETE FROM users WHERE id = ? AND role = "teacher"', [userId]);

    // ลบข้อมูลในตาราง teachers
    await connection.execute('DELETE FROM teachers WHERE id = ?', [userId]);

    await connection.commit();
    res.json({ success: true, message: 'ลบอาจารย์เรียบร้อย' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting teacher:', error.message, error.stack);
    res.status(500).json({ error: 'Error deleting teacher' });
  } finally {
    connection.release();
  }
};