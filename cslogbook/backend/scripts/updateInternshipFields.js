const { sequelize, Student, Academic } = require('../models');
const { calculateStudentYear } = require('../utils/studentUtils');

async function updateInternshipFields() {
  try {
    console.log('เริ่มอัพเดทข้อมูล internship fields...');
    
    // ดึงข้อมูลปีการศึกษาปัจจุบัน
    const currentAcademic = await Academic.findOne({ where: { isCurrent: true } });
    if (!currentAcademic) {
      throw new Error('ไม่พบข้อมูลปีการศึกษาปัจจุบัน');
    }
    
    console.log('ปีการศึกษาปัจจุบัน:', currentAcademic.academicYear);
    
    // ดึงข้อมูลนักศึกษาทั้งหมด
    const students = await Student.findAll();
    console.log(`พบนักศึกษา ${students.length} คน`);
    
    let updatedCount = 0;
    
    for (const student of students) {
      let hasChanges = false;
      const updates = {};
      
      // คำนวณชั้นปี
      const studentYearInfo = calculateStudentYear(student.studentCode, currentAcademic.academicYear);
      const studentYear = studentYearInfo?.year || 1;
      
      // ตรวจสอบสิทธิ์การฝึกงาน
      const internshipEligibility = await student.checkInternshipEligibility();
      const projectEligibility = await student.checkProjectEligibility();
      
      // อัพเดท isEligibleInternship
      if (student.isEligibleInternship !== internshipEligibility.eligible) {
        updates.isEligibleInternship = internshipEligibility.eligible;
        hasChanges = true;
      }
      
      // อัพเดท isEligibleProject
      if (student.isEligibleProject !== projectEligibility.eligible) {
        updates.isEligibleProject = projectEligibility.eligible;
        hasChanges = true;
      }
      
      // ตรวจสอบการลงทะเบียนฝึกงาน (ดูจาก internship documents)
      const internshipQuery = `
        SELECT id.*, d.status as document_status 
        FROM internship_documents id
        INNER JOIN documents d ON id.document_id = d.document_id
        WHERE d.document_type = 'internship' AND d.user_id = ?
        LIMIT 1
      `;
      
      const [internshipResults] = await sequelize.query(internshipQuery, {
        replacements: [student.userId],
        type: sequelize.QueryTypes.SELECT
      });
      
      const internshipDoc = internshipResults;
      const isEnrolledInternship = !!internshipDoc;
      if (student.isEnrolledInternship !== isEnrolledInternship) {
        updates.isEnrolledInternship = isEnrolledInternship;
        hasChanges = true;
      }
      
      // ตรวจสอบการลงทะเบียนโครงงาน
      const projectQuery = `
        SELECT pd.*, d.status as document_status 
        FROM project_documents pd
        INNER JOIN documents d ON pd.document_id = d.document_id
        WHERE d.document_type = 'project' AND d.user_id = ?
        LIMIT 1
      `;
      
      const [projectResults] = await sequelize.query(projectQuery, {
        replacements: [student.userId],
        type: sequelize.QueryTypes.SELECT
      });
      
      const projectDoc = projectResults;
      const isEnrolledProject = !!projectDoc;
      if (student.isEnrolledProject !== isEnrolledProject) {
        updates.isEnrolledProject = isEnrolledProject;
        hasChanges = true;
      }
      
      // อัพเดท internship status
      let internshipStatus = 'not_started';
      if (internshipDoc) {
        const documentStatus = internshipDoc.document_status;
        if (documentStatus === 'completed') {
          internshipStatus = 'completed';
        } else if (documentStatus === 'approved' || documentStatus === 'supervisor_evaluated') {
          internshipStatus = 'in_progress';
        } else if (documentStatus === 'pending') {
          internshipStatus = 'pending_approval';
        }
      }
      
      if (student.internshipStatus !== internshipStatus) {
        updates.internshipStatus = internshipStatus;
        hasChanges = true;
      }
      
      // อัพเดท project status
      let projectStatus = 'not_started';
      if (projectDoc) {
        const documentStatus = projectDoc.document_status;
        if (documentStatus === 'completed') {
          projectStatus = 'completed';
        } else if (documentStatus === 'approved' || documentStatus === 'supervisor_evaluated') {
          projectStatus = 'in_progress';
        }
      }
      
      if (student.projectStatus !== projectStatus) {
        updates.projectStatus = projectStatus;
        hasChanges = true;
      }
      
      // บันทึกการเปลี่ยนแปลง
      if (hasChanges) {
        await student.update(updates);
        updatedCount++;
        console.log(`อัพเดทนักศึกษา ${student.studentCode}:`, updates);
      }
    }
    
    console.log(`อัพเดทสำเร็จ: ${updatedCount} คน`);
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  } finally {
    await sequelize.close();
  }
}

// รัน script
updateInternshipFields().then(() => {
  console.log('เสร็จสิ้น');
  process.exit(0);
}).catch(error => {
  console.error('เกิดข้อผิดพลาด:', error);
  process.exit(1);
}); 