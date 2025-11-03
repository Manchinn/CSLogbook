// services/workflowReportService.js
// Service สำหรับรายงานความคืบหน้า Workflow ของนักศึกษา
const { StudentWorkflowActivity, WorkflowStepDefinition, Student, User, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

class WorkflowReportService {
  /**
   * ดึงข้อมูลความคืบหน้า workflow ทั้งหมด
   * @param {Object} options - { workflowType, academicYear, semester }
   */
  async getWorkflowProgress(options = {}) {
    try {
      const { workflowType, academicYear, semester } = options;
      
      // Filter conditions
      const where = {};
      if (workflowType) where.workflowType = workflowType;
      
      // ดึงข้อมูล activities ทั้งหมด
      const activities = await StudentWorkflowActivity.findAll({
        where,
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['studentId', 'studentCode', 'advisorId'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          }
        ],
        order: [['updated_at', 'DESC']]
      });

      // นับจำนวนนักศึกษาในแต่ละขั้นตอน
      const stepCounts = await StudentWorkflowActivity.findAll({
        where,
        attributes: [
          'currentStepKey',
          'currentStepStatus',
          [fn('COUNT', col('activity_id')), 'count']
        ],
        group: ['currentStepKey', 'currentStepStatus'],
        raw: true
      });

      // คำนวณสถิติ overall status
      const overallStats = await StudentWorkflowActivity.findAll({
        where,
        attributes: [
          'overallWorkflowStatus',
          [fn('COUNT', col('activity_id')), 'count']
        ],
        group: ['overallWorkflowStatus'],
        raw: true
      });

      // ดึงข้อมูล step definitions
      const stepWhere = {};
      if (workflowType) stepWhere.workflowType = workflowType;
      const stepDefinitions = await WorkflowStepDefinition.findAll({
        where: stepWhere,
        order: [['stepOrder', 'ASC']],
        raw: true
      });

      // สร้าง funnel data
      const funnelData = this._buildFunnelData(stepCounts, stepDefinitions);

      // คำนวณ bottlenecks
      const bottlenecks = await this._calculateBottlenecks(activities, stepDefinitions);

      // สรุปสถิติ
      const summary = {
        total: activities.length,
        notStarted: overallStats.find(s => s.overallWorkflowStatus === 'not_started')?.count || 0,
        inProgress: overallStats.find(s => s.overallWorkflowStatus === 'in_progress')?.count || 0,
        completed: overallStats.find(s => s.overallWorkflowStatus === 'completed')?.count || 0,
        blocked: overallStats.find(s => s.overallWorkflowStatus === 'blocked')?.count || 0,
        eligible: overallStats.find(s => s.overallWorkflowStatus === 'eligible')?.count || 0,
        enrolled: overallStats.find(s => s.overallWorkflowStatus === 'enrolled')?.count || 0
      };

      return {
        summary,
        funnelData,
        bottlenecks,
        stepCounts: this._formatStepCounts(stepCounts, stepDefinitions),
        overallStats: overallStats.map(s => ({
          status: s.overallWorkflowStatus,
          count: parseInt(s.count),
          percentage: summary.total ? ((parseInt(s.count) / summary.total) * 100).toFixed(1) : 0
        }))
      };
    } catch (error) {
      logger.error('Error in getWorkflowProgress:', error);
      throw error;
    }
  }

  /**
   * ดึง Bottleneck Analysis - ขั้นตอนที่นักศึกษาติดมากที่สุด
   */
  async _calculateBottlenecks(activities, stepDefinitions) {
    const now = dayjs();
    const bottlenecks = [];

    // Group by current step
    const stepGroups = activities.reduce((acc, activity) => {
      const key = activity.currentStepKey;
      if (!acc[key]) acc[key] = [];
      acc[key].push(activity);
      return acc;
    }, {});

    for (const [stepKey, activityList] of Object.entries(stepGroups)) {
      const stepDef = stepDefinitions.find(s => s.stepKey === stepKey);
      
      // คำนวณเวลาเฉลี่ยที่ใช้ในขั้นนี้
      const durations = activityList
        .filter(a => a.updatedAt)
        .map(a => now.diff(dayjs(a.updatedAt), 'day'));
      
      const avgDuration = durations.length ? 
        (durations.reduce((sum, d) => sum + d, 0) / durations.length) : 0;

      // นักศึกษาที่ติดอยู่นานเกิน 30 วัน
      const stuckStudents = activityList.filter(a => 
        now.diff(dayjs(a.updatedAt), 'day') > 30
      );

      bottlenecks.push({
        stepKey,
        stepTitle: stepDef?.title || stepKey,
        stepOrder: stepDef?.stepOrder || 999,
        studentCount: activityList.length,
        avgDurationDays: Math.round(avgDuration),
        stuckCount: stuckStudents.length,
        stuckPercentage: activityList.length ? 
          ((stuckStudents.length / activityList.length) * 100).toFixed(1) : 0
      });
    }

    // เรียงตาม stuck percentage
    return bottlenecks
      .sort((a, b) => b.stuckPercentage - a.stuckPercentage)
      .slice(0, 10);
  }

  /**
   * สร้าง Funnel Chart Data
   */
  _buildFunnelData(stepCounts, stepDefinitions) {
    const funnelMap = {};

    stepDefinitions.forEach(step => {
      const counts = stepCounts.filter(sc => sc.currentStepKey === step.stepKey);
      const total = counts.reduce((sum, sc) => sum + parseInt(sc.count), 0);
      
      funnelMap[step.stepKey] = {
        stepKey: step.stepKey,
        stepTitle: step.title,
        stepOrder: step.stepOrder,
        total,
        completed: counts.find(c => c.currentStepStatus === 'completed')?.count || 0,
        inProgress: counts.find(c => c.currentStepStatus === 'in_progress')?.count || 0,
        pending: counts.find(c => c.currentStepStatus === 'pending')?.count || 0,
        blocked: counts.find(c => c.currentStepStatus === 'blocked')?.count || 0
      };
    });

    return Object.values(funnelMap).sort((a, b) => a.stepOrder - b.stepOrder);
  }

  /**
   * Format Step Counts with readable labels
   */
  _formatStepCounts(stepCounts, stepDefinitions) {
    return stepCounts.map(sc => {
      const stepDef = stepDefinitions.find(s => s.stepKey === sc.currentStepKey);
      return {
        stepKey: sc.currentStepKey,
        stepTitle: stepDef?.title || sc.currentStepKey,
        stepOrder: stepDef?.stepOrder || 999,
        status: sc.currentStepStatus,
        count: parseInt(sc.count)
      };
    }).sort((a, b) => a.stepOrder - b.stepOrder);
  }

  /**
   * ดึง Timeline ของนักศึกษาคนใดคนหนึ่ง
   */
  async getStudentTimeline(studentId, workflowType) {
    try {
      const activity = await StudentWorkflowActivity.findOne({
        where: { studentId, workflowType },
        include: [{
          model: Student,
          as: 'student',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }]
        }]
      });

      if (!activity) {
        return { error: 'ไม่พบข้อมูล workflow ของนักศึกษา' };
      }

      // ดึง step definitions
      const steps = await WorkflowStepDefinition.findAll({
        where: { workflowType },
        order: [['stepOrder', 'ASC']]
      });

      // สร้าง timeline
      const timeline = steps.map(step => ({
        stepKey: step.stepKey,
        title: step.title,
        stepOrder: step.stepOrder,
        isCurrent: step.stepKey === activity.currentStepKey,
        status: step.stepKey === activity.currentStepKey ? 
          activity.currentStepStatus : 
          (step.stepOrder < steps.find(s => s.stepKey === activity.currentStepKey)?.stepOrder ? 'completed' : 'pending')
      }));

      return {
        student: {
          studentId: activity.student.studentId,
          studentCode: activity.student.studentCode,
          name: `${activity.student.user.firstName} ${activity.student.user.lastName}`
        },
        workflowType,
        overallStatus: activity.overallWorkflowStatus,
        currentStep: activity.currentStepKey,
        startedAt: activity.startedAt,
        completedAt: activity.completedAt,
        timeline
      };
    } catch (error) {
      logger.error('Error in getStudentTimeline:', error);
      throw error;
    }
  }

  /**
   * ดึงนักศึกษาที่ติดขัด (blocked students)
   */
  async getBlockedStudents(workflowType) {
    try {
      const where = {
        [Op.or]: [
          { currentStepStatus: 'blocked' },
          { overallWorkflowStatus: 'blocked' }
        ]
      };
      
      if (workflowType) where.workflowType = workflowType;

      const blocked = await StudentWorkflowActivity.findAll({
        where,
        include: [{
          model: Student,
          as: 'student',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }]
        }],
        order: [['updated_at', 'ASC']]
      });

      return blocked.map(activity => ({
        studentId: activity.student.studentId,
        studentCode: activity.student.studentCode,
        name: `${activity.student.user.firstName} ${activity.student.user.lastName}`,
        workflowType: activity.workflowType,
        currentStep: activity.currentStepKey,
        currentStepStatus: activity.currentStepStatus,
        overallStatus: activity.overallWorkflowStatus,
        blockedSince: activity.updatedAt,
        daysSinceUpdate: dayjs().diff(dayjs(activity.updatedAt), 'day')
      }));
    } catch (error) {
      logger.error('Error in getBlockedStudents:', error);
      throw error;
    }
  }
}

module.exports = new WorkflowReportService();
