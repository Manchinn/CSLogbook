// สคริปต์สร้างข้อมูลจำลอง CS05 สำหรับทดสอบ
// ใช้: node scripts/seedCS05Sample.js --user 5 --status pending
// ถ้า user ไม่มี Document CS05 จะสร้างใหม่ ถ้ามีจะพิมพ์ออกมา

require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const path = require('path');
const { sequelize } = require('../config/database');
const {
  Document,
  InternshipDocument,
  Student,
  User
} = require('../models');
const fs = require('fs');

async function main() {
  const args = process.argv.slice(2);
  const argMap = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    argMap[key] = args[i + 1];
  }
  const userId = parseInt(argMap.user || argMap.userId || '0', 10);
  const status = argMap.status || 'pending'; // pending | approved | rejected

  if (!userId) {
    console.error('กรุณาระบุ --user <userId>');
    process.exit(1);
  }

  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) throw new Error('ไม่พบผู้ใช้ userId=' + userId);

    let student = await Student.findOne({ where: { userId }, transaction: t });
    if (!student) throw new Error('ไม่พบข้อมูล Student ของ userId=' + userId);

    // ตรวจสอบเอกสารล่าสุด
    const existing = await Document.findOne({
      where: { userId, documentName: 'CS05' },
      order: [['created_at', 'DESC']],
      include: [{ model: InternshipDocument, as: 'internshipDocument' }],
      transaction: t
    });

    if (existing) {
      console.log('\nพบ CS05 ปัจจุบันอยู่แล้ว:');
      console.log({
        documentId: existing.documentId,
        status: existing.status,
        companyName: existing.internshipDocument?.companyName,
        startDate: existing.internshipDocument?.startDate,
        endDate: existing.internshipDocument?.endDate
      });
      await t.rollback();
      return;
    }

    // สร้างไฟล์ transcript จำลอง (empty pdf)
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const fakePdfPath = path.join(uploadsDir, `sample-transcript-${userId}.pdf`);
    if (!fs.existsSync(fakePdfPath)) {
      fs.writeFileSync(fakePdfPath, '%PDF-1.3\n% Fake PDF for testing CS05\n');
    }

    const doc = await Document.create({
      userId,
      documentType: 'internship',
      documentName: 'CS05',
      category: 'proposal',
      status,
      filePath: fakePdfPath,
      fileName: path.basename(fakePdfPath),
      fileSize: fs.statSync(fakePdfPath).size,
      mimeType: 'application/pdf'
    }, { transaction: t });

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 55);

    const internshipDoc = await InternshipDocument.create({
      documentId: doc.documentId,
      companyName: 'บริษัททดสอบ จำกัด',
      companyAddress: '123 ถนนสุขุมวิท กรุงเทพฯ',
      startDate,
      endDate,
      status,
      internshipPosition: 'Backend Intern',
      contactPersonName: 'สมชาย ทดสอบ',
      contactPersonPosition: 'HR Manager'
    }, { transaction: t });

    // อัปเดต student internship status เล็กน้อยเพื่อให้ flow ทำงาน
    await student.update({ internshipStatus: status === 'approved' ? 'approved' : 'pending_approval', isEnrolledInternship: true }, { transaction: t });

    await t.commit();
    console.log('\nสร้างข้อมูล CS05 ตัวอย่างสำเร็จ:');
    console.log({
      documentId: doc.documentId,
      internshipId: internshipDoc.internshipId,
      status: doc.status,
      transcriptFilename: doc.fileName
    });
  } catch (err) {
    await t.rollback();
    console.error('เกิดข้อผิดพลาด:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
