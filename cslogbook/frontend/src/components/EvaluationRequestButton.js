import React from 'react';
import { Button, Alert, Space, Typography, Tooltip } from 'antd';
import { SendOutlined, InfoCircleOutlined, StopOutlined } from '@ant-design/icons';
import useEvaluationStatus from '../hooks/useEvaluationStatus';

const { Text } = Typography;

const EvaluationRequestButton = ({ documentId, onEvaluationSent }) => {
  const { loading, sending, evaluationData, sendEvaluationRequest } = useEvaluationStatus();

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

  const handleSendEvaluation = async () => {
    const result = await sendEvaluationRequest(documentId);
    
    // เรียก callback ถ้าส่งสำเร็จ
    if (result.success && onEvaluationSent) {
      onEvaluationSent();
    }
  };

  // แสดง Alert เมื่อการแจ้งเตือนถูกปิด
  if (!evaluationData.notificationEnabled) {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* ✅ เพิ่มการแสดงข้อมูล debug */}
        {process.env.NODE_ENV === 'development' && (
          <Alert
            type="info"
            message="Debug Information"
            description={
              <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px' }}>
                {JSON.stringify(evaluationData, null, 2)}
              </pre>
            }
            closable
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
              {/* ✅ เพิ่มปุ่มสำหรับรีเฟรชข้อมูล */}
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

  // แสดงสถานะต่างๆ ของการประเมิน
  const renderByStatus = () => {
    switch (evaluationData.evaluationStatus) {
      case 'completed':
        return (
          <Alert
            type="success"
            message="ประเมินผลการฝึกงานเรียบร้อยแล้ว"
            description="พี่เลี้ยงได้ทำการประเมินผลการฝึกงานของคุณเรียบร้อยแล้ว"
            showIcon
          />
        );
      
      case 'sent':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              type="info"
              message="ส่งแบบประเมินไปยังพี่เลี้ยงแล้ว"
              description={
                <Space direction="vertical" size="small">
                  <Text>ส่งไปยัง: {evaluationData.supervisorEmail}</Text>
                  <Text type="secondary">
                    ส่งเมื่อ: {new Date(evaluationData.lastSentDate).toLocaleDateString('th-TH')}
                  </Text>
                </Space>
              }
              showIcon
            />
            
            {evaluationData.canSendEvaluation && (
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
            <Alert
              message="ส่งแบบประเมินให้พี่เลี้ยงของคุณ"
              description="เมื่อคุณใกล้จะสิ้นสุดการฝึกงาน คุณสามารถส่งแบบประเมินไปยังพี่เลี้ยงผ่านอีเมลได้ที่นี่"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {evaluationData.canSendEvaluation ? (
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
              <Tooltip title="ไม่สามารถส่งคำขอได้ในขณะนี้">
                <Button
                  disabled
                  icon={<StopOutlined />}
                  style={{ width: '100%' }}
                >
                  ไม่สามารถส่งคำขอได้
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