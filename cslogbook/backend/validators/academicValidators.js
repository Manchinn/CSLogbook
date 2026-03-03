/**
 * academicValidators.js
 * Validation middleware สำหรับ Academic Settings API
 * ตรวจสอบ input ก่อนส่งเข้า controller/service
 */

const { body, param, validationResult } = require('express-validator');

// ────────────────────────────────────────────────
// Helper: ส่ง error response ถ้า validation ไม่ผ่าน
// ────────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return next();
};

// ────────────────────────────────────────────────
// Reusable: ตรวจ date range (start < end)
// ────────────────────────────────────────────────
/**
 * ตรวจสอบ date range object ว่า start < end
 * @param {string} fieldName - ชื่อ field สำหรับ error message
 * @returns {function} custom validator function
 */
const validateDateRange = (fieldName) =>
  body(fieldName).optional({ nullable: true }).custom((range) => {
    if (!range) return true;

    const { start, end } = range.startDate !== undefined
      ? { start: range.startDate, end: range.endDate }  // internship/project registration
      : { start: range.start, end: range.end };          // semester range

    if (!start && !end) return true; // ทั้งคู่ว่าง อนุญาต

    if (start && !end) {
      throw new Error(`${fieldName}: กรุณาระบุวันสิ้นสุด`);
    }
    if (!start && end) {
      throw new Error(`${fieldName}: กรุณาระบุวันเริ่มต้น`);
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error(`${fieldName}: รูปแบบวันที่ไม่ถูกต้อง`);
    }

    if (startDate > endDate) {
      throw new Error(`${fieldName}: วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น`);
    }

    return true;
  });

// ────────────────────────────────────────────────
// Reusable: ตรวจ overlap ของ semester ranges
// ────────────────────────────────────────────────
/**
 * ตรวจว่า semester1/2/3 ranges ไม่ overlap กัน
 */
const validateNoSemesterOverlap = body('semesters').optional({ nullable: true }).custom((semesters) => {
  if (!semesters) return true;

  const getRangeOf = (sem) => {
    const entry = semesters[sem] ?? semesters[String(sem)];
    if (!entry || typeof entry !== 'object') return null;
    const range = entry.range ?? null;
    if (!range || !range.start || !range.end) return null;
    return { start: new Date(range.start), end: new Date(range.end) };
  };

  const ranges = [
    { label: 'ภาคเรียน 1 และ 2', a: getRangeOf(1), b: getRangeOf(2) },
    { label: 'ภาคเรียน 1 และ 3', a: getRangeOf(1), b: getRangeOf(3) },
    { label: 'ภาคเรียน 2 และ 3', a: getRangeOf(2), b: getRangeOf(3) },
  ];

  for (const { label, a, b } of ranges) {
    if (!a || !b) continue;
    // overlap เมื่อ a.start <= b.end && b.start <= a.end
    if (a.start <= b.end && b.start <= a.end) {
      throw new Error(`ช่วงภาคเรียนซ้อนทับกัน: ${label}`);
    }
  }

  return true;
});

// ────────────────────────────────────────────────
// Rules สำหรับสร้าง/แก้ไข Academic Schedule
// ────────────────────────────────────────────────
const academicScheduleRules = [
  body('academicYear')
    .optional({ nullable: true })
    .isInt({ min: 2500, max: 2800 })
    .withMessage('ปีการศึกษาต้องเป็นปี พ.ศ. (2500–2800) เช่น 2568'),

  body('currentSemester')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 3 })
    .withMessage('ภาคเรียนต้องเป็น 1, 2 หรือ 3 เท่านั้น'),

  body('status')
    .optional({ nullable: true })
    .isIn(['draft', 'published', 'active'])
    .withMessage("status ต้องเป็น 'draft', 'published' หรือ 'active'"),

  body('activeCurriculumId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('รหัสหลักสูตรต้องเป็นตัวเลขที่ถูกต้อง'),

  // ตรวจ date ranges
  validateDateRange('semester1Range'),
  validateDateRange('semester2Range'),
  validateDateRange('semester3Range'),
  validateDateRange('internshipRegistration'),
  validateDateRange('projectRegistration'),

  // ตรวจการ overlap ของ semester ranges
  validateNoSemesterOverlap,

  handleValidationErrors,
];

// ────────────────────────────────────────────────
// Rules สำหรับ Legacy updateAcademicSettings (PUT /academic)
// ────────────────────────────────────────────────
const updateAcademicSettingsRules = [
  body('id')
    .notEmpty()
    .withMessage('ไม่พบ ID ของข้อมูลที่ต้องการอัปเดต')
    .isInt({ min: 1 })
    .withMessage('ID ต้องเป็นตัวเลขที่ถูกต้อง'),

  body('academicYear')
    .optional({ nullable: true })
    .isInt({ min: 2500, max: 2800 })
    .withMessage('ปีการศึกษาต้องเป็นปี พ.ศ. (2500–2800) เช่น 2568'),

  body('currentSemester')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 3 })
    .withMessage('ภาคเรียนต้องเป็น 1, 2 หรือ 3 เท่านั้น'),

  validateDateRange('semester1Range'),
  validateDateRange('semester2Range'),
  validateDateRange('semester3Range'),
  validateDateRange('internshipRegistration'),
  validateDateRange('projectRegistration'),

  handleValidationErrors,
];

// ────────────────────────────────────────────────
// Rules สำหรับ param :id
// ────────────────────────────────────────────────
const idParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID ต้องเป็นตัวเลขที่ถูกต้อง'),

  handleValidationErrors,
];

module.exports = {
  academicScheduleRules,
  updateAcademicSettingsRules,
  idParamRules,
  handleValidationErrors,
};
