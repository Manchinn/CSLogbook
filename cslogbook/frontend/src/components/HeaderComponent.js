import React from 'react';
import { Layout, Button, Typography } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title } = Typography;

const HeaderComponent = ({ isMobile, showDrawer }) => {
  return (
    <Header
      style={{
        backgroundColor: '#e6f7ff',
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
