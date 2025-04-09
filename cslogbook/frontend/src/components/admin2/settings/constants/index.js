import React from 'react';
import { Card, Typography, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import {
  BookOutlined, FileTextOutlined, SettingOutlined, CalendarOutlined, 
  TagsOutlined, BellOutlined, FieldTimeOutlined, UserOutlined
} from '@ant-design/icons';
import './styles.css';

const { Title, Text } = Typography;

const settingsModules = [
  {
    title: 'ค่าคงที่หลักสูตร',
    icon: <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
    description: 'จัดการข้อมูลหลักสูตร และรายวิชา',
    path: '/admin2/settings/constants/curriculum',
    disabled: false
  },
  {
    title: 'ประเภทเอกสาร',
    icon: <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    description: 'จัดการประเภทเอกสารที่ใช้ในระบบ',
    path: '/admin2/settings/constants/documents',
    disabled: false
  },
  {
    title: 'เกณฑ์การฝึกงาน/โครงงาน',
    icon: <SettingOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
    description: 'กำหนดเงื่อนไขสำหรับสิทธิ์ฝึกงานและโครงงาน',
    path: '/admin2/settings/constants/eligibility',
    disabled: false
  },
  {
    title: 'การศึกษา',
    icon: <CalendarOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
    description: 'จัดการปีการศึกษาและภาคเรียน',
    path: '/admin2/settings/constants/academic',
    disabled: false
  },
  {
    title: 'สถานะในระบบ',
    icon: <TagsOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
    description: 'กำหนดสถานะต่างๆ ของนักศึกษาและเอกสาร',
    path: '/admin2/settings/constants/status',
    disabled: false
  },
  {
    title: 'การแจ้งเตือน',
    icon: <BellOutlined style={{ fontSize: 24, color: '#faad14' }} />,
    description: 'กำหนดการตั้งค่าการแจ้งเตือน',
    path: '/admin2/settings/constants/notifications',
    disabled: false
  },
  {
    title: 'Timeline (ผู้ดูแลระบบ)',
    icon: <FieldTimeOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
    description: 'ตัวอย่างการแสดงผล Timeline ฝั่งผู้ดูแล',
    path: '/admin2/settings/constants/timeline-admin',
    disabled: false
  },
  {
    title: 'Timeline (นักศึกษา)',
    icon: <UserOutlined style={{ fontSize: 24, color: '#f5222d' }} />,
    description: 'ตัวอย่างการแสดงผล Timeline ฝั่งนักศึกษา',
    path: '/admin2/settings/constants/timeline-student',
    disabled: false
  }
];

const ConstantsSettings = () => {
  return (
    <div className="constants-settings-container">
      <Card>
        <Title level={4}>การตั้งค่าระบบ</Title>
        <p className="settings-description">
          จัดการค่าคงที่และการตั้งค่าพื้นฐานของระบบ เลือกโมดูลที่ต้องการแก้ไข
        </p>
        
        <Row gutter={[16, 16]}>
          {settingsModules.map((module, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card 
                hoverable={!module.disabled}
                className={`settings-card ${module.disabled ? 'disabled' : ''}`}
              >
                <div className="settings-card-content">
                  <div className="settings-card-icon">
                    {module.icon}
                  </div>
                  <Title level={5}>{module.title}</Title>
                  <Text type="secondary">{module.description}</Text>
                  
                  <div className="settings-card-action">
                    {!module.disabled ? (
                      <Link to={module.path}>แก้ไข</Link>
                    ) : (
                      <span className="coming-soon">เร็วๆ นี้</span>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default ConstantsSettings;