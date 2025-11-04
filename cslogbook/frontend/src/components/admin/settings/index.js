import React from 'react';
import { Card, Typography, Row, Col, Badge, Alert } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { 
  SettingOutlined, 
  CalendarOutlined, 
  BookOutlined,
  BellOutlined,
  FireOutlined,
  StarOutlined
} from '@ant-design/icons';
import './constants/styles.css';

const { Title, Text } = Typography;

const SettingsIndex = () => {
  const location = useLocation();
  
  // จัดกลุ่มการตั้งค่าตามความสำคัญ
  const settingsGroups = {
    critical: {
      title: 'การตั้งค่าพื้นฐาน',
      subtitle: 'จำเป็นต้องตั้งค่าก่อนใช้งานระบบ',
      icon: <FireOutlined style={{ color: '#ff4d4f' }} />,
      color: '#fff2f0',
      borderColor: '#ff4d4f',
      items: [
        {
          title: 'หลักสูตรการศึกษา',
          icon: <BookOutlined />,
          description: 'กำหนดหลักสูตรและเกณฑ์พื้นฐาน - ต้องตั้งค่าก่อนใช้งาน',
          path: '/admin/settings/curriculum',
          status: 'จำเป็น'
        },
        {
          title: 'ปีการศึกษา/ภาคเรียน',
          icon: <CalendarOutlined />,
          description: 'กำหนดปีการศึกษาและช่วงเวลาสำคัญของระบบ',
          path: '/admin/settings/academic',
          status: 'จำเป็น'
        }
      ]
    },/* 
    essential: {
      title: 'การตั้งค่าระบบงาน',
      subtitle: 'จำเป็นสำหรับการทำงานของระบบ',
      icon: <ThunderboltOutlined style={{ color: '#fa8c16' }} />,
      color: '#fff7e6',
      borderColor: '#fa8c16',
      items: [
        {
          title: 'ขั้นตอนการทำงาน (Workflow)',
          icon: <ToolOutlined />,
          description: 'กำหนดขั้นตอนสำหรับฝึกงานและโครงงานพิเศษ',
          path: '/admin/settings/workflow-steps',
          status: 'สำคัญ'
        },
        {
          title: 'สถานะนักศึกษา',
          icon: <TeamOutlined />,
          description: 'จัดการสถานะและเงื่อนไขของนักศึกษา',
          path: '/admin/settings/status',
          status: 'สำคัญ'
        }
      ]
    }, */
    optional: {
      title: 'การตั้งค่าเสริม',
      subtitle: 'ปรับแต่งเพื่อเพิ่มประสิทธิภาพการใช้งาน',
      icon: <StarOutlined style={{ color: '#1890ff' }} />,
      color: '#f6ffed',
      borderColor: '#52c41a',
      items: [
        {
          title: 'การแจ้งเตือน',
          icon: <BellOutlined />,
          description: 'ปรับแต่งการแจ้งเตือนและข้อความระบบ',
          path: '/admin/settings/notification-settings',
          status: 'เสริม'
        }
      ]
    }
  };

  const renderSettingsGroup = (group, groupKey) => (
    <div key={groupKey} style={{ marginBottom: '32px' }}>
      {/* หัวข้อกลุ่ม */}
      <div style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {group.icon}
          {group.title}
        </Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {group.subtitle}
        </Text>
      </div>

      {/* การ์ดในกลุ่ม */}
      <Row gutter={[16, 16]}>
        {group.items.map(item => (
          <Col xs={24} sm={12} md={8} key={item.path}>
            <Link to={item.path}>
              <Badge.Ribbon 
                text={item.status} 
                color={groupKey === 'critical' ? 'red' : groupKey === 'essential' ? 'orange' : 'green'}
              >
                <Card 
                  hoverable 
                  className="settings-card-menu"
                  style={{ 
                    borderLeft: location.pathname === item.path ? `4px solid ${group.borderColor}` : `4px solid transparent`,
                    backgroundColor: location.pathname === item.path ? group.color : 'white',
                    height: '120px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ fontSize: '24px', color: group.borderColor }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Card>
              </Badge.Ribbon>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <div className="settings-container">
      <Card>
        <Title level={4}>
          <SettingOutlined /> การตั้งค่าระบบ
        </Title>
        <Text type="secondary">
          จัดการค่าคงที่และการตั้งค่าพื้นฐานของระบบ โปรดเลือกหมวดหมู่ที่ต้องการจัดการ
        </Text>

        {/* คำแนะนำการใช้งาน */}
        <Alert
          message="คำแนะนำการใช้งาน"
          description="เริ่มต้นจากการตั้งค่าพื้นฐาน (สีแดง) ก่อน จากนั้นตั้งค่าระบบงาน (สีส้ม) และปรับแต่งเสริม (สีเขียว) ตามต้องการ"
          type="info"
          showIcon
          style={{ margin: '16px 0 24px 0' }}
        />

        {/* แสดงกลุ่มการตั้งค่า */}
        {Object.entries(settingsGroups).map(([key, group]) => 
          renderSettingsGroup(group, key)
        )}
      </Card>
    </div>
  );
};

export default SettingsIndex;