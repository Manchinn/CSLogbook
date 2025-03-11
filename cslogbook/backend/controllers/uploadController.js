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
    // ตรวจสอบสิทธิ์
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

          // ใช้ Sequelize findOrCreate พร้อม transaction
          const [user, created] = await User.findOrCreate({
            where: { username: `s${normalizedData.studentID}` },
            defaults: {
              password: await bcrypt.hash(normalizedData.studentID, 10),
              email: normalizedData.email,
              role: 'student',
              firstName: normalizedData.firstName,
              lastName: normalizedData.lastName,
              activeStatus: true
            },
            transaction
          });

          if (!created) {
            await user.update({
              email: normalizedData.email,
              firstName: normalizedData.firstName,
              lastName: normalizedData.lastName
            }, { transaction });
          }

          // สร้างหรืออัพเดทข้อมูลนักศึกษา
          const [student, studentCreated] = await Student.findOrCreate({
            where: { userId: user.userId },
            defaults: {
              studentCode: normalizedData.studentID,
              totalCredits: 0,
              majorCredits: 0,
              studyType: 'regular',
              isEligibleInternship: false,
              isEligibleProject: false
            },
            transaction
          });

          if (!studentCreated) {
            await student.update({
              studentCode: normalizedData.studentID
            }, { transaction });
          }

          // บันทึกประวัติการอัพโหลด
          await UploadHistory.create({
            uploadedBy: req.user.userId,
            fileName: req.file.originalname,
            totalRecords: 1,
            successfulUpdates: 1,
            failedUpdates: 0,
            uploadType: 'students',
            details: JSON.stringify(normalizedData)
          }, { transaction });

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
      details: error.message
    });
  }   finally {
    try {
      if (req.file && req.file.path) {
        await fs.promises.unlink(req.file.path);
      }
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
      // ไม่ throw error เพราะเป็นเพียงการ cleanup
    }
  }
};

// ดึงประวัติการอัพโหลดโดยใช้ Sequelize
const getUploadHistory = async (req, res) => {
  try {
    const history = await UploadHistory.findAll({
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['username', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadCSV,
  getUploadHistory
};