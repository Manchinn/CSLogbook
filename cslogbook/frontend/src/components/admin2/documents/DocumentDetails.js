import React, { useState } from 'react';
import { Modal, Card, Typography, Row, Col, Divider, Button, Space, List, Tag, Spin, message, Avatar } from 'antd';
import { FileOutlined, FilePdfOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../../../services/admin/documentService';
//import PDFViewer from './PDFViewer';

const { Title, Paragraph, Text } = Typography;

const DocumentDetails = ({ documentId, open, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const queryClient = useQueryClient();
  
  // ดึงข้อมูลรายละเอียดเอกสาร
  const { data: document, isLoading } = useQuery({
    queryKey: ['admin', 'documentDetails', documentId],
    queryFn: () => documentId ? documentService.getDocumentById(documentId) : null,
    enabled: !!documentId && open,
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร');
      console.error('Error fetching document details:', error);
    }
  });
  
  // Mutations สำหรับการอนุมัติ/ปฏิเสธเอกสาร
  const approveMutation = useMutation({
    mutationFn: documentService.approveDocument,
    onSuccess: () => {
      message.success('อนุมัติเอกสารเรียบร้อย');
      // Invalidate queries to refresh the document list and stats
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      onClose();
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการอนุมัติเอกสาร');
      console.error('Error approving document:', error);
    }
  });
  
  const rejectMutation = useMutation({
    mutationFn: documentService.rejectDocument,
    onSuccess: () => {
      message.success('ปฏิเสธเอกสารเรียบร้อย');
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      onClose();
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการปฏิเสธเอกสาร');
      console.error('Error rejecting document:', error);
    }
  });
  
  const handleDownload = async (fileUrl, fileName) => {
    try {
      await documentService.downloadFile(fileUrl, fileName);
      message.success('กำลังดาวน์โหลดไฟล์');
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
      console.error('Error downloading file:', error);
    }
  };
  
  const handleApprove = () => {
    if (documentId) {
      approveMutation.mutate(documentId);
    }
  };
  
  const handleReject = () => {
    if (documentId) {
      rejectMutation.mutate(documentId);
    }
  };
  
  // Render file list
  const renderFileList = () => {
    if (!document || !document.files || document.files.length === 0) {
      return <Text type="secondary">ไม่พบไฟล์แนบ</Text>;
    }
    
    return (
      <List
        itemLayout="horizontal"
        dataSource={document.files}
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
  
  // Render detail section
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
  
  const renderFooter = () => {
    if (!document || document.status !== 'pending') return null;
    
    return (
      <Space>
        <Button onClick={onClose}>ปิด</Button>
        <Button type="danger" onClick={handleReject} loading={rejectMutation.isLoading}>
          ปฏิเสธ
        </Button>
        <Button type="primary" onClick={handleApprove} loading={approveMutation.isLoading}>
          อนุมัติ
        </Button>
      </Space>
    );
  };
  
  return (
    <Modal 
      title={<Title level={3} style={{ textAlign: 'center', margin: 0 }}>รายละเอียดเอกสาร</Title>}
      open={open}
      onCancel={onClose}
      footer={renderFooter()}
      centered
      width="90%"
      bodyStyle={{ maxHeight: '80vh', overflow: 'auto', padding: '20px' }}
      destroyOnClose={true}
      className="document-detail-modal"
    >
      {isLoading ? (
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