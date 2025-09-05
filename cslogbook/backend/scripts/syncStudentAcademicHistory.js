// สคริปต์สำหรับ sync/migrate ข้อมูลย้อนหลังจาก students ไปยัง student_academic_histories
const { sequelize, Student, StudentAcademicHistory, Academic } = require('../models');

(async () => {
  const transaction = await sequelize.transaction();
  try {
    // ดึงปีการศึกษาและภาคเรียนปัจจุบัน
    const currentAcademic = await Academic.findOne({ where: { isCurrent: true }, transaction });
    if (!currentAcademic) throw new Error('ไม่พบข้อมูลปีการศึกษาปัจจุบัน');

    // ดึง student ทั้งหมด
    const students = await Student.findAll({ transaction });
    let count = 0;
    for (const student of students) {
      // ตรวจสอบว่ามีประวัติซ้ำหรือยัง (กัน insert ซ้ำ)
      const exists = await StudentAcademicHistory.findOne({
        where: {
          studentId: student.studentId,
          academicYear: currentAcademic.academicYear,
          semester: currentAcademic.currentSemester,
        },
        transaction
      });
      if (!exists) {
        await StudentAcademicHistory.create({
          studentId: student.studentId,
          academicYear: currentAcademic.academicYear,
          semester: currentAcademic.currentSemester,
          status: 'migrated',
          note: 'sync ข้อมูลย้อนหลังจาก student'
        }, { transaction });
        count++;
      }
    }
    await transaction.commit();
    console.log(`Sync สำเร็จ: เพิ่มประวัติ ${count} รายการ`);
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error('เกิดข้อผิดพลาด:', err);
    process.exit(1);
  }
})(); 