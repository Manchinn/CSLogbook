import React from 'react';
import { Row, Col, Card, Statistic, Progress, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  PercentageOutlined,
  FieldTimeOutlined,
  HourglassOutlined
} from '@ant-design/icons';

const TimeSheetStats = ({ stats }) => {
  // คำนวณเปอร์เซ็นต์ความคืบหน้า
  const progressPercentage = Math.min(Math.round((stats.totalHours / 240) * 100), 100);
  
  return (
    <Row gutter={[16, 16]} className="status-overview">
      <Col xs={24} sm={12} md={6}>
        <Card className="status-summary-card total">
          <Statistic
            title="วันฝึกงานทั้งหมด"
            value={stats.total}
            suffix="วัน"
            prefix={<CalendarOutlined />}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card className="status-summary-card completed">
          <Statistic
            title="ชั่วโมงฝึกงานทั้งหมด"
            value={stats.totalHours}
            suffix="ชม."
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card className="status-summary-card completed">
          <Statistic
            title="บันทึกแล้ว"
            value={stats.completed}
            suffix="วัน"
            prefix={<CheckCircleOutlined />}
          />
          <Tooltip title="จำนวนวันที่มีการบันทึกข้อมูลครบถ้วน">
          </Tooltip>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card className="status-summary-card pending">
          <Statistic
            title="รอบันทึก"
            value={stats.pending}
            suffix="วัน"
            prefix={<ExclamationCircleOutlined />}
          />
        </Card>
      </Col>
      
      {/* เพิ่มการ์ดประเมินเรียบร้อยแล้ว */}
      <Col xs={24} sm={12} md={12}>
        <Card className="status-summary-card approved">
          <Statistic
            title="ประเมินเรียบร้อยแล้ว"
            value={stats.approvedBySupervisor || 0}
            suffix="วัน"
            prefix={<CheckSquareOutlined />}
          />
          <Tooltip title="จำนวนวันที่ได้รับการอนุมัติจากพี่เลี้ยง">
            <small className="help-text">วันที่ได้รับการอนุมัติจากพี่เลี้ยงแล้ว</small>
          </Tooltip>
        </Card>
      </Col>
      
      {/* ปรับขนาดการ์ดความคืบหน้าให้เหมาะสม */}
      <Col xs={24} sm={24} md={12}>
        <Card className="status-summary-card progress">
          <Statistic
            title="ความคืบหน้า (เป้าหมาย 240 ชม.)"
            value={progressPercentage}
            suffix="%"
            prefix={<PercentageOutlined />}
          />
          <Progress percent={progressPercentage} status={progressPercentage >= 100 ? "success" : "active"} />
        </Card>
      </Col>
    </Row>
  );
};

export default TimeSheetStats;