const pool = require('../config/database');

exports.getStudentPairs = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        project_name, 
        student_id1, 
        first_name1, 
        last_name1, 
        student_id2, 
        first_name2, 
        last_name2,
        created_at
      FROM project_pairs 
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching project pairs:', error);
    res.status(500).json({ error: 'Error fetching project pairs' });
  }
};

exports.updateProjectPairs = async (req, res) => {
  try {
    // ดึงข้อมูลจาก project_proposals
    const [proposals] = await pool.execute(`
      SELECT 
        project_name_th, 
        student_id1, 
        first_name1,
        last_name1,
        student_id2,
        first_name2,
        last_name2
      FROM project_proposals
    `);

    // ลบข้อมูลเก่าใน project_pairs
    await pool.execute(`DELETE FROM project_pairs`);

    // เพิ่มข้อมูลใหม่ใน project_pairs
    for (const proposal of proposals) {
      await pool.execute(`
        INSERT INTO project_pairs (project_name, student_id1, first_name1, last_name1, student_id2, first_name2, last_name2, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [proposal.project_name_th, proposal.student_id1, proposal.first_name1, proposal.last_name1, proposal.student_id2, proposal.first_name2, proposal.last_name2]);
    }

    res.status(200).json({ message: 'Project pairs updated successfully' });
  } catch (error) {
    console.error('Error updating project pairs:', error);
    res.status(500).json({ error: 'Error updating project pairs' });
  }
};