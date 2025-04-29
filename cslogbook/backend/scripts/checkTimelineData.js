// สคริปต์สำหรับตรวจสอบข้อมูล timeline และ important_deadlines
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const { TimelineStep, ImportantDeadline, Student, sequelize } = require('../models');

async function checkData() {
  try {
    console.log('====== เริ่มตรวจสอบข้อมูล Timeline และ Important Deadlines ======');
    
    // ตรวจสอบโครงสร้างตาราง TimelineStep
    console.log('\n1. โครงสร้างตาราง TimelineStep:');
    const timelineFields = await sequelize.query('DESCRIBE timeline_steps', { type: sequelize.QueryTypes.SELECT });
    console.log(JSON.stringify(timelineFields, null, 2));
    
    // ตรวจสอบโครงสร้างตาราง ImportantDeadline
    console.log('\n2. โครงสร้างตาราง ImportantDeadline:');
    const deadlineFields = await sequelize.query('DESCRIBE important_deadlines', { type: sequelize.QueryTypes.SELECT });
    console.log(JSON.stringify(deadlineFields, null, 2));
    
    // ตรวจสอบข้อมูล TimelineStep
    console.log('\n3. ตัวอย่างข้อมูล TimelineStep (5 รายการแรก):');
    const timelineSteps = await TimelineStep.findAll({ limit: 5 });
    console.log(JSON.stringify(timelineSteps, null, 2));
    
    // ตรวจสอบข้อมูล ImportantDeadline
    console.log('\n4. ตัวอย่างข้อมูล ImportantDeadline (5 รายการแรก):');
    const deadlines = await ImportantDeadline.findAll({ limit: 5 });
    console.log(JSON.stringify(deadlines, null, 2));
    
    // ตรวจสอบนักศึกษาในระบบ
    console.log('\n5. ตัวอย่างข้อมูลนักศึกษา (5 รายการแรก):');
    const students = await Student.findAll({ limit: 5 });
    console.log(JSON.stringify(students.map(s => ({
      studentId: s.studentId,
      studentCode: s.studentCode,
      firstName: s.firstName,
      lastName: s.lastName
    })), null, 2));

    // ทดลองสร้าง query เพื่อเรียกดูข้อมูล timeline steps ของนักศึกษาที่มี studentCode = '6411111111111'
    console.log('\n6. ข้อมูล Timeline ของนักศึกษารหัส 6411111111111:');
    const student = await Student.findOne({ where: { studentCode: '6411111111111' } });
    
    if (student) {
      console.log(`พบข้อมูลนักศึกษา: ${student.firstName} ${student.lastName} (ID: ${student.studentId})`);
      
      const internshipSteps = await TimelineStep.findAll({
        where: { 
          student_id: student.studentId,
          type: 'internship'
        },
        order: [['step_order', 'ASC']]
      });
      
      console.log(`พบขั้นตอนฝึกงาน: ${internshipSteps.length} รายการ`);
      console.log(JSON.stringify(internshipSteps, null, 2));
    } else {
      console.log('ไม่พบข้อมูลนักศึกษารหัส 6411111111111');
    }
    
    console.log('\n====== ตรวจสอบข้อมูลเสร็จสิ้น ======');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkData();