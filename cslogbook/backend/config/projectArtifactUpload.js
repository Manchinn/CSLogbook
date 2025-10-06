// Upload config เฉพาะสำหรับไฟล์โครงงาน (artifacts)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ProjectDocument } = require('../models');

const BASE_PATH = path.join(__dirname, '..', 'uploads', 'projects');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const projectId = req.params.id;
      const project = await ProjectDocument.findByPk(projectId);
      if (!project) return cb(new Error('ไม่พบโครงงาน'));
      const type = 'proposal'; // Phase 1 รองรับเฉพาะ proposal
      const projectCode = project.projectCode || `PID${project.projectId}`;
      const dest = path.join(BASE_PATH, projectCode, type);
      ensureDir(dest);
      cb(null, dest);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `proposal-${ts}${ext}`);
  }
});

const uploadProposal = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('รองรับเฉพาะไฟล์ PDF'));
    }
    cb(null, true);
  }
});

module.exports = { uploadProposal };
