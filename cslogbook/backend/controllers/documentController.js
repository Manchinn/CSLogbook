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
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query: error.sql
    });
    res.status(500).json({ 
      error: 'Error fetching documents',
      details: error.message 
    });
  }
};

exports.getDocumentById = async (req, res) => {
  const { id } = req.params;

  try {
    // ปรับปรุง query เพื่อดึงข้อมูลที่สมบูรณ์
    let query = `
      SELECT 
        d.*,
        CASE 
          WHEN d.type = 'internship' THEN (
            SELECT JSON_OBJECT(
              'company_name', i.company_name,
              'contact_name', i.contact_name,
              'contact_phone', i.contact_phone,
              'contact_email', i.contact_email,
              'uploaded_files', i.uploaded_files,
              'student_name', CONCAT(u.firstName, ' ', u.lastName)
            )
            FROM internship_documents i
            LEFT JOIN users u ON d.student_name LIKE CONCAT('%', u.firstName, '%')
            WHERE i.company_name = d.document_name
          )
          WHEN d.type = 'project' THEN (
            SELECT JSON_OBJECT(
              'project_name_th', p.project_name_th,
              'project_name_en', p.project_name_en,
              'student_id1', p.student_id1,
              'student_name1', CONCAT(u1.firstName, ' ', u1.lastName),
              'student_type1', p.student_type1,
              'student_id2', p.student_id2,
              'student_name2', CASE WHEN p.student_id2 IS NOT NULL 
                                  THEN CONCAT(u2.firstName, ' ', u2.lastName)
                                  ELSE NULL END,
              'student_type2', p.student_type2,
              'track', p.track,
              'project_category', p.project_category
            )
            FROM project_proposals p
            LEFT JOIN users u1 ON p.student_id1 = u1.studentID
            LEFT JOIN users u2 ON p.student_id2 = u2.studentID
            WHERE p.project_name_th = d.document_name
          )
        END as details
      FROM documents d
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