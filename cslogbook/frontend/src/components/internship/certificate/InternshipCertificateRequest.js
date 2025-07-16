import React, { useState, useEffect } from 'react';
import {
  Card, Steps, Alert, Button, Typography, Space, Divider,
  Timeline, Tag, Progress, Spin, message
} from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, FileProtectOutlined,
  UserOutlined, FileDoneOutlined, DownloadOutlined, SendOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

// ใช้ hook จากโฟลเดอร์ hooks
import useCertificateStatus from '../../../hooks/useCertificateStatus';

// ใช้ components ที่มีอยู่แล้ว
import CertificateStatusCard from './components/CertificateStatusCard';
import SupervisorEvaluationStatus from './components/SupervisorEvaluationStatus';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const InternshipCertificateRequest = () => {
  const { userData } = useAuth();
  const [requestLoading, setRequestLoading] = useState(false);
  
  // ใช้ custom hook สำหรับจัดการสถานะ
  const {
    certificateStatus,
    supervisorEvaluationStatus,
    internshipSummaryStatus,
    totalHours,
    loading,
    error,
    canRequestCertificate,
    refreshStatus,
    submitCertificateRequest,
    downloadCertificate,
    previewCertificate
  } = useCertificateStatus();

  useEffect(() => {
    checkInternshipCompletion();
  }, []);

  const checkInternshipCompletion = async () => {
    try {
      await refreshStatus();
    } catch (error) {
      console.error('Error checking internship completion:', error);
      message.error('ไม่สามารถตรวจสอบสถานะการฝึกงานได้');
    }
  };

  const handleSubmitCertificateRequest = async () => {
    try {
      setRequestLoading(true);
      const result = await submitCertificateRequest();
      
      if (result.success) {
        message.success('ส่งคำขอหนังสือรับรองการฝึกงานเรียบร้อยแล้ว');
        await refreshStatus(); // รีเฟรชสถานะหลังส่งคำขอ
      } else {
        message.error(result.message || 'ไม่สามารถส่งคำขอได้');
      }
    } catch (error) {
      console.error('Error submitting certificate request:', error);
      message.error('เกิดข้อผิดพลาดในการส่งคำขอ');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      await downloadCertificate();
      message.success('ดาวน์โหลดหนังสือรับรองเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      message.error('ไม่สามารถดาวน์โหลดหนังสือรับรองได้');
    }
  };

  const handlePreviewCertificate = async () => {
    try {
      await previewCertificate();
      message.info('เปิดตัวอย่างหนังสือรับรองในแท็บใหม่');
    } catch (error) {
      console.error('Error previewing certificate:', error);
      message.error('ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้');
    }
  };

  const getProgressPercentage = () => {
    let completed = 0;
    if (totalHours >= 240) completed += 33;
    if (supervisorEvaluationStatus === 'completed') completed += 33;
    if (internshipSummaryStatus === 'submitted') completed += 34;
    return completed;
  };

  const getCurrentStep = () => {
    if (certificateStatus === 'ready') return 2;
    if (certificateStatus === 'pending') return 1;
    return 0;
  };

  // แสดง loading state
  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <Text style={{ display: 'block', marginTop: 16 }}>
          กำลังตรวจสอบสถานะการฝึกงาน...
        </Text>
      </Card>
    );
  }

  // แสดง error state
  if (error) {
    return (
      <Card style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <Alert
          message="เกิดข้อผิดพลาด"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              โหลดใหม่
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        📜 ขอหนังสือรับรองการฝึกงาน
      </Title>

      {/* Debug Information - ลบออกใน production */}
      {process.env.NODE_ENV === 'development' && (
        <Card style={{ marginBottom: 24, backgroundColor: '#f6ffed' }}>
          <Title level={5}>🔧 Debug Information</Title>
          <Text>
            Status: {certificateStatus} | Hours: {totalHours} | 
            Evaluation: {supervisorEvaluationStatus} | 
            Summary: {internshipSummaryStatus} | 
            Can Request: {canRequestCertificate ? 'Yes' : 'No'}
          </Text>
        </Card>
      )}

      {/* ส่วนแสดงความคืบหน้าโดยรวม */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>📊 ความคืบหน้าการขอหนังสือรับรอง</Title>
        
        <Progress 
          percent={getProgressPercentage()} 
          status={certificateStatus === 'ready' ? 'success' : 'active'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          style={{ marginBottom: 24 }}
        />

        <Steps size="small" current={getCurrentStep()}>
          <Step 
            title="ตรวจสอบความพร้อม" 
            description="ตรวจสอบชั่วโมงฝึกงานและการประเมิน"
            icon={totalHours >= 240 && supervisorEvaluationStatus === 'completed' ? 
                  <CheckCircleOutlined /> : <ClockCircleOutlined />}
          />
          <Step 
            title="ส่งคำขอหนังสือรับรอง" 
            description="ส่งคำขอให้เจ้าหน้าที่ภาควิชา"
            icon={certificateStatus === 'pending' || certificateStatus === 'ready' ? 
                  <CheckCircleOutlined /> : <SendOutlined />}
          />
          <Step 
            title="ดาวน์โหลดหนังสือรับรอง" 
            description="หนังสือรับรองพร้อมดาวน์โหลด"
            icon={certificateStatus === 'ready' ? 
                  <FileProtectOutlined /> : <ClockCircleOutlined />}
          />
        </Steps>
      </Card>

      {/* ส่วนแสดงสถานะการประเมินจากพี่เลี้ยง */}
      <SupervisorEvaluationStatus 
        status={supervisorEvaluationStatus}
        totalHours={totalHours}
        summaryStatus={internshipSummaryStatus}
      />

      {/* ส่วนแสดงสถานะหนังสือรับรอง */}
      <CertificateStatusCard 
        status={certificateStatus}
        canRequest={canRequestCertificate}
        onSubmitRequest={handleSubmitCertificateRequest}
        onDownload={handleDownloadCertificate}
        onPreview={handlePreviewCertificate}
        loading={requestLoading}
      />

      {/* ข้อมูลสำคัญ */}
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>📋 ข้อมูลสำคัญ</Title>
        <Alert
          message="เงื่อนไขการขอหนังสือรับรองการฝึกงาน"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>ต้องมีชั่วโมงฝึกงานครบ 240 ชั่วโมง</li>
              <li>ต้องได้รับการประเมินจากพี่เลี้ยงแล้ว</li>
              <li>ต้องส่งรายงานสรุปผลการฝึกงานแล้ว</li>
              <li>เจ้าหน้าที่ภาควิชาใช้เวลาตรวจสอบประมาณ 3-5 วันทำการ</li>
            </ul>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* ปุ่มรีเฟรชข้อมูล */}
      <Card style={{ marginTop: 24, textAlign: 'center' }}>
        <Button onClick={refreshStatus} loading={loading}>
          รีเฟรชข้อมูลสถานะ
        </Button>
      </Card>
    </div>
  );
};

export default InternshipCertificateRequest;