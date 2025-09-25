const fs = require('fs');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const bcrypt = require('bcrypt');
const { validateCSVRow } = require('../utils/csvParser');
const { User, Student, UploadHistory } = require('../models');
const { sequelize } = require('../config/database');

/**
 * ประมวลผลไฟล์ CSV สำหรับอัปโหลดรายชื่อนักศึกษา
 * @param {Object} params
 * @param {string} params.filePath - ที่อยู่ไฟล์ชั่วคราวที่ multer เก็บไว้
 * @param {string} params.originalName - ชื่อไฟล์ต้นฉบับ ใช้บันทึกประวัติ
 * @param {Object} params.uploader - ข้อมูลผู้ใช้ที่ทำการอัปโหลด (มาจาก token)
 * @returns {Promise<{results: Array, summary: Object}>}
 */
const processStudentCsvUpload = async ({ filePath, originalName, uploader }) => {
  const transaction = await sequelize.transaction();

  try {
    const results = [];

    // ใช้ stream เพื่ออ่านไฟล์ทีละบรรทัด ป้องกันปัญหาไฟล์ขนาดใหญ่ในหน่วยความจำ
    const stream = fs
      .createReadStream(filePath)
      .pipe(iconv.decodeStream('utf-8'))
      .pipe(
        csv({
          skipEmptyLines: true,
          trim: true
        })
      );

    for await (const row of stream) {
      try {
        const validation = validateCSVRow(row);

        if (validation.isValid && validation.normalizedData) {
          const { normalizedData } = validation;

          // ✅ Find or create ผู้ใช้ พร้อม hash รหัสผ่านเริ่มต้น
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
            await user.update(
              {
                email: normalizedData.email,
                firstName: normalizedData.firstName,
                lastName: normalizedData.lastName
              },
              { transaction }
            );
          }

          // ✅ จัดการข้อมูล Student ให้ sync กับ user เสมอ
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
            await student.update(
              {
                studentCode: normalizedData.studentID
              },
              { transaction }
            );
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
        // ❗ เก็บ error ระดับแถวแล้วไปต่อ เพื่อไม่ให้ไฟล์ทั้งชุดล้ม
        results.push({
          ...row,
          status: 'Error',
          error: error.message
        });
      }
    }

    const summary = {
      total: results.length,
      added: results.filter((r) => r.status === 'Added').length,
      updated: results.filter((r) => r.status === 'Updated').length,
      invalid: results.filter((r) => r.status === 'Invalid').length,
      errors: results.filter((r) => r.status === 'Error').length
    };

    await UploadHistory.create(
      {
        uploadedBy: uploader.userId,
        fileName: originalName,
        totalRecords: summary.total,
        successfulUpdates: summary.added + summary.updated,
        failedUpdates: summary.invalid + summary.errors,
        uploadType: 'students',
        details: {
          summary,
          processedAt: new Date().toISOString(),
          uploader: {
            userId: uploader.userId,
            username: uploader.username || null
          }
        }
      },
      { transaction }
    );

    await transaction.commit();

    return { results, summary };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  processStudentCsvUpload
};
