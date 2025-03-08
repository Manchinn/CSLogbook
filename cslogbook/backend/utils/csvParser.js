// utils/csvParser.js

const validateStudentID = (id) => {
  if (!id) return null;
  // ทำความสะอาดรหัสนักศึกษา
  const cleanId = id.toString().replace(/[-\s]/g, '');
  // ตรวจสอบรูปแบบรหัสนักศึกษา 13 หลัก
  if (/^\d{13}$/.test(cleanId)) {
    return cleanId;
  }
  return null;
};

const validateName = (name) => {
  if (!name) return null;
  // ทำความสะอาดชื่อ
  return name.trim()
    .replace(/\s+/g, ' ') // แทนที่ช่องว่างหลายช่องด้วยช่องว่างเดียว
    .replace(/[^\u0E00-\u0E7Fa-zA-Z\s]/g, ''); // อนุญาตเฉพาะตัวอักษรไทย อังกฤษ และช่องว่าง
};

const validateCSVRow = (row) => {
  const errors = [];
  
  // ตรวจสอบข้อมูลที่จำเป็น
  const normalizedData = {
    student_code: row['Student ID']?.trim(),
    first_name: row['Name']?.trim(),
    last_name: row['Surname']?.trim(),
    email: `s${row['Student ID']}@email.kmutnb.ac.th`,
    username: `s${row['Student ID']}`,
    study_type: 'regular',
    total_credits: 0,
    major_credits: 0,
    is_eligible_internship: false,  
    is_eligible_project: false
  };

  // Validation rules
  if (!normalizedData.student_code?.match(/^\d{13}$/)) {
    errors.push('รหัสนักศึกษาต้องเป็นตัวเลข 13 หลัก');
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedData
  };
};

const validateCSVHeaders = (headers) => {
  const requiredHeaders = ['Student ID', 'Name', 'Surname'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  return {
    isValid: missingHeaders.length === 0,
    errors: missingHeaders.length > 0 ? 
      [`ไม่พบคอลัมน์ที่จำเป็น: ${missingHeaders.join(', ')}`] : []
  };
};

module.exports = {
  validateStudentID,
  validateName,
  validateCSVRow,
  validateCSVHeaders
};
