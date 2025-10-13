const fs = require('fs');
const { UploadHistory, User } = require('../models');
const { processStudentCsvUpload } = require('../services/studentUploadService');

const uploadCSV = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์: อนุญาต admin หรือ teacher ที่เป็น support ตาม middleware ที่กำหนดใน routes
    if (!req.user || !(['admin', 'teacher'].includes(req.user.role))) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์อัพโหลดรายชื่อนักศึกษา' });
    }
    if (req.user.role === 'teacher' && req.user.teacherType !== 'support') {
      return res.status(403).json({ error: 'อนุญาตเฉพาะอาจารย์ประเภท support เท่านั้น' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { results, summary } = await processStudentCsvUpload({
      filePath: req.file.path,
      originalName: req.file.originalname,
      uploader: req.user
    });

    res.json({ success: true, results, summary });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Error uploading CSV file',
      details: error.message
    });
  } finally {
    try {
      if (req.file && req.file.path) {
        await fs.promises.unlink(req.file.path);
      }
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
      // ไม่ throw error เพราะเป็นเพียงการ cleanup
    }
  }
};

// ดึงประวัติการอัพโหลดโดยใช้ Sequelize
const getUploadHistory = async (req, res) => {
  try {
    const history = await UploadHistory.findAll({
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['username', 'firstName', 'lastName']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadCSV,
  getUploadHistory
};