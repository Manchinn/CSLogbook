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
import '../styles/AchievementPanel.css'; // Adjusted import path

const { Title } = Typography;

const AchievementPanel = () => {
  return (
    <Card>
      <Title level={4}>Achievements</Title>
      <Divider />
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="Certificates Obtained"
            value={5}
            prefix={<SafetyCertificateOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Tasks Completed"
            value={12}
            prefix={<CarryOutOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Deadlines Met"
            value={8}
            prefix={<CalendarOutlined />}
          />
        </Col>
      </Row>
      <Divider />
      <Row gutter={16}>
        <Col span={12}>
          <Progress
            type="circle"
            percent={75}
            format={percent => `${percent} %`}
          />
        </Col>
        <Col span={12}>
          <Progress
            type="circle"
            percent={50}
            format={percent => `${percent} %`}
          />
        </Col>
      </Row>
      <Divider />
      <Row gutter={16}>
        <Col span={8}>
          <CheckCircleOutlined /> Task 1
        </Col>
        <Col span={8}>
          <CheckCircleOutlined /> Task 2
        </Col>
        <Col span={8}>
          <CheckCircleOutlined /> Task 3
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <ScheduleOutlined /> Deadline 1
        </Col>
        <Col span={8}>
          <ScheduleOutlined /> Deadline 2
        </Col>
        <Col span={8}>
          <ScheduleOutlined /> Deadline 3
        </Col>
      </Row>
    </Card>
  );
};

export default AchievementPanel;