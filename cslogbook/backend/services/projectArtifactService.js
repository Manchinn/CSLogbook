const path = require('path');
const fs = require('fs');
const { sequelize } = require('../config/database');
const { ProjectDocument, ProjectArtifact, ProjectMember } = require('../models');
const logger = require('../utils/logger');

class ProjectArtifactService {
  // อัปโหลด proposal (ไฟล์ PDF) เก็บเป็น artifact type=proposal สร้าง version ใหม่
  async uploadProposal(projectId, actorStudentId, file) {
    if (!file) throw new Error('ไม่พบไฟล์อัปโหลด');
    if (file.mimetype !== 'application/pdf') {
      throw new Error('รองรับเฉพาะไฟล์ PDF สำหรับ Proposal');
    }

    const t = await sequelize.transaction();
    try {
      const project = await ProjectDocument.findByPk(projectId, { transaction: t });
      if (!project) throw new Error('ไม่พบโครงงาน');

      const member = await ProjectMember.findOne({ where: { projectId, studentId: actorStudentId }, transaction: t });
      if (!member) throw new Error('ไม่มีสิทธิ์อัปโหลดไฟล์สำหรับโครงงานนี้');

      // หา version ล่าสุด
      const latest = await ProjectArtifact.findOne({
        where: { projectId, type: 'proposal' },
        order: [['version','DESC']],
        transaction: t
      });
      const nextVersion = (latest?.version || 0) + 1;

      // จัด path เก็บไฟล์ (ไฟล์จริงถูก multer วางใน uploads/ แล้ว) -> บันทึก path relative
      const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g,'/');

      const artifact = await ProjectArtifact.create({
        projectId,
        type: 'proposal',
        filePath: relativePath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        version: nextVersion,
        uploadedByStudentId: actorStudentId
      }, { transaction: t });

      await t.commit();
      logger.info('uploadProposal success', { projectId, version: artifact.version });
      return this.serialize(artifact);
    } catch (err) {
      await t.rollback();
      logger.error('uploadProposal failed', { error: err.message });
      // ลบไฟล์ physical ถ้ามีความผิดพลาด (best effort)
      try { if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch(_){}
      throw err;
    }
  }

  async listArtifacts(projectId, actorStudentId, type) {
    const member = await ProjectMember.findOne({ where: { projectId, studentId: actorStudentId } });
    if (!member) throw new Error('ไม่มีสิทธิ์เข้าถึงไฟล์โครงงานนี้');
    const where = { projectId };
    if (type) where.type = type;
    const artifacts = await ProjectArtifact.findAll({ where, order: [['uploaded_at','DESC']] });
    return artifacts.map(a => this.serialize(a));
  }

  serialize(a) {
    return {
      artifactId: a.artifactId,
      projectId: a.projectId,
      type: a.type,
      filePath: a.filePath,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      version: a.version,
      uploadedByStudentId: a.uploadedByStudentId,
      uploadedAt: a.uploadedAt
    };
  }
}

module.exports = new ProjectArtifactService();
