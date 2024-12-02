import React from 'react';
import { Layout, Button, Typography, Space, Avatar, Badge } from 'antd';
import { MenuOutlined, BellOutlined } from '@ant-design/icons';

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

  return (
    <Header
      style={{
        background: theme.gradient,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'auto',
        minHeight: '72px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Space size={24} align="start" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: '20px', color: theme.primary }} />}
            onClick={showDrawer}
            style={{
              ...buttonStyle,
              padding: '8px',
              width: '40px',
              height: '40px',
              '&:hover': {
                backgroundColor: theme.buttonHover,
                transform: 'translateY(-1px)',
              },
            }}
          />
        )}

        <Space direction="vertical" size={4} style={{ maxWidth: isMobile ? '200px' : '600px' }}>
          <Title
            level={4}
            style={{
              margin: 0,
              fontSize: isMobile ? '20px' : '24px',
              color: theme.text,
              lineHeight: 1.4,
              fontWeight: 600,
            }}
          >
            CS Logbook
          </Title>
          <Text
            style={{
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.65)',
              lineHeight: 1.5,
              margin: 0,
              display: 'block',
            }}
          >
            {isMobile ? 'ระบบสมุดบันทึกการฝึกงานและติดตามความคืบหน้าโครงงาน' : 
                       'ระบบสมุดบันทึกการฝึกงานและติดตามความคืบหน้าโครงงานพิเศษ'}
          </Text>
        </Space>
      </Space>

      <Space size={16} align="center">
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: '20px', color: theme.primary }} />}
          style={{
            ...buttonStyle,
            width: '40px',
            height: '40px',
            '&:hover': {
              backgroundColor: theme.buttonHover,
              transform: 'translateY(-1px)',
            },
          }}
        />

        <Space 
          style={{
            ...buttonStyle,
            padding: '4px 12px',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: theme.buttonHover,
              transform: 'translateY(-1px)',
            },
          }}
        >
          <Avatar
            style={{
              backgroundColor: theme.badge,
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            {firstName?.charAt(0)?.toUpperCase()}
          </Avatar>
          
          {!isMobile && (
            <Space direction="vertical" size={0}>
              <Text 
                strong 
                style={{ 
                  fontSize: '14px',
                  color: theme.text,
                }}
              >
                {firstName} {lastName}
              </Text>
              <Badge
                count={getRoleTitle(role)}
                style={{
                  backgroundColor: theme.badge,
                  fontSize: '12px',
                  padding: '0 8px',
                  borderRadius: '6px',
                }}
              />
            </Space>
          )}
        </Space>
      </Space>
    </Header>
  );
};

export default HeaderComponent;