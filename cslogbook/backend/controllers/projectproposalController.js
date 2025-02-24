const pool = require('../config/database');

exports.submitProposal = async (req, res) => {
  const { projectNameTH, projectNameEN, studentId1, studentName1, studentType1, studentId2, studentName2, studentType2, track, projectCategory } = req.body;
  try {
    await pool.execute(
      'INSERT INTO project_proposals (project_name_th, project_name_en, student_id1, student_name1, student_type1, student_id2, student_name2, student_type2, track, project_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [projectNameTH, projectNameEN, studentId1, studentName1, studentType1, studentId2, studentName2, studentType2, track, projectCategory]
    );

    await pool.execute(
      'INSERT INTO documents (document_name, student_name, upload_date, status, type) VALUES (?, ?, NOW(), ?, ?)',
      [projectNameTH, studentName1, 'Pending', 'project']
    );

    res.status(201).json({ message: 'Proposal submitted successfully' });
  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({ error: 'Error submitting proposal' });
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
    await pool.execute('UPDATE project_proposals SET status = ? WHERE id = ?', ['rejected', id]);
    await pool.execute('UPDATE documents SET status = ? WHERE document_name = (SELECT project_name_th FROM project_proposals WHERE id = ?)', ['rejected', id]);
    res.json({ message: 'Proposal rejected successfully' });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    res.status(500).json({ error: 'Error rejecting proposal' });
  }
};
