const { UPLOAD_CONFIG } = require('../../config/uploadConfig');
// เพิ่ม fs และ path สำหรับอ่านไฟล์
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { User, Student, Document } = require('../../models'); // แก้ไขการ import เพื่อให้มี Document

// อัพโหลดเอกสาร
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'ไม่พบไฟล์ที่อัปโหลด'
            });
        }

        const { documentType, category } = req.body;

        // ตรวจสอบประเภทเอกสาร
        const docTypeConfig = UPLOAD_CONFIG.DOCUMENT_TYPES[documentType?.toUpperCase()];
        if (!docTypeConfig) {
            return res.status(400).json({
                success: false,
                message: 'ประเภทเอกสารไม่ถูกต้อง'
            });
        }

        // บันทึกข้อมูลลงฐานข้อมูล
        const document = await Document.create({
            userId: req.user.id,
            documentType,
            category,
            filePath: req.file.path,
            fileName: req.file.filename,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            status: 'pending'
        });

        res.json({
            success: true,
            documentId: document.id,
            fileUrl: `/uploads/${req.file.filename}`,
            message: 'อัปโหลดไฟล์สำเร็จ'
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
        });
    }
};

// ดึงข้อมูลเอกสาร
const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findByPk(req.params.id);
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบเอกสาร'
            });
        }

        res.json({
            success: true,
            data: document
        });

    } catch (error) {
        console.error('Get Document Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร'
        });
    }
};

// อัพเดทสถานะเอกสาร
const updateDocumentStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const document = await Document.findByPk(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบเอกสาร'
            });
        }

        await document.update({
            status,
            comment,
            reviewedBy: req.user.id,
            reviewedAt: new Date()
        });

        res.json({
            success: true,
            message: 'อัพเดทสถานะเอกสารสำเร็จ'
        });

    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะเอกสาร'
        });
    }
};

// ดึงข้อมูลเอกสารทั้งหมด
const getDocuments = async (req, res) => {
    try {
        const { type, status, search } = req.query;
        
        // สร้าง query condition
        let whereCondition = {};
        
        if (type && type !== 'all') {
            whereCondition.documentType = type.toLowerCase(); // ตรวจสอบว่า type ตรงกับฐานข้อมูล
        }
        
        if (status && status !== 'all') {
            whereCondition.status = status;
        }
        
        // ถ้ามี search ให้ค้นหาในชื่อเอกสารหรือชื่อนักศึกษา
        if (search) {
            whereCondition = {
                ...whereCondition,
                [Op.or]: [
                    { documentName: { [Op.like]: `%${search}%` } },
                    // เพิ่มการค้นหาในชื่อนักศึกษาตามต้องการ
                ]
            };
        }
        
        // ดึงข้อมูลเอกสารพร้อมข้อมูลที่เกี่ยวข้อง
        const documents = await Document.findAll({
            where: whereCondition,
            attributes: [
                "documentId",
                "documentName",
                "documentType",
                "status",
                "created_at", // ฟิลด์วันที่สร้าง
                "updated_at", // เพิ่มฟิลด์ updatedAt
            ],
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['firstName', 'lastName'],
                    include: [{
                        model: Student,
                        as: 'student', // แก้ตรงนี้ - เพิ่ม as: 'student'
                        attributes: ['studentCode']
                    }]
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        // นับสถิติ
        const total = await Document.count();
        const pending = await Document.count({ where: { status: 'pending' } });
        const approved = await Document.count({ where: { status: 'approved' } });
        const rejected = await Document.count({ where: { status: 'rejected' } });
        
        // จัดรูปแบบข้อมูลก่อนส่งกลับ
        const formattedDocuments = documents.map(doc => ({
            id: doc.id || doc.documentId,
            document_name: doc.documentName,
            student_name: `${doc.owner.firstName} ${doc.owner.lastName}`,
            student_code: doc.owner.student ? doc.owner.student.studentCode : '',
            type: doc.documentType.toLowerCase(),
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            status: doc.status,
        }));
        
        res.json({
            documents: formattedDocuments,
            statistics: { total, pending, approved, rejected }
        });
        
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            success: false, 
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร',
            error: error.message
        });
    }
};

// อนุมัติเอกสาร
const approveDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const document = await Document.findByPk(documentId);
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบเอกสาร'
            });
        }

        await document.update({
            status: 'approved',
            reviewedBy: req.user.id,
            reviewedAt: new Date()
        });

        res.json({
            success: true,
            message: 'อนุมัติเอกสารเรียบร้อยแล้ว'
        });
    } catch (error) {
        console.error('Error approving document:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอนุมัติเอกสาร'
        });
    }
};

// ปฏิเสธเอกสาร
const rejectDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const { reason } = req.body;
        
        const document = await Document.findByPk(documentId);
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบเอกสาร'
            });
        }

        await document.update({
            status: 'rejected',
            comment: reason || 'ไม่ได้ระบุเหตุผล',
            reviewedBy: req.user.id,
            reviewedAt: new Date()
        });

        res.json({
            success: true,
            message: 'ปฏิเสธเอกสารเรียบร้อยแล้ว'
        });
    } catch (error) {
        console.error('Error rejecting document:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการปฏิเสธเอกสาร'
        });
    }
};

// ค้นหาเอกสาร
const searchDocuments = async (req, res) => {
    try {
        const { query, type } = req.query;
        
        if (!query) {
            return res.json({
                success: true,
                documents: []
            });
        }
        
        const whereCondition = {
            [Op.or]: [
                { fileName: { [Op.like]: `%${query}%` } },
                // สามารถเพิ่มเงื่อนไขอื่นๆ ได้ตามต้องการ
            ]
        };
        
        if (type && type !== 'all') {
            whereCondition.documentType = type;
        }
        
        const documents = await Document.findAll({
            where: whereCondition,
            limit: 20,
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            success: true,
            documents
        });
    } catch (error) {
        console.error('Error searching documents:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการค้นหาเอกสาร'
        });
    }
};

// ดึงเอกสารล่าสุด
const getRecentDocuments = async (req, res) => {
    try {
        const documents = await Document.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            success: true,
            documents
        });
    } catch (error) {
        console.error('Error fetching recent documents:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสารล่าสุด'
        });
    }
};

// แสดงไฟล์เอกสาร PDF โดยตรงในเบราว์เซอร์
const viewDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const document = await Document.findByPk(documentId);
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบเอกสาร'
            });
        }

        if (!document.filePath || !fs.existsSync(document.filePath)) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบไฟล์เอกสาร'
            });
        }

        // ตั้งค่า header สำหรับการแสดงไฟล์ PDF โดยตรงใน browser
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${document.fileName || path.basename(document.filePath)}"`);
        
        // อ่านและส่งไฟล์
        const fileStream = fs.createReadStream(document.filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('View Document Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการแสดงเอกสาร'
        });
    }
};

// ดาวน์โหลดไฟล์เอกสาร
const downloadDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const document = await Document.findByPk(documentId);
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบเอกสาร'
            });
        }

        if (!document.filePath || !fs.existsSync(document.filePath)) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบไฟล์เอกสาร'
            });
        }

        // ตั้งค่าการดาวน์โหลดไฟล์
        const fileName = document.fileName || path.basename(document.filePath);
        res.setHeader('Content-Type', document.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // ส่งไฟล์
        const fileStream = fs.createReadStream(document.filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Download Document Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดาวน์โหลดเอกสาร'
        });
    }
};

module.exports = {
    uploadDocument,
    getDocumentById,
    updateDocumentStatus,
    getDocuments,
    approveDocument,
    rejectDocument,
    searchDocuments,
    getRecentDocuments,
    viewDocument, // เพิ่มฟังก์ชัน viewDocument ที่นี่
    downloadDocument // เพิ่มฟังก์ชัน downloadDocument ที่นี่
};