const { User, Teacher, Student, MeetingLog, Meeting, ProjectDocument, ProjectMember, Document } = require('../models');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const importantDeadlineService = require('./importantDeadlineService');
const { Op } = require('sequelize');
const { computeStatus, computeDaysLeft } = require('../utils/deadlineStatusUtil');

const ALLOWED_DEADLINE_SCOPES_FOR_TEACHER = new Set(['ALL', 'INTERNSHIP_ONLY', 'PROJECT_ONLY', 'CUSTOM']);

// ฟังก์ชันช่วยสร้างชื่อเต็ม (ป้องกันค่า null/undefined)
const buildFullName = (firstName = '', lastName = '') => [firstName, lastName].filter(Boolean).join(' ').trim();

// แปลงค่าเวลาให้เป็น ISO string ถ้าไม่สามารถแปลงได้จะคืนค่า null
const ensureIsoString = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

// คำนวณจำนวนวันค้างตั้งแต่วันที่สร้างข้อมูลถึงปัจจุบัน (ปัดขึ้นเป็นจำนวนเต็ม)
const calculatePendingDays = (fromDate, now = new Date()) => {
  if (!fromDate) return 0;
  const start = new Date(fromDate);
  if (Number.isNaN(start.getTime())) return 0;
  const diffMs = now.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
};

// ตรวจสอบว่ากำหนดส่งเผยแพร่สำหรับอาจารย์หรือไม่
const isDeadlineVisibleForTeacher = (deadline, now = new Date()) => {
  if (!deadline) return false;
  const scope = deadline.visibilityScope || 'ALL';
  if (!ALLOWED_DEADLINE_SCOPES_FOR_TEACHER.has(scope)) {
    return false;
  }
  if (deadline.isPublished === undefined && deadline.publishAt === undefined) {
    return true;
  }
  if (deadline.isPublished) {
    return true;
  }
  if (deadline.publishAt) {
    const publishAt = new Date(deadline.publishAt);
    if (!Number.isNaN(publishAt.getTime()) && publishAt.getTime() <= now.getTime()) {
      return true;
    }
  }
  return false;
};


class TeacherService {
  /**
   * ดึงข้อมูลอาจารย์ทั้งหมด
   */
  async getAllTeachers(options = {}) {
    try {
      const { onlyAcademic } = options;
      const whereUser = { role: 'teacher' };
      const whereTeacher = {};
      if (onlyAcademic) {
        // ถ้าตาราง Teacher มี field teacherType ให้กรอง
        whereTeacher.teacherType = 'academic';
      }

      const teachers = await User.findAll({
        where: whereUser,
        attributes: ['userId', 'firstName', 'lastName', 'email'],
        include: [{
          model: Teacher,
          as: 'teacher',
          required: true,
          attributes: ['teacherId', 'teacherCode', 'contactExtension', 'position', 'teacherType', 'canAccessTopicExam', 'canExportProject1'],
          where: Object.keys(whereTeacher).length ? whereTeacher : undefined
        }]
      });

      return teachers.map(user => ({
        userId: user.userId,
        teacherId: user.teacher?.teacherId,
        teacherCode: user.teacher?.teacherCode || '',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactExtension: user.teacher?.contactExtension || '',
        position: user.teacher?.position || 'คณาจารย์', // เพิ่มตำแหน่ง
        teacherType: user.teacher?.teacherType || null,
        canAccessTopicExam: Boolean(user.teacher?.canAccessTopicExam),
        canExportProject1: Boolean(user.teacher?.canExportProject1)
      }));
    } catch (error) {
      logger.error('Error in getAllTeachers service:', error);
      throw new Error('ไม่สามารถดึงข้อมูลอาจารย์ได้');
    }
  }

  /**
   * ดึงข้อมูลอาจารย์ตาม ID
   */
  async getTeacherById(teacherId) {
    try {
      // ลองค้นหาด้วย teacherId ก่อน
      let teacher = await Teacher.findByPk(teacherId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });

      // ถ้าไม่เจอ ลองค้นหาด้วย teacherCode
      if (!teacher) {
        teacher = await Teacher.findOne({
          where: { teacherCode: teacherId },
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        });
      }

      // ถ้าไม่เจอ ลองค้นหาด้วย userId
      if (!teacher) {
        teacher = await Teacher.findOne({
          where: { userId: teacherId },
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        });
      }

      if (!teacher) {
        throw new Error('ไม่พบข้อมูลอาจารย์');
      }

      return {
        teacherId: teacher.teacherId,
        teacherCode: teacher.teacherCode,
        teacherType: teacher.teacherType,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        contactExtension: teacher.contactExtension,
        position: teacher.position || 'คณาจารย์', // เพิ่มตำแหน่ง
        canAccessTopicExam: Boolean(teacher.canAccessTopicExam),
        canExportProject1: Boolean(teacher.canExportProject1)
      };
    } catch (error) {
      logger.error('Error in getTeacherById service:', error);
      if (error.message === 'ไม่พบข้อมูลอาจารย์') {
        throw error;
      }
      throw new Error('ไม่สามารถดึงข้อมูลอาจารย์ได้');
    }
  }

  /**
   * ดึงข้อมูลอาจารย์ตาม userId
   */
  async getTeacherByUserId(userId) {
    try {
      const teacher = await Teacher.findOne({
        where: { userId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'role']
        }]
      });

      if (!teacher) {
        // กรณียังไม่มีแถวในตาราง teachers ให้คืนข้อมูลจาก users พร้อมค่า default แทน
        const user = await User.findOne({ where: { userId }, attributes: ['firstName', 'lastName', 'email', 'role', 'userId'] });
        if (!user) {
          throw new Error('ไม่พบข้อมูลอาจารย์');
        }
        return {
          teacherId: null,
          teacherCode: '',
          teacherType: 'academic',
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          contactExtension: '',
          position: 'คณาจารย์',
          canAccessTopicExam: false,
          canExportProject1: false
        };
      }

      return {
        teacherId: teacher.teacherId,
        teacherCode: teacher.teacherCode,
        teacherType: teacher.teacherType,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        contactExtension: teacher.contactExtension,
        position: teacher.position || 'คณาจารย์', // เพิ่มตำแหน่ง
        canAccessTopicExam: Boolean(teacher.canAccessTopicExam),
        canExportProject1: Boolean(teacher.canExportProject1)
      };
    } catch (error) {
      logger.error('Error in getTeacherByUserId service:', error);
      if (error.message === 'ไม่พบข้อมูลอาจารย์') {
        throw error;
      }
      throw new Error('ไม่สามารถดึงข้อมูลอาจารย์ได้');
    }
  }

  /**
   * เพิ่มอาจารย์ใหม่
   */
  async addTeacher(teacherData) {
    const transaction = await sequelize.transaction();

    try {
      const {
        teacherCode,
        firstName,
        lastName,
        email,
        contactExtension,
        position, // รับตำแหน่งจาก input
        canAccessTopicExam,
        canExportProject1
      } = teacherData;

      if (!teacherCode || !firstName || !lastName) {
        throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
      }

      const existingTeacher = await Teacher.findOne({
        where: { teacherCode },
        transaction
      });

      if (existingTeacher) {
        await transaction.rollback();
        throw new Error('รหัสอาจารย์นี้มีในระบบแล้ว');
      }

      const username = email ? email.split('@')[0] : `t${teacherCode}`;

      const user = await User.create({
        username,
        password: await bcrypt.hash(username, 10),
        firstName,
        lastName,
        email: email || `${teacherCode}@sci.kmutnb.ac.th`,
        role: 'teacher',
        activeStatus: true
      }, { transaction });

      const teacher = await Teacher.create({
        teacherCode,
        userId: user.userId,
        contactExtension,
        position: position || 'คณาจารย์', // บันทึกตำแหน่ง ถ้าไม่ระบุให้ default
        canAccessTopicExam: typeof canAccessTopicExam === 'boolean'
          ? canAccessTopicExam
          : canAccessTopicExam === 'true',
        canExportProject1: typeof canExportProject1 === 'boolean'
          ? canExportProject1
          : canExportProject1 === 'true'
      }, { transaction });

      await transaction.commit();

      return {
        teacherId: teacher.teacherId,
        teacherCode: teacher.teacherCode,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactExtension: teacher.contactExtension,
        position: teacher.position || 'คณาจารย์',
        canAccessTopicExam: Boolean(teacher.canAccessTopicExam),
        canExportProject1: Boolean(teacher.canExportProject1)
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in addTeacher service:', error);
      throw error;
    }
  }

  /**
   * อัพเดทข้อมูลอาจารย์
   */
  async updateTeacher(teacherId, updateData) {
    const transaction = await sequelize.transaction();

    try {
    const { firstName, lastName, email, contactExtension, position, canAccessTopicExam, canExportProject1 } = updateData;

      const teacher = await Teacher.findOne({
        where: { teacherId },
        include: [{
          model: User,
          as: 'user'
        }],
        transaction
      });

      if (!teacher) {
        await transaction.rollback();
        throw new Error('ไม่พบข้อมูลอาจารย์');
      }

      // Update teacher record
      await Teacher.update({
        contactExtension: contactExtension || teacher.contactExtension,
        ...(position && { position }), // อัปเดตตำแหน่งถ้ามีส่งมา
        ...(typeof canAccessTopicExam !== 'undefined' && {
          canAccessTopicExam: typeof canAccessTopicExam === 'boolean'
            ? canAccessTopicExam
            : canAccessTopicExam === 'true'
        }),
        ...(typeof canExportProject1 !== 'undefined' && {
          canExportProject1: typeof canExportProject1 === 'boolean'
            ? canExportProject1
            : canExportProject1 === 'true'
        })
      }, {
        where: { teacherId },
        transaction
      });

      // Update user record
      if (firstName || lastName || email) {
        await User.update({
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email })
        }, {
          where: { userId: teacher.userId },
          transaction
        });
      }

      await transaction.commit();

      return {
        teacherId,
        teacherCode: teacher.teacherCode,
        firstName: firstName || teacher.user.firstName,
        lastName: lastName || teacher.user.lastName,
        email: email || teacher.user.email,
        contactExtension: contactExtension || teacher.contactExtension,
        position: position || teacher.position || 'คณาจารย์',
        canAccessTopicExam: typeof canAccessTopicExam !== 'undefined'
          ? (typeof canAccessTopicExam === 'boolean' ? canAccessTopicExam : canAccessTopicExam === 'true')
          : Boolean(teacher.canAccessTopicExam),
        canExportProject1: typeof canExportProject1 !== 'undefined'
          ? (typeof canExportProject1 === 'boolean' ? canExportProject1 : canExportProject1 === 'true')
          : Boolean(teacher.canExportProject1)
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in updateTeacher service:', error);
      throw error;
    }
  }

  /**
   * ลบข้อมูลอาจารย์
   */
  async deleteTeacher(teacherId) {
    const transaction = await sequelize.transaction();

    try {
      const teacher = await Teacher.findOne({
        where: { teacherId },
        transaction
      });

      if (!teacher) {
        await transaction.rollback();
        throw new Error('ไม่พบข้อมูลอาจารย์');
      }

      await Teacher.destroy({
        where: { teacherId },
        transaction
      });

      await User.destroy({
        where: { userId: teacher.userId },
        transaction
      });

      await transaction.commit();

      return {
        teacherId,
        teacherCode: teacher.teacherCode
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in deleteTeacher service:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลนักศึกษาในที่ปรึกษา
   */
  async getAdvisees(teacherCode) {
    try {
      // ตรวจสอบว่ามีอาจารย์คนนี้หรือไม่
      const teacher = await Teacher.findOne({
        where: { teacherCode }
      });

      if (!teacher) {
        throw new Error('ไม่พบข้อมูลอาจารย์');
      }

      // ดึงข้อมูลนักศึกษาที่เป็นที่ปรึกษา
      const advisees = await Student.findAll({
        where: { advisorId: teacher.teacherId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });

      return advisees.map(student => ({
        studentCode: student.studentCode,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        totalCredits: student.totalCredits,
        majorCredits: student.majorCredits,
        isEligibleInternship: student.isEligibleInternship,
        isEligibleProject: student.isEligibleProject
      }));
    } catch (error) {
      logger.error('Error in getAdvisees service:', error);
      if (error.message === 'ไม่พบข้อมูลอาจารย์') {
        throw error;
      }
      throw new Error('ไม่สามารถดึงข้อมูลนักศึกษาในที่ปรึกษาได้');
    }
  }

  /**
   * รวมข้อมูลสรุปสำหรับแดชบอร์ดอาจารย์สายวิชาการ
   */
  async getAcademicDashboardOverview(userId) {
    const now = new Date();

    // ค้นหาข้อมูลอาจารย์พร้อมรายละเอียดผู้ใช้ (เพื่อตรวจสอบสิทธิ์และนำข้อมูลไปแสดง)
    const teacherRecord = await Teacher.findOne({
      where: { userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    if (!teacherRecord) {
      const fallbackUser = await User.findByPk(userId, {
        attributes: ['firstName', 'lastName', 'email']
      });

      return {
        teacher: {
          id: null,
          code: null,
          name: buildFullName(fallbackUser?.firstName, fallbackUser?.lastName),
          position: 'คณาจารย์',
          email: fallbackUser?.email || ''
        },
        advisees: {
          total: 0,
          internshipInProgress: 0,
          projectInProgress: 0,
          internshipEligible: 0,
          projectEligible: 0
        },
        projects: {
          active: 0,
          completed: 0
        },
        queues: {
          meetingLogs: { pending: 0, items: [] },
          documents: { pending: 0 }
        },
        quickActions: [
          {
            key: 'meetingApprovals',
            label: 'บันทึกการพบ',
            description: 'ตรวจสอบบันทึกการพบจากนักศึกษา',
            pendingCount: 0,
            path: '/teacher/meeting-approvals'
          },
          {
            key: 'documentApprovals',
            label: 'เอกสารที่รออนุมัติ',
            description: 'ตรวจสอบเอกสารจากนักศึกษา',
            pendingCount: 0,
            path: '/approve-documents'
          },
          {
            key: 'deadlines',
            label: 'กำหนดส่งสำคัญ',
            description: 'ดูปฏิทินเส้นตายที่เกี่ยวข้อง',
            pendingCount: 0,
            path: '/teacher/deadlines/calendar'
          }
        ],
        deadlines: [],
        upcomingMeetings: [],
        updatedAt: now.toISOString()
      };
    }

    const teacherId = teacherRecord.teacherId;
    const teacherName = buildFullName(teacherRecord.user?.firstName, teacherRecord.user?.lastName);
    const teacherEmail = teacherRecord.user?.email || '';
    const teacherCode = teacherRecord.teacherCode || null;
    const teacherPosition = teacherRecord.position || 'คณาจารย์';

    // รวบรวมสถิติหลักของนักศึกษาที่อยู่ภายใต้การดูแล
    const adviseeWhere = { advisorId: teacherId };
    const projectsWhere = {
      [Op.or]: [
        { advisorId: teacherId },
        { coAdvisorId: teacherId }
      ]
    };

    const [
      totalAdvisees,
      internshipInProgress,
      projectInProgress,
      internshipEligible,
      projectEligible,
      activeProjects,
      completedProjects,
      pendingDocuments
    ] = await Promise.all([
      Student.count({ where: adviseeWhere }),
      Student.count({
        where: {
          ...adviseeWhere,
          internshipStatus: { [Op.in]: ['pending_approval', 'in_progress'] }
        }
      }),
      Student.count({
        where: {
          ...adviseeWhere,
          projectStatus: { [Op.in]: ['in_progress'] }
        }
      }),
      Student.count({
        where: {
          ...adviseeWhere,
          isEligibleInternship: true
        }
      }),
      Student.count({
        where: {
          ...adviseeWhere,
          isEligibleProject: true
        }
      }),
      ProjectDocument.count({
        where: {
          ...projectsWhere,
          status: { [Op.in]: ['advisor_assigned', 'in_progress'] }
        }
      }),
      ProjectDocument.count({
        where: {
          ...projectsWhere,
          status: 'completed'
        }
      }),
      Document.count({
        where: {
          reviewerId: userId,
          status: 'pending'
        }
      })
    ]);

    // ดึงคิวบันทึกการพบที่รออนุมัติ พร้อมข้อมูลโครงงานและนักศึกษา
    const meetingLogIncludes = [
      {
        model: Meeting,
        as: 'meeting',
        required: true,
        attributes: ['meetingId', 'meetingTitle', 'meetingDate', 'projectId'],
        include: [{
          model: ProjectDocument,
          as: 'project',
          required: true,
          attributes: ['projectId', 'projectNameTh', 'projectNameEn', 'projectCode', 'advisorId', 'coAdvisorId', 'academicYear', 'semester'],
          where: projectsWhere,
          include: [{
            model: ProjectMember,
            as: 'members',
            required: false,
            attributes: ['studentId'],
            include: [{
              model: Student,
              as: 'student',
              attributes: ['studentId', 'studentCode'],
              include: [{
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName']
              }]
            }]
          }]
        }]
      },
      {
        model: User,
        as: 'recorder',
        attributes: ['firstName', 'lastName']
      }
    ];

    const meetingLogBaseWhere = { approvalStatus: 'pending' };
    const meetingLogCountIncludes = [
      {
        model: Meeting,
        as: 'meeting',
        required: true,
        attributes: [],
        include: [{
          model: ProjectDocument,
          as: 'project',
          required: true,
          attributes: [],
          where: projectsWhere
        }]
      }
    ];

    const [pendingMeetingIdRows, pendingMeetingLogs] = await Promise.all([
      MeetingLog.findAll({
        where: meetingLogBaseWhere,
        include: meetingLogCountIncludes,
        attributes: ['logId'],
        raw: true
      }),
      MeetingLog.findAll({
        where: meetingLogBaseWhere,
        include: meetingLogIncludes,
        order: [[sequelize.col('MeetingLog.created_at'), 'DESC']],
        limit: 5
      })
    ]);

  const pendingMeetingCount = new Set(pendingMeetingIdRows.map((row) => row.logId)).size;

    const pendingMeetingItems = pendingMeetingLogs.map((log) => {
      const plain = log.toJSON();
      const project = plain.meeting?.project || {};
      const students = (project.members || []).map((member) => {
        const student = member.student || {};
        const studentUser = student.user || {};
        return {
          studentId: student.studentId || null,
          studentCode: student.studentCode || '',
          name: buildFullName(studentUser.firstName, studentUser.lastName)
        };
      }).filter((student) => student.studentId || student.name);

      return {
        logId: plain.logId,
        meetingId: plain.meeting?.meetingId || null,
        projectId: project.projectId || null,
        projectCode: project.projectCode || null,
        projectTitleTh: project.projectNameTh || null,
        projectTitleEn: project.projectNameEn || null,
        meetingTitle: plain.meeting?.meetingTitle || null,
        meetingDate: ensureIsoString(plain.meeting?.meetingDate),
        submittedAt: ensureIsoString(plain.createdAt),
        pendingDays: calculatePendingDays(plain.createdAt, now),
        recorderName: buildFullName(plain.recorder?.firstName, plain.recorder?.lastName),
        students
      };
    });

    // คัดกรองกำหนดส่งที่เกี่ยวข้องกับอาจารย์
    const deadlinesRaw = await importantDeadlineService.getAll();
    const deadlines = deadlinesRaw
      .map((deadline) => (deadline.get ? deadline.get({ plain: true }) : deadline))
      .filter((deadline) => isDeadlineVisibleForTeacher(deadline, now))
      .map((deadline) => {
        const effective = deadline.windowEndAt || deadline.deadlineAt;
        const dueIso = ensureIsoString(effective);
        if (!dueIso) {
          return null;
        }
        const dueDate = new Date(dueIso);
        const diffHours = Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / (60 * 60 * 1000)));
        return {
          id: deadline.id,
          name: deadline.name,
          relatedTo: deadline.relatedTo,
          isCritical: !!deadline.isCritical,
          dueAt: dueIso,
          status: computeStatus(deadline, null, now).status,
          daysLeft: computeDaysLeft(deadline, now),
          hoursLeft: diffHours,
          academicYear: deadline.academicYear || null,
          semester: deadline.semester || null
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 4);

    // ดึงการประชุมที่กำลังจะมาถึง (จำกัด 3 รายการล่าสุด)
    const upcomingMeetingsRaw = await Meeting.findAll({
      where: {
        meetingDate: { [Op.gte]: now }
      },
      include: [{
        model: ProjectDocument,
        as: 'project',
        required: true,
        attributes: ['projectId', 'projectNameTh', 'projectNameEn', 'projectCode', 'advisorId', 'coAdvisorId'],
        where: projectsWhere,
        include: [{
          model: ProjectMember,
          as: 'members',
          required: false,
          attributes: ['studentId'],
          include: [{
            model: Student,
            as: 'student',
            attributes: ['studentId', 'studentCode'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          }]
        }]
      }],
      order: [['meetingDate', 'ASC']],
      limit: 3
    });

    const upcomingMeetings = upcomingMeetingsRaw.map((meeting) => {
      const plain = meeting.toJSON();
      const project = plain.project || {};
      const meetingIso = ensureIsoString(plain.meetingDate);
      const meetingDate = meetingIso ? new Date(meetingIso) : null;
      const daysLeft = meetingDate ? Math.max(0, Math.ceil((meetingDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;
      const students = (project.members || []).map((member) => {
        const student = member.student || {};
        const studentUser = student.user || {};
        return {
          studentId: student.studentId || null,
          studentCode: student.studentCode || '',
          name: buildFullName(studentUser.firstName, studentUser.lastName)
        };
      }).filter((student) => student.studentId || student.name);

      return {
        meetingId: plain.meetingId,
        meetingTitle: plain.meetingTitle,
        meetingDate: meetingIso,
        projectId: project.projectId || null,
        projectCode: project.projectCode || null,
        projectTitleTh: project.projectNameTh || null,
        projectTitleEn: project.projectNameEn || null,
        daysLeft,
        students
      };
    });

    const quickActions = [
      {
        key: 'meetingApprovals',
        label: 'บันทึกการพบ',
        description: 'ตรวจสอบบันทึกการพบจากนักศึกษา',
        pendingCount: pendingMeetingCount,
        path: '/teacher/meeting-approvals'
      },
      {
        key: 'documentApprovals',
        label: 'เอกสารที่รออนุมัติ',
        description: 'ตรวจสอบคำขอและไฟล์จากนักศึกษา',
        pendingCount: pendingDocuments,
        path: '/approve-documents'
      },
      {
        key: 'deadlines',
        label: 'กำหนดส่งสำคัญ',
        description: 'ดูปฏิทินกำหนดการและประกาศล่าสุด',
        pendingCount: deadlines.length,
        path: '/teacher/deadlines/calendar'
      }
    ];

    return {
      teacher: {
        id: teacherId,
        code: teacherCode,
        name: teacherName,
        position: teacherPosition,
        email: teacherEmail
      },
      advisees: {
        total: totalAdvisees,
        internshipInProgress,
        projectInProgress,
        internshipEligible,
        projectEligible
      },
      projects: {
        active: activeProjects,
        completed: completedProjects
      },
      queues: {
        meetingLogs: {
          pending: pendingMeetingCount,
          items: pendingMeetingItems
        },
        documents: {
          pending: pendingDocuments
        }
      },
      quickActions,
      deadlines,
      upcomingMeetings,
      updatedAt: now.toISOString()
    };
  }

  /**
   * สร้าง username จาก email
   */
  generateUsernameFromEmail(email) {
    const [name, domain] = email.split('@');
    const [firstName, lastNameInitial] = name.split('.');
    return `${firstName}.${lastNameInitial.charAt(0)}`.toLowerCase();
  }

  /**
   * สร้าง student ID แบบสุ่ม
   */
  generateRandomStudentID() {
    return Math.random().toString().slice(2, 15); // สุ่มเลข 13 ตัว
  }
}

module.exports = new TeacherService();
