const pool = require('../config/database');

exports.getDocuments = async (req, res) => {
  try {
    const query = `
      SELECT 
        d.*,
        u.first_name,
        u.last_name,
        CASE 
          WHEN d.type = 'internship' THEN (
            SELECT JSON_OBJECT(
              'company_name', i.company_name,
              'supervisor_name', i.supervisor_name,
              'supervisor_phone', i.supervisor_phone,
              'supervisor_email', i.supervisor_email
            )
            FROM internship_documents i
            WHERE i.document_id = d.document_id
          )
          WHEN d.type = 'project' THEN (
            SELECT JSON_OBJECT(
              'project_name_th', p.project_name_th,
              'project_name_en', p.project_name_en, 
              'project_type', p.project_type,
              'track', p.track
            )
            FROM project_documents p
            WHERE p.document_id = d.document_id
          )
        END as document_details
      FROM documents d
      JOIN users u ON d.user_id = u.user_id
      WHERE d.status = ?`;

    const [documents] = await pool.execute(query, [req.query.status || 'pending']);
    res.json(documents);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
};

exports.getDocumentById = async (req, res) => {
  const { id } = req.params;

  try {
    // ปรับ query เพื่อใช้ user_id แทน studentID
    const query = `
      SELECT d.*,
      CASE 
        WHEN d.type = 'internship' THEN json_object(
          'company_name', i.company_name,
          'contact_name', i.contact_name,
          'contact_phone', i.contact_phone,
          'contact_email', i.contact_email,
          'uploaded_files', i.uploaded_files
        )
        WHEN d.type = 'project' THEN json_object(
          'project_name_th', p.project_name_th,
          'project_name_en', p.project_name_en,
          'student_id1', p.student_id1,
          'student_name1', CONCAT(u1.first_name, ' ', u1.last_name),
          'student_id2', p.student_id2,
          'student_name2', CONCAT(u2.first_name, ' ', u2.last_name)
        )
      END as details
      FROM documents d
      LEFT JOIN users u ON d.user_id = u.user_id
      WHERE d.id = ?`;

    const [rows] = await pool.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // แปลง JSON string เป็น object และรวมข้อมูล
    const documentData = {
      ...rows[0],
      ...(rows[0].details ? JSON.parse(rows[0].details) : {})
    };

    res.json(documentData);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Error fetching document details' });
  }
};

exports.approveDocument = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('UPDATE documents SET status = ? WHERE id = ?', ['approved', parseInt(id, 10)]);
    res.status(200).json({ message: 'Document approved successfully' });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query: error.sql
    });
    res.status(500).json({ 
      error: 'Error approving document',
      details: error.message 
    });
  }
};

exports.rejectDocument = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('UPDATE documents SET status = ? WHERE id = ?', ['rejected', id]);
    res.status(200).json({ message: 'Document rejected successfully' });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query: error.sql
    });
    res.status(500).json({ 
      error: 'Error rejecting document',
      details: error.message 
    });
  }
};