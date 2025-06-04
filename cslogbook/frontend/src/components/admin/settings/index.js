import React from 'react';
import { Card, Typography, Row, Col, List } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { 
  SettingOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  BookOutlined 
} from '@ant-design/icons';
import './constants/styles.css';

const { Title } = Typography;

const SettingsIndex = () => {
  const location = useLocation();
  
  // รายการหน้าตั้งค่าทั้งหมด (เรียงตามลำดับความสำคัญ)
  const settingsPages = [
    {
      title: 'หลักสูตรการศึกษา',
      icon: <BookOutlined />,
      description: 'กำหนดและจัดการหลักสูตรการศึกษา เกณฑ์ฝึกงานและโครงงานของแต่ละหลักสูตร',
      path: '/admin/settings/curriculum'
    },
    {
      title: 'ปีการศึกษา/ภาคเรียน',
      icon: <CalendarOutlined />,
      description: 'กำหนดปีการศึกษา ภาคเรียน และช่วงเวลาการลงทะเบียน',
      path: '/admin/settings/academic'
    },
    {
      title: 'ขั้นตอนการทำงาน',
      icon: <TeamOutlined />,
      description: 'กำหนดขั้นตอนการทำงานสำหรับการฝึกงานและโครงงานพิเศษ',
      path: '/admin/settings/workflow-steps'
    },
    {
      title: 'สถานะนักศึกษา',
      icon: <TeamOutlined />,
      description: 'กำหนดสถานะและเงื่อนไขต่างๆ ของนักศึกษา',
      path: '/admin/settings/status'
    },
    {
      title: 'การแจ้งเตือน',
      icon: <SettingOutlined />,
      description: 'จัดการการตั้งค่าการแจ้งเตือนต่างๆ ของระบบ',
      path: '/admin/settings/notification-settings'
    }
  ];
  
  return (
    <div className="settings-container">
      <Card>
        <Title level={4}><SettingOutlined /> การตั้งค่าระบบ</Title>
        <p className="settings-description">
          จัดการค่าคงที่และการตั้งค่าพื้นฐานของระบบ โปรดเลือกหมวดหมู่ที่ต้องการจัดการ
        </p>
        
        <Row gutter={[16, 16]} className="settings-menu">
          {settingsPages.map(page => (
            <Col xs={24} sm={12} md={8} key={page.path}>
              <Link to={page.path}>
                <Card 
                  hoverable 
                  className="settings-card-menu"
                  style={{ 
                    borderLeft: location.pathname === page.path ? '4px solid #1890ff' : 'none',
                    backgroundColor: location.pathname === page.path ? '#e6f7ff' : 'white'
                  }}
                >
                  <div className="settings-card-icon">{page.icon}</div>
                  <div className="settings-card-content">
                    <div className="settings-card-title">{page.title}</div>
                    <div className="settings-card-desc">{page.description}</div>
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default SettingsIndex;