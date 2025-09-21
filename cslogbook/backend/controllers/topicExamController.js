// topicExamController.js
// Controller สำหรับ topic exam overview
const topicExamService = require('../services/topicExamService');

exports.getOverview = async (req, res, next) => {
  try {
    const data = await topicExamService.getTopicOverview(req.query);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};
