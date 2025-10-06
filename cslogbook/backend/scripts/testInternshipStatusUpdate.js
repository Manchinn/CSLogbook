const { sequelize, Student } = require('../models');
const InternshipManagementService = require('../services/internshipManagementService');

/**
 * ทดสอบการอัปเดตสถานะฝึกงานอัตโนมัติ
 */
async function testInternshipStatusUpdate() {
  try {
    console.log('🔍 ทดสอบการอัปเดตสถานะฝึกงานอัตโนมัติ...\n');

    // หานักศึกษาที่มี internship_status = 'in_progress'
    const student = await Student.findOne({
      where: { internship_status: 'in_progress' }
    });
    
    if (!student) {
      console.log('❌ ไม่พบนักศึกษาที่มี internship_status = in_progress');
      console.log('💡 หานักศึกษาคนแรกมาทดสอบแทน...');
      
      const anyStudent = await Student.findOne({
        limit: 1
      });
      
      if (anyStudent) {
        console.log(`📝 ทดสอบกับนักศึกษา ${anyStudent.student_code}`);
        console.log(`   - สถานะเดิม: ${anyStudent.internship_status}`);
        
        // อัปเดตโดยตรง
        await InternshipManagementService.updateStudentInternshipStatus(anyStudent.user_id, 'completed');
        
        // ตรวจสอบผลลัพธ์
        await anyStudent.reload();
        console.log(`   - สถานะใหม่: ${anyStudent.internship_status}`);
        
        if (anyStudent.internship_status === 'completed') {
          console.log('✅ การอัปเดตสถานะสำเร็จ!');
        } else {
          console.log('❌ การอัปเดตสถานะล้มเหลว');
        }
      }
      return;
    }

    console.log(`📋 พบนักศึกษา ${student.student_code} ที่มี status = 'in_progress':`);
    console.log(`   - User ID: ${student.user_id}`);
    console.log(`   - สถานะฝึกงานปัจจุบัน: ${student.internship_status}`);
    
    // ทดสอบการอัปเดตโดยตรง
    console.log(`   - กำลังทดสอบการอัปเดตเป็น 'completed'...`);
    await InternshipManagementService.updateStudentInternshipStatus(student.user_id, 'completed');
    
    // ตรวจสอบสถานะหลังการอัปเดต
    await student.reload();
    console.log(`   - สถานะฝึกงานหลังอัปเดต: ${student.internship_status}`);
    
    if (student.internship_status === 'completed') {
      console.log(`   ✅ อัปเดตสำเร็จ!`);
      
      // ทดสอบอัปเดตกลับเป็น 'in_progress'
      console.log(`   - กำลังทดสอบการอัปเดตกลับเป็น 'in_progress'...`);
      await InternshipManagementService.updateStudentInternshipStatus(student.user_id, 'in_progress');
      await student.reload();
      console.log(`   - สถานะฝึกงานสุดท้าย: ${student.internship_status}`);
    } else {
      console.log(`   ❌ การอัปเดตล้มเหลว`);
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await sequelize.close();
    console.log('\n🏁 เสร็จสิ้นการทดสอบ');
    process.exit(0);
  }
}

// เรียกใช้งาน
testInternshipStatusUpdate();
