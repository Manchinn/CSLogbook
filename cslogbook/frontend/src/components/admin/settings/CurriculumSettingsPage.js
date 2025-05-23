import React from 'react';
import { Card, Typography, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { BookOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import CurriculumSettings from './constants/CurriculumSettings';
import './constants/styles.css';

const { Title } = Typography;

const CurriculumSettingsPage = () => {
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
          <BookOutlined /> หลักสูตรการศึกษา
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="settings-content-card">
        <Title level={4}><BookOutlined /> จัดการหลักสูตรการศึกษา</Title>
        <p className="settings-description">
          กำหนดและจัดการหลักสูตรการศึกษาและเกณฑ์ต่างๆ ของแต่ละหลักสูตร
        </p>
        
        <CurriculumSettings />
      </Card>
    </div>
  );
};

export default CurriculumSettingsPage;