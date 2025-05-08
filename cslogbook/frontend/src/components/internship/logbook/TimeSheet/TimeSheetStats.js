  import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Card, Statistic, Progress, Tooltip, message } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  PercentageOutlined,
} from '@ant-design/icons';

const TimeSheetStats = ({ stats = {} }) => {
  const [effectiveStats, setEffectiveStats] = useState(stats);
  const localStorageUsed = useRef(false);

  useEffect(() => {    
    const hasRealData = stats && 
      (stats.total > 0 || stats.completed > 0 || stats.pending > 0 || stats.totalHours > 0);
    
    if (hasRealData) {
      setEffectiveStats(stats);
      localStorageUsed.current = false;
    } else if (!localStorageUsed.current) { 
      localStorageUsed.current = true;
      const cachedStats = localStorage.getItem('timesheet_stats');
      if (cachedStats) {
        try {
          const parsedStats = JSON.parse(cachedStats);
          if (parsedStats.total > 0 || parsedStats.totalHours > 0) {
            console.log('ใช้ข้อมูลสถิติจาก localStorage:', parsedStats);
            setEffectiveStats(parsedStats);
            message.info('ใช้ข้อมูลสถิติจากแคช', 2);
          }
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
      }
    }
  }, [stats]);

  const {
    total = 0,
    totalHours = 0,
    completed = 0,
    pending = 0,
    approvedBySupervisor = 0
  } = effectiveStats || stats || {};

  const progressPercentage = Math.min(Math.round((totalHours / 240) * 100), 100);

  return (
    <Row gutter={[16, 16]} className="status-overview">
      <Col xs={24} sm={12} md={6}>
        <Card className="status-summary-card total">
          <Statistic
            title="วันฝึกงานทั้งหมด"
            value={total}
            suffix="วัน"
            prefix={<CalendarOutlined />}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card className="status-summary-card completed">
          <Statistic
            title="ชั่วโมงฝึกงานทั้งหมด"
            value={totalHours}
            suffix="ชม."
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card className="status-summary-card completed">
          <Statistic
            title="บันทึกแล้ว"
            value={completed}
            suffix="วัน"
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card className="status-summary-card pending">
          <Statistic
            title="รอบันทึก"
            value={pending}
            suffix="วัน"
            prefix={<ExclamationCircleOutlined />}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={12}>
        <Card className="status-summary-card approved">
          <Statistic
            title="ประเมินเรียบร้อยแล้ว"
            value={approvedBySupervisor}
            suffix="วัน"
            prefix={<CheckSquareOutlined />}
          />
          <Tooltip title="จำนวนวันที่ได้รับการอนุมัติจากพี่เลี้ยง">
            <small className="help-text">วันที่ได้รับการอนุมัติจากพี่เลี้ยงแล้ว</small>
          </Tooltip>
        </Card>
      </Col>
      
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