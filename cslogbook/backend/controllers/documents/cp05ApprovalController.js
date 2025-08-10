const { Document, DocumentLog, User, InternshipDocument, Student } = require('../../models');
const { Op } = require('sequelize');
const internshipService = require('../../services/internshipService');

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
          attributes: ['companyName', 'startDate', 'endDate']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const data = docs.map((d) => ({
      documentId: d.documentId,
      status: d.status,
      createdAt: d.created_at,
      student: {
        userId: d.owner?.userId,
        firstName: d.owner?.firstName,
        lastName: d.owner?.lastName,
        studentCode: d.owner?.student?.studentCode || null
      },
      companyName: d.internshipDocument?.companyName || '',
      startDate: d.internshipDocument?.startDate || null,
      endDate: d.internshipDocument?.endDate || null
    }));

  return res.json({ success: true, data });
  } catch (error) {
    console.error('CP05 listForHead error:', error);
    return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// Support staff review: move to pending for head approval
exports.reviewByStaff = async (req, res) => {
  try {
    const { id } = req.params; // documentId
    const { comment } = req.body || {};

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
      reviewComment: comment || null
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
    console.error('CP05 reviewByStaff error:', error);
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

  return res.json({ success: true, message: 'อนุมัติ คพ.05 สำเร็จ' });
  } catch (error) {
    console.error('CP05 approveByHead error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// Reject by staff or head
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!reason) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเหตุผลการปฏิเสธ' });
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

    return res.json({ success: true, message: 'ปฏิเสธ คพ.05 สำเร็จ' });
  } catch (error) {
    console.error('CP05 reject error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};
