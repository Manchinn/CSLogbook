import React from 'react';
import { Card, Timeline, Tag, Alert, Typography, Space, Statistic, Row, Col } from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// เพิ่มความสามารถแสดงคะแนนการประเมิน (ถ้ามี) หรือแสดงเพียงสถานะผ่าน/รอ
// Props ใหม่:
// - evaluationScore: (number) คะแนนรวมที่คำนวณแล้ว (0-100)
// - passScore: (number) เกณฑ์ผ่าน (ค่าเริ่มต้น 60)
// - showScore: (boolean) บังคับให้แสดงเป็นคะแนน (ถ้ามีคะแนน)
// - hideStatusText: (boolean) ซ่อนข้อความรายละเอียดใต้คะแนน
const SupervisorEvaluationStatus = ({
  status,
  totalHours,
  evaluationScore = null, // คะแนนรวม (อาจยังไม่ได้ส่งมา)
  passScore = 70,
  showScore = true,
  hideStatusText = false,
}) => {
  const getStatusColor = (condition) => {
    return condition ? 'success' : 'default';
  };

  const getStatusIcon = (condition) => {
    return condition ? <CheckCircleOutlined /> : <ClockCircleOutlined />;
  };

  const isHoursComplete = totalHours >= 240;
  const hasScore = typeof evaluationScore === 'number' && evaluationScore >= 0;
  const isEvaluationPassed = hasScore
    ? evaluationScore >= passScore
    : status === 'completed'; // fallback เดิม
  // เกณฑ์สำเร็จ: ชั่วโมงครบ + ประเมินผ่าน (ไม่สน summary แล้ว)
  const allRequirementsMet = isHoursComplete && isEvaluationPassed;

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
          {showScore && hasScore ? (
            <Statistic
              title={`คะแนนการประเมิน (ผ่าน ${passScore})`}
              value={evaluationScore}
              suffix={`/ ${100}`}
              prefix={getStatusIcon(isEvaluationPassed)}
              valueStyle={{ color: isEvaluationPassed ? '#3f8600' : '#cf1322' }}
            />
          ) : (
            <Statistic
              title="การประเมินพี่เลี้ยง"
              value={isEvaluationPassed ? 'ผ่านเกณฑ์' : 'รอดำเนินการ'}
              prefix={getStatusIcon(isEvaluationPassed)}
              valueStyle={{ color: isEvaluationPassed ? '#3f8600' : '#cf1322' }}
            />
          )}
        </Col>
  {/* ตัดคอลัมน์รายงานสรุปผลออก */}
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
          color={getStatusColor(isEvaluationPassed)}
          dot={getStatusIcon(isEvaluationPassed)}
        >
          <Space direction="vertical">
            <Text strong>การประเมินผลจากพี่เลี้ยง</Text>
            {showScore && hasScore ? (
              <Tag color={isEvaluationPassed ? 'success' : 'error'}>
                คะแนน {evaluationScore}/{100} {isEvaluationPassed ? '(ผ่าน)' : '(ไม่ผ่าน)'}
              </Tag>
            ) : (
              <Tag color={isEvaluationPassed ? 'success' : 'processing'}>
                {isEvaluationPassed ? 'ประเมินแล้ว / ผ่านเกณฑ์' : 'รอการประเมิน'}
              </Tag>
            )}
            {!hideStatusText && !isEvaluationPassed && (
              <Text type="secondary">
                {hasScore
                  ? `ยังขาด ${passScore - evaluationScore} คะแนนถึงจะผ่าน`
                  : 'กรุณาติดต่อพี่เลี้ยงเพื่อทำการประเมินในระบบ'}
              </Text>
            )}
          </Space>
        </Timeline.Item>

  {/* ตัด timeline รายงานสรุปผลออก */}
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