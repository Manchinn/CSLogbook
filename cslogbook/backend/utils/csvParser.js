// utils/csvParser.js

const validateStudentID = (id) => {
  if (!id) return null;
  // ลบเครื่องหมายขีดกลางและช่องว่างออก
  const cleanId = id.toString().replace(/[-\s]/g, '');
  if (/^\d{13}$/.test(cleanId)) {
    return cleanId;
  }
  return null;
};

const validateCSVRow = (row) => {
  const errors = [];

  if (!row || Object.values(row).every(val => !val)) {
    return {
      isValid: false,
      errors: ['Empty row'],
      normalizedData: null
    };
  }

  // Validate and clean Student ID
  let studentID = null;
  if (row['Student ID']) {
    studentID = validateStudentID(row['Student ID']);
    if (!studentID) {
      errors.push('Invalid Student ID format: must be 13 digits');
    }
  } else {
    errors.push('Missing required field: Student ID');
  }

  // Validate required fields
  const requiredFields = ['Name', 'Surname'];
  for (const field of requiredFields) {
    if (!row[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // กำหนด role เป็น student
  const role = 'student';

  // Create normalized data
  const normalizedData = errors.length === 0 ? {
    studentID,
    firstName: row['Name'],
    lastName: row['Surname'],
    email: `s${studentID}@email.kmutnb.ac.th`,
    role,
    lastLoginNotification: null,
    // Add login information
    username: `s${studentID}`,
    password: studentID // Use student ID as the initial password
  } : null;

  return {
    isValid: errors.length === 0,
    errors,
    normalizedData
  };
};

module.exports = {
  validateStudentID,
  validateCSVRow
};
