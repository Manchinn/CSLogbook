const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { calculateStudentYear, isEligibleForInternship, isEligibleForProject } = require('../utils/studentUtils');


exports.getAllStudents = async (req, res, next) => {
  try {
    console.log('User accessing student list:', req.user);

    const [students] = await pool.execute(`
      SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject 
      FROM users u 
      LEFT JOIN student_data sd ON u.studentID = sd.studentID 
      WHERE u.role = 'student'
    `);

    console.log('Sending student data, count:', students.length);
    res.json(students);
  } catch (error) {
    console.error('Error in student list route:', error);
    next(error);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    console.log('Requesting student data:', {
      requestedId: req.params.id,
      userId: req.user.studentID,
      userRole: req.user.role
    });

    if (req.user.role === 'admin' || req.user.studentID === req.params.id) {
      const [student] = await pool.execute(`
        SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject 
        FROM users u 
        LEFT JOIN student_data sd ON u.studentID = sd.studentID 
        WHERE u.studentID = ?
      `, [req.params.id]);

      if (!student[0]) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษา' });
      }
      res.json(student[0]);
    } else {
      res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' });
    }
  } catch (error) {
    next(error);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { totalCredits, majorCredits } = req.body;

    // ดึงข้อมูลปัจจุบันของนักศึกษาจากฐานข้อมูล
    const [currentStudent] = await pool.execute(`
    SELECT u.firstName, u.lastName, sd.totalCredits, sd.majorCredits
    FROM users u
    LEFT JOIN student_data sd ON u.studentID = sd.studentID
    WHERE u.studentID = ?
  `, [id]);

    if (currentStudent.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษา' });
    }

    const student = currentStudent[0];
    const studentYear = calculateStudentYear(id);

    const eligibleForInternship = isEligibleForInternship(studentYear, totalCredits !== undefined ? totalCredits : student.totalCredits);
    const eligibleForProject = isEligibleForProject(studentYear, totalCredits !== undefined ? totalCredits : student.totalCredits, majorCredits !== undefined ? majorCredits : student.majorCredits);

    // ตรวจสอบและตั้งค่า default สำหรับค่าที่เป็น undefined
    const safeTotalCredits = totalCredits !== undefined ? totalCredits : student.totalCredits;
    const safeMajorCredits = majorCredits !== undefined ? majorCredits : student.majorCredits;

    await pool.execute(`
      UPDATE student_data 
      SET totalCredits = ?, majorCredits = ?, isEligibleForInternship = ?, isEligibleForProject = ?
      WHERE studentID = ?
    `, [safeTotalCredits, safeMajorCredits, eligibleForInternship.eligible, eligibleForProject.eligible, id]);

    res.json({ success: true, message: 'แก้ไขข้อมูลนักศึกษาเรียบร้อย' });
  } catch (error) {
    console.error('Error updating student:', error);
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(`
      DELETE FROM users WHERE studentID = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษา' });
    }

    await pool.execute(`
      DELETE FROM student_data WHERE studentID = ?
    `, [id]);

    res.json({ success: true, message: 'ลบข้อมูลนักศึกษาเรียบร้อย' });
  } catch (error) {
    console.error('Error deleting student:', error);
    next(error);
  }
};

exports.addStudent = async (req, res, next) => {
  try {
    const { studentID, firstName, lastName, email, totalCredits, majorCredits } = req.body;

    const username = `s${studentID}`;
    const password = studentID;

    const studentYear = calculateStudentYear(studentID);
    const eligibleForInternship = isEligibleForInternship(studentYear, totalCredits);
    const eligibleForProject = isEligibleForProject(studentYear, totalCredits, majorCredits);

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(`
      INSERT INTO users (studentID, username, password, firstName, lastName, email, role)
      VALUES (?, ?, ?, ?, ?, ?, 'student')
    `, [studentID, username, hashedPassword, firstName, lastName, email]);

    await pool.execute(`
      INSERT INTO student_data (studentID, totalCredits, majorCredits, isEligibleForInternship, isEligibleForProject)
      VALUES (?, ?, ?, ?, ?)
    `, [studentID, totalCredits, majorCredits, eligibleForInternship.eligible, eligibleForProject.eligible]);

    res.json({ success: true, message: 'เพิ่มนักศึกษาเรียบร้อย' });
  } catch (error) {
    console.error('Error adding student:', error);
    next(error);
  }
};
