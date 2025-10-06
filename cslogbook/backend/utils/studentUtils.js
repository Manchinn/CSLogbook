// ค่าคงที่สำหรับการคำนวณ
const CONSTANTS = {
  THAI_YEAR_OFFSET: 543,
  MAX_STUDY_YEARS: 8,
  MIN_STUDENT_CODE_LENGTH: 13,
  ACADEMIC_MONTH_THRESHOLD: 4,
  INTERNSHIP: {
    MIN_YEAR: 3, // ค่า fixed เดิม เนื่องจากเป็นกฎระเบียบทั่วไป
    // MIN_TOTAL_CREDITS จะถูกดึงจาก Curriculum.internshipBaseCredits
  },
  PROJECT: {
    MIN_YEAR: 4, // ค่า fixed เดิม เนื่องจากเป็นกฎระเบียบทั่วไป
    // MIN_TOTAL_CREDITS จะถูกดึงจาก Curriculum.projectBaseCredits
    // MIN_MAJOR_CREDITS จะถูกดึงจาก Curriculum.projectMajorBaseCredits
  },
  ACADEMIC_TERMS: {
    // ค่าเริ่มต้นที่จะถูกโหลดทับจาก Academic model
    FIRST: {
      START_MONTH: 7, // กรกฎาคม
      END_MONTH: 11, // พฤศจิกายน
      START_DATE: null, // จะถูกแทนที่ด้วยวันที่จริงจากฐานข้อมูล
      END_DATE: null, // จะถูกแทนที่ด้วยวันที่จริงจากฐานข้อมูล
    },
    SECOND: {
      START_MONTH: 11, // พฤศจิกายน
      END_MONTH: 3, // มีนาคม
      START_DATE: null, // จะถูกแทนที่ด้วยวันที่จริงจากฐานข้อมูล
      END_DATE: null, // จะถูกแทนที่ด้วยวันที่จริงจากฐานข้อมูล
    },
    SUMMER: {
      START_MONTH: 4, // เมษายน
      END_MONTH: 6, // มิถุนายน
      START_DATE: null, // จะถูกแทนที่ด้วยวันที่จริงจากฐานข้อมูล
      END_DATE: null, // จะถูกแทนที่ด้วยวันที่จริงจากฐานข้อมูล
    },
  },
  STUDENT_STATUS: {
    NORMAL: {
      code: "NORMAL",
      label: "กำลังศึกษา",
      maxYear: 4,
      color: "green",
    },
    EXTENDED: {
      code: "EXTENDED",
      label: "นักศึกษาตกค้าง",
      maxYear: 8,
      color: "warning",
    },
    RETIRED: {
      code: "RETIRED",
      label: "พ้นสภาพ",
      color: "error",
    },
  },
};

// โหลดโมเดล Curriculum และ Academic โดยใช้วิธีที่แนะนำ
const db = require("../models");
const Curriculum = db.Curriculum;
const Academic = db.Academic;
const logger = require("../utils/logger");

const formatLine = (label, value) => {
  if (value === null || value === undefined || value === "") {
    return `• ${label}: -`;
  }

  if (typeof value === "object") {
    if (value.start && value.end) {
      return `• ${label}: { start: '${value.start}', end: '${value.end}' }`;
    }

    try {
      return `• ${label}: ${JSON.stringify(value)}`;
    } catch (err) {
      return `• ${label}: ${String(value)}`;
    }
  }

  return `• ${label}: ${value}`;
};

const logSection = (title, lines = []) => {
  const content = [title, ...lines.map((line) => `  ${line}`)].join("\n");
  logger.info(content);
};

/**
 * โหลดค่า constants จาก database
 * @returns {Promise<void>} - ทำงานเสร็จสิ้น
 */
const loadDynamicConstants = async () => {
  try {
    logger.info("⚙️ กำลังโหลดค่า constants จากฐานข้อมูล...");

    // โหลดข้อมูล Academic
    const academicData = await Academic.findOne({
      order: [["created_at", "DESC"]], // ใช้ snake_case ตามชื่อคอลัมน์ในฐานข้อมูล
    });

    if (academicData) {
      logSection("📚 ข้อมูล Academic", [
        formatLine("ID", academicData.academic_id || academicData.academicId),
        formatLine("Active Curriculum ID", academicData.active_curriculum_id || academicData.activeCurriculumId),
        formatLine("Semester 1 Range", academicData.semester1Range),
        formatLine("Semester 2 Range", academicData.semester2Range),
        formatLine("Semester 3 Range", academicData.semester3Range),
      ]);
    } else {
      logger.warn("ไม่พบข้อมูล Academic");
    }

    // โหลดหลักสูตรที่ใช้งานอยู่
    let activeCurriculum;
    let activeCurriculumId = null;

    if (academicData?.activeCurriculumId) {
      activeCurriculumId = academicData.activeCurriculumId;
    } else if (academicData?.active_curriculum_id) {
      activeCurriculumId = academicData.active_curriculum_id;
    }
    logger.info(`🎯 active_curriculum_id ที่โหลดได้: ${activeCurriculumId ?? "-"}`);

    // ถ้ามี curriculum_id ในข้อมูล Academic ให้ใช้ curriculum นั้น
    if (activeCurriculumId) {
      try {
        // ลองค้นหาด้วย curriculum_id โดยตรง
        activeCurriculum = await Curriculum.findOne({
          where: { curriculum_id: activeCurriculumId },
        });

        if (!activeCurriculum) {
          // ถ้าไม่พบให้ลองค้นหาด้วย curriculumId (camelCase)
          activeCurriculum = await Curriculum.findOne({
            where: { curriculumId: activeCurriculumId },
          });
        }

        if (activeCurriculum) {
          logger.info(
            `📘 โหลดหลักสูตรจาก activeCurriculumId = ${activeCurriculumId} สำเร็จ`
          );
        }
      } catch (error) {
        logger.error(
          `เกิดข้อผิดพลาดในการโหลดหลักสูตร ID ${activeCurriculumId}`,
          {
            error: error.message,
            stack: error.stack,
          }
        );
      }
    }

    // ถ้าไม่พบจาก academic ให้หาหลักสูตรที่ active = true
    if (!activeCurriculum) {
      try {
        activeCurriculum = await Curriculum.findOne({
          where: { active: true },
          order: [["created_at", "DESC"]], // ใช้ snake_case
        });

        if (activeCurriculum) {
          logger.info("📘 โหลดหลักสูตรที่ active = true สำเร็จ");
        }
      } catch (error) {
        logger.error("เกิดข้อผิดพลาดในการโหลดหลักสูตรที่ active", {
          error: error.message,
          stack: error.stack,
        });
      }
    }

    // ถ้ายังไม่พบ ให้โหลดหลักสูตรล่าสุด
    if (!activeCurriculum) {
      try {
        activeCurriculum = await Curriculum.findOne({
          order: [["created_at", "DESC"]],
        });

        if (activeCurriculum) {
          logger.info("📘 โหลดหลักสูตรล่าสุดสำเร็จ");
        }
      } catch (error) {
        logger.error("เกิดข้อผิดพลาดในการโหลดหลักสูตรล่าสุด", {
          error: error.message,
          stack: error.stack,
        });
      }
    }

    // พิมพ์รายละเอียดของหลักสูตร
    if (activeCurriculum) {
      logSection("📘 ข้อมูลหลักสูตรที่ใช้งาน", [
        formatLine(
          "ID",
          activeCurriculum.curriculum_id || activeCurriculum.curriculumId
        ),
        formatLine("Name", activeCurriculum.name),
        formatLine(
          "Internship Base Credits",
          activeCurriculum.internship_base_credits ||
            activeCurriculum.internshipBaseCredits
        ),
        formatLine(
          "Project Base Credits",
          activeCurriculum.project_base_credits ||
            activeCurriculum.projectBaseCredits
        ),
        formatLine(
          "Project Major Base Credits",
          activeCurriculum.project_major_base_credits ||
            activeCurriculum.projectMajorBaseCredits
        ),
      ]);

      // ล็อกข้อมูลละเอียดทั้งหมดในระดับ debug เพื่อใช้ตรวจสอบย้อนหลัง
      logger.debug("รายละเอียดทั้งหมดของหลักสูตร", {
        curriculum: activeCurriculum.toJSON(),
      });
    } else {
      logger.warn("ไม่พบข้อมูลหลักสูตร");
    }

    // อัปเดตค่า constants จาก Academic
    if (academicData) {
      // ภาคเรียนที่ 1
      if (academicData.semester1Range) {
        const { start, end } = academicData.semester1Range;
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);

          // เก็บค่าเดือนสำหรับการคำนวณตามดั้งเดิม
          CONSTANTS.ACADEMIC_TERMS.FIRST.START_MONTH = startDate.getMonth() + 1;
          CONSTANTS.ACADEMIC_TERMS.FIRST.END_MONTH = endDate.getMonth() + 1;

          // เก็บค่าวันที่จริงจากฐานข้อมูลเพื่อความแม่นยำ
          CONSTANTS.ACADEMIC_TERMS.FIRST.START_DATE = startDate;
          CONSTANTS.ACADEMIC_TERMS.FIRST.END_DATE = endDate;

          logger.info(
            `🗓️ อัปเดตช่วงเวลาภาคเรียนที่ 1: ${startDate.toLocaleDateString(
              "th-TH"
            )} - ${endDate.toLocaleDateString("th-TH")}`
          );
        }
      }

      // ภาคเรียนที่ 2
      if (academicData.semester2Range) {
        const { start, end } = academicData.semester2Range;
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);

          // เก็บค่าเดือนสำหรับการคำนวณตามดั้งเดิม
          CONSTANTS.ACADEMIC_TERMS.SECOND.START_MONTH =
            startDate.getMonth() + 1;
          CONSTANTS.ACADEMIC_TERMS.SECOND.END_MONTH = endDate.getMonth() + 1;

          // เก็บค่าวันที่จริงจากฐานข้อมูลเพื่อความแม่นยำ
          CONSTANTS.ACADEMIC_TERMS.SECOND.START_DATE = startDate;
          CONSTANTS.ACADEMIC_TERMS.SECOND.END_DATE = endDate;

          logger.info(
            `🗓️ อัปเดตช่วงเวลาภาคเรียนที่ 2: ${startDate.toLocaleDateString(
              "th-TH"
            )} - ${endDate.toLocaleDateString("th-TH")}`
          );
        }
      }

      // ภาคเรียนฤดูร้อน
      if (academicData.semester3Range) {
        const { start, end } = academicData.semester3Range;
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);

          // เก็บค่าเดือนสำหรับการคำนวณตามดั้งเดิม
          CONSTANTS.ACADEMIC_TERMS.SUMMER.START_MONTH =
            startDate.getMonth() + 1;
          CONSTANTS.ACADEMIC_TERMS.SUMMER.END_MONTH = endDate.getMonth() + 1;

          // เก็บค่าวันที่จริงจากฐานข้อมูลเพื่อความแม่นยำ
          CONSTANTS.ACADEMIC_TERMS.SUMMER.START_DATE = startDate;
          CONSTANTS.ACADEMIC_TERMS.SUMMER.END_DATE = endDate;

          logger.info(
            `🗓️ อัปเดตช่วงเวลาภาคเรียนฤดูร้อน: ${startDate.toLocaleDateString(
              "th-TH"
            )} - ${endDate.toLocaleDateString("th-TH")}`
          );
        }
      }
    }

    // อัปเดตค่า constants จาก Curriculum
    if (activeCurriculum) {
      // ตรวจสอบทั้ง snake_case และ camelCase
      const internshipCredits =
        activeCurriculum.internship_base_credits !== undefined
          ? activeCurriculum.internship_base_credits
          : activeCurriculum.internshipBaseCredits;

      const projectCredits =
        activeCurriculum.project_base_credits !== undefined
          ? activeCurriculum.project_base_credits
          : activeCurriculum.projectBaseCredits;

      const projectMajorCredits =
        activeCurriculum.project_major_base_credits !== undefined
          ? activeCurriculum.project_major_base_credits
          : activeCurriculum.projectMajorBaseCredits;

      CONSTANTS.INTERNSHIP.MIN_TOTAL_CREDITS = internshipCredits;
      CONSTANTS.PROJECT.MIN_TOTAL_CREDITS = projectCredits;
      CONSTANTS.PROJECT.MIN_MAJOR_CREDITS = projectMajorCredits;
    }

    logSection("✅ โหลดค่า constants จากฐานข้อมูลสำเร็จ", [
      formatLine(
        "INTERNSHIP.MIN_TOTAL_CREDITS",
        CONSTANTS.INTERNSHIP.MIN_TOTAL_CREDITS
      ),
      formatLine(
        "PROJECT.MIN_TOTAL_CREDITS",
        CONSTANTS.PROJECT.MIN_TOTAL_CREDITS
      ),
      formatLine(
        "PROJECT.MIN_MAJOR_CREDITS",
        CONSTANTS.PROJECT.MIN_MAJOR_CREDITS
      ),
    ]);
  } catch (error) {
    logger.error("เกิดข้อผิดพลาดในการโหลดค่า constants", {
      error: error.message,
      stack: error.stack,
    });
  }
};

// โหลดค่า constants เมื่อมีการ import (ยกเว้น environment test เพื่อลด side-effects ใน Jest)
if (process.env.NODE_ENV !== 'test') {
  loadDynamicConstants().catch((err) =>
    logger.error("ไม่สามารถโหลดค่า constants ได้", {
      error: err.message,
      stack: err.stack,
    })
  );
}

/**
 * คำนวณชั้นปีของนักศึกษา
 * @param {string} studentID - รหัสนักศึกษา
 * @returns {object} - ผลการคำนวณชั้นปี
 */
const calculateStudentYear = (studentCode) => {
  if (!studentCode) {
    return {
      error: true,
      message: "รหัสนักศึกษาไม่ถูกต้อง กรุณาตรวจสอบข้อมูล",
    };
  }

  try {
    const studentCodeStr = String(studentCode);

    if (studentCode.length !== CONSTANTS.MIN_STUDENT_CODE_LENGTH) {
      return {
        error: true,
        message: `รหัสนักศึกษาต้องมี ${CONSTANTS.MIN_STUDENT_CODE_LENGTH} หลัก`,
      };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() + CONSTANTS.THAI_YEAR_OFFSET;
    const currentMonth = currentDate.getMonth() + 1;
    const studentYear = parseInt(studentCodeStr.substring(0, 2)) + 2500;
    let studentClassYear = currentYear - studentYear;

    if (currentMonth > CONSTANTS.ACADEMIC_MONTH_THRESHOLD) {
      studentClassYear += 1;
    }

    if (studentClassYear > CONSTANTS.MAX_STUDY_YEARS) {
      return {
        error: true,
        message: `เกินระยะเวลาการศึกษาสูงสุด ${CONSTANTS.MAX_STUDY_YEARS} ปี`,
      };
    }

    const status = calculateStudentStatus(studentClassYear);

    return {
      error: false,
      year: studentClassYear,
      status: status.code,
      statusLabel: status.label,
      statusColor: status.color,
      isExtended: studentClassYear > CONSTANTS.STUDENT_STATUS.NORMAL.maxYear,
    };
  } catch (error) {
    logger.error("Error calculating student year", {
      error: error.message,
      stack: error.stack,
    });
    return {
      error: true,
      message: "เกิดข้อผิดพลาดในการคำนวณชั้นปี",
    };
  }
};

/**
 * คำนวณสถานะนักศึกษา
 * @param {number} yearLevel - ชั้นปีของนักศึกษา
 * @returns {object} - สถานะนักศึกษา
 */
const calculateStudentStatus = (yearLevel) => {
  if (yearLevel <= CONSTANTS.STUDENT_STATUS.NORMAL.maxYear) {
    return CONSTANTS.STUDENT_STATUS.NORMAL;
  } else if (yearLevel <= CONSTANTS.STUDENT_STATUS.EXTENDED.maxYear) {
    return CONSTANTS.STUDENT_STATUS.EXTENDED;
  }
  return CONSTANTS.STUDENT_STATUS.RETIRED;
};

/**
 * คำนวณปีการศึกษาปัจจุบัน
 * @returns {number} ปีการศึกษาในรูปแบบ พ.ศ.
 */
const getCurrentAcademicYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() + CONSTANTS.THAI_YEAR_OFFSET;
  const currentMonth = currentDate.getMonth() + 1;

  // หลัง มีนาคม ถึงก่อน กรกฎาคม = เตรียมขึ้นปีการศึกษาใหม่
  if (
    currentMonth > CONSTANTS.ACADEMIC_TERMS.SECOND.END_MONTH &&
    currentMonth < CONSTANTS.ACADEMIC_TERMS.FIRST.START_MONTH
  ) {
    return currentYear;
  }

  return currentMonth >= CONSTANTS.ACADEMIC_TERMS.FIRST.START_MONTH
    ? currentYear
    : currentYear - 1;
};

/**
 * คำนวณภาคเรียนปัจจุบัน (ใช้ค่าวันที่จริงจากฐานข้อมูลถ้ามี)
 * @returns {number} ภาคเรียน (1, 2, หรือ 3)
 */
const getCurrentSemester = () => {
  const currentDate = new Date();

  // ถ้ามีการตั้งค่าวันที่จริงจากฐานข้อมูล ให้ใช้ค่านั้นเพื่อความแม่นยำ
  if (
    CONSTANTS.ACADEMIC_TERMS.FIRST.START_DATE &&
    CONSTANTS.ACADEMIC_TERMS.FIRST.END_DATE
  ) {
    if (
      currentDate >= CONSTANTS.ACADEMIC_TERMS.FIRST.START_DATE &&
      currentDate <= CONSTANTS.ACADEMIC_TERMS.FIRST.END_DATE
    ) {
      return 1;
    }
  }

  if (
    CONSTANTS.ACADEMIC_TERMS.SECOND.START_DATE &&
    CONSTANTS.ACADEMIC_TERMS.SECOND.END_DATE
  ) {
    if (
      currentDate >= CONSTANTS.ACADEMIC_TERMS.SECOND.START_DATE &&
      currentDate <= CONSTANTS.ACADEMIC_TERMS.SECOND.END_DATE
    ) {
      return 2;
    }
  }

  if (
    CONSTANTS.ACADEMIC_TERMS.SUMMER.START_DATE &&
    CONSTANTS.ACADEMIC_TERMS.SUMMER.END_DATE
  ) {
    if (
      currentDate >= CONSTANTS.ACADEMIC_TERMS.SUMMER.START_DATE &&
      currentDate <= CONSTANTS.ACADEMIC_TERMS.SUMMER.END_DATE
    ) {
      return 3;
    }
  }

  // ถ้าไม่มีการตั้งค่าวันที่จากฐานข้อมูลหรือวันที่ปัจจุบันไม่อยู่ในช่วงที่กำหนด
  // ให้ใช้การคำนวณจากเดือนแบบเดิม
  const currentMonth = currentDate.getMonth() + 1;

  // ภาคเรียนที่ 1: กรกฎาคม - พฤศจิกายน
  if (
    currentMonth >= CONSTANTS.ACADEMIC_TERMS.FIRST.START_MONTH &&
    currentMonth <= CONSTANTS.ACADEMIC_TERMS.FIRST.END_MONTH
  ) {
    return 1;
  }

  // ภาคเรียนที่ 2: พฤศจิกายน - มีนาคม
  if (
    currentMonth >= CONSTANTS.ACADEMIC_TERMS.SECOND.START_MONTH ||
    currentMonth <= CONSTANTS.ACADEMIC_TERMS.SECOND.END_MONTH
  ) {
    return 2;
  }

  // ภาคฤดูร้อน: เมษายน - มิถุนายน
  return 3;
};

/**
 * ตรวจสอบสิทธิ์การฝึกงาน
 * @param {number} studentYear - ชั้นปีของนักศึกษา
 * @param {number} totalCredits - หน่วยกิตรวม
 * @returns {object} - ผลการตรวจสอบและข้อความแจ้งเตือน
 */
const isEligibleForInternship = (studentYear, totalCredits) => {
  if (studentYear < CONSTANTS.INTERNSHIP.MIN_YEAR) {
    return {
      eligible: false,
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องเป็นนักศึกษาชั้นปีที่ ${CONSTANTS.INTERNSHIP.MIN_YEAR} ขึ้นไป`,
    };
  }

  if (totalCredits < CONSTANTS.INTERNSHIP.MIN_TOTAL_CREDITS) {
    return {
      eligible: false,
      message: `ไม่ผ่านเงื่อนไขการฝึกงาน: ต้องมีหน่วยกิตรวมอย่างน้อย ${CONSTANTS.INTERNSHIP.MIN_TOTAL_CREDITS} หน่วยกิต`,
    };
  }

  return {
    eligible: true,
    message: "ผ่านเงื่อนไขการฝึกงาน",
  };
};

/**
 * ตรวจสอบสิทธิ์การทำโปรเจค
 * @param {number} studentYear - ชั้นปีของนักศึกษา
 * @param {number} totalCredits - หน่วยกิตรวม
 * @param {number} majorCredits - หน่วยกิตภาควิชา
 * @returns {object} - ผลการตรวจสอบและข้อความแจ้งเตือน
 */
const isEligibleForProject = (studentYear, totalCredits, majorCredits) => {
  if (studentYear < CONSTANTS.PROJECT.MIN_YEAR) {
    return {
      eligible: false,
      message: `ไม่ผ่านเงื่อนไขการทำโครงงานพิเศษ: ต้องเป็นนักศึกษาชั้นปีที่ ${CONSTANTS.PROJECT.MIN_YEAR} ขึ้นไป`,
    };
  }

  if (totalCredits < CONSTANTS.PROJECT.MIN_TOTAL_CREDITS) {
    return {
      eligible: false,
      message: `ไม่ผ่านเงื่อนไขการทำโครงงานพิเศษ: ต้องมีหน่วยกิตรวมอย่างน้อย ${CONSTANTS.PROJECT.MIN_TOTAL_CREDITS} หน่วยกิต`,
    };
  }

  if (majorCredits < CONSTANTS.PROJECT.MIN_MAJOR_CREDITS) {
    return {
      eligible: false,
      message: `ไม่ผ่านเงื่อนไขการทำโครงงานพิเศษ: ต้องมีหน่วยกิตภาควิชาอย่างน้อย ${CONSTANTS.PROJECT.MIN_MAJOR_CREDITS} หน่วยกิต`,
    };
  }

  return {
    eligible: true,
    message: "ผ่านเงื่อนไขการทำโครงงานพิเศษ",
  };
};

/**
 * คำนวณข้อมูลปีการศึกษาจากรหัสนักศึกษา
 * @param {string} studentCode - รหัสนักศึกษา
 * @param {number} currentAcademicYear - ปีการศึกษาปัจจุบัน
 * @returns {object} - ข้อมูลปีการศึกษา
 */
const calculateAcademicInfo = (studentCode, currentAcademicYear) => {
  const enrollYear = 2500 + parseInt(studentCode.substring(0, 2));
  const yearLevel = currentAcademicYear - enrollYear + 1;
  const semester = getCurrentSemester();

  return {
    enrollmentYear: enrollYear,
    currentAcademicYear,
    yearLevel,
    semester,
    academicYearThai: `${currentAcademicYear}/${semester}`,
    isCurrentStudent: yearLevel <= CONSTANTS.MAX_STUDY_YEARS,
  };
};

/**
 * ตรวจสอบความถูกต้องของรหัสนักศึกษา
 * @param {string} studentCode - รหัสนักศึกษา
 * @returns {boolean} - ผลการตรวจสอบ
 */
const validateStudentCode = (studentCode) => {
  if (!studentCode || typeof studentCode !== "string") {
    return false;
  }

  if (studentCode.length !== CONSTANTS.MIN_STUDENT_CODE_LENGTH) {
    return false;
  }

  const yearPart = parseInt(studentCode.substring(0, 2));
  return !isNaN(yearPart) && yearPart >= 0 && yearPart <= 99;
};

// ส่งออกฟังก์ชันและค่าคงที่แบบ CommonJS
module.exports = {
  CONSTANTS,
  calculateStudentYear,
  isEligibleForInternship,
  isEligibleForProject,
  getCurrentAcademicYear,
  getCurrentSemester,
  calculateStudentStatus,
  calculateAcademicInfo,
  validateStudentCode,
};
