import React from 'react';
import { Card, Button, Alert, Timeline, Typography, Space } from 'antd';
import {
  SendOutlined, DownloadOutlined, ClockCircleOutlined,
  CheckCircleOutlined, FileProtectOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const CertificateStatusCard = ({ 
  status, 
  canRequest, 
  onSubmitRequest, 
  onDownload, 
  onPreview,           // ✅ เพิ่ม props ใหม่
  loading,
  downloadLoading,     // ✅ เพิ่ม props ใหม่
  previewLoading       // ✅ เพิ่ม props ใหม่
}) => {
  const renderContent = () => {
    switch (status) {
      case 'not_requested':
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <SendOutlined 
              style={{ fontSize: '64px', color: '#1890ff', marginBottom: 24 }} 
            />
            <Title level={3}>พร้อมส่งคำขอหนังสือรับรอง</Title>
            <Text style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: 24 }}>
              คุณผ่านเงื่อนไขทั้งหมดแล้ว กรุณากดปุ่มด้านล่างเพื่อส่งคำขอหนังสือรับรองการฝึกงาน
            </Text>
            
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={onSubmitRequest}
              loading={loading}
              disabled={!canRequest}
            >
              ส่งคำขอหนังสือรับรองการฝึกงาน
            </Button>

            <Alert
              message="หลังจากส่งคำขอแล้ว"
              description="เจ้าหน้าที่ภาควิชาจะตรวจสอบเอกสารและออกหนังสือรับรองภายใน 3-5 วันทำการ"
              type="info"
              showIcon
              style={{ marginTop: 24, textAlign: 'left' }}
            />
          </div>
        );

      case 'pending':
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <ClockCircleOutlined 
              style={{ fontSize: '64px', color: '#faad14', marginBottom: 24 }} 
            />
            <Title level={3}>รอการออกหนังสือรับรองจากเจ้าหน้าที่ภาควิชา</Title>
            <Text style={{ fontSize: '16px', color: '#666' }}>
              คำขอของคุณได้รับการส่งเรียบร้อยแล้ว เจ้าหน้าที่ภาควิชากำลังตรวจสอบและออกหนังสือรับรอง
            </Text>

            <Timeline style={{ textAlign: 'left', marginTop: 32 }}>
              <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                <strong>ส่งคำขอหนังสือรับรอง</strong>
                <br />
                <Text type="secondary">เรียบร้อยแล้ว</Text>
              </Timeline.Item>
              
              <Timeline.Item color="blue" dot={<ClockCircleOutlined />}>
                <strong>เจ้าหน้าที่ภาควิชาตรวจสอบเอกสาร</strong>
                <br />
                <Text type="secondary">กำลังดำเนินการ...</Text>
              </Timeline.Item>
              
              <Timeline.Item color="gray">
                <strong>หนังสือรับรองพร้อมดาวน์โหลด</strong>
                <br />
                <Text type="secondary">รอการดำเนินการ</Text>
              </Timeline.Item>
            </Timeline>

            <Alert
              message="ระยะเวลาการดำเนินการ"
              description="โดยปกติใช้เวลาประมาณ 3-5 วันทำการ ระบบจะแจ้งเตือนทางอีเมลเมื่อหนังสือรับรองพร้อม"
              type="info"
              showIcon
              style={{ marginTop: 24 }}
            />
          </div>
        );

      case 'ready':
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircleOutlined 
              style={{ fontSize: '64px', color: '#52c41a', marginBottom: 24 }} 
            />
            <Title level={3} style={{ color: '#52c41a' }}>
              🎉 หนังสือรับรองการฝึกงานพร้อมแล้ว!
            </Title>
            <Text style={{ fontSize: '16px', color: '#666' }}>
              เจ้าหน้าที่ภาควิชาได้ออกหนังสือรับรองการฝึกงานเรียบร้อยแล้ว
              คุณสามารถดาวน์โหลดหรือดูตัวอย่างได้ทันที
            </Text>

            <Space direction="vertical" size="large" style={{ marginTop: 32 }}>
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={onDownload}
                loading={downloadLoading}  // ✅ ใช้ downloadLoading แทน loading
              >
                ดาวน์โหลดหนังสือรับรองการฝึกงาน
              </Button>
              
              <Button
                type="default"
                icon={<FileProtectOutlined />}
                onClick={onPreview}        // ✅ ใช้ onPreview แทน window.open
                loading={previewLoading}   // ✅ เพิ่ม previewLoading
              >
                แสดงตัวอย่างหนังสือรับรอง
              </Button>
            </Space>

            <Alert
              message="การใช้งานหนังสือรับรอง"
              description="หนังสือรับรองสามารถใช้เป็นหลักฐานการฝึกงานสำหรับการสมัครงานหรือศึกษาต่อได้"
              type="success"
              showIcon
              style={{ marginTop: 24, textAlign: 'left' }}
            />
          </div>
        );

      default:
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Text>ไม่สามารถแสดงสถานะได้</Text>
          </div>
        );
    }
  };

  return (
    <Card>
      <Title level={4}>📋 สถานะหนังสือรับรองการฝึกงาน</Title>
      {renderContent()}
    </Card>
  );
};

export default CertificateStatusCard;