// controllers/projectController.js
const { ProjectDocument, Document } = require('../models');

exports.submitProposal = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // Logic for submitting proposal
        const projectDoc = await ProjectDocument.create({
            projectNameTH: req.body.projectNameTH,
            projectType: req.body.projectType,
            // ...other fields
        }, { transaction });

        // Create document record
        await Document.create({
            documentType: 'PROJECT',
            status: 'pending',
            // ...other fields
        }, { transaction });

        await transaction.commit();
        res.status(201).json({
            success: true,
            message: 'บันทึกข้อเสนอโครงงานสำเร็จ'
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาด'
        });
    }
};