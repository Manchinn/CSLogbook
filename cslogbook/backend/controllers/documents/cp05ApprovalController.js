const { Document, DocumentLog, User, InternshipDocument, Student } = require('../../models');
const { Op } = require('sequelize');
const path = require('path');
const internshipService = require('../../services/internshipService');
const logger = require('../../utils/logger');

// root ของ uploads directory (รองรับทั้ง env var และ default)
const UPLOADS_ROOT = path.resolve(__dirname, '../../', (process.env.UPLOAD_DIR || 'uploads').replace(/\/$/, ''));

/**
 * แปลง filePath ที่อาจเป็น absolute path (Windows/Linux) หรือ relative path
 * ให้กลายเป็น { url, filename } ที่ใช้กับ /uploads/ static route ได้
 */
function buildPdfFileInfo(filePath) {
  if (!filePath) return null;
  try {
    const abs = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(UPLOADS_ROOT, filePath);
    const rel = path.relative(UPLOADS_ROOT, abs).replace(/\\/g, '/');
    // ถ้า rel เริ่มด้วย '..' แสดงว่าไฟล์อยู่นอก uploads dir
    if (rel.startsWith('..') || rel === '') return null;
    return { url: `/uploads/${rel}`, filename: path.basename(filePath) };
  } catch {
    return null;
  }
}

// Helper to load CS05 document with minimal validation
async function loadCS05(documentId) {
  const doc = await Document.findOne({
    where: { documentId, documentName: 'CS05' }
  });
  if (!doc) {
    const err = new Error('ไม่พบเอกสาร CS05');
    err.statusCode = 404;
    throw err;
  }
  return doc;
}

// Head of department queue: list CS05 for head (supports status filter)
exports.listForHead = async (req, res) => {
  try {
    // รองรับการกรองสถานะผ่าน query เช่น ?status=pending หรือหลายค่าเช่น ?status=approved,acceptance_approved,referral_ready
    const statusQuery = (req.query.status || 'pending')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const whereStatus = statusQuery.length > 1 ? { [Op.in]: statusQuery } : statusQuery[0] || 'pending';

    // ดึงเอกสาร CS05 ตามสถานะที่ระบุ (ดีฟอลต์: pending) สำหรับหัวหน้าภาควิชา
    const docs = await Document.findAll({
      where: { 
        documentName: 'CS05', 
        status: whereStatus,
        // แสดงเฉพาะที่ผ่านการตรวจโดยเจ้าหน้าที่ภาคแล้ว
        reviewerId: { [Op.not]: null }
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['userId', 'firstName', 'lastName'],
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['studentId', 'studentCode']
            }
          ]
        },
        {
          model: InternshipDocument,
          as: 'internshipDocument',
          attributes: ['companyName', 'internshipPosition', 'startDate', 'endDate', 'academicYear', 'semester']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const data = docs.map((d) => ({
      // id และ documentId ตรงกันเพื่อให้ frontend ใช้ได้ทั้งสองฟิลด์
      id: d.documentId,
      documentId: d.documentId,
      // ข้อมูลนักศึกษา (flatten จาก nested student object)
      studentId: d.owner?.student?.studentId || '',
      studentCode: d.owner?.student?.studentCode || '',
      studentName: `${d.owner?.firstName || ''} ${d.owner?.lastName || ''}`.trim(),
      companyName: d.internshipDocument?.companyName || '',
      documentType: 'cs05',
      status: d.status,
      // วันที่ยื่น (ใช้ submittedAt ถ้ามี ไม่งั้นใช้ created_at)
      submittedAt: d.submittedAt || d.created_at,
      submittedDate: d.submittedAt || d.created_at,
      academicYear: d.internshipDocument?.academicYear || null,
      semester: d.internshipDocument?.semester || null,
      // ไฟล์ PDF — แปลง absolute/relative filePath → URL ที่เข้าถึงได้ผ่าน static route
      pdfFile: buildPdfFileInfo(d.filePath),
      // ความเห็นและเหตุผลปฏิเสธ (ใช้ reviewComment จาก Document model)
      comment: d.status !== 'rejected' ? (d.reviewComment || null) : null,
      rejectionReason: d.status === 'rejected' ? (d.reviewComment || null) : null,
    }));

  return res.json({ success: true, data });
  } catch (error) {
    logger.error('CP05 listForHead error:', error);
    return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// Support staff review: move to pending for head approval
exports.reviewByStaff = async (req, res) => {
  try {
    const { id } = req.params; // documentId
    const { comment, officialNumber } = req.body || {};

    // Validate officialNumber
    if (!officialNumber || !/^\d{1,3}$/.test(String(officialNumber))) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเลขที่เอกสาร (ตัวเลข 1-3 หลัก)',
      });
    }

    const doc = await loadCS05(id);

    // Only allow if current status is draft or pending
    const prevStatus = doc.status;
    if (!['draft', 'pending'].includes(prevStatus)) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถตรวจสอบได้ เนื่องจากสถานะปัจจุบันคือ ${prevStatus}`
      });
    }

    // Mark as pending (explicit) and set reviewer as staff user
    await doc.update({
      status: 'pending',
      reviewerId: req.user.userId,
      reviewDate: new Date(),
      reviewComment: comment || null,
      officialNumber: officialNumber
    });

    await DocumentLog.create({
      documentId: doc.documentId,
      userId: req.user.userId,
      actionType: 'update',
      previousStatus: prevStatus,
      newStatus: 'pending',
      comment: comment || 'ตรวจสอบโดยเจ้าหน้าที่ภาควิชา'
    });

    return res.json({ success: true, message: 'ตรวจสอบเอกสารแล้ว และรอหัวหน้าภาคอนุมัติ' });
  } catch (error) {
    logger.error('CP05 reviewByStaff error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// Head of department approves
exports.approveByHead = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, letterType } = req.body || {};

    const doc = await loadCS05(id);
    const prevStatus = doc.status;

    // Require it to be pending before head approval
    if (!['pending'].includes(prevStatus)) {
      return res.status(400).json({ success: false, message: `ไม่สามารถอนุมัติได้เนื่องจากสถานะปัจจุบันคือ ${prevStatus}` });
    }

    // ต้องผ่านการตรวจจากเจ้าหน้าที่ภาควิชาก่อน (reviewerId ต้องมีค่า)
    if (!doc.reviewerId) {
      return res.status(400).json({ success: false, message: 'ยังไม่ผ่านการตรวจจากเจ้าหน้าที่ภาควิชา' });
    }

    // Delegate approval and workflow updates to service
    await internshipService.approveCS05(doc.documentId, req.user.userId, { letterType });

    await DocumentLog.create({
      documentId: doc.documentId,
      userId: req.user.userId,
      actionType: 'approve',
      previousStatus: prevStatus,
      newStatus: 'approved',
      comment: comment || 'อนุมัติโดยหัวหน้าภาค'
    });

    // แจ้งเตือน notification
    try {
      const notificationService = require('../../services/notificationService');
      await notificationService.createAndNotify(doc.userId, {
        type: 'APPROVAL',
        title: 'คำร้อง CS05 ได้รับการอนุมัติ',
        message: null,
        metadata: {
          documentId: doc.documentId,
          documentName: 'CS05',
          action: 'approved',
          targetUrl: '/project/documents'
        }
      });
    } catch (notifyErr) {
      logger.warn('Notification failed (CS05 approve):', notifyErr.message);
    }

  return res.json({ success: true, message: 'อนุมัติ คพ.05 สำเร็จ' });
  } catch (error) {
    logger.error('CP05 approveByHead error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// Reject by staff or head
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเหตุผลการปฏิเสธ' });
    }
    if (reason.trim().length < 5 || reason.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'เหตุผลการปฏิเสธต้องมีความยาว 5-1000 ตัวอักษร' });
    }

    const doc = await loadCS05(id);
    const prevStatus = doc.status;

    // Allow reject from draft/pending
    if (!['draft', 'pending'].includes(prevStatus)) {
      return res.status(400).json({ success: false, message: `ไม่สามารถปฏิเสธได้เนื่องจากสถานะปัจจุบันคือ ${prevStatus}` });
    }

    await doc.update({
      status: 'rejected',
      reviewerId: req.user.userId,
      reviewDate: new Date(),
      reviewComment: reason
    });

    await DocumentLog.create({
      documentId: doc.documentId,
      userId: req.user.userId,
      actionType: 'reject',
      previousStatus: prevStatus,
      newStatus: 'rejected',
      comment: reason
    });

    // แจ้งเตือน notification
    let notificationSent = false;
    try {
      const notificationService = require('../../services/notificationService');
      await notificationService.createAndNotify(doc.userId, {
        type: 'DOCUMENT',
        title: 'คำร้อง CS05 ถูกปฏิเสธ',
        message: reason || 'กรุณาตรวจสอบและแก้ไข',
        metadata: {
          documentId: doc.documentId,
          documentName: 'CS05',
          action: 'rejected',
          targetUrl: '/project/documents'
        }
      });
      notificationSent = true;
    } catch (notifyErr) {
      logger.warn('Notification failed (CS05 reject):', notifyErr.message);
    }

    return res.json({ success: true, message: 'ปฏิเสธ คพ.05 สำเร็จ', notificationSent });
  } catch (error) {
    logger.error('CP05 reject error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};
