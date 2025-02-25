const fs = require('fs');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { validateCSVRow } = require('../utils/csvParser');
const { updateStudentData } = require('../utils/studentUtils');

const uploadCSV = async (req, res) => {
  try {
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

            const [existingUser] = await connection.execute(
              'SELECT studentID FROM users WHERE studentID = ?',
              [normalizedData.studentID]
            );

            if (existingUser.length > 0) {
              // Update existing user
              await connection.execute(`
                UPDATE users 
                SET firstName = ?, lastName = ?, email = ?, role = ?
                WHERE studentID = ?
              `, [
                normalizedData.firstName || null,
                normalizedData.lastName || null,
                normalizedData.email || null,
                normalizedData.role || null,
                normalizedData.studentID || null
              ]);

              // Update student_data
              await connection.execute(`
                UPDATE student_data 
                SET firstName = ?, lastName = ?, email = ?, isEligibleForInternship = ?, isEligibleForProject = ?
                WHERE studentID = ?
              `, [
                normalizedData.firstName || null,
                normalizedData.lastName || null,
                normalizedData.email || null,
                normalizedData.isEligibleForInternship || null,
                normalizedData.isEligibleForProject || null,
                normalizedData.studentID || null
              ]);

              results.push({
                ...normalizedData,
                status: 'Updated'
              });
            } else {
              // Insert new user
              await connection.execute(`
                INSERT INTO users (studentID, username, password, firstName, lastName, email, role)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [
                normalizedData.studentID || null,
                `s${normalizedData.studentID}` || null,
                await bcrypt.hash(normalizedData.studentID, 10), // Hash the password
                normalizedData.firstName || null,
                normalizedData.lastName || null,
                normalizedData.email || null,
                normalizedData.role || null
              ]);

              // Insert student_data if role is student
              if (normalizedData.role === 'student') {
                await connection.execute(`
                  INSERT INTO student_data (studentID, firstName, lastName, email, isEligibleForInternship, isEligibleForProject)
                  VALUES (?, ?, ?, ?, ?, ?)
                `, [
                  normalizedData.studentID || null,
                  normalizedData.firstName || null,
                  normalizedData.lastName || null,
                  normalizedData.email || null,
                  normalizedData.isEligibleForInternship || null,
                  normalizedData.isEligibleForProject || null
                ]);
              }

              results.push({
                ...normalizedData,
                status: 'Added'
              });
            }
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

      // Record upload history
      const summary = {
        total: results.length,
        added: results.filter(r => r.status === 'Added').length,
        updated: results.filter(r => r.status === 'Updated').length,
        invalid: results.filter(r => r.status === 'Invalid').length
      };

      await connection.execute(`
        INSERT INTO upload_history (academic_year, semester, file_name, uploaded_by, total_records, successful_updates, failed_updates, status_summary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        '2567', // Example academic year
        '1', // Example semester
        req.file.originalname,
        'admin', // Placeholder for user (adjust as necessary)
        summary.total,
        summary.added + summary.updated,
        summary.invalid,
        JSON.stringify(summary)
      ]);

      // Cleanup
      await fs.promises.unlink(filePath);

      // เรียกใช้ฟังก์ชันเพื่ออัปเดตข้อมูลนักศึกษา
      await updateStudentData();

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
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading CSV and updating student data' });
  }
};

module.exports = {
  uploadCSV
};