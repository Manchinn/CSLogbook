import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Spin, Alert, Descriptions, Card, Row, Col, 
  Statistic, Tag, Typography, Space, Empty, Divider
} from 'antd';
import {
  BarChartOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import workflowStepService from 'services/admin/workflowStepService';

const { Text } = Typography;

/**
 * Modal สำหรับแสดงสถิติการใช้งานขั้นตอน Workflow
 */
const StepUsageModal = ({ visible, step, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const [error, setError] = useState(null);

  // โหลดข้อมูลสถิติเมื่อเปิด modal
  const fetchUsageStats = useCallback(async () => {
    if (!step?.stepId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await workflowStepService.getStepUsageStats(step.stepId);
      
      if (response.success) {
        setUsageData(response.data);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [step?.stepId]);

  useEffect(() => {
    if (visible && step?.stepId) {
      fetchUsageStats();
    } else {
      // รีเซ็ตข้อมูลเมื่อปิด modal
      setUsageData(null);
      setError(null);
    }
  }, [visible, step, fetchUsageStats]);

  /**
   * ฟังก์ชันแปลงประเภท workflow เป็นภาษาไทย
   */
  const getWorkflowTypeLabel = (type) => {
    const types = {
      'internship': 'การฝึกงาน',
      'project': 'โครงงานพิเศษ'
    };
    return types[type] || type;
  };

  /**
   * ฟังก์ชันกำหนดสีสำหรับสถานะการใช้งาน
   */
  const getUsageStatusColor = (count) => {
    if (count === 0) return 'default';
    if (count <= 5) return 'green';
    if (count <= 15) return 'orange';
    return 'red';
  };

  /**
   * ฟังก์ชันกำหนดข้อความสถานะการใช้งาน
   */
  const getUsageStatusText = (count) => {
    if (count === 0) return 'ไม่มีการใช้งาน';
    if (count <= 5) return 'การใช้งานน้อย';
    if (count <= 15) return 'การใช้งานปานกลาง';
    return 'การใช้งานสูง';
  };

  /**
   * ฟังก์ชันกำหนดไอคอนสำหรับสถานะ
   */
  const getUsageIcon = (count) => {
    if (count === 0) return <CheckCircleOutlined />;
    if (count <= 15) return <ClockCircleOutlined />;
    return <ExclamationCircleOutlined />;
  };

  return (
    <Modal
      title={
        <Space>
          <BarChartOutlined />
          สถิติการใช้งานขั้นตอน Workflow
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnHidden={true}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">กำลังโหลดข้อมูลสถิติ...</Text>
          </div>
        </div>
      ) : error ? (
        <Alert
          message="เกิดข้อผิดพลาด"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : !step ? (
        <Empty
          description="ไม่มีข้อมูลขั้นตอนที่เลือก"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div>
          {/* ข้อมูลขั้นตอน */}
          <Card 
            size="small" 
            title={
              <Space>
                <Tag color="blue">
                  {getWorkflowTypeLabel(step.workflowType)}
                </Tag>
                ข้อมูลขั้นตอน
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="รหัสขั้นตอน">
                <Text code>{step.stepKey}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="ชื่อขั้นตอน">
                <Text strong>{step.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="ลำดับขั้นตอน">
                <Tag color="blue">{step.stepOrder}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="คำอธิบาย">
                <Text>{step.descriptionTemplate}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Divider />

          {/* สถิติการใช้งาน */}
          <Card 
            size="small" 
            title={
              <Space>
                <CheckCircleOutlined />
                สถิติการใช้งาน
              </Space>
            }
          >
            {usageData ? (
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title="นักศึกษาที่อยู่ในขั้นตอนนี้"
                        value={usageData.usage?.currentStudents || 0}
                        prefix={getUsageIcon(usageData.usage?.currentStudents || 0)}
                        suffix="คน"
                        valueStyle={{ 
                          color: usageData.usage?.currentStudents > 0 ? '#1890ff' : '#8c8c8c' 
                        }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: 8 }}>
                          สถานะการใช้งาน
                        </div>
                        <Tag 
                          color={getUsageStatusColor(usageData.usage?.currentStudents || 0)}
                          style={{ fontSize: '14px', padding: '4px 12px' }}
                        >
                          {getUsageStatusText(usageData.usage?.currentStudents || 0)}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* ข้อมูลเพิ่มเติม */}
                <Card size="small" title="รายละเอียดเพิ่มเติม">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="วันที่สร้างขั้นตอน">
                      <Space>
                        <ClockCircleOutlined />
                        <Text>
                          {usageData.step?.createdAt 
                            ? new Date(usageData.step.createdAt).toLocaleDateString('th-TH')
                            : 'ไม่ระบุ'
                          }
                        </Text>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="อัปเดตล่าสุด">
                      <Space>
                        <ClockCircleOutlined />
                        <Text>
                          {usageData.step?.updatedAt 
                            ? new Date(usageData.step.updatedAt).toLocaleDateString('th-TH')
                            : 'ไม่ระบุ'
                          }
                        </Text>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* คำแนะนำ */}
                {usageData.usage?.currentStudents > 0 && (
                  <Alert
                    message="คำเตือน"
                    description={`มีนักศึกษา ${usageData.usage.currentStudents} คนกำลังอยู่ในขั้นตอนนี้ การแก้ไขหรือลบขั้นตอนนี้อาจส่งผลกระทบต่อนักศึกษาเหล่านั้น`}
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}

                {usageData.usage?.currentStudents === 0 && (
                  <Alert
                    message="ข้อมูล"
                    description="ไม่มีนักศึกษาอยู่ในขั้นตอนนี้ในขณะนี้ คุณสามารถแก้ไขหรือลบขั้นตอนนี้ได้อย่างปลอดภัย"
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </div>
            ) : (
              <Empty
                description="ไม่มีข้อมูลสถิติการใช้งาน"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default StepUsageModal;