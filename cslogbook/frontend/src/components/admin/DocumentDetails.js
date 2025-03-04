import React, { useEffect, useState } from 'react';
import { Modal, Typography, List, Card, Spin, message, Space, Button, Tag, Row, Col, Tooltip } from 'antd';
import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import PDFViewer from '../PDFViewer';
import moment from 'moment-timezone';

const { Title, Paragraph } = Typography;

// 1. เพิ่ม BASE_URL สำหรับ API
const API_BASE_URL = 'http://localhost:5000';

const DocumentDetails = ({ documentId, open, onClose }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (!documentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        // แปลงข้อมูล JSON string เป็น object ถ้าจำเป็น
        const documentData = {
          ...response.data,
          uploaded_files: response.data.uploaded_files ? 
            (typeof response.data.uploaded_files === 'string' ? 
              JSON.parse(response.data.uploaded_files) : 
              response.data.uploaded_files) : 
            []
        };

        console.log('Processed document data:', documentData);
        setDocument(documentData);
      } catch (error) {
        console.error('Error fetching document details:', error);
        message.error('เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentDetails();
  }, [documentId, API_BASE_URL]);

  const formatDateTime = (date) => {
    return moment(date).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
  };

  const handlePDFError = (error, filename) => {
    console.error('Error loading PDF:', error);
    message.error(`ไม่สามารถโหลดไฟล์ ${filename}: ${error.message}`);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  // 2. แก้ไขฟังก์ชัน renderFileList
  const renderFileList = (files) => {
    try {
      if (!files || files.length === 0) {
        return <Paragraph>ไม่มีเอกสารที่อัปโหลด</Paragraph>;
      }
  
      const fileArray = Array.isArray(files) ? 
        files : 
        (typeof files === 'string' ? JSON.parse(files) : []);
    
      return (
        <List
          size="small"
          bordered
          dataSource={fileArray}
          renderItem={(file) => (
            <List.Item 
              key={file.filename}
              actions={[
                <Button
                  key="view"
                  type="link"
                  onClick={() => handleFileSelect(file)}
                >
                  แสดง
                </Button>,
                <Button
                  key="download"
                  type="link"
                  href={`${API_BASE_URL}/uploads/${file.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<DownloadOutlined />}
                >
                  ดาวน์โหลด
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />}
                title={file.originalname}
                description={`ขนาด: ${(file.size / 1024 / 1024).toFixed(2)} MB`}
              />
            </List.Item>
          )}
        />
      );
    } catch (error) {
      console.error('Error rendering file list:', error);
      return <Paragraph>เกิดข้อผิดพลาดในการแสดงรายการไฟล์</Paragraph>;
    }
  };

  const renderInternshipDetails = () => (
    <Card style={{ marginBottom: '16px' }}>
      <Paragraph><strong>ชื่อบริษัท:</strong> {document?.company_name || '-'}</Paragraph>
      <Paragraph><strong>ชื่อผู้ควบคุมงาน:</strong> {document?.contact_name || '-'}</Paragraph>
      <Paragraph><strong>เบอร์โทรศัพท์:</strong> {document?.contact_phone || '-'}</Paragraph>
      <Paragraph><strong>อีเมล:</strong> {document?.contact_email || '-'}</Paragraph>
      <Paragraph><strong>เอกสารที่อัปโหลด:</strong></Paragraph>
      {document?.uploaded_files ? renderFileList(
        Array.isArray(document.uploaded_files) 
          ? document.uploaded_files 
          : JSON.parse(document.uploaded_files)
      ) : <Paragraph>ไม่มีเอกสารที่อัปโหลด</Paragraph>}
      {selectedFile && renderPDFViewer()}
    </Card>
  );

  const renderProjectDetails = () => (
    <Card style={{ marginBottom: '16px' }}>
      <Paragraph><strong>ชื่อโครงการ (ภาษาไทย):</strong> {document?.project_name_th}</Paragraph>
      <Paragraph><strong>ชื่อโครงการ (ภาษาอังกฤษ):</strong> {document?.project_name_en}</Paragraph>
      <Paragraph><strong>รหัสนักศึกษา 1:</strong> {document?.student_id1}</Paragraph>
      <Paragraph><strong>ชื่อนักศึกษา 1:</strong> {document?.student_name1}</Paragraph>
      <Paragraph><strong>ประเภทนักศึกษา 1:</strong> {document?.student_type1}</Paragraph>
      {document?.student_id2 && (
        <>
          <Paragraph><strong>รหัสนักศึกษา 2:</strong> {document?.student_id2}</Paragraph>
          <Paragraph><strong>ชื่อนักศึกษา 2:</strong> {document?.student_name2}</Paragraph>
          <Paragraph><strong>ประเภทนักศึกษา 2:</strong> {document?.student_type2}</Paragraph>
        </>
      )}
      <Paragraph><strong>แทร็ก:</strong> {document?.track}</Paragraph>
      <Paragraph><strong>หมวดหมู่โครงการ:</strong> {document?.project_category}</Paragraph>
    </Card>
  );

  // เพิ่มฟังก์ชัน render สถานะ
  const renderStatus = (status) => {
    if (!status) return <Tag color="default">ไม่ระบุ</Tag>;
    
    const statusConfig = {
      pending: { color: 'orange', text: 'รอตรวจสอบ' },
      approved: { color: 'green', text: 'อนุมัติ' },
      rejected: { color: 'red', text: 'ปฏิเสธ' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Tag color={config.color}>
        {config.text}
      </Tag>
    );
  };

  // 3. แก้ไขฟังก์ชัน renderPDFViewer
  const renderPDFViewer = () => (
    <Card 
      title={selectedFile?.originalname}
      style={{ marginTop: '16px' }}
      extra={
        <a 
          href={`${API_BASE_URL}/uploads/${selectedFile.filename}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button type="primary" icon={<DownloadOutlined />}>
            ดาวน์โหลด
          </Button>
        </a>
      }
    >
      <PDFViewer 
        pdfFile={`${API_BASE_URL}/uploads/${selectedFile.filename}`}
        width="100%"
        height={600}
        onError={(error) => handlePDFError(error, selectedFile.originalname)}
        style={{ marginTop: '16px' }}
      />
    </Card>
  );

  // แยกฟังก์ชันสำหรับแสดงชื่อนักศึกษา
  const renderStudentName = () => {
    if (!document) return '-';

    try {
      if (document.type === 'internship') {
        return document.student_name || `${document.firstName} ${document.lastName}` || '-';
      }
  
      // กรณีโครงงาน
      const student1 = document.student_name1 || 
                      `${document.firstName1} ${document.lastName1}` || '-';
      const student2 = document.student_name2 || 
                      (document.firstName2 && document.lastName2 ? 
                        `${document.firstName2} ${document.lastName2}` : '');
      
      return student2 ? `${student1}, ${student2}` : student1;
    } catch (error) {
      console.error('Error rendering student name:', error);
      return '-';
    }
  };

  // ปรับปรุงการแสดงข้อมูลในส่วนหลัก
  return (
    <Modal 
      title={<div style={{ textAlign: 'center' }}>รายละเอียดเอกสาร</div>}
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width="90%"
      bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" tip="กำลังโหลดข้อมูล..." />
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <Card style={{ marginBottom: '16px' }}>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
              <Title level={4}>{document?.document_name || document?.project_name_th}</Title>
              
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Paragraph>
                    <strong>ประเภทเอกสาร:</strong>{' '}
                    {document?.type === 'internship' ? 'เอกสารฝึกงาน' : 'เอกสารโครงงาน'}
                  </Paragraph>
                </Col>
                <Col span={8}>
                  <Paragraph>
                    <strong>สถานะ:</strong>{' '}
                    {renderStatus(document?.status)}
                  </Paragraph>
                </Col>
                <Col span={8}>
                  <Paragraph>
                    <strong>ชื่อนักศึกษา:</strong>{' '}
                    {renderStudentName()}
                  </Paragraph>
                </Col>
                <Col span={24}>
                  <Paragraph>
                    <strong>วันที่และเวลาอัปโหลด:</strong>{' '}
                    <Tooltip title={formatDateTime(document?.upload_date)}>
                      {moment(document?.upload_date).fromNow()}
                    </Tooltip>
                  </Paragraph>
                </Col>
              </Row>
            </Space>
          </Card>

          {document?.type === 'internship' && renderInternshipDetails()}
          {document?.type === 'project' && renderProjectDetails()}
        </div>
      )}
    </Modal>
  );
};

export default DocumentDetails;