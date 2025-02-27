const pool = require('../config/database');

exports.submitProjectProposal = async (req, res) => {
  const {
    projectNameTH,
    projectNameEN,
    studentId1,
    firstName1,
    lastName1,
    studentType1,
    studentId2,
    firstName2,
    lastName2,
    studentType2,
    track,
    projectCategory
  } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO project_proposals 
      (project_name_th, project_name_en, student_id1, first_name1, last_name1, student_type1, student_id2, first_name2, last_name2, student_type2, track, project_category) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectNameTH, projectNameEN, studentId1, firstName1, lastName1, studentType1, studentId2, firstName2, lastName2, studentType2, track, projectCategory]
    );

    res.json({ success: true, message: 'คำขอเสนอหัวข้อโครงงานของคุณถูกส่งเรียบร้อยแล้ว!' });
  } catch (error) {
    console.error('Error submitting project proposal:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งข้อมูล' });
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
