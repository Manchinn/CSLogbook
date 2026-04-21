// validators/internshipValidators.js
const Joi = require('joi');

/**
 * Validation middleware สำหรับส่งคำร้องขอฝึกงาน (CS05)
 */
exports.validateSubmitCS05 = (req, res, next) => {
  const schema = Joi.object({
    companyName: Joi.string().min(2).max(255).required().messages({
      'string.min': 'ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร',
      'string.max': 'ชื่อบริษัทต้องไม่เกิน 255 ตัวอักษร',
      'any.required': 'กรุณากรอกชื่อบริษัท'
    }),
    companyAddress: Joi.string().min(5).max(500).required().messages({
      'string.min': 'ที่อยู่บริษัทต้องมีอย่างน้อย 5 ตัวอักษร',
      'string.max': 'ที่อยู่บริษัทต้องไม่เกิน 500 ตัวอักษร',
      'any.required': 'กรุณากรอกที่อยู่บริษัท'
    }),
    startDate: Joi.date().iso().required().messages({
      'date.base': 'วันที่เริ่มฝึกงานไม่ถูกต้อง',
      'any.required': 'กรุณาระบุวันที่เริ่มฝึกงาน'
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
      'date.base': 'วันที่สิ้นสุดการฝึกงานไม่ถูกต้อง',
      'date.min': 'วันที่สิ้นสุดต้องอยู่หลังวันที่เริ่ม',
      'any.required': 'กรุณาระบุวันที่สิ้นสุดการฝึกงาน'
    }),
    internshipPosition: Joi.string().max(255).optional().allow('', null),
    contactPersonName: Joi.string().max(255).optional().allow('', null),
    contactPersonPosition: Joi.string().max(255).optional().allow('', null)
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
 * Validation middleware สำหรับส่งคำร้องขอฝึกงานพร้อม transcript
 */
exports.validateSubmitCS05WithTranscript = (req, res, next) => {
  // ตรวจสอบไฟล์ transcript
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาแนบไฟล์ Transcript'
    });
  }

  // ตรวจสอบประเภทไฟล์
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({
      success: false,
      message: 'กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น'
    });
  }

  // รองรับทั้ง 2 รูปแบบ:
  // 1. ส่งแต่ละ field โดยตรงใน FormData (req.body.companyName, ...)
  // 2. ส่ง JSON string รวมใน field "formData" (req.body.formData = JSON.stringify({...}))
  let bodyData = req.body;
  if (req.body.formData && typeof req.body.formData === 'string') {
    try {
      bodyData = JSON.parse(req.body.formData);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลฟอร์มไม่ถูกต้อง (JSON parse error)'
      });
    }
  }

  // Validate form data (เหมือน submitCS05)
  // Frontend ส่งข้อมูลเป็น FormData โดย append JSON string ใน field "formData"
  // ต้อง parse ก่อน validate
  let bodyToValidate = req.body;
  if (req.body.formData && typeof req.body.formData === 'string') {
    try {
      bodyToValidate = JSON.parse(req.body.formData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลฟอร์มไม่ถูกต้อง (JSON parse error)'
      });
    }
  }

  const schema = Joi.object({
    companyName: Joi.string().min(2).max(255).required().messages({
      'string.min': 'ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร',
      'string.max': 'ชื่อบริษัทต้องไม่เกิน 255 ตัวอักษร',
      'any.required': 'กรุณากรอกชื่อบริษัท'
    }),
    companyAddress: Joi.string().min(5).max(500).required().messages({
      'string.min': 'ที่อยู่บริษัทต้องมีอย่างน้อย 5 ตัวอักษร',
      'string.max': 'ที่อยู่บริษัทต้องไม่เกิน 500 ตัวอักษร',
      'any.required': 'กรุณากรอกที่อยู่บริษัท'
    }),
    startDate: Joi.date().iso().required().messages({
      'date.base': 'วันที่เริ่มฝึกงานไม่ถูกต้อง',
      'any.required': 'กรุณาระบุวันที่เริ่มฝึกงาน'
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
      'date.base': 'วันที่สิ้นสุดการฝึกงานไม่ถูกต้อง',
      'date.min': 'วันที่สิ้นสุดต้องอยู่หลังวันที่เริ่ม',
      'any.required': 'กรุณาระบุวันที่สิ้นสุดการฝึกงาน'
    }),
    internshipPosition: Joi.string().max(255).optional().allow('', null),
    contactPersonName: Joi.string().max(255).optional().allow('', null),
    contactPersonPosition: Joi.string().max(255).optional().allow('', null),
    phoneNumber: Joi.string().optional().allow('', null),
    classroom: Joi.string().optional().allow('', null),
    studentData: Joi.array().optional()
  });
  
  const { error, value } = schema.validate(bodyData, { allowUnknown: true });
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
 * Validation middleware สำหรับบันทึกข้อมูลผู้ควบคุมงาน
 */
exports.validateSubmitCompanyInfo = (req, res, next) => {
  const schema = Joi.object({
    documentId: Joi.number().integer().required().messages({
      'number.base': 'Document ID ต้องเป็นตัวเลข',
      'any.required': 'กรุณาระบุ Document ID'
    }),
    supervisorName: Joi.string().min(2).max(255).required().messages({
      'string.min': 'ชื่อผู้ควบคุมงานต้องมีอย่างน้อย 2 ตัวอักษร',
      'string.max': 'ชื่อผู้ควบคุมงานต้องไม่เกิน 255 ตัวอักษร',
      'any.required': 'กรุณากรอกชื่อผู้ควบคุมงาน'
    }),
    supervisorPhone: Joi.string().pattern(/^[0-9-+() ]+$/).min(9).max(20).required().messages({
      'string.pattern.base': 'เบอร์โทรศัพท์ไม่ถูกต้อง',
      'string.min': 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 ตัวอักษร',
      'string.max': 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร',
      'any.required': 'กรุณากรอกเบอร์โทรศัพท์ผู้ควบคุมงาน'
    }),
    supervisorEmail: Joi.string().email().required().messages({
      'string.email': 'อีเมลไม่ถูกต้อง',
      'any.required': 'กรุณากรอกอีเมลผู้ควบคุมงาน'
    }),
    supervisorPosition: Joi.string().max(255).optional().allow('', null)
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
 * Validation middleware สำหรับส่งคำขอประเมินผล
 */
exports.validateSendEvaluationForm = (req, res, next) => {
  const schema = Joi.object({
    documentId: Joi.number().integer().required().messages({
      'number.base': 'Document ID ต้องเป็นตัวเลข',
      'any.required': 'กรุณาระบุ Document ID'
    })
  });
  
  // ตรวจสอบจาก params ถ้าไม่มีใน body
  const documentId = req.body.documentId || req.params.documentId;
  if (!documentId) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาระบุ Document ID'
    });
  }

  const { error, value } = schema.validate({ documentId });
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
 * Validation middleware สำหรับส่งคำขอหนังสือรับรอง
 */
exports.validateSubmitCertificateRequest = (req, res, next) => {
  const schema = Joi.object({
    studentId: Joi.string().optional(),
    requestDate: Joi.date().iso().optional().default(() => new Date()),
    totalHours: Joi.number().min(0).max(10000).optional(),
    approvedHours: Joi.number().min(0).max(10000).optional(),
    evaluationStatus: Joi.string().valid('completed', 'pending').optional().default('completed'),
    summaryStatus: Joi.string().valid('submitted', 'ignored').optional()
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
 * Validation middleware สำหรับอัปโหลดหนังสือตอบรับ
 */
exports.validateUploadAcceptanceLetter = (req, res, next) => {
  // ตรวจสอบไฟล์
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาแนบไฟล์หนังสือตอบรับ'
    });
  }

  // ตรวจสอบประเภทไฟล์
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({
      success: false,
      message: 'กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น'
    });
  }

  const schema = Joi.object({
    cs05DocumentId: Joi.number().integer().required().messages({
      'number.base': 'CS05 Document ID ต้องเป็นตัวเลข',
      'any.required': 'กรุณาระบุ CS05 Document ID'
    })
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
