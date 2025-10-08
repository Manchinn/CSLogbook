const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
const { validateCSVRowEnhanced } = require('../utils/csvParser');
const { User, Student, UploadHistory } = require('../models');
const { sequelize } = require('../config/database');

const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx'];
const HEADER_ALIAS_MAP = {
  // English headers
  'student id': 'Student ID',
  studentid: 'Student ID',
  id: 'Student ID',
  'student code': 'Student ID',
  name: 'Name',
  'first name': 'Name',
  firstname: 'Name',
  surname: 'Surname',
  'last name': 'Surname',
  lastname: 'Surname',
  'total credits': 'Total Credits',
  totalcredits: 'Total Credits',
  credits: 'Total Credits',
  'major credits': 'Major Credits',
  majorcredits: 'Major Credits',
  classroom: 'Classroom',
  class: 'Classroom',
  room: 'Classroom',
  
  // Thai headers
  'รหัสนักศึกษา': 'Student ID',
  'รหัส': 'Student ID',
  'ชื่อ': 'Name',
  'นามสกุล': 'Surname',
  'หน่วยกิตรวม': 'Total Credits',
  'หน่วยกิตสะสม': 'Total Credits',
  'หน่วยกิต': 'Total Credits',
  'หน่วยกิตวิชาเอก': 'Major Credits',
  'หน่วยกิตเอก': 'Major Credits',
  'ห้องเรียน': 'Classroom',
  'ห้อง': 'Classroom',
  'ชั้นเรียน': 'Classroom'
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

const buildEnhancedSummary = (results) => {
  const summary = buildSummary(results);
  const allWarnings = results.reduce((acc, result) => {
    if (result.warnings && Array.isArray(result.warnings)) {
      acc.push(...result.warnings);
    }
    return acc;
  }, []);

  return {
    ...summary,
    warnings: allWarnings.length,
    warningDetails: allWarnings
  };
};

// Validate file structure before processing
const validateFileStructure = async (filePath, extension) => {
  try {
    const stats = fs.statSync(filePath);
    
    // Check if file is empty
    if (stats.size === 0) {
      return {
        isValid: false,
        error: 'ไฟล์ว่างเปล่า กรุณาตรวจสอบไฟล์และอัปโหลดใหม่'
      };
    }

    // Check file structure based on extension
    if (extension === '.csv') {
      return await validateCSVStructure(filePath);
    } else if (extension === '.xlsx') {
      return await validateExcelStructure(filePath);
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `ไม่สามารถอ่านไฟล์ได้: ${error.message}`
    };
  }
};

const validateCSVStructure = async (filePath) => {
  return new Promise((resolve) => {
    let headerFound = false;
    let rowCount = 0;
    let hasValidHeaders = false;

    const stream = fs
      .createReadStream(filePath)
      .pipe(iconv.decodeStream('utf-8'))
      .pipe(csv({ skipEmptyLines: true, trim: true }));

    stream.on('headers', (headers) => {
      headerFound = true;
      
      // Check if we have any recognizable headers
      const normalizedHeaders = headers.map(h => mapHeaderName(h)).filter(h => h);
      const requiredHeaders = ['Student ID'];
      
      hasValidHeaders = requiredHeaders.some(required => 
        normalizedHeaders.includes(required)
      );
    });

    stream.on('data', () => {
      rowCount++;
    });

    stream.on('end', () => {
      if (!headerFound) {
        resolve({
          isValid: false,
          error: 'ไม่พบ header ในไฟล์ CSV กรุณาตรวจสอบรูปแบบไฟล์'
        });
      } else if (!hasValidHeaders) {
        resolve({
          isValid: false,
          error: 'ไม่พบ header ที่จำเป็น (รหัสนักศึกษา/Student ID) กรุณาตรวจสอบรูปแบบไฟล์'
        });
      } else if (rowCount === 0) {
        resolve({
          isValid: false,
          error: 'ไฟล์ CSV มีเพียงคอลัมน์เท่านั้น ไม่มีข้อมูลนักศึกษา'
        });
      } else {
        resolve({ isValid: true });
      }
    });

    stream.on('error', (error) => {
      resolve({
        isValid: false,
        error: `ไม่สามารถอ่านไฟล์ CSV ได้: ${error.message}`
      });
    });
  });
};

const validateExcelStructure = async (filePath) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return {
        isValid: false,
        error: 'ไม่พบ worksheet ในไฟล์ Excel'
      };
    }

    if (worksheet.rowCount === 0) {
      return {
        isValid: false,
        error: 'ไฟล์ Excel ว่างเปล่า'
      };
    }

    // Check headers
    const headers = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(mapHeaderName(cell.text));
    });

    const requiredHeaders = ['Student ID'];
    const hasValidHeaders = requiredHeaders.some(required => 
      headers.includes(required)
    );

    if (!hasValidHeaders) {
      return {
        isValid: false,
        error: 'ไม่พบคอลัมน์ที่ใช้งาน (รหัสนักศึกษา/ชื่อ/นามสกุล) ในไฟล์ Excel'
      };
    }

    if (worksheet.rowCount === 1) {
      return {
        isValid: false,
        error: 'ไฟล์ Excel มีเพียงคอลัมน์เท่านั้น ไม่มีข้อมูลนักศึกษา'
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `ไม่สามารถอ่านไฟล์ Excel ได้: ${error.message}`
    };
  }
};

/**
 * ประมวลผลไฟล์ CSV หรือ Excel (.xlsx) สำหรับอัปโหลดรายชื่อนักศึกษา
 */
const processStudentCsvUpload = async ({ filePath, originalName, uploader }) => {
  const transaction = await sequelize.transaction();

  try {
    const results = [];
    const extension = determineExtension(filePath, originalName);
    const normalizedExtension = SUPPORTED_EXTENSIONS.includes(extension) ? extension : '.csv';

    // Validate file structure before processing
    const structureValidation = await validateFileStructure(filePath, normalizedExtension);
    if (!structureValidation.isValid) {
      // Return soft error instead of throwing
      return {
        results: [],
        summary: {
          total: 0,
          added: 0,
          updated: 0,
          invalid: 0,
          errors: 1,
          warnings: 0,
          fileError: structureValidation.error
        }
      };
    }

    const consumeRow = async (rawRow = {}) => {
      const normalizedRow = normalizeRowKeys(rawRow);

      try {
        const validation = validateCSVRowEnhanced(normalizedRow);

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
              totalCredits: normalizedData.totalCredits || 0,
              majorCredits: normalizedData.majorCredits || 0,
              classroom: normalizedData.classroom || null,
              studyType: 'regular',
              isEligibleInternship: false,
              isEligibleProject: false
            },
            transaction
          });

          if (!studentCreated) {
            const updateData = {
              studentCode: normalizedData.studentID
            };
            
            // Only update fields that are provided in the CSV
            if (normalizedData.totalCredits !== null) {
              updateData.totalCredits = normalizedData.totalCredits;
            }
            if (normalizedData.majorCredits !== null) {
              updateData.majorCredits = normalizedData.majorCredits;
            }
            if (normalizedData.classroom !== null) {
              updateData.classroom = normalizedData.classroom;
            }
            
            await student.update(updateData, { transaction });
          }

          results.push({
            ...normalizedData,
            status: created ? 'Added' : 'Updated',
            warnings: validation.warnings || []
          });
        } else {
          results.push({
            ...normalizedRow,
            status: 'Invalid',
            errors: validation.errors,
            warnings: validation.warnings || []
          });
        }
      } catch (error) {
        // ❗ เก็บ error ระดับแถวแล้วไปต่อ เพื่อไม่ให้ไฟล์ทั้งชุดล้ม
        results.push({
          ...normalizedRow,
          status: 'Error',
          error: error.message,
          warnings: []
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

    const summary = buildEnhancedSummary(results);

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
