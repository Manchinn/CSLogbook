const projectMembersService = require('../services/projectMembersService');
const logger = require('../utils/logger');

exports.getProjectMembers = async (req, res) => {
  try {
    const toArray = (value) => {
      if (!value) return undefined;
      if (Array.isArray(value)) {
        return value.filter(Boolean);
      }
      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return undefined;
    };

    const projectStatus = toArray(req.query.projectStatus);
    const documentStatus = toArray(req.query.documentStatus);
    const trackCodes = toArray(req.query.trackCodes || req.query.trackCode || req.query.track);
    const projectType = toArray(req.query.projectType);
    // เพิ่มการรับ parameters ปีการศึกษาและภาคการศึกษา
    const academicYear = toArray(req.query.academicYear);
    const semester = toArray(req.query.semester);

    const formattedProjects = await projectMembersService.getAllApprovedProjectMembers({
      projectStatus,
      documentStatus,
      trackCodes,
      projectType,
      academicYear,
      semester
    });

    res.json({
      success: true,
      total: formattedProjects.length,
      data: formattedProjects
    });
  } catch (error) {
    logger.error('Error fetching project members:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิกโครงงาน'
    });
  }
};

exports.updateProjectMembers = async (req, res) => {
  try {
    const result = await projectMembersService.updateProjectMembersInternshipStatus();
    
    res.status(200).json({ 
      success: true,
      message: result.message || 'อัปเดตข้อมูลสมาชิกโครงงานสำเร็จ',
      updatedCount: result.updatedCount
    });
  } catch (error) {
    logger.error('Error updating project members:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลสมาชิกโครงงาน' 
    });
  }
};