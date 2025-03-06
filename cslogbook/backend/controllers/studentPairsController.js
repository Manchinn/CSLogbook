const pool = require('../config/database');

exports.getStudentPairs = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        pp.project_name_th as project_name,
        pp.student_id1, pp.first_name1, pp.last_name1,
        pp.student_id2, pp.first_name2, pp.last_name2, 
        DATE_FORMAT(CONVERT_TZ(pp.upload_date, '+00:00', '+07:00'), '%Y-%m-%d %H:%i') as created_at,
        CASE 
          WHEN i1.status IS NOT NULL THEN i1.status
          ELSE 'pending'
        END as student1_internship_status,
        CASE
          WHEN i2.status IS NOT NULL THEN i2.status  
          ELSE 'pending'
        END as student2_internship_status
      FROM project_proposals pp
      LEFT JOIN internship_documents i1 ON pp.student_id1 = i1.student_id
      LEFT JOIN internship_documents i2 ON pp.student_id2 = i2.student_id
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

    // Clear existing data
    await connection.execute('TRUNCATE TABLE project_pairs');

    // Insert updated data with internship statuses
    await connection.execute(`
      INSERT INTO project_pairs (
        project_name,
        student_id1, 
        first_name1,
        last_name1,
        student_id2,
        first_name2, 
        last_name2,
        student1_internship_status,
        student2_internship_status,
        created_at
      )
      SELECT 
        pp.project_name_th,
        pp.student_id1,
        pp.first_name1,
        pp.last_name1,
        pp.student_id2, 
        pp.first_name2,
        pp.last_name2,
        COALESCE(i1.status, 'pending'),
        COALESCE(i2.status, 'pending'),
        NOW()
      FROM project_proposals pp
      LEFT JOIN internship_documents i1 ON pp.student_id1 = i1.student_id 
      LEFT JOIN internship_documents i2 ON pp.student_id2 = i2.student_id
      WHERE pp.project_name_th IS NOT NULL
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