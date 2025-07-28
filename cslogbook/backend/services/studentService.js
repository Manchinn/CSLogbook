const { User, Student, Teacher, Curriculum, StudentAcademicHistory, Academic } = require("../models");
const bcrypt = require("bcrypt");
const {
  calculateStudentYear,
  isEligibleForInternship,
  isEligibleForProject,
  getCurrentAcademicYear,
  getCurrentSemester,
} = require("../utils/studentUtils");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const logger = require("../utils/logger");

class StudentService {
  /**
   * คำนวณสิทธิ์ของนักศึกษา
   */
  calculateEligibility(studentCode, totalCredits, majorCredits) {
    const studentYear = calculateStudentYear(studentCode);
    return {
      studentYear,
      internship: isEligibleForInternship(studentYear, totalCredits),
      project: isEligibleForProject(studentYear, totalCredits, majorCredits),
    };
  }

  /**
   * ดึงข้อมูลนักศึกษาทั้งหมดพร้อมกรองข้อมูล
   */
  async getAllStudents(filters = {}) {
    try {
      const { semester, academicYear } = filters;

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
              "classroom",
              "phoneNumber",
            ],
          },
        ],
      });

      return students.map((user) => {
        // กำหนดค่า status ตามค่า boolean ในฐานข้อมูล
        let status = null;

        // ตรวจสอบสถานะตามลำดับความสำคัญ
        if (user.student?.isEligibleProject) {
          status = "eligible_project";
        } else if (user.student?.isEligibleInternship) {
          status = "eligible_internship";
        }

        return {
          userId: user.userId,
          studentId: user.student?.studentId,
          studentCode: user.student?.studentCode,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          totalCredits: user.student?.totalCredits || 0,
          majorCredits: user.student?.majorCredits || 0,
          isEligibleForInternship: Boolean(user.student?.isEligibleInternship),
          isEligibleForProject: Boolean(user.student?.isEligibleProject),
          semester: user.student?.semester,
          academicYear: user.student?.academicYear,
          status: status,
          classroom: user.student?.classroom ,
          phoneNumber: user.student?.phoneNumber ,
        };
      });
    } catch (error) {
      logger.error("Error in getAllStudents service:", error);
      throw new Error("ไม่สามารถดึงข้อมูลนักศึกษาได้");
    }
  }

  /**
   * ดึงข้อมูลนักศึกษาตาม studentCode
   */
  async getStudentById(studentCode) {
    try {
      const student = await Student.findOne({
        where: { studentCode },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["firstName", "lastName", "email"],
          },
        ],
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // คำนวณสิทธิ์
      const eligibility = this.calculateEligibility(
        student.studentCode,
        student.totalCredits || 0,
        student.majorCredits || 0
      );

      // อ่านค่าจากหลักสูตรปัจจุบัน
      const activeCurriculum = await Curriculum.findOne({
        where: { active: true },
        order: [["startYear", "DESC"]],
      });

      return {
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
        requirements: {
          internshipBaseCredits: activeCurriculum?.internshipBaseCredits,
          projectBaseCredits: activeCurriculum?.projectBaseCredits,
          projectMajorBaseCredits: activeCurriculum?.projectMajorBaseCredits,
        },
      };
    } catch (error) {
      logger.error("Error in getStudentById service:", error);
      if (error.message === "ไม่พบข้อมูลนักศึกษา") {
        throw error;
      }
      throw new Error("ไม่สามารถดึงข้อมูลนักศึกษาได้");
    }
  }

  /**
   * อัพเดทข้อมูลนักศึกษา
   */
  async updateStudent(studentCode, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const { totalCredits, majorCredits, firstName, lastName, status, note } = updateData;

      logger.info("Received update data:", {
        totalCredits,
        majorCredits,
        firstName,
        lastName,
        status,
        note
      });

      // Find student with associated user data
      const student = await Student.findOne({
        where: { studentCode },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["userId", "firstName", "lastName"],
          },
        ],
        transaction,
      });

      if (!student) {
        await transaction.rollback();
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // แก้ไขการ validate โดยอนุญาตให้ใส่ค่า 0 ได้
      if (totalCredits === undefined || majorCredits === undefined) {
        await transaction.rollback();
        throw new Error("กรุณาระบุหน่วยกิตรวมและหน่วยกิตภาควิชา");
      }

      const parsedTotalCredits = parseInt(totalCredits);
      const parsedMajorCredits = parseInt(majorCredits);

      // ตรวจสอบว่าค่าที่แปลงเป็นตัวเลขสำเร็จหรือไม่
      if (isNaN(parsedTotalCredits) || isNaN(parsedMajorCredits)) {
        await transaction.rollback();
        throw new Error("หน่วยกิตต้องเป็นตัวเลขเท่านั้น");
      }

      // Validate credit values
      if (parsedMajorCredits > parsedTotalCredits) {
        await transaction.rollback();
        throw new Error("หน่วยกิตภาควิชาต้องไม่มากกว่าหน่วยกิตรวม");
      }

      // Calculate eligibility
      const studentYear = calculateStudentYear(studentCode);

      const projectEligibility = isEligibleForProject(
        studentYear.year,
        parsedTotalCredits,
        parsedMajorCredits
      );
      const internshipEligibility = isEligibleForInternship(
        studentYear.year,
        parsedTotalCredits
      );

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
          where: { studentCode },
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

      // ดึงปีการศึกษาและภาคเรียนปัจจุบันจาก Academic
      const currentAcademic = await Academic.findOne({ where: { isCurrent: true }, transaction });
      if (currentAcademic) {
        await StudentAcademicHistory.create({
          studentId: student.studentId,
          academicYear: currentAcademic.academicYear,
          semester: currentAcademic.currentSemester,
          status: status || 'updated',
          note: note || 'อัปเดตข้อมูลนักศึกษา'
        }, { transaction });
      }

      await transaction.commit();

      return {
        studentCode,
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
        lastUpdated: new Date(),
      };
    } catch (error) {
      await transaction.rollback();
      logger.error("Error in updateStudent service:", error);
      throw error;
    }
  }

  /**
   * ลบข้อมูลนักศึกษา
   */
  async deleteStudent(studentCode) {
    const transaction = await sequelize.transaction();

    try {
      // Find student first to get userId
      const student = await Student.findOne({
        where: { studentCode },
        transaction,
      });

      if (!student) {
        await transaction.rollback();
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // Delete student record first (due to foreign key constraint)
      await Student.destroy({
        where: { studentCode },
        transaction,
      });

      // Then delete user record
      await User.destroy({
        where: { userId: student.userId },
        transaction,
      });

      await transaction.commit();

      return { studentCode };
    } catch (error) {
      await transaction.rollback();
      logger.error("Error in deleteStudent service:", error);
      throw error;
    }
  }

  /**
   * เพิ่มนักศึกษาใหม่
   */
  async addStudent(studentData) {
    const transaction = await sequelize.transaction();

    try {
      const {
        studentCode,
        firstName,
        lastName,
        totalCredits = 0,
        majorCredits = 0,
        email,
      } = studentData;

      if (!studentCode || !firstName || !lastName) {
        throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
      }

      const existingStudent = await Student.findOne({
        where: { studentCode },
        transaction,
      });

      if (existingStudent) {
        await transaction.rollback();
        throw new Error("รหัสนักศึกษานี้มีในระบบแล้ว");
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
          // semester: getCurrentSemester(), // ลบออกเพราะ migrate แล้ว
          // academicYear: getCurrentAcademicYear(), // ลบออกเพราะ migrate แล้ว
          advisorId: null,
        },
        { transaction }
      );

      // ดึงปีการศึกษาและภาคเรียนปัจจุบันจาก Academic
      const currentAcademic = await Academic.findOne({ where: { isCurrent: true }, transaction });
      if (currentAcademic) {
        await StudentAcademicHistory.create({
          studentId: student.studentId,
          academicYear: currentAcademic.academicYear,
          semester: currentAcademic.currentSemester,
          status: 'enrolled',
          note: 'เพิ่มนักศึกษาใหม่'
        }, { transaction });
      }

      await transaction.commit();

      return {
        userId: user.userId,
        studentId: student.studentId,
        studentCode: student.studentCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        totalCredits: student.totalCredits,
        majorCredits: student.majorCredits,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error("Error in addStudent service:", error);
      throw error;
    }
  }

  /**
   * ดึงสถิตินักศึกษาทั้งหมด
   */
  async getAllStudentStats() {
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
        internshipEligible: students.filter((s) => s.isEligibleInternship)
          .length,
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

      return stats;
    } catch (error) {
      logger.error("Error in getAllStudentStats service:", error);
      throw new Error("ไม่สามารถดึงสถิตินักศึกษาได้");
    }
  }

  /**
   * ตรวจสอบสิทธิ์นักศึกษาโดยละเอียด
   */
  async checkStudentEligibility(studentId) {
    try {
      logger.info(`Checking eligibility for student ID: ${studentId}`);

      const student = await Student.findByPk(studentId);

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // ตรวจสอบรายละเอียดสิทธิ์โดยใช้ instance method ที่เพิ่มใน model Student
      const [internshipCheck, projectCheck] = await Promise.all([
        student.checkInternshipEligibility(),
        student.checkProjectEligibility(),
      ]);

      // ดึงข้อมูลการตั้งค่าปีการศึกษาล่าสุด
      const academicSettings = await sequelize.models.Academic.findOne({
        order: [["created_at", "DESC"]],
      });

      // หาบลักสูตรที่ใช้งานอยู่
      let curriculum = null;
      if (academicSettings?.activeCurriculumId) {
        curriculum = await sequelize.models.Curriculum.findOne({
          where: {
            curriculumId: academicSettings.activeCurriculumId,
            active: true,
          },
        });
      }

      // แปลงข้อมูล JSON สำหรับ internshipSemesters และ projectSemesters
      let internshipSemesters = this.parseJsonField(
        academicSettings?.internshipSemesters,
        [3]
      );
      let projectSemesters = this.parseJsonField(
        academicSettings?.projectSemesters,
        [1, 2]
      );

      const internshipRegistration = this.parseJsonField(
        academicSettings?.internshipRegistration
      );
      const projectRegistration = this.parseJsonField(
        academicSettings?.projectRegistration
      );

      // สำหรับการพัฒนา: ให้สิทธิ์การเข้าถึงและการลงทะเบียนฝึกงานขึ้นอยู่กับเกณฑ์หน่วยกิต
      const isCreditEligibleForInternship = internshipCheck.eligible;

      const internshipStatus = {
        canAccess: isCreditEligibleForInternship,
        canRegister: isCreditEligibleForInternship,
        reason: isCreditEligibleForInternship
          ? "ผ่านเกณฑ์หน่วยกิต (สำหรับการพัฒนา)"
          : internshipCheck.reason || "ไม่ผ่านเกณฑ์หน่วยกิต",
        registrationOpen: isCreditEligibleForInternship,
        registrationReason: isCreditEligibleForInternship
          ? "ช่วงลงทะเบียนเปิด (สำหรับการพัฒนา)"
          : "เงื่อนไขหน่วยกิตไม่ผ่าน",
        requiredCredits: curriculum?.internshipBaseCredits,
        requiredMajorCredits: curriculum?.internshipMajorBaseCredits,
        currentCredits: student.totalCredits,
        currentMajorCredits: student.majorCredits,
      };

      // สร้างข้อมูลที่เข้าใจง่ายเกี่ยวกับสถานะการลงทะเบียนโครงงาน
      const projectStatus = {
        canAccess: projectCheck.canAccessFeature || false,
        canRegister: projectCheck.canRegister || false,
        reason:
          projectCheck.reason ||
          (projectCheck.canAccessFeature
            ? "มีสิทธิ์เข้าถึงระบบโครงงาน"
            : "ไม่มีสิทธิ์เข้าถึงระบบโครงงาน"),
        registrationOpen: false,
        registrationReason: "",
        requiredCredits: curriculum?.projectBaseCredits,
        requiredMajorCredits: curriculum?.projectMajorBaseCredits,
        currentCredits: student.totalCredits,
        currentMajorCredits: student.majorCredits,
        requiresInternshipCompletion: curriculum?.requireInternshipBeforeProject,
      };

      // ตรวจสอบช่วงเวลาสำหรับโครงงาน
      if (projectRegistration?.startDate && projectRegistration?.endDate) {
        const now = new Date();
        const start = new Date(projectRegistration.startDate);
        const end = new Date(projectRegistration.endDate);

        projectStatus.registrationOpen = now >= start && now <= end;
        if (!projectStatus.registrationOpen) {
          if (now < start) {
            projectStatus.registrationReason = `ช่วงลงทะเบียนโครงงานยังไม่เปิด (เปิดวันที่ ${this.formatDate(
              start
            )})`;
          } else {
            projectStatus.registrationReason = `ช่วงลงทะเบียนโครงงานปิดไปแล้ว (ปิดวันที่ ${this.formatDate(
              end
            )})`;
          }
        } else {
          projectStatus.registrationReason = `ช่วงลงทะเบียนโครงงานเปิดอยู่ (ถึงวันที่ ${this.formatDate(
            end
          )})`;
        }
      } else {
        projectStatus.registrationReason = "ไม่มีข้อมูลช่วงลงทะเบียนโครงงาน";
      }

      // สร้าง eligibility object
      const eligibility = {
        internship: {
          isEligible: isCreditEligibleForInternship,
          canAccessFeature: isCreditEligibleForInternship,
          canRegister: isCreditEligibleForInternship,
          reason: isCreditEligibleForInternship
            ? "ผ่านเกณฑ์หน่วยกิต (สำหรับการพัฒนา)"
            : internshipCheck.reason || "ไม่ผ่านเกณฑ์หน่วยกิต",
        },
        project: {
          isEligible: projectCheck.eligible,
          canAccessFeature: projectCheck.canAccessFeature || false,
          canRegister: projectCheck.canRegister || false,
          reason: projectCheck.reason || null,
        },
      };

      const curriculumData = curriculum
        ? {
            id: curriculum.curriculumId,
            name: curriculum.name,
            shortName: curriculum.shortName,
            isActive: true,
          }
        : {
            id: null,
            name: null,
            shortName: null,
            isActive: false,
          };

      return {
        student: {
          studentId: student.studentId,
          studentCode: student.studentCode,
          totalCredits: student.totalCredits,
          majorCredits: student.majorCredits,
        },
        eligibility: eligibility,
        status: {
          internship: internshipStatus,
          project: projectStatus,
        },
        requirements: {
          internship: {
            totalCredits: curriculum?.internshipBaseCredits,
            majorCredits: curriculum?.internshipMajorBaseCredits,
            allowedSemesters: internshipSemesters,
          },
          project: {
            totalCredits: curriculum?.projectBaseCredits,
            majorCredits: curriculum?.projectMajorBaseCredits,
            requireInternship: curriculum?.requireInternshipBeforeProject,
            allowedSemesters: projectSemesters,
          },
        },
        academicSettings: academicSettings
          ? {
              currentAcademicYear: academicSettings.academicYear,
              currentSemester: academicSettings.currentSemester,
              internshipRegistrationPeriod: internshipRegistration,
              projectRegistrationPeriod: projectRegistration,
            }
          : {
              currentAcademicYear: new Date().getFullYear() + 543,
              currentSemester:
                new Date().getMonth() + 1 <= 4
                  ? 2
                  : new Date().getMonth() + 1 <= 8
                  ? 3
                  : 1,
              internshipRegistrationPeriod: null,
              projectRegistrationPeriod: null,
            },
        curriculum: curriculumData,
      };
    } catch (error) {
      logger.error("Error in checkStudentEligibility service:", error);
      throw error;
    }
  }

  /**
   * ฟังก์ชันช่วย parse JSON field
   */
  parseJsonField(jsonString, defaultValue = null) {
    if (!jsonString) return defaultValue;

    if (typeof jsonString === "object") return jsonString;

    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * ฟังก์ชันช่วยในการฟอร์แมตวันที่
   */
  formatDate(date) {
    if (!date) return "";

    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
  }

  /**
   * อัพเดทข้อมูลติดต่อของนักศึกษา (classroom และ phoneNumber)
   */
  async updateContactInfo(studentId, contactData) {
    try {
      const { classroom, phoneNumber } = contactData;
      
      // ตรวจสอบว่ามีนักศึกษาคนนี้หรือไม่
      const student = await Student.findOne({
        where: { student_id: studentId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName']
          }
        ]
      });
      
      if (!student) {
        throw new Error('ไม่พบข้อมูลนักศึกษา');
      }
      
      // อัพเดทข้อมูลติดต่อ
      await Student.update(
        {
          classroom: classroom || null,
          phone_number: phoneNumber || null,
          lastUpdated: new Date()
        },
        {
          where: { student_id: studentId }
        }
      );
      
      // ดึงข้อมูลหลังการอัพเดท
      const updatedStudent = await Student.findOne({
        where: { student_id: studentId },
        attributes: ['student_id', 'student_code', 'classroom', 'phone_number', 'last_updated']
      });
      
      return {
        studentId: updatedStudent.student_id,
        studentCode: updatedStudent.student_code,
        classroom: updatedStudent.classroom,
        phoneNumber: updatedStudent.phone_number,
        lastUpdated: updatedStudent.last_updated
      };
    } catch (error) {
      logger.error('Error in updateContactInfo service:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลนักศึกษาพร้อมข้อมูล userId
   */
  async getStudentByIdWithUserId(studentId) {
    try {
      const student = await Student.findOne({
        where: { student_id: studentId },
        attributes: ['student_id', 'student_code', 'user_id', 'classroom', 'phone_number'],
      });
      
      if (!student) {
        return null;
      }
      
      return {
        studentId: student.student_id,
        studentCode: student.student_code,
        userId: student.user_id,
        classroom: student.classroom,
        phoneNumber: student.phone_number
      };
    } catch (error) {
      logger.error('Error in getStudentByIdWithUserId service:', error);
      throw new Error('ไม่สามารถดึงข้อมูลนักศึกษาได้');
    }
  }
}

module.exports = new StudentService();
