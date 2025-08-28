import React from 'react';
import { Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { computeDeadlineStatus } from '../../utils/deadlineUtils';

export default function DeadlineBadge({ deadline, submittedAt, isLate, isSubmitted }) {
  const status = computeDeadlineStatus(deadline, submittedAt, { isLate, isSubmitted });
  const colorMap = {
    none: 'default',
    pending: 'blue',
    dueSoon: 'gold',
    overdue: 'red',
    submitted: 'green',
    late: 'orange'
  };
  const color = colorMap[status.code] || 'default';
  const tooltip = submittedAt
    ? `ส่งเมื่อ ${dayjs(submittedAt).format('DD/MM/BBBB HH:mm')}`
    : deadline ? `กำหนด ${dayjs(deadline).format('DD/MM/BBBB HH:mm')}` : 'ไม่มี';
  return (
    <Tooltip title={tooltip}>
      <Tag color={color}>{status.label}</Tag>
    </Tooltip>
  );
}
