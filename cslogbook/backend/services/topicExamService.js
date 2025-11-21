// topicExamService.js
// Service สำหรับรวมข้อมูลหัวข้อโครงงาน (Phase 1: Overview) เพื่อให้ครูใช้จัดเตรียมการสอบเสนอหัวข้อ
// NOTE: โค้ดนี้ใช้ ProjectDocument เป็นฐาน (considered as topic submission) + ProjectMember + Teacher (advisor/coAdvisor)
// ถ้าในอนาคตมีตารางเฉพาะสำหรับการ submit topic จะ refactor มา join เพิ่มได้

const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
// เพิ่ม User เพื่อ join เอาชื่ออาจารย์/นักศึกษาที่จริงเก็บไว้ในตาราง users
const {
  ProjectDocument,
  ProjectMember,
  Student,
  Teacher,
  User,
} = require("../models");
const logger = require("../utils/logger");

/**
 * Readiness (Phase: topic collection) baseline ใหม่:
 *  - มีชื่อโครงงาน TH & EN เท่านั้น (advisor optional)
 *  - advisorAssigned / memberCountOk ให้เป็นสัญญาณประกอบ ไม่บังคับภายใต้ readyFlag
 * Future extension: สามารถเพิ่มโหมดเข้มขึ้น (เช่น ต้องมี advisor หรือ enforceMemberMin=true) ผ่าน query param
 */
function computeReadiness(projectInstance, { enforceMemberMin } = {}) {
  const proposalUploaded = !!projectInstance.objective; // heuristic: มี objective แปลว่าเริ่มเขียนเอกสาร
  const abstractUploaded = !!projectInstance.expectedOutcome; // heuristic
  const titleCompleted =
    !!projectInstance.projectNameTh && !!projectInstance.projectNameEn;
  const advisorAssigned = !!projectInstance.advisorId;
  const memberCountOk = (projectInstance.members?.length || 0) >= 2; // เงื่อนไขใหม่สำหรับตรวจจำนวนสมาชิก
  // baseline: ชื่อครบก็ถือว่า ready (advisor ไม่บังคับใน phase นี้)
  let readyFlag = titleCompleted;
  if (enforceMemberMin) {
    readyFlag = readyFlag && memberCountOk;
  }
  return {
    proposalUploaded,
    abstractUploaded,
    titleCompleted,
    advisorAssigned,
    memberCountOk,
    readyFlag,
  };
}

/**
 * สร้าง where / filter เฉพาะจาก query
 */
function buildFilters({ status, advisorId, search, readyOnly, academicYear, semester, projectId }) {
  const where = {};
  if (status && status !== "all") {
    where.status = status; // status ของ ProjectDocument (draft|advisor_assigned|in_progress|completed|archived)
  }
  if (advisorId) {
    where.advisorId = advisorId;
  }
  let projectFilter = null;
  if (projectId !== undefined && projectId !== null && projectId !== "") {
    const numericProjectId = Number(projectId);
    if (Number.isInteger(numericProjectId) && numericProjectId > 0) {
      where.projectId = numericProjectId;
      projectFilter = numericProjectId;
    }
  }
  if (search) {
    const like = { [Op.like]: `%${search}%` };
    where[Op.or] = [
      { projectNameTh: like },
      { projectNameEn: like },
      { projectCode: like },
    ];
  }
  let yearFilter = null;
  if (academicYear !== undefined && academicYear !== null && academicYear !== "") {
    const year = Number(academicYear);
    if (Number.isInteger(year) && year >= 1900) {
      where.academicYear = year;
      yearFilter = year;
    }
  }
  let semesterFilter = null;
  if (semester !== undefined && semester !== null && semester !== "") {
    const sem = Number(semester);
    if ([1, 2, 3].includes(sem)) {
      where.semester = sem;
      semesterFilter = sem;
    }
  }
  return {
    where,
    filters: {
      academicYear: yearFilter,
      semester: semesterFilter,
      projectId: projectFilter,
    },
    readyOnly: readyOnly === "true" || readyOnly === true,
  };
}

/**
 * Main overview aggregation
 */
async function getTopicOverview(query = {}) {
  const { where, readyOnly, filters } = buildFilters(query);
  const metaWhere = { ...where };
  if (Object.prototype.hasOwnProperty.call(metaWhere, "academicYear")) {
    delete metaWhere.academicYear;
  }
  if (Object.prototype.hasOwnProperty.call(metaWhere, "semester")) {
    delete metaWhere.semester;
  }
  if (Object.prototype.hasOwnProperty.call(metaWhere, "projectId")) {
    delete metaWhere.projectId;
  }

  const order = [];
  // รองรับ sortBy (minimal)
  if (query.sortBy === "createdAt")
    order.push(["created_at", query.order === "asc" ? "ASC" : "DESC"]);
  else if (query.sortBy === "memberCount") {
    // จะ sort ภายหลังจาก map เพราะ memberCount มาจาก association
  } else if (query.sortBy === "projectCode") {
    order.push(["projectCode", query.order === "asc" ? "ASC" : "DESC"]);
  } else {
    // default: updatedAt desc
    order.push(["updated_at", "DESC"]);
  }

  // Pagination params
  const limit = query.limit ? parseInt(query.limit, 10) : undefined;
  const offset = query.offset ? parseInt(query.offset, 10) : undefined;

  let projects;
  let total = 0;
  try {
    // ใช้ findAndCountAll เพื่อได้ total count สำหรับ pagination
    const includeArray = [
      {
        model: ProjectMember,
        as: "members",
        // ดึง student + user (ชื่อจริงอยู่ใน users)
        include: [
          {
            model: Student,
            as: "student",
            attributes: ["studentId", "studentCode", "classroom"],
            include: [
              {
                model: User,
                as: "user",
                // ตาราง users มี firstName, lastName เท่านั้น
                attributes: ["firstName", "lastName"],
              },
            ],
          },
        ],
      },
      {
        model: Teacher,
        as: "advisor",
        attributes: ["teacherId"],
        include: [
          { model: User, as: "user", attributes: ["firstName", "lastName"] },
        ],
      },
      {
        model: Teacher,
        as: "coAdvisor",
        attributes: ["teacherId"],
        include: [
          { model: User, as: "user", attributes: ["firstName", "lastName"] },
        ],
      },
    ];

    if (limit !== undefined || offset !== undefined) {
      // ใช้ findAndCountAll สำหรับ pagination
      const { rows, count } = await ProjectDocument.findAndCountAll({
        where,
        include: includeArray,
        order,
        limit,
        offset,
        distinct: true, // สำคัญ: ใช้ distinct เพื่อนับแถวที่ถูกต้องเมื่อมี join
      });
      projects = rows;
      total = count;
    } else {
      // ไม่มี pagination ใช้ findAll
      projects = await ProjectDocument.findAll({
        where,
        include: includeArray,
        order,
      });
      total = projects.length;
    }
  } catch (err) {
    // หากเกิด error (เช่น unknown column) ให้โยนต่อไปยัง controller และ log เพิ่มเพื่อ debug
    logger.error(`[TopicExamService] find error: ${err.message}`);
    throw err;
  }

  const enforceMemberMin =
    query.enforceMemberMin === "1" ||
    query.enforceMemberMin === 1 ||
    query.enforceMemberMin === true;

  let result = projects.map((p) => {
    const readiness = computeReadiness(p, { enforceMemberMin });
    
    // ตรวจสอบว่านักศึกษาทุกคนมีข้อมูลห้องเรียนหรือไม่
    const allMembersHaveClassroom = p.members.every((m) => {
      const classroom = m.student?.classroom;
      return classroom && ['RA', 'RB', 'RC', 'DA', 'DB', 'CSB'].includes(classroom);
    });
    
    return {
      projectId: p.projectId,
      projectCode: p.projectCode,
      titleTh: p.projectNameTh,
      titleEn: p.projectNameEn,
      projectType: p.projectType,
      track: p.track, // track เดิม (multi-track ใช้ tracks table ในอนาคต)
      status: p.status,
      advisor: p.advisor
        ? {
            teacherId: p.advisor.teacherId,
            name: `${p.advisor.user?.firstName || ""} ${
              p.advisor.user?.lastName || ""
            }`.trim(),
          }
        : null,
      coAdvisor: p.coAdvisor
        ? {
            teacherId: p.coAdvisor.teacherId,
            name: `${p.coAdvisor.user?.firstName || ""} ${
              p.coAdvisor.user?.lastName || ""
            }`.trim(),
          }
        : null,
      members: p.members.map((m) => {
        const classroom = m.student?.classroom || '';
        // กำหนด remark ตามห้องเรียน
        let remark = '';
        if (classroom === 'CSB') {
          remark = 'โครงงานภาคสองภาษา (CSB)';
        } else if (['RA', 'RB', 'RC', 'DA', 'DB'].includes(classroom)) {
          remark = `โครงงานภาคปกติ`;
        } else {
          remark = 'โครงงานภาคปกติ';
        }
        
        return {
          studentId: m.student?.studentId,
          studentCode: m.student?.studentCode,
          name: `${m.student?.user?.firstName || ""} ${
            m.student?.user?.lastName || ""
          }`.trim(),
          role: m.role,
          classroom: classroom,
          remark: remark,
        };
      }),
      memberCount: p.members.length,
      // เพิ่มข้อมูลผลสอบหัวข้อ (phase staff บันทึกผล) สำหรับหน้า TopicExamResultPage
      examResult: p.examResult || null,
      examFailReason: p.examFailReason || null,
      examResultAt: p.examResultAt || null,
      readiness: {
        ...readiness,
        allMembersHaveClassroom: allMembersHaveClassroom,
        readyForExport: readiness.readyFlag && allMembersHaveClassroom && p.members.length > 0,
      },
      updatedAt: p.updated_at,
      createdAt: p.created_at,
    };
  });

  if (readyOnly) {
    result = result.filter((r) => r.readiness.readyFlag);
  }

  if (query.sortBy === "memberCount") {
    result.sort((a, b) => {
      return query.order === "asc"
        ? a.memberCount - b.memberCount
        : b.memberCount - a.memberCount;
    });
  }

  let availableAcademicYears = [];
  let availableSemestersByYear = {};

  try {
    const periodRows = await ProjectDocument.findAll({
      attributes: [
        [sequelize.col("academic_year"), "academicYear"],
        [sequelize.col("semester"), "semester"],
      ],
      where: metaWhere,
      group: ["academic_year", "semester"],
      order: [
        [sequelize.literal("academic_year IS NULL"), "ASC"],
        [sequelize.literal("academic_year"), "DESC"],
        [sequelize.literal("semester"), "ASC"],
      ],
      raw: true,
    });

    availableAcademicYears = [];
    availableSemestersByYear = {};
    periodRows.forEach((row) => {
      const year = row.academicYear;
      const sem = row.semester;
      if (year == null) {
        return;
      }
      if (!availableAcademicYears.includes(year)) {
        availableAcademicYears.push(year);
      }
      if (!availableSemestersByYear[year]) {
        availableSemestersByYear[year] = [];
      }
      if (sem != null && !availableSemestersByYear[year].includes(sem)) {
        availableSemestersByYear[year].push(sem);
      }
    });
    availableAcademicYears.sort((a, b) => b - a);
    Object.values(availableSemestersByYear).forEach((list) => list.sort((a, b) => a - b));
  } catch (metaErr) {
    logger.warn(`[TopicExamService] overview meta build failed: ${metaErr.message}`);
  }

  const defaultAcademicYear =
    filters.academicYear != null
      ? filters.academicYear
      : availableAcademicYears.length > 0
      ? availableAcademicYears[0]
      : null;
  const defaultSemester =
    filters.semester != null
      ? filters.semester
      : defaultAcademicYear && availableSemestersByYear[defaultAcademicYear]
      ? availableSemestersByYear[defaultAcademicYear][0] || null
      : null;

  let projectsByAcademicYear = {};
  try {
    const projectRows = await ProjectDocument.findAll({
      attributes: [
        [sequelize.col("academic_year"), "academicYear"],
        [sequelize.col("project_id"), "projectId"],
        [sequelize.col("project_code"), "projectCode"],
        [sequelize.col("project_name_th"), "projectNameTh"],
        [sequelize.col("project_name_en"), "projectNameEn"],
        [sequelize.col("semester"), "semester"],
      ],
      where: metaWhere,
      order: [
        [sequelize.literal("academic_year"), "DESC"],
        [sequelize.literal("semester"), "ASC"],
        ["project_name_th", "ASC"],
      ],
      raw: true,
    });

    projectsByAcademicYear = projectRows.reduce((acc, row) => {
      const year = row.academicYear;
      if (year == null) return acc;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push({
        projectId: row.projectId,
        projectCode: row.projectCode,
        titleTh: row.projectNameTh,
        titleEn: row.projectNameEn,
        semester: row.semester,
      });
      return acc;
    }, {});
  } catch (projectMetaErr) {
    logger.warn(`[TopicExamService] project meta build failed: ${projectMetaErr.message}`);
  }

  logger.info(`[TopicExamService] overview result size=${result.length}, total=${total}`);
  return {
    data: result,
    total, // ส่ง total count สำหรับ pagination
    meta: {
      availableAcademicYears,
      availableSemestersByYear,
      defaultAcademicYear,
      defaultSemester,
      appliedFilters: filters,
      projectsByAcademicYear,
    },
  };
}

module.exports = { getTopicOverview };
