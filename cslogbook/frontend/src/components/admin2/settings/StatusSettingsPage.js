import React from 'react';
import { Card, Typography, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { TeamOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import StatusSettings from './constants/StatusSettings';
import './constants/styles.css';

const { Title } = Typography;

const StatusSettingsPage = () => {
  return (
    <div className="settings-page">
      <Breadcrumb className="settings-breadcrumb">
        <Breadcrumb.Item>
          <Link to="/admin2/dashboard"><HomeOutlined /> หน้าหลัก</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/admin2/settings"><SettingOutlined /> ตั้งค่าระบบ</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <TeamOutlined /> สถานะนักศึกษา
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="settings-content-card">
        <Title level={4}><TeamOutlined /> ตั้งค่าสถานะนักศึกษา</Title>
        <p className="settings-description">
          กำหนดและจัดการสถานะของนักศึกษาในระบบ
        </p>
        
        <StatusSettings />
      </Card>
    </div>
  );
};

export default StatusSettingsPage;