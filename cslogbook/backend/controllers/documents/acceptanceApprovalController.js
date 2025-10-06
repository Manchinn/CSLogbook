const { Document, DocumentLog, User, Student } = require('../../models');
const { Op } = require('sequelize');
const internshipManagementService = require('../../services/internshipManagementService');

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

// คิวหัวหน้าภาค: รายการ Acceptance Letter ที่รออนุมัติ (ผ่านเจ้าหน้าที่ภาคแล้ว)
exports.listForHead = async (req, res) => {
  try {
    const docs = await Document.findAll({
      where: {
        documentName: 'ACCEPTANCE_LETTER',
        category: 'acceptance',
        status: 'pending',
        reviewerId: { [Op.not]: null },
      },
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

    const data = docs.map((d) => ({
      documentId: d.documentId,
      status: d.status,
      reviewerId: d.reviewerId,
      reviewDate: d.reviewDate || d.review_date,
      createdAt: d.created_at,
      student: {
        userId: d.owner?.userId,
        firstName: d.owner?.firstName,
        lastName: d.owner?.lastName,
        studentCode: d.owner?.student?.studentCode || null,
      },
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Acceptance listForHead error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// เจ้าหน้าที่ภาคตรวจและส่งต่อ
exports.reviewByStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body || {};
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
    console.error('Acceptance reviewByStaff error:', error);
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

    // ซิงค์สถานะ CS05 ให้สอดคล้อง (อาศัย service ที่คำนวณและอัปเดตสถานะ)
    try {
      await internshipManagementService.getAcceptanceLetterStatus(doc.userId, null);
    } catch (e) {
      console.warn('Acceptance approve sync warning:', e.message);
    }

    return res.json({ success: true, message: 'อนุมัติ Acceptance Letter สำเร็จ' });
  } catch (error) {
    console.error('Acceptance approveByHead error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};

// ปฏิเสธ Acceptance Letter
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    if (!reason) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุเหตุผลการปฏิเสธ' });
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
    // ส่ง real-time notification สำหรับ Acceptance ถูกปฏิเสธ (เผื่อ frontend ใช้งานร่วม)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${doc.userId}`).emit('document:rejected', {
          documentId: doc.documentId,
          documentName: 'ACCEPTANCE',
          status: 'rejected',
          reason,
          message: 'หนังสือตอบรับการฝึกงานของคุณถูกปฏิเสธ'
        });
      }
    } catch (notifyErr) {
      console.warn('Socket emit failed (Acceptance reject):', notifyErr.message);
    }
    return res.json({ success: true, message: 'ปฏิเสธ Acceptance Letter สำเร็จ' });
  } catch (error) {
    console.error('Acceptance reject error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาด' });
  }
};
