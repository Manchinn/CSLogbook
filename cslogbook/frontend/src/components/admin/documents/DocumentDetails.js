import React, { useState, useEffect } from 'react';
import { Modal, Card, Typography, Row, Col, Divider, Button, Space, List, Tag, Spin, message, Avatar, Alert, Descriptions, Badge } from 'antd';
import { FilePdfOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, EyeOutlined, FileTextOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from '../../../utils/dayjs'; // ใช้ dayjs ที่ตั้งค่า timezone + BE
import { documentService } from '../../../services/admin/documentService';
import PDFViewerModal from '../../PDFViewerModal';
import CS05Preview from './CS05Preview';

const { Text } = Typography;

const DocumentDetails = ({ documentId, open, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false); // เพิ่ม state สำหรับควบคุมการแสดง PDF
  const [pdfUrl, setPdfUrl] = useState(null); // เพิ่ม state สำหรับเก็บ URL ของ PDF
  
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

  // แปลงชื่อเอกสารเป็นภาษาไทย
  const getDocumentDisplayName = (name) => {
    const upper = (name || '').toUpperCase();
    if (upper === 'CS05') return 'คำร้องขอฝึกงาน (คพ.05)';
    if (upper === 'ACCEPTANCE_LETTER') return 'หนังสือตอบรับการฝึกงาน';
    return name || 'ไม่ระบุ';
  };

  // Render Compact Header Card
  const renderHeaderCard = (data) => {
    const displayName = getDocumentDisplayName(data.documentName);
    const submittedAt = data.submittedAt || data.submitted_at || data.created_at;
    const fileName = data.filePath ? data.filePath.split('\\').pop() : null;
    const fileSizeMB = data.fileSize ? (data.fileSize / 1024 / 1024) : null;

    return (
      <Card 
        size="small"
        style={{ marginBottom: 16, background: '#fafafa' }}
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          {/* ซ้าย: ข้อมูลเอกสาร */}
          <Col xs={24} lg={14}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space align="center" size={12}>
                <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Text strong style={{ fontSize: 16 }}>{displayName}</Text>
                {renderStatus(data.status)}
              </Space>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="วันที่ส่ง">
                  <Text style={{ fontSize: 13 }}>{formatDateTime(submittedAt)}</Text>
                </Descriptions.Item>
                {fileName && (
                  <>
                    <Descriptions.Item label="ไฟล์">
                      <Text style={{ fontSize: 13 }} ellipsis>{fileName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="ขนาด">
                      <Text style={{ fontSize: 13 }}>
                        {fileSizeMB ? `${fileSizeMB.toFixed(2)} MB` : 'ไม่ระบุ'}
                      </Text>
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </Space>
          </Col>
          
          {/* ขวา: ปุ่มดำเนินการ */}
          <Col xs={24} lg={10} style={{ textAlign: 'right' }}>
            <Space wrap>
              {data.filePath && (
                <>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handleViewPDF}
                    size="large"
                  >
                    ดูเอกสาร PDF
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(`/api/admin/documents/${data.documentId}/download`, fileName)}
                    size="large"
                  >
                    ดาวน์โหลด
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>

        {/* หมายเหตุ (ถ้ามี) */}
        {data.reviewComment && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Alert
              type="info"
              message="หมายเหตุจากการตรวจสอบ"
              description={data.reviewComment}
              showIcon
            />
          </>
        )}
      </Card>
    );
  };

  // Render Main Content - รวมทุกอย่างในหน้าเดียว
  const renderDetailSection = () => {
    if (!details) return null;

    const data = details.data || details;
    const isCS05 = data.documentName === 'CS05' && data.documentType === 'INTERNSHIP';

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Header Card - ข้อมูลสรุป + Action Buttons */}
        {renderHeaderCard(data)}

        {/* Main Content Card - แสดงข้อมูลที่นักศึกษากรอก */}
        <Card 
          title={
            <Space>
              <FileTextOutlined />
              <Text strong>
                {isCS05 ? 'รายละเอียดตามแบบฟอร์ม คพ.05' : 'รายละเอียดเอกสาร'}
              </Text>
              {isCS05 && <Badge status="processing" text="ตรวจสอบความถูกต้อง" />}
            </Space>
          }
          size="small"
        >
          {isCS05 ? (
            // แสดง CS05 Preview เต็มหน้า
            <CS05Preview data={data} />
          ) : (
            // แสดงข้อมูลเอกสารทั่วไป
            renderOtherDocumentDetails(data)
          )}
        </Card>

        {/* Additional Files (ถ้ามี) */}
        {data.files && data.files.length > 0 && (
          <Card title="ไฟล์แนบเพิ่มเติม" size="small">
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
          </Card>
        )}
      </Space>
    );
  };

  // Render details สำหรับเอกสารที่ไม่ใช่ CS05
  const renderOtherDocumentDetails = (data) => {
    return (
      <div style={{ padding: 16 }}>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="ชื่อเอกสาร">
            {getDocumentDisplayName(data.documentName)}
          </Descriptions.Item>
          <Descriptions.Item label="ประเภท">
            {data.documentType || 'ไม่ระบุ'}
          </Descriptions.Item>
          <Descriptions.Item label="วันที่ส่ง">
            {formatDateTime(data.submittedAt || data.submitted_at || data.created_at)}
          </Descriptions.Item>
          {data.description && (
            <Descriptions.Item label="คำอธิบาย">
              {data.description}
            </Descriptions.Item>
          )}
        </Descriptions>
        
        {!data.filePath && (
          <Alert
            type="warning"
            message="ไม่พบไฟล์แนบ"
            description="เอกสารนี้ยังไม่มีไฟล์แนบ"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>
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
      title={
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ fontSize: 18 }}>ตรวจสอบเอกสาร</Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button size="large" onClick={onClose}>ปิด</Button>
        </div>
      }
      centered
      width="95%"
      styles={{ 
        body: { 
          maxHeight: '85vh', 
          overflow: 'auto', 
          padding: '16px 24px',
          background: '#f5f5f5'
        } 
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 400,
          background: '#fff',
          borderRadius: 8
        }}>
          <Spin size="large" tip="กำลังโหลดข้อมูลเอกสาร...">
            <div style={{ width: 200, height: 200 }} />
          </Spin>
        </div>
      ) : (
        renderDetailSection()
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