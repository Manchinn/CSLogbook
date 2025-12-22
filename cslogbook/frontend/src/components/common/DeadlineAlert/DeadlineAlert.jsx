/**
 * DeadlineAlert Component
 * 
 * แสดง alert สำหรับ overdue warnings และ late submission alerts
 */

import React from 'react';
import { Alert, Tag, Space, Typography } from 'antd';
import { ClockCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { formatDeadline, getDeadlineStatus } from '../../../utils/deadlineHelpers';

const { Text } = Typography;

const DeadlineAlert = ({ deadlines, type = 'overdue', showDetails = true, onClose }) => {
  if (!deadlines || deadlines.length === 0) {
    return null;
  }

  const renderOverdueAlert = () => {
    return (
      <Alert
        message={
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space>
              <CloseCircleOutlined style={{ fontSize: 16 }} />
              <Text strong>คุณพลาด Deadline!</Text>
            </Space>
            {showDetails && (
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                {deadlines.map((deadline, index) => {
                  const status = getDeadlineStatus(deadline.deadlineAt, deadline.gracePeriodMinutes);
                  return (
                    <li key={index} style={{ marginBottom: 4 }}>
                      <Space size="small" wrap>
                        <Text strong>{deadline.name}</Text>
                        <Text type="secondary">-</Text>
                        <Text type="danger">
                          ครบกำหนด: {formatDeadline(deadline.deadlineAt, { showRelative: false })}
                        </Text>
                        <Tag color={status.tagColor}>{status.label}</Tag>
                        {deadline.lockAfterDeadline && (
                          <Tag color="red">ปิดรับยื่นแล้ว</Tag>
                        )}
                        {!deadline.lockAfterDeadline && deadline.allowLate && (
                          <Tag color="orange">ยังยื่นได้</Tag>
                        )}
                      </Space>
                    </li>
                  );
                })}
              </ul>
            )}
          </Space>
        }
        type="error"
        closable={!!onClose}
        onClose={onClose}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  const renderUpcomingAlert = () => {
    // เอา deadline ที่ใกล้ที่สุด 3 อันแรก
    const urgentDeadlines = deadlines.slice(0, 3);
    const criticalCount = urgentDeadlines.filter(d => {
      const status = getDeadlineStatus(d.deadlineAt, d.gracePeriodMinutes);
      return status.status === 'urgent' || status.status === 'critical';
    }).length;

    if (criticalCount === 0) {
      return null; // ไม่มี deadline เร่งด่วน
    }

    return (
      <Alert
        message={
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space>
              <ExclamationCircleOutlined style={{ fontSize: 16 }} />
              <Text strong>Deadline ใกล้ครบกำหนด!</Text>
            </Space>
            {showDetails && (
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                {urgentDeadlines.map((deadline, index) => {
                  const status = getDeadlineStatus(deadline.deadlineAt, deadline.gracePeriodMinutes);
                  return (
                    <li key={index} style={{ marginBottom: 4 }}>
                      <Space size="small" wrap>
                        <Text strong>{deadline.name}</Text>
                        <Text type="secondary">-</Text>
                        <Text type="secondary">
                          ครบกำหนด: {formatDeadline(deadline.deadlineAt, { showRelative: false })}
                        </Text>
                        <Tag color={status.tagColor}>{status.label}</Tag>
                      </Space>
                    </li>
                  );
                })}
              </ul>
            )}
          </Space>
        }
        type="warning"
        closable={!!onClose}
        onClose={onClose}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  const renderInfoAlert = () => {
    return (
      <Alert
        message={
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space>
              <ClockCircleOutlined style={{ fontSize: 16 }} />
              <Text strong>Deadline ที่กำลังจะมาถึง</Text>
            </Space>
            {showDetails && (
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                {deadlines.map((deadline, index) => (
                  <li key={index} style={{ marginBottom: 4 }}>
                    <Space size="small" wrap>
                      <Text>{deadline.name}</Text>
                      <Text type="secondary">-</Text>
                      <Text>{formatDeadline(deadline.deadlineAt)}</Text>
                    </Space>
                  </li>
                ))}
              </ul>
            )}
          </Space>
        }
        type="info"
        closable={!!onClose}
        onClose={onClose}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  switch (type) {
    case 'overdue':
      return renderOverdueAlert();
    case 'upcoming':
      return renderUpcomingAlert();
    case 'info':
      return renderInfoAlert();
    default:
      return null;
  }
};

DeadlineAlert.propTypes = {
  deadlines: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      deadlineAt: PropTypes.string.isRequired,
      gracePeriodMinutes: PropTypes.number,
      lockAfterDeadline: PropTypes.bool,
      allowLate: PropTypes.bool
    })
  ).isRequired,
  type: PropTypes.oneOf(['overdue', 'upcoming', 'info']),
  showDetails: PropTypes.bool,
  onClose: PropTypes.func
};

export default DeadlineAlert;
