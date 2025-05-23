import React from 'react';
import { Card, Typography, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { CalendarOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import AcademicSettings from './constants/academic/AcademicSettings';
import './constants/styles.css';

const { Title } = Typography;

const AcademicSettingsPage = () => {
  return (
    <div className="settings-page">
      <Breadcrumb className="settings-breadcrumb">
        <Breadcrumb.Item>
          <Link to="/admin/dashboard"><HomeOutlined /> หน้าหลัก</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/admin/settings"><SettingOutlined /> ตั้งค่าระบบ</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <CalendarOutlined /> ปีการศึกษา/ภาคเรียน
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="settings-content-card">
        <Title level={4}><CalendarOutlined /> ตั้งค่าปีการศึกษาและภาคเรียน</Title>
        <p className="settings-description">
          กำหนดปีการศึกษา ภาคเรียน และช่วงเวลาการลงทะเบียนสำหรับนักศึกษา
        </p>
        
        <AcademicSettings />
      </Card>
    </div>
  );
};

export default AcademicSettingsPage;