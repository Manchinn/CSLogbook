/**
 * UpcomingDeadlines Component
 * 
 * แสดงรายการ deadline ที่กำลังจะมาถึง
 */

import React, { useState, useEffect } from 'react';
import { List, Tag, Empty, Card, Space, Typography, Skeleton } from 'antd';
// Use direct imports instead of barrel files for better performance (bundle-barrel-imports)
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import PropTypes from 'prop-types';
import { 
  formatDeadline, 
  getDeadlineStatus, 
  getCountdownText,
  sortDeadlinesByUrgency,
  getActiveDeadlines
} from '../../../utils/deadlineHelpers';

const { Text, Title } = Typography;

const UpcomingDeadlines = ({ 
  deadlines, 
  loading = false, 
  maxItems = 5, 
  showCard = true,
  title = 'Deadline ที่กำลังจะมาถึง',
  emptyText = 'ไม่มี deadline ที่กำลังจะถึง'
}) => {
  const [activeDeadlines, setActiveDeadlines] = useState([]);

  useEffect(() => {
    if (deadlines && Array.isArray(deadlines)) {
      // กรองเฉพาะ deadline ที่ยังไม่เลย + เรียงตามความใกล้
      const active = getActiveDeadlines(deadlines);
      const sorted = sortDeadlinesByUrgency(active);
      setActiveDeadlines(sorted.slice(0, maxItems));
    }
  }, [deadlines, maxItems]);

  const renderDeadlineItem = (deadline) => {
    const status = getDeadlineStatus(deadline.deadlineAt, deadline.gracePeriodMinutes);
    const countdown = getCountdownText(deadline.deadlineAt, deadline.gracePeriodMinutes);

    return (
      <List.Item>
        <List.Item.Meta
          avatar={
            <ClockCircleOutlined 
              style={{ 
                fontSize: 24, 
                color: status.color 
              }} 
            />
          }
          title={
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Space wrap>
                <Text strong>{deadline.name}</Text>
                <Tag color={status.tagColor}>{status.label}</Tag>
                {deadline.deadlineType && (
                  <Tag>{deadline.deadlineType}</Tag>
                )}
              </Space>
            </Space>
          }
          description={
            <Space direction="vertical" size={4}>
              <Space size="small">
                <CalendarOutlined />
                <Text type="secondary">
                  {formatDeadline(deadline.deadlineAt, { showRelative: false })}
                </Text>
              </Space>
              <Text type="secondary" style={{ color: status.color }}>
                {countdown}
              </Text>
              {deadline.lockAfterDeadline && (
                <Tag color="red" style={{ marginTop: 4 }}>
                  ⚠️ ล็อกหลังครบกำหนด
                </Tag>
              )}
              {deadline.allowLate && !deadline.lockAfterDeadline && (
                <Tag color="orange" style={{ marginTop: 4 }}>
                  ✓ อนุญาตยื่นสาย
                </Tag>
              )}
              {deadline.gracePeriodMinutes > 0 && (
                <Tag color="blue" style={{ marginTop: 4 }}>
                  Grace period: {deadline.gracePeriodMinutes} นาที
                </Tag>
              )}
            </Space>
          }
        />
      </List.Item>
    );
  };

  const content = (
    <>
      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : activeDeadlines.length === 0 ? (
        <Empty 
          description={emptyText}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '24px 0' }}
        />
      ) : (
        <List
          dataSource={activeDeadlines}
          renderItem={renderDeadlineItem}
          size="small"
        />
      )}
    </>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card 
      title={
        <Space>
          <ClockCircleOutlined />
          <Title level={5} style={{ margin: 0 }}>{title}</Title>
        </Space>
      }
      bordered
      style={{ marginBottom: 16 }}
    >
      {content}
    </Card>
  );
};

UpcomingDeadlines.propTypes = {
  deadlines: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      deadlineAt: PropTypes.string.isRequired,
      gracePeriodMinutes: PropTypes.number,
      lockAfterDeadline: PropTypes.bool,
      allowLate: PropTypes.bool,
      deadlineType: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  maxItems: PropTypes.number,
  showCard: PropTypes.bool,
  title: PropTypes.string,
  emptyText: PropTypes.string
};

export default UpcomingDeadlines;
