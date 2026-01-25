// controllers/documents/documentStatusController.js
const documentService = require('../../services/documentService');

const documentStatusController = {
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
            next(error);
        }
    }
};

module.exports = documentStatusController;