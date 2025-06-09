import React, { useState, useEffect } from 'react';
import { Modal, Card, Typography, Row, Col, Divider, Button, Space, List, Tag, Spin, message, Avatar, Tabs } from 'antd';
import { FilePdfOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import { documentService } from '../../../services/admin/documentService';
import PDFViewerModal from '../../PDFViewerModal';
import CS05Preview from './CS05Preview';

const { Title, Paragraph, Text } = Typography;

const DocumentDetails = ({ documentId, open, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false); // เพิ่ม state สำหรับควบคุมการแสดง PDF
  const [pdfUrl, setPdfUrl] = useState(null); // เพิ่ม state สำหรับเก็บ URL ของ PDF
  const [activeTab, setActiveTab] = useState('details');
  
  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    documentService.getDocumentById(documentId)
      .then((response) => {
        console.log('Document Details Response:', response); // ตรวจสอบข้อมูลที่ได้รับจาก API
        
        // ตรวจสอบโครงสร้างข้อมูลและจัดการให้ถูกต้อง
        // กรณี API ส่งคืนในรูปแบบ { success: true, data: { ... } }
        const documentData = response.data || response;
        console.log('Document Data being set:', documentData);
        
        setDetails(documentData);
      })
      .catch((error) => {
        console.error('Error fetching document details:', error);
        setError(error);
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleDownload = async (fileUrl, fileName) => {
    try {
      // สร้างลิงก์ดาวน์โหลดโดยตรงโดยใช้ path ที่ถูกต้อง
      const downloadUrl = `/api/admin/documents/${documentId}/download`;
      
      // สร้าง element a แล้วจำลองการคลิก
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('กำลังดาวน์โหลดไฟล์');
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
      console.error('Error downloading file:', error);
    }
  };

  // ฟังก์ชันจัดการการแสดงไฟล์ PDF
  const handleViewPDF = async () => {
    if (!details) return;
    
    const data = details.data || details;
    if (!data.filePath) {
      message.error('ไม่พบไฟล์ PDF');
      return;
    }

    try {
      // ดึง token จาก localStorage
      const token = localStorage.getItem('token');
      
      // ทำการดาวน์โหลดไฟล์ PDF ใหม่โดยส่ง token ไปด้วย
      const response = await fetch(`/api/admin/documents/${data.documentId}/view`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // แปลงข้อมูลเป็น blob
      const blob = await response.blob();
      
      // สร้าง URL จาก blob สำหรับแสดงใน PDFViewer
      const pdfUrl = URL.createObjectURL(blob);
      setPdfUrl(pdfUrl);
      setShowPdfViewer(true);
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดเอกสาร PDF');
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
                onClick={() => {
                  setSelectedFile(file);
                  handleViewPDF(file.url); // เรียกใช้ฟังก์ชัน handleViewPDF
                }}
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

    // แก้ไขการอ่านข้อมูลให้รองรับทั้งโครงสร้างข้อมูลแบบเดิมและแบบใหม่
    // ตรวจสอบว่าข้อมูลอยู่ใน details หรือ details.data
    const data = details.data || details;
    
    // ตรวจสอบว่าเป็นเอกสาร CS05 หรือไม่
    const isCS05 = data.documentName === 'CS05' && data.documentType === 'INTERNSHIP';

    // ถ้าเป็นเอกสาร CS05 ให้แสดงในรูปแบบ Tabs
    if (isCS05) {
      return (
        <Card className="detail-card">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'details',
                label: 'รายละเอียดเอกสาร',
                children: renderBasicDetails(data)
              },
              {
                key: 'preview',
                label: 'แสดงตามแบบฟอร์ม คพ.05',
                children: <CS05Preview data={data} />
              }
            ]}
          />
        </Card>
      );
    }
    
    // ถ้าไม่ใช่ CS05 แสดงแบบปกติ
    return renderBasicDetails(data);
  };
  
  // ย้ายส่วนแสดงรายละเอียดทั่วไปไปยังฟังก์ชันใหม่
  const renderBasicDetails = (data) => {
    return (
      <Card 
        title={<Title level={4}>รายละเอียดเอกสาร {data.documentName}</Title>} 
        variant="outlined"
        className="detail-card"
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Paragraph><strong>ID:</strong> {data.documentId}</Paragraph>
            <Paragraph><strong>ชื่อเอกสาร:</strong> {data.documentName || 'ไม่ระบุ'}</Paragraph>
            <Paragraph><strong>ประเภทเอกสาร:</strong> {data.documentType === 'INTERNSHIP' ? 'เอกสารฝึกงาน' : data.documentType}</Paragraph>
            <Paragraph><strong>หมวดหมู่:</strong> {data.category || 'ไม่ระบุ'}</Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph><strong>วันที่สร้าง:</strong> {moment(data.created_at).format('DD/MM/YYYY HH:mm')}</Paragraph>
            <Paragraph><strong>สถานะ:</strong> {renderStatus(data.status)}</Paragraph>
            <Paragraph><strong>วันที่อัปเดต:</strong> {data.updated_at ? moment(data.updated_at).format('DD/MM/YYYY HH:mm') : 'ไม่ระบุ'}</Paragraph>
          </Col>
        </Row>

        {data.filePath && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Title level={5}>ข้อมูลไฟล์</Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Paragraph><strong>ชื่อไฟล์:</strong> {data.filePath.split('\\').pop() || 'ไม่ระบุ'}</Paragraph>
                <Paragraph><strong>ประเภทไฟล์:</strong> {data.mimeType || 'ไม่ระบุ'}</Paragraph>
              </Col>
              <Col xs={24} md={12}>
                <Paragraph><strong>ขนาดไฟล์:</strong> {data.fileSize ? `${(data.fileSize / 1024 / 1024).toFixed(2)} MB` : 'ไม่ระบุ'}</Paragraph>
                <Space>
                  <Button 
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(`/api/admin/documents/${data.documentId}/download`, data.filePath.split('\\').pop())}
                  >
                    ดาวน์โหลดไฟล์
                  </Button>
                  <Button 
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={handleViewPDF}
                  >
                    ดูเอกสาร PDF
                  </Button>
                </Space>
              </Col>
            </Row>
          </>
        )}

        <Divider style={{ margin: '12px 0' }} />
        <Title level={5}>หมายเหตุ</Title>
        {data.reviewComment ? (
          <Paragraph>{data.reviewComment}</Paragraph>
        ) : (
          <Text type="secondary">ไม่มีหมายเหตุ</Text>
        )}

        {/* ถ้าข้อมูล API มี files แสดง files ถ้าไม่มีไม่ต้องแสดงส่วนนี้ */}
        {data.files && data.files.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Title level={5}>ไฟล์แนบ</Title>
            <List
              itemLayout="horizontal"
              dataSource={data.files}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(file.url, file.name)}
                    >
                      ดาวน์โหลด
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<FilePdfOutlined />} />}
                    title={file.name}
                    description={`ประเภท: ${file.type}`}
                  />
                </List.Item>
              )}
            />
          </>
        )}
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
      styles={{ 
        body: { maxHeight: '80vh', overflow: 'auto', padding: '20px' } 
      }}
      destroyOnHidden={true}
      className="document-detail-modal"
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" tip="กำลังโหลดข้อมูล..." />
        </div>
      ) : (
        <div className="document-detail-container">
          {renderDetailSection()}
        </div>
      )}

      {/* แสดง PDFViewer ถ้ามีการเลือกไฟล์ PDF */}
      {showPdfViewer && pdfUrl && (
        <PDFViewerModal 
          visible={showPdfViewer} 
          pdfUrl={pdfUrl} 
          onClose={() => setShowPdfViewer(false)} 
        />
      )}
    </Modal>
  );
};

export default DocumentDetails;