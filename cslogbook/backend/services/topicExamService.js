// topicExamService.js
// Service สำหรับรวมข้อมูลหัวข้อโครงงาน (Phase 1: Overview) เพื่อให้ครูใช้จัดเตรียมการสอบเสนอหัวข้อ
// NOTE: โค้ดนี้ใช้ ProjectDocument เป็นฐาน (considered as topic submission) + ProjectMember + Teacher (advisor/coAdvisor)
// ถ้าในอนาคตมีตารางเฉพาะสำหรับการ submit topic จะ refactor มา join เพิ่มได้

const { Op } = require("sequelize");
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
function buildFilters({ status, advisorId, search, readyOnly }) {
  const where = {};
  if (status && status !== "all") {
    where.status = status; // status ของ ProjectDocument (draft|advisor_assigned|in_progress|completed|archived)
  }
  if (advisorId) {
    where.advisorId = advisorId;
  }
  if (search) {
    const like = { [Op.like]: `%${search}%` };
    where[Op.or] = [
      { projectNameTh: like },
      { projectNameEn: like },
      { projectCode: like },
    ];
  }
  return { where, readyOnly: readyOnly === "true" || readyOnly === true };
}

/**
 * Main overview aggregation
 */
async function getTopicOverview(query = {}) {
  const { where, readyOnly } = buildFilters(query);

  const order = [];
  // รองรับ sortBy (minimal)
  if (query.sortBy === "createdAt")
    order.push(["createdAt", query.order === "asc" ? "ASC" : "DESC"]);
  else if (query.sortBy === "memberCount") {
    // จะ sort ภายหลังจาก map เพราะ memberCount มาจาก association
  } else if (query.sortBy === "projectCode") {
    order.push(["projectCode", query.order === "asc" ? "ASC" : "DESC"]);
  } else {
    // default: updatedAt desc
    order.push(["updatedAt", "DESC"]);
  }

  let projects;
  try {
    projects = await ProjectDocument.findAll({
      where,
      include: [
        {
          model: ProjectMember,
          as: "members",
          // ดึง student + user (ชื่อจริงอยู่ใน users)
          include: [
            {
              model: Student,
              as: "student",
              attributes: ["studentId", "studentCode"],
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
      ],
    });
  } catch (err) {
    // หากเกิด error (เช่น unknown column) ให้โยนต่อไปยัง controller และ log เพิ่มเพื่อ debug
    logger.error(`[TopicExamService] findAll error: ${err.message}`);
    throw err;
  }

  const enforceMemberMin =
    query.enforceMemberMin === "1" ||
    query.enforceMemberMin === 1 ||
    query.enforceMemberMin === true;

  let result = projects.map((p) => {
    const readiness = computeReadiness(p, { enforceMemberMin });
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
      members: p.members.map((m) => ({
        studentId: m.student?.studentId,
        studentCode: m.student?.studentCode,
        name: `${m.student?.user?.firstName || ""} ${
          m.student?.user?.lastName || ""
        }`.trim(),
        role: m.role,
      })),
      memberCount: p.members.length,
      // เพิ่มข้อมูลผลสอบหัวข้อ (phase staff บันทึกผล) สำหรับหน้า TopicExamResultPage
      examResult: p.examResult || null,
      examFailReason: p.examFailReason || null,
      examResultAt: p.examResultAt || null,
      readiness,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
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

  logger.info(`[TopicExamService] overview result size=${result.length}`);
  return result;
}

module.exports = { getTopicOverview };
