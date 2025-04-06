import React, { useEffect, useState } from 'react';
import { Modal, Typography, List, Card, Spin, message, Space, Button, Tag, Row, Col, Tooltip, Divider } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileOutlined } from '@ant-design/icons';
import PDFViewer from '../../PDFViewer';
import moment from 'moment-timezone';
import { documentService } from '../../../services/admin/documentService';

const { Title, Paragraph, Text } = Typography;

const DocumentDetails = ({ documentId, open, onClose }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!documentId || !open) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await documentService.getDocumentDetails(documentId);

        const documentData = {
          ...data,
          uploaded_files: data.uploaded_files ? 
            (typeof data.uploaded_files === 'string' ? 
              JSON.parse(data.uploaded_files) : 
              data.uploaded_files) : 
            []
        };

        setDocument(documentData);
      } catch (error) {
        console.error('Error fetching document details:', error);
        message.error('เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    } else {
      setSelectedFile(null); // รีเซ็ตไฟล์ที่เลือกเมื่อปิด modal
    }
  }, [documentId, open]);

  const handleDownload = async (fileUrl, fileName) => {
    try {
      if (!fileUrl) {
        message.error('ไม่พบลิงก์ไฟล์');
        return;
      }

      const fileId = fileUrl.split('/').pop();
      await documentService.downloadDocument(fileId, fileName);
      message.success('ดาวน์โหลดไฟล์สำเร็จ');
    } catch (error) {
      console.error('Error downloading file:', error);
      message.error('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
    }
  };

  const handleViewPDF = (fileUrl, fileName) => {
    setSelectedFile({
      url: fileUrl,
      name: fileName
    });
  };

  const renderFileList = () => {
    if (!document?.uploaded_files || document.uploaded_files.length === 0) {
      return <Text type="secondary">ไม่มีไฟล์แนบ</Text>;
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={document.uploaded_files}
        renderItem={file => (
          <List.Item
            actions={[
              <Tooltip title="ดูไฟล์">
                <Button 
                  type="primary" 
                  icon={<FilePdfOutlined />}
                  size="middle"
                  onClick={() => handleViewPDF(file.url, file.name)}
                />
              </Tooltip>,
              <Tooltip title="ดาวน์โหลด">
                <Button 
                  icon={<DownloadOutlined />}
                  size="middle"
                  onClick={() => handleDownload(file.url, file.name)}
                />
              </Tooltip>
            ]}
          >
            <List.Item.Meta
              avatar={<FileOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
              title={<Text strong>{file.name}</Text>}
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary">ขนาด: {(file.size / 1024).toFixed(2)} KB</Text>
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
    if (!document) return null;
    
    return (
      <Card 
        title={<Title level={4}>รายละเอียดเอกสาร</Title>} 
        bordered={false}
        className="detail-card"
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Paragraph><strong>ชื่อเอกสาร:</strong> {document.document_name}</Paragraph>
            <Paragraph><strong>ประเภท:</strong> {document.type === 'internship' ? 'เอกสารฝึกงาน' : 'เอกสารโครงงาน'}</Paragraph>
            <Paragraph><strong>ผู้อัปโหลด:</strong> {document.student_name}</Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph><strong>รหัสนักศึกษา:</strong> {document.student_code}</Paragraph>
            <Paragraph><strong>วันที่อัปโหลด:</strong> {moment(document.upload_date).format('DD/MM/YYYY HH:mm')}</Paragraph>
            <Paragraph>
              <strong>สถานะ:</strong> {renderStatus(document.status)}
            </Paragraph>
          </Col>
        </Row>
        
        <Divider style={{ margin: '12px 0' }} />
        
        {document.title && (
          <>
            <Paragraph><strong>หัวข้อโครงงาน:</strong> {document.title}</Paragraph>
            <Paragraph><strong>คำอธิบาย:</strong> {document.description}</Paragraph>
            <Divider style={{ margin: '12px 0' }} />
          </>
        )}
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Paragraph><strong>แทร็ก:</strong> {document?.track || 'ไม่ระบุ'}</Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph><strong>หมวดหมู่โครงการ:</strong> {document?.project_category || 'ไม่ระบุ'}</Paragraph>
          </Col>
        </Row>
      </Card>
    );
  };

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

  return (
    <Modal 
      title={<Title level={3} style={{ textAlign: 'center', margin: 0 }}>รายละเอียดเอกสาร</Title>}
      open={open}
      onCancel={onClose}
      footer={null}
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
                <PDFViewer url={selectedFile.url} />
              </div>
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DocumentDetails;