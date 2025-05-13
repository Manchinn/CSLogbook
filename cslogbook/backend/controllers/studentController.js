const { User, Student, Teacher, Curriculum, Sequelize } = require("../models");const bcrypt = require("bcrypt");
const {
  calculateStudentYear,
  isEligibleForInternship,
  isEligibleForProject,
  getCurrentAcademicYear,
  getCurrentSemester,
  CONSTANTS,
} = require("../utils/studentUtils");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

// ฟังก์ชันดึงข้อมูลนักศึกษาตาม ID
const calculateEligibility = (studentCode, totalCredits, majorCredits) => {
  const studentYear = calculateStudentYear(studentCode);
  return {
    studentYear,
    internship: isEligibleForInternship(studentYear, totalCredits),
    project: isEligibleForProject(studentYear, totalCredits, majorCredits),
  };
};

// ฟังก์ชันดึงข้อมูลนักศึกษาทั้งหมด
exports.getAllStudents = async (req, res, next) => {
  try {
    const { semester, academicYear } = req.query;

    // สร้างเงื่อนไขการค้นหา
    const whereCondition = {
      role: "student",
    };

    // สร้างเงื่อนไขสำหรับ Student model
    const studentWhereCondition = {};
    if (semester) studentWhereCondition.semester = semester;
    if (academicYear) studentWhereCondition.academicYear = academicYear;

    const students = await User.findAll({
      where: whereCondition,
      attributes: ["userId", "firstName", "lastName", "email"],
      include: [
        {
          model: Student,
          as: "student",
          required: true,
          where: studentWhereCondition,
          attributes: [
            "studentId",
            "studentCode",
            "totalCredits",
            "majorCredits",
            "isEligibleInternship",
            "isEligibleProject",
            "semester",
            "academicYear",
          ],
        },
      ],
    });

    const formattedStudents = students.map((user) => {
      // กำหนดค่า status ตามค่า boolean ในฐานข้อมูล
      let status = null;

      // ตรวจสอบสถานะตามลำดับความสำคัญ
      // หากมีสิทธิ์ทั้ง internship และ project ให้ใช้ project เป็นหลัก (เพราะมีความสำคัญกว่า)
      if (user.student?.isEligibleProject) {
        status = "eligible_project";
      } else if (user.student?.isEligibleInternship) {
        status = "eligible_internship";
      }

      // หมายเหตุ: หากต้องการเพิ่มสถานะ in_progress และ completed
      // จำเป็นต้องดึงข้อมูลเพิ่มเติมจากตาราง internships และ projects
      // ตัวอย่าง (ที่ยังไม่ถูกใช้งานเนื่องจากไม่มีการดึงข้อมูลลงทะเบียนเพิ่มเติม):
      // if (hasCompletedProject) status = 'completed_project';
      // else if (hasCompletedInternship) status = 'completed_internship';
      // else if (hasActiveProject) status = 'in_progress_project';
      // else if (hasActiveInternship) status = 'in_progress_internship';

      return {
        userId: user.userId, // hidden field
        studentId: user.student?.studentId, // hidden field
        studentCode: user.student?.studentCode || "",
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        totalCredits: user.student?.totalCredits || 0,
        majorCredits: user.student?.majorCredits || 0,
        isEligibleForInternship: Boolean(user.student?.isEligibleInternship),
        isEligibleForProject: Boolean(user.student?.isEligibleProject),
        semester: user.student?.semester,
        academicYear: user.student?.academicYear,
        // เพิ่มฟิลด์ status สำหรับใช้ใน frontend
        status: status,
      };
    });

    res.json({
      success: true,
      data: formattedStudents,
      filters: {
        semester: semester || null,
        academicYear: academicYear || null,
      },
      message: "ดึงข้อมูลนักศึกษาสำเร็จ",
    });
  } catch (error) {
    console.error("Error in getAllStudents:", error);
    next(error);
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { studentCode: req.params.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลนักศึกษา",
      });
    }

    // คำนวณสิทธิ์
    const eligibility = calculateEligibility(
      student.studentCode,
      student.totalCredits || 0,
      student.majorCredits || 0
    );

    // อ่านค่าจากหลักสูตรปัจจุบัน
    const activeCurriculum = await Curriculum.findOne({
      where: { active: true },
      order: [["startYear", "DESC"]],
    });

    // ส่ง response ในรูปแบบที่มีข้อมูลเพิ่มเติม
    res.json({
      success: true,
      data: {
        studentCode: student.studentCode,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        totalCredits: student.totalCredits || 0,
        majorCredits: student.majorCredits || 0,
        eligibility: {
          studentYear: eligibility.studentYear,
          internship: eligibility.internship,
          project: eligibility.project,
        },
        // เพิ่มข้อมูลเกณฑ์
        requirements: {
          internshipBaseCredits: activeCurriculum?.internshipBaseCredits || 86,
          projectBaseCredits: activeCurriculum?.projectBaseCredits || 97,
          projectMajorBaseCredits:
            activeCurriculum?.projectMajorBaseCredits || 59,
        },
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
    });
  }
};

// ฟังก์ชันอัพเดทข้อมูลนักศึกษา
exports.updateStudent = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params;
    const { totalCredits, majorCredits, firstName, lastName } = req.body;

    // Add debug logging
    console.log("Received update data:", {
      totalCredits,
      majorCredits,
      firstName,
      lastName,
    });

    // Start transaction
    transaction = await sequelize.transaction();

    // Find student with associated user data
    const student = await Student.findOne({
      where: { studentCode: id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userId", "firstName", "lastName"],
        },
      ],
      transaction,
    });

    // Log current student data
    console.log("Current student data:", {
      studentCode: student?.studentCode,
      currentTotalCredits: student?.totalCredits,
      currentMajorCredits: student?.majorCredits,
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลนักศึกษา",
      });
    }

    // แก้ไขการ validate โดยอนุญาตให้ใส่ค่า 0 ได้
    if (totalCredits === undefined || majorCredits === undefined) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุหน่วยกิตรวมและหน่วยกิตภาควิชา",
        received: { totalCredits, majorCredits },
      });
    }

    const parsedTotalCredits = parseInt(totalCredits);
    const parsedMajorCredits = parseInt(majorCredits);

    // Log parsed values
    console.log("Parsed credits:", {
      parsedTotalCredits,
      parsedMajorCredits,
    });

    // ตรวจสอบว่าค่าที่แปลงเป็นตัวเลขสำเร็จหรือไม่
    if (isNaN(parsedTotalCredits) || isNaN(parsedMajorCredits)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "หน่วยกิตต้องเป็นตัวเลขเท่านั้น",
        received: { totalCredits, majorCredits },
      });
    }

    // Validate credit values
    if (parsedMajorCredits > parsedTotalCredits) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "หน่วยกิตภาควิชาต้องไม่มากกว่าหน่วยกิตรวม",
      });
    }

    // Calculate eligibility
    const studentYear = calculateStudentYear(id);

    const projectEligibility = isEligibleForProject(
      studentYear.year,
      parsedTotalCredits,
      parsedMajorCredits
    );
    const internshipEligibility = isEligibleForInternship(
      studentYear.year,
      parsedTotalCredits
    );

    // ตรวจสอบว่าค่าที่จะบันทึกถูกต้องหรือไม่
    console.log("Values to be saved:", {
      isEligibleInternship: internshipEligibility.eligible,
      isEligibleProject: projectEligibility.eligible,
    });

    // Update student record
    await Student.update(
      {
        totalCredits: parsedTotalCredits,
        majorCredits: parsedMajorCredits,
        isEligibleInternship: internshipEligibility.eligible,
        isEligibleProject: projectEligibility.eligible,
        lastUpdated: new Date(),
      },
      {
        where: { studentCode: id },
        transaction,
      }
    );

    // Update user record if name is provided
    if (firstName || lastName) {
      await User.update(
        {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
        },
        {
          where: { userId: student.userId },
          transaction,
        }
      );
    }

    await transaction.commit();

    // Send response with updated data
    res.json({
      success: true,
      message: "อัพเดทข้อมูลสำเร็จ",
      data: {
        studentCode: id,
        totalCredits: parsedTotalCredits,
        majorCredits: parsedMajorCredits,
        firstName: firstName || student.user.firstName,
        lastName: lastName || student.user.lastName,
        isEligibleInternship: internshipEligibility.eligible,
        isEligibleProject: projectEligibility.eligible,
        eligibilityDetails: {
          project: projectEligibility.message,
          internship: internshipEligibility.message,
        },
        lastUpdated: student.lastUpdated || new Date(),
      },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.error("Error in updateStudent:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.deleteStudent = async (req, res, next) => {
  let transaction;
  try {
    const { id } = req.params;

    transaction = await sequelize.transaction();

    // Find student first to get userId
    const student = await Student.findOne({
      where: { studentCode: id },
      transaction,
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลนักศึกษา",
      });
    }

    // Delete student record first (due to foreign key constraint)
    await Student.destroy({
      where: { studentCode: id },
      transaction,
    });

    // Then delete user record
    await User.destroy({
      where: { userId: student.userId },
      transaction,
    });

    await transaction.commit();

    res.json({
      success: true,
      message: "ลบข้อมูลนักศึกษาเรียบร้อย",
      data: {
        studentCode: id,
      },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.error("Error deleting student:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบข้อมูล",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.addStudent = async (req, res) => {
  let transaction;

  try {
    const {
      studentCode,
      firstName,
      lastName,
      totalCredits = 0,
      majorCredits = 0,
      email,
    } = req.body;

    if (!studentCode || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        required: ["studentCode", "firstName", "lastName"],
      });
    }

    transaction = await sequelize.transaction();

    const existingStudent = await Student.findOne({
      where: { studentCode },
      transaction,
    });

    if (existingStudent) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: "รหัสนักศึกษานี้มีในระบบแล้ว",
        studentCode,
      });
    }

    const user = await User.create(
      {
        username: `s${studentCode}`,
        password: await bcrypt.hash(studentCode, 10),
        firstName,
        lastName,
        email: email || `${studentCode}@email.kmutnb.ac.th`,
        role: "student",
        activeStatus: true,
      },
      { transaction }
    );

    const student = await Student.create(
      {
        studentCode,
        userId: user.userId,
        totalCredits: parseInt(totalCredits),
        majorCredits: parseInt(majorCredits),
        gpa: 0.0,
        studyType: "regular",
        isEligibleInternship: false,
        isEligibleProject: false,
        semester: getCurrentSemester(),
        academicYear: getCurrentAcademicYear(),
        advisorId: null,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "เพิ่มข้อมูลนักศึกษาสำเร็จ",
      data: {
        userId: user.userId,
        studentId: student.studentId,
        studentCode: student.studentCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        totalCredits: student.totalCredits,
        majorCredits: student.majorCredits,
      },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.error("Error adding student:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "ข้อมูลซ้ำในระบบ กรุณาตรวจสอบรหัสนักศึกษาหรืออีเมล",
      });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// เพิ่มฟังก์ชันสำหรับดึงข้อมูลทั้งหมด
exports.getAllStudentStats = async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: [
        "studentId",
        "studentCode",
        "totalCredits",
        "majorCredits",
        "isEligibleInternship",
        "isEligibleProject",
        "gpa",
        "studyType",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName"],
        },
        {
          model: Teacher,
          as: "advisor",
          attributes: ["firstName", "lastName"],
        },
      ],
    });

    const stats = {
      total: students.length,
      internshipEligible: students.filter((s) => s.isEligibleInternship).length,
      projectEligible: students.filter((s) => s.isEligibleProject).length,
      students: students.map((s) => ({
        id: s.studentId,
        studentCode: s.studentCode,
        name: `${s.user.firstName} ${s.user.lastName}`,
        advisor: s.advisor
          ? `${s.advisor.firstName} ${s.advisor.lastName}`
          : "ยังไม่มีที่ปรึกษา",
        totalCredits: s.totalCredits,
        majorCredits: s.majorCredits,
        gpa: s.gpa?.toFixed(2) || "0.00",
        studyType: s.studyType === "regular" ? "ภาคปกติ" : "ภาคพิเศษ",
        isEligibleInternship: s.isEligibleInternship,
        isEligibleProject: s.isEligibleProject,
      })),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};

// เพิ่มฟังก์ชันสำหรับตรวจสอบสิทธิ์นักศึกษาโดยละเอียด
exports.checkStudentEligibility = async (req, res) => {
  try {
    console.log('Request user info:', req.user); // เพิ่ม debugging
    
    const studentId = req.user?.studentId;
    if (!studentId) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา (Missing studentId)',
        debug: { user: req.user }
      });
    }
    
    console.log(`Looking for student ID: ${studentId}`);
    
    const student = await Student.findByPk(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา (Student not found)',
        studentId
      });
    }
    
    // ตรวจสอบรายละเอียดสิทธิ์โดยใช้ instance method ที่เพิ่มใน model Student
    const [internshipCheck, projectCheck] = await Promise.all([
      student.checkInternshipEligibility(),
      student.checkProjectEligibility()
    ]);
    
    // ดึงข้อมูลการตั้งค่าปีการศึกษาล่าสุด
    const academicSettings = await sequelize.models.Academic.findOne({
      order: [['created_at', 'DESC']] // ใช้รายการล่าสุดแทน isActive
    });
    
    // หาหลักสูตรที่ใช้งานอยู่
    let curriculum = null;
    if (academicSettings?.activeCurriculumId) {
      curriculum = await sequelize.models.Curriculum.findOne({
        where: { 
          curriculumId: academicSettings.activeCurriculumId,
          active: true
        }
      });
    }
    
    // กำหนดค่า default ที่จะใช้ในกรณีไม่พบข้อมูลหลักสูตร
    const defaultCurriculumValues = {
      internshipBaseCredits: 81,
      internshipMajorBaseCredits: 0,
      projectBaseCredits: 95,
      projectMajorBaseCredits: 47,
      requireInternshipBeforeProject: false,
      name: 'หลักสูตรค่าเริ่มต้น',
      shortName: 'CS Default'
    };
    
    // แปลงข้อมูล JSON สำหรับ internshipSemesters และ projectSemesters
    let internshipSemesters = academicSettings?.internshipSemesters;
    let projectSemesters = academicSettings?.projectSemesters;
    
    // แปลง JSON string เป็น array (ถ้าจำเป็น)
    if (typeof internshipSemesters === 'string') {
      try {
        internshipSemesters = JSON.parse(internshipSemesters);
      } catch (e) {
        internshipSemesters = [3]; // ค่า default
      }
    }
    
    if (typeof projectSemesters === 'string') {
      try {
        projectSemesters = JSON.parse(projectSemesters);
      } catch (e) {
        projectSemesters = [1, 2]; // ค่า default
      }
    }
    
    // กำหนดค่า default ถ้าไม่มีข้อมูล
    internshipSemesters = internshipSemesters || [3];
    projectSemesters = projectSemesters || [1, 2];
    
    // เพิ่มข้อมูลสรุปสถานะว่านักศึกษาสามารถเข้าระบบได้หรือไม่ และเพราะเหตุใด
    const internshipRegistration = safeParseJSON(academicSettings?.internshipRegistration);
    const projectRegistration = safeParseJSON(academicSettings?.projectRegistration);

    // สร้างข้อมูลที่เข้าใจง่ายเกี่ยวกับสถานะการลงทะเบียนฝึกงาน
    const internshipStatus = {
      canAccess: internshipCheck.canAccessFeature || false,
      canRegister: internshipCheck.canRegister || false,
      reason: internshipCheck.reason || (internshipCheck.canAccessFeature ? "มีสิทธิ์เข้าถึงระบบฝึกงาน" : "ไม่มีสิทธิ์เข้าถึงระบบฝึกงาน"),
      registrationOpen: false,
      registrationReason: "",
      requiredCredits: curriculum?.internshipBaseCredits || defaultCurriculumValues.internshipBaseCredits,
      requiredMajorCredits: curriculum?.internshipMajorBaseCredits || defaultCurriculumValues.internshipMajorBaseCredits,
      currentCredits: student.totalCredits,
      currentMajorCredits: student.majorCredits
    };
    
    // สร้างข้อมูลที่เข้าใจง่ายเกี่ยวกับสถานะการลงทะเบียนโครงงาน
    const projectStatus = {
      canAccess: projectCheck.canAccessFeature || false,
      canRegister: projectCheck.canRegister || false,
      reason: projectCheck.reason || (projectCheck.canAccessFeature ? "มีสิทธิ์เข้าถึงระบบโครงงาน" : "ไม่มีสิทธิ์เข้าถึงระบบโครงงาน"),
      registrationOpen: false,
      registrationReason: "",
      requiredCredits: curriculum?.projectBaseCredits || defaultCurriculumValues.projectBaseCredits,
      requiredMajorCredits: curriculum?.projectMajorBaseCredits || defaultCurriculumValues.projectMajorBaseCredits,
      currentCredits: student.totalCredits,
      currentMajorCredits: student.majorCredits,
      requiresInternshipCompletion: curriculum?.requireInternshipBeforeProject || defaultCurriculumValues.requireInternshipBeforeProject
    };
    
    // เพิ่มข้อมูลเกี่ยวกับช่วงเวลาลงทะเบียน
    const now = new Date();
    
    if (internshipRegistration?.startDate && internshipRegistration?.endDate) {
      const start = new Date(internshipRegistration.startDate);
      const end = new Date(internshipRegistration.endDate);
      
      internshipStatus.registrationOpen = now >= start && now <= end;
      if (!internshipStatus.registrationOpen) {
        if (now < start) {
          internshipStatus.registrationReason = `ช่วงลงทะเบียนฝึกงานยังไม่เปิด (เปิดวันที่ ${formatDate(start)})`;
        } else {
          internshipStatus.registrationReason = `ช่วงลงทะเบียนฝึกงานปิดไปแล้ว (ปิดวันที่ ${formatDate(end)})`;
        }
      } else {
        internshipStatus.registrationReason = `ช่วงลงทะเบียนฝึกงานเปิดอยู่ (ถึงวันที่ ${formatDate(end)})`;
      }
    } else {
      internshipStatus.registrationReason = "ไม่มีข้อมูลช่วงลงทะเบียนฝึกงาน";
    }
    
    if (projectRegistration?.startDate && projectRegistration?.endDate) {
      const start = new Date(projectRegistration.startDate);
      const end = new Date(projectRegistration.endDate);
      
      projectStatus.registrationOpen = now >= start && now <= end;
      if (!projectStatus.registrationOpen) {
        if (now < start) {
          projectStatus.registrationReason = `ช่วงลงทะเบียนโครงงานยังไม่เปิด (เปิดวันที่ ${formatDate(start)})`;
        } else {
          projectStatus.registrationReason = `ช่วงลงทะเบียนโครงงานปิดไปแล้ว (ปิดวันที่ ${formatDate(end)})`;
        }
      } else {
        projectStatus.registrationReason = `ช่วงลงทะเบียนโครงงานเปิดอยู่ (ถึงวันที่ ${formatDate(end)})`;
      }
    } else {
      projectStatus.registrationReason = "ไม่มีข้อมูลช่วงลงทะเบียนโครงงาน";
    }
    
    // สร้าง eligibility object ที่มีข้อมูลแยกระหว่างการเข้าถึง feature และการลงทะเบียน
    const eligibility = {
      internship: {
        isEligible: internshipCheck.eligible,
        canAccessFeature: internshipCheck.canAccessFeature || false,
        canRegister: internshipCheck.canRegister || false,
        reason: internshipCheck.reason || null
      },
      project: {
        isEligible: projectCheck.eligible,
        canAccessFeature: projectCheck.canAccessFeature || false,
        canRegister: projectCheck.canRegister || false,
        reason: projectCheck.reason || null
      }
    };
    
    // สร้าง curriculumData object เพื่อแสดงข้อมูลหลักสูตร (ทั้งจากฐานข้อมูลหรือค่า default)
    const curriculumData = curriculum ? {
      id: curriculum.curriculumId,
      name: curriculum.name,
      shortName: curriculum.shortName,
      isActive: true
    } : {
      id: null,
      name: defaultCurriculumValues.name,
      shortName: defaultCurriculumValues.shortName,
      isActive: true, // ใช้เป็น true เพื่อให้ถูกใช้เป็นค่า default
      isDefault: true // เพิ่มฟิลด์ isDefault เพื่อระบุว่านี่คือค่า default
    };
    
    // ส่งข้อมูลที่มีรายละเอียดครบถ้วนกลับไปให้ client
    res.status(200).json({
      success: true,
      student: {
        studentId: student.studentId,
        studentCode: student.studentCode,
        totalCredits: student.totalCredits,
        majorCredits: student.majorCredits,
      },
      eligibility: eligibility,
      status: {
        internship: internshipStatus,
        project: projectStatus
      },
      requirements: {
        internship: {
          totalCredits: curriculum?.internshipBaseCredits || defaultCurriculumValues.internshipBaseCredits,
          majorCredits: curriculum?.internshipMajorBaseCredits || defaultCurriculumValues.internshipMajorBaseCredits,
          allowedSemesters: internshipSemesters
        },
        project: {
          totalCredits: curriculum?.projectBaseCredits || defaultCurriculumValues.projectBaseCredits,
          majorCredits: curriculum?.projectMajorBaseCredits || defaultCurriculumValues.projectMajorBaseCredits,
          requireInternship: curriculum?.requireInternshipBeforeProject || defaultCurriculumValues.requireInternshipBeforeProject,
          allowedSemesters: projectSemesters
        },
      },
      academicSettings: academicSettings ? {
        currentAcademicYear: academicSettings.academicYear,
        currentSemester: academicSettings.currentSemester,
        internshipRegistrationPeriod: internshipRegistration,
        projectRegistrationPeriod: projectRegistration,
      } : {
        currentAcademicYear: new Date().getFullYear() + 543,
        currentSemester: ((new Date().getMonth() + 1) <= 4 ? 2 : ((new Date().getMonth() + 1) <= 8 ? 3 : 1)),
        internshipRegistrationPeriod: null,
        projectRegistrationPeriod: null,
      },
      curriculum: curriculumData
    });
    
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
      error: error.message
    });
  }
};

// ฟังก์ชันช่วย parse JSON string หรือ return null ถ้า parse ไม่ได้
const safeParseJSON = (jsonString) => {
  if (!jsonString) return null;
  
  if (typeof jsonString === 'object') return jsonString;
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
};

// ฟังก์ชันช่วยในการฟอร์แมตวันที่
const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
};
