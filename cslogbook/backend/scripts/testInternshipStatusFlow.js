/**
 * Script สำหรับทดสอบการทำงานของระบบอัพเดทสถานะการฝึกงาน
 * 
 * วิธีใช้งาน:
 * 1. cd backend
 * 2. node scripts/testInternshipStatusFlow.js
 * 
 * หรือเรียกผ่าน npm script (ถ้ามี)
 */

const { sequelize } = require('../config/database');
const { User, Student, Document, InternshipDocument, InternshipCertificateRequest } = require('../models');
const internshipAdminService = require('../services/internshipAdminService');
const internshipStatusMonitor = require('../agents/internshipStatusMonitor');
const documentService = require('../services/documentService');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

async function testInternshipStatusFlow() {
  console.log('\n🧪 ========== เริ่มทดสอบระบบอัพเดทสถานะการฝึกงาน ==========\n');

  try {
    // ========== 1. ทดสอบการยกเลิกการฝึกงาน ==========
    console.log('📋 1. ทดสอบการยกเลิกการฝึกงาน');
    console.log('   - ตรวจสอบว่าสามารถยกเลิกได้');
    console.log('   - ตรวจสอบว่า CS05 และ Acceptance Letter ถูกอัพเดทเป็น cancelled');
    console.log('   - ตรวจสอบว่า Student.internshipStatus ถูก reset เป็น not_started\n');
    
    // หานักศึกษาที่มีการฝึกงานเพื่อทดสอบ
    const testStudent = await Student.findOne({
      where: { isEnrolledInternship: true },
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId']
      }]
    });

    if (testStudent) {
      const cs05Doc = await Document.findOne({
        where: {
          userId: testStudent.userId,
          documentName: 'CS05',
          status: { [require('sequelize').Op.ne]: 'cancelled' }
        },
        include: [{
          model: InternshipDocument,
          as: 'internshipDocument',
          required: true
        }]
      });

      if (cs05Doc?.internshipDocument) {
        console.log(`   ✅ พบการฝึกงานของ studentId: ${testStudent.studentId}`);
        console.log(`   💡 ใช้ API: POST /api/admin/internships/${cs05Doc.internshipDocument.internshipId}/cancel`);
        console.log(`   💡 ตรวจสอบ: CS05 status = 'cancelled', Acceptance Letter = 'cancelled', Student.internshipStatus = 'not_started'\n`);
      } else {
        console.log('   ⚠️  ไม่พบการฝึกงานที่สามารถทดสอบได้\n');
      }
    } else {
      console.log('   ⚠️  ไม่พบนักศึกษาที่มีการฝึกงาน\n');
    }

    // ========== 2. ทดสอบการอัพเดทสถานะเมื่ออนุมัติ CS05 ==========
    console.log('📋 2. ทดสอบการอัพเดทสถานะเมื่ออนุมัติ CS05');
    console.log('   - เมื่ออนุมัติ CS05 → Student.internshipStatus ควรเป็น "pending_approval"');
    console.log('   💡 ใช้ API: POST /api/internship/cs-05/{documentId}/approve');
    console.log('   💡 ตรวจสอบ: Student.internshipStatus = "pending_approval"\n');

    // ========== 3. ทดสอบการอัพเดทสถานะเมื่ออนุมัติ Acceptance Letter ==========
    console.log('📋 3. ทดสอบการอัพเดทสถานะเมื่ออนุมัติ Acceptance Letter');
    console.log('   - เมื่ออนุมัติ Acceptance Letter → เช็ค startDate');
    console.log('   - ถ้ายังไม่ถึง startDate → "pending_approval"');
    console.log('   - ถ้าถึง startDate แล้ว → "in_progress"');
    console.log('   💡 ใช้ API: POST /api/internship/acceptance/{documentId}/approve');
    console.log('   💡 ตรวจสอบ: Student.internshipStatus ตาม startDate\n');

    // ========== 4. ทดสอบ Agent ==========
    console.log('📋 4. ทดสอบ Agent (InternshipStatusMonitor)');
    console.log('   - Agent จะเช็คและอัพเดทสถานะทุกวันเวลา 02:00 น.');
    console.log('   - สามารถเรียกทดสอบได้ทันทีด้วย runNow()\n');
    
    console.log('   🔄 กำลังเรียก Agent ทันที...');
    try {
      await internshipStatusMonitor.runNow();
      console.log('   ✅ Agent ทำงานเสร็จแล้ว ตรวจสอบ logs เพื่อดูผลลัพธ์\n');
    } catch (agentError) {
      console.log(`   ⚠️  Agent Error: ${agentError.message}\n`);
    }

    // ========== 5. ทดสอบการอัพเดทสถานะเป็น completed ==========
    console.log('📋 5. ทดสอบการอัพเดทสถานะเป็น "completed"');
    console.log('   - เมื่ออนุมัติหนังสือรับรอง → Student.internshipStatus ควรเป็น "completed"');
    console.log('   💡 ใช้ API: POST /api/internship/certificate/{requestId}/approve');
    console.log('   💡 ตรวจสอบ: Student.internshipStatus = "completed", Workflow = "INTERNSHIP_COMPLETED"\n');

    // ========== 6. สรุปข้อมูลสำหรับทดสอบ ==========
    console.log('📊 ========== สรุปข้อมูลสำหรับทดสอบ ==========\n');
    
    const studentsCount = await Student.count({
      where: { isEnrolledInternship: true }
    });

    const statusCounts = await sequelize.query(
      `SELECT 
        COALESCE(internship_status, 'null') as internship_status,
        COUNT(*) as count
      FROM students 
      WHERE is_enrolled_internship = true 
      GROUP BY internship_status`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(`   นักศึกษาที่มีการฝึกงาน: ${studentsCount} คน\n`);
    console.log('   สถานะปัจจุบัน:');
    statusCounts.forEach((row) => {
      const internshipStatus = row.internship_status;
      const count = row.count;
      const statusMap = {
        'not_started': 'ยังไม่เริ่ม',
        'pending_approval': 'รอการอนุมัติ/รอฝึกงาน',
        'in_progress': 'อยู่ระหว่างฝึกงาน',
        'completed': 'เสร็จสิ้น'
      };
      console.log(`     - ${internshipStatus || 'null'}: ${count} คน (${statusMap[internshipStatus] || 'ไม่ทราบ'})`);
    });

    console.log('\n✅ ========== การทดสอบเสร็จสิ้น ==========\n');
    console.log('💡 หมายเหตุ:');
    console.log('   - ตรวจสอบ logs ใน backend/logs/ เพื่อดูรายละเอียด');
    console.log('   - ใช้ Postman หรือ Frontend เพื่อทดสอบ API endpoints');
    console.log('   - Agent จะทำงานอัตโนมัติทุกวันเวลา 02:00 น. (Asia/Bangkok)\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// รัน script ถ้าเรียกตรงๆ
if (require.main === module) {
  testInternshipStatusFlow()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { testInternshipStatusFlow };

