import React, { useEffect, useState } from 'react';
import { Modal, Typography, List, Card, Spin, message } from 'antd';
import axios from 'axios';
import PDFViewer from '../PDFViewer'; // นำเข้า PDFViewer
import moment from 'moment-timezone';

const { Title, Paragraph } = Typography;

const DocumentDetails = ({ documentId, open, onClose }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/internship-documents/${documentId}`);
        setDocument(response.data);
        const pdfResponse = await axios.get(`http://localhost:5000/get-pdf-url`);
        setPdfUrl(pdfResponse.data.fileUrl);
      } catch (error) {
        console.error('Error fetching document details:', error);
        message.error('เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocumentDetails();
    }
  }, [documentId]);

  const formatDateTime = (date) => {
    return moment(date).tz('Asia/Bangkok').format('YYYY-MM-DD');
  };

  const renderInternshipDetails = () => (
    <Card style={{ marginBottom: '16px' }}>
      <Paragraph><strong>ชื่อบริษัท:</strong> {document?.company_name}</Paragraph>
      <Paragraph><strong>ชื่อผู้ควบคุมงาน:</strong> {document?.contact_name}</Paragraph>
      <Paragraph><strong>เบอร์โทรศัพท์:</strong> {document?.contact_phone}</Paragraph>
      <Paragraph><strong>อีเมล:</strong> {document?.contact_email}</Paragraph>
      <Paragraph><strong>เอกสารที่อัปโหลด:</strong></Paragraph>
      <List
        bordered
        dataSource={document?.uploaded_files && JSON.parse(document.uploaded_files)}
        renderItem={(file) => (
          <List.Item>
            <PDFViewer pdfUrl={`http://localhost:5000/uploads/${file.filename}`} />
          </List.Item>
        )}
      />
    </Card>
  );

  const renderProjectDetails = () => (
    <Card style={{ marginBottom: '16px' }}>
      <Paragraph><strong>ชื่อโครงการ (ภาษาไทย):</strong> {document?.project_name_th}</Paragraph>
      <Paragraph><strong>ชื่อโครงการ (ภาษาอังกฤษ):</strong> {document?.project_name_en}</Paragraph>
      <Paragraph><strong>รหัสนักศึกษา 1:</strong> {document?.student_id1}</Paragraph>
      <Paragraph><strong>ชื่อนักศึกษา 1:</strong> {document?.student_name1}</Paragraph>
      <Paragraph><strong>ประเภทนักศึกษา 1:</strong> {document?.student_type1}</Paragraph>
      <Paragraph><strong>รหัสนักศึกษา 2:</strong> {document?.student_id2}</Paragraph>
      <Paragraph><strong>ชื่อนักศึกษา 2:</strong> {document?.student_name2}</Paragraph>
      <Paragraph><strong>ประเภทนักศึกษา 2:</strong> {document?.student_type2}</Paragraph>
      <Paragraph><strong>แทร็ก:</strong> {document?.track}</Paragraph>
      <Paragraph><strong>หมวดหมู่โครงการ:</strong> {document?.project_category}</Paragraph>
    </Card>
  );

  return (
    <Modal 
      title={<div style={{ textAlign: 'center' }}>รายละเอียดเอกสาร</div>}
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width="80%"
    >
      {loading ? (
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }} />
      ) : (
        <div style={{ padding: '16px' }}>
          <Card style={{ marginBottom: '16px' }}>
            <Title level={4}>{document?.document_name || document?.project_name_th}</Title>
            <Paragraph><strong>ชื่อนักศึกษา:</strong> {document?.student_name}</Paragraph>
            <Paragraph><strong>วันที่และเวลาอัปโหลด:</strong> {formatDateTime(document?.upload_date)}</Paragraph>
            <Paragraph><strong>สถานะ:</strong> {document?.status}</Paragraph>
          </Card>

          {document?.type === 'internship' && renderInternshipDetails()}
          {document?.type === 'project' && renderProjectDetails()}

          {pdfUrl && (
            <Card title="แสดงผลเอกสาร PDF">
              <PDFViewer pdfFile={pdfUrl} />
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DocumentDetails;