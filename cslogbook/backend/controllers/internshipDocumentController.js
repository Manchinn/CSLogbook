const pool = require('../config/database');
const path = require('path');

exports.submitInternshipDocuments = async (req, res) => {
  const { companyInfo, uploadedFiles } = req.body;

  // ตรวจสอบว่าพารามิเตอร์ทั้งหมดถูกกำหนด
  if (!companyInfo || !uploadedFiles) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
  }

  const companyName = companyInfo.company_name || null;
  const contactName = companyInfo.contact_name || null;
  const contactPhone = companyInfo.contact_phone || null;
  const contactEmail = companyInfo.contact_email || null;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' }); // ถ้าไม่มีชื่อบริษัท ส่งสถานะ 400
  }

  console.log("Received data from frontend:", { companyInfo, uploadedFiles });

  try {
    const [result] = await pool.execute(
      'INSERT INTO internship_documents (company_name, contact_name, contact_phone, contact_email, uploaded_files) VALUES (?, ?, ?, ?, ?)',
      [companyName, contactName, contactPhone, contactEmail, JSON.stringify(uploadedFiles)]
    );

    // เพิ่มการบันทึกข้อมูลลงในตาราง documents
    await pool.execute(
      'INSERT INTO documents (document_name, student_name, upload_date, status, type) VALUES (?, ?, NOW(), ?, ?)',
      [companyName, contactName, 'pending', 'internship']
    );

    res.status(201).json({ message: 'Internship documents submitted successfully', documentId: result.insertId });
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
    res.json(document[0]); // ส่งข้อมูลเอกสารกลับไป
  } catch (error) {
    console.error('Error fetching internship document:', error);
    res.status(500).json({ error: 'Error fetching internship document' });
  }
};

exports.approveInternshipDocument = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('UPDATE documents SET status = ? WHERE document_name = (SELECT company_name FROM internship_documents WHERE id = ?)', ['approved', id]);
    res.json({ message: 'Internship document approved successfully' }); // ส่งข้อความยืนยันการอนุมัติเอกสาร
  } catch (error) {
    console.error('Error approving internship document:', error);
    res.status(500).json({ error: 'Error approving internship document' });
  }
};

exports.rejectInternshipDocument = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('UPDATE documents SET status = ? WHERE document_name = (SELECT company_name FROM internship_documents WHERE id = ?)', ['rejected', id]);
    res.json({ message: 'Internship document rejected successfully' }); // ส่งข้อความยืนยันการปฏิเสธเอกสาร
  } catch (error) {
    console.error('Error rejecting internship document:', error);
    res.status(500).json({ error: 'Error rejecting internship document' });
  }
};