// controllers/documents/documentStatusController.js
const documentStatusController = {
    updateStatus: async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { status, comment } = req.body;

            const document = await Document.findByPk(id);
            const oldStatus = document.status;

            // อัพเดทสถานะ
            await document.update({
                status,
                reviewerId: req.user.id,
                reviewDate: new Date(),
                reviewComment: comment
            }, { transaction });

            // บันทึก Log
            await DocumentLog.create({
                documentId: id,
                userId: req.user.id,
                actionType: status === 'approved' ? 'approve' : 'reject',
                previousStatus: oldStatus,
                newStatus: status,
                comment
            }, { transaction });

            await transaction.commit();
            res.json({
                success: true,
                message: 'อัพเดทสถานะเอกสารสำเร็จ'
            });

        } catch (error) {
            await transaction.rollback();
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ'
            });
        }
    }
};