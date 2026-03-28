// controllers/documents/statusController.js
const documentService = require('../../services/documentService');
const logger = require('../../utils/logger');

const statusController = {
    /**
     * อัพเดทสถานะเอกสาร
     * PATCH /api/documents/project/:id/status
     */
    updateStatus: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status, comment } = req.body;
            const result = await documentService.updateStatus(
                id,
                status,
                comment,
                req.user.userId
            );
            res.json(result);
        } catch (error) {
            logger.error('Error in statusController.updateStatus:', error);
            next(error);
        }
    },

    /**
     * อนุมัติเอกสาร
     * POST /api/documents/project/:id/approve
     */
    approveDocument: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await documentService.approveDocument(
                id,
                req.user.userId
            );
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            logger.error('Error in statusController.approveDocument:', error);
            next(error);
        }
    },

    /**
     * ปฏิเสธเอกสาร
     * POST /api/documents/project/:id/reject
     */
    rejectDocument: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            if (!reason || !reason.trim()) {
                return res.status(400).json({ success: false, message: 'กรุณาระบุเหตุผลการปฏิเสธ' });
            }
            if (reason.trim().length < 5 || reason.trim().length > 1000) {
                return res.status(400).json({ success: false, message: 'เหตุผลการปฏิเสธต้องมีความยาว 5-1000 ตัวอักษร' });
            }

            const result = await documentService.rejectDocument(
                id,
                req.user.userId,
                reason
            );
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            logger.error('Error in statusController.rejectDocument:', error);
            next(error);
        }
    }
};

module.exports = statusController;
