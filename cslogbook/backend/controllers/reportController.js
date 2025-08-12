// controllers/reportController.js
// Controller บาง เรียก service แล้วคืน JSON
const reportService = require('../services/reportService');

exports.getOverview = async (req, res, next) => {
  try {
    const data = await reportService.getOverview({ year: req.query.year });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getInternshipLogbookCompliance = async (req, res, next) => {
  try {
    const data = await reportService.getInternshipLogbookCompliance({ year: req.query.year });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getProjectStatusSummary = async (req, res, next) => {
  try {
    const data = await reportService.getProjectStatusSummary({ year: req.query.year });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getAdvisorLoad = async (req, res, next) => {
  try {
    const data = await reportService.getAdvisorLoad({ year: req.query.year });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
