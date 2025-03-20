import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const TimeSheetStats = ({ stats }) => {
  return (
    <Row gutter={[16, 16]} className="status-overview">
      <Col xs={24} sm={12} md={6}>
        <Card className="status-summary-card total">
          <Statistic
            title="วันฝึกงานทั้งหมด"
            value={stats.total}
            suffix="วัน"
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      {/* Add other stat cards here */}
    </Row>
  );
};

export default TimeSheetStats;