import React from 'react';
import { Card, Timeline, Tag, Alert, Typography, Space, Statistic, Row, Col } from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, UserOutlined,
  FileDoneOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const SupervisorEvaluationStatus = ({ 
  status, 
  totalHours, 
  summaryStatus 
}) => {
  const getStatusColor = (condition) => {
    return condition ? 'success' : 'default';
  };

  const getStatusIcon = (condition) => {
    return condition ? <CheckCircleOutlined /> : <ClockCircleOutlined />;
  };

  const isHoursComplete = totalHours >= 240;
  const isEvaluationComplete = status === 'completed';
  const isSummarySubmitted = summaryStatus === 'submitted';
  const allRequirementsMet = isHoursComplete && isEvaluationComplete && isSummarySubmitted;

  return (
    <Card style={{ marginBottom: 24 }}>
      <Title level={4}>🎯 สถานะการประเมินและข้อกำหนด</Title>

      {/* สถิติโดยรวม */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Statistic
            title="ชั่วโมงฝึกงาน"
            value={totalHours}
            suffix="/ 240 ชั่วโมง"
            prefix={getStatusIcon(isHoursComplete)}
            valueStyle={{ color: isHoursComplete ? '#3f8600' : '#cf1322' }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="การประเมินพี่เลี้ยง"
            value={isEvaluationComplete ? 'เสร็จสิ้น' : 'รอดำเนินการ'}
            prefix={getStatusIcon(isEvaluationComplete)}
            valueStyle={{ color: isEvaluationComplete ? '#3f8600' : '#cf1322' }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="รายงานสรุปผล"
            value={isSummarySubmitted ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}
            prefix={getStatusIcon(isSummarySubmitted)}
            valueStyle={{ color: isSummarySubmitted ? '#3f8600' : '#cf1322' }}
          />
        </Col>
      </Row>

      {/* Timeline รายละเอียด */}
      <Timeline>
        <Timeline.Item 
          color={getStatusColor(isHoursComplete)}
          dot={getStatusIcon(isHoursComplete)}
        >
          <Space direction="vertical">
            <Text strong>
              ชั่วโมงฝึกงานครบถ้วน (240 ชั่วโมง)
            </Text>
            <Tag color={isHoursComplete ? 'success' : 'warning'}>
              ปัจจุบัน: {totalHours} ชั่วโมง
            </Tag>
            {!isHoursComplete && (
              <Text type="secondary">
                ยังขาดอีก {240 - totalHours} ชั่วโมง
              </Text>
            )}
          </Space>
        </Timeline.Item>

        <Timeline.Item 
          color={getStatusColor(isEvaluationComplete)}
          dot={getStatusIcon(isEvaluationComplete)}
        >
          <Space direction="vertical">
            <Text strong>
              การประเมินผลจากพี่เลี้ยง
            </Text>
            <Tag color={isEvaluationComplete ? 'success' : 'processing'}>
              {isEvaluationComplete ? 'ประเมินแล้ว' : 'รอการประเมิน'}
            </Tag>
            {!isEvaluationComplete && (
              <Text type="secondary">
                กรุณาติดต่อพี่เลี้ยงเพื่อทำการประเมินในระบบ
              </Text>
            )}
          </Space>
        </Timeline.Item>

        <Timeline.Item 
          color={getStatusColor(isSummarySubmitted)}
          dot={getStatusIcon(isSummarySubmitted)}
        >
          <Space direction="vertical">
            <Text strong>
              รายงานสรุปผลการฝึกงาน
            </Text>
            <Tag color={isSummarySubmitted ? 'success' : 'default'}>
              {isSummarySubmitted ? 'ส่งแล้ว' : 'ยังไม่ส่ง'}
            </Tag>
            {!isSummarySubmitted && (
              <Text type="secondary">
                กรุณาส่งรายงานสรุปผลผ่านเมนู "สรุปผลการฝึกงาน"
              </Text>
            )}
          </Space>
        </Timeline.Item>
      </Timeline>

      {/* แสดง Alert ตามสถานะ */}
      {allRequirementsMet ? (
        <Alert
          message="พร้อมขอหนังสือรับรองการฝึกงาน!"
          description="คุณผ่านเงื่อนไขทั้งหมดแล้ว สามารถส่งคำขอหนังสือรับรองได้"
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      ) : (
        <Alert
          message="ยังไม่พร้อมขอหนังสือรับรอง"
          description="กรุณาดำเนินการให้ครบถ้วนตามเงื่อนไขข้างต้นก่อนส่งคำขอ"
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      )}
    </Card>
  );
};

export default SupervisorEvaluationStatus;