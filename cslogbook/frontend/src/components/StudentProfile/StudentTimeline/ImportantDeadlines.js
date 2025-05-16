import React from 'react';
import { Timeline, Space, Tag, Typography, Empty, Button } from 'antd';
import { ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงกำหนดการสำคัญ
const ImportantDeadlines = ({ deadlines = [] }) => {
  return (
    <div>
      <div className="ant-card-head" style={{ padding: '0 24px' }}>
        <div className="ant-card-head-wrapper">
          <div className="ant-card-head-title">
            <Space><ClockCircleOutlined /> กำหนดการสำคัญที่กำลังจะมาถึง</Space>
          </div>
          <div className="ant-card-extra">
            <Button type="link" size="small" icon={<SearchOutlined />}>ดูปฏิทินทั้งหมด</Button>
          </div>
        </div>
      </div>
      <div className="ant-card-body">
        {deadlines.length > 0 ? (
          <Timeline
            items={deadlines.map(deadline => ({
              key: deadline.id,
              color: deadline.daysLeft <= 7 ? 'red' : (deadline.daysLeft <= 14 ? 'orange' : 'blue'),
              children: (
                <>
                  <Space>
                    <Text strong>{deadline.name}</Text>
                    <Tag color={deadline.daysLeft <= 7 ? 'error' : (deadline.daysLeft <= 14 ? 'warning' : 'blue')}>
                      {deadline.daysLeft} วัน
                    </Tag>
                    {deadline.related === 'internship' && <Tag color="cyan">ฝึกงาน</Tag>}
                    {deadline.related === 'project' && <Tag color="purple">โครงงาน</Tag>}
                  </Space>
                  <div><Text type="secondary">วันที่: {deadline.date}</Text></div>
                </>
              ),
            }))}
          />
        ) : (
          <Empty description="ไม่มีกำหนดการสำคัญในช่วงเวลานี้" />
        )}
      </div>
    </div>
  );
};

export default ImportantDeadlines;