import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import styles from './Settings.module.css';

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
    <div className={styles.settingsLayout}>
      <Card>
        <div className={styles.settingsHeader}>
          <Title level={4}>{title}</Title>
        </div>

        <div className={styles.settingsContent}>
          {children}
        </div>

        {actions && (
          <div className={styles.settingActions}>
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