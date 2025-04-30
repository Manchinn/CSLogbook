import React from 'react';
import { Timeline, Space, Tag, Button, Typography } from 'antd';
import { 
  CloudDownloadOutlined, FormOutlined, RightCircleOutlined, 
  ClockCircleFilled
} from '@ant-design/icons';
import { getStatusColor, getStatusIcon, getStatusText } from './helpers';

const { Text } = Typography;

// คอมโพเนนต์สำหรับรายการในไทม์ไลน์
const TimelineItems = ({ items = [] }) => {
  // สร้างรายการ Timeline
  const renderTimelineItem = (item) => {
    const color = getStatusColor(item.status);
    
    return (
      <Timeline.Item 
        key={item.id}
        color={color}
        dot={item.status === 'in_progress' ? <ClockCircleFilled style={{ fontSize: '16px' }} /> : getStatusIcon(item.status)}
      >
        <div style={{ marginBottom: 8 }}>
          <Space align="start">
            <Text strong>{item.name}</Text>
            <Tag color={color}>{getStatusText(item.status)}</Tag>
            {item.document && <Tag color="purple">{item.document}</Tag>}
          </Space>
        </div>
        
        {item.desc && <div><Text>{item.desc}</Text></div>}
        
        {item.date && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">วันที่: {item.date}</Text>
          </div>
        )}
        
        {item.startDate && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">เริ่ม: {item.startDate} {item.endDate && `- สิ้นสุด: ${item.endDate}`}</Text>
          </div>
        )}
        
        {item.deadline && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">กำหนดการ: {item.deadline}</Text>
          </div>
        )}
        
        {item.actionText && item.actionLink && (
          <div style={{ marginTop: 8 }}>
            <Button 
              type={item.status === 'in_progress' ? 'primary' : 'default'} 
              size="small" 
              icon={
                item.actionText.includes('ดาวน์โหลด') ? <CloudDownloadOutlined /> :
                item.actionText.includes('อัปโหลด') ? <FormOutlined /> :
                item.actionText.includes('บันทึก') ? <FormOutlined /> :
                <RightCircleOutlined />
              }
              href={item.actionLink}
            >
              {item.actionText}
            </Button>
          </div>
        )}
      </Timeline.Item>
    );
  };

  return (
    <Timeline mode="left">
      {items.map(renderTimelineItem)}
    </Timeline>
  );
};

export default TimelineItems;