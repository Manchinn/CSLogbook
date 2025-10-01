import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, List, Skeleton, Empty, Button, Tag, Space, Typography, Alert } from 'antd';
import { ReloadOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from '../../../utils/dayjs';
import { normalizeList } from '../../../utils/deadlineNormalize';
import * as importantDeadlineService from '../../../services/admin/importantDeadlineService';

const { Text } = Typography;

const RELATED_LABELS = {
  internship: { label: 'ฝึกงาน', color: 'gold' },
  project: { label: 'โครงงานพิเศษ', color: 'purple' },
  project1: { label: 'โครงงานพิเศษ 1', color: 'purple' },
  project2: { label: 'โครงงานพิเศษ 2', color: 'geekblue' },
  general: { label: 'ทั่วไป', color: 'blue' },
};

const resolveRelated = (relatedTo) => RELATED_LABELS[relatedTo] || { label: 'อื่นๆ', color: 'default' };

const classifyStatus = (dueAt) => {
  if (!dueAt) return { label: 'ไม่มีกำหนด', color: 'default' };
  const now = dayjs();
  const diffHours = dueAt.diff(now, 'hour', true);
  if (diffHours < 0) {
    return { label: 'เลยกำหนด', color: 'red' };
  }
  if (diffHours <= 24) {
    return { label: 'ภายใน 24 ชั่วโมง', color: 'orange' };
  }
  if (diffHours <= 72) {
    return { label: 'ภายใน 3 วัน', color: 'gold' };
  }
  return { label: 'กำลังจะถึง', color: 'blue' };
};

const calculateTimeLeft = (dueAt) => {
  if (!dueAt) {
    return { daysLeft: null, hoursLeft: null };
  }
  const now = dayjs();
  const diffMs = dueAt.valueOf() - now.valueOf();
  const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.floor(diffHours / 24);
  return {
    daysLeft: diffDays,
    hoursLeft: diffHours,
  };
};

const formatDueAt = (dueAt) => (dueAt ? dueAt.format('D MMM BBBB เวลา HH:mm น.') : '-');

const ActivityLog = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await importantDeadlineService.getDeadlines();
      const rawList = response?.data?.data || [];
      const normalized = normalizeList(rawList);
      const now = dayjs();

      const upcoming = normalized
        .map((item) => {
          const dueAt = item.effective_deadline_local || item.deadline_at_local || null;
          if (!dueAt) {
            return null;
          }
          if (item.isWindow && item.windowStartAt && now.isBefore(item.windowStartAt)) {
            // ถ้าเป็นช่วง window และยังไม่ถึงเวลาเริ่ม ให้ใช้เวลาเริ่มเพื่อแจ้งเตือนล่วงหน้า
            const start = dayjs(item.windowStartAt);
            return { ...item, dueAt: start, isWindow: true };
          }
          return { ...item, dueAt, isWindow: item.isWindow };
        })
        .filter(Boolean)
        .filter((item) => item.dueAt && item.dueAt.isAfter(now.subtract(1, 'minute')))
        .sort((a, b) => a.dueAt.valueOf() - b.dueAt.valueOf());

      setDeadlines(upcoming);
    } catch (err) {
      console.error('Failed to load upcoming deadlines:', err);
      setError(err);
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  const displayDeadlines = useMemo(() => deadlines.slice(0, 6), [deadlines]);

  const extraAction = (
    <Button type="text" size="small" icon={<ReloadOutlined />} onClick={fetchDeadlines}>
      รีเฟรช
    </Button>
  );

  return (
    <Card title="กำหนดการใกล้ถึง" extra={extraAction} className="activity-card">
      {error ? (
        <Alert
          type="warning"
          message="ไม่สามารถโหลดกำหนดการได้"
          description={error?.message || 'โปรดลองรีเฟรชใหม่อีกครั้ง'}
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : displayDeadlines.length === 0 ? (
        <Empty description="ยังไม่มีกำหนดการในช่วงใกล้ถึง" />
      ) : (
        <List
          dataSource={displayDeadlines}
          renderItem={(deadline) => {
            const related = resolveRelated(deadline.relatedTo);
            const status = classifyStatus(deadline.dueAt);
            const { daysLeft, hoursLeft } = calculateTimeLeft(deadline.dueAt);
            return (
              <List.Item key={deadline.id || deadline.name} className="admin-deadline-item">
                <List.Item.Meta
                  avatar={<CalendarOutlined style={{ fontSize: 20 }} />}
                  title={
                    <Space size="small" wrap>
                      <Text strong>{deadline.name || 'ไม่ระบุชื่อกำหนดการ'}</Text>
                      <Tag color={related.color} bordered={false}>
                        {related.label}
                      </Tag>
                      <Tag color={status.color} bordered={false}>
                        {status.label}
                      </Tag>
                      {deadline.isWindow ? (
                        <Tag icon={<ClockCircleOutlined />} color="processing" bordered={false}>
                          ช่วงเวลา
                        </Tag>
                      ) : null}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0} className="admin-deadline-meta">
                      <span>ครบกำหนด {formatDueAt(deadline.dueAt)}</span>
                      {daysLeft !== null && hoursLeft !== null ? (
                        <span>
                          {daysLeft > 0
                            ? `เหลือ ${daysLeft} วัน (${hoursLeft} ชั่วโมง)`
                            : `เหลือน้อยกว่า 1 วัน (${hoursLeft} ชั่วโมง)`}
                        </span>
                      ) : (
                        <span>ไม่พบข้อมูลเวลาที่ชัดเจน</span>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};

export default ActivityLog;