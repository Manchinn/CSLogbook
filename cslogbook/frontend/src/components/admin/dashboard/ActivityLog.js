import React from 'react';
import { Card, List, Avatar, Spin, Empty, Button, Badge } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/th';

const getActivityIcon = (type) => {
  switch (type) {
    case 'document_approved':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'document_rejected':
      return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
    case 'document_uploaded':
      return <FileTextOutlined style={{ color: '#1890ff' }} />;
    case 'user_login':
      return <UserOutlined style={{ color: '#722ed1' }} />;
    default:
      return <UserOutlined />;
  }
};

const ActivityLog = ({ activities = [], loading = false, onRefresh }) => {
  // ตั้ง locale ภาษาไทยให้ moment สำหรับใช้งานในคอมโพเนนต์นี้
  moment.locale('th');

  const extraAction = onRefresh ? (
    <Button
      type="text"
      size="small"
      icon={<ReloadOutlined />}
      onClick={onRefresh}
    >
      รีเฟรช
    </Button>
  ) : null;

  return (
    <Card title="กิจกรรมล่าสุด" extra={extraAction} className="activity-card">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : activities.length === 0 ? (
        <Empty description="ไม่มีกิจกรรมล่าสุด" />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={activities}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Badge dot={item.isNew} offset={[0, 4]}>
                    <Avatar icon={getActivityIcon(item.type)} />
                  </Badge>
                }
                title={item.title}
                description={
                  <div>
                    {item.description && <div>{item.description}</div>}
                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                      {item.timestamp ? moment(item.timestamp).fromNow() : ''}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default ActivityLog;