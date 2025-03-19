const pool = require('../config/database');

exports.getProjectMembers = async (req, res) => {
  try {
    // แก้ไข query ให้ดึงข้อมูลที่จำเป็นและถูกต้อง
    const [rows] = await pool.execute(`
      SELECT 
        pd.project_name_th as project_name,
        u1.user_id as user_id1,
        s1.student_code as student_code1,
        u1.first_name as first_name1,
        u1.last_name as last_name1,
        s1.is_eligible_internship as student1_internship_status,
        u2.user_id as user_id2,
        s2.student_code as student_code2,
        u2.first_name as first_name2,
        u2.last_name as last_name2,
        s2.is_eligible_internship as student2_internship_status,
        DATE_FORMAT(
          CONVERT_TZ(pd.created_at, '+00:00', '+07:00'),
          '%Y-%m-%d %H:%i'
        ) as created_at
      FROM documents d
      JOIN project_documents pd ON d.id = pd.document_id
      JOIN project_members pm1 ON pd.document_id = pm1.document_id AND pm1.member_order = 1
      JOIN users u1 ON pm1.user_id = u1.user_id
      JOIN students s1 ON u1.user_id = s1.user_id
      LEFT JOIN project_members pm2 ON pd.document_id = pm2.document_id AND pm2.member_order = 2
      LEFT JOIN users u2 ON pm2.user_id = u2.user_id
      LEFT JOIN students s2 ON u2.user_id = s2.user_id
      WHERE d.status = 'approved'
      ORDER BY pd.created_at DESC
    `);

    // ตรวจสอบข้อมูลที่ได้
    console.log('Query results:', rows);

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ frontend ต้องการ
    const formattedRows = rows.map(row => ({
      project_name: row.project_name,
      student1: {
        userId: row.user_id1,
        studentCode: row.student_code1,
        firstName: row.first_name1,
        lastName: row.last_name1,
        isEligibleInternship: Boolean(row.student1_internship_status)
      },
      student2: row.user_id2 ? {
        userId: row.user_id2,
        studentCode: row.student_code2,
        firstName: row.first_name2,
        lastName: row.last_name2,
        isEligibleInternship: Boolean(row.student2_internship_status)
      } : null,
      created_at: row.created_at
    }));

    // ส่งข้อมูลกลับ
    res.json(formattedRows);

  } catch (error) {
    console.error('Error in getProjectMembers:', error);
    res.status(500).json({ 
      error: 'Error fetching project pairs',
      details: error.message 
    });
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