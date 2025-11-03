const { User, Student, Document } = require('../models');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const logger = require('../utils/logger');

/**
 * AdminService - บริการสำหรับจัดการข้อมูลและสถิติของระบบ
 * แยก business logic ออกจาก controller เพื่อความง่ายในการดูแลรักษาและทดสอบ
 */
class AdminService {
  // ---------- สถิตินักศึกษา ----------
  async getStudentStats() {
    try {
      logger.info('AdminService: Fetching student statistics...');
      const stats = await Student.findOne({
        include: [{
          model: User,
          as: 'user',
          where: { role: 'student', activeStatus: true },
          attributes: []
        }],
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('Student.student_id')), 'total'],
          [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN Student.is_eligible_internship = 1 THEN 1 ELSE 0 END')), 'internshipEligible'],
          [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN Student.is_eligible_project = 1 THEN 1 ELSE 0 END')), 'projectEligible']
        ],
        raw: true
      });
      const result = {
        total: parseInt(stats?.total) || 0,
        internshipEligible: parseInt(stats?.internshipEligible) || 0,
        projectEligible: parseInt(stats?.projectEligible) || 0
      };
      if (result.total > 0) {
        result.internshipEligiblePercentage = Math.round((result.internshipEligible / result.total) * 100);
        result.projectEligiblePercentage = Math.round((result.projectEligible / result.total) * 100);
      } else {
        result.internshipEligiblePercentage = 0;
        result.projectEligiblePercentage = 0;
      }
      logger.info('AdminService: Student stats retrieved successfully', result);
      return result;
    } catch (error) {
      logger.error('AdminService: Error fetching student stats', error);
      throw new Error('ไม่สามารถดึงข้อมูลสถิตินักศึกษาได้: ' + error.message);
    }
  }

  // ---------- สถิติเอกสาร ----------
  async getDocumentStats() {
    try {
      logger.info('AdminService: Fetching document statistics...');
      const docs = await Document.findAndCountAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('*')), 'total'],
          [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")), 'pending'],
          [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'approved' THEN 1 END")), 'approved'],
          [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'rejected' THEN 1 END")), 'rejected']
        ],
        raw: true
      });
      const result = {
        total: parseInt(docs.rows[0]?.total) || 0,
        pending: parseInt(docs.rows[0]?.pending) || 0,
        approved: parseInt(docs.rows[0]?.approved) || 0,
        rejected: parseInt(docs.rows[0]?.rejected) || 0
      };
      logger.info('AdminService: Document stats retrieved successfully', result);
      return result;
    } catch (error) {
      logger.error('AdminService: Error fetching document stats', error);
      throw new Error('ไม่สามารถดึงข้อมูลสถิติเอกสารได้: ' + error.message);
    }
  }

  // ---------- สถิติระบบทั่วไป ----------
  async getSystemStats() {
    try {
      logger.info('AdminService: Fetching system statistics...');
      const onlineUsers = await User.count({ where: { lastLogin: { [Op.gte]: moment().subtract(15, 'minutes') } } });
      const todayUsers = await User.count({ where: { lastLogin: { [Op.gte]: moment().startOf('day') } } });
      const totalUsers = await User.count({ where: { activeStatus: true } });
      const result = { onlineUsers, todayUsers, totalUsers, lastUpdate: moment().format() };
      logger.info('AdminService: System stats retrieved successfully', result);
      return result;
    } catch (error) {
      logger.error('AdminService: Error fetching system stats', error);
      throw new Error('ไม่สามารถดึงข้อมูลสถิติระบบได้: ' + error.message);
    }
  }

  // ---------- รวมสถิติทั้งหมด ----------
  async getAllStats() {
    try {
      logger.info('AdminService: Fetching all statistics...');
      const [studentStats, documentStats, systemStats] = await Promise.all([
        this.getStudentStats(),
        this.getDocumentStats(),
        this.getSystemStats()
      ]);
      return { students: studentStats, documents: documentStats, system: systemStats, generatedAt: moment().format() };
    } catch (error) {
      logger.error('AdminService: Error fetching all stats', error);
      throw new Error('ไม่สามารถดึงข้อมูลสถิติทั้งหมดได้: ' + error.message);
    }
  }

  // ---------- Recent Activities (Enhanced for Activity Logs Report) ----------
  async getRecentActivities(arg = 10) {
    try {
      let options = {};
      if (typeof arg === 'number') options.limit = arg; else if (arg && typeof arg === 'object') options = arg;
      const limit = Math.max(1, parseInt(options.limit) || 10);
      const cursor = options.cursor; // ISO datetime สำหรับ keyset pagination
      const format = options.format === 'object' ? 'object' : 'array';
      logger.info(`AdminService: Fetching recent document submissions (limit=${limit}, cursor=${cursor || '-'})`);

      const models = require('../models');
      const { Document } = models;
      const DocumentLog = models.DocumentLog || models.document_logs || models.Document_Log;

      let items = [];
      const build = (o) => ({
        id: o.id,
        source: 'document',
        type: 'document_submitted',
        title: o.title,
        description: '',
        timestamp: o.timestamp,
        user: 'ระบบ',
        meta: { documentId: o.documentId }
      });

      if (DocumentLog) {
        const where = { action_type: 'create' };
        if (cursor) {
          const cursorDate = new Date(cursor);
          if (!isNaN(cursorDate.getTime())) where.created_at = { [Op.lt]: cursorDate };
        }
        const logs = await DocumentLog.findAll({
          where,
          order: [['created_at', 'DESC']],
          limit: limit + 1,
          attributes: ['log_id', 'document_id', 'created_at']
        });
        const docIds = [...new Set(logs.map(l => l.document_id))];
        const nameMap = {};
        if (Document && docIds.length) {
          const docs = await Document.findAll({ where: { document_id: { [Op.in]: docIds } }, attributes: ['document_id', 'document_name'] });
          docs.forEach(d => { nameMap[d.document_id] = d.document_name; });
        }
        items = logs.map(l => build({ id: `documentLog:${l.log_id}`, documentId: l.document_id, title: nameMap[l.document_id] || `เอกสาร #${l.document_id}`, timestamp: l.created_at }));
      } else if (Document) {
        const where = { status: { [Op.ne]: 'draft' } };
        if (cursor) {
          const cursorDate = new Date(cursor);
          if (!isNaN(cursorDate.getTime())) where.created_at = { [Op.lt]: cursorDate };
        }
        const docs = await Document.findAll({ where, order: [['created_at', 'DESC']], limit: limit + 1, attributes: ['document_id', 'document_name', 'created_at'] });
        items = docs.map(d => build({ id: `document:${d.document_id}`, documentId: d.document_id, title: d.document_name || 'เอกสาร', timestamp: d.created_at }));
      }

      const hasMore = items.length > limit;
      const sliced = hasMore ? items.slice(0, limit) : items;
      const nextCursor = hasMore ? sliced[sliced.length - 1].timestamp : null;

      if (sliced.length === 0) {
        const fallback = [{ id: 'fallback:docs', source: 'document', type: 'info', title: 'ยังไม่มีเอกสาร', description: 'ยังไม่มีการส่งเอกสาร', timestamp: moment().format(), user: 'ระบบ', meta: {} }];
        return format === 'object' ? { items: fallback, pagination: { hasMore: false, nextCursor: null } } : fallback;
      }

      logger.info(`AdminService: Deliver ${sliced.length} document submissions (hasMore=${hasMore})`);
      return format === 'object' ? { items: sliced, pagination: { hasMore, nextCursor } } : sliced;
    } catch (error) {
      logger.error('AdminService: Error fetching document submissions', error);
      throw new Error('ไม่สามารถดึงข้อมูลเอกสารล่าสุดได้: ' + error.message);
    }
  }
}

module.exports = new AdminService();
