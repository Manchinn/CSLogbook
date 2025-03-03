const pool = require('../config/database');

exports.getDocuments = async (req, res) => {
  const { type } = req.query;
  const { role, studentID } = req.user;

  try {
    let query = '';
    let params = [];

    // กรณีเป็น admin
    if (role === 'admin') {
      if (type === 'internship') {
        query = `
          SELECT 
            d.*,
            i.*,
            u.firstName,
            u.lastName
          FROM documents d
          JOIN internship_documents i ON d.document_name = i.company_name
          JOIN users u ON d.student_name LIKE CONCAT('%', u.firstName, '%')
          WHERE d.type = 'internship'
          ORDER BY d.upload_date DESC`;
      } else if (type === 'project') {
        query = `
          SELECT 
            d.*,
            p.project_name_th,
            p.project_name_en,
            p.student_id1,
            p.student_id2,
            u1.firstName as firstName1,
            u1.lastName as lastName1,
            u2.firstName as firstName2,
            u2.lastName as lastName2
          FROM documents d
          JOIN project_proposals p ON d.document_name = p.project_name_th
          LEFT JOIN users u1 ON p.student_id1 = u1.studentID
          LEFT JOIN users u2 ON p.student_id2 = u2.studentID
          WHERE d.type = 'project'
          ORDER BY d.upload_date DESC`;
      } else {
        query = `
          SELECT 
            d.*,
            p.student_id1,
            u.firstName,
            u.lastName
          FROM documents d
          LEFT JOIN project_proposals p ON d.document_name = p.project_name_th
          LEFT JOIN users u ON d.student_name LIKE CONCAT('%', u.firstName, '%')
          ORDER BY d.upload_date DESC`;
      }
      params = [];
    } 
    // กรณีเป็น student
    else {
      if (type === 'internship') {
        query = `
          SELECT 
            d.*,
            i.*,
            u.firstName,
            u.lastName
          FROM documents d
          JOIN internship_documents i ON d.document_name = i.company_name
          JOIN users u ON d.student_name LIKE CONCAT('%', u.firstName, '%')
          WHERE d.type = 'internship'
          AND u.studentID = ?
          ORDER BY d.upload_date DESC`;
        params = [studentID];
      } else if (type === 'project') {
        query = `
          SELECT 
            d.*,
            p.project_name_th,
            p.project_name_en,
            p.student_id1,
            p.student_id2,
            u1.firstName as firstName1,
            u1.lastName as lastName1,
            u2.firstName as firstName2,
            u2.lastName as lastName2
          FROM documents d
          JOIN project_proposals p ON d.document_name = p.project_name_th
          LEFT JOIN users u1 ON p.student_id1 = u1.studentID
          LEFT JOIN users u2 ON p.student_id2 = u2.studentID
          WHERE d.type = 'project'
          AND (p.student_id1 = ? OR p.student_id2 = ?)
          ORDER BY d.upload_date DESC`;
        params = [studentID, studentID];
      } else {
        query = `
          SELECT 
            d.*,
            COALESCE(p.student_id1, u.studentID) as student_id,
            u.firstName,
            u.lastName
          FROM documents d
          LEFT JOIN project_proposals p ON d.document_name = p.project_name_th
          LEFT JOIN users u ON d.student_name LIKE CONCAT('%', u.firstName, '%')
          WHERE u.studentID = ?
          OR p.student_id1 = ?
          OR p.student_id2 = ?
          ORDER BY d.upload_date DESC`;
        params = [studentID, studentID, studentID];
      }
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
};

exports.getDocumentById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [parseInt(id, 10)]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Error fetching document' });
  }
};

exports.approveDocument = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('UPDATE documents SET status = ? WHERE id = ?', ['approved', parseInt(id, 10)]);
    res.status(200).json({ message: 'Document approved successfully' });
  } catch (error) {
    console.error('Error approving document:', error);
    res.status(500).json({ error: 'Error approving document' });
  }
};

exports.rejectDocument = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('UPDATE documents SET status = ? WHERE id = ?', ['rejected', id]);
    res.status(200).json({ message: 'Document rejected successfully' });
  } catch (error) {
    console.error('Error rejecting document:', error);
    res.status(500).json({ error: 'Error rejecting document' });
  }
};