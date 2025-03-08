const fs = require('fs');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { validateCSVRow } = require('../utils/csvParser');
const { updateStudentData } = require('../utils/studentUtils');

const uploadCSV = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'ไม่มีสิทธิ์อัพโหลดรายชื่อนักศึกษา'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const filePath = req.file.path;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const stream = fs.createReadStream(filePath)
        .pipe(iconv.decodeStream('utf-8'))
        .pipe(csv({
          skipEmptyLines: true,
          trim: true,
        }));

      for await (const row of stream) {
        try {
          const validation = validateCSVRow(row);
          if (validation.isValid && validation.normalizedData) {
            const { normalizedData } = validation;

            // ตรวจสอบผู้ใช้ที่มีอยู่จาก username แทน studentID
            const [existingUser] = await connection.execute(
              'SELECT user_id FROM users WHERE username = ?',
              [`s${normalizedData.student_code}`]
            );

            if (existingUser.length > 0) {
              // อัพเดทข้อมูลผู้ใช้เดิม
              await connection.execute(`
                UPDATE users 
                SET email = ?,
                    first_name = ?, 
                    last_name = ?,
                    updated_at = NOW()
                WHERE user_id = ?
              `, [
                normalizedData.email,
                normalizedData.first_name,
                normalizedData.last_name,
                existingUser[0].user_id
              ]);

              // อัพเดทข้อมูลนักศึกษา
              await connection.execute(`
                UPDATE students 
                SET student_code = ?,
                    study_type = ?,
                    updated_at = NOW()
                WHERE user_id = ?
              `, [
                normalizedData.student_code,
                normalizedData.study_type,
                existingUser[0].user_id
              ]);

              results.push({
                ...normalizedData,
                status: 'Updated'
              });
            } else {
              // เพิ่มผู้ใช้ใหม่
              const [userResult] = await connection.execute(`
                INSERT INTO users (
                  username,
                  password,
                  email,
                  role,
                  first_name,
                  last_name,
                  active_status,
                  created_at,
                  updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
                [
                  normalizedData.username,
                  await bcrypt.hash(normalizedData.student_code, 10),
                  normalizedData.email,
                  'student',
                  normalizedData.first_name,
                  normalizedData.last_name
                ]
              );

              // เพิ่มข้อมูลนักศึกษา
              await connection.execute(`
                INSERT INTO students (
                  user_id,
                  student_code,
                  total_credits,
                  major_credits,
                  study_type,
                  is_eligible_internship,
                  is_eligible_project,
                  created_at,
                  updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                  userResult.insertId,
                  normalizedData.student_code,
                  normalizedData.total_credits || 0,
                  normalizedData.major_credits || 0,
                  normalizedData.study_type,
                  normalizedData.is_eligible_internship,
                  normalizedData.is_eligible_project
                ]
              );

              results.push({
                ...normalizedData,
                status: 'Added'
              });
            }
          } else {
            results.push({
              ...row,
              status: 'Invalid',
              errors: validation.errors
            });
          }
        } catch (error) {
          console.error('Row processing error:', error);
          results.push({
            ...row,
            status: 'Error',
            error: error.message
          });
        }
      }

      await connection.commit();

      // สรุปผลการอัพโหลด
      const summary = {
        total: results.length,
        added: results.filter(r => r.status === 'Added').length,
        updated: results.filter(r => r.status === 'Updated').length,
        invalid: results.filter(r => r.status === 'Invalid').length,
        errors: results.filter(r => r.status === 'Error').length
      };

      // บันทึกประวัติการอัพโหลด
      await connection.execute(`
        INSERT INTO upload_history (
          uploaded_by,
          file_name,
          total_records,
          successful_updates,
          failed_updates,
          upload_type,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          req.user.user_id,
          req.file.originalname,
          summary.total,
          summary.added + summary.updated,
          summary.invalid + summary.errors,
          'students'
        ]
      );

      res.json({
        success: true,
        results,
        summary
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
      // ลบไฟล์หลังจากประมวลผลเสร็จ
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Upload error:', error);
    await connection.rollback();
    res.status(500).json({ 
      error: 'Error uploading CSV file',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ตัวอย่างการดึงประวัติการอัพโหลด
const getUploadHistory = async (req, res) => {
  try {
    const [history] = await pool.execute(`
      SELECT 
        h.*,
        u.username as uploaded_by_username,
        u.first_name,
        u.last_name,
        DATE_FORMAT(h.created_at, '%Y-%m-%d %H:%i:%s') as formatted_created_at
      FROM upload_history h
      JOIN users u ON h.uploaded_by = u.user_id
      ORDER BY h.created_at DESC
    `);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadCSV,
  getUploadHistory
};