import React from 'react';
import { Layout, Button, Typography } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title } = Typography;

const getRoleColor = (role) => {
  switch (role) {
    case 'student':
      return '#e6f7ff'; // สีฟ้าอ่อน
    case 'teacher':
      return '#d9f7be'; // สีเขียวอ่อน
    case 'admin':
      return '#ffd1d1'; // สีแดงอ่อน
    default:
      return '#f5f5f5'; // สีเทาอ่อนเป็นค่าเริ่มต้น
  }
};

const HeaderComponent = ({ isMobile, showDrawer }) => {
  const role = localStorage.getItem('role');
  return (
    <Header
      style={{
        backgroundColor: getRoleColor(role),
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        
      }}
    >
      <Title level={3} style={{ color: '#000', margin: 0 }}>
        CS Logbook ติดตามแผนการเรียนและฝึกงานสำหรับนักศึกษา
      </Title>
      {isMobile && (
        <Button
          type="primary"
          icon={<MenuOutlined />}
          onClick={showDrawer}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
          }}
        />
      )}
    </Header>
  );
};

export default HeaderComponent;
