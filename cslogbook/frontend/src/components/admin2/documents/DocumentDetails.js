import React, { useEffect, useState } from 'react';
import { Modal, Typography, List, Card, Spin, message, Space, Button, Tag, Row, Col, Tooltip } from 'antd';
import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
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
        // ใช้ documentService แทนการเรียก API โดยตรง
        const data = await documentService.getDocumentDetails(documentId);

        // แปลงข้อมูล JSON string เป็น object ถ้าจำเป็น
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
    }
  }, [documentId, open]);

  const handleDownload = async (fileUrl, fileName) => {
    try {
      if (!fileUrl) {
        message.error('ไม่พบลิงก์ไฟล์');
        return;
      }

      // ตัดส่วนของ path ถ้าจำเป็น
      const fileId = fileUrl.split('/').pop();
      // ใช้ documentService แทนการเรียก API โดยตรง
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

  // ส่วนอื่นๆ ยังคงเหมือนเดิม...
  const renderFileList = () => {
    if (!document?.uploaded_files || document.uploaded_files.length === 0) {
      return <Paragraph>ไม่มีไฟล์แนบ</Paragraph>;
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
                  onClick={() => handleViewPDF(file.url, file.name)}
                />
              </Tooltip>,
              <Tooltip title="ดาวน์โหลด">
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={() => handleDownload(file.url, file.name)}
                />
              </Tooltip>
            ]}
          >
            <List.Item.Meta
              title={file.name}
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
      <Card title="รายละเอียดเอกสาร" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Paragraph><strong>ชื่อเอกสาร:</strong> {document.document_name}</Paragraph>
            <Paragraph><strong>ประเภท:</strong> {document.type === 'internship' ? 'เอกสารฝึกงาน' : 'เอกสารโครงงาน'}</Paragraph>
            <Paragraph><strong>ผู้อัปโหลด:</strong> {document.student_name}</Paragraph>
          </Col>
          <Col span={12}>
            <Paragraph><strong>รหัสนักศึกษา:</strong> {document.student_code}</Paragraph>
            <Paragraph><strong>วันที่อัปโหลด:</strong> {moment(document.upload_date).format('DD/MM/YYYY HH:mm')}</Paragraph>
            <Paragraph>
              <strong>สถานะ:</strong> {renderStatus(document.status)}
            </Paragraph>
          </Col>
        </Row>
        
        {document.title && (
          <>
            <Paragraph><strong>หัวข้อโครงงาน:</strong> {document.title}</Paragraph>
            <Paragraph><strong>คำอธิบาย:</strong> {document.description}</Paragraph>
          </>
        )}
        <Paragraph><strong>แทร็ก:</strong> {document?.track}</Paragraph>
        <Paragraph><strong>หมวดหมู่โครงการ:</strong> {document?.project_category}</Paragraph>
      </Card>
    );
  };

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
          {renderDetailSection()}
          
          <Card title="ไฟล์แนบ" style={{ marginBottom: '16px' }}>
            {renderFileList()}
          </Card>
          
          {selectedFile && (
            <Card title={`ดูไฟล์: ${selectedFile.name}`}>
              <PDFViewer url={selectedFile.url} />
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DocumentDetails;