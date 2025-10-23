const { sequelize } = require('../config/database');
const {
  Meeting,
  MeetingParticipant,
  MeetingLog,
  MeetingAttachment,
  MeetingActionItem,
  ProjectDocument,
  ProjectMember,
  Student,
  Teacher,
  User
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { buildSummary } = require('./meetingSummaryHelper');
const mailer = require('../utils/mailer');

const MEETING_PHASES = ['phase1', 'phase2'];
const DEFAULT_MEETING_PHASE = 'phase1';

class MeetingService {
  async ensureProjectAccess(projectId, actor, options = {}) {
    const project = await ProjectDocument.findByPk(projectId);
    if (!project) {
      const error = new Error('ไม่พบโครงงานที่ระบุ');
      error.statusCode = 404;
      throw error;
    }

    const context = { project };

    if (options.includeMembers) {
      context.members = await ProjectMember.findAll({
        where: { projectId },
        include: [{
          model: Student,
          as: 'student',
          include: [{ model: User, as: 'user' }]
        }]
      });
    }

    if (!actor || !actor.role) {
      const error = new Error('ไม่สามารถระบุตัวผู้ใช้งานได้');
      error.statusCode = 401;
      throw error;
    }

    if (actor.role === 'admin') {
      return context;
    }

    if (actor.role === 'student') {
      if (!actor.studentId) {
        const error = new Error('ไม่พบข้อมูลนักศึกษาสำหรับผู้ใช้นี้');
        error.statusCode = 403;
        throw error;
      }
      const membership = await ProjectMember.findOne({ where: { projectId, studentId: actor.studentId } });
      if (!membership) {
        const error = new Error('คุณไม่มีสิทธิ์เข้าถึงโครงงานนี้');
        error.statusCode = 403;
        throw error;
      }
      context.studentMembership = membership;
      return context;
    }

    if (actor.role === 'teacher') {
      const teacher = await Teacher.findOne({ where: { userId: actor.userId } });
      if (!teacher) {
        const error = new Error('ไม่พบข้อมูลอาจารย์สำหรับผู้ใช้นี้');
        error.statusCode = 403;
        throw error;
      }
      const isAdvisor = [project.advisorId, project.coAdvisorId].filter(Boolean).includes(teacher.teacherId);
      if (!isAdvisor) {
        const error = new Error('อาจารย์ไม่ได้รับมอบหมายให้ดูแลโครงงานนี้');
        error.statusCode = 403;
        throw error;
      }
      context.teacher = teacher;
      return context;
    }

    const error = new Error('บทบาทผู้ใช้นี้ยังไม่รองรับสำหรับการเข้าถึงโครงงาน');
    error.statusCode = 403;
    throw error;
  }

  async ensureMeetingAccess(meetingId, actor, options = {}) {
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      const error = new Error('ไม่พบการประชุมที่ระบุ');
      error.statusCode = 404;
      throw error;
    }
    const context = await this.ensureProjectAccess(meeting.projectId, actor, options);
    context.meeting = meeting;
    return context;
  }

  async listProjectMeetings(projectId, actor) {
    const context = await this.ensureProjectAccess(projectId, actor, { includeMembers: true });

    const meetings = await Meeting.findAll({
      where: { projectId },
      include: [
        {
          model: MeetingParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] }]
        },
        {
          model: MeetingLog,
          as: 'logs',
          include: [
            { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
            { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
            { model: MeetingAttachment, as: 'attachments' },
            { model: MeetingActionItem, as: 'actionItems' }
          ]
        }
      ],
      order: [
        ['meeting_date', 'DESC'],
        [{ model: MeetingLog, as: 'logs' }, 'created_at', 'DESC']
      ]
    });

    const serializedMeetings = meetings.map(m => this.serializeMeeting(m));
    const stats = buildSummary(serializedMeetings, context.members || []);

    return { meetings: serializedMeetings, stats };
  }

  async createMeeting(projectId, actor, payload = {}) {
    const context = await this.ensureProjectAccess(projectId, actor, { includeMembers: true });

    if (!payload.meetingTitle || !payload.meetingTitle.trim()) {
      const error = new Error('กรุณาระบุหัวข้อการประชุม');
      error.statusCode = 400;
      throw error;
    }

    if (!payload.meetingDate) {
      const error = new Error('กรุณาระบุวันและเวลาการประชุม');
      error.statusCode = 400;
      throw error;
    }

    if (!['onsite', 'online', 'hybrid'].includes(payload.meetingMethod)) {
      const error = new Error('รูปแบบการประชุมไม่ถูกต้อง');
      error.statusCode = 400;
      throw error;
    }

    const meetingDate = new Date(payload.meetingDate);
    if (Number.isNaN(meetingDate.valueOf())) {
      const error = new Error('รูปแบบวันที่ของการประชุมไม่ถูกต้อง');
      error.statusCode = 400;
      throw error;
    }

    const requestedPhaseRaw = typeof payload.phase === 'string' ? payload.phase.toLowerCase() : DEFAULT_MEETING_PHASE;
    const meetingPhase = MEETING_PHASES.includes(requestedPhaseRaw) ? requestedPhaseRaw : DEFAULT_MEETING_PHASE;

    if (meetingPhase === 'phase2') {
      const status = context.project?.status || null;
      if (context.project?.examResult !== 'passed') {
        const error = new Error('ยังไม่สามารถสร้างการพบสำหรับโครงงานพิเศษ 2 ได้');
        error.statusCode = 400;
        throw error;
      }
      if (!['in_progress', 'completed'].includes(status)) {
        const error = new Error('โครงงานยังไม่อยู่ในสถานะที่รองรับการบันทึกการพบของโครงงานพิเศษ 2');
        error.statusCode = 400;
        throw error;
      }
    }

    const t = await sequelize.transaction();
    let meeting;
    try {
      meeting = await Meeting.create({
        meetingTitle: payload.meetingTitle.trim(),
        meetingDate,
        meetingMethod: payload.meetingMethod,
        meetingLocation: payload.meetingLocation || null,
        meetingLink: payload.meetingLink || null,
        status: payload.status || 'scheduled',
        projectId,
        createdBy: actor.userId,
        phase: meetingPhase
      }, { transaction: t });

      const participants = await this.buildParticipants({
        meetingId: meeting.meetingId,
        project: context.project,
        members: context.members || [],
        actor,
        additionalParticipantIds: payload.additionalParticipantIds || []
      });

      if (!participants.length) {
        const error = new Error('ต้องมีผู้เข้าร่วมประชุมอย่างน้อยหนึ่งคน');
        error.statusCode = 400;
        throw error;
      }

      await MeetingParticipant.bulkCreate(participants, {
        transaction: t,
        ignoreDuplicates: true
      });

      await t.commit();
    } catch (error) {
      // หาก transaction ยังไม่ถูกปิด (finished) ให้ rollback เพื่อคืนสถานะ
      if (!t.finished) {
        await t.rollback();
      }
      logger.error('meetingService.createMeeting failed', { message: error.message, projectId });
      if (!error.statusCode) error.statusCode = 400;
      throw error;
    }

    const created = await Meeting.findByPk(meeting.meetingId, {
      include: [
        {
          model: MeetingParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] }]
        },
        {
          model: MeetingLog,
          as: 'logs',
          include: [
            { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
            { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
            { model: MeetingAttachment, as: 'attachments' },
            { model: MeetingActionItem, as: 'actionItems' }
          ]
        }
      ]
    });

    const serialized = this.serializeMeeting(created);

    logger.info('meetingService.createMeeting success', { projectId, meetingId: meeting.meetingId, actorId: actor.userId });

    if (payload.suppressNotifications !== true) {
      const notificationNote = typeof payload.notificationMessage === 'string' && payload.notificationMessage.trim()
        ? payload.notificationMessage.trim()
        : typeof payload.notificationNote === 'string' && payload.notificationNote.trim()
          ? payload.notificationNote.trim()
          : null;
      try {
        await this.sendMeetingScheduledNotifications({
          project: context.project,
          meeting: serialized,
          actor,
          members: context.members || [],
          note: notificationNote
        });
      } catch (notificationError) {
        logger.error('meetingService.createMeeting notification error', {
          message: notificationError.message,
          projectId,
          meetingId: meeting?.meetingId || null,
          actorId: actor.userId,
          stack: notificationError.stack
        });
      }
    }

    return serialized;
  }

  async createMeetingLog(projectId, meetingId, actor, payload = {}) {
    const context = await this.ensureMeetingAccess(meetingId, actor, { includeMembers: true });
    if (context.project.projectId !== Number(projectId)) {
      const error = new Error('การประชุมไม่อยู่ในโครงงานที่ระบุ');
      error.statusCode = 400;
      throw error;
    }

    const meeting = await Meeting.findByPk(meetingId, {
      include: [{ model: MeetingParticipant, as: 'participants' }]
    });

    const isParticipant = meeting.participants.some(p => p.userId === actor.userId);
    if (!isParticipant && actor.role !== 'admin') {
      const error = new Error('เฉพาะผู้เข้าร่วมประชุมหรือผู้ดูแลระบบเท่านั้นที่บันทึกการพบได้');
      error.statusCode = 403;
      throw error;
    }

    if (!payload.discussionTopic || !payload.discussionTopic.trim()) {
      const error = new Error('กรุณาระบุหัวข้อที่สนทนา');
      error.statusCode = 400;
      throw error;
    }

    if (!payload.currentProgress || !payload.currentProgress.trim()) {
      const error = new Error('กรุณาระบุความคืบหน้าปัจจุบัน');
      error.statusCode = 400;
      throw error;
    }

    if (!payload.nextActionItems || !payload.nextActionItems.trim()) {
      const error = new Error('กรุณาระบุงานถัดไป');
      error.statusCode = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    let log;
    try {
      log = await MeetingLog.create({
        meetingId,
        discussionTopic: payload.discussionTopic.trim(),
        currentProgress: payload.currentProgress.trim(),
        problemsIssues: payload.problemsIssues ? payload.problemsIssues.trim() : null,
        nextActionItems: payload.nextActionItems.trim(),
        advisorComment: payload.advisorComment ? payload.advisorComment.trim() : null,
        recordedBy: actor.userId,
        approvalStatus: 'pending'
      }, { transaction: t });

      if (Array.isArray(payload.actionItems) && payload.actionItems.length) {
        const items = payload.actionItems
          .map(item => {
            if (!item || !item.actionDescription || !item.dueDate) return null;
            return {
              logId: log.logId,
              actionDescription: item.actionDescription.trim(),
              assignedTo: item.assignedTo || actor.userId,
              dueDate: item.dueDate,
              status: item.status || 'pending'
            };
          })
          .filter(Boolean);
        if (items.length) {
          await MeetingActionItem.bulkCreate(items, { transaction: t });
        }
      }

      await t.commit();
    } catch (error) {
      // ป้องกัน error rollback หลัง commit โดยตรวจสอบสถานะ transaction ก่อนเสมอ
      if (!t.finished) {
        await t.rollback();
      }
      logger.error('meetingService.createMeetingLog failed', { message: error.message, meetingId });
      if (!error.statusCode) error.statusCode = 400;
      throw error;
    }

    const created = await MeetingLog.findByPk(log.logId, {
      include: [
        { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
        { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
        { model: MeetingAttachment, as: 'attachments' },
        { model: MeetingActionItem, as: 'actionItems' }
      ]
    });

    logger.info('meetingService.createMeetingLog success', { meetingId, logId: log.logId, actorId: actor.userId });
    return this.serializeLog(created);
  }

  async updateMeetingLog(projectId, meetingId, logId, actor, payload = {}) {
    const context = await this.ensureMeetingAccess(meetingId, actor, { includeMembers: true });
    if (context.project.projectId !== Number(projectId)) {
      const error = new Error('การประชุมไม่อยู่ในโครงงานที่ระบุ');
      error.statusCode = 400;
      throw error;
    }

    const log = await MeetingLog.findByPk(logId, {
      include: [{ model: Meeting, as: 'meeting' }]
    });

    if (!log || log.meeting.meetingId !== Number(meetingId)) {
      const error = new Error('ไม่พบบันทึกการพบที่ระบุ');
      error.statusCode = 404;
      throw error;
    }

    // ตรวจสอบสิทธิ์ในการแก้ไข
    // นักศึกษาสามารถแก้ไขได้เมื่อ: ยังไม่ได้อนุมัติ หรือ ถูก rejected (ขอปรับปรุง)
    const canEdit = actor.role === 'admin' || 
                   (actor.userId === log.recordedBy && 
                    (log.approvalStatus !== 'approved' || log.approvalStatus === 'rejected'));
    
    if (!canEdit) {
      const error = new Error('ไม่สามารถแก้ไขบันทึกการพบที่อนุมัติแล้วได้');
      error.statusCode = 403;
      throw error;
    }

    // Validation
    if (!payload.discussionTopic || !payload.discussionTopic.trim()) {
      const error = new Error('กรุณาระบุหัวข้อที่สนทนา');
      error.statusCode = 400;
      throw error;
    }

    if (!payload.currentProgress || !payload.currentProgress.trim()) {
      const error = new Error('กรุณาระบุความคืบหน้าปัจจุบัน');
      error.statusCode = 400;
      throw error;
    }

    if (!payload.nextActionItems || !payload.nextActionItems.trim()) {
      const error = new Error('กรุณาระบุงานถัดไป');
      error.statusCode = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      // เตรียมข้อมูลสำหรับอัปเดต
      const updateData = {
        discussionTopic: payload.discussionTopic.trim(),
        currentProgress: payload.currentProgress.trim(),
        problemsIssues: payload.problemsIssues ? payload.problemsIssues.trim() : null,
        nextActionItems: payload.nextActionItems.trim(),
        advisorComment: payload.advisorComment ? payload.advisorComment.trim() : null
      };

      // หากบันทึกถูก rejected และนักศึกษาแก้ไข ให้รีเซ็ตสถานะเป็น pending
      if (log.approvalStatus === 'rejected' && actor.userId === log.recordedBy) {
        updateData.approvalStatus = 'pending';
        updateData.approvedBy = null;
        updateData.approvedAt = null;
        updateData.rejectionReason = null;
      }

      await log.update(updateData, { transaction: t });

      await t.commit();
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }
      logger.error('meetingService.updateMeetingLog failed', { message: error.message, logId });
      if (!error.statusCode) error.statusCode = 400;
      throw error;
    }

    const updated = await MeetingLog.findByPk(logId, {
      include: [
        { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
        { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
        { model: MeetingAttachment, as: 'attachments' },
        { model: MeetingActionItem, as: 'actionItems' }
      ]
    });

    logger.info('meetingService.updateMeetingLog success', { meetingId, logId, actorId: actor.userId });
    return this.serializeLog(updated);
  }

  async deleteMeetingLog(projectId, meetingId, logId, actor) {
    const context = await this.ensureMeetingAccess(meetingId, actor, { includeMembers: true });
    if (context.project.projectId !== Number(projectId)) {
      const error = new Error('การประชุมไม่อยู่ในโครงงานที่ระบุ');
      error.statusCode = 400;
      throw error;
    }

    const log = await MeetingLog.findByPk(logId, {
      include: [{ model: Meeting, as: 'meeting' }]
    });

    if (!log || log.meeting.meetingId !== Number(meetingId)) {
      const error = new Error('ไม่พบบันทึกการพบที่ระบุ');
      error.statusCode = 404;
      throw error;
    }

    // ตรวจสอบสิทธิ์ในการลบ
    // นักศึกษาสามารถลบได้เมื่อ: ยังไม่ได้อนุมัติ หรือ ถูก rejected (ขอปรับปรุง)
    const canDelete = actor.role === 'admin' || 
                     (actor.userId === log.recordedBy && 
                      (log.approvalStatus !== 'approved' || log.approvalStatus === 'rejected'));
    
    if (!canDelete) {
      const error = new Error('ไม่สามารถลบบันทึกการพบที่อนุมัติแล้วได้');
      error.statusCode = 403;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      // ลบ action items ที่เกี่ยวข้อง
      await MeetingActionItem.destroy({
        where: { logId },
        transaction: t
      });

      // ลบ attachments ที่เกี่ยวข้อง
      await MeetingAttachment.destroy({
        where: { logId },
        transaction: t
      });

      // ลบ log
      await log.destroy({ transaction: t });

      await t.commit();
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }
      logger.error('meetingService.deleteMeetingLog failed', { message: error.message, logId });
      if (!error.statusCode) error.statusCode = 400;
      throw error;
    }

    logger.info('meetingService.deleteMeetingLog success', { meetingId, logId, actorId: actor.userId });
    return { success: true, message: 'ลบบันทึกการพบสำเร็จ' };
  }

  async updateMeeting(projectId, meetingId, actor, payload = {}) {
    const context = await this.ensureProjectAccess(projectId, actor, { includeMembers: true });
    
    const meeting = await Meeting.findByPk(meetingId, {
      include: [
        { model: MeetingLog, as: 'logs' }
      ]
    });

    if (!meeting || meeting.projectId !== Number(projectId)) {
      const error = new Error('ไม่พบการประชุมที่ระบุ');
      error.statusCode = 404;
      throw error;
    }

    // ตรวจสอบว่ามี log ที่อนุมัติแล้วหรือไม่
    const hasApprovedLogs = meeting.logs.some(log => log.approvalStatus === 'approved');
    
    // ตรวจสอบสิทธิ์ในการแก้ไข
    const canEdit = actor.role === 'admin' || 
                   (context.members.some(m => m.userId === actor.userId) && !hasApprovedLogs);
    
    if (!canEdit) {
      const error = new Error('ไม่สามารถแก้ไขการประชุมที่มี log อนุมัติแล้วได้');
      error.statusCode = 403;
      throw error;
    }

    // Validation
    if (payload.meetingPhase && !MEETING_PHASES.includes(payload.meetingPhase)) {
      const error = new Error('ระยะการประชุมไม่ถูกต้อง');
      error.statusCode = 400;
      throw error;
    }

    if (!payload.meetingTitle || !payload.meetingTitle.trim()) {
      const error = new Error('กรุณาระบุหัวข้อการประชุม');
      error.statusCode = 400;
      throw error;
    }

    if (!payload.meetingDate) {
      const error = new Error('กรุณาระบุวันที่ประชุม');
      error.statusCode = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      await meeting.update({
        meetingPhase: payload.meetingPhase || meeting.meetingPhase,
        meetingTitle: payload.meetingTitle.trim(),
        meetingDate: payload.meetingDate,
        meetingMethod: payload.meetingMethod || meeting.meetingMethod,
        meetingLocation: payload.meetingLocation ? payload.meetingLocation.trim() : null,
        meetingLink: payload.meetingLink ? payload.meetingLink.trim() : null
      }, { transaction: t });

      await t.commit();
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }
      logger.error('meetingService.updateMeeting failed', { message: error.message, meetingId });
      if (!error.statusCode) error.statusCode = 400;
      throw error;
    }

    const updated = await Meeting.findByPk(meetingId, {
      include: [
        {
          model: MeetingParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] }]
        },
        {
          model: MeetingLog,
          as: 'logs',
          include: [
            { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
            { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
            { model: MeetingAttachment, as: 'attachments' },
            { model: MeetingActionItem, as: 'actionItems' }
          ]
        }
      ]
    });

    logger.info('meetingService.updateMeeting success', { projectId, meetingId, actorId: actor.userId });
    return this.serializeMeeting(updated);
  }

  async deleteMeeting(projectId, meetingId, actor) {
    const context = await this.ensureProjectAccess(projectId, actor, { includeMembers: true });
    
    const meeting = await Meeting.findByPk(meetingId, {
      include: [
        { model: MeetingLog, as: 'logs' }
      ]
    });

    if (!meeting || meeting.projectId !== Number(projectId)) {
      const error = new Error('ไม่พบการประชุมที่ระบุ');
      error.statusCode = 404;
      throw error;
    }

    // ตรวจสอบว่ามี log ที่อนุมัติแล้วหรือไม่
    const hasApprovedLogs = meeting.logs.some(log => log.approvalStatus === 'approved');
    
    // ตรวจสอบสิทธิ์ในการลบ
    const canDelete = actor.role === 'admin' || 
                     (context.members.some(m => m.userId === actor.userId) && !hasApprovedLogs);
    
    if (!canDelete) {
      const error = new Error('ไม่สามารถลบการประชุมที่มี log อนุมัติแล้วได้');
      error.statusCode = 403;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      // ลบ action items ที่เกี่ยวข้องกับ logs ทั้งหมด
      const logIds = meeting.logs.map(log => log.logId);
      if (logIds.length > 0) {
        await MeetingActionItem.destroy({
          where: { logId: { [Op.in]: logIds } },
          transaction: t
        });

        // ลบ attachments ที่เกี่ยวข้องกับ logs ทั้งหมด
        await MeetingAttachment.destroy({
          where: { logId: { [Op.in]: logIds } },
          transaction: t
        });

        // ลบ logs ทั้งหมด
        await MeetingLog.destroy({
          where: { meetingId },
          transaction: t
        });
      }

      // ลบ participants
      await MeetingParticipant.destroy({
        where: { meetingId },
        transaction: t
      });

      // ลบ meeting
      await meeting.destroy({ transaction: t });

      await t.commit();
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }
      logger.error('meetingService.deleteMeeting failed', { message: error.message, meetingId });
      if (!error.statusCode) error.statusCode = 400;
      throw error;
    }

    logger.info('meetingService.deleteMeeting success', { projectId, meetingId, actorId: actor.userId });
    return { success: true, message: 'ลบการประชุมสำเร็จ' };
  }

  async updateLogApproval(projectId, meetingId, logId, actor, payload = {}) {
    const context = await this.ensureMeetingAccess(meetingId, actor);
    if (context.project.projectId !== Number(projectId)) {
      const error = new Error('การประชุมไม่อยู่ในโครงงานที่ระบุ');
      error.statusCode = 400;
      throw error;
    }

    if (!['admin', 'teacher'].includes(actor.role)) {
      const error = new Error('เฉพาะอาจารย์ที่ปรึกษาหรือผู้ดูแลระบบเท่านั้นที่อนุมัติได้');
      error.statusCode = 403;
      throw error;
    }

    if (actor.role === 'teacher') {
      const teacher = await Teacher.findOne({ where: { userId: actor.userId } });
      if (!teacher) {
        const error = new Error('ไม่พบข้อมูลอาจารย์สำหรับผู้ใช้นี้');
        error.statusCode = 403;
        throw error;
      }
      const isAdvisor = [context.project.advisorId, context.project.coAdvisorId].filter(Boolean).includes(teacher.teacherId);
      if (!isAdvisor) {
        const error = new Error('อาจารย์ไม่ได้รับมอบหมายให้ดูแลโครงงานนี้');
        error.statusCode = 403;
        throw error;
      }
    }

    const log = await MeetingLog.findOne({ where: { logId, meetingId } });
    if (!log) {
      const error = new Error('ไม่พบบันทึกการประชุมที่ต้องการอนุมัติ');
      error.statusCode = 404;
      throw error;
    }

    const decision = payload.status || payload.decision || 'approved';
    if (!['pending', 'approved', 'rejected'].includes(decision)) {
      const error = new Error('สถานะการอนุมัติไม่ถูกต้อง');
      error.statusCode = 400;
      throw error;
    }

    let advisorComment = log.advisorComment;
    if (payload.advisorComment !== undefined) {
      advisorComment = typeof payload.advisorComment === 'string'
        ? payload.advisorComment.trim()
        : payload.advisorComment;
    }

    const update = {
      approvalStatus: decision,
      approvalNote: typeof payload.approvalNote === 'string' ? payload.approvalNote.trim() : null,
      advisorComment
    };

    if (decision === 'pending') {
      update.approvedBy = null;
      update.approvedAt = null;
    } else {
      update.approvedBy = actor.userId;
      update.approvedAt = new Date();
    }

    await MeetingLog.update(update, { where: { logId } });
    const updated = await MeetingLog.findByPk(logId, {
      include: [
        { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
        { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
        { model: MeetingAttachment, as: 'attachments' },
        { model: MeetingActionItem, as: 'actionItems' }
      ]
    });

    logger.info('meetingService.updateLogApproval success', { meetingId, logId, decision, actorId: actor.userId });
    return this.serializeLog(updated);
  }

  async listTeacherMeetingApprovals(actor, filters = {}) {
    if (!actor || actor.role !== 'teacher') {
      const error = new Error('อนุญาตเฉพาะอาจารย์เท่านั้นในการดึงคิวอนุมัติ');
      error.statusCode = 403;
      throw error;
    }

    const teacher = await Teacher.findOne({ where: { userId: actor.userId } });
    if (!teacher) {
      const error = new Error('ไม่พบข้อมูลอาจารย์สำหรับผู้ใช้นี้');
      error.statusCode = 404;
      throw error;
    }

    if (teacher.teacherType && teacher.teacherType !== 'academic') {
      const error = new Error('ฟีเจอร์นี้เปิดเฉพาะอาจารย์ที่ปรึกษาสายวิชาการเท่านั้น');
      error.statusCode = 403;
      throw error;
    }

    const allowedStatuses = new Set(['pending', 'approved', 'rejected', 'all']);
    const requestedStatusRaw = typeof filters.status === 'string' ? filters.status.trim().toLowerCase() : null;
    const requestedStatus = allowedStatuses.has(requestedStatusRaw) ? requestedStatusRaw : 'pending';

    const logWhere = {};
    if (requestedStatus !== 'all') {
      logWhere.approvalStatus = requestedStatus;
    }

    const teacherConstraint = {
      [Op.or]: [
        { advisorId: teacher.teacherId },
        { coAdvisorId: teacher.teacherId }
      ]
    };

    const projectWhere = { ...teacherConstraint };
    const academicYear = filters.academicYear ? Number(filters.academicYear) : null;
    if (Number.isInteger(academicYear) && academicYear > 1900) {
      projectWhere.academicYear = academicYear;
    }
    const semester = filters.semester ? Number(filters.semester) : null;
    if ([1, 2, 3].includes(semester)) {
      projectWhere.semester = semester;
    }
    const projectId = filters.projectId ? Number(filters.projectId) : null;
    if (Number.isInteger(projectId) && projectId > 0) {
      projectWhere.projectId = projectId;
    }

  const metaWhere = { ...teacherConstraint };
    if (metaWhere.academicYear !== undefined) {
      delete metaWhere.academicYear;
    }
    if (metaWhere.semester !== undefined) {
      delete metaWhere.semester;
    }

    const searchTerm = typeof filters.q === 'string' ? filters.q.trim() : '';
    if (searchTerm) {
      const likeValue = `%${searchTerm.replace(/[%_]/g, '\\$&')}%`;
      logWhere[Op.or] = [
        { discussionTopic: { [Op.like]: likeValue } },
        { currentProgress: { [Op.like]: likeValue } },
        { problemsIssues: { [Op.like]: likeValue } },
        { nextActionItems: { [Op.like]: likeValue } }
      ];
    }

    const logs = await MeetingLog.findAll({
      where: logWhere,
      include: [
        {
          model: Meeting,
          as: 'meeting',
          attributes: ['meetingId', 'meetingTitle', 'meetingDate', 'meetingMethod', 'meetingLocation', 'meetingLink', 'projectId'],
          required: true,
          include: [
            {
              model: ProjectDocument,
              as: 'project',
              attributes: ['projectId', 'projectCode', 'projectNameTh', 'projectNameEn', 'advisorId', 'coAdvisorId', 'academicYear', 'semester'],
              where: projectWhere,
              required: true,
              include: [
                {
                  model: Teacher,
                  as: 'advisor',
                  attributes: ['teacherId', 'teacherCode', 'userId'],
                  include: [
                    {
                      model: User,
                      as: 'user',
                      attributes: ['userId', 'firstName', 'lastName', 'email']
                    }
                  ]
                },
                {
                  model: Teacher,
                  as: 'coAdvisor',
                  attributes: ['teacherId', 'teacherCode', 'userId'],
                  include: [
                    {
                      model: User,
                      as: 'user',
                      attributes: ['userId', 'firstName', 'lastName', 'email']
                    }
                  ]
                }
              ]
            }
          ]
        },
        { model: User, as: 'recorder', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
        { model: User, as: 'approver', attributes: ['userId', 'firstName', 'lastName', 'email', 'role'] },
        { model: MeetingAttachment, as: 'attachments', attributes: ['attachmentId', 'fileName', 'filePath', 'fileType', 'fileSize', 'uploadDate', 'uploadedBy'] },
        { model: MeetingActionItem, as: 'actionItems', attributes: ['itemId', 'actionDescription', 'assignedTo', 'dueDate', 'status', 'completionDate'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const projectIds = Array.from(new Set(
      logs
        .map(log => log.meeting?.project?.projectId)
        .filter(id => Number.isInteger(id))
    ));

    const projectMemberMap = new Map();
    // รวมข้อมูลนักศึกษาในแต่ละโครงงานไว้ล่วงหน้า เพื่อให้เมธอดหลักสามารถนำไปแสดงผลได้สะดวก
    if (projectIds.length) {
      const memberships = await ProjectMember.findAll({
        where: { projectId: { [Op.in]: projectIds } },
        attributes: ['projectId'],
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['studentId', 'studentCode', 'userId'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['userId', 'firstName', 'lastName', 'email']
            }]
          }
        ]
      });

      memberships.forEach(member => {
        if (!projectMemberMap.has(member.projectId)) {
          projectMemberMap.set(member.projectId, []);
        }
        const student = member.student;
        if (!student) return;
        const user = student.user;
        const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() : null;
        projectMemberMap.get(member.projectId).push({
          studentId: student.studentId,
          studentCode: student.studentCode,
          userId: student.userId,
          fullName: fullName || student.studentCode,
          email: user?.email || null
        });
      });
    }

    const now = Date.now();
    const items = logs.map(logInstance => {
      const serializedLog = this.serializeLog(logInstance);
      const meeting = logInstance.meeting;
      const project = meeting?.project;
      const projectIdValue = project?.projectId || null;
      const students = projectIdValue ? (projectMemberMap.get(projectIdValue) || []) : [];
      const pendingDurationMs = serializedLog.createdAt ? now - new Date(serializedLog.createdAt).getTime() : null;
      const pendingDurationDays = pendingDurationMs != null ? Math.max(0, Math.floor(pendingDurationMs / (24 * 60 * 60 * 1000))) : null;

      const advisorRole = project
        ? project.advisorId === teacher.teacherId
          ? 'advisor'
          : project.coAdvisorId === teacher.teacherId
            ? 'coAdvisor'
            : null
        : null;

      return {
        ...serializedLog,
        meeting: meeting ? {
          meetingId: meeting.meetingId,
          meetingTitle: meeting.meetingTitle,
          meetingDate: meeting.meetingDate,
          meetingMethod: meeting.meetingMethod,
          meetingLocation: meeting.meetingLocation,
          meetingLink: meeting.meetingLink,
          projectId: meeting.projectId
        } : null,
        project: project ? {
          projectId: project.projectId,
          projectCode: project.projectCode,
          projectNameTh: project.projectNameTh,
          projectNameEn: project.projectNameEn,
          academicYear: project.academicYear,
          semester: project.semester,
          advisor: project.advisor ? {
            teacherId: project.advisor.teacherId,
            teacherCode: project.advisor.teacherCode,
            userId: project.advisor.userId,
            firstName: project.advisor.user?.firstName || null,
            lastName: project.advisor.user?.lastName || null,
            email: project.advisor.user?.email || null
          } : null,
          coAdvisor: project.coAdvisor ? {
            teacherId: project.coAdvisor.teacherId,
            teacherCode: project.coAdvisor.teacherCode,
            userId: project.coAdvisor.userId,
            firstName: project.coAdvisor.user?.firstName || null,
            lastName: project.coAdvisor.user?.lastName || null,
            email: project.coAdvisor.user?.email || null
          } : null
        } : null,
        students,
        advisorRole,
        pendingDurationDays
      };
    });

    // คำนวณสรุปจำนวนตามสถานะเพื่อใช้แสดงบน Dashboard ของอาจารย์
    const summaryRows = await MeetingLog.findAll({
      attributes: [
        'approvalStatus',
        [sequelize.fn('COUNT', sequelize.col('MeetingLog.log_id')), 'count']
      ],
      include: [{
        model: Meeting,
        as: 'meeting',
        attributes: [],
        required: true,
        include: [{
          model: ProjectDocument,
          as: 'project',
          attributes: [],
          required: true,
          where: projectWhere
        }]
      }],
      group: ['MeetingLog.approval_status'],
      raw: true
    });

    const summary = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };
    summaryRows.forEach(row => {
      const status = row.approvalStatus || row['MeetingLog.approvalStatus'] || row.approval_status;
      const count = Number(row.count || 0);
      if (status === 'approved') summary.approved = count;
      else if (status === 'rejected') summary.rejected = count;
      else if (status === 'pending') summary.pending = count;
    });
    summary.total = summary.pending + summary.approved + summary.rejected;

    let availableAcademicYears = [];
    let availableSemestersByYear = {};
    let projectsByAcademicYear = {};
    try {
      const periodRows = await ProjectDocument.findAll({
        attributes: [
          [sequelize.col('academic_year'), 'academicYear'],
          [sequelize.col('semester'), 'semester']
        ],
        where: metaWhere,
        group: ['academic_year', 'semester'],
        order: [
          [sequelize.literal('academic_year IS NULL'), 'ASC'],
          [sequelize.literal('academic_year'), 'DESC'],
          [sequelize.literal('semester'), 'ASC']
        ],
        raw: true
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

      const projectRows = await ProjectDocument.findAll({
        attributes: [
          [sequelize.col('academic_year'), 'academicYear'],
          [sequelize.col('project_id'), 'projectId'],
          [sequelize.col('project_code'), 'projectCode'],
          [sequelize.col('project_name_th'), 'projectNameTh'],
          [sequelize.col('project_name_en'), 'projectNameEn'],
          [sequelize.col('semester'), 'semester']
        ],
        where: metaWhere,
        order: [
          [sequelize.literal('academic_year'), 'DESC'],
          [sequelize.literal('semester'), 'ASC'],
          ['project_name_th', 'ASC']
        ],
        raw: true
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
          semester: row.semester
        });
        return acc;
      }, {});
    } catch (metaError) {
      logger.warn('meetingService.listTeacherMeetingApprovals meta build failed', { error: metaError.message });
    }

    const defaultAcademicYear = academicYear ?? (availableAcademicYears[0] ?? null);
    const defaultSemester = semester ?? (defaultAcademicYear ? (availableSemestersByYear[defaultAcademicYear]?.[0] ?? null) : null);

    return {
      items,
      summary,
      teacher: {
        teacherId: teacher.teacherId,
        teacherType: teacher.teacherType || null
      },
      meta: {
        totalItems: items.length,
        appliedFilters: {
          status: requestedStatus,
          academicYear: Number.isInteger(academicYear) ? academicYear : null,
          semester: [1, 2, 3].includes(semester) ? semester : null,
          projectId: Number.isInteger(projectId) ? projectId : null,
          search: searchTerm || null
        },
        availableAcademicYears,
        availableSemestersByYear,
        defaultAcademicYear,
        defaultSemester,
        projectsByAcademicYear
      }
    };
  }

  async sendMeetingScheduledNotifications({ project, meeting, actor, members = [], note = null } = {}) {
    if (!project || !meeting) {
      return { recipients: [], totalRecipients: 0 };
    }

    const meetingData = typeof meeting === 'object' && typeof meeting.toJSON === 'function'
      ? this.serializeMeeting(meeting)
      : meeting;

    const participants = Array.isArray(meetingData.participants) ? meetingData.participants : [];
    if (!participants.length) {
      logger.warn('meetingService.sendMeetingScheduledNotifications skipped: no participants', {
        projectId: project.projectId,
        meetingId: meetingData.meetingId
      });
      return { recipients: [], totalRecipients: 0 };
    }

    const memberMap = new Map();
    if (Array.isArray(members)) {
      members.forEach(member => {
        const studentUserId = member.student?.user?.userId;
        if (studentUserId) {
          memberMap.set(studentUserId, {
            studentCode: member.student?.studentCode || null
          });
        }
      });
    }

    const roleLabels = {
      advisor: 'อาจารย์ที่ปรึกษา',
      co_advisor: 'อาจารย์ที่ปรึกษาร่วม',
      student: 'นักศึกษา',
      guest: 'ผู้เข้าร่วม'
    };

    const participantDetails = participants.map(participant => {
      const userInfo = participant.user || {};
      const fullName = userInfo.fullName || [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ').trim();
      const fallbackName = memberMap.get(participant.userId)?.studentCode || userInfo.email || 'ผู้เข้าร่วม';
      return {
        userId: participant.userId,
        email: userInfo.email || null,
        name: fullName || fallbackName,
        role: participant.role || 'guest',
        roleLabel: roleLabels[participant.role] || 'ผู้เข้าร่วม',
        studentCode: memberMap.get(participant.userId)?.studentCode || null
      };
    });

    const recipientMap = new Map();
    participantDetails.forEach(detail => {
      if (!detail.email) return;
      if (!recipientMap.has(detail.email)) {
        recipientMap.set(detail.email, detail);
      }
    });

    if (!recipientMap.size) {
      logger.warn('meetingService.sendMeetingScheduledNotifications skipped: participant emails missing', {
        projectId: project.projectId,
        meetingId: meetingData.meetingId
      });
      return { recipients: [], totalRecipients: 0 };
    }

    let initiatorName = null;
    if (actor?.userId) {
      const initiator = participantDetails.find(detail => detail.userId === actor.userId && detail.name);
      if (initiator?.name) {
        initiatorName = initiator.name;
      } else {
        const initiatorUser = await User.findByPk(actor.userId, {
          attributes: ['firstName', 'lastName', 'email']
        });
        if (initiatorUser) {
          initiatorName = [initiatorUser.firstName, initiatorUser.lastName].filter(Boolean).join(' ').trim() || initiatorUser.email || null;
        }
      }
    }
    if (!initiatorName) {
      initiatorName = 'ผู้ใช้ระบบ';
    }

    const meetingMethodLabels = {
      onsite: 'onsite (พบกันที่สถานที่จริง)',
      online: 'online (ผ่านระบบออนไลน์)',
      hybrid: 'hybrid (ผสม onsite/online)'
    };

    const meetingDateValue = meetingData.meetingDate ? new Date(meetingData.meetingDate) : null;
    const meetingDateLabel = meetingDateValue
      ? meetingDateValue.toLocaleString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';

    const noteText = typeof note === 'string' && note.trim().length ? note.trim() : null;

    const basePayload = {
      projectName: project.projectNameTh || project.projectNameEn || `Project ${project.projectId}`,
      meetingTitle: meetingData.meetingTitle || 'การประชุมโครงงาน',
      meetingDate: meetingData.meetingDate || null,
      meetingDateLabel,
      meetingMethod: meetingData.meetingMethod,
      meetingMethodLabel: meetingMethodLabels[meetingData.meetingMethod] || meetingData.meetingMethod || 'onsite',
      meetingLocation: meetingData.meetingLocation || null,
      meetingLink: meetingData.meetingLink || null,
      participants: participantDetails.map(({ name, studentCode, roleLabel }) => ({
        name,
        studentCode,
        roleLabel
      })),
      initiatorName,
      note: noteText
    };

    const recipients = [];
    for (const detail of recipientMap.values()) {
      try {
        const sendResult = await mailer.sendMeetingScheduledNotification({
          recipientEmail: detail.email,
          recipientName: detail.name,
          ...basePayload
        });
        recipients.push({
          email: detail.email,
          name: detail.name,
          sent: sendResult.sent !== false,
          reason: sendResult.reason || null,
          messageId: sendResult.messageId || null
        });
      } catch (error) {
        logger.error('meetingService.sendMeetingScheduledNotifications send failed', {
          message: error.message,
          stack: error.stack,
          projectId: project.projectId,
          meetingId: meetingData.meetingId,
          recipient: detail.email
        });
        recipients.push({
          email: detail.email,
          name: detail.name,
          sent: false,
          reason: error.message || 'email_error',
          messageId: null
        });
      }
    }

    logger.info('meetingService.sendMeetingScheduledNotifications completed', {
      projectId: project.projectId,
      meetingId: meetingData.meetingId,
      recipientCount: recipients.length
    });

    return { recipients, totalRecipients: recipients.length };
  }

  async buildParticipants({ meetingId, project, members, actor, additionalParticipantIds }) {
    const participants = new Map();

    const addParticipant = (userId, role, overrides = {}) => {
      if (!userId) return;
      if (!participants.has(userId)) {
        participants.set(userId, {
          meetingId,
          userId,
          role,
          attendanceStatus: overrides.attendanceStatus || 'present',
          joinTime: overrides.joinTime || null,
          leaveTime: overrides.leaveTime || null
        });
      }
    };

    // เพิ่มสมาชิกโครงงานทุกคนเป็น participants อัตโนมัติ
    if (Array.isArray(members)) {
      members.forEach(member => {
        const studentUserId = member.student?.user?.userId;
        if (studentUserId) {
          addParticipant(studentUserId, 'student');
        }
      });
    }

    // เพิ่มอาจารย์ที่ปรึกษา
    const teacherIds = [project.advisorId, project.coAdvisorId].filter(Boolean);
    if (teacherIds.length) {
      const teachers = await Teacher.findAll({ where: { teacherId: { [Op.in]: teacherIds } } });
      teachers.forEach(teacher => {
        addParticipant(teacher.userId, teacher.teacherId === project.advisorId ? 'advisor' : 'co_advisor');
      });
    }

    // เพิ่มผู้เข้าร่วมเพิ่มเติม
    if (Array.isArray(additionalParticipantIds)) {
      additionalParticipantIds
        .map(id => Number(id))
        .filter(id => !Number.isNaN(id))
        .forEach(userId => addParticipant(userId, 'guest'));
    }

    // เพิ่มผู้สร้างการประชุม (ถ้ายังไม่ได้เป็น participant)
    addParticipant(actor.userId, actor.role === 'teacher' ? 'advisor' : actor.role === 'student' ? 'student' : 'guest');

    return Array.from(participants.values());
  }

  serializeMeeting(meetingInstance) {
    if (!meetingInstance) return null;
    const meeting = typeof meetingInstance.toJSON === 'function'
      ? meetingInstance.toJSON()
      : meetingInstance;
    return {
      meetingId: meeting.meetingId,
      meetingTitle: meeting.meetingTitle,
      meetingDate: meeting.meetingDate,
      meetingMethod: meeting.meetingMethod,
      meetingLocation: meeting.meetingLocation,
      meetingLink: meeting.meetingLink,
    status: meeting.status,
    phase: meeting.phase || DEFAULT_MEETING_PHASE,
      projectId: meeting.projectId,
      createdBy: meeting.createdBy,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
      participants: Array.isArray(meeting.participants) ? meeting.participants.map(participant => this.serializeParticipant(participant)) : [],
      logs: Array.isArray(meeting.logs) ? meeting.logs.map(log => this.serializeLog(log)) : []
    };
  }

  serializeParticipant(participantInstance) {
    if (!participantInstance) return null;
    const participant = typeof participantInstance.toJSON === 'function'
      ? participantInstance.toJSON()
      : participantInstance;
    if (!participant || typeof participant !== 'object') return null;
    return {
      meetingId: participant.meetingId,
      userId: participant.userId,
      role: participant.role,
      attendanceStatus: participant.attendanceStatus,
      joinTime: participant.joinTime,
      leaveTime: participant.leaveTime,
      user: participant.user ? {
        userId: participant.user.userId,
        firstName: participant.user.firstName,
        lastName: participant.user.lastName,
        fullName: [participant.user.firstName, participant.user.lastName].filter(Boolean).join(' ').trim(),
        email: participant.user.email,
        role: participant.user.role
      } : null
    };
  }

  serializeLog(logInstance) {
    if (!logInstance) return null;
    const log = typeof logInstance.toJSON === 'function'
      ? logInstance.toJSON()
      : logInstance;
    if (!log || typeof log !== 'object') return null;
    
    // แก้ไข: ใช้ชื่อ field ที่ถูกต้องตาม underscored convention
    // Sequelize จะแปลง created_at เป็น createdAt ใน JavaScript object
    const createdAt = log.createdAt || log.created_at || null;
    const updatedAt = log.updatedAt || log.updated_at || null;
    
    return {
      logId: log.logId,
      meetingId: log.meetingId,
      discussionTopic: log.discussionTopic,
      currentProgress: log.currentProgress,
      problemsIssues: log.problemsIssues,
      nextActionItems: log.nextActionItems,
      advisorComment: log.advisorComment,
      approvalStatus: log.approvalStatus,
      approvalNote: log.approvalNote,
      approvedBy: log.approvedBy,
      approvedAt: log.approvedAt,
      recordedBy: log.recordedBy,
      createdAt: createdAt,
      updatedAt: updatedAt,
      recorder: log.recorder ? {
        userId: log.recorder.userId,
        firstName: log.recorder.firstName,
        lastName: log.recorder.lastName,
        fullName: [log.recorder.firstName, log.recorder.lastName].filter(Boolean).join(' ').trim(),
        email: log.recorder.email,
        role: log.recorder.role
      } : null,
      approver: log.approver ? {
        userId: log.approver.userId,
        firstName: log.approver.firstName,
        lastName: log.approver.lastName,
        fullName: [log.approver.firstName, log.approver.lastName].filter(Boolean).join(' ').trim(),
        email: log.approver.email,
        role: log.approver.role
      } : null,
      attachments: Array.isArray(log.attachments) ? log.attachments.map(att => ({
        attachmentId: att.attachmentId,
        fileName: att.fileName,
        filePath: att.filePath,
        fileType: att.fileType,
        fileSize: att.fileSize,
        uploadDate: att.uploadDate,
        uploadedBy: att.uploadedBy
      })) : [],
      actionItems: Array.isArray(log.actionItems) ? log.actionItems.map(item => ({
        itemId: item.itemId,
        actionDescription: item.actionDescription,
        assignedTo: item.assignedTo,
        dueDate: item.dueDate,
        status: item.status,
        completionDate: item.completionDate
      })) : []
    };
  }

}

module.exports = new MeetingService();
