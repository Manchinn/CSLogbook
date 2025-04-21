import React, { useState, useEffect } from 'react';
import { Modal, Card, Typography, Row, Col, Divider, Button, Space, List, Tag, Spin, message, Avatar } from 'antd';
import { FilePdfOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
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
      .then((data) => {
        console.log('Document Details:', data); // ตรวจสอบข้อมูลที่ได้รับจาก API
        setDetails(data);
      })
      .catch((error) => {
        console.error('Error fetching document details:', error);
        setError(error);
      })
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
        title={<Title level={4}>คำร้องขอฝึกงาน (CS05)</Title>} 
        variant="outlined"
        className="detail-card"
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Paragraph><strong>ชื่อผู้ส่ง:</strong> {details.student_name}</Paragraph>
            <Paragraph><strong>รหัสนักศึกษา:</strong> {details.student_code}</Paragraph>
            <Paragraph><strong>ชั้นปี:</strong> {details.year}</Paragraph>
            <Paragraph><strong>หน่วยกิตสะสมทั้งหมด:</strong> {details.credit}</Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Paragraph><strong>ชื่อบริษัท/หน่วยงาน:</strong> {details.company_name || 'ไม่ระบุ'}</Paragraph>
            <Paragraph><strong>สถานที่:</strong> {details.location || 'ไม่ระบุ'}</Paragraph>
            <Paragraph>
              <strong>ระยะเวลาฝึกงาน:</strong> 
              {details.internship_period 
                ? `${moment(details.internship_period.start_date).format('DD MMMM YYYY')} - ${moment(details.internship_period.end_date).format('DD MMMM YYYY')}`
                : 'ไม่ระบุ'}
            </Paragraph>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        <Title level={5}>หมายเหตุ</Title>
        <ul>
          {details.notes && details.notes.length > 0 ? (
            details.notes.map((note, index) => <li key={index}>{note}</li>)
          ) : (
            <Text type="secondary">ไม่มีหมายเหตุ</Text>
          )}
        </ul>

        <Divider style={{ margin: '12px 0' }} />

        <Title level={5}>ไฟล์แนบ</Title>
        {details.files && details.files.length > 0 ? (
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
        ) : (
          <Text type="secondary">ไม่มีไฟล์แนบ</Text>
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
      style={{ maxHeight: '80vh', overflow: 'auto', padding: '20px' }}
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
        </div>
      )}
    </Modal>
  );
};

export default DocumentDetails;