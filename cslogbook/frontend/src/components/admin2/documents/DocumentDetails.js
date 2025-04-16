import React, { useState, useEffect } from 'react';
import { Modal, Card, Typography, Row, Col, Divider, Button, Space, List, Tag, Spin, message, Avatar } from 'antd';
import {  FilePdfOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import { documentService } from '../../../services/admin/documentService';

const { Title, Paragraph, Text } = Typography;

const DocumentDetails = ({ documentId, open, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    documentService.getDocumentById(documentId)
      .then(setDetails)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleDownload = async (fileUrl, fileName) => {
    try {
      await documentService.downloadFile(fileUrl, fileName);
      message.success('กำลังดาวน์โหลดไฟล์');
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
      console.error('Error downloading file:', error);
    }
  };

  const renderFileList = () => {
    if (!details || !details.files || details.files.length === 0) {
      return <Text type="secondary">ไม่พบไฟล์แนบ</Text>;
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={details.files}
        renderItem={(file) => (
          <List.Item
            actions={[
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(file.url, file.name)}
              >
                ดาวน์โหลด
              </Button>,
              <Button
                type="primary"
                onClick={() => setSelectedFile(file)}
              >
                ดูเอกสาร
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<FilePdfOutlined />} />}
              title={file.name}
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary">ประเภท: {file.type || 'ไม่ระบุ'}</Text>
                  <Text type="secondary">อัปโหลดเมื่อ: {moment(file.upload_date).format('DD/MM/YYYY HH:mm')}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const renderDetailSection = () => {
    if (!details) return null;

    return (
      <Card 
        title={<Title level={4}>รายละเอียดเอกสาร</Title>} 
        bordered={false}
        className="detail-card"
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Paragraph><strong>ชื่อเอกสาร:</strong> {details.document_name}</Paragraph>
            <Paragraph><strong>ประเภท:</strong> {details.type === 'internship' ? 'เอกสารฝึกงาน' : 'เอกสารโครงงาน'}</Paragraph>
            <Paragraph><strong>ผู้อัปโหลด:</strong> {details.student_name}</Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph><strong>รหัสนักศึกษา:</strong> {details.student_code}</Paragraph>
            <Paragraph><strong>วันที่อัปโหลด:</strong> {moment(details.upload_date).format('DD/MM/YYYY HH:mm')}</Paragraph>
            <Paragraph>
              <strong>สถานะ:</strong> {renderStatus(details.status)}
            </Paragraph>
          </Col>
        </Row>
        
        <Divider style={{ margin: '12px 0' }} />
        
        {details.title && (
          <>
            <Paragraph><strong>หัวข้อโครงงาน:</strong> {details.title}</Paragraph>
            <Paragraph><strong>คำอธิบาย:</strong> {details.description}</Paragraph>
            <Divider style={{ margin: '12px 0' }} />
          </>
        )}
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Paragraph><strong>แทร็ก:</strong> {details?.track || 'ไม่ระบุ'}</Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph><strong>หมวดหมู่โครงการ:</strong> {details?.project_category || 'ไม่ระบุ'}</Paragraph>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderStatus = (status) => {
    if (!status) return <Tag color="default">ไม่ระบุ</Tag>;
    
    const statusConfig = {
      pending: { color: 'orange', text: 'รอตรวจสอบ', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', text: 'อนุมัติ', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: 'ปฏิเสธ', icon: <CloseCircleOutlined /> }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  return (
    <Modal 
      title={<Title level={3} style={{ textAlign: 'center', margin: 0 }}>รายละเอียดเอกสาร</Title>}
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>ปิด</Button>}
      centered
      width="90%"
      bodyStyle={{ maxHeight: '80vh', overflow: 'auto', padding: '20px' }}
      destroyOnClose={true}
      className="document-detail-modal"
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" tip="กำลังโหลดข้อมูล..." />
        </div>
      ) : (
        <div className="document-detail-container">
          {renderDetailSection()}
          
          <Card 
            title={<Title level={4}>ไฟล์แนบ</Title>}
            className="files-card"
            style={{ marginTop: '20px', marginBottom: selectedFile ? '20px' : '0' }}
            bordered={false}
          >
            {renderFileList()}
          </Card>
          
          {selectedFile && (
            <Card 
              title={<Title level={4}>ดูไฟล์: {selectedFile.name}</Title>}
              bordered={false}
              className="pdf-viewer-card"
              style={{ marginTop: '20px' }}
            >
              <div style={{ height: '600px', width: '100%' }}>
                {/* <PDFViewer url={selectedFile.url} /> */}
              </div>
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DocumentDetails;