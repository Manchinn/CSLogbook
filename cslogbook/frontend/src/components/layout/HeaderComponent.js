import React from 'react';
import { Layout, Button, Typography, Space, Avatar, Badge } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import './HeaderComponent.css';

const { Header } = Layout;
const { Title, Text } = Typography;

const themeConfig = {
  student: {
    gradient: 'linear-gradient(135deg, #e6f7ff 0%, #91d5ff 100%)',
    primary: '#1890ff',
    text: '#000000d9',
    badge: '#1890ff',
    buttonHover: '#bae7ff',
  },
  teacher: {
    gradient: 'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)',
    primary: '#faad14',
    text: '#000000d9',
    badge: '#d48806',
    buttonHover: '#ffe7ba',
  },
  admin: {
    gradient: 'linear-gradient(135deg, #fff1f0 0%, #ffa39e 100%)',
    primary: '#f5222d',
    text: '#000000d9',
    badge: '#cf1322',
    buttonHover: '#ffccc7',
  },
};

const HeaderComponent = ({ isMobile, showDrawer }) => {
  const role = localStorage.getItem('role');
  const firstName = localStorage.getItem('firstName');
  const lastName = localStorage.getItem('lastName');
  const theme = themeConfig[role] || themeConfig.student;

  const getRoleTitle = (role) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'teacher':
        return 'อาจารย์';
      case 'student':
        return 'นักศึกษา';
      default:
        return 'ผู้ใช้งาน';
    }
  };

  const headerStyles = {
    mainHeader: {
      marginTop: isMobile ? '0' : '24px',
      paddingTop: isMobile ? '0' : '24px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      background: theme.gradient,
      backdropFilter: 'blur(10px)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 'auto',
      minHeight: '64px',
      position: 'fixed',
      top: 0,
      left: isMobile ? '2.5%' : 'calc(2.5% + 230px)',
      zIndex: 1002, // ต้องสูงกว่า z-index ของ Sidebar และปุ่มเปิด Drawer
      borderRadius: '16px',
      width: isMobile ? '95%' : 'calc(95% - 230px)',
    },
    titleContainer: {
      maxWidth: isMobile ? '200px' : '600px',
    },
    mainTitle: {
      margin: 0,
      fontSize: isMobile ? '20px' : '24px',
      color: theme.text,
      lineHeight: 1.4,
      fontWeight: 600,
    },
    subtitle: {
      fontSize: '14px',
      color: 'rgba(0, 0, 0, 0.65)',
      lineHeight: 1.5,
      margin: 0,
      display: isMobile ? 'none' : 'block',
    },
    userAvatar: {
      display: isMobile ? 'none' : 'block',
      backgroundColor: theme.badge,
      color: '#fff',
      fontWeight: 'bold',
    },
    userName: {
      fontSize: '14px',
      color: theme.text,
    },
    roleBadge: {
      backgroundColor: theme.badge,
      fontSize: '12px',
      padding: '0 8px',
      borderRadius: '6px',
    },
  };

  return (
    <Header style={headerStyles.mainHeader}>
      {/* Left side */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <Space size={24} align="start" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
          {/* เพิ่มปุ่มเปิด Drawer สำหรับหน้าจอเล็ก */}
          {isMobile && (
  <Button
    type="text"
    icon={<MenuOutlined />}
    onClick={showDrawer}
    style={{ 
      padding: '0',
      fontSize: 24, 
      margin: 0,
      position: 'fixed', 
      zIndex: 1001,
      top: '50%', // จัดตำแหน่งจากด้านบน 50%
      transform: 'translate(-50%, -50%)', // ย้ายกลับไปทางซ้ายและขึ้นบน 50% ของขนาดปุ่ม
    }}
  />
)}
          <Space direction="vertical" size={4} style={headerStyles.titleContainer}>
            <Title level={4} style={headerStyles.mainTitle}>
              CS Logbook
            </Title>
            <Text style={headerStyles.subtitle}>
              ระบบสมุดบันทึกการฝึกงานและติดตามความคืบหน้าโครงงานพิเศษ
            </Text>
          </Space>
        </Space>
      </div>

      {/* Right side */}
      <div style={{ marginRight: 'auto', padding: '12px' }}>
        <Space size={16} align="center">
          <Avatar style={headerStyles.userAvatar}>
            {firstName?.charAt(0)?.toUpperCase()}
          </Avatar>

          <Space direction="vertical" size={0}>
            <Text strong style={headerStyles.userName}>
              {firstName} {lastName}
            </Text>
            <Badge count={getRoleTitle(role)} style={headerStyles.roleBadge} />
          </Space>
        </Space>
      </div>
    </Header>
  );
};

export default HeaderComponent;