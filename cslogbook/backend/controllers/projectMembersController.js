const { ProjectDocument, ProjectMember, User, Student } = require('../models');

exports.getProjectMembers = async (req, res) => {
  try {
    const projects = await ProjectDocument.findAll({
      include: [{
        model: ProjectMember,
        include: [{
          model: User,
          attributes: ['firstName', 'lastName'],
          include: [{
            model: Student,
            attributes: ['studentCode', 'isEligibleInternship']
          }]
        }]
      }],
      where: {
        '$Document.status$': 'approved'
      }
    });

    const formattedProjects = projects.map(project => ({
      projectName: project.projectNameTh,
      student1: {
        userId: project.ProjectMembers[0]?.User.id,
        studentCode: project.ProjectMembers[0]?.User.Student.studentCode,
        firstName: project.ProjectMembers[0]?.User.firstName,
        lastName: project.ProjectMembers[0]?.User.lastName,
        isEligibleInternship: project.ProjectMembers[0]?.User.Student.isEligibleInternship
      },
      student2: project.ProjectMembers[1] ? {
        userId: project.ProjectMembers[1].User.id,
        studentCode: project.ProjectMembers[1].User.Student.studentCode,
        firstName: project.ProjectMembers[1].User.firstName,
        lastName: project.ProjectMembers[1].User.lastName,
        isEligibleInternship: project.ProjectMembers[1].User.Student.isEligibleInternship
      } : null,
      createdAt: project.createdAt
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching project members' });
  }
};

exports.updateProjectMembers = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // อัพเดทสถานะการฝึกงานในตาราง students
    const [projectMembers] = await connection.execute(`
      SELECT 
        pm.user_id,
        s.is_eligible_internship
      FROM project_members pm
      JOIN students s ON pm.user_id = s.user_id
      WHERE pm.document_id IN (
        SELECT document_id 
        FROM project_documents 
        WHERE status = 'approved'
      )
    `);

    // อัพเดทแต่ละสมาชิก
    for (const member of projectMembers) {
      await connection.execute(`
        UPDATE students
        SET is_eligible_internship = ?,
            updated_at = NOW()
        WHERE user_id = ?`,
        [member.is_eligible_internship, member.user_id]
      );
    }

    await connection.commit();
    res.status(200).json({ 
      success: true,
      message: 'Project pairs updated successfully' 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating project pairs:', error);
    res.status(500).json({ error: 'Error updating project pairs' }); 
  } finally {
    connection.release();
  }
};