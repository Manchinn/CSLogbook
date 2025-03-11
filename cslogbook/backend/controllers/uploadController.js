const fs = require('fs');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const bcrypt = require('bcrypt');
const { validateCSVRow } = require('../utils/csvParser');
const { User, Student, UploadHistory } = require('../models');
const { sequelize } = require('../config/database');

const uploadCSV = async (req, res) => {
  const transaction = await sequelize.transaction();
  
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

          // Find or create user using Sequelize
          const [user, created] = await User.findOrCreate({
            where: { username: `s${normalizedData.studentID}` },
            defaults: {
              password: await bcrypt.hash(normalizedData.studentID, 10),
              email: normalizedData.email,
              role: 'student',
              firstName: normalizedData.firstName,
              lastName: normalizedData.lastName
            },
            transaction
          });

          if (!created) {
            // Update existing user
            await user.update({
              email: normalizedData.email,
              firstName: normalizedData.firstName,
              lastName: normalizedData.lastName
            }, { transaction });
          }

          // Find or create student record
          const [student, studentCreated] = await Student.findOrCreate({
            where: { userId: user.userId },
            defaults: {
              studentCode: normalizedData.studentID,
              totalCredits: 0,
              majorCredits: 0,
              studyType: 'regular'
            },
            transaction
          });

          if (!studentCreated) {
            await student.update({
              studentCode: normalizedData.studentID
            }, { transaction });
          }

          results.push({
            ...normalizedData,
            status: created ? 'Added' : 'Updated'
          });
        } else {
          results.push({
            ...row,
            status: 'Invalid',
            errors: validation.errors
          });
        }
      } catch (error) {
        results.push({
          ...row,
          status: 'Error',
          error: error.message
        });
      }
    }

    // Create upload history
    await UploadHistory.create({
      uploadedBy: req.user.userId,
      fileName: req.file.originalname,
      totalRecords: results.length,
      successfulUpdates: results.filter(r => ['Added', 'Updated'].includes(r.status)).length,
      failedUpdates: results.filter(r => ['Invalid', 'Error'].includes(r.status)).length,
      uploadType: 'students'
    }, { transaction });

    await transaction.commit();

    const summary = {
      total: results.length,
      added: results.filter(r => r.status === 'Added').length,
      updated: results.filter(r => r.status === 'Updated').length,
      invalid: results.filter(r => r.status === 'Invalid').length,
      errors: results.filter(r => r.status === 'Error').length
    };

    res.json({ success: true, results, summary });

  } catch (error) {
    await transaction.rollback();
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Error uploading CSV file',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Clean up uploaded file
    await fs.promises.unlink(filePath);
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