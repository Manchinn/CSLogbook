import React, { useState, useEffect } from 'react';
import { Modal, Card, Typography, Row, Col, Divider, Button, Space, List, Tag, Spin, message, Avatar, Tabs, Alert } from 'antd';
import { FilePdfOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from '../../../utils/dayjs'; // ใช้ dayjs ที่ตั้งค่า timezone + BE
import { documentService } from '../../../services/admin/documentService';
import PDFViewerModal from '../../PDFViewerModal';
import CS05Preview from './CS05Preview';

const { Title, Paragraph, Text } = Typography;

const DocumentDetails = ({ documentId, open, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
        const errorMessage = error?.message || 'เกิดข้อผิดพลาดในการโหลดรายละเอียดเอกสาร';
        setError(errorMessage);
        message.error(errorMessage);
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleDownload = async (fileUrl, fileName) => {
    // แก้ปัญหาไฟล์ว่าง: ใช้ fetch + Authorization header และบันทึก blob เป็นไฟล์จริง
    const targetUrl = fileUrl || `/api/admin/documents/${documentId}/download`;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        throw new Error(`Download failed: ${res.status}`);
      }

      // พยายามดึงชื่อไฟล์จาก Content-Disposition หากมี
      const disposition = res.headers.get('content-disposition');
      let finalName = fileName || 'document.pdf';
      if (disposition && disposition.includes('filename')) {
        const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        const raw = match ? (match[1] || match[2]) : null;
        if (raw) {
          try {
            finalName = decodeURIComponent(raw);
          } catch {
            finalName = raw;
          }
        }
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error('Empty file blob');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      message.success('ดาวน์โหลดไฟล์สำเร็จ');
    } catch (error) {
      console.error('Error downloading file:', error);
      message.error('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
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

  // ฟังก์ชัน format วันที่/เวลา (แปลงเป็น พ.ศ.)
  const formatDateTime = (date) => {
    if (!date) return 'ไม่ระบุ';
    const d = dayjs(date);
    if (!d.isValid()) return 'ไม่ระบุ';
    const buddhistYear = d.year() + 543; // plugin บางครั้งอาจไม่ครอบ format YYYY จึงบวกเองเพื่อความชัวร์
    return d.format(`DD/MM/`) + `${buddhistYear} ` + d.format('HH:mm');
  };

  // (ลบ renderFileList เดิมที่ไม่ถูกใช้งานแล้ว)

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
    // แปลชื่อเอกสารเป็นภาษาไทยตาม mapping ใหม่
    const mapName = (name) => {
      const upper = (name || '').toUpperCase();
      if (upper === 'CS05') return 'คำร้องขอฝึกงาน (คพ.05)';
      if (upper === 'ACCEPTANCE_LETTER') return 'หนังสือตอบรับการฝึกงาน';
      return name || 'ไม่ระบุ';
    };
    const displayName = mapName(data.documentName);
  const submittedAt = data.submittedAt || data.submitted_at || data.created_at;
    const fileName = data.filePath ? data.filePath.split('\\').pop() : null;
    const fileSizeMB = data.fileSize ? (data.fileSize / 1024 / 1024) : null;
    return (
      <Card
        title={<Title level={4} style={{ margin: 0 }}>รายละเอียดเอกสาร: {displayName}</Title>}
        variant="outlined"
        className="detail-card"
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Paragraph><strong>ชื่อเอกสาร:</strong> {displayName}</Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph><strong>วันที่ส่ง:</strong> {formatDateTime(submittedAt)}</Paragraph>
            <Paragraph><strong>สถานะ:</strong> {renderStatus(data.status)}</Paragraph>
          </Col>
        </Row>

        {data.filePath && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Title level={5}>ข้อมูลไฟล์</Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Paragraph><strong>ชื่อไฟล์:</strong> {fileName || 'ไม่ระบุ'}</Paragraph>
                <Paragraph><strong>ขนาดไฟล์:</strong> {fileSizeMB ? `${fileSizeMB.toFixed(fileSizeMB >= 1 ? 2 : 3)} MB` : 'ไม่ระบุ'}</Paragraph>
              </Col>
              <Col xs={24} md={12}>
                <Space>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(`/api/admin/documents/${data.documentId}/download`, fileName)}
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

        {data.files && data.files.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Title level={5}>ไฟล์แนบ</Title>
            <List
              itemLayout="horizontal"
              dataSource={data.files}
              renderItem={(file) => {
                const sizeLabel = file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : undefined;
                return (
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
                      description={sizeLabel ? `ขนาด: ${sizeLabel}` : null}
                    />
                  </List.Item>
                );
              }}
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
      {error && (
        <Alert
          type="error"
          showIcon
          message="ไม่สามารถโหลดรายละเอียดเอกสารได้"
          description={error}
          style={{ marginBottom: '16px' }}
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" spinning={true} tip="กำลังโหลดข้อมูล...">
        <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>{/* Loading content */}</div>
        </div>
      </Spin>
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