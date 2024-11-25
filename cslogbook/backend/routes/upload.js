const mockStudentData = require('../mockStudentData');
const { validateCSVRow } = require('../utils/csvParser');
const { updateUniversityData } = require('../universityAPI');
const fs = require('fs');
const csv = require('csv-parser');

const uploadCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const filePath = req.file.path;

    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(csv({
        skipEmptyLines: true,
        trim: true,
      }));

    for await (const row of stream) {
      try {
        const validation = validateCSVRow(row);
        if (validation.isValid && validation.normalizedData) {
          const { normalizedData } = validation;
          const existingStudent = mockStudentData.find(
            student => student.studentID === normalizedData.studentID
          );
          
          if (existingStudent) {
            Object.assign(existingStudent, normalizedData);
          } else {
            mockStudentData.push(normalizedData);
          }

          const loginData = {
            ...normalizedData,
            username: `s${normalizedData.studentID}`,
            password: normalizedData.studentID,
            email: `s${normalizedData.studentID}@email.kmutnb.ac.th`
          };

          const updated = await updateUniversityData(loginData);
          results.push({
            ...normalizedData,
            status: updated ? (existingStudent ? 'Updated' : 'Added') : 'Update Failed'
          });
        } else {
          results.push({
            studentID: row['Student ID'] || '-',
            firstName: row['Name'] || '-',
            lastName: row['Surname'] || '-',
            role: row['Role'] || '-',
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

    // Cleanup
    await fs.promises.unlink(filePath);

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        added: results.filter(r => r.status === 'Added').length,
        updated: results.filter(r => r.status === 'Updated').length,
        invalid: results.filter(r => r.status === 'Invalid').length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCSV
};