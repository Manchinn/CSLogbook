const pool = require('../config/database');
const path = require('path');

exports.submitInternshipDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const companyInfo = JSON.parse(req.body.companyInfo);
    
    // เก็บข้อมูลไฟล์แบบไม่ต้องเข้ารหัส Base64
    const filesInfo = req.files.map(file => ({
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    // เริ่ม transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // บันทึกข้อมูลลงตาราง internship_documents
      const [internshipResult] = await connection.execute(
        `INSERT INTO internship_documents 
         (company_name, contact_name, contact_phone, contact_email, uploaded_files, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          companyInfo.company_name,
          companyInfo.contact_name, 
          companyInfo.contact_phone,
          companyInfo.contact_email,
          JSON.stringify(filesInfo), // เก็บข้อมูลไฟล์แบบไม่เข้ารหัส
          'pending',
          new Date()
        ]
      );

      // บันทึกข้อมูลลงตาราง documents สำหรับแสดงสถานะ
      const [documentResult] = await connection.execute(
        `INSERT INTO documents 
         (document_name, student_name, upload_date, status, type) 
         VALUES (?, ?, NOW(), ?, ?)`,
        [
          companyInfo.company_name,
          `${req.user.firstName} ${req.user.lastName}`, // ใช้ข้อมูลผู้ใช้จาก middleware
          'pending',
          'internship'
        ]
      );

      await connection.commit();

      res.status(201).json({
        message: 'Internship documents submitted successfully',
        documentId: internshipResult.insertId
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error submitting internship documents:', error);
    res.status(500).json({ error: 'Error submitting internship documents' });
  }
};

exports.uploadInternshipDocument = (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.'); // ถ้าไม่มีไฟล์ที่อัพโหลด ส่งสถานะ 400
  }
  res.status(200).send({ fileName: req.file.filename }); // ส่งชื่อไฟล์กลับไป
};

exports.getInternshipDocuments = async (req, res) => {
  try {
    const [documents] = await pool.execute('SELECT * FROM internship_documents');
    res.json(documents); // ส่งข้อมูลเอกสารทั้งหมดกลับไป
  } catch (error) {
    console.error('Error fetching internship documents:', error);
    res.status(500).json({ error: 'Error fetching internship documents' });
  }
};

exports.getInternshipDocumentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [document] = await pool.execute('SELECT * FROM internship_documents WHERE id = ?', [id]);
    if (document.length === 0) {
      return res.status(404).json({ error: 'Document not found' }); // ถ้าไม่พบเอกสาร ส่งสถานะ 404
    }

    // ส่งข้อมูลไฟล์กลับไปโดยตรง ไม่ต้องถอดรหัส
    res.json(document[0]);
  } catch (error) {
    console.error('Error fetching internship document:', error);
    res.status(500).json({ error: 'Error fetching internship document' });
  }
};

exports.approveInternshipDocument = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // อัพเดทสถานะในตาราง internship_documents
    await connection.execute(
      'UPDATE internship_documents SET status = ? WHERE id = ?',
      ['approved', id]
    );
    
    // อัพเดทสถานะในตาราง documents
    await connection.execute(
      'UPDATE documents SET status = ? WHERE document_name = (SELECT company_name FROM internship_documents WHERE id = ?)',
      ['approved', id]
    );

    await connection.commit();
    res.json({ message: 'Internship document approved successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error approving internship document:', error);
    res.status(500).json({ error: 'Error approving internship document' });
  } finally {
    connection.release();
  }
};

exports.rejectInternshipDocument = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // อัพเดทสถานะในตาราง internship_documents
    await connection.execute(
      'UPDATE internship_documents SET status = ? WHERE id = ?',
      ['rejected', id]
    );
    
    // อัพเดทสถานะในตาราง documents
    await connection.execute(
      'UPDATE documents SET status = ? WHERE document_name = (SELECT company_name FROM internship_documents WHERE id = ?)',
      ['rejected', id]
    );

    await connection.commit();
    res.json({ message: 'Internship document rejected successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error rejecting internship document:', error);
    res.status(500).json({ error: 'Error rejecting internship document' });
  } finally {
    connection.release();
  }
};