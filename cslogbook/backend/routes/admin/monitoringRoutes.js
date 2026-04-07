const express = require('express');
const router = express.Router();
const monitoringService = require('../../services/monitoringService');
const logger = require('../../utils/logger');

router.get('/health', async (req, res) => {
  try {
    const stats = await monitoringService.getHealthStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('MonitoringRoute health error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const { file = 'app.log', lines = 100 } = req.query;
    const logs = await monitoringService.getRecentLogs(file, Math.min(Number(lines), 500));
    res.json({ success: true, data: logs });
  } catch (error) {
    logger.error('MonitoringRoute logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/system-logs', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const result = await monitoringService.getSystemActions(Math.min(Number(limit), 100), Number(offset));
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('MonitoringRoute system-logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
