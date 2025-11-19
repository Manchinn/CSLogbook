/**
 * DeadlineCountdown Component
 * 
 * Countdown timer สำหรับ deadline ที่ใกล้ที่สุด
 */

import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Tag, Space, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { 
  calculateTimeRemaining, 
  getDeadlineStatus,
  formatDeadline 
} from '../../../utils/deadlineHelpers';

const { Text } = Typography;

const DeadlineCountdown = ({ deadline, showCard = true }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!deadline) {
      setTimeRemaining(null);
      setStatus(null);
      return;
    }

    // คำนวณครั้งแรก
    const remaining = calculateTimeRemaining(deadline.deadlineAt, deadline.gracePeriodMinutes);
    const deadlineStatus = getDeadlineStatus(deadline.deadlineAt, deadline.gracePeriodMinutes);
    
    setTimeRemaining(remaining);
    setStatus(deadlineStatus);

    // Update ทุก 1 นาที
    const interval = setInterval(() => {
      const newRemaining = calculateTimeRemaining(deadline.deadlineAt, deadline.gracePeriodMinutes);
      const newStatus = getDeadlineStatus(deadline.deadlineAt, deadline.gracePeriodMinutes);
      
      setTimeRemaining(newRemaining);
      setStatus(newStatus);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline || !timeRemaining || !status) {
    return null;
  }

  const renderCountdown = () => {
    if (timeRemaining.isOverdue) {
      return (
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Tag color="red" style={{ fontSize: 18, padding: '8px 16px' }}>
            เลยกำหนดแล้ว
          </Tag>
          <Text type="danger" style={{ fontSize: 16 }}>
            เลยมา {timeRemaining.days > 0 ? `${timeRemaining.days} วัน ` : ''}
            {timeRemaining.hours > 0 ? `${timeRemaining.hours} ชั่วโมง ` : ''}
            {timeRemaining.minutes} นาที
          </Text>
          {deadline.lockAfterDeadline && (
            <Tag color="red">❌ ปิดรับยื่นเอกสารแล้ว</Tag>
          )}
          {!deadline.lockAfterDeadline && deadline.allowLate && (
            <Tag color="orange">⚠️ ยังยื่นได้ (แต่อาจมีข้อจำกัด)</Tag>
          )}
        </Space>
      );
    }

    const deadlineDate = new Date(deadline.deadlineAt);
    if (deadline.gracePeriodMinutes > 0) {
      deadlineDate.setMinutes(deadlineDate.getMinutes() + deadline.gracePeriodMinutes);
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16} justify="center">
          <Col>
            <Statistic 
              title="วัน" 
              value={timeRemaining.days} 
              valueStyle={{ color: status.color, fontSize: 32 }}
            />
          </Col>
          <Col>
            <Statistic 
              title="ชั่วโมง" 
              value={timeRemaining.hours} 
              valueStyle={{ color: status.color, fontSize: 32 }}
            />
          </Col>
          <Col>
            <Statistic 
              title="นาที" 
              value={timeRemaining.minutes} 
              valueStyle={{ color: status.color, fontSize: 32 }}
            />
          </Col>
        </Row>
        
        <div style={{ textAlign: 'center' }}>
          <Tag color={status.tagColor} style={{ fontSize: 14, padding: '4px 12px' }}>
            {status.label}
          </Tag>
        </div>
      </Space>
    );
  };

  const content = (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Space direction="vertical" size={4}>
          <Text strong style={{ fontSize: 16 }}>
            {deadline.name}
          </Text>
          <Text type="secondary">
            ครบกำหนด: {formatDeadline(deadline.deadlineAt, { showRelative: false })}
          </Text>
        </Space>
      </div>
      
      {renderCountdown()}
      
      {deadline.gracePeriodMinutes > 0 && !timeRemaining.isOverdue && (
        <div style={{ textAlign: 'center' }}>
          <Tag color="blue">
            มี Grace Period {deadline.gracePeriodMinutes} นาที
          </Tag>
        </div>
      )}
    </Space>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined />
          <Text strong>Deadline ถัดไป</Text>
        </Space>
      }
      bordered
      style={{
        marginBottom: 16,
        background: timeRemaining.isOverdue ? '#fff1f0' : undefined,
      }}
    >
      {content}
    </Card>
  );
};

DeadlineCountdown.propTypes = {
  deadline: PropTypes.shape({
    name: PropTypes.string.isRequired,
    deadlineAt: PropTypes.string.isRequired,
    gracePeriodMinutes: PropTypes.number,
    lockAfterDeadline: PropTypes.bool,
    allowLate: PropTypes.bool
  }),
  showCard: PropTypes.bool
};

export default DeadlineCountdown;
