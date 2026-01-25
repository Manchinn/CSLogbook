// validators/projectValidators.js
const Joi = require('joi');

/**
 * Validation middleware สำหรับสร้างโครงงาน
 */
exports.validateCreateProject = (req, res, next) => {
  const schema = Joi.object({
    projectNameTh: Joi.string().min(3).max(255).required().messages({
      'string.min': 'ชื่อโครงงานภาษาไทยต้องมีอย่างน้อย 3 ตัวอักษร',
      'string.max': 'ชื่อโครงงานภาษาไทยต้องไม่เกิน 255 ตัวอักษร',
      'any.required': 'กรุณากรอกชื่อโครงงานภาษาไทย'
    }),
    projectNameEn: Joi.string().min(3).max(255).optional().allow('', null).messages({
      'string.min': 'ชื่อโครงงานภาษาอังกฤษต้องมีอย่างน้อย 3 ตัวอักษร',
      'string.max': 'ชื่อโครงงานภาษาอังกฤษต้องไม่เกิน 255 ตัวอักษร'
    }),
    description: Joi.string().optional().allow('', null),
    track: Joi.string().valid('SOFTWARE', 'NETWORK', 'DATA_SCIENCE', 'AI', 'CYBERSECURITY', 'OTHER').optional(),
    academicYear: Joi.number().integer().optional(),
    semester: Joi.number().integer().min(1).max(3).optional()
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  req.validated = value;
  next();
};

/**
 * Validation middleware สำหรับอัพเดทโครงงาน
 */
exports.validateUpdateProject = (req, res, next) => {
  const schema = Joi.object({
    projectNameTh: Joi.string().min(3).max(255).optional().messages({
      'string.min': 'ชื่อโครงงานภาษาไทยต้องมีอย่างน้อย 3 ตัวอักษร',
      'string.max': 'ชื่อโครงงานภาษาไทยต้องไม่เกิน 255 ตัวอักษร'
    }),
    projectNameEn: Joi.string().min(3).max(255).optional().allow('', null).messages({
      'string.min': 'ชื่อโครงงานภาษาอังกฤษต้องมีอย่างน้อย 3 ตัวอักษร',
      'string.max': 'ชื่อโครงงานภาษาอังกฤษต้องไม่เกิน 255 ตัวอักษร'
    }),
    description: Joi.string().optional().allow('', null)
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  req.validated = value;
  next();
};

/**
 * Validation middleware สำหรับส่งคำขอสอบโครงงานพิเศษ 1 (KP02)
 */
exports.validateSubmitProject1Request = (req, res, next) => {
  const schema = Joi.object({
    defenseType: Joi.string().valid('PROJECT1', 'THESIS').required().messages({
      'any.only': 'ประเภทการสอบต้องเป็น PROJECT1 หรือ THESIS',
      'any.required': 'กรุณาระบุประเภทการสอบ'
    }),
    defenseDate: Joi.date().iso().optional().allow(null),
    defenseTime: Joi.string().optional().allow('', null),
    defenseLocation: Joi.string().optional().allow('', null),
    notes: Joi.string().optional().allow('', null)
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  req.validated = value;
  next();
};

/**
 * Validation middleware สำหรับสร้าง meeting
 */
exports.validateCreateMeeting = (req, res, next) => {
  const schema = Joi.object({
    meetingDate: Joi.date().iso().required().messages({
      'date.base': 'วันที่พบอาจารย์ไม่ถูกต้อง',
      'any.required': 'กรุณาระบุวันที่พบอาจารย์'
    }),
    meetingTime: Joi.string().optional().allow('', null),
    meetingType: Joi.string().valid('regular', 'milestone', 'emergency', 'other').optional(),
    summary: Joi.string().optional().allow('', null),
    notes: Joi.string().optional().allow('', null)
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  req.validated = value;
  next();
};

/**
 * Validation middleware สำหรับอัพเดท meeting
 */
exports.validateUpdateMeeting = (req, res, next) => {
  const schema = Joi.object({
    meetingDate: Joi.date().iso().optional().messages({
      'date.base': 'วันที่พบอาจารย์ไม่ถูกต้อง'
    }),
    meetingTime: Joi.string().optional().allow('', null),
    meetingType: Joi.string().valid('regular', 'milestone', 'emergency', 'other').optional(),
    summary: Joi.string().optional().allow('', null),
    notes: Joi.string().optional().allow('', null)
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  req.validated = value;
  next();
};

/**
 * Validation middleware สำหรับเพิ่มสมาชิกโครงงาน
 */
exports.validateAddMember = (req, res, next) => {
  const schema = Joi.object({
    studentCode: Joi.string().required().messages({
      'any.required': 'กรุณาระบุรหัสนักศึกษา'
    }),
    role: Joi.string().valid('member', 'co_advisor').optional().default('member')
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  req.validated = value;
  next();
};
