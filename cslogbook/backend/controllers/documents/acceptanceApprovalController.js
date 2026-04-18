const { Document, DocumentLog, User, Student, InternshipDocument } = require('../../models');
const { Op } = require('sequelize');
const path = require('path');
const internshipManagementService = require('../../services/internshipManagementService');
const logger = require('../../utils/logger');
const { logAction } = require('../../utils/auditLog');

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
    if (rel.startsWith('..') || rel === '') return null;
    return { url: `/uploads/${rel}`, filename: path.basename(filePath) };
  } catch {
    return null;
  }
}
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

async function loadAcceptance(documentId) {
  const doc = await Document.findOne({
    where: { documentId, documentName: 'ACCEPTANCE_LETTER', category: 'acceptance' }
  });
  if (!doc) {
    const err = new Error('ไม่พบเอกสาร Acceptance Letter');
    err.statusCode = 404;
    throw err;
  }
  return doc;
}

// คิวเจ้าหน้าที่ภาค: รายการ Acceptance Letter ที่ยังไม่ผ่านการตรวจ (reviewerId IS NULL)
exports.listForStaff = async (req, res) => {
  try {
    const statusQuery = (req.query.status || 'pending')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const whereStatus = statusQuery.length > 1 ? { [Op.in]: statusQuery } : statusQuery[0] || 'pending';

    // Staff queue = คิวของเจ้าหน้าที่ภาค → เห็นเฉพาะ doc ที่ยังไม่ถูก review
    // (reviewerId IS NULL) เสมอ ไม่ว่าจะ filter status ใด ๆ — กันนโยบาย
    // bypass ด้วย ?status=pending,approved หรือ ?status=rejected
    const whereCondition = {
      documentName: 'ACCEPTANCE_LETTER',
      category: 'acceptance',
      status: whereStatus,
      reviewerId: { [Op.is]: null },
    };

    const docs = await Document.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['userId', 'firstName', 'lastName'],
          include: [{ model: Student, as: 'student', attributes: ['studentId', 'studentCode'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const data = await Promise.all(docs.map(async (d) => {
      let companyName = '';
      let startDate = null;
      let endDate = null;
      let academicYear = null;
      let semester = null;

      const cs05 = await Document.findOne({
        where: { userId: d.userId, documentName: 'CS05', status: 'approved' },
        include: [{
          model: InternshipDocument,
          as: 'internshipDocument',
          attributes: ['companyName', 'internshipPosition', 'startDate', 'endDate', 'academicYear', 'semester'],
        }],
        order: [['updated_at', 'DESC']],
      });

      if (cs05?.internshipDocument) {
        companyName = cs05.internshipDocument.companyName || '';
        startDate = cs05.internshipDocument.startDate;
        endDate = cs05.internshipDocument.endDate;
        academicYear = cs05.internshipDocument.academicYear;
        semester = cs05.internshipDocument.semester;
      }

      return {
        id: d.documentId,
        documentId: d.documentId,
        studentId: d.owner?.student?.studentId || '',
        studentCode: d.owner?.student?.studentCode || '',
        studentName: `${d.owner?.firstName || ''} ${d.owner?.lastName || ''}`.trim(),
        companyName,
        startDate,
        endDate,
        documentType: 'acceptance',
        status: d.status,
        submittedAt: d.submittedAt || d.created_at,
        submittedDate: d.submittedAt || d.created_at,
        academicYear,
        semester,
        pdfFile: buildPdfFileInfo(d.filePath),
        comment: d.status !== 'rejected' ? (d.reviewComment || null) : null,
        rejectionReason: d.status === 'rejected' ? (d.reviewComment || null) : null,
      };
    }));

    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Acceptance listForStaff error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// คิวหัวหน้าภาค: รายการ Acceptance Letter (รองรับการกรองสถานะเช่นเดียวกับ CS05)
exports.listForHead = async (req, res) => {
  try {
    const { InternshipDocument } = require('../../models');
    
    // รองรับการกรองสถานะผ่าน query เช่น ?status=pending หรือหลายค่า ?status=pending,approved
    const statusQuery = (req.query.status || 'pending')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const whereStatus = statusQuery.length > 1 ? { [Op.in]: statusQuery } : statusQuery[0] || 'pending';

    // สร้าง where condition - ถ้าสถานะเป็น pending ต้องมี reviewerId, ถ้าเป็นสถานะอื่นไม่บังคับ
    const whereCondition = {
      documentName: 'ACCEPTANCE_LETTER',
      category: 'acceptance',
      status: whereStatus
    };

    // ถ้ากรองเฉพาะ pending ให้ต้องมี reviewerId (ผ่านเจ้าหน้าที่แล้ว)
    if (statusQuery.length === 1 && statusQuery[0] === 'pending') {
      whereCondition.reviewerId = { [Op.not]: null };
    }

    const docs = await Document.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['userId', 'firstName', 'lastName'],
          include: [{ model: Student, as: 'student', attributes: ['studentId', 'studentCode'] }],
        }
      ],
      order: [['created_at', 'DESC']],
    });

    // ดึงข้อมูลบริษัทและวันที่จาก CS05 ของนักศึกษาแต่ละคน
    const data = await Promise.all(docs.map(async (d) => {
      let companyName = '';
      let startDate = null;
      let endDate = null;
      let academicYear = null;
      let semester = null;

      // หา CS05 ที่อนุมัติแล้วของนักศึกษาคนนี้
      const cs05 = await Document.findOne({
        where: {
          userId: d.userId,
          documentName: 'CS05',
          status: 'approved'
        },
        include: [{
          model: InternshipDocument,
          as: 'internshipDocument',
          attributes: ['companyName', 'internshipPosition', 'startDate', 'endDate', 'academicYear', 'semester']
        }],
        order: [['updated_at', 'DESC']]
      });

      if (cs05?.internshipDocument) {
        companyName = cs05.internshipDocument.companyName || '';
        startDate = cs05.internshipDocument.startDate;
        endDate = cs05.internshipDocument.endDate;
        academicYear = cs05.internshipDocument.academicYear;
        semester = cs05.internshipDocument.semester;
      }

      return {
        // id และ documentId ตรงกันเพื่อให้ frontend ใช้ได้ทั้งสองฟิลด์
        id: d.documentId,
        documentId: d.documentId,
        // ข้อมูลนักศึกษา (flatten จาก nested student object)
        studentId: d.owner?.student?.studentId || '',
        studentCode: d.owner?.student?.studentCode || '',
        studentName: `${d.owner?.firstName || ''} ${d.owner?.lastName || ''}`.trim(),
        companyName,
        documentType: 'acceptance',
        status: d.status,
        // วันที่ยื่น (ใช้ submittedAt ถ้ามี ไม่งั้นใช้ created_at)
        submittedAt: d.submittedAt || d.created_at,
        submittedDate: d.submittedAt || d.created_at,
        academicYear,
        semester,
        // ไฟล์ PDF — แปลง absolute/relative filePath → URL ที่เข้าถึงได้ผ่าน static route
        pdfFile: buildPdfFileInfo(d.filePath),
        // ความเห็นและเหตุผลปฏิเสธ
        comment: d.status !== 'rejected' ? (d.reviewComment || null) : null,
        rejectionReason: d.status === 'rejected' ? (d.reviewComment || null) : null,
      };
    }));

    return res.json({ success: true, data });
  } catch (error) {
    logger.error('Acceptance listForHead error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// เจ้าหน้าที่ภาคตรวจและส่งต่อ
exports.reviewByStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, officialNumber } = req.body || {};

    // Validate officialNumber
    if (!officialNumber || !/^\d{1,3}$/.test(String(officialNumber))) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเลขที่เอกสาร (ตัวเลข 1-3 หลัก)',
      });
    }

    const doc = await loadAcceptance(id);

    const prevStatus = doc.status;
    if (!['draft', 'pending'].includes(prevStatus)) {
      return res.status(400).json({ success: false, message: `ไม่สามารถตรวจสอบได้ เนื่องจากสถานะปัจจุบันคือ ${prevStatus}` });
    }

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
      comment: comment || 'ตรวจสอบโดยเจ้าหน้าที่ภาควิชา (Acceptance Letter)',
    });

    return res.json({ success: true, message: 'ส่งต่อหัวหน้าภาคเรียบร้อยแล้ว' });
  } catch (error) {
    logger.error('Acceptance reviewByStaff error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// หัวหน้าภาคอนุมัติ Acceptance Letter
exports.approveByHead = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body || {};
    const doc = await loadAcceptance(id);

    if (doc.status !== 'pending') {
      return res.status(400).json({ success: false, message: `ไม่สามารถอนุมัติได้เนื่องจากสถานะปัจจุบันคือ ${doc.status}` });
    }
    if (!doc.reviewerId) {
      return res.status(400).json({ success: false, message: 'ยังไม่ผ่านการตรวจจากเจ้าหน้าที่ภาควิชา' });
    }

    const prevStatus = doc.status;
    await doc.update({ status: 'approved', reviewerId: req.user.userId, reviewDate: new Date() });

    await DocumentLog.create({
      documentId: doc.documentId,
      userId: req.user.userId,
      actionType: 'approve',
      previousStatus: prevStatus,
      newStatus: 'approved',
      comment: comment || 'อนุมัติหนังสือตอบรับการฝึกงาน',
    });

    // อัปเดต CS05 status เป็น acceptance_approved โดยตรง (ไม่ใช้ side-effect ใน getter)
    try {
      const cs05ForSync = await Document.findOne({
        where: { userId: doc.userId, documentName: 'CS05', status: 'approved' },
        order: [['created_at', 'DESC']]
      });
      if (cs05ForSync) {
        await cs05ForSync.update({ status: 'acceptance_approved', updated_at: new Date() });
      }
    } catch (e) {
      logger.warn('Acceptance approve CS05 sync warning:', e.message);
    }

    // ✅ อัพเดทสถานะการฝึกงานของนักศึกษาตาม startDate
    try {
      const student = await Student.findOne({
        where: { userId: doc.userId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['userId']
        }]
      });

      if (student) {
        // ดึงข้อมูล CS05 ที่อนุมัติแล้วเพื่อหา startDate
        const cs05Doc = await Document.findOne({
          where: {
            userId: doc.userId,
            documentName: 'CS05',
            status: 'approved'
          },
          include: [{
            model: InternshipDocument,
            as: 'internshipDocument',
            attributes: ['startDate', 'endDate']
          }],
          order: [['created_at', 'DESC']]
        });

        let newStatus = 'pending_approval'; // ค่าเริ่มต้น: รอฝึกงาน
        
        if (cs05Doc?.internshipDocument?.startDate) {
          const startDate = dayjs(cs05Doc.internshipDocument.startDate);
          const now = dayjs().tz('Asia/Bangkok');
          
          // ถ้าถึง startDate แล้ว → เป็น 'in_progress' (อยู่ระหว่างฝึกงาน)
          if (now.isSameOrAfter(startDate, 'day')) {
            newStatus = 'in_progress';
          }
        }

        // อัพเดทสถานะนักศึกษา
        if (student.internshipStatus !== newStatus) {
          await student.update({ internshipStatus: newStatus });
          logger.info(`Updated student ${student.studentId} internship status to ${newStatus} (Acceptance Letter approved)`);
        }
      }
    } catch (statusError) {
      logger.warn('Error updating student internship status after acceptance approval:', statusError.message);
      // ไม่ throw error เพื่อไม่ให้กระทบการอนุมัติ
    }

    // แจ้งเตือน notification
    try {
      const notificationService = require('../../services/notificationService');
      await notificationService.createAndNotify(doc.userId, {
        type: 'APPROVAL',
        title: 'หนังสือตอบรับได้รับการอนุมัติ',
        message: null,
        metadata: {
          documentId: doc.documentId,
          documentName: 'ACCEPTANCE',
          action: 'approved',
          targetUrl: '/internship/documents'
        }
      });
    } catch (notifyErr) {
      logger.warn('Notification failed (Acceptance approve):', notifyErr.message);
    }

    logAction('APPROVE_ACCEPTANCE', `อนุมัติหนังสือตอบรับ #${id}`, { userId: req.user.userId, ipAddress: req.ip });
    return res.json({ success: true, message: 'อนุมัติหนังสือตอบรับนักศึกษาสำเร็จ' });
  } catch (error) {
    logger.error('Acceptance approveByHead error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// ปฏิเสธ Acceptance Letter
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
    const doc = await loadAcceptance(id);
    const prevStatus = doc.status;
    if (!['draft', 'pending'].includes(prevStatus)) {
      return res.status(400).json({ success: false, message: `ไม่สามารถปฏิเสธได้เนื่องจากสถานะปัจจุบันคือ ${prevStatus}` });
    }
    await doc.update({ status: 'rejected', reviewerId: req.user.userId, reviewDate: new Date(), reviewComment: reason });
    await DocumentLog.create({
      documentId: doc.documentId,
      userId: req.user.userId,
      actionType: 'reject',
      previousStatus: prevStatus,
      newStatus: 'rejected',
      comment: reason,
    });
    // แจ้งเตือน notification
    let notificationSent = false;
    try {
      const notificationService = require('../../services/notificationService');
      await notificationService.createAndNotify(doc.userId, {
        type: 'DOCUMENT',
        title: 'หนังสือตอบรับถูกปฏิเสธ',
        message: reason || 'กรุณาตรวจสอบและแก้ไข',
        metadata: {
          documentId: doc.documentId,
          documentName: 'ACCEPTANCE',
          action: 'rejected',
          targetUrl: '/internship/documents'
        }
      });
      notificationSent = true;
    } catch (notifyErr) {
      logger.warn('Notification failed (Acceptance reject):', notifyErr.message);
    }
    logAction('REJECT_ACCEPTANCE', `ส่งกลับหนังสือตอบรับ #${id}`, { userId: req.user.userId, ipAddress: req.ip });
    return res.json({ success: true, message: 'ปฏิเสธ Acceptance Letter สำเร็จ', notificationSent });
  } catch (error) {
    logger.error('Acceptance reject error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};
