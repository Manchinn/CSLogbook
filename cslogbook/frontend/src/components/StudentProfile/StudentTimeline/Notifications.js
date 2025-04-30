import React from 'react';
import { Alert, Space, Typography, Button } from 'antd';
import { 
  CheckCircleOutlined, WarningOutlined, 
  InfoCircleOutlined, BellOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงการแจ้งเตือน
const Notifications = ({ notifications = [] }) => {
  // ถ้าไม่มีการแจ้งเตือน ไม่ต้องแสดงอะไร
  if (notifications.length === 0) {
    return null;
  }
  
  // สร้างรายการแจ้งเตือน
  const renderNotificationItem = (item) => {
    const icon = item.type === 'success' ? <CheckCircleOutlined /> : 
                item.type === 'warning' ? <WarningOutlined /> : 
                <InfoCircleOutlined />;
                
    return (
      <Alert
        key={item.id}
        message={item.message}
        type={item.type}
        showIcon
        icon={icon}
        style={{ marginBottom: 8 }}
        action={
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {item.date}
          </Text>
        }
      />
    );
  };
  
  return (
    <div>
      <div className="ant-card-head" style={{ padding: '0 24px' }}>
        <div className="ant-card-head-wrapper">
          <div className="ant-card-head-title">
            <Space><BellOutlined /> การแจ้งเตือนของคุณ</Space>
          </div>
          <div className="ant-card-extra">
            <Button type="link" size="small">ดูทั้งหมด</Button>
          </div>
        </div>
      </div>
      <div className="ant-card-body" style={{ padding: '12px 24px' }}>
        {notifications.map(renderNotificationItem)}
      </div>
    </div>
  );
};

export default Notifications;