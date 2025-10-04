const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ProjectDocument } = require('../models');

const BASE_PATH = path.join(__dirname, '..', 'uploads', 'projects');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function resolveSubFolder(fieldname) {
  if (fieldname === 'evidenceFile') return 'system-test/evidence';
  return 'system-test/request';
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const projectId = req.params.id;
      const project = await ProjectDocument.findByPk(projectId);
      if (!project) {
        return cb(new Error('ไม่พบโครงงาน'));
      }
      const projectCode = project.projectCode || `PID${project.projectId}`;
      const subFolder = resolveSubFolder(file.fieldname);
      const dest = path.join(BASE_PATH, projectCode, subFolder);
      ensureDir(dest);
      cb(null, dest);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname) || '.pdf';
    const prefix = file.fieldname === 'evidenceFile' ? 'evidence' : 'request';
    cb(null, `${prefix}-${ts}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('รองรับเฉพาะไฟล์ PDF'));
  }
  cb(null, true);
};

const uploadSystemTestRequest = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

const uploadSystemTestEvidence = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

module.exports = {
  uploadSystemTestRequest,
  uploadSystemTestEvidence
};
