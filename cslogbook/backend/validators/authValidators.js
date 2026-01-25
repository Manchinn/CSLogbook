// validators/authValidators.js
const Joi = require('joi');

/**
 * Validation middleware สำหรับ login
 */
exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().min(3).required().messages({
      'string.min': 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร',
      'any.required': 'กรุณากรอกชื่อผู้ใช้',
      'string.empty': 'กรุณากรอกชื่อผู้ใช้'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      'any.required': 'กรุณากรอกรหัสผ่าน',
      'string.empty': 'กรุณากรอกรหัสผ่าน'
    }),
    redirectPath: Joi.string().optional().allow('', null)
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
