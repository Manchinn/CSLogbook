import React from 'react';
import { Timeline, Space, Tag, Button, Typography } from 'antd';
import { 
  CloudDownloadOutlined, FormOutlined, RightCircleOutlined, 
  ClockCircleFilled, ExclamationCircleOutlined, SyncOutlined,
} from '@ant-design/icons';
import { getStatusColor, getStatusIcon, getStatusText } from './helpers';
import moment from 'moment';
import 'moment/locale/th';

const { Text } = Typography;

// คอมโพเนนต์สำหรับรายการในไทม์ไลน์
const TimelineItems = ({ items = [], onAction }) => {
  if (!items || items.length === 0) {
    return <Text type="secondary">ไม่มีข้อมูลขั้นตอนการดำเนินการ</Text>;
  }
  
  // สร้างรายการ Timeline
  const processedItems = items.map((item) => {
    // รองรับทั้ง item.status (รูปแบบเดิม) และ status จากระบบ workflow ใหม่
    let status = item.status;
    if (status === 'awaiting_student_action') status = 'in_progress'; 
    if (status === 'awaiting_admin_action') status = 'pending';
    
    const color = getStatusColor(status);
    
    // สร้าง icon ตามสถานะ
    let icon = getStatusIcon(status);
    // สำหรับระบบ workflow ใหม่
    if (item.status === 'awaiting_student_action') {
      icon = <ExclamationCircleOutlined style={{ fontSize: '16px', color: '#faad14' }} />;
    } else if (item.status === 'awaiting_admin_action') {
      icon = <ClockCircleFilled style={{ fontSize: '16px', color: '#fa8c16' }} />;
    } else if (item.status === 'in_progress') {
      icon = <SyncOutlined spin style={{ fontSize: '16px', color: '#1890ff' }} />;
    }
    
    // ตรวจสอบการมีอยู่ของค่าต่างๆ
    const title = item.name || item.title || 'ไม่มีชื่อขั้นตอน';
    const description = item.desc || item.description;
    
    // สร้าง tag สถานะตามระบบใหม่หรือเดิม
    let statusTagText = getStatusText(status);
    if (item.currentLabel) {
      statusTagText = item.currentLabel;
    } else if (item.status === 'awaiting_student_action') {
      statusTagText = 'รอดำเนินการ';
    } else if (item.status === 'awaiting_admin_action') {
      statusTagText = 'รอการอนุมัติ';
    }
    
    return {
      key: item.id || item.key,
      color: color,
      dot: icon,
      children: (
        <>
          <div style={{ marginBottom: 8 }}>
            <Space align="start">
              <Text strong>{title}</Text>
              <Tag color={color}>{statusTagText}</Tag>
              {item.document && <Tag color="purple">{item.document}</Tag>}
            </Space>
          </div>
          
          {description && <div><Text>{description}</Text></div>}
          
          {item.date && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">วันที่: {item.date}</Text>
            </div>
          )}
          
          {item.timestamp && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">
                {moment(item.timestamp).fromNow()}
              </Text>
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
          
          {/* แสดงปุ่มดำเนินการ ถ้าเป็นขั้นตอนที่ต้องการการดำเนินการ (ระบบเก่า) */}
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
                onClick={() => onAction && onAction(item)}
              >
                {item.actionText}
              </Button>
            </div>
          )}
          
          {/* แสดงปุ่มดำเนินการสำหรับระบบ workflow ใหม่ */}
          {!item.actionText && item.status === 'awaiting_student_action' && (
            <div style={{ marginTop: 8 }}>
              <Button 
                type="primary" 
                size="small" 
                icon={<RightCircleOutlined />}
                onClick={() => onAction && onAction(item)}
              >
                ดำเนินการ
              </Button>
            </div>
          )}
        </>
      ),
    };
  });

  return (
    <Timeline mode="left" items={processedItems} />
  );
};

export default TimelineItems;