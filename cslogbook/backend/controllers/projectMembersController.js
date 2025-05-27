const projectMembersService = require('../services/projectMembersService');
const logger = require('../utils/logger');

exports.getProjectMembers = async (req, res) => {
  try {
    const formattedProjects = await projectMembersService.getAllApprovedProjectMembers();
    res.json(formattedProjects);
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