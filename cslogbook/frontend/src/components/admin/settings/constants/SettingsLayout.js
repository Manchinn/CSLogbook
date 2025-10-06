import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import './styles.css';

const { Title } = Typography;

const SettingsLayout = ({
  children,
  title,
  onSave,
  onReset,
  loading = false,
  actions = true
}) => {
  return (
    <div className="settings-layout">
      <Card>
        <div className="settings-header">
          <Title level={4}>{title}</Title>
        </div>

        <div className="settings-content">
          {children}
        </div>

        {actions && (
          <div className="setting-actions">
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={onReset} 
                disabled={loading}
              >
                รีเซ็ต
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={onSave} 
                loading={loading}
              >
                บันทึกการตั้งค่า
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SettingsLayout;