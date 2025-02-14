// utils/csvParser.js

const validateStudentID = (id) => {
    if (!id) return null;
    const cleanId = id.toString().replace(/\s+/g, '');
    if (/^\d{10,13}$/.test(cleanId)) {
        return cleanId;
    }
    return null;
  };

const normalizeBoolean = (value) => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
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

    // ตรวจสอบ Student ID
    let studentID = null;
    if (row['Student ID']) {
        studentID = validateStudentID(row['Student ID']);
        if (!studentID) {
            errors.push('Invalid Student ID format: must be 10-13 digits');
        }
    } else {
        errors.push('Missing required field: Student ID');
    }

    // ตรวจสอบฟิลด์ที่จำเป็น
    const requiredFields = ['Name', 'Surname', 'Role'];
    for (const field of requiredFields) {
        if (!row[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    if (row['Role'] && !['student', 'teacher', 'admin'].includes(row['Role'].toLowerCase())) {
        errors.push('Invalid Role: must be student, teacher, or admin');
    }

    // สร้างข้อมูลที่ normalize แล้ว
    const normalizedData = errors.length === 0 ? {
        studentID,
        firstName: row['Name'],
        lastName: row['Surname'],
        role: row['Role'].toLowerCase(),
        isEligibleForInternship: normalizeBoolean(row['Internship']),
        isEligibleForProject: normalizeBoolean(row['Project']),
        email: `s${studentID}@email.kmutnb.ac.th`,
        lastLoginNotification: null,
        // เพิ่มข้อมูลสำหรับ login
        username: `s${studentID}`,
        password: studentID // ใช้รหัสนักศึกษาเป็นรหัสผ่านเริ่มต้น
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
