const express = require('express');
const router = express.Router();
const signatoryController = require('../../controllers/signatoryController');
const { signatureUpload } = require('../../config/uploadConfig');

/**
 * @route   GET /api/admin/signatories
 * @desc    ดึงข้อมูลผู้ลงนามทั้งหมด
 */
router.get('/', signatoryController.getSignatories);

/**
 * @route   GET /api/admin/signatories/:id
 * @desc    ดึงข้อมูลผู้ลงนามตาม ID
 */
router.get('/:id', signatoryController.getSignatoryById);

/**
 * @route   POST /api/admin/signatories
 * @desc    เพิ่มผู้ลงนามใหม่
 */
router.post('/', signatoryController.createSignatory);

/**
 * @route   PUT /api/admin/signatories/:id
 * @desc    อัปเดตข้อมูลผู้ลงนาม
 */
router.put('/:id', signatoryController.updateSignatory);

/**
 * @route   DELETE /api/admin/signatories/:id
 * @desc    ลบผู้ลงนาม
 */
router.delete('/:id', signatoryController.deleteSignatory);

/**
 * @route   POST /api/admin/signatories/:id/signature
 * @desc    อัปโหลดรูปลายเซ็น
 */
router.post('/:id/signature', signatureUpload.single('signature'), signatoryController.uploadSignature);

module.exports = router;
