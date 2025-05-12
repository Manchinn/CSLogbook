import React from 'react';
import { Card, Row, Col, Progress, Statistic, Divider, Typography } from 'antd';
import { 
  SafetyCertificateOutlined, 
  CarryOutOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ScheduleOutlined
} from '@ant-design/icons';

// นำเข้า CSS
import '../styles/AchievementPanel.css';

const { Title, Paragraph } = Typography;

/**
 * Component แสดงความสำเร็จในการฝึกงาน
 * @param {Object} props
 * @param {Object} props.completionStatus สถานะความสมบูรณ์
 * @param {number} props.totalApprovedHours จำนวนชั่วโมงที่ได้รับการอนุมัติ
 * @param {Array} props.logEntries รายการบันทึกการฝึกงาน
 * @param {Array} props.weeklyData ข้อมูลรายสัปดาห์
 * @param {Object} props.summaryData ข้อมูลสรุปการฝึกงาน
 */
const AchievementPanel = ({ 
  completionStatus, 
  totalApprovedHours, 
  logEntries, 
  weeklyData, 
  summaryData 
}) => {
  return (
    <Card bordered={false} className="achievement-card">
      <div className="achievement-header">
        <div className="achievement-icon">
          {completionStatus.percentage >= 100 ? (
            <SafetyCertificateOutlined style={{ fontSize: 64, color: '#52c41a' }} />
          ) : (
            <CarryOutOutlined style={{ fontSize: 64, color: '#1890ff' }} />
          )}
        </div>
        <div className="achievement-title">
          <Title level={3}>
            {completionStatus.percentage >= 100 ? 
              'ผ่านการฝึกงานครบตามเกณฑ์' : 
              'ความคืบหน้าในการฝึกงาน'
            }
          </Title>
          <Paragraph>
            {completionStatus.percentage >= 100 ? 
              'คุณได้ทำการฝึกงานครบตามเกณฑ์ 240 ชั่วโมงที่กำหนดแล้ว' : 
              `ปัจจุบันคุณมีชั่วโมงฝึกงานที่ได้รับการอนุมัติ ${totalApprovedHours} ชั่วโมง จากทั้งหมด 240 ชั่วโมง`
            }
          </Paragraph>
        </div>
      </div>
      
      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col span={24}>
          <Progress
            percent={completionStatus.percentage}
            status={completionStatus.status}
            strokeWidth={20}
            format={percent => `${percent}%`}
          />
          <div className="hours-labels">
            <span>0 ชั่วโมง</span>
            <span>240 ชั่วโมง</span>
          </div>
        </Col>
      </Row>
      
      <Divider>สรุปผลการฝึกงาน</Divider>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card className="summary-metric-card">
            <Statistic
              title="จำนวนวันที่ฝึกงาน"
              value={logEntries.length}
              suffix="วัน"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="metric-subtitle">
              จากทั้งหมด {calcDateDiff(summaryData?.startDate, summaryData?.endDate)} วัน
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="summary-metric-card">
            <Statistic
              title="จำนวนชั่วโมงที่ได้รับการอนุมัติ"
              value={totalApprovedHours}
              suffix="ชม."
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="metric-subtitle">
              คิดเป็น {Math.round((totalApprovedHours / 240) * 100)}% ของเป้าหมาย
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="summary-metric-card">
            <Statistic
              title="จำนวนสัปดาห์ที่ฝึกงาน"
              value={weeklyData.length}
              suffix="สัปดาห์"
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="metric-subtitle">
              เฉลี่ย {Math.round(totalApprovedHours / (weeklyData.length || 1))} ชั่วโมง/สัปดาห์
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

function calcDateDiff(startDate, endDate) {
  if (!startDate || !endDate) return '-';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

export default AchievementPanel;
