const meetingService = require('../services/meetingService');
const logger = require('../utils/logger');

module.exports = {
  async list(req, res) {
    try {
      const { id } = req.params;
      const result = await meetingService.listProjectMeetings(id, req.user);
      return res.json({ success: true, data: result.meetings, stats: result.stats });
    } catch (error) {
      logger.error('meetingController.list error', { message: error.message, stack: error.stack });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const { id } = req.params;
      const meeting = await meetingService.createMeeting(id, req.user, req.body || {});
      return res.status(201).json({ success: true, data: meeting });
    } catch (error) {
      logger.error('meetingController.create error', { message: error.message, stack: error.stack });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  },

  async createLog(req, res) {
    try {
      const { id, meetingId } = req.params;
      const log = await meetingService.createMeetingLog(id, meetingId, req.user, req.body || {});
      return res.status(201).json({ success: true, data: log });
    } catch (error) {
      logger.error('meetingController.createLog error', { message: error.message, stack: error.stack });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  },

  async updateApproval(req, res) {
    try {
      const { id, meetingId, logId } = req.params;
      const updated = await meetingService.updateLogApproval(id, meetingId, logId, req.user, req.body || {});
      return res.json({ success: true, data: updated });
    } catch (error) {
      logger.error('meetingController.updateApproval error', { message: error.message, stack: error.stack });
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  }
};
