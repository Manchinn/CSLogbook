import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Spin, Empty } from 'antd';
import { UserOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { adminService } from '../../../services/adminService';
import moment from 'moment';

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

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getRecentActivities();
      setActivities(data);
    } catch (error) {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 60000); // รีเฟรชทุก 1 นาที
    return () => clearInterval(interval);
  }, []);

  return (
    <Card title="กิจกรรมล่าสุด">
      {isLoading ? (
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
                avatar={<Avatar icon={getActivityIcon(item.type)} />}
                title={item.title}
                description={
                  <div>
                    <div>{item.description}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                      {moment(item.timestamp).fromNow()}
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