const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
const { validateCSVRow } = require('../utils/csvParser');
const { User, Student, UploadHistory } = require('../models');
const { sequelize } = require('../config/database');

const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx'];
const HEADER_ALIAS_MAP = {
  'student id': 'Student ID',
  studentid: 'Student ID',
  id: 'Student ID',
  'student code': 'Student ID',
  name: 'Name',
  'first name': 'Name',
  firstname: 'Name',
  surname: 'Surname',
  'last name': 'Surname',
  lastname: 'Surname'
};

const mapHeaderName = (header) => {
  if (!header) return null;
  const trimmed = header.toString().trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();
  return HEADER_ALIAS_MAP[normalized] || trimmed;
};

const normalizeRowKeys = (row) => {
  if (!row || typeof row !== 'object') {
    return row;
  }

  return Object.entries(row).reduce((acc, [key, value]) => {
    const mappedKey = typeof key === 'string' ? mapHeaderName(key) : key;
    if (!mappedKey) {
      return acc;
    }

    const cellValue = value == null ? '' : value.toString().trim();
    acc[mappedKey] = cellValue;
    return acc;
  }, {});
};

const determineExtension = (tempPath, originalName) => {
  const fromOriginal = originalName ? path.extname(originalName).toLowerCase() : '';
  if (fromOriginal) {
    return fromOriginal;
  }
  const fromPath = tempPath ? path.extname(tempPath).toLowerCase() : '';
  return fromPath;
};

const createCsvStream = (filePath) =>
  fs
    .createReadStream(filePath)
    .pipe(iconv.decodeStream('utf-8'))
    .pipe(
      csv({
        skipEmptyLines: true,
        trim: true
      })
    );

const readExcelRows = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headers = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = mapHeaderName(cell.text);
  });

  const rows = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const rowData = {};
    let hasValue = false;

    headers.forEach((header, colNumber) => {
      if (!header) {
        return;
      }
      const cell = row.getCell(colNumber);
      const value = cell?.text ? cell.text.trim() : '';
      if (value) {
        hasValue = true;
      }
      rowData[header] = value;
    });

    if (hasValue && Object.keys(rowData).length) {
      rows.push(rowData);
    }
  }

  return rows;
};

const buildSummary = (results) => ({
  total: results.length,
  added: results.filter((r) => r.status === 'Added').length,
  updated: results.filter((r) => r.status === 'Updated').length,
  invalid: results.filter((r) => r.status === 'Invalid').length,
  errors: results.filter((r) => r.status === 'Error').length
});

/**
 * ประมวลผลไฟล์ CSV หรือ Excel (.xlsx) สำหรับอัปโหลดรายชื่อนักศึกษา
 */
const processStudentCsvUpload = async ({ filePath, originalName, uploader }) => {
  const transaction = await sequelize.transaction();

  try {
    const results = [];
    const extension = determineExtension(filePath, originalName);
    const normalizedExtension = SUPPORTED_EXTENSIONS.includes(extension) ? extension : '.csv';

    const consumeRow = async (rawRow = {}) => {
      const normalizedRow = normalizeRowKeys(rawRow);

      try {
        const validation = validateCSVRow(normalizedRow);

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
            ...normalizedRow,
            status: 'Invalid',
            errors: validation.errors
          });
        }
      } catch (error) {
        // ❗ เก็บ error ระดับแถวแล้วไปต่อ เพื่อไม่ให้ไฟล์ทั้งชุดล้ม
        results.push({
          ...normalizedRow,
          status: 'Error',
          error: error.message
        });
      }
    };

    if (normalizedExtension === '.xlsx') {
      const excelRows = await readExcelRows(filePath);
      for (const row of excelRows) {
        await consumeRow(row);
      }
    } else {
      const stream = createCsvStream(filePath);
      for await (const row of stream) {
        await consumeRow(row);
      }
    }

    const summary = buildSummary(results);

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
          fileFormat: normalizedExtension.replace('.', ''),
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
