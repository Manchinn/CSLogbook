const pool = require('../config/database');
const { baseUrl, apiPrefix } = require('../config/server');

exports.submitProjectProposal = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // สร้างเอกสารหลัก
    const [docResult] = await connection.execute(`
      INSERT INTO documents (
        user_id, 
        document_type,
        document_name,
        status
      ) VALUES (?, 'project', ?, 'pending')`,
      [req.user.userId, req.body.projectNameTH]
    );

    // สร้างข้อมูลโครงงาน
    await connection.execute(`
      INSERT INTO project_documents (
        document_id,
        project_name_th,
        project_name_en,
        project_type,
        track,
        advisor_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        docResult.insertId,
        req.body.projectNameTH,
        req.body.projectNameEN,
        req.body.projectType,
        req.body.track,
        req.body.advisorId
      ]
    );

    await connection.commit();
    res.status(201).json({ message: 'บันทึกข้อมูลสำเร็จ' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  } finally {
    connection.release();
  }
};

exports.getProposals = async (req, res) => {
  try {
    const [proposals] = await pool.execute('SELECT * FROM project_proposals');
    res.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Error fetching proposals' });
  }
};

exports.approveProposal = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('UPDATE documents SET status = ? WHERE document_name = (SELECT project_name_th FROM project_proposals WHERE id = ?)', ['approved', id]);
    res.json({ message: 'Proposal approved successfully' });
  } catch (error) {
    console.error('Error approving proposal:', error);
    res.status(500).json({ error: 'Error approving proposal' });
  }
};

exports.rejectProposal = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('UPDATE documents SET status = ? WHERE document_name = (SELECT project_name_th FROM project_proposals WHERE id = ?)', ['rejected', id]);
    res.json({ message: 'Proposal rejected successfully' });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    res.status(500).json({ error: 'Error rejecting proposal' });
  }
};
