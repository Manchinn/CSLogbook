const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { calculateStudentYear, isEligibleForInternship, isEligibleForProject } = require('../utils/studentUtils');


exports.getAllStudents = async (req, res, next) => {
  try {
    const [students] = await pool.execute(`
      SELECT u.*, 
             sd.isEligibleForInternship, 
             sd.isEligibleForProject,
             sd.totalCredits,
             sd.majorCredits     
      FROM users u 
      LEFT JOIN student_data sd ON u.studentID = sd.studentID 
      WHERE u.role = 'student'
    `);

    // แปลงข้อมูลให้เป็นตัวเลข
    const formattedStudents = students.map(student => ({
      ...student,
      totalCredits: parseInt(student.totalCredits) || 0,
      majorCredits: parseInt(student.majorCredits) || 0
    }));

    console.log('Sending student data, count:', formattedStudents.length);
    res.json(formattedStudents);
  } catch (error) {
    console.error('Error in student list route:', error);
    next(error);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    if (req.user.role === 'admin' || req.user.studentID === req.params.id) {
      const [student] = await pool.execute(`
        SELECT 
          u.*,
          COALESCE(sd.totalCredits, 0) as totalCredits,
          COALESCE(sd.majorCredits, 0) as majorCredits,
          sd.isEligibleForInternship,
          sd.isEligibleForProject
        FROM users u 
        LEFT JOIN student_data sd ON u.studentID = sd.studentID 
        WHERE u.studentID = ?
      `, [req.params.id]);

      if (!student[0]) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษา' });
      }

      // แปลงค่าและตรวจสอบข้อมูล
      const studentData = {
        ...student[0],
        totalCredits: parseInt(student[0].totalCredits) || 0,
        majorCredits: parseInt(student[0].majorCredits) || 0,
        isEligibleForInternship: Boolean(student[0].isEligibleForInternship),
        isEligibleForProject: Boolean(student[0].isEligibleForProject)
      };

      // เพิ่ม logging เพื่อตรวจสอบข้อมูล
      console.log('Sending student data:', studentData);

      res.json(studentData);
    } else {
      res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' });
    }
  } catch (error) {
    console.error('Error fetching student:', error);
    next(error);
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalCredits, majorCredits } = req.body;

    console.log('Received update request:', {
      id,
      totalCredits,
      majorCredits,
      body: req.body
    });
    
    // ตรวจสอบค่าที่รับเข้ามา
    if (totalCredits === undefined || majorCredits === undefined) {
      return res.status(400).json({ 
        message: 'กรุณาระบุหน่วยกิตรวมและหน่วยกิตภาควิชา',
        received: { totalCredits, majorCredits }
      });
    }

    // แปลงค่าเป็นตัวเลข
    const parsedTotalCredits = parseInt(totalCredits);
    const parsedMajorCredits = parseInt(majorCredits);
    
    // คำนวณปีการศึกษาและตรวจสอบสิทธิ์ใหม่
    const studentYear = calculateStudentYear(id);
    const projectEligibility = isEligibleForProject(studentYear, parsedTotalCredits, parsedMajorCredits);
    const internshipEligibility = isEligibleForInternship(studentYear, parsedTotalCredits);

    // อัพเดทข้อมูลทั้งหมดในตาราง student_data
    const result = await pool.execute(
      `UPDATE student_data 
       SET totalCredits = ?, 
           majorCredits = ?,
           isEligibleForInternship = ?,
           isEligibleForProject = ?
       WHERE studentID = ?`,
      [
        parsedTotalCredits, 
        parsedMajorCredits, 
        internshipEligibility.eligible,
        projectEligibility.eligible,
        id
      ]
    );

    if (result[0].affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลนักศึกษา' });
    }

    // ส่งข้อมูลที่อัพเดทกลับไป
    res.json({
      studentID: id,
      totalCredits: parsedTotalCredits,
      majorCredits: parsedMajorCredits,
      isEligibleForProject: projectEligibility.eligible,
      isEligibleForInternship: internshipEligibility.eligible,
      projectMessage: projectEligibility.message,
      internshipMessage: internshipEligibility.message
    });

  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล',
      error: error.message 
    });
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
      INSERT INTO student_data (studentID, firstName, lastName, email, totalCredits, majorCredits, isEligibleForInternship, isEligibleForProject)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [studentID, firstName, lastName, email, totalCredits, majorCredits, eligibleForInternship.eligible, eligibleForProject.eligible]);

    res.json({ success: true, message: 'เพิ่มนักศึกษาเรียบร้อย' });
  } catch (error) {
    console.error('Error adding student:', error);
    next(error);
  }
};

const updateStudentData = async () => {
  try {
    // ตรวจสอบนักศึกษาที่ยังไม่มีในตาราง student_data
    const [students] = await pool.execute(`
      SELECT u.studentID, u.firstName, u.lastName, u.email
      FROM users u
      LEFT JOIN student_data sd ON u.studentID = sd.studentID
      WHERE sd.studentID IS NULL AND u.role = 'student'
    `);

    if (students.length === 0) {
      console.log('No new students to update.');
      return;
    }

    for (const student of students) {
      try {
        // ตรวจสอบว่ามีข้อมูลนักศึกษาในตาราง student_data หรือไม่
        const [existingStudent] = await pool.execute(
          'SELECT studentID FROM student_data WHERE studentID = ?',
          [student.studentID]
        );

        if (existingStudent.length > 0) {
          console.log(`Student ${student.studentID} already exists, skipping...`);
          continue;
        }

        const studentYear = calculateStudentYear(student.studentID);
        const totalCredits = 0; // ค่าเริ่มต้น
        const majorCredits = 0; // ค่าเริ่มต้น

        // คำนวณสิทธิ์
        const eligibleForInternship = isEligibleForInternship(studentYear, totalCredits);
        const eligibleForProject = isEligibleForProject(studentYear, totalCredits, majorCredits);

        // เพิ่มข้อมูลนักศึกษาใหม่
        await pool.execute(`
          INSERT INTO student_data 
          (studentID, firstName, lastName, email, totalCredits, majorCredits, 
           isEligibleForInternship, isEligibleForProject)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          student.studentID,
          student.firstName,
          student.lastName,
          student.email,
          totalCredits,
          majorCredits,
          eligibleForInternship.eligible,
          eligibleForProject.eligible
        ]);

        console.log(`Added new student: ${student.studentID}`);
      } catch (error) {
        console.error(`Error processing student ${student.studentID}:`, error.message);
      }
    }

    console.log('Student data update completed successfully.');
  } catch (error) {
    console.error('Error in updateStudentData:', error.message);
    throw error;
  }
};
