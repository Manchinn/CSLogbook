import React from 'react';
import { Card, Typography, Alert, Space, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { 
  BookOutlined, 
  HomeOutlined, 
  SettingOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';
import CurriculumSettings from './constants/CurriculumSettings';
import './constants/Settings.module.css';

const { Title, Text } = Typography;

/**
 * หน้าการจัดการหลักสูตรการศึกษาสำหรับ Admin
 */
const CurriculumSettingsPage = () => {
  // กำหนด breadcrumb items สำหรับ Ant Design เวอร์ชันใหม่ พร้อม navigation links
  const breadcrumbItems = [
    {
      title: (
        <Link to="/admin/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
          <HomeOutlined style={{ marginRight: 4 }} />
          ระบบจัดการ
        </Link>
      )
    },
    {
      title: (
        <Link to="/admin/settings" style={{ color: 'inherit', textDecoration: 'none' }}>
          <SettingOutlined style={{ marginRight: 4 }} />
          การตั้งค่าระบบ
        </Link>
      )
    },
    {
      title: (
        <span>
          <BookOutlined style={{ marginRight: 4 }} />
          จัดการหลักสูตรการศึกษา
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Breadcrumb Navigation พร้อม link navigation */}
      <Breadcrumb 
        items={breadcrumbItems}
        style={{ marginBottom: '20px' }}
      />

      {/* Header Section */}
      <Card style={{ marginBottom: '20px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>
            <BookOutlined style={{ marginRight: 8 }} />
            จัดการหลักสูตรการศึกษา
          </Title>
          <Text type="secondary">
            กำหนดและจัดการหลักสูตรการศึกษา เกณฑ์ฝึกงานและโครงงานของแต่ละหลักสูตร รวมทั้งข้อกำหนดต่างๆ
          </Text>
          
          {/* คำแนะนำการใช้งาน */}
          <Alert
            message="คำแนะนำการใช้งาน"
            description={
              <div>
                <p>• <strong>การจัดการหลักสูตร:</strong> เพิ่ม แก้ไข หรือลบหลักสูตรการศึกษาต่างๆ ในระบบ</p>
                <p>• <strong>เกณฑ์การฝึกงาน:</strong> กำหนดจำนวนหน่วยกิตสำหรับเกณฑ์การใช้งานระบบฝึกงาน</p>
                <p>• <strong>เกณฑ์โครงงานพิเศษ:</strong> กำหนดจำนวนหน่วยกิตสำหรับเกณฑ์การใช้งานระบบโครงงานพิเศษ</p>
              </div>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        </Space>
      </Card>

      {/* Main Content */}
      <CurriculumSettings />
    </div>
  );
};

export default CurriculumSettingsPage;