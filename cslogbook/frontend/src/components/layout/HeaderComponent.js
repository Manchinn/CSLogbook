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

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    border: 'none',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  const headerStyles = {
    mainHeader: {
      marginTop: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      background: theme.gradient,
      backdropFilter: 'blur(10px)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 'auto',
      minHeight: '72px',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 11,
      borderRadius: '16px',
      marginLeft: isMobile ? 0 : '290px',
      width: isMobile ? '100%' : 'calc(100% - 375px)',
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
      display: 'block',
    },
    userAvatar: {
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
    secondaryHeader: {
      backgroundColor: '#f5f5f5',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '115px',
      zIndex: 10,
    },
    secondaryTitle: {
      textAlign: 'center',
      color: 'white',
      paddingTop: '15px',
      fontSize: '18px',
      fontWeight: 'bold',
    },
  };

  return (
    <Layout>
      <Header style={headerStyles.mainHeader}>
        {/* ส่วนซ้าย */}
        <div style={{ flex: 1 }}>
          <Space size={24} align="start" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: '20px', color: theme.primary }} />}
                onClick={showDrawer}
                style={buttonStyle}
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

        {/* ส่วนขวา */}
        <div style={{ marginRight: 'auto', padding: '12px' }}>
          <Space size={16} align="center">
            <Avatar style={headerStyles.userAvatar}>
              {firstName?.charAt(0)?.toUpperCase()}
            </Avatar>

            <Space direction="vertical" size={0}>
              <Text strong style={headerStyles.userName}>
                {firstName} {lastName}
              </Text>
              <Badge
                count={getRoleTitle(role)}
                style={headerStyles.roleBadge}
              />
            </Space>
          </Space>
        </div>
      </Header>

      <div style={headerStyles.secondaryHeader}>
        <h2 style={headerStyles.secondaryTitle}></h2>
      </div>

      <div style={{ backgroundColor: '#f4f4f4', padding: '20px' }}></div>
    </Layout>
  );
};

export default HeaderComponent;