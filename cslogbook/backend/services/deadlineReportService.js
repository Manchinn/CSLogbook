// services/deadlineReportService.js
// Service สำหรับรายงานการปฏิบัติตาม Deadline
const { ImportantDeadline, Document, InternshipDocument, ProjectDocument, Student, User, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../utils/logger');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const weekOfYear = require('dayjs/plugin/weekOfYear');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);

class DeadlineReportService {
  /**
   * ดึงรายงานการปฏิบัติตาม deadline
   * @param {Object} options - { academicYear, semester, relatedTo }
   */
  async getDeadlineCompliance(options = {}) {
    try {
      const { academicYear, semester, relatedTo } = options;
      
      // Build where clause
      const where = { isPublished: true };
      if (academicYear) where.academicYear = academicYear.toString();
      if (semester) where.semester = parseInt(semester);
      if (relatedTo) where.relatedTo = relatedTo;

      // ดึงข้อมูล deadlines
      const deadlines = await ImportantDeadline.findAll({
        where,
        order: [['deadlineAt', 'ASC']]
      });

      // คำนวณสถิติสำหรับแต่ละ deadline
      const deadlineStats = await Promise.all(
        deadlines.map(deadline => this._calculateDeadlineStats(deadline))
      );

      // สรุปภาพรวม
      const summary = this._calculateSummary(deadlineStats);

      // Upcoming deadlines (ใน 7 วัน)
      const upcoming = this._getUpcomingDeadlines(deadlines);

      // Overdue deadlines
      const overdue = this._getOverdueDeadlines(deadlines);

      // Compliance trend (รายสัปดาห์)
      const trend = this._calculateComplianceTrend(deadlineStats);

      // รายชื่อนักศึกษาที่ส่งช้า
      const lateSubmissions = await this._getLateSubmissions(deadlines);

      return {
        summary,
        deadlineStats,
        upcoming,
        overdue,
        trend,
        lateSubmissions
      };
    } catch (error) {
      logger.error('Error in getDeadlineCompliance:', error);
      throw error;
    }
  }

  /**
   * คำนวณสถิติของ deadline แต่ละตัว
   */
  async _calculateDeadlineStats(deadline) {
    const now = dayjs().tz('Asia/Bangkok');
    const deadlineDate = dayjs(deadline.deadlineAt).tz('Asia/Bangkok');
    const gracePeriodEnd = deadline.gracePeriodMinutes ? 
      deadlineDate.add(deadline.gracePeriodMinutes, 'minute') : deadlineDate;

    // นับจำนวนการส่งจากเอกสารที่เกี่ยวข้อง
    let submissionData = { total: 0, onTime: 0, late: 0, notSubmitted: 0 };

    // ตรวจสอบประเภท deadline และนับการส่ง
    if (deadline.deadlineType === 'SUBMISSION') {
      submissionData = await this._countSubmissions(deadline, deadlineDate, gracePeriodEnd);
    }

    const isOverdue = now.isAfter(deadlineDate);
    const daysUntil = deadlineDate.diff(now, 'day');
    const daysOverdue = isOverdue ? now.diff(deadlineDate, 'day') : 0;

    return {
      id: deadline.id,
      name: deadline.name,
      description: deadline.description,
      deadlineAt: deadline.deadlineAt,
      relatedTo: deadline.relatedTo,
      deadlineType: deadline.deadlineType,
      isCritical: deadline.isCritical,
      isOverdue,
      daysUntil,
      daysOverdue,
      gracePeriodMinutes: deadline.gracePeriodMinutes,
      allowLate: deadline.allowLate,
      lockAfterDeadline: deadline.lockAfterDeadline,
      ...submissionData,
      complianceRate: submissionData.total > 0 ? 
        parseFloat(((submissionData.onTime / submissionData.total) * 100).toFixed(1)) : 0
    };
  }

  /**
   * นับจำนวนการส่งเอกสาร
   */
  async _countSubmissions(deadline, deadlineDate, gracePeriodEnd) {
    try {
      // กำหนด query ตาม relatedTo
      let submissions = [];
      
      if (deadline.relatedTo === 'internship') {
        // นับจาก InternshipDocument
        submissions = await InternshipDocument.findAll({
          where: {
            academicYear: deadline.academicYear,
            semester: deadline.semester
          },
          attributes: ['documentId', 'created_at'],
          raw: true
        });
      } else if (deadline.relatedTo.startsWith('project')) {
        // นับจาก ProjectDocument
        submissions = await ProjectDocument.findAll({
          attributes: ['projectId', 'created_at'],
          raw: true
        });
      } else {
        // นับจาก Document ทั่วไป
        submissions = await Document.findAll({
          where: {
            documentType: { [Op.like]: `%${deadline.relatedTo}%` }
          },
          attributes: ['documentId', 'created_at'],
          raw: true
        });
      }

      const total = submissions.length;
      let onTime = 0;
      let late = 0;

      submissions.forEach(sub => {
        const submittedAt = dayjs(sub.created_at).tz('Asia/Bangkok');
        if (submittedAt.isBefore(deadlineDate) || submittedAt.isSame(deadlineDate)) {
          onTime++;
        } else if (submittedAt.isBefore(gracePeriodEnd) || submittedAt.isSame(gracePeriodEnd)) {
          onTime++; // ถือว่าตรงเวลาถ้าอยู่ใน grace period
        } else {
          late++;
        }
      });

      // คำนวณจำนวนที่ยังไม่ส่ง (ประมาณการจากนักศึกษาทั้งหมด)
      const expectedTotal = await this._getExpectedSubmissions(deadline);
      const notSubmitted = Math.max(0, expectedTotal - total);

      return {
        total,
        onTime,
        late,
        notSubmitted,
        expectedTotal
      };
    } catch (error) {
      logger.error('Error counting submissions:', error);
      return { total: 0, onTime: 0, late: 0, notSubmitted: 0, expectedTotal: 0 };
    }
  }

  /**
   * ประมาณการจำนวนการส่งที่คาดหวัง
   */
  async _getExpectedSubmissions(deadline) {
    try {
      const where = {};
      
      if (deadline.relatedTo === 'internship') {
        where.isEligibleInternship = true;
      } else if (deadline.relatedTo.startsWith('project')) {
        where.isEligibleProject = true;
      }

      return await Student.count({ where });
    } catch (error) {
      logger.error('Error getting expected submissions:', error);
      return 0;
    }
  }

  /**
   * สรุปภาพรวม
   */
  _calculateSummary(deadlineStats) {
    const total = deadlineStats.length;
    const overdue = deadlineStats.filter(d => d.isOverdue).length;
    const upcoming = deadlineStats.filter(d => !d.isOverdue && d.daysUntil <= 7).length;
    const critical = deadlineStats.filter(d => d.isCritical).length;

    const totalSubmissions = deadlineStats.reduce((sum, d) => sum + d.total, 0);
    const onTimeSubmissions = deadlineStats.reduce((sum, d) => sum + d.onTime, 0);
    const lateSubmissions = deadlineStats.reduce((sum, d) => sum + d.late, 0);
    const notSubmitted = deadlineStats.reduce((sum, d) => sum + d.notSubmitted, 0);

    const overallComplianceRate = totalSubmissions > 0 ? 
      parseFloat(((onTimeSubmissions / totalSubmissions) * 100).toFixed(1)) : 0;

    return {
      totalDeadlines: total,
      overdueCount: overdue,
      upcomingCount: upcoming,
      criticalCount: critical,
      totalSubmissions,
      onTimeSubmissions,
      lateSubmissions,
      notSubmitted,
      onTimePercentage: overallComplianceRate,
      latePercentage: totalSubmissions > 0 ? parseFloat(((lateSubmissions / totalSubmissions) * 100).toFixed(1)) : 0,
      notSubmittedPercentage: totalSubmissions > 0 ? parseFloat(((notSubmitted / (totalSubmissions + notSubmitted)) * 100).toFixed(1)) : 0
    };
  }

  /**
   * Deadline ที่กำลังจะถึง
   */
  _getUpcomingDeadlines(deadlines) {
    const now = dayjs().tz('Asia/Bangkok');
    return deadlines
      .filter(d => {
        const deadlineDate = dayjs(d.deadlineAt).tz('Asia/Bangkok');
        const daysUntil = deadlineDate.diff(now, 'day');
        return daysUntil >= 0 && daysUntil <= 7;
      })
      .map(d => ({
        id: d.id,
        name: d.name,
        deadlineAt: d.deadlineAt,
        relatedTo: d.relatedTo,
        isCritical: d.isCritical,
        daysUntil: dayjs(d.deadlineAt).tz('Asia/Bangkok').diff(now, 'day')
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  /**
   * Deadline ที่พ้นแล้ว
   */
  _getOverdueDeadlines(deadlines) {
    const now = dayjs().tz('Asia/Bangkok');
    return deadlines
      .filter(d => {
        const deadlineDate = dayjs(d.deadlineAt).tz('Asia/Bangkok');
        return now.isAfter(deadlineDate);
      })
      .map(d => ({
        id: d.id,
        name: d.name,
        deadlineAt: d.deadlineAt,
        relatedTo: d.relatedTo,
        isCritical: d.isCritical,
        daysOverdue: now.diff(dayjs(d.deadlineAt).tz('Asia/Bangkok'), 'day')
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  /**
   * คำนวณ Compliance Trend
   */
  _calculateComplianceTrend(deadlineStats) {
    // Group by week
    const weeklyData = {};
    
    deadlineStats.forEach(stat => {
      const week = dayjs(stat.deadlineAt).week();
      const year = dayjs(stat.deadlineAt).year();
      const key = `${year}-W${week}`;
      
      if (!weeklyData[key]) {
        weeklyData[key] = {
          week: key,
          totalSubmissions: 0,
          onTime: 0,
          late: 0,
          deadlineCount: 0
        };
      }
      
      weeklyData[key].totalSubmissions += stat.total;
      weeklyData[key].onTime += stat.onTime;
      weeklyData[key].late += stat.late;
      weeklyData[key].deadlineCount++;
    });

    return Object.values(weeklyData)
      .map(w => ({
        ...w,
        complianceRate: w.totalSubmissions > 0 ? 
          parseFloat(((w.onTime / w.totalSubmissions) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  /**
   * ดึงรายชื่อนักศึกษาที่ส่งช้า/เลยกำหนด
   */
  async _getLateSubmissions(deadlines) {
    try {
      const lateSubmissions = [];
      const now = dayjs().tz('Asia/Bangkok');

      for (const deadline of deadlines) {
        const deadlineDate = dayjs(deadline.deadlineAt).tz('Asia/Bangkok');
        const gracePeriodEnd = deadline.gracePeriodMinutes ? 
          deadlineDate.add(deadline.gracePeriodMinutes, 'minute') : deadlineDate;

        // ข้ามถ้า deadline ยังไม่ถึง
        if (now.isBefore(deadlineDate)) {
          continue;
        }

        // ดึงเอกสารที่ส่งช้าตาม relatedTo
        let lateDocuments = [];

        if (deadline.relatedTo === 'internship') {
          // ดึงจาก InternshipDocument
          lateDocuments = await InternshipDocument.findAll({
            where: {
              academicYear: deadline.academicYear,
              semester: deadline.semester
            },
            include: [
              {
                model: Document,
                as: 'document',
                attributes: ['documentId', 'userId', 'created_at'],
                include: [
                  {
                    model: User,
                    as: 'owner', // Fix: Document has 2 User associations (owner + reviewer)
                    attributes: ['firstName', 'lastName'],
                    include: [
                      {
                        model: Student,
                        as: 'student',
                        attributes: ['studentId', 'studentCode']
                      }
                    ]
                  }
                ]
              }
            ]
          });

          // กรองเฉพาะที่ส่งช้า
          for (const doc of lateDocuments) {
            if (!doc.document || !doc.document.owner || !doc.document.owner.student) {
              continue;
            }

            const submittedAt = dayjs(doc.document.created_at).tz('Asia/Bangkok');
            
            // ตรวจสอบว่าส่งหลัง grace period หรือไม่
            if (submittedAt.isAfter(gracePeriodEnd)) {
              const hoursLate = submittedAt.diff(gracePeriodEnd, 'hour');
              const daysLate = Math.floor(hoursLate / 24);

              let status = 'late';
              if (daysLate > 3) {
                status = 'very_late';
              } else if (daysLate > 7) {
                status = 'overdue';
              }

              lateSubmissions.push({
                studentId: doc.document.owner.student.studentCode,
                firstName: doc.document.owner.firstName,
                lastName: doc.document.owner.lastName,
                deadlineName: deadline.name,
                deadlineAt: deadline.deadlineAt,
                documentType: 'internship',
                documentSubtype: doc.documentType,
                documentId: doc.document.documentId,
                submittedAt: doc.document.created_at,
                hoursLate,
                daysLate,
                status
              });
            }
          }
        } else if (deadline.relatedTo.startsWith('project')) {
          // ดึงจาก ProjectDocument
          const projects = await ProjectDocument.findAll({
            attributes: ['projectId', 'created_at'],
            include: [
              {
                model: require('../models').ProjectMember,
                as: 'members',
                include: [
                  {
                    model: Student,
                    as: 'student',
                    include: [
                      {
                        model: User,
                        as: 'user',
                        attributes: ['firstName', 'lastName']
                      }
                    ]
                  }
                ]
              }
            ]
          });

          // กรองเฉพาะที่ส่งช้า
          for (const project of projects) {
            const submittedAt = dayjs(project.created_at).tz('Asia/Bangkok');
            
            if (submittedAt.isAfter(gracePeriodEnd) && project.members) {
              const hoursLate = submittedAt.diff(gracePeriodEnd, 'hour');
              const daysLate = Math.floor(hoursLate / 24);

              let status = 'late';
              if (daysLate > 3) {
                status = 'very_late';
              } else if (daysLate > 7) {
                status = 'overdue';
              }

              // เพิ่มทุกคนใน project
              for (const member of project.members) {
                if (member.student && member.student.user) {
                  lateSubmissions.push({
                    studentId: member.student.studentCode,
                    firstName: member.student.user.firstName,
                    lastName: member.student.user.lastName,
                    deadlineName: deadline.name,
                    deadlineAt: deadline.deadlineAt,
                    documentType: 'project',
                    documentSubtype: deadline.relatedTo,
                    documentId: project.projectId,
                    submittedAt: project.created_at,
                    hoursLate,
                    daysLate,
                    status
                  });
                }
              }
            }
          }
        }
      }

      return lateSubmissions;
    } catch (error) {
      logger.error('Error getting late submissions:', error);
      return [];
    }
  }

  /**
   * ดึงประวัติการส่งของนักศึกษาคนหนึ่ง
   */
  async getStudentDeadlineHistory(studentId, options = {}) {
    try {
      const { academicYear, semester } = options;
      
      // ดึงข้อมูลนักศึกษา
      const student = await Student.findByPk(studentId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }]
      });

      if (!student) {
        return { error: 'ไม่พบข้อมูลนักศึกษา' };
      }

      // ดึงเอกสารของนักศึกษา
      const documents = await Document.findAll({
        where: { userId: student.userId },
        order: [['created_at', 'DESC']]
      });

      // ดึง deadlines ที่เกี่ยวข้อง
      const where = { isPublished: true };
      if (academicYear) where.academicYear = academicYear.toString();
      if (semester) where.semester = parseInt(semester);

      const deadlines = await ImportantDeadline.findAll({
        where,
        order: [['deadlineAt', 'ASC']]
      });

      // จับคู่เอกสารกับ deadline
      const history = deadlines.map(deadline => {
        const relatedDocs = documents.filter(doc => {
          // Logic ง่าย ๆ ในการจับคู่ (ควรปรับตาม business logic จริง)
          return doc.documentType && doc.documentType.includes(deadline.relatedTo);
        });

        const submitted = relatedDocs.length > 0;
        const submittedAt = submitted ? relatedDocs[0].created_at : null;
        const deadlineDate = dayjs(deadline.deadlineAt).tz('Asia/Bangkok');
        const isOnTime = submitted && dayjs(submittedAt).isBefore(deadlineDate);

        return {
          deadlineId: deadline.id,
          deadlineName: deadline.name,
          deadlineAt: deadline.deadlineAt,
          relatedTo: deadline.relatedTo,
          submitted,
          submittedAt,
          isOnTime,
          daysLate: submitted && !isOnTime ? 
            dayjs(submittedAt).diff(deadlineDate, 'day') : null
        };
      });

      // คำนวณคะแนนการปฏิบัติตาม (0-100)
      const submittedCount = history.filter(h => h.submitted).length;
      const onTimeCount = history.filter(h => h.isOnTime).length;
      const complianceScore = history.length > 0 ? 
        ((onTimeCount / history.length) * 100).toFixed(1) : 0;

      return {
        student: {
          studentId: student.studentId,
          studentCode: student.studentCode,
          name: `${student.user.firstName} ${student.user.lastName}`
        },
        complianceScore,
        totalDeadlines: history.length,
        submitted: submittedCount,
        onTime: onTimeCount,
        late: submittedCount - onTimeCount,
        notSubmitted: history.length - submittedCount,
        history
      };
    } catch (error) {
      logger.error('Error in getStudentDeadlineHistory:', error);
      throw error;
    }
  }
}

module.exports = new DeadlineReportService();
