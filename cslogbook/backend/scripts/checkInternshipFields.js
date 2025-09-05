const { sequelize, Student } = require('../models');

async function checkInternshipFields() {
  try {
    console.log('ตรวจสอบ fields ที่เกี่ยวข้องกับ internship...');
    
    // ตรวจสอบโครงสร้างตาราง students
    const tableInfo = await sequelize.query("DESCRIBE students", { type: sequelize.QueryTypes.SELECT });
    console.log('\nโครงสร้างตาราง students:');
    tableInfo.forEach(field => {
      console.log(`- ${field.Field}: ${field.Type} (${field.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // ตรวจสอบข้อมูลนักศึกษาสุ่ม 3 คน
    const students = await Student.findAll({
      limit: 3,
      attributes: [
        'studentId', 'studentCode', 'totalCredits', 'majorCredits',
        'isEligibleInternship', 'isEligibleProject',
        'internshipStatus', 'projectStatus',
        'isEnrolledInternship', 'isEnrolledProject'
      ]
    });
    
    console.log('\nข้อมูลนักศึกษาสุ่ม 3 คน:');
    students.forEach(student => {
      console.log(`\nนักศึกษา ${student.studentCode}:`);
      console.log(`- isEligibleInternship: ${student.isEligibleInternship}`);
      console.log(`- isEligibleProject: ${student.isEligibleProject}`);
      console.log(`- internshipStatus: ${student.internshipStatus}`);
      console.log(`- projectStatus: ${student.projectStatus}`);
      console.log(`- isEnrolledInternship: ${student.isEnrolledInternship}`);
      console.log(`- isEnrolledProject: ${student.isEnrolledProject}`);
    });
    
    // ตรวจสอบจำนวนนักศึกษาที่มีข้อมูลแต่ละประเภท
    const totalStudents = await Student.count();
    const eligibleInternship = await Student.count({ where: { isEligibleInternship: true } });
    const enrolledInternship = await Student.count({ where: { isEnrolledInternship: true } });
    const completedInternship = await Student.count({ where: { internshipStatus: 'completed' } });
    
    console.log('\nสถิติ:');
    console.log(`- นักศึกษาทั้งหมด: ${totalStudents}`);
    console.log(`- มีสิทธิ์ฝึกงาน: ${eligibleInternship}`);
    console.log(`- ลงทะเบียนฝึกงาน: ${enrolledInternship}`);
    console.log(`- ฝึกงานเสร็จสิ้น: ${completedInternship}`);
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await sequelize.close();
  }
}

// รัน script
checkInternshipFields().then(() => {
  console.log('\nเสร็จสิ้น');
  process.exit(0);
}).catch(error => {
  console.error('เกิดข้อผิดพลาด:', error);
  process.exit(1);
}); 