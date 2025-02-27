const pool = require('../config/database');

exports.getDocuments = async (req, res) => {
  const { type } = req.query;

  try {
    let query = '';
    let params = [];

    if (type === 'internship') {
      query = `
        SELECT d.*, i.company_name, i.contact_name, i.contact_phone, i.contact_email, i.uploaded_files
        FROM documents d
        JOIN internship_documents i ON d.document_name = i.company_name
        WHERE d.type = 'internship';
      `;
    } else if (type === 'project') {
      query = `
        SELECT d.*, p.project_name_th, p.project_name_en, p.student_id1, p.first_name1, p.student_type1, p.student_id2, p.first_name2, p.student_type2, p.track, p.project_category
        FROM documents d
        JOIN project_proposals p ON d.document_name = p.project_name_th
        WHERE d.type = 'project';
      `;
    } else if (type) {
      query = 'SELECT * FROM documents WHERE type = ?';
      params.push(type);
    } else {
      query = 'SELECT * FROM documents';
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