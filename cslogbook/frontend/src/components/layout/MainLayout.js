import React, { useState } from 'react';
import { Layout, Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import HeaderComponent from './HeaderComponent';
import { Outlet } from 'react-router-dom';
import './MainLayout.css';

const { Content } = Layout;

const MainLayout = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile] = useState(window.innerWidth <= 768);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const onClose = () => {
    setDrawerVisible(false);
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={onClose}
        open={drawerVisible}
        width={280}
      >
        <Sidebar />
      </Drawer>

      <Layout>
        {/* Header */}
        <HeaderComponent isMobile={isMobile} showDrawer={showDrawer} />

        {/* Mobile Menu Button */}
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={showDrawer}
            className="fixed top-4 left-4 z-50"
          />
        )}

        {/* Main Content */}
        <Content 
          className="p-6 bg-gray-50" 
          style={{ 
            marginLeft: isMobile ? 0 : '200px',
            paddingTop: '80px', 
            alignItems: 'center',
            justifyContent: 'center',
            // height: '100vh',
            // overflow: 'hidden',
            // backdropFilter: 'blur(10px)',
            // zIndex: 0,
        }}
        > 
          <div className="bg-white rounded-lg shadow-sm p-6 " style={{ margin:"1rem 4rem",}}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
