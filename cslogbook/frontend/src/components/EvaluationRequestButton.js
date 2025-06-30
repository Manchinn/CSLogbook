import React, { useEffect, useMemo } from 'react';
import { Button, Alert, Space, Typography, Tooltip, Progress } from 'antd';
import { 
  SendOutlined, 
  InfoCircleOutlined, 
  StopOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import useEvaluationStatus from '../hooks/useEvaluationStatus';

const { Text } = Typography;

const EvaluationRequestButton = ({ documentId, onEvaluationSent, totalApprovedHours }) => {
  const { 
    loading, 
    sending, 
    evaluationData, 
    internshipCriteria, 
    sendEvaluationRequest 
  } = useEvaluationStatus();

  // ✅ ย้าย useMemo ไปไว้ด้านบนสุด เพื่อหลีกเลี่ยง conditional hook calls
  const canSendEvaluation = useMemo(() => {
    // ตรวจสอบข้อมูลพื้นฐานก่อน
    if (!evaluationData) {
      return false;
    }

    const conditions = {
      hasEvaluationData: !!evaluationData,
      canSendFromData: evaluationData?.canSendEvaluation === true,
      notificationEnabled: evaluationData?.notificationEnabled === true,
      criteriaCompleted: internshipCriteria?.isCompleted === true,
      // ✅ ใช้ totalApprovedHours จาก props เป็นหลัก หรือจาก internshipCriteria
      hoursSufficient: (totalApprovedHours || internshipCriteria?.totalApprovedHours || 0) >= 240
    };

    console.log('🔍 Send Evaluation Conditions:', conditions);

    return conditions.hasEvaluationData && 
           conditions.notificationEnabled && 
           conditions.hoursSufficient;
  }, [evaluationData, internshipCriteria, totalApprovedHours]);

  // ✅ คำนวณชั่วโมงปัจจุบันด้วย useMemo
  const currentHours = useMemo(() => {
    return totalApprovedHours || internshipCriteria?.totalApprovedHours || 0;
  }, [totalApprovedHours, internshipCriteria?.totalApprovedHours]);

  // ✅ คำนวณเปอร์เซ็นต์ความคืบหน้าด้วย useMemo
  const progressPercentage = useMemo(() => {
    const requiredHours = 240;
    return Math.min((currentHours / requiredHours) * 100, 100);
  }, [currentHours]);

  // ✅ เพิ่มการ debug ข้อมูล
  useEffect(() => {
    console.log('🔍 EvaluationRequestButton Debug:', {
      evaluationData,
      internshipCriteria,
      totalApprovedHours,
      currentHours,
      canSendEvaluation,
      timestamp: new Date().toISOString()
    });
  }, [evaluationData, internshipCriteria, totalApprovedHours, currentHours, canSendEvaluation]);

  // ✅ ฟังก์ชันจัดการการส่งแบบประเมิน
  const handleSendEvaluation = async () => {
    console.log('🚀 Attempting to send evaluation:', {
      documentId,
      canSendEvaluation,
      evaluationData,
      internshipCriteria
    });

    const result = await sendEvaluationRequest(documentId);
    
    console.log('📤 Send evaluation result:', result);
    
    // เรียก callback ถ้าส่งสำเร็จ
    if (result?.success && onEvaluationSent) {
      onEvaluationSent();
    }
  };

  // ✅ แสดงข้อมูล Debug ใน Development (ย้ายมาไว้หลัง hooks)
  const debugInfo = useMemo(() => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return {
      evaluationData: {
        canSendEvaluation: evaluationData?.canSendEvaluation,
        notificationEnabled: evaluationData?.notificationEnabled,
        evaluationStatus: evaluationData?.evaluationStatus
      },
      internshipCriteria: {
        isCompleted: internshipCriteria?.isCompleted,
        totalApprovedHours: internshipCriteria?.totalApprovedHours
      },
      props: {
        totalApprovedHours,
        documentId
      },
      computed: {
        canSendEvaluation,
        currentHours,
        progressPercentage
      }
    };
  }, [evaluationData, internshipCriteria, totalApprovedHours, documentId, canSendEvaluation, currentHours, progressPercentage]);

  // แสดง loading state
  if (loading) {
    return (
      <Button loading disabled>
        กำลังโหลดข้อมูล...
      </Button>
    );
  }

  // แสดง error state ถ้าไม่มีข้อมูล
  if (!evaluationData) {
    return (
      <Alert
        type="warning"
        message="ไม่สามารถดึงข้อมูลสถานะการประเมินได้"
        description="กรุณาลองรีเฟรชหน้าเว็บใหม่"
        showIcon
      />
    );
  }

  // แสดง Alert เมื่อการแจ้งเตือนถูกปิด
  if (!evaluationData.notificationEnabled) {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {debugInfo && (
          <Alert
            type="info"
            message="🔍 Debug Information"
            description={
              <details>
                <summary>คลิกเพื่อดูรายละเอียด</summary>
                <pre style={{ 
                  fontSize: '12px', 
                  background: '#f5f5f5', 
                  padding: '8px',
                  marginTop: '8px',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            }
            closable
            showIcon
          />
        )}
        
        <Alert
          type="warning"
          message="การส่งคำขอประเมินผลถูกปิดชั่วคราว"
          description={
            <Space direction="vertical" size="small">
              <Text>
                ขณะนี้ระบบได้ปิดการแจ้งเตือนการประเมินผลชั่วคราว 
                จึงไม่สามารถส่งคำขอประเมินผลไปยังพี่เลี้ยงได้
              </Text>
              <Text type="secondary">
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                กรุณาติดต่อเจ้าหน้าที่หรือลองใหม่ในภายหลัง
              </Text>
              <Button 
                size="small" 
                onClick={() => window.location.reload()}
                style={{ marginTop: 8 }}
              >
                รีเฟรชหน้าเว็บ
              </Button>
            </Space>
          }
          showIcon
          icon={<StopOutlined />}
          style={{ marginBottom: 16 }}
        />
        
        <Tooltip title="การแจ้งเตือนถูกปิดโดยผู้ดูแลระบบ">
          <Button 
            disabled 
            icon={<StopOutlined />}
            style={{ width: '100%' }}
          >
            ไม่สามารถส่งคำขอประเมินได้ในขณะนี้
          </Button>
        </Tooltip>
      </Space>
    );
  }

  // ✅ แสดงสถานะความคืบหน้าการฝึกงาน
  const renderInternshipProgress = () => {
    const requiredHours = 240;

    if (currentHours < requiredHours) {
      return (
        <Alert
          type="info"
          message="สถานะการฝึกงาน"
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                ต้องบันทึกการฝึกงานให้ครบ {requiredHours} ชั่วโมง เพื่อส่งแบบประเมินให้พี่เลี้ยง
              </Text>
              <div style={{ margin: '8px 0' }}>
                <Progress 
                  percent={progressPercentage} 
                  format={() => `${currentHours}/${requiredHours} ชม.`}
                  status={currentHours >= requiredHours ? 'success' : 'active'}
                  size="small"
                />
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 เมื่อบันทึกการฝึกงานครบแล้ว จะสามารถส่งแบบประเมินได้
              </Text>
            </Space>
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }

    return (
      <Alert
        type="success"
        message="ครบเกณฑ์การฝึกงานแล้ว"
        description={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text>บันทึกการฝึกงานครบ {currentHours} ชั่วโมง พร้อมส่งแบบประเมิน</Text>
          </Space>
        }
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  // แสดงสถานะต่างๆ ของการประเมิน
  const renderByStatus = () => {
    switch (evaluationData.evaluationStatus) {
      case 'completed':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            {renderInternshipProgress()}
            <Alert
              type="success"
              message="ประเมินผลการฝึกงานเรียบร้อยแล้ว"
              description="พี่เลี้ยงได้ทำการประเมินผลการฝึกงานของคุณเรียบร้อยแล้ว"
              showIcon
            />
          </Space>
        );
      
      case 'sent':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            {renderInternshipProgress()}
            <Alert
              type="info"
              message="ส่งแบบประเมินไปยังพี่เลี้ยงแล้ว"
              description={
                <Space direction="vertical" size="small">
                  <Text>ส่งไปยัง: {evaluationData.supervisorEmail}</Text>
                  {evaluationData.lastSentDate && (
                    <Text type="secondary">
                      ส่งเมื่อ: {new Date(evaluationData.lastSentDate).toLocaleDateString('th-TH')}
                    </Text>
                  )}
                </Space>
              }
              showIcon
            />
            
            {canSendEvaluation && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sending}
                onClick={handleSendEvaluation}
                style={{ width: '100%' }}
              >
                ส่งคำขอใหม่อีกครั้ง
              </Button>
            )}
          </Space>
        );
      
      case 'not_sent':
      default:
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            {renderInternshipProgress()}
            
            <Alert
              message="ส่งแบบประเมินให้พี่เลี้ยงของคุณ"
              description="เมื่อบันทึกการฝึกงานครบตามเกณฑ์แล้ว คุณสามารถส่งแบบประเมินไปยังพี่เลี้ยงผ่านอีเมลได้"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {canSendEvaluation ? (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sending}
                onClick={handleSendEvaluation}
                style={{ width: '100%' }}
                size="large"
              >
                ส่งคำขอประเมินผลไปยังพี่เลี้ยง
              </Button>
            ) : (
              <Tooltip 
                title={
                  currentHours < 240
                    ? `ต้องบันทึกการฝึกงานให้ครบ 240 ชั่วโมง (ปัจจุบัน: ${currentHours} ชั่วโมง)`
                    : "ไม่สามารถส่งคำขอได้ในขณะนี้"
                }
              >
                <Button
                  disabled
                  icon={currentHours < 240 ? <ClockCircleOutlined /> : <StopOutlined />}
                  style={{ width: '100%' }}
                >
                  {currentHours < 240
                    ? "ยังไม่ครบเกณฑ์การฝึกงาน" 
                    : "ไม่สามารถส่งคำขอได้"
                  }
                </Button>
              </Tooltip>
            )}
          </Space>
        );
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      {renderByStatus()}
    </div>
  );
};

export default EvaluationRequestButton;