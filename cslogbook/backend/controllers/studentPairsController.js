const pool = require('../config/database');

exports.getStudentPairs = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        pp.project_name_th as project_name, 
        pp.student_id1, pp.first_name1, pp.last_name1,
        pp.student_id2, pp.first_name2, pp.last_name2,
        DATE_FORMAT(CONVERT_TZ(pp.upload_date, '+00:00', '+07:00'), '%Y-%m-%d %H:%i') as created_at
      FROM project_proposals pp
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching project pairs:', error);
    res.status(500).json({ error: 'Error fetching project pairs' });
  }
};

exports.updateProjectPairs = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // ลบข้อมูลเก่าทั้งหมด
    await connection.execute('TRUNCATE TABLE project_pairs');

    // เพิ่มข้อมูลใหม่จาก project_proposals
    await connection.execute(`
      INSERT INTO project_pairs (
        project_name,
        student_id1,
        first_name1,
        last_name1,
        student_id2,
        first_name2,
        last_name2,
        created_at
      )
      SELECT 
        project_name_th,
        student_id1,
        first_name1,
        last_name1,
        student_id2,
        first_name2,
        last_name2,
        NOW()
      FROM project_proposals
      WHERE project_name_th IS NOT NULL
    `);

    await connection.commit();
    res.status(200).json({ message: 'Project pairs updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating project pairs:', error);
    res.status(500).json({ error: 'Error updating project pairs' });
  } finally {
    connection.release();
  }
};