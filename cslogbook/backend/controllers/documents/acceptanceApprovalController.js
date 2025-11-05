const { Document, DocumentLog, User, Student, InternshipDocument } = require('../../models');
const { Op } = require('sequelize');
const internshipManagementService = require('../../services/internshipManagementService');
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
        companyName,
        startDate,
        endDate,
        academicYear,
        semester,
      };
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
          console.log(`Updated student ${student.studentId} internship status to ${newStatus} (Acceptance Letter approved)`);
        }
      }
    } catch (statusError) {
      console.warn('Error updating student internship status after acceptance approval:', statusError.message);
      // ไม่ throw error เพื่อไม่ให้กระทบการอนุมัติ
    }

    return res.json({ success: true, message: 'อนุมัติหนังสือตอบรับนักศึกษาสำเร็จ' });
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
