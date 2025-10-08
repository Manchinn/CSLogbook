// utils/csvParser.js

// Thai error and warning messages
const THAI_MESSAGES = {
  ERRORS: {
    EMPTY_ROW: 'แถวว่าง',
    INVALID_STUDENT_ID: 'รูปแบบรหัสนักศึกษาไม่ถูกต้อง: ต้องเป็นตัวเลข 13 หลัก',
    MISSING_STUDENT_ID: 'ข้อมูลที่จำเป็น: รหัสนักศึกษา',
    MISSING_NAME: 'ข้อมูลที่จำเป็น: ชื่อ',
    MISSING_SURNAME: 'ข้อมูลที่จำเป็น: นามสกุล',
    INVALID_CREDITS: 'หน่วยกิตไม่ถูกต้อง: ต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0',
    INVALID_CLASSROOM: 'รูปแบบห้องเรียนไม่ถูกต้อง'
  },
  WARNINGS: {
    SCIENTIFIC_NOTATION_CONVERTED: 'แปลงรหัสนักศึกษาจากรูปแบบ Scientific Notation',
    DUPLICATE_STUDENT_ID: 'พบรหัสนักศึกษาซ้ำในไฟล์'
  }
};

// Parse scientific notation to regular number string
const parseScientificNotation = (value) => {
  if (!value) return null;
  
  const str = value.toString().trim();
  
  // Check if it's in scientific notation (e.g., 1.23456789012E+12)
  if (/^\d+\.?\d*[eE][+-]?\d+$/.test(str)) {
    try {
      const num = parseFloat(str);
      // Convert to string without scientific notation
      return num.toFixed(0);
    } catch (error) {
      return null;
    }
  }
  
  return str;
};

// Parse and validate credits
const parseCredits = (value) => {
  if (!value || value === '') return null;
  
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    return { isValid: false, value: null };
  }
  
  return { isValid: true, value: Math.floor(num) };
};

// Validate classroom format
const validateClassroom = (value) => {
  if (!value || value === '') return { isValid: true, value: null };
  
  const trimmed = value.toString().trim();
  // Allow any non-empty string as classroom
  return { isValid: true, value: trimmed };
};

const validateStudentID = (id) => {
  if (!id) return null;
  
  // First try to parse scientific notation
  const parsed = parseScientificNotation(id);
  if (!parsed) return null;
  
  // Remove dashes and spaces
  const cleanId = parsed.replace(/[-\s]/g, '');
  if (/^\d{13}$/.test(cleanId)) {
    return cleanId;
  }
  return null;
};

const validateCSVRowEnhanced = (row, processedStudentIDs = new Set()) => {
  const errors = [];
  const warnings = [];

  if (!row || Object.values(row).every(val => !val)) {
    return {
      isValid: false,
      errors: [THAI_MESSAGES.ERRORS.EMPTY_ROW],
      warnings: [],
      normalizedData: null
    };
  }

  // Validate and clean Student ID
  let studentID = null;
  let scientificNotationConverted = false;
  
  if (row['Student ID']) {
    const originalValue = row['Student ID'].toString();
    
    // Check if it's scientific notation
    if (/^\d+\.?\d*[eE][+-]?\d+$/.test(originalValue.trim())) {
      scientificNotationConverted = true;
    }
    
    studentID = validateStudentID(row['Student ID']);
    if (!studentID) {
      errors.push(THAI_MESSAGES.ERRORS.INVALID_STUDENT_ID);
    } else {
      // Add warning if converted from scientific notation
      if (scientificNotationConverted) {
        warnings.push(THAI_MESSAGES.WARNINGS.SCIENTIFIC_NOTATION_CONVERTED);
      }
      
      // Check for duplicate student ID
      if (processedStudentIDs.has(studentID)) {
        warnings.push(THAI_MESSAGES.WARNINGS.DUPLICATE_STUDENT_ID);
      } else {
        processedStudentIDs.add(studentID);
      }
    }
  } else {
    errors.push(THAI_MESSAGES.ERRORS.MISSING_STUDENT_ID);
  }

  // Validate required fields
  if (!row['Name']) {
    errors.push(THAI_MESSAGES.ERRORS.MISSING_NAME);
  }
  
  if (!row['Surname']) {
    errors.push(THAI_MESSAGES.ERRORS.MISSING_SURNAME);
  }

  // Validate optional fields
  let totalCredits = null;
  let majorCredits = null;
  let classroom = null;

  // Total Credits (optional)
  if (row['Total Credits']) {
    const creditsResult = parseCredits(row['Total Credits']);
    if (!creditsResult.isValid) {
      errors.push(THAI_MESSAGES.ERRORS.INVALID_CREDITS);
    } else {
      totalCredits = creditsResult.value;
    }
  }

  // Major Credits (optional)
  if (row['Major Credits']) {
    const majorCreditsResult = parseCredits(row['Major Credits']);
    if (!majorCreditsResult.isValid) {
      errors.push(THAI_MESSAGES.ERRORS.INVALID_CREDITS);
    } else {
      majorCredits = majorCreditsResult.value;
    }
  }

  // Classroom (optional)
  if (row['Classroom']) {
    const classroomResult = validateClassroom(row['Classroom']);
    if (!classroomResult.isValid) {
      errors.push(THAI_MESSAGES.ERRORS.INVALID_CLASSROOM);
    } else {
      classroom = classroomResult.value;
    }
  }

  // Create normalized data
  const normalizedData = errors.length === 0 ? {
    studentID,
    firstName: row['Name'],
    lastName: row['Surname'],
    email: `s${studentID}@email.kmutnb.ac.th`,
    role: 'student',
    username: `s${studentID}`,
    password: studentID,
    totalCredits,
    majorCredits,
    classroom
  } : null;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizedData
  };
};

// Keep the original function for backward compatibility
const validateCSVRow = (row) => {
  const result = validateCSVRowEnhanced(row);
  return {
    isValid: result.isValid,
    errors: result.errors,
    normalizedData: result.normalizedData
  };
};

module.exports = {
  validateStudentID,
  validateCSVRow,
  validateCSVRowEnhanced,
  parseScientificNotation,
  parseCredits,
  validateClassroom,
  THAI_MESSAGES
};
